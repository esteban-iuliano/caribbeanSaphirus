/**
 * FormularioVendedor.jsx
 * Formulario estructurado para el vendedor (canal CHINOS).
 * Sin parser de IA. Sin precios visibles.
 * 3 pasos: Cliente → Armar pedido → Confirmar
 */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCatalogo } from '../hooks/useCatalogo.js';
import { guardarPedido } from '../api/appsScript.js';
import Loader from '../components/ui/Loader.jsx';

// ─── Constante de canal ───────────────────────────────────────
const CANAL = 'CHINOS';

export default function FormularioVendedor() {
  const navigate = useNavigate();
  const { clientes, productos, fraganciasPara, loading, error } = useCatalogo(CANAL);

  // ── Estado global del formulario ──────────────────────────────
  const [paso,             setPaso]             = useState(1);
  const [clienteSelec,     setClienteSelec]     = useState(null);
  const [items,            setItems]            = useState([]);
  const [guardando,        setGuardando]        = useState(false);
  const [guardadoOk,       setGuardadoOk]       = useState(false);
  const [errorGuardar,     setErrorGuardar]     = useState(null);

  // ── Estado del selector de ítem (paso 2) ──────────────────────
  const [busqCliente,  setBusqCliente]  = useState('');
  const [productoSel,  setProductoSel]  = useState('');
  const [busqFrag,     setBusqFrag]     = useState('');
  const [fragSel,      setFragSel]      = useState('');
  const [cantidad,     setCantidad]     = useState(1);
  const [fragListOpen, setFragListOpen] = useState(false);

  // ¿El producto seleccionado tiene fragancia?
  const productoActual   = productos.find(p => p.nombre === productoSel);
  const tieneFragancia   = productoActual ? productoActual.tiene_fragancia !== false : true;

  // ─── Paso 1: seleccionar cliente ─────────────────────────────
  const clientesFiltrados = useMemo(() =>
    clientes.filter(c =>
      c.nombre?.toLowerCase().includes(busqCliente.toLowerCase()) ||
      c.id?.toLowerCase().includes(busqCliente.toLowerCase())
    ),
    [clientes, busqCliente]
  );

  const elegirCliente = (c) => {
    setClienteSelec(c);
    setBusqCliente('');
    setPaso(2);
  };

  // ─── Paso 2: agregar ítems ────────────────────────────────────
  const fragDisponibles = useMemo(() => {
    const base = fraganciasPara(productoSel);
    if (!busqFrag.trim()) return base;
    return base.filter(f => f.toLowerCase().includes(busqFrag.toLowerCase()));
  }, [productoSel, busqFrag, fraganciasPara]);

  const elegirFragancia = (f) => {
    setFragSel(f);
    setBusqFrag(f);
    setFragListOpen(false);
  };

  const agregarItem = () => {
    if (!productoSel || cantidad < 1) return;
    if (tieneFragancia && !fragSel) return;

    const fragancia = tieneFragancia ? fragSel : '—';

    // Si ya existe el mismo producto+fragancia, sumar cantidad
    const existe = items.findIndex(
      it => it.producto === productoSel && it.fragancia === fragancia
    );
    if (existe >= 0) {
      setItems(prev => prev.map((it, i) =>
        i === existe ? { ...it, cantidad: it.cantidad + cantidad } : it
      ));
    } else {
      setItems(prev => [...prev, {
        fragancia,
        producto:    productoSel,
        cantidad,
        flag:        'OK',
        alias_usado: null,
        nota:        '',
      }]);
    }
    setFragSel('');
    setBusqFrag('');
    setCantidad(1);
    setFragListOpen(false);
  };

  const eliminarItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const actualizarCantidad = (idx, val) => {
    const n = parseInt(val, 10);
    if (isNaN(n) || n < 1) return;
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, cantidad: n } : it));
  };

  // ─── Paso 3: confirmar y guardar ─────────────────────────────
  const handleGuardar = async () => {
    if (!clienteSelec || items.length === 0) return;
    setGuardando(true);
    setErrorGuardar(null);
    try {
      await guardarPedido(clienteSelec.id, items, '', 'formulario');
      setGuardadoOk(true);
      setTimeout(() => navigate('/'), 1800);
    } catch (e) {
      setErrorGuardar(e?.message ?? 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const totalUnidades = items.reduce((s, it) => s + it.cantidad, 0);
  // Puede agregar: producto elegido + (fragancia elegida O producto sin fragancia) + cantidad válida
  const puedeAgregar  = productoSel && (tieneFragancia ? fragSel : true) && cantidad >= 1;
  const puedeContinuar = items.length > 0;

  // ─── Pantallas especiales ─────────────────────────────────────
  if (loading) return <Loader message="Cargando catálogo…" />;

  if (error) return (
    <div className="p-4">
      <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
    </div>
  );

  if (guardando) return <Loader message="Guardando pedido…" />;

  if (guardadoOk) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="text-5xl">✅</div>
      <p className="font-semibold text-slate-700">Pedido guardado</p>
      <p className="text-sm text-slate-400">Volviendo al inicio…</p>
    </div>
  );

  // ─── Render principal ─────────────────────────────────────────
  return (
    <div className="p-4 space-y-4">

      {/* Indicador de pasos */}
      <div className="flex items-center gap-2 text-sm">
        <StepDot n={1} active={paso === 1} done={paso > 1} label="Cliente" />
        <div className="flex-1 h-px bg-slate-200" />
        <StepDot n={2} active={paso === 2} done={paso > 2} label="Pedido" />
        <div className="flex-1 h-px bg-slate-200" />
        <StepDot n={3} active={paso === 3} done={false} label="Confirmar" />
      </div>

      {/* ════════════ PASO 1 — CLIENTE ════════════ */}
      {paso === 1 && (
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Buscar cliente…"
            value={busqCliente}
            onChange={e => setBusqCliente(e.target.value)}
            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            autoFocus
          />
          <ul className="space-y-2 max-h-[65vh] overflow-y-auto">
            {clientesFiltrados.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-8">Sin resultados</p>
            ) : clientesFiltrados.map(c => (
              <li key={c.id}>
                <button
                  onClick={() => elegirCliente(c)}
                  className="w-full text-left bg-white border border-slate-200 rounded-xl px-4 py-3 hover:border-brand-400 hover:bg-brand-50 active:bg-brand-100 transition-colors"
                >
                  <div className="font-medium text-slate-800 text-sm">{c.nombre}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{c.id} · {c.canal}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ════════════ PASO 2 — ARMAR PEDIDO ════════════ */}
      {paso === 2 && (
        <div className="space-y-4">

          {/* Cliente seleccionado */}
          <div className="flex items-center justify-between bg-brand-50 rounded-xl px-4 py-2.5">
            <div>
              <span className="font-semibold text-brand-800 text-sm">{clienteSelec.nombre}</span>
              <span className="text-brand-400 text-xs ml-2">{clienteSelec.id}</span>
            </div>
            <button
              onClick={() => { setPaso(1); setItems([]); }}
              className="text-xs text-brand-600 underline shrink-0"
            >
              Cambiar
            </button>
          </div>

          {/* Selector de ítem */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Agregar ítem</p>

            {/* Producto */}
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Producto</label>
              <select
                value={productoSel}
                onChange={e => {
                  setProductoSel(e.target.value);
                  setFragSel('');
                  setBusqFrag('');
                  setFragListOpen(false);
                }}
                className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="">— Seleccioná un producto —</option>
                {productos.map(p => (
                  <option key={p.nombre} value={p.nombre}>{p.nombre}</option>
                ))}
              </select>
            </div>

            {/* Fragancia — solo si el producto la tiene */}
            {tieneFragancia && (
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Fragancia</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder={productoSel ? 'Escribí para buscar…' : 'Primero elegí un producto'}
                  value={busqFrag}
                  disabled={!productoSel}
                  onChange={e => { setBusqFrag(e.target.value); setFragSel(''); setFragListOpen(true); }}
                  onFocus={() => setFragListOpen(true)}
                  className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-400"
                />
                {fragSel && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500 text-sm">✓</span>
                )}
              </div>

              {/* Lista de sugerencias */}
              {fragListOpen && productoSel && (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-md max-h-48 overflow-y-auto">
                  {fragDisponibles.length === 0 ? (
                    <p className="text-xs text-slate-400 px-3 py-2">Sin resultados</p>
                  ) : fragDisponibles.map(f => (
                    <button
                      key={f}
                      onMouseDown={() => elegirFragancia(f)}
                      className={`w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-brand-50 ${
                        fragSel === f ? 'bg-brand-50 text-brand-700 font-medium' : 'text-slate-700'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              )}
            </div>
            )}

            {/* Cantidad */}
            <div className="space-y-1">
              <label className="text-xs text-slate-500">Cantidad</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCantidad(c => Math.max(1, c - 1))}
                  className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 text-lg active:bg-slate-100"
                >−</button>
                <input
                  type="number"
                  min="1"
                  value={cantidad}
                  onChange={e => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 border border-slate-300 rounded-xl px-2 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                <button
                  onClick={() => setCantidad(c => c + 1)}
                  className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 text-lg active:bg-slate-100"
                >+</button>
              </div>
            </div>

            {/* Botón agregar */}
            <button
              onClick={agregarItem}
              disabled={!puedeAgregar}
              className="w-full bg-brand-700 hover:bg-brand-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              + Agregar al pedido
            </button>
          </div>

          {/* Lista de ítems agregados */}
          {items.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Pedido actual
                </p>
                <span className="text-xs text-slate-400">{items.length} ítems · {totalUnidades} u.</span>
              </div>

              <ul className="space-y-2">
                {items.map((it, idx) => (
                  <li key={idx} className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-slate-800 truncate">{it.fragancia}</div>
                      <div className="text-xs text-slate-400 truncate">{it.producto}</div>
                    </div>
                    <input
                      type="number"
                      min="1"
                      value={it.cantidad}
                      onChange={e => actualizarCantidad(idx, e.target.value)}
                      className="w-14 border border-slate-200 rounded-lg px-1.5 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-400"
                    />
                    <button
                      onClick={() => eliminarItem(idx)}
                      className="text-slate-300 hover:text-red-400 text-lg leading-none ml-1"
                    >✕</button>
                  </li>
                ))}
              </ul>

              {/* Continuar a confirmación */}
              <button
                onClick={() => setPaso(3)}
                disabled={!puedeContinuar}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 text-white font-semibold py-4 rounded-2xl text-base transition-colors mt-2"
              >
                Revisar y confirmar →
              </button>
            </div>
          )}
        </div>
      )}

      {/* ════════════ PASO 3 — CONFIRMAR ════════════ */}
      {paso === 3 && (
        <div className="space-y-4">

          {/* Resumen cliente */}
          <div className="bg-brand-50 rounded-xl px-4 py-3">
            <div className="font-semibold text-brand-800 text-sm">{clienteSelec.nombre}</div>
            <div className="text-xs text-brand-500 mt-0.5">
              {items.length} productos · {totalUnidades} unidades
            </div>
          </div>

          {/* Lista final */}
          <ul className="space-y-2">
            {items.map((it, idx) => (
              <li key={idx} className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-sm text-slate-800">{it.fragancia}</div>
                  <div className="text-xs text-slate-400">{it.producto}</div>
                </div>
                <div className="font-bold text-brand-700 text-base shrink-0 ml-3">{it.cantidad}</div>
              </li>
            ))}
          </ul>

          {errorGuardar && (
            <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">{errorGuardar}</div>
          )}

          {/* Acciones */}
          <div className="flex gap-3">
            <button
              onClick={() => setPaso(2)}
              className="flex-1 border border-slate-300 text-slate-600 font-medium py-3 rounded-xl text-sm"
            >
              ← Volver
            </button>
            <button
              onClick={handleGuardar}
              className="flex-1 bg-brand-700 hover:bg-brand-800 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              💾 Confirmar pedido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Componente auxiliar ──────────────────────────────────────
function StepDot({ n, active, done, label }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
        done   ? 'bg-brand-600 text-white' :
        active ? 'bg-brand-700 text-white' :
                 'bg-slate-200 text-slate-400'
      }`}>
        {done ? '✓' : n}
      </div>
      <span className={`text-xs ${active ? 'text-brand-700 font-medium' : 'text-slate-400'}`}>
        {label}
      </span>
    </div>
  );
}
