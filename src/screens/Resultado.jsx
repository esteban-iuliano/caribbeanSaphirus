/**
 * Resultado.jsx
 * Muestra los items parseados, permite corregir cantidades,
 * y guarda el pedido confirmado.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { guardarPedido } from '../api/appsScript.js';
import Badge from '../components/ui/Badge.jsx';
import Loader from '../components/ui/Loader.jsx';
import { getProductoMeta, getFlagMeta } from '../utils/formatters.js';

export default function Resultado() {
  const { state, actions } = useApp();
  const { loading, error, call } = useApi();
  const navigate = useNavigate();

  const pedido = state.pedidoParsado;
  const [items, setItems] = useState(pedido?.items ?? []);
  const [guardado, setGuardado] = useState(false);

  if (!pedido) {
    return (
      <div className="p-4 text-center text-slate-500 py-16">
        <p className="text-4xl mb-3">🤷</p>
        <p className="text-sm">No hay pedido activo.</p>
        <button onClick={() => navigate('/nuevo')} className="mt-4 text-brand-700 underline text-sm">
          Ir a Nuevo Pedido
        </button>
      </div>
    );
  }

  const actualizarCantidad = (idx, valor) => {
    const n = parseInt(valor, 10);
    if (isNaN(n) || n < 0) return;
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, cantidad: n } : it));
  };

  const eliminarItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleGuardar = async () => {
    await call(() => guardarPedido(pedido.clienteId, items));
    setGuardado(true);
    setTimeout(() => {
      actions.clearPedido();
      navigate('/');
    }, 1500);
  };

  if (loading) return <Loader message="Guardando pedido…" />;

  if (guardado) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="text-5xl">✅</div>
        <p className="font-semibold text-slate-700">Pedido guardado</p>
        <p className="text-sm text-slate-400">Volviendo al inicio…</p>
      </div>
    );
  }

  const cliente = state.clienteSeleccionado;
  const totalItems = items.reduce((s, it) => s + (it.cantidad ?? 0), 0);

  return (
    <div className="p-4 space-y-4">
      {/* Resumen cliente */}
      <div className="bg-brand-50 rounded-xl px-4 py-3 text-sm">
        <span className="font-semibold text-brand-800">{cliente?.nombre}</span>
        <span className="text-brand-500 ml-2 text-xs">{cliente?.canal} · {cliente?.segmento}</span>
        <div className="text-brand-600 mt-0.5 text-xs">{items.length} productos · {totalItems} unidades</div>
      </div>

      {/* Lista de items */}
      <ul className="space-y-2">
        {items.map((item, idx) => {
          const prod = getProductoMeta(item.producto);
          const flag = getFlagMeta(item.flag);
          return (
            <li key={idx} className="bg-white border border-slate-200 rounded-xl p-3 space-y-2">
              {/* Fila superior */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-800 truncate">{item.fragancia}</div>
                  {item.alias_usado && (
                    <div className="text-xs text-slate-400">alias: {item.alias_usado}</div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge className={prod.color}>{prod.emoji} {prod.label}</Badge>
                  <Badge className={flag.color}>{flag.label}</Badge>
                </div>
              </div>

              {/* Fila inferior: cantidad + eliminar */}
              <div className="flex items-center gap-3">
                <label className="text-xs text-slate-500">Cant.</label>
                <input
                  type="number"
                  min="0"
                  value={item.cantidad}
                  onChange={e => actualizarCantidad(idx, e.target.value)}
                  className="w-16 border border-slate-300 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-brand-400"
                />
                {item.nota && (
                  <span className="text-xs text-amber-600 flex-1 truncate">⚠ {item.nota}</span>
                )}
                <button
                  onClick={() => eliminarItem(idx)}
                  className="ml-auto text-slate-300 hover:text-red-400 text-lg leading-none"
                  title="Eliminar"
                >✕</button>
              </div>
            </li>
          );
        })}
      </ul>

      {items.length === 0 && (
        <p className="text-center text-slate-400 text-sm py-8">Sin items. Volvé a parsear.</p>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Acciones */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/nuevo')}
          className="flex-1 border border-slate-300 text-slate-600 font-medium py-3 rounded-xl text-sm"
        >
          ← Volver
        </button>
        <button
          onClick={handleGuardar}
          disabled={items.length === 0}
          className="flex-1 bg-brand-700 hover:bg-brand-800 disabled:bg-slate-300 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          💾 Confirmar y Guardar
        </button>
      </div>
    </div>
  );
}
