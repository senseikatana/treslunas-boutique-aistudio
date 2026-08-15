import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  deleteDoc
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Order } from '../types';

export interface FirestoreOrderRecord {
  orderId: string;
  userId: string;
  customerEmail: string;
  customerName: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  driveReceiptFileId?: string;
  createdAt: string;
  itemsSummary?: string;
}

export async function saveOrderToFirestore(order: Order, driveReceiptFileId?: string): Promise<void> {
  const user = auth.currentUser;
  const userId = user ? user.uid : 'guest_' + order.id;

  const orderRecord: FirestoreOrderRecord = {
    orderId: order.id,
    userId: userId,
    customerEmail: order.shipping?.email || 'unknown@example.com',
    customerName: order.shipping?.fullName || 'Cliente',
    phone: order.shipping?.phone || '',
    address: order.shipping?.address || '',
    city: order.shipping?.city || '',
    postalCode: order.shipping?.postalCode || '',
    totalAmount: order.total,
    status: order.status || 'Confirmado',
    paymentMethod: order.paymentMethod || 'card',
    createdAt: new Date().toISOString(),
    itemsSummary: order.items.map(i => `${i.product.name} (x${i.quantity})`).join(', ')
  };

  if (driveReceiptFileId) {
    orderRecord.driveReceiptFileId = driveReceiptFileId;
  }

  const path = `orders/${order.id}`;
  try {
    const orderDocRef = doc(db, 'orders', order.id);
    await setDoc(orderDocRef, orderRecord, { merge: true });
  } catch (error) {
    console.warn('Firestore order persistence fallback:', error);
    // Don't throw for guest users so local checkout flow remains uninterrupted
    if (user) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
}

export async function getUserOrdersFromFirestore(userId: string): Promise<FirestoreOrderRecord[]> {
  const path = 'orders';
  try {
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as FirestoreOrderRecord);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export interface DriveBackupRecord {
  fileId: string;
  fileName: string;
  mimeType?: string;
  userId: string;
  fileType?: string;
  webViewLink?: string;
  createdAt: string;
}

export async function logDriveBackupToFirestore(backup: DriveBackupRecord): Promise<void> {
  const path = `drive_backups/${backup.fileId}`;
  try {
    await setDoc(doc(db, 'drive_backups', backup.fileId), backup);
  } catch (error) {
    console.warn('Could not log drive backup in Firestore:', error);
  }
}

export async function getUserDriveBackupsFromFirestore(userId: string): Promise<DriveBackupRecord[]> {
  const path = 'drive_backups';
  try {
    const q = query(
      collection(db, 'drive_backups'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data() as DriveBackupRecord);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
}

export async function deleteDriveBackupRecord(fileId: string): Promise<void> {
  const path = `drive_backups/${fileId}`;
  try {
    await deleteDoc(doc(db, 'drive_backups', fileId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
