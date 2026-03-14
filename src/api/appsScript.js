/**
 * appsScript.js — v1.3
 * Capa de acceso al backend Google Apps Script.
 * Normaliza TODAS las respuestas → { datos: [...] } para los screens.
 * v1.3: agrega obtenerCatalogo, origen en guardarPedido
 */

const BASE_URL =
  'https://script.google.com/macros/s/AKfycbyDpfH_Ly56ja6rtXgFucnvKHVCaYj7A6T6nVrM2-gZQjUZt4Q_CJzjG8nqmKrL45PdNA/exec';

// ─── Helpers internos ────────────────────────────────────────────────────────

async function apiGet(payload) {
  const params = encodeURIComponent(JSON.stringify(payload));
  const res = await fetch(`${BASE_URL}?datos=${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
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

function normalizeDate(val) {
  if (!val) return null;
  const s = val.toString().trim();
  if (!s) return null;
  const iso = s.replace(' ', 'T');
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const y   = d.getFullYear();
  const mo  = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h   = String(d.getHours()).padStart(2, '0');
  const mi  = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${mo}-${day} ${h}:${mi}`;
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

export async function ping() {
  return apiGet({ accion: 'ping' });
}

/**
 * Obtiene todos los clientes activos.
 * Acepta canal opcional para filtrar (ej: 'CHINOS').
 */
export async function obtenerClientes(canal) {
  const payload = { accion: 'obtenerClientes' };
  if (canal) payload.canal = canal;
  const res = await apiGet(payload);
  return { datos: res?.clientes ?? [] };
}

/**
 * Obtiene catálogo completo para el formulario de vendedor:
 * clientes filtrados por canal, productos y fragancias por tipo.
 */
export async function obtenerCatalogo(canal = 'CHINOS') {
  const res = await apiGet({ accion: 'obtenerCatalogo', canal });
  return {
    clientes:   res?.clientes   ?? [],
    productos:  res?.productos  ?? [],
    fragancias: res?.fragancias ?? {},
  };
}

/**
 * Parsea un pedido de texto libre.
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
 * origen: 'PWA' (parser) | 'formulario' (FormularioVendedor)
 */
export async function guardarPedido(clienteId, items, nota = '', origen = 'PWA') {
  const totalUnidades = items.reduce((s, it) => s + (it.cantidad ?? 0), 0);
  return apiGet({
    accion: 'guardarPedido',
    pedido: {
      cliente_id:       clienteId,
      items,
      total_unidades:   totalUnidades,
      notas_pedido:     nota,
      mensaje_original: '',
      origen,
    },
  });
}

/**
 * Obtiene el historial de pedidos.
 */
export async function obtenerPedidos() {
  const res = await apiGet({ accion: 'obtenerPedidos' });
  const pedidos = (res?.pedidos ?? []).map(p => ({
    clienteId:     p.Cliente_ID      ?? p.cliente_id     ?? '',
    clienteNombre: p.Cliente_Nombre  ?? p.cliente_nombre ?? '',
    fecha:         normalizeDate(p.Fecha ?? p.fecha),
    totalItems:    Number(p.Total_Unidades ?? p.total_unidades ?? 0),
    estado:        p.Estado          ?? p.estado         ?? '',
    items:         (() => {
      try {
        const raw = p.Items_JSON ?? p.items ?? [];
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch { return []; }
    })(),
  }));
  return { datos: pedidos };
}

/**
 * Obtiene el consolidado de Sheru.
 */
export async function obtenerConsolidado() {
  const res = await apiGet({ accion: 'obtenerConsolidado' });
  return { datos: res?.items ?? [] };
}
