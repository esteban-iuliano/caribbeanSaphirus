/**
 * appsScript.js — v1.7
 * Capa de acceso al backend Google Apps Script.
 * Normaliza TODAS las respuestas → { datos: [...] } para los screens.
 *
 * v1.3: agrega obtenerCatalogo, origen en guardarPedido
 * v1.4: agrega pedidoId en obtenerPedidos + Sprint C' (obtenerPedidoDetalle, editarPedido, eliminarPedidoAdmin)
 * v1.5: obtenerConsolidado acepta desde/hasta para filtro de fechas (Sprint D)
 *        mapeo campo Notas en obtenerPedidos
 * v1.6: FIX CRÍTICO — guardarPedido migrado de apiGet → apiPost
 *        + agrega obtenerFinanzas para Sprint E
 * v1.7: Sprint Admin — agrega gestión de vendedores y clientes (CRUD completo)
 *        obtenerVendedores, crearVendedor, editarVendedor, eliminarVendedor
 *        crearCliente, editarCliente, eliminarCliente
 *        SIN romper ninguna función existente
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

// ─── Endpoints públicos — existentes ─────────────────────────────────────────

export async function ping() {
  return apiGet({ accion: 'ping' });
}

export async function obtenerClientes(canal) {
  const payload = { accion: 'obtenerClientes' };
  if (canal) payload.canal = canal;
  const res = await apiGet(payload);
  return { datos: res?.clientes ?? [] };
}

export async function obtenerCatalogo(canal = 'CHINOS') {
  const res = await apiGet({ accion: 'obtenerCatalogo', canal });
  return {
    clientes:   res?.clientes   ?? [],
    productos:  res?.productos  ?? [],
    fragancias: res?.fragancias ?? {},
  };
}

export async function parsearPedido(clienteId, texto) {
  const res = await apiGet({ accion: 'parsearPedido', mensaje: texto, clienteId });
  return { items: res?.items ?? [] };
}

export async function parsearImagen(clienteId, imagenBase64) {
  const res = await apiPost({
    accion:      'parsearImagen',
    imageBase64: imagenBase64,
    mimeType:    'image/jpeg',
    clienteId,
  });
  return { items: res?.items ?? [] };
}

export async function guardarPedido(clienteId, items, nota = '', origen = 'PWA') {
  const totalUnidades = items.reduce((s, it) => s + (it.cantidad ?? 0), 0);
  return apiPost({
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

export async function obtenerPedidos() {
  const res = await apiGet({ accion: 'obtenerPedidos' });
  const pedidos = (res?.pedidos ?? []).map(p => ({
    pedidoId:      p.Timestamp        ?? p.ID_Pedido      ?? p.Pedido_ID      ?? p.id_pedido ?? '',
    clienteId:     p.Cliente_ID       ?? p.cliente_id     ?? '',
    clienteNombre: p.Cliente_Nombre   ?? p.cliente_nombre ?? '',
    canal:         p.Canal            ?? p.canal          ?? '',
    vendedor:      p.Vendedor         ?? p.vendedor        ?? '',
    fecha:         normalizeDate(p.Fecha ?? p.fecha),
    totalItems:    Number(p.Total_Unidades ?? p.total_unidades ?? 0),
    estado:        p.Estado           ?? p.estado         ?? '',
    estadoPago:    p.estado_pago      ?? 'PENDIENTE',
    totalSheru:    Number(p.total_sheru   ?? 0),
    totalCliente:  Number(p.total_cliente ?? 0),
    notas:         p.Notas            ?? p.notas          ?? p.Notas_Pedido  ?? '',
    editadoPor:    p.editado_por      ?? '',
    items:         (() => {
      try {
        const raw = p.Items_JSON ?? p.items ?? [];
        return typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch { return []; }
    })(),
  }));
  return { datos: pedidos };
}

export async function obtenerConsolidado(desde, hasta) {
  const payload = { accion: 'obtenerConsolidado' };
  if (desde) payload.desde = desde;
  if (hasta) payload.hasta = hasta;
  const res = await apiGet(payload);
  return { datos: res?.items ?? [] };
}

export async function obtenerFinanzas(desde, hasta) {
  const res = await apiGet({ accion: 'obtenerFinanzas', desde, hasta });
  return {
    resumen: res?.resumen ?? {
      total_sheru:   0,
      total_cliente: 0,
      margen:        0,
      pendiente:     0,
      pedidos_count: 0,
    },
    por_cliente:  res?.por_cliente  ?? [],
    por_vendedor: res?.por_vendedor ?? [],
  };
}

// ─── Sprint C' — Edición y eliminación de pedidos (ADMIN) ───────────────────

export async function obtenerPedidoDetalle(pedidoId, email) {
  const res = await apiGet({ accion: 'obtenerPedidoDetalle', pedidoId, email });
  return {
    pedido: res?.pedido ?? null,
    items:  res?.items  ?? [],
  };
}

export async function editarPedido(pedidoId, cambios, email) {
  const res = await apiGet({ accion: 'editarPedido', pedidoId, cambios, email });
  return res;
}

export async function eliminarPedidoAdmin(pedidoId, email) {
  const res = await apiGet({ accion: 'eliminarPedidoAdmin', pedidoId, email });
  return res;
}

// ─── Sprint Admin — Gestión de vendedores (ADMIN) ────────────────────────────

export async function obtenerVendedores() {
  const res = await apiGet({ accion: 'obtenerVendedores' });
  return {
    vendedores: (res?.vendedores ?? []).map(v => ({
      id                : v.ID_Vendedor         || v.id_vendedor         || '',
      nombre            : v.Nombre              || v.nombre              || '',
      canal             : v.Canal               || v.canal               || '',
      telefono          : v.Teléfono_WhatsApp   || v.telefono            || '',
      forma_cobro       : v.Forma_Cobro         || v.forma_cobro         || '',
      frecuencia_entrega: v.Frecuencia_Entrega  || v.frecuencia_entrega  || '',
      notas             : v.Notas               || v.notas               || '',
      email             : v.Email               || v.email               || '',
      rol               : (v.Rol    || v.rol    || 'VENDEDOR').toUpperCase(),
      estado            : (v.Estado || v.estado || 'ACTIVO').toUpperCase(),
    })),
  };
}

export async function crearVendedor(datos) {
  return apiGet({ accion: 'crearVendedor', ...datos });
}

export async function editarVendedor(idVendedor, cambios) {
  return apiGet({ accion: 'editarVendedor', id_vendedor: idVendedor, cambios });
}

export async function eliminarVendedor(idVendedor) {
  return apiGet({ accion: 'eliminarVendedor', id_vendedor: idVendedor });
}

// ─── Sprint Admin — Gestión de clientes (ADMIN) ──────────────────────────────

export async function crearCliente(datos) {
  return apiGet({ accion: 'crearCliente', ...datos });
}

export async function editarCliente(idCliente, cambios) {
  return apiGet({ accion: 'editarCliente', id_cliente: idCliente, cambios });
}

export async function eliminarCliente(idCliente) {
  return apiGet({ accion: 'eliminarCliente', id_cliente: idCliente });
}
