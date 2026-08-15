export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
  webContentLink?: string;
  createdTime?: string;
  size?: string;
  iconLink?: string;
}

export interface OrderReceiptData {
  orderId: string;
  customerName: string;
  customerEmail: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  items: Array<{
    name: string;
    size?: string;
    color?: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
  paymentMethod: string;
  date: string;
}

/**
 * Searches for or creates a dedicated root folder in user's Google Drive: "3 Lunas Boutique - Cambrils"
 */
export async function getOrCreateBoutiqueFolder(accessToken: string): Promise<string> {
  const folderName = '3 Lunas Boutique - Cambrils';
  
  // Search for folder
  const query = encodeURIComponent(`mimeType = 'application/vnd.google-apps.folder' and name = '${folderName}' and trashed = false`);
  const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&spaces=drive`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (searchRes.ok) {
    const data = await searchRes.json();
    if (data.files && data.files.length > 0) {
      return data.files[0].id;
    }
  }

  // Create folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      description: 'Documentos, recibos y catálogos de 3 Lunas Boutique Cambrils'
    })
  });

  if (!createRes.ok) {
    const errorText = await createRes.text();
    console.error('Failed to create Drive folder:', errorText);
    throw new Error('No se pudo crear la carpeta en Google Drive');
  }

  const newFolder = await createRes.json();
  return newFolder.id;
}

/**
 * Lists files in Google Drive (optionally scoped to boutique folder or general drive)
 */
export async function listDriveFiles(accessToken: string, folderId?: string): Promise<DriveFileItem[]> {
  let q = 'trashed = false';
  if (folderId) {
    q += ` and '${folderId}' in parents`;
  }

  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,webViewLink,webContentLink,createdTime,size,iconLink)&orderBy=createdTime desc&pageSize=50`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Drive list error:', errText);
    throw new Error(`Error al leer archivos de Google Drive (${res.status})`);
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Uploads a text/markdown file to Google Drive using multipart upload
 */
export async function uploadFileToDrive(
  accessToken: string,
  fileName: string,
  content: string,
  mimeType: string = 'text/markdown',
  parentFolderId?: string
): Promise<DriveFileItem> {
  const metadata: Record<string, any> = {
    name: fileName,
    mimeType: mimeType
  };

  if (parentFolderId) {
    metadata.parents = [parentFolderId];
  }

  const boundary = '-------3LunasBoutiqueDriveBoundary' + Date.now();
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const multipartRequestBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${mimeType}; charset=UTF-8\r\n\r\n` +
    content +
    closeDelimiter;

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,webViewLink,webContentLink,createdTime', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`
    },
    body: multipartRequestBody
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('Drive upload error:', errText);
    throw new Error(`Error al subir archivo a Google Drive: ${errText}`);
  }

  return await res.json();
}

/**
 * Generates and uploads a purchase receipt to Google Drive
 */
export async function exportReceiptToGoogleDrive(
  accessToken: string,
  orderData: OrderReceiptData
): Promise<DriveFileItem> {
  const folderId = await getOrCreateBoutiqueFolder(accessToken);

  const formattedLines = [
    `# 🌙 3 LUNAS BOUTIQUE — RECIBO DE COMPRA OFICIAL`,
    `**Carrer de Pau Casals, 24, 43850 Cambrils, Tarragona**`,
    `Teléfono: +34 977 79 22 10 | Email: contacto@3lunasboutique.es`,
    `--------------------------------------------------------------------------------`,
    `**Número de Pedido:** ${orderData.orderId}`,
    `**Fecha de Emisión:** ${new Date(orderData.date).toLocaleString('es-ES')}`,
    `**Estado:** Confirmado y Pagado`,
    `**Método de Pago:** ${orderData.paymentMethod}`,
    ``,
    `### Datos del Cliente`,
    `- **Nombre:** ${orderData.customerName || 'Cliente Estimado'}`,
    `- **Email:** ${orderData.customerEmail}`,
    orderData.phone ? `- **Teléfono:** ${orderData.phone}` : null,
    orderData.address ? `- **Dirección:** ${orderData.address}, ${orderData.postalCode || ''} ${orderData.city || ''}` : null,
    ``,
    `### Artículos Adquiridos`,
    `| Artículo | Talla | Color | Cantidad | Precio Unitario | Total |`,
    `| :--- | :--- | :--- | :---: | :---: | :---: |`
  ].filter(Boolean) as string[];

  orderData.items.forEach(item => {
    formattedLines.push(
      `| ${item.name} | ${item.size || 'Única'} | ${item.color || 'Estándar'} | ${item.quantity} | €${item.price.toFixed(2)} | €${(item.price * item.quantity).toFixed(2)} |`
    );
  });

  formattedLines.push(
    ``,
    `### Resumen Financiero`,
    `- **Subtotal:** €${orderData.subtotal.toFixed(2)}`,
    `- **Gastos de Envío / Entrega:** €${orderData.shipping.toFixed(2)}`,
    `- **TOTAL PAGADO:** **€${orderData.total.toFixed(2)}** (IVA Incluido)`,
    ``,
    `--------------------------------------------------------------------------------`,
    `*Gracias por apoyar la moda sostenible y la artesanía local de Cambrils.*`,
    `*Para cualquier cambio o devolución, presenta este recibo dentro de los 30 días posteriores a la compra.*`
  );

  const receiptContent = formattedLines.join('\n');
  const fileName = `Recibo_3Lunas_${orderData.orderId}.md`;

  return await uploadFileToDrive(accessToken, fileName, receiptContent, 'text/markdown', folderId);
}

/**
 * Exports boutique catalog summary or wishlist to Google Drive
 */
export async function exportCatalogLookbookToDrive(
  accessToken: string,
  catalogItems: Array<{ id: string; name: string; category: string; price: number; description: string }>
): Promise<DriveFileItem> {
  const folderId = await getOrCreateBoutiqueFolder(accessToken);

  const content = [
    `# ✨ 3 LUNAS BOUTIQUE — CATÁLOGO & LOOKBOOK CAMBRILS`,
    `Colección Exclusiva de Lino, Algodón Orgánico y Joyería Artesanal`,
    `Fecha de Exportación: ${new Date().toLocaleDateString('es-ES')}`,
    `================================================================`,
    ``,
    ...catalogItems.map((item, idx) => (
      `### ${idx + 1}. ${item.name} — €${item.price.toFixed(2)}\n` +
      `- **Categoría:** ${item.category}\n` +
      `- **Detalle:** ${item.description}\n`
    )),
    ``,
    `----------------------------------------------------------------`,
    `Visítanos en nuestra tienda física en Cambrils o en nuestra plataforma online.`
  ].join('\n');

  const fileName = `Catalogo_3Lunas_${new Date().toISOString().slice(0, 10)}.md`;
  return await uploadFileToDrive(accessToken, fileName, content, 'text/markdown', folderId);
}

/**
 * Deletes a file from Google Drive (Requires user confirmation prior to call)
 */
export async function deleteDriveFile(accessToken: string, fileId: string): Promise<void> {
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` }
  });

  if (!res.ok && res.status !== 404) {
    const err = await res.text();
    console.error('Delete Drive file error:', err);
    throw new Error('Error al eliminar el archivo de Google Drive');
  }
}
