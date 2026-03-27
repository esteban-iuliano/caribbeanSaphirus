// ============================================================
// CaribbeanSaphirus — src/screens/Administracion.jsx
// Versión: 1.0
// Pantalla ADMIN: gestión de Vendedores y Clientes
// Acceso: /admin?tab=vendedores  |  /admin?tab=clientes
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  obtenerVendedores,
  crearVendedor,
  editarVendedor,
  eliminarVendedor,
  obtenerClientes,
  crearCliente,
  editarCliente,
  eliminarCliente,
} from '../api/appsScript';

// ------------------------------------------------------------
// CONSTANTES DE DOMINIO
// ------------------------------------------------------------
const CANALES        = ['CHINOS', 'PEPE', 'DIRECTO'];
const SEGMENTOS      = ['CHINOS', 'PEPE', 'VALENTINA', 'ANALIA', 'LUKY', '120_UNIDADES'];
const ROLES          = ['VENDEDOR', 'ADMIN'];
const FORMAS_COBRO   = ['Transferencia / Efectivo', 'Cobra él directo', 'Cobra él directo en cada supermercado'];
const FRECUENCIAS    = ['Variable', 'Semanal', 'Quincenal', 'Mensual'];

// Estado → estilos
const BADGE_ESTADO = {
  ACTIVO  : 'bg-green-100 text-green-700 border border-green-300',
  INACTIVO: 'bg-red-100   text-red-700   border border-red-300',
};

