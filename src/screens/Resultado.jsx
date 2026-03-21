/**
 * Resultado.jsx
 * Muestra los items parseados, permite corregir cantidades,
 * corregir fragancia en ítems REVISAR, y guarda el pedido confirmado.
 *
 * FIX v1.6: handleGuardar solo activa el estado "guardado" si la llamada
 * fue exitosa. Si falla, muestra advertencia explícita para evitar que el
 * usuario reintente sin saber que el pedido puede haberse guardado igual.
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
  // intentoFallido: true cuando hubo al menos un error al guardar.
  // Activa la advertencia anti-duplicados para que el usuario vaya al Historial.
  const [intentoFallido, setIntentoFallido] = useState(false);

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

  // FIX: permite editar fragancia en ítems REVISAR
  // Al corregir la fragancia, el flag pasa a OK automáticamente
  const actualizarFragancia = (idx, valor) => {
    setItems(prev => prev.map((it, i) =>
      i === idx
        ? { ...it, fragancia: valor, flag: valor.trim() ? 'OK' : 'REVISAR' }
        : it
    ));
  };

  const eliminarItem = (idx) => {
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleGuardar = async () => {
    // Resetear advertencia en cada intento
    setIntentoFallido(false);

    let res;
    try {
      res = await call(() => guardarPedido(pedido.clienteId, items));
    } catch {
      // call() lanzó — el error ya está en el estado de useApi
      setIntentoFallido(true);
      return;
    }

    // Si call() no lanza pero tampoco devuelve datos, también es fallo
    if (!res) {
      setIntentoFallido(true);
      return;
    }

    // Éxito confirmado
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
          const esRevisar = item.flag === 'REVISAR' || item.flag === 'NUEVA';
          return (
            <li key={idx} className={`bg-white border rounded-xl p-3 space-y-2 ${esRevisar ? 'border-amber-300' : 'border-slate-200'}`}>
              {/* Fila superior */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  {/* FIX: input editable para ítems REVISAR/NUEVA, texto para el resto */}
                  {esRevisar ? (
                    <input
                      type="text"
                      value={item.fragancia}
                      onChange={e => actualizarFragancia(idx, e.target.value)}
                      placeholder="Corregir fragancia…"
                      className="w-full border border-amber-300 rounded-lg px-2 py-1 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-amber-50"
                    />
                  ) : (
                    <div className="font-medium text-sm text-slate-800 truncate">{item.fragancia}</div>
                  )}
                  {item.alias_usado && (
                    <div className="text-xs text-slate-400 mt-0.5">alias: {item.alias_usado}</div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Badge className={prod.color}>{prod.emoji} {prod.label}</Badge>
                  <Badge className={flag.color}>{flag.label}</Badge>
                </div>
              </div>

              {/* Fila inferior: cantidad + nota + eliminar */}
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
                {esRevisar && (
                  <span className="text-xs text-amber-600 flex-1">✏️ Corregir fragancia</span>
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

      {/* Error técnico genérico (solo si NO hubo intento fallido, para no mostrar ambos) */}
      {error && !intentoFallido && (
        <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Advertencia anti-duplicados — se muestra cuando el guardado falló */}
      {intentoFallido && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 space-y-2">
          <p className="text-amber-800 text-sm font-semibold">
            ⚠️ Hubo un error al confirmar el pedido
          </p>
          <p className="text-amber-700 text-xs leading-relaxed">
            El pedido <strong>puede haberse guardado igual</strong>. Antes de volver a intentar,
            revisá el Historial para evitar duplicados.
          </p>
          <button
            onClick={() => navigate('/historial')}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
          >
            📂 Ver Historial antes de reintentar
          </button>
        </div>
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
          disabled={items.length === 0 || loading}
          className="flex-1 bg-brand-700 hover:bg-brand-800 disabled:bg-slate-300 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          💾 Confirmar y Guardar
        </button>
      </div>
    </div>
  );
}
