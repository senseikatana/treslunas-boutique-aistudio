import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  HardDrive, 
  Cloud, 
  FolderPlus, 
  FileText, 
  ExternalLink, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Database,
  ShieldCheck,
  LogOut,
  Sparkles
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  auth, 
  signInWithGoogle, 
  logOutGoogle, 
  getGoogleAccessToken, 
  setGoogleAccessToken,
  initAuthListener 
} from '../lib/firebase';
import { 
  DriveFileItem, 
  listDriveFiles, 
  getOrCreateBoutiqueFolder, 
  exportCatalogLookbookToDrive, 
  deleteDriveFile 
} from '../services/driveService';
import { 
  getUserOrdersFromFirestore, 
  getUserDriveBackupsFromFirestore, 
  logDriveBackupToFirestore,
  deleteDriveBackupRecord,
  FirestoreOrderRecord,
  DriveBackupRecord
} from '../services/firestoreOrders';
import { PRODUCTS } from '../data/products';
import { GoogleSignInButton } from './GoogleSignInButton';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkMode: boolean;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  isDarkMode
}) => {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [token, setToken] = useState<string | null>(getGoogleAccessToken());
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFileItem[]>([]);
  const [boutiqueFolderId, setBoutiqueFolderId] = useState<string | null>(null);
  const [cloudOrders, setCloudOrders] = useState<FirestoreOrderRecord[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [fileToDelete, setFileToDelete] = useState<DriveFileItem | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Sync auth state
  useEffect(() => {
    const unsubscribe = initAuthListener(
      (currentUser, accessToken) => {
        setUser(currentUser);
        if (accessToken) setToken(accessToken);
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch files and cloud data when token is available
  useEffect(() => {
    if (isOpen && token) {
      loadDriveData(token);
    }
  }, [isOpen, token]);

  const loadDriveData = async (accessToken: string) => {
    setIsLoadingFiles(true);
    setStatusMessage(null);
    try {
      // Find or create boutique folder
      const folderId = await getOrCreateBoutiqueFolder(accessToken);
      setBoutiqueFolderId(folderId);

      // List files in boutique folder
      const files = await listDriveFiles(accessToken, folderId);
      setDriveFiles(files);

      // Load persistent Firestore records
      if (user) {
        try {
          const orders = await getUserOrdersFromFirestore(user.uid);
          setCloudOrders(orders);
        } catch (e) {
          console.warn('Could not load Firestore orders:', e);
        }
      }
    } catch (err: any) {
      console.error('Error loading Drive data:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'No se pudieron cargar los archivos de Google Drive.'
      });
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setStatusMessage(null);
    try {
      const res = await signInWithGoogle();
      setUser(res.user);
      if (res.accessToken) {
        setToken(res.accessToken);
        setGoogleAccessToken(res.accessToken);
        await loadDriveData(res.accessToken);
      }
      setStatusMessage({
        type: 'success',
        text: 'Conexión con Google Drive y Firebase establecida con éxito.'
      });
    } catch (err: any) {
      console.error('Sign-in failure:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Error al iniciar sesión con Google.'
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSignOut = async () => {
    await logOutGoogle();
    setUser(null);
    setToken(null);
    setDriveFiles([]);
    setCloudOrders([]);
    setStatusMessage(null);
  };

  const handleExportCatalog = async () => {
    if (!token) return;
    setIsExporting(true);
    setStatusMessage(null);
    try {
      const result = await exportCatalogLookbookToDrive(
        token,
        PRODUCTS.map(p => ({
          id: p.id,
          name: p.name,
          category: p.category,
          price: p.price,
          description: p.description
        }))
      );

      if (user) {
        await logDriveBackupToFirestore({
          fileId: result.id,
          fileName: result.name,
          mimeType: result.mimeType,
          userId: user.uid,
          fileType: 'catalog_lookbook',
          webViewLink: result.webViewLink,
          createdAt: new Date().toISOString()
        });
      }

      setStatusMessage({
        type: 'success',
        text: `Catálogo exportado a Google Drive: "${result.name}"`
      });

      await loadDriveData(token);
    } catch (err: any) {
      console.error('Catalog export error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'No se pudo exportar el catálogo a Google Drive.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const confirmDeleteFile = async () => {
    if (!fileToDelete || !token) return;
    const targetFile = fileToDelete;
    setFileToDelete(null);
    setStatusMessage(null);

    try {
      await deleteDriveFile(token, targetFile.id);
      await deleteDriveBackupRecord(targetFile.id).catch(() => {});
      setDriveFiles(prev => prev.filter(f => f.id !== targetFile.id));
      setStatusMessage({
        type: 'success',
        text: `Archivo "${targetFile.name}" eliminado de Google Drive.`
      });
    } catch (err: any) {
      console.error('Delete error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Error al eliminar el archivo de Google Drive.'
      });
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className={`relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl border overflow-hidden z-10 ${
            isDarkMode ? 'bg-zinc-950 border-zinc-800 text-zinc-100' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#92003a] to-[#c37b58] text-white flex items-center justify-center shadow-xs">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-serif font-bold text-lg leading-tight flex items-center gap-2">
                  Google Drive & Cloud Sync
                  <span className="text-[10px] uppercase font-mono-label font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Firebase + Drive
                  </span>
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Sincronización segura de recibos, lookbooks y pedidos en tu cuenta
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* Status alerts */}
            {statusMessage && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3.5 rounded-xl border text-xs flex items-center gap-3 ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                }`}
              >
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                )}
                <span>{statusMessage.text}</span>
              </motion.div>
            )}

            {/* If NOT signed in */}
            {!user || !token ? (
              <div className="text-center py-8 px-4 space-y-5 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Cloud className="w-7 h-7" />
                </div>

                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="font-serif font-bold text-lg">Conecta tu cuenta de Google</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Al conectar Google Drive con 3 Lunas Boutique podrás exportar recibos de compra oficiales, respaldar catálogos y sincronizar tus pedidos en la nube de Firebase.
                  </p>
                </div>

                <div className="pt-2 flex justify-center">
                  <GoogleSignInButton
                    onClick={handleSignIn}
                    isLoading={isAuthenticating}
                    isDarkMode={isDarkMode}
                    text="Conectar con Google Drive"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 text-left border-t border-zinc-200 dark:border-zinc-800">
                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-[10px] font-bold text-[#92003a] dark:text-[#c37b58] uppercase font-mono-label block">Recibos</span>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">Guarda recibos de compra directamente en tu Google Drive.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-[10px] font-bold text-[#92003a] dark:text-[#c37b58] uppercase font-mono-label block">Lookbooks</span>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">Exporta el catálogo de lino y joyería artesanal.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                    <span className="text-[10px] font-bold text-[#92003a] dark:text-[#c37b58] uppercase font-mono-label block">Cloud Firebase</span>
                    <p className="text-[11px] text-zinc-600 dark:text-zinc-400 mt-0.5">Historial y pedidos protegidos bajo reglas ABAC.</p>
                  </div>
                </div>
              </div>
            ) : (
              /* If SIGNED IN */
              <div className="space-y-6">
                {/* User Account Card */}
                <div className="p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'Usuario'}
                        className="w-12 h-12 rounded-full border border-zinc-300 dark:border-zinc-700 object-cover shadow-xs"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#92003a] text-white font-bold flex items-center justify-center">
                        {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div>
                      <h3 className="font-serif font-bold text-sm">{user.displayName || 'Cliente Boutique'}</h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Google Drive Activo</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => token && loadDriveData(token)}
                      disabled={isLoadingFiles}
                      className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5"
                      title="Actualizar archivos"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFiles ? 'animate-spin' : ''}`} />
                      <span>Actualizar</span>
                    </button>

                    <button
                      onClick={handleSignOut}
                      className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center gap-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Desconectar</span>
                    </button>
                  </div>
                </div>

                {/* Drive Quick Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleExportCatalog}
                    disabled={isExporting}
                    className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 hover:border-[#c37b58] text-left transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <FileText className="w-5 h-5 text-[#92003a] dark:text-[#c37b58]" />
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h4 className="font-semibold text-xs mt-2 text-zinc-900 dark:text-zinc-100">
                      {isExporting ? 'Exportando catálogo...' : 'Exportar Catálogo & Lookbook'}
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Crea un archivo Markdown en tu carpeta de Google Drive con toda la colección.
                    </p>
                  </button>

                  <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-left">
                    <div className="flex items-center justify-between">
                      <Database className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    </div>
                    <h4 className="font-semibold text-xs mt-2 text-zinc-900 dark:text-zinc-100">
                      Base de Datos Firestore
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {cloudOrders.length} pedido(s) sincronizados en la nube europea (europe-west2).
                    </p>
                  </div>
                </div>

                {/* Drive Files List in 3 Lunas Folder */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FolderPlus className="w-4 h-4 text-[#c37b58]" />
                      <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                        Archivos en Google Drive (Carpeta 3 Lunas)
                      </h4>
                    </div>
                    <span className="text-[11px] text-zinc-400">
                      {driveFiles.length} archivo(s)
                    </span>
                  </div>

                  {isLoadingFiles ? (
                    <div className="py-8 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#c37b58]" />
                      <span>Consultando Google Drive...</span>
                    </div>
                  ) : driveFiles.length === 0 ? (
                    <div className="py-8 text-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400">
                      <p>Aún no hay archivos exportados en tu carpeta de Google Drive.</p>
                      <p className="text-[11px] text-zinc-500 mt-1">Haz clic en &quot;Exportar Catálogo&quot; o realiza una compra para generar un recibo.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
                      {driveFiles.map((file) => (
                        <div
                          key={file.id}
                          className="p-3 sm:px-4 flex items-center justify-between gap-3 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="w-4 h-4 text-[#c37b58] shrink-0" />
                            <div className="min-w-0">
                              <p className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                                {file.name}
                              </p>
                              <p className="text-[10px] text-zinc-400">
                                {file.createdTime ? new Date(file.createdTime).toLocaleString('es-ES') : 'Guardado'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1 text-[11px]"
                                title="Abrir en Google Drive"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Abrir en Drive</span>
                              </a>
                            )}

                            <button
                              onClick={() => setFileToDelete(file)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                              title="Eliminar archivo de Google Drive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-right flex items-center justify-between text-xs text-zinc-500">
            <span className="text-[11px]">Seguridad ABAC y OAuth Google Workspace</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-zinc-800 text-zinc-100 hover:bg-zinc-700 text-xs font-semibold transition-colors"
            >
              Cerrar
            </button>
          </div>
        </motion.div>

        {/* Destructive Action User Confirmation Dialog */}
        <AnimatePresence>
          {fileToDelete && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`w-full max-w-md p-6 rounded-2xl border shadow-2xl space-y-4 ${
                  isDarkMode ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-white border-zinc-300 text-zinc-900'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Trash2 className="w-6 h-6" />
                </div>

                <div className="space-y-1">
                  <h3 className="font-serif font-bold text-base">¿Eliminar archivo de Google Drive?</h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    Estás a punto de eliminar permanentemente <strong className="text-zinc-800 dark:text-zinc-200">{fileToDelete.name}</strong> de tu Google Drive. Esta acción no se puede deshacer.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setFileToDelete(null)}
                    className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmDeleteFile}
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-xs"
                  >
                    Eliminar de Drive
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
};
