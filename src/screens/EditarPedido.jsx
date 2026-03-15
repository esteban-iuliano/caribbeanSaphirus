/**
 * EditarPedido.jsx — Sprint C'
 * Edición completa de un pedido existente. Solo ADMIN.
 * Ruta: /editar/:pedidoId
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  obtenerPedidoDetalle,
  editarPedido,
  obtenerCatalogo,
} from '../api/appsScript.js';

// ── Helpers ───────────────────────────────────────────────────────────────────
const PRODUCTO_EMOJI = {
  aerosol:     '💨',
  difusor:     '🌿',
  textil:      '👕',
  shiny:       '🚗',
  antihumedad: '💧',
  touch:       '🔌',
};

function getEmoji(producto = '') {
  const key = producto.toLowerCase();
  for (const [k, v] of Object.entries(PRODUCTO_EMOJI)) {
    if (key.includes(k)) return v;
  }
  return '📦';
}

function formatPeso(n) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
  }).format(n || 0);
}

// ── Componente ────────────────────────────────────────────────────────────────
export default function EditarPedido() {
  const { pedidoId } = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuth();

  // Datos del pedido original
  const [pedido,   setPedido]   = useState(null);
  const [items,    setItems]    = useState([]);

  // Catálogo
  // productos: [{ nombre, precio, tiene_fragancia }]
  // fragancias: { "Aerosol 280cc": ["Lavanda", "Limón", ...], ... }
  const [catalogo, setCatalogo] = useState({ productos: [], fragancias: {} });

  // Campos cabecera editables
  const [clienteNombre, setClienteNombre] = useState('');
  const [notasPedido,   setNotasPedido]   = useState('');
  const [estadoPago,    setEstadoPago]    = useState('PENDIENTE');

  // Form nuevo ítem
  const [nuevoProducto,  setNuevoProducto]  = useState('');
  const [nuevoFragancia, setNuevoFragancia] = useState('');
  const [nuevaCantidad,  setNuevaCantidad]  = useState(1);

  // UI
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [modified, setModified] = useState(false);

  // ── Carga inicial ─────────────────────────────────────────────────────────
  const cargarDatos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // Paralelo: detalle del pedido + catálogo completo
      const canal = user?.canal || 'CHINOS'; // canal del admin para el catálogo
      const [det, cat] = await Promise.all([
        obtenerPedidoDetalle(pedidoId, user.email),
        obtenerCatalogo(canal),
      ]);

      // det = { pedido: {...}, items: [...] }
      // cat = { clientes, productos, fragancias }
      if (!det.pedido) throw new Error('Pedido no encontrado');

      setPedido(det.pedido);
      setItems(det.items || []);
      setClienteNombre(det.pedido.Cliente_Nombre  || '');
      setNotasPedido(  det.pedido.Notas_Pedido    || '');
      setEstadoPago((  det.pedido.estado_pago      || 'PENDIENTE').toUpperCase());

      setCatalogo({
        productos:  cat.productos  || [],
        fragancias: cat.fragancias || {},
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [pedidoId, user.email, user?.canal]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  // ── Totales estimados en tiempo real ──────────────────────────────────────
  // precio_unit_sheru viene de CS_Items
  const totalSheru = items.reduce((s, i) => {
    const precio = parseFloat(i.precio_unit_sheru) || 0;
    const cant   = parseInt(i.Cantidad ?? i.cantidad) || 0;
    return s + precio * cant;
  }, 0);

  // Markup del pedido original (para estimar total cliente)
  const markupOriginal =
    pedido && parseFloat(pedido.total_sheru) > 0
      ? parseFloat(pedido.total_cliente) / parseFloat(pedido.total_sheru)
      : 1.095;

  const totalClienteEstimado = totalSheru * markupOriginal;

  // Fragancias disponibles para el producto elegido en el add-form
  // catalogo.fragancias = { "Aerosol 280cc": ["Lavanda", ...] }
  const fraganciasFiltradas = nuevoProducto
    ? (catalogo.fragancias[nuevoProducto] || [])
    : [];

  const productoObj  = catalogo.productos.find(p => p.nombre === nuevoProducto);
  const tieneFrag    = productoObj ? productoObj.tiene_fragancia !== false : true;

  // ── Handlers ítems ────────────────────────────────────────────────────────
  function cambiarCantidad(idx, val) {
    const n = Math.max(1, parseInt(val) || 1);
    setItems(prev => prev.map((it, i) =>
      i === idx ? { ...it, Cantidad: n, cantidad: n } : it
    ));
    setModified(true);
  }

  function eliminarItem(idx) {
    setItems(prev => prev.filter((_, i) => i !== idx));
    setModified(true);
  }

  function agregarItem() {
    if (!nuevoProducto) {
      setError('Seleccioná un producto');
      return;
    }
    if (tieneFrag && !nuevoFragancia) {
      setError('Este producto requiere fragancia');
      return;
    }
    setItems(prev => [...prev, {
      Producto:            nuevoProducto,
      Fragancia:           nuevoFragancia,
      Cantidad:            nuevaCantidad,
      precio_unit_sheru:   0,  // el backend recalcula al guardar
      precio_unit_cliente: 0,
      Flag:                'OK',
      Alias_Usado:         '',
      Nota:                '',
    }]);
    setNuevoProducto('');
    setNuevoFragancia('');
    setNuevaCantidad(1);
    setModified(true);
    setError('');
  }

  // ── Guardar ───────────────────────────────────────────────────────────────
  async function guardarCambios() {
    if (items.length === 0) {
      setError('El pedido debe tener al menos un ítem');
      return;
    }
    setSaving(true);
    setError('');
    try {
      // Normalizar campos: CS_Items puede tener PascalCase o camelCase
      const itemsNorm = items.map(i => ({
        fragancia:   i.Fragancia   ?? i.fragancia   ?? '',
        producto:    i.Producto    ?? i.producto     ?? '',
        cantidad:    parseInt(i.Cantidad ?? i.cantidad) || 0,
        flag:        i.Flag        ?? i.flag         ?? 'OK',
        alias_usado: i.Alias_Usado ?? i.alias_usado  ?? '',
        nota:        i.Nota        ?? i.nota         ?? '',
      }));

      await editarPedido(
        pedidoId,
        {
          cliente_nombre: clienteNombre,
          notas_pedido:   notasPedido,
          estado_pago:    estadoPago,
          items:          itemsNorm,
        },
        user.email
      );

      setModified(false);
      navigate('/historial', {
        state: { mensaje: `Pedido ${pedidoId} actualizado ✓` },
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    if (modified && !window.confirm('Tenés cambios sin guardar. ¿Salir de todas formas?')) return;
    navigate('/historial');
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-dvh bg-slate-50">
        <header className="bg-[#1a1a2e] text-white px-4 py-3.5 flex items-center gap-3">
          <button onClick={handleBack} className="text-2xl leading-none bg-transparent border-none text-white">←</button>
          <span className="font-semibold text-base">Cargando pedido…</span>
        </header>
        <div className="text-center py-16 text-slate-400">⏳ Cargando datos…</div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-dvh bg-slate-50 pb-24">

      {/* Header */}
      <header className="bg-[#1a1a2e] text-white px-4 py-3.5 flex items-center gap-3">
        <button
          onClick={handleBack}
          className="text-2xl leading-none bg-transparent border-none text-white p-0"
        >←</button>
        <span className="flex-1 font-semibold text-base truncate">
          Editar {pedidoId}
          {pedido?.editado_por && (
            <span className="ml-2 text-xs bg-orange-100 text-orange-600 rounded px-2 py-0.5 font-semibold">
              ✏️ ya editado
            </span>
          )}
        </span>
      </header>

      {error && (
        <div className="mx-3 mt-3 bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">
          ⚠️ {error}
        </div>
      )}

      {/* ── Cabecera del pedido ── */}
      <section className="mx-3 mt-3 bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Datos del pedido
        </h2>

        <label className="block text-sm font-medium text-slate-700 mb-1">
          Nombre del cliente
        </label>
        <input
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400"
          value={clienteNombre}
          onChange={e => { setClienteNombre(e.target.value); setModified(true); }}
          placeholder="Nombre visible del cliente"
        />

        <label className="block text-sm font-medium text-slate-700 mt-3 mb-1">
          Notas
        </label>
        <textarea
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 resize-y min-h-[68px]"
          value={notasPedido}
          onChange={e => { setNotasPedido(e.target.value); setModified(true); }}
          placeholder="Observaciones del pedido"
        />

        <label className="block text-sm font-medium text-slate-700 mt-3 mb-1">
          Estado de pago
        </label>
        <select
          className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white outline-none focus:border-blue-400"
          value={estadoPago}
          onChange={e => { setEstadoPago(e.target.value); setModified(true); }}
        >
          <option value="PENDIENTE">🟠 Pendiente</option>
          <option value="PAGADO">🟢 Pagado</option>
        </select>

        {pedido && (
          <p className="text-xs text-slate-400 mt-2">
            Canal: <strong>{pedido.Canal}</strong>
            {' · '}Vendedor: <strong>{pedido.Vendedor}</strong>
            {' · '}Fecha: <strong>{String(pedido.Fecha || '').slice(0, 10)}</strong>
          </p>
        )}
      </section>

      {/* ── Ítems ── */}
      <section className="mx-3 mt-3 bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Ítems ({items.length})
        </h2>

        {items.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">
            Sin ítems. Agregá al menos uno.
          </p>
        )}

        {items.map((item, idx) => {
          const prod = item.Producto  ?? item.producto  ?? '';
          const frag = item.Fragancia ?? item.fragancia ?? '';
          const cant = item.Cantidad  ?? item.cantidad  ?? 0;
          return (
            <div key={idx} className="flex items-center gap-2 py-2 border-b border-slate-100 last:border-0">
              <span className="text-xl">{getEmoji(prod)}</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{frag || '—'}</div>
                <span className="text-xs font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                  {prod}
                </span>
              </div>
              <input
                type="number"
                min={1}
                className="w-14 text-center border border-slate-200 rounded-lg py-1.5 text-sm"
                value={cant}
                onChange={e => cambiarCantidad(idx, e.target.value)}
              />
              <button
                onClick={() => eliminarItem(idx)}
                className="text-lg text-red-400 active:text-red-600 px-1"
                title="Quitar ítem"
              >🗑</button>
            </div>
          );
        })}

        {/* Agregar ítem */}
        <div className="mt-4 bg-blue-50 rounded-xl p-4">
          <p className="text-sm font-semibold text-blue-700 mb-3">＋ Agregar ítem</p>

          <label className="block text-xs font-medium text-slate-600 mb-1">Producto</label>
          <select
            className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white mb-2"
            value={nuevoProducto}
            onChange={e => { setNuevoProducto(e.target.value); setNuevoFragancia(''); setError(''); }}
          >
            <option value="">— Seleccioná producto —</option>
            {catalogo.productos.map((p, i) => (
              <option key={i} value={p.nombre}>{p.nombre}</option>
            ))}
          </select>

          {nuevoProducto && tieneFrag && (
            <>
              <label className="block text-xs font-medium text-slate-600 mb-1">Fragancia</label>
              <select
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white mb-2"
                value={nuevoFragancia}
                onChange={e => setNuevoFragancia(e.target.value)}
              >
                <option value="">— Seleccioná fragancia —</option>
                {fraganciasFiltradas.map((f, i) => (
                  <option key={i} value={f}>{f}</option>
                ))}
              </select>
            </>
          )}

          <label className="block text-xs font-medium text-slate-600 mb-1">Cantidad</label>
          <input
            type="number"
            min={1}
            className="w-24 border border-slate-200 rounded-xl px-3 py-2.5 text-sm mb-3"
            value={nuevaCantidad}
            onChange={e => setNuevaCantidad(Math.max(1, parseInt(e.target.value) || 1))}
          />

          <button
            onClick={agregarItem}
            className="w-full bg-blue-600 text-white font-semibold text-sm py-3 rounded-xl active:bg-blue-700"
          >
            Agregar ítem
          </button>
        </div>
      </section>

      {/* ── Totales ── */}
      <section className="mx-3 mt-3 bg-white rounded-2xl p-4 shadow-sm">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Totales (estimados)
        </h2>
        <div className="flex justify-between py-1.5 border-b border-slate-100">
          <span className="text-sm text-slate-600">Total Sheru</span>
          <span className="text-sm font-semibold">{formatPeso(totalSheru)}</span>
        </div>
        <div className="flex justify-between py-1.5">
          <span className="text-sm text-slate-600">Total Cliente</span>
          <span className="text-sm font-semibold text-green-700">{formatPeso(totalClienteEstimado)}</span>
        </div>
        <p className="text-xs text-slate-400 mt-2">
          * Ítems nuevos muestran $0 hasta guardar. El backend recalcula todos los precios al confirmar.
        </p>
      </section>

      {/* ── Barra fija inferior ── */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-slate-200 px-4 py-3 flex gap-3 z-10">
        <button
          onClick={handleBack}
          className="shrink-0 px-5 py-3 rounded-xl bg-slate-100 text-slate-700 font-medium text-sm active:bg-slate-200"
        >
          Cancelar
        </button>
        <button
          onClick={guardarCambios}
          disabled={saving}
          className="flex-1 py-3 rounded-xl bg-green-600 text-white font-bold text-base active:bg-green-700 disabled:opacity-60"
        >
          {saving ? '⏳ Guardando…' : '💾 Guardar cambios'}
        </button>
      </div>

    </div>
  );
}