// ------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ------------------------------------------------------------
export default function Administracion() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabInicial = searchParams.get('tab') === 'clientes' ? 'clientes' : 'vendedores';
  const [tab, setTab] = useState(tabInicial);

  function cambiarTab(nuevoTab) {
    setTab(nuevoTab);
    setSearchParams({ tab: nuevoTab });
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-green-700 text-white px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold">Administración</h1>
        <p className="text-green-200 text-sm mt-1">Gestión de vendedores y clientes</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white">
        <button
          onClick={() => cambiarTab('vendedores')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            tab === 'vendedores'
              ? 'text-green-700 border-b-2 border-green-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          👤 Vendedores
        </button>
        <button
          onClick={() => cambiarTab('clientes')}
          className={`flex-1 py-3 text-sm font-semibold transition-colors ${
            tab === 'clientes'
              ? 'text-green-700 border-b-2 border-green-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          🏪 Clientes
        </button>
      </div>

      {/* Contenido del tab activo */}
      <div className="p-4">
        {tab === 'vendedores' ? <TabVendedores /> : <TabClientes />}
      </div>
    </div>
  );
}

// ============================================================
// TAB VENDEDORES
// ============================================================
function TabVendedores() {
  const [vendedores, setVendedores]   = useState([]);
  const [cargando,   setCargando]     = useState(true);
  const [error,      setError]        = useState('');
  const [modalForm,  setModalForm]    = useState(null); // null | 'nuevo' | objeto vendedor
  const [modalElim,  setModalElim]    = useState(null); // null | objeto vendedor

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const data = await obtenerVendedores();
      setVendedores(data.vendedores || []);
    } catch (e) {
      setError('Error al cargar vendedores: ' + e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Toggle estado rápido
  async function toggleEstado(v) {
    const nuevoEstado = v.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    try {
      await editarVendedor(v.id, { estado: nuevoEstado });
      await cargar();
    } catch (e) {
      alert('Error al cambiar estado: ' + e.message);
    }
  }

  async function confirmarEliminar() {
    if (!modalElim) return;
    try {
      await eliminarVendedor(modalElim.id);
      setModalElim(null);
      await cargar();
    } catch (e) {
      alert('Error al eliminar: ' + e.message);
    }
  }

  return (
    <>
      {/* Botón agregar */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">{vendedores.length} vendedor{vendedores.length !== 1 ? 'es' : ''}</p>
        <button
          onClick={() => setModalForm('nuevo')}
          className="bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2 shadow"
        >
          <span className="text-lg leading-none">+</span> Nuevo vendedor
        </button>
      </div>

      {/* Estado de carga */}
      {cargando && <p className="text-center text-gray-400 py-8">Cargando...</p>}
      {error    && <p className="text-center text-red-500 py-4 text-sm">{error}</p>}

      {/* Lista */}
      {!cargando && !error && vendedores.length === 0 && (
        <p className="text-center text-gray-400 py-8">No hay vendedores registrados</p>
      )}

      <div className="flex flex-col gap-3">
        {vendedores.map(v => (
          <div key={v.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            {/* Fila superior */}
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-gray-800">{v.nombre}</p>
                <p className="text-xs text-gray-400 mt-0.5">{v.id} · {v.rol}</p>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${BADGE_ESTADO[v.estado] || BADGE_ESTADO.ACTIVO}`}>
                {v.estado}
              </span>
            </div>

            {/* Datos */}
            <div className="mt-3 grid grid-cols-2 gap-1 text-xs text-gray-600">
              {v.canal    && <span>📡 {v.canal}</span>}
              {v.telefono && <span>📱 {v.telefono}</span>}
              {v.email    && <span className="col-span-2 truncate">✉️ {v.email}</span>}
            </div>

            {/* Acciones */}
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setModalForm(v)}
                className="flex-1 text-xs font-semibold py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                ✏️ Editar
              </button>
              <button
                onClick={() => toggleEstado(v)}
                className={`flex-1 text-xs font-semibold py-2 rounded-xl border ${
                  v.estado === 'ACTIVO'
                    ? 'border-orange-200 text-orange-600 hover:bg-orange-50'
                    : 'border-green-200 text-green-600 hover:bg-green-50'
                }`}
              >
                {v.estado === 'ACTIVO' ? '🔴 Desactivar' : '🟢 Activar'}
              </button>
              <button
                onClick={() => setModalElim(v)}
                className="px-3 text-xs font-semibold py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal formulario */}
      {modalForm !== null && (
        <ModalVendedor
          vendedor={modalForm === 'nuevo' ? null : modalForm}
          onGuardar={async () => { setModalForm(null); await cargar(); }}
          onCerrar={() => setModalForm(null)}
        />
      )}

      {/* Modal confirmar eliminar */}
      {modalElim && (
        <ModalConfirmar
          titulo="Eliminar vendedor"
          mensaje={
            <>
              <p className="font-semibold text-gray-800 mb-2">⚠️ ¡Atención!</p>
              <p className="text-sm text-gray-600">
                Si eliminás a <strong>{modalElim.nombre}</strong>, se eliminarán también
                <strong> todos sus clientes asociados</strong>.
              </p>
              <p className="text-sm text-red-500 mt-2 font-medium">Esta acción no se puede deshacer.</p>
            </>
          }
          labelConfirmar="Sí, eliminar todo"
          colorConfirmar="bg-red-600 hover:bg-red-700"
          onConfirmar={confirmarEliminar}
          onCancelar={() => setModalElim(null)}
        />
      )}
    </>
  );
}

