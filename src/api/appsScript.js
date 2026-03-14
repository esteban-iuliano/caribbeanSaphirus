/**
 * appsScript.js
 * Capa de acceso al backend Google Apps Script.
 *
 * CORS strategy:
 *  - GET  con ?datos=encodeURIComponent(JSON.stringify(payload)) para evitar preflight.
 *  - POST con Content-Type: text/plain para imágenes (evita preflight).
 */

const BASE_URL =
  'https://script.google.com/macros/s/AKfycbyDpfH_Ly56ja6rtXgFucnvKHVCaYj7A6T6nVrM2-gZQjUZt4Q_CJzjG8nqmKrL45PdNA/exec';

// ─── Helpers internos ────────────────────────────────────────────────────────

async function apiGet(payload) {
  const params = encodeURIComponent(JSON.stringify(payload));
  const res = await fetch(`${BASE_URL}?datos=${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function apiPost(payload) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ─── Compresión de imágenes ──────────────────────────────────────────────────

/**
 * Comprime un File de imagen a base64 JPEG.
 * @param {File} file
 * @param {number} maxWidth  px máximos de ancho (default 1024)
 * @param {number} quality   0-1 JPEG quality (default 0.7)
 * @returns {Promise<string>} base64 sin prefijo data:
 */
export function compressImage(file, maxWidth = 1024, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(dataUrl.split(',')[1]); // solo base64
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo cargar la imagen'));
    };

    img.src = objectUrl;
  });
}

// ─── Endpoints públicos ──────────────────────────────────────────────────────

/** Verifica que el backend esté activo. */
export async function ping() {
  return apiGet({ accion: 'ping' });
}

/** Obtiene todos los clientes (CLI-001 … CLI-029). */
export async function obtenerClientes() {
  return apiGet({ accion: 'obtenerClientes' });
}

/**
 * Parsea un pedido de texto libre.
 * @param {string} clienteId  ej. "CLI-017"
 * @param {string} texto      texto libre del WhatsApp
 */
export async function parsearPedido(clienteId, texto) {
  return apiGet({ accion: 'parsearPedido', clienteId, texto });
}

/**
 * Parsea un pedido desde imagen.
 * @param {string} clienteId
 * @param {string} imagenBase64  imagen comprimida en base64
 */
export async function parsearImagen(clienteId, imagenBase64) {
  return apiPost({ accion: 'parsearImagen', clienteId, imagen: imagenBase64 });
}

/**
 * Guarda un pedido confirmado en CS_Pedidos / CS_Items.
 * @param {string} clienteId
 * @param {Array}  items     array de {fragancia, cantidad, producto, flag, ...}
 * @param {string} [nota]    nota opcional del pedido
 */
export async function guardarPedido(clienteId, items, nota = '') {
  return apiGet({ accion: 'guardarPedido', clienteId, items: JSON.stringify(items), nota });
}

/** Obtiene el historial de pedidos. */
export async function obtenerPedidos() {
  return apiGet({ accion: 'obtenerPedidos' });
}

/**
 * Obtiene el consolidado de Sheru (todos los items pendientes agrupados).
 */
export async function obtenerConsolidado() {
  return apiGet({ accion: 'obtenerConsolidado' });
}
