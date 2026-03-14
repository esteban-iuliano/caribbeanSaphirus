/**
 * appsScript.js — v1.1
 * Capa de acceso al backend Google Apps Script.
 *
 * Responsabilidad: normalizar TODAS las respuestas del backend
 * para que los screens siempre reciban { datos: [...] }
 *
 * CORS strategy:
 *  - GET  con ?datos=encodeURIComponent(JSON.stringify(payload))
 *  - POST con Content-Type: text/plain (imágenes)
 */

const BASE_URL =
  'https://script.google.com/macros/s/AKfycbyDpfH_Ly56ja6rtXgFucnvKHVCaYj7A6T6nVrM2-gZQjUZt4Q_CJzjG8nqmKrL45PdNA/exec';

// ─── Helpers internos ────────────────────────────────────────────────────────

async function apiGet(payload) {
  const params = encodeURIComponent(JSON.stringify(payload));
  const res = await fetch(`${BASE_URL}?datos=${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  // Backend envuelve todo en { ok: true, data: { ... } }
  if (json?.ok === false) throw new Error(json.error || 'Error del servidor');
  return json?.data ?? json;
}

async function apiPost(payload) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  if (json?.ok === false) throw new Error(json.error || 'Error del servidor');
  return json?.data ?? json;
}

// ─── Compresión de imágenes ──────────────────────────────────────────────────

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
      resolve(canvas.toDataURL('image/jpeg', quality).split(',')[1]);
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

/**
 * Obtiene todos los clientes activos.
 * Backend devuelve: { clientes: [...] }
 * Frontend espera:  { datos: [...] }
 */
export async function obtenerClientes() {
  const res = await apiGet({ accion: 'obtenerClientes' });
  return { datos: res?.clientes ?? [] };
}

/**
 * Parsea un pedido de texto libre.
 * Backend espera campo "mensaje" (no "texto").
 */
export async function parsearPedido(clienteId, texto) {
  const res = await apiGet({ accion: 'parsearPedido', mensaje: texto, clienteId });
  return { items: res?.items ?? [] };
}

/**
 * Parsea un pedido desde imagen.
 */
export async function parsearImagen(clienteId, imagenBase64) {
  const res = await apiPost({
    accion:      'parsearImagen',
    imageBase64: imagenBase64,
    mimeType:    'image/jpeg',
    clienteId,
  });
  return { items: res?.items ?? [] };
}

/**
 * Guarda un pedido confirmado.
 * Backend espera body.pedido con estructura específica.
 */
export async function guardarPedido(clienteId, items, nota = '') {
  const totalUnidades = items.reduce((s, it) => s + (it.cantidad ?? 0), 0);
  return apiGet({
    accion: 'guardarPedido',
    pedido: {
      cliente_id:       clienteId,
      items,
      total_unidades:   totalUnidades,
      notas_pedido:     nota,
      mensaje_original: '',
    },
  });
}

/**
 * Obtiene el historial de pedidos.
 * Backend devuelve: { pedidos: [...] }
 * Frontend espera:  { datos: [...] }
 */
export async function obtenerPedidos() {
  const res = await apiGet({ accion: 'obtenerPedidos' });
  const pedidos = (res?.pedidos ?? []).map(p => ({
    clienteId:     p.Cliente_ID      ?? '',
    clienteNombre: p.Cliente_Nombre  ?? '',
    fecha:         p.Fecha           ?? '',
    totalItems:    p.Total_Unidades  ?? 0,
    estado:        p.Estado          ?? '',
    items:         p.Items_JSON      ?? [],
  }));
  return { datos: pedidos };
}

/**
 * Obtiene el consolidado de Sheru.
 * Backend devuelve: { items: [...] }
 * Frontend espera:  { datos: [...] }
 */
export async function obtenerConsolidado() {
  const res = await apiGet({ accion: 'obtenerConsolidado' });
  return { datos: res?.items ?? [] };
}