// ============================================================
// TAB CLIENTES
// ============================================================
function TabClientes() {
  const [clientes,   setClientes]   = useState([]);
  const [cargando,   setCargando]   = useState(true);
  const [error,      setError]      = useState('');
  const [busqueda,   setBusqueda]   = useState('');
  const [modalForm,  setModalForm]  = useState(null);
  const [modalElim,  setModalElim]  = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      // Sin filtro de canal → trae todos (admin ve todo)
      const data = await obtenerClientes();
      setClientes(data.datos || []);
    } catch (e) {
      setError('Error al cargar clientes: ' + e.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  async function toggleEstado(c) {
    const nuevoEstado = c.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    try {
      await editarCliente(c.id, { estado: nuevoEstado });
      await cargar();
    } catch (e) {
      alert('Error al cambiar estado: ' + e.message);
    }
  }

  async function confirmarEliminar() {
    if (!modalElim) return;
    try {
      await eliminarCliente(modalElim.id);
      setModalElim(null);
      await cargar();
    } catch (e) {
      alert('Error al eliminar: ' + e.message);
    }
  }

  // Filtro local por búsqueda
  const clientesFiltrados = clientes.filter(c => {
    const q = busqueda.toLowerCase();
    return (
      (c.nombre   || '').toLowerCase().includes(q) ||
      (c.canal    || '').toLowerCase().includes(q) ||
      (c.vendedor || '').toLowerCase().includes(q)
    );
  });

  return (
    <>
      {/* Barra superior */}
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-gray-500">{clientes.length} cliente{clientes.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setModalForm('nuevo')}
          className="bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-xl flex items-center gap-2 shadow"
        >
          <span className="text-lg leading-none">+</span> Nuevo cliente
        </button>
      </div>

      {/* Buscador */}
      <input
        type="text"
        placeholder="Buscar por nombre, canal o vendedor..."
        value={busqueda}
        onChange={e => setBusqueda(e.target.value)}
        className="w-full mb-4 px-4 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
      />

      {cargando && <p className="text-center text-gray-400 py-8">Cargando...</p>}
      {error    && <p className="text-center text-red-500 py-4 text-sm">{error}</p>}

      {!cargando && !error && clientesFiltrados.length === 0 && (
        <p className="text-center text-gray-400 py-8">
          {busqueda ? 'Sin resultados para esa búsqueda' : 'No hay clientes registrados'}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {clientesFiltrados.map(c => (
          <div key={c.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-gray-800">{c.nombre}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.id}</p>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${BADGE_ESTADO[c.estado] || BADGE_ESTADO.ACTIVO}`}>
                {c.estado}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-1 text-xs text-gray-600">
              {c.canal           && <span>📡 {c.canal}</span>}
              {c.vendedor        && <span>👤 {c.vendedor}</span>}
              {c.telefono        && <span>📱 {c.telefono}</span>}
              {c.segmento_precio && <span>💰 {c.segmento_precio}</span>}
            </div>

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setModalForm(c)}
                className="flex-1 text-xs font-semibold py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50"
              >
                ✏️ Editar
              </button>
              <button
                onClick={() => toggleEstado(c)}
                className={`flex-1 text-xs font-semibold py-2 rounded-xl border ${
                  c.estado === 'ACTIVO'
                    ? 'border-orange-200 text-orange-600 hover:bg-orange-50'
                    : 'border-green-200 text-green-600 hover:bg-green-50'
                }`}
              >
                {c.estado === 'ACTIVO' ? '🔴 Desactivar' : '🟢 Activar'}
              </button>
              <button
                onClick={() => setModalElim(c)}
                className="px-3 text-xs font-semibold py-2 rounded-xl border border-red-200 text-red-500 hover:bg-red-50"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalForm !== null && (
        <ModalCliente
          cliente={modalForm === 'nuevo' ? null : modalForm}
          onGuardar={async () => { setModalForm(null); await cargar(); }}
          onCerrar={() => setModalForm(null)}
        />
      )}

      {modalElim && (
        <ModalConfirmar
          titulo="Eliminar cliente"
          mensaje={
            <>
              <p className="text-sm text-gray-600">
                ¿Confirmás que querés eliminar a <strong>{modalElim.nombre}</strong>?
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Los pedidos históricos de este cliente se conservan.
              </p>
              <p className="text-sm text-red-500 mt-2 font-medium">Esta acción no se puede deshacer.</p>
            </>
          }
          labelConfirmar="Sí, eliminar"
          colorConfirmar="bg-red-600 hover:bg-red-700"
          onConfirmar={confirmarEliminar}
          onCancelar={() => setModalElim(null)}
        />
      )}
    </>
  );
}

// ============================================================
// MODAL FORMULARIO — VENDEDOR
// ============================================================
function ModalVendedor({ vendedor, onGuardar, onCerrar }) {
  const esNuevo = !vendedor;

  const [form, setForm] = useState({
    nombre             : vendedor?.nombre             || '',
    canal              : vendedor?.canal              || 'CHINOS',
    telefono           : vendedor?.telefono           || '',
    forma_cobro        : vendedor?.forma_cobro        || '',
    frecuencia_entrega : vendedor?.frecuencia_entrega || 'Variable',
    notas              : vendedor?.notas              || '',
    email              : vendedor?.email              || '',
    rol                : vendedor?.rol                || 'VENDEDOR',
    estado             : vendedor?.estado             || 'ACTIVO',
  });

  const [guardando, setGuardando] = useState(false);
  const [error,     setError]     = useState('');

  function set(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }));
  }

  async function guardar() {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return; }
    if (!form.canal.trim())  { setError('El canal es obligatorio');  return; }

    setGuardando(true);
    setError('');
    try {
      if (esNuevo) {
        await crearVendedor(form);
      } else {
        await editarVendedor(vendedor.id, form);
      }
      onGuardar();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal titulo={esNuevo ? 'Nuevo vendedor' : 'Editar vendedor'} onCerrar={onCerrar}>
      <Campo label="Nombre *">
        <input
          type="text"
          value={form.nombre}
          onChange={e => set('nombre', e.target.value)}
          placeholder="Ej: Germán"
          className={estiloInput}
        />
      </Campo>

      <Campo label="Canal *">
        <select value={form.canal} onChange={e => set('canal', e.target.value)} className={estiloInput}>
          {CANALES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </Campo>

      <Campo label="Teléfono WhatsApp">
        <input
          type="tel"
          value={form.telefono}
          onChange={e => set('telefono', e.target.value)}
          placeholder="Ej: 11-6859-1473"
          className={estiloInput}
        />
      </Campo>

      <Campo label="Email">
        <input
          type="email"
          value={form.email}
          onChange={e => set('email', e.target.value)}
          placeholder="Ej: vendedor@mail.com"
          className={estiloInput}
        />
      </Campo>

      <Campo label="Forma de cobro">
        <select value={form.forma_cobro} onChange={e => set('forma_cobro', e.target.value)} className={estiloInput}>
          <option value="">— Sin especificar —</option>
          {FORMAS_COBRO.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </Campo>

      <Campo label="Frecuencia de entrega">
        <select value={form.frecuencia_entrega} onChange={e => set('frecuencia_entrega', e.target.value)} className={estiloInput}>
          {FRECUENCIAS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </Campo>

      <Campo label="Rol">
        <select value={form.rol} onChange={e => set('rol', e.target.value)} className={estiloInput}>
          {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </Campo>

      {!esNuevo && (
        <Campo label="Estado">
          <select value={form.estado} onChange={e => set('estado', e.target.value)} className={estiloInput}>
            <option value="ACTIVO">ACTIVO</option>
            <option value="INACTIVO">INACTIVO</option>
          </select>
        </Campo>
      )}

      <Campo label="Notas">
        <textarea
          value={form.notas}
          onChange={e => set('notas', e.target.value)}
          placeholder="Observaciones internas..."
          rows={2}
          className={estiloInput}
        />
      </Campo>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

      <div className="flex gap-3 mt-4">
        <button
          onClick={onCerrar}
          className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold"
        >
          Cancelar
        </button>
        <button
          onClick={guardar}
          disabled={guardando}
          className="flex-1 py-3 rounded-xl bg-green-700 text-white text-sm font-semibold disabled:opacity-50"
        >
          {guardando ? 'Guardando...' : esNuevo ? 'Crear vendedor' : 'Guardar cambios'}
        </button>
      </div>
    </Modal>
  );
}

// ============================================================
// MODAL FORMULARIO — CLIENTE
// ============================================================
function ModalCliente({ cliente, onGuardar, onCerrar }) {
  const esNuevo = !cliente;

  const [form, setForm] = useState({
    nombre           : cliente?.nombre           || '',
    canal            : cliente?.canal            || 'CHINOS',
    vendedor         : cliente?.vendedor         || '',
    direccion        : cliente?.direccion        || '',
    telefono         : cliente?.telefono         || '',
    segmento_precio  : cliente?.segmento_precio  || 'CHINOS',
    notas            : cliente?.notas            || '',
    frecuencia_pedido: cliente?.frecuencia_pedido|| 'Variable',
    estado           : cliente?.estado           || 'ACTIVO',
  });

  const [guardando, setGuardando] = useState(false);
  const [error,     setError]     = useState('');

  function set(campo, valor) {
    setForm(prev => ({ ...prev, [campo]: valor }));
  }

  async function guardar() {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio'); return; }
    if (!form.canal.trim())  { setError('El canal es obligatorio');  return; }

    setGuardando(true);
    setError('');
    try {
      if (esNuevo) {
        await crearCliente(form);
      } else {
        await editarCliente(cliente.id, form);
      }
      onGuardar();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal titulo={esNuevo ? 'Nuevo cliente' : 'Editar cliente'} onCerrar={onCerrar}>
      <Campo label="Nombre *">
        <input
          type="text"
          value={form.nombre}
          onChange={e => set('nombre', e.target.value)}
          placeholder="Ej: Supermercado El Sol"
          className={estiloInput}
        />
      </Campo>

      <Campo label="Canal *">
        <select value={form.canal} onChange={e => set('canal', e.target.value)} className={estiloInput}>
          {CANALES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </Campo>

      <Campo label="Vendedor">
        <input
          type="text"
          value={form.vendedor}
          onChange={e => set('vendedor', e.target.value)}
          placeholder="Ej: German"
          className={estiloInput}
        />
      </Campo>

      <Campo label="Segmento de precio">
        <select value={form.segmento_precio} onChange={e => set('segmento_precio', e.target.value)} className={estiloInput}>
          {SEGMENTOS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </Campo>

      <Campo label="Teléfono">
        <input
          type="tel"
          value={form.telefono}
          onChange={e => set('telefono', e.target.value)}
          placeholder="Ej: 11-1234-5678"
          className={estiloInput}
        />
      </Campo>

      <Campo label="Dirección">
        <input
          type="text"
          value={form.direccion}
          onChange={e => set('direccion', e.target.value)}
          placeholder="Ej: Av. Corrientes 1234"
          className={estiloInput}
        />
      </Campo>

      <Campo label="Frecuencia de pedido">
        <select value={form.frecuencia_pedido} onChange={e => set('frecuencia_pedido', e.target.value)} className={estiloInput}>
          {FRECUENCIAS.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </Campo>

      {!esNuevo && (
        <Campo label="Estado">
          <select value={form.estado} onChange={e => set('estado', e.target.value)} className={estiloInput}>
            <option value="ACTIVO">ACTIVO</option>
            <option value="INACTIVO">INACTIVO</option>
          </select>
        </Campo>
      )}

      <Campo label="Notas">
        <textarea
          value={form.notas}
          onChange={e => set('notas', e.target.value)}
          placeholder="Observaciones internas..."
          rows={2}
          className={estiloInput}
        />
      </Campo>

      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}

      <div className="flex gap-3 mt-4">
        <button
          onClick={onCerrar}
          className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold"
        >
          Cancelar
        </button>
        <button
          onClick={guardar}
          disabled={guardando}
          className="flex-1 py-3 rounded-xl bg-green-700 text-white text-sm font-semibold disabled:opacity-50"
        >
          {guardando ? 'Guardando...' : esNuevo ? 'Crear cliente' : 'Guardar cambios'}
        </button>
      </div>
    </Modal>
  );
}

// ============================================================
// MODAL WRAPPER — contenedor base reutilizable
// ============================================================
function Modal({ titulo, onCerrar, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
      <div className="bg-white w-full max-w-lg rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-gray-800">{titulo}</h2>
          <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>
        <div className="flex flex-col gap-4">
          {children}
        </div>
      </div>
    </div>
  );
}

// Modal de confirmación genérico
function ModalConfirmar({ titulo, mensaje, labelConfirmar, colorConfirmar, onConfirmar, onCancelar }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-xl">
        <h2 className="text-lg font-bold text-gray-800 mb-3">{titulo}</h2>
        <div className="mb-5">{mensaje}</div>
        <div className="flex gap-3">
          <button
            onClick={onCancelar}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            className={`flex-1 py-3 rounded-xl text-white text-sm font-semibold ${colorConfirmar}`}
          >
            {labelConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}

// Campo de formulario con label
function Campo({ label, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

// Estilo unificado para inputs y selects
const estiloInput = 'w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-300 bg-white';
