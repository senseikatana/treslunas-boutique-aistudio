import React, { useState } from 'react';
import { Order, PageView } from '../types';
import { TripleMoonLogo } from '../components/TripleMoonLogo';
import { WebhookAuditLog } from '../components/WebhookAuditLog';
import { CheckCircle2, MapPin, Package, ArrowRight, Download, HardDrive, ExternalLink, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { getGoogleAccessToken, signInWithGoogle, setGoogleAccessToken } from '../lib/firebase';
import { exportReceiptToGoogleDrive } from '../services/driveService';
import { saveOrderToFirestore, logDriveBackupToFirestore } from '../services/firestoreOrders';
import { auth } from '../lib/firebase';

interface OrderSuccessViewProps {
  order: Order | null;
  setCurrentView: (view: PageView) => void;
  isDarkMode: boolean;
}

export const OrderSuccessView: React.FC<OrderSuccessViewProps> = ({
  order,
  setCurrentView,
  isDarkMode
}) => {
  const [isExportingDrive, setIsExportingDrive] = useState(false);
  const [driveExportResult, setDriveExportResult] = useState<{ name: string; url?: string } | null>(null);
  const [driveError, setDriveError] = useState<string | null>(null);

  const handleExportToGoogleDrive = async () => {
    if (!order) return;
    setIsExportingDrive(true);
    setDriveError(null);
    try {
      let token = getGoogleAccessToken();
      if (!token) {
        const signin = await signInWithGoogle();
        token = signin.accessToken;
        if (token) setGoogleAccessToken(token);
      }

      if (!token) {
        throw new Error('Inicia sesión con Google para guardar el recibo en Drive.');
      }

      const receipt = await exportReceiptToGoogleDrive(token, {
        orderId: order.id,
        customerName: order.shipping.fullName,
        customerEmail: order.shipping.email,
        phone: order.shipping.phone,
        address: order.shipping.address,
        city: order.shipping.city,
        postalCode: order.shipping.postalCode,
        items: order.items.map(i => ({
          name: i.product.name,
          size: i.selectedSize,
          color: i.selectedColor.name,
          quantity: i.quantity,
          price: i.product.price
        })),
        subtotal: order.subtotal,
        shipping: order.shippingCost,
        total: order.total,
        paymentMethod: order.paymentMethod,
        date: order.createdAt
      });

      // Also persist reference in Firestore
      await saveOrderToFirestore(order, receipt.id);
      if (auth.currentUser) {
        await logDriveBackupToFirestore({
          fileId: receipt.id,
          fileName: receipt.name,
          mimeType: receipt.mimeType,
          userId: auth.currentUser.uid,
          fileType: 'order_receipt',
          webViewLink: receipt.webViewLink,
          createdAt: new Date().toISOString()
        });
      }

      setDriveExportResult({
        name: receipt.name,
        url: receipt.webViewLink
      });
    } catch (err: any) {
      console.error('Google Drive receipt export error:', err);
      setDriveError(err.message || 'No se pudo exportar a Google Drive.');
    } finally {
      setIsExportingDrive(false);
    }
  };

  if (!order) {
    return (
      <div className="py-20 text-center space-y-4">
        <p>No se encontró el pedido.</p>
        <button onClick={() => setCurrentView('home')} className="px-4 py-2 bg-[#92003a] text-white rounded text-xs font-bold">
          Volver al Inicio
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 text-center">
      
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="space-y-4"
      >
        <div className="w-16 h-16 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <TripleMoonLogo variant={isDarkMode ? 'copper' : 'dark'} textSize="lg" />

        <h1 className="font-heading font-black text-2xl sm:text-3xl md:text-4xl uppercase tracking-tight">
          ¡Gracias por tu compra en 3 Lunas!
        </h1>
        <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
          Hemos recibido tu pedido <span className="font-bold text-[#c37b58]">#{order.id}</span>. Erika preparará tus prendas con el máximo cuidado y recibirás un correo en <span className="font-semibold text-zinc-800 dark:text-zinc-200">{order.shipping.email}</span>.
        </p>
      </motion.div>

      {/* Webhook Audit Log & Status Monitor */}
      <WebhookAuditLog orderId={order.id} isDarkMode={isDarkMode} />

      {/* Order Summary Box */}
      <div className={`p-6 rounded-2xl border text-left space-y-4 ${
        isDarkMode ? 'bg-[#141416] border-zinc-800' : 'bg-white border-zinc-200'
      }`}>
        <div className="flex justify-between items-center pb-3 border-b border-zinc-800/20">
          <span className="text-xs font-bold uppercase tracking-widest text-[#c37b58]">Detalles del Pedido</span>
          <span className="text-xs text-zinc-400">{order.createdAt}</span>
        </div>

        <div className="space-y-3">
          {order.items.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <img src={item.product.images[0]} alt={item.product.name} className="w-10 h-12 object-cover rounded" />
                <div>
                  <h4 className="font-serif font-bold">{item.product.name}</h4>
                  <span className="text-zinc-500">Talla: {item.selectedSize} | Qty: {item.quantity}</span>
                </div>
              </div>
              <span className="font-bold text-[#92003a] dark:text-[#EAB393]">€{(item.product.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-zinc-800/20 space-y-1 text-xs">
          <div className="flex justify-between text-zinc-400">
            <span>Subtotal</span>
            <span>€{order.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Envío Express Local</span>
            <span>{order.shippingCost === 0 ? 'GRATIS' : `€${order.shippingCost.toFixed(2)}`}</span>
          </div>
          <div className="flex justify-between font-bold text-sm pt-2 text-[#92003a] dark:text-[#EAB393]">
            <span>Total Pagado</span>
            <span>€{order.total.toFixed(2)}</span>
          </div>
        </div>

        <div className="p-3 rounded bg-[#FFE185]/20 border border-[#FFE185]/40 text-xs flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
          <MapPin className="w-4 h-4 text-[#FFE185] shrink-0" />
          <span>Entrega programada para Cambrils / Tarragona: <strong>24 Horas</strong></span>
        </div>

        {/* Google Drive Status Alert inside Order box */}
        {driveExportResult && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>Recibo guardado en Google Drive: <strong>{driveExportResult.name}</strong></span>
            </div>
            {driveExportResult.url && (
              <a
                href={driveExportResult.url}
                target="_blank"
                rel="noreferrer"
                className="font-bold underline flex items-center gap-1 shrink-0"
              >
                <span>Ver en Drive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        )}

        {driveError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-700 dark:text-rose-300">
            {driveError}
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-center gap-4 pt-4">
        <button
          onClick={handleExportToGoogleDrive}
          disabled={isExportingDrive}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-[#c37b58] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:opacity-95 transition-opacity shadow-xs"
        >
          {isExportingDrive ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Guardando en Drive...</span>
            </>
          ) : (
            <>
              <HardDrive className="w-4 h-4" />
              <span>Guardar en Google Drive</span>
            </>
          )}
        </button>

        <button
          onClick={() => window.print()}
          className="px-6 py-3 rounded-xl border border-zinc-700 text-xs font-bold uppercase tracking-wider flex items-center gap-2 hover:bg-zinc-800 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Descargar Recibo</span>
        </button>

        <button
          onClick={() => setCurrentView('collection')}
          className="px-6 py-3 rounded-xl bg-[#92003a] text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 hover:bg-[#b21b50] transition-colors"
        >
          <span>Seguir Comprando</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};

