/**
 * Historial.jsx — Sprint C'
 * Lista todos los pedidos guardados ordenados por fecha desc.
 * ADMIN: botones editar ✏️ y eliminar 🗑️ por pedido.
 */
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { obtenerPedidos, eliminarPedidoAdmin } from '../api/appsScript.js';
import Loader from '../components/ui/Loader.jsx';

function formatDatetime(val) {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d)) return val.toString().substring(0, 16);
  return d.toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function BadgePago({ estado }) {
  const pagado = (estado || '').toUpperCase() === 'PAGADO';
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
      pagado ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
    }`}>
      {pagado ? '🟢 Pagado' : '🟠 Pendiente'}
    </span>
  );
}

export default function Historial() {
  const navigate   = useNavigate();
  const location   = useLocation();
  const { user }   = useAuth();
  const esAdmin    = user?.rol === 'ADMIN';

  const [pedidos,    setPedidos]   = useState([]);
  const [loading,    setLoad]      = useState(true);
  const [error,      setError]     = useState(null);
  const [expandido,  setExpandido] = useState(null);

  const [modalEliminar, setModalEliminar] = useState(null);
  const [eliminando,    setEliminando]    = useState(false);
  const [toastMsg,      setToastMsg]      = useState('');

  useEffect(() => {
    if (location.state?.mensaje) {
      setToastMsg(location.state.mensaje);
      setTimeout(() => setToastMsg(''), 4000);
      window.history.replaceState({}, '');
    }
  }, [location.state]);

  // ── Carga de pedidos ──────────────────────────────────────────
  const cargarPedidos = () => {
    setLoad(true);
    setError(null);

    const timeout = setTimeout(() => {
      setLoad(false);
      setError('El servidor tardó demasiado. Tocá para reintentar.');
    }, 15000);

    obtenerPedidos()
      .then(res => {
        const lista = (res?.datos ?? []).slice().reverse();
        setPedidos(lista);
      })
      .catch(e => setError(e?.message ?? 'Error al cargar historial'))
      .finally(() => { clearTimeout(timeout); setLoad(false); });

    return () => clearTimeout(timeout);
  };

  useEffect(() => {
    const cleanup = cargarPedidos();
    return cleanup;
  }, []);

  // ── Eliminación ───────────────────────────────────────────────
  function abrirModalEliminar(p) {
    setModalEliminar({
      pedidoId: p.pedidoId,
      resumen:  `${p.pedidoId} · ${p.clienteNombre || p.clienteId} · ${p.fecha?.slice(0, 10) ?? ''}`,
    });
  }

  async function confirmarEliminar() {
    if (!modalEliminar) return;
    setEliminando(true);
    try {
      await eliminarPedidoAdmin(modalEliminar.pedidoId, user.email);
      setToastMsg(`Pedido ${modalEliminar.pedidoId} eliminado ✓`);
      setTimeout(() => setToastMsg(''), 4000);
      setModalEliminar(null);
      cargarPedidos();
    } catch (e) {
      setModalEliminar(null);
      setError('Error al eliminar: ' + (e?.message ?? 'desconocido'));
    } finally {
      setEliminando(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────
  if (loading) return <Loader message="Cargando historial…" />;

  return (
    <div className="p-4 space-y-3">

      {/* Toast de éxito */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-green-600 text-white
                        text-sm font-semibold px-5 py-2.5 rounded-full shadow-lg
                        pointer-events-none whitespace-nowrap">
          {toastMsg}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={cargarPedidos} className="underline ml-2 shrink-0">Reintentar</button>
        </div>
      )}

      {/* Sin pedidos */}
      {!error && pedidos.length === 0 && (
        <div className="text-center text-slate-400 text-sm py-16">
          <p className="text-4xl mb-3">📂</p>
          <p>Sin pedidos registrados</p>
        </div>
      )}

      {/* Lista de pedidos */}
      {pedidos.map((p, idx) => {
        // Nota: puede venir como Notas, notas o notasPedido
        const nota = p.Notas ?? p.notas ?? p.notasPedido ?? '';
        return (
          <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden">

            {/* Cabecera (acordeón) */}
            <button
              onClick={() => setExpandido(expandido === idx ? null : idx)}
              className="w-full text-left px-4 py-3 flex items-center justify-between active:bg-slate-50"
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm text-slate-800 truncate">
                  {p.clienteNombre || p.clienteId || '—'}
                </div>
                <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                  <span>{formatDatetime(p.fecha)} · {p.totalItems ?? 0} u.</span>
                  <BadgePago estado={p.estadoPago} />
                  {p.editadoPor && (
                    <span className="text-xs text-orange-500 font-medium">✏️ editado</span>
                  )}
                </div>
              </div>
              <span className="text-slate-400 text-xs ml-2 shrink-0">
                {expandido === idx ? '▲' : '▼'}
              </span>
            </button>

            {/* Ítems expandidos */}
            {expandido === idx && (
              <div className="border-t border-slate-100 px-4 py-2 space-y-1">

                {/* NUEVO: nota del pedido */}
                {nota && (
                  <div className="flex items-start gap-1.5 text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 mb-2">
                    <span>📝</span>
                    <span>{nota}</span>
                  </div>
                )}

                {(p.items ?? []).length === 0 ? (
                  <p className="text-xs text-slate-400 py-1">Sin detalle disponible</p>
                ) : (
                  (p.items ?? []).map((it, i) => (
                    <div key={i} className="flex justify-between text-xs text-slate-600 py-0.5">
                      <span>
                        {it.fragancia ?? it.Fragancia ?? '—'}
                        <span className="text-slate-400 ml-1">
                          ({it.producto ?? it.Producto ?? '—'})
                        </span>
                      </span>
                      <span className="font-medium">{it.cantidad ?? it.Cantidad ?? 0}</span>
                    </div>
                  ))
                )}

                {/* Totales (solo ADMIN) */}
                {esAdmin && (p.totalSheru > 0 || p.totalCliente > 0) && (
                  <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between text-xs text-slate-500">
                    <span>Sheru: <strong>${p.totalSheru?.toLocaleString('es-AR')}</strong></span>
                    <span>Cliente: <strong className="text-green-700">${p.totalCliente?.toLocaleString('es-AR')}</strong></span>
                  </div>
                )}

                {/* Botones ADMIN */}
                {esAdmin && (
                  <div className="mt-3 pt-2 border-t border-slate-100 flex justify-end gap-2">
                    <button
                      onClick={() => navigate(`/editar/${p.pedidoId}`)}
                      className="text-xs font-semibold bg-blue-50 text-blue-700
                                 px-3 py-1.5 rounded-lg active:bg-blue-100"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => abrirModalEliminar(p)}
                      className="text-xs font-semibold bg-red-50 text-red-700
                                 px-3 py-1.5 rounded-lg active:bg-red-100"
                    >
                      🗑️ Eliminar
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Modal confirmación eliminación */}
      {modalEliminar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-5">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <p className="text-3xl text-center mb-2">🗑️</p>
            <h3 className="text-center font-bold text-lg mb-1">Eliminar pedido</h3>
            <p className="text-center text-slate-500 text-sm mb-4">
              El pedido se moverá al archivo. Esta acción no se puede deshacer desde la app.
            </p>
            <div className="bg-red-50 text-red-700 text-sm font-medium rounded-xl px-4 py-2.5 mb-5">
              {modalEliminar.resumen}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setModalEliminar(null)}
                disabled={eliminando}
                className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700
                           font-medium text-sm active:bg-slate-200 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarEliminar}
                disabled={eliminando}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white
                           font-bold text-sm active:bg-red-700 disabled:opacity-50"
              >
                {eliminando ? '⏳ Eliminando…' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
