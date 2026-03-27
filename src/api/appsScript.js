// ============================================================
// CaribbeanSaphirus — src/api/appsScript.js
// Versión: 1.6
// Cambios v1.6:
//   - obtenerVendedores()
//   - crearVendedor(datos)
//   - editarVendedor(id, cambios)
//   - eliminarVendedor(id)
//   - crearCliente(datos)
//   - editarCliente(id, cambios)
//   - eliminarCliente(id)
// ============================================================

const BACKEND_URL = 'https://script.google.com/macros/s/AKfycbyDpfH_Ly56ja6rtXgFucnvKHVCaYj7A6T6nVrM2-gZQjUZt4Q_CJzjG8nqmKrL45PdNA/exec';

// ------------------------------------------------------------
// HELPER BASE — única función que habla con el backend
// Toda llamada usa GET con ?datos=... (restricción CORS de Apps Script)
// ------------------------------------------------------------
async function _llamarBackend(payload) {
  const url = `${BACKEND_URL}?datos=${encodeURIComponent(JSON.stringify(payload))}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const json = await resp.json();
  if (!json.ok) throw new Error(json.error || 'Error del backend');
  return json.data;
}

// ------------------------------------------------------------
// PING
// ------------------------------------------------------------
export async function ping() {
  return _llamarBackend({ accion: 'ping' });
}

// ------------------------------------------------------------
// VERIFICAR USUARIO
// ------------------------------------------------------------
export async function verificarUsuario(email) {
  return _llamarBackend({ accion: 'verificarUsuario', email });
}

// ------------------------------------------------------------
// PARSEAR PEDIDO
// ------------------------------------------------------------
export async function parsearPedido(mensaje) {
  return _llamarBackend({ accion: 'parsearPedido', mensaje });
}

// ------------------------------------------------------------
// GUARDAR PEDIDO
// ------------------------------------------------------------
export async function guardarPedido(pedido) {
  return _llamarBackend({ accion: 'guardarPedido', ...pedido });
}

// ------------------------------------------------------------
// OBTENER PEDIDOS
// Retorna: { pedidos: [...] }
// Normaliza campos para que el frontend siempre acceda igual
// ------------------------------------------------------------
export async function obtenerPedidos(filtros = {}) {
  const data = await _llamarBackend({ accion: 'obtenerPedidos', ...filtros });
  return {
    pedidos: (data.pedidos || []).map(_normalizarPedido)
  };
}

// ------------------------------------------------------------
// OBTENER CONSOLIDADO
// ------------------------------------------------------------
export async function obtenerConsolidado(desde = null, hasta = null) {
  return _llamarBackend({ accion: 'obtenerConsolidado', desde, hasta });
}

// ------------------------------------------------------------
// OBTENER FINANZAS
// ------------------------------------------------------------
export async function obtenerFinanzas() {
  return _llamarBackend({ accion: 'obtenerFinanzas' });
}

// ------------------------------------------------------------
// EDITAR PEDIDO
// ------------------------------------------------------------
export async function editarPedido(pedidoId, cambios, emailEditor = '') {
  return _llamarBackend({
    accion      : 'editarPedido',
    pedido_id   : pedidoId,
    cambios,
    email_editor: emailEditor
  });
}

// ------------------------------------------------------------
// ELIMINAR PEDIDO (ADMIN)
// ------------------------------------------------------------
export async function eliminarPedidoAdmin(pedidoId) {
  return _llamarBackend({ accion: 'eliminarPedidoAdmin', pedido_id: pedidoId });
}

// ------------------------------------------------------------
// OBTENER CLIENTES — solo ACTIVOS, con filtro opcional de canal
// Retorna: { clientes: [...] }
// ------------------------------------------------------------
export async function obtenerClientes(canal = null) {
  const payload = { accion: 'obtenerClientes' };
  if (canal) payload.canal = canal;
  const data = await _llamarBackend(payload);
  return {
    clientes: (data.clientes || []).map(_normalizarCliente)
  };
}

// ============================================================
// ===  ADMINISTRACIÓN DE VENDEDORES  =========================
// ============================================================

// ------------------------------------------------------------
// OBTENER VENDEDORES — lista completa para pantalla admin
// Retorna: { vendedores: [...] }
// ------------------------------------------------------------
export async function obtenerVendedores() {
  const data = await _llamarBackend({ accion: 'obtenerVendedores' });
  return {
    vendedores: (data.vendedores || []).map(_normalizarVendedor)
  };
}

// ------------------------------------------------------------
// CREAR VENDEDOR
// datos: { nombre, canal, telefono, forma_cobro, frecuencia_entrega, notas, email, rol }
// Retorna: { id_vendedor, mensaje }
// ------------------------------------------------------------
export async function crearVendedor(datos) {
  return _llamarBackend({ accion: 'crearVendedor', ...datos });
}

// ------------------------------------------------------------
// EDITAR VENDEDOR
// cambios: cualquier subconjunto de campos del vendedor
// Retorna: { mensaje }
// ------------------------------------------------------------
export async function editarVendedor(idVendedor, cambios) {
  return _llamarBackend({
    accion      : 'editarVendedor',
    id_vendedor : idVendedor,
    cambios
  });
}

// ------------------------------------------------------------
// ELIMINAR VENDEDOR — borra vendedor + clientes en cascada
// El frontend ya mostró el modal de advertencia antes de llamar esto
// Retorna: { mensaje }
// ------------------------------------------------------------
export async function eliminarVendedor(idVendedor) {
  return _llamarBackend({
    accion      : 'eliminarVendedor',
    id_vendedor : idVendedor
  });
}

// ============================================================
// ===  ADMINISTRACIÓN DE CLIENTES  ===========================
// ============================================================

// ------------------------------------------------------------
// CREAR CLIENTE
// datos: { nombre, canal, vendedor, direccion, telefono, segmento_precio, notas, frecuencia_pedido }
// Retorna: { id_cliente, mensaje }
// ------------------------------------------------------------
export async function crearCliente(datos) {
  return _llamarBackend({ accion: 'crearCliente', ...datos });
}

// ------------------------------------------------------------
// EDITAR CLIENTE
// cambios: cualquier subconjunto de campos del cliente
// Retorna: { mensaje }
// ------------------------------------------------------------
export async function editarCliente(idCliente, cambios) {
  return _llamarBackend({
    accion    : 'editarCliente',
    id_cliente: idCliente,
    cambios
  });
}

// ------------------------------------------------------------
// ELIMINAR CLIENTE — solo el cliente, pedidos históricos intactos
// Retorna: { mensaje }
// ------------------------------------------------------------
export async function eliminarCliente(idCliente) {
  return _llamarBackend({
    accion    : 'eliminarCliente',
    id_cliente: idCliente
  });
}

// ============================================================
// ===  NORMALIZADORES — traducción backend → frontend  =======
// ============================================================

// Pedido: garantiza que el frontend siempre use las mismas keys
function _normalizarPedido(p) {
  return {
    id             : p.Timestamp        || p.timestamp        || '',
    fecha          : p.Fecha            || p.fecha            || '',
    cliente_id     : p.Cliente_ID       || p.cliente_id       || '',
    cliente_nombre : p.Cliente_Nombre   || p.cliente_nombre   || '',
    total_unidades : p.Total_Unidades   || p.total_unidades   || 0,
    estado         : p.Estado           || p.estado           || 'Pendiente',
    requiere_revision: p.Requiere_Revision || p.requiere_revision || false,
    items_json     : p.Items_JSON       || p.items_json       || '[]',
    mensaje_original: p.Mensaje_Original || p.mensaje_original || '',
    notas          : p.Notas            || p.Notas_Pedido     || p.notas || '',
    total_sheru    : parseFloat(p.total_sheru   || 0),
    total_cliente  : parseFloat(p.total_cliente || 0),
    estado_pago    : p.estado_pago      || 'PENDIENTE',
    fecha_pago     : p.fecha_pago       || '',
    archivado      : p.archivado        || false,
    editado_por    : p.editado_por      || '',
    fecha_edicion  : p.fecha_edicion    || ''
  };
}

// Cliente: garantiza keys consistentes en toda la app
function _normalizarCliente(c) {
  return {
    id               : c.ID_Cliente        || c.id_cliente        || '',
    nombre           : c.Nombre_Cliente    || c.nombre_cliente    || c.nombre || '',
    canal            : c.Canal             || c.canal             || '',
    vendedor         : c.Vendedor          || c.vendedor          || '',
    direccion        : c.Dirección         || c.direccion         || '',
    telefono         : c.Teléfono          || c.telefono          || '',
    segmento_precio  : c.Segmento_Precio   || c.segmento_precio   || '',
    estado           : (c.Estado           || c.estado            || 'ACTIVO').toUpperCase(),
    notas            : c.Notas             || c.notas             || '',
    frecuencia_pedido: c.Frecuencia_Pedido || c.frecuencia_pedido || ''
  };
}

// Vendedor: garantiza keys consistentes en toda la app
function _normalizarVendedor(v) {
  return {
    id                 : v.ID_Vendedor         || v.id_vendedor         || '',
    nombre             : v.Nombre              || v.nombre              || '',
    canal              : v.Canal               || v.canal               || '',
    telefono           : v.Teléfono_WhatsApp   || v.telefono            || '',
    forma_cobro        : v.Forma_Cobro         || v.forma_cobro         || '',
    frecuencia_entrega : v.Frecuencia_Entrega  || v.frecuencia_entrega  || '',
    notas              : v.Notas               || v.notas               || '',
    email              : v.Email               || v.email               || '',
    rol                : (v.Rol                || v.rol                 || 'VENDEDOR').toUpperCase(),
    estado             : (v.Estado             || v.estado              || 'ACTIVO').toUpperCase()
  };
}
