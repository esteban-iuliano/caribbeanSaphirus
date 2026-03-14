/**
 * Historial.jsx
 * Lista todos los pedidos guardados ordenados por fecha desc.
 */
import { useEffect, useState } from 'react';
import { obtenerPedidos } from '../api/appsScript.js';
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

export default function Historial() {
  const [pedidos, setPedidos]   = useState([]);
  const [loading, setLoad]      = useState(true);
  const [error, setError]       = useState(null);
  const [expandido, setExpandido] = useState(null);

  useEffect(() => {
    // Timeout de seguridad: 15 segundos
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
  }, []);

  const reintentar = () => {
    setLoad(true);
    setError(null);
    obtenerPedidos()
      .then(res => setPedidos((res?.datos ?? []).slice().reverse()))
      .catch(e => setError(e?.message ?? 'Error al cargar historial'))
      .finally(() => setLoad(false));
  };

  if (loading) return <Loader message="Cargando historial…" />;

  return (
    <div className="p-4 space-y-3">

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={reintentar} className="underline ml-2 shrink-0">Reintentar</button>
        </div>
      )}

      {!error && pedidos.length === 0 && (
        <div className="text-center text-slate-400 text-sm py-16">
          <p className="text-4xl mb-3">📂</p>
          <p>Sin pedidos registrados</p>
        </div>
      )}

      {pedidos.map((p, idx) => (
        <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          {/* Cabecera */}
          <button
            onClick={() => setExpandido(expandido === idx ? null : idx)}
            className="w-full text-left px-4 py-3 flex items-center justify-between active:bg-slate-50"
          >
            <div>
              <div className="font-medium text-sm text-slate-800">
                {p.clienteNombre || p.clienteId || '—'}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {formatDatetime(p.fecha)} · {p.totalItems ?? 0} u.
              </div>
            </div>
            <span className="text-slate-400 text-xs ml-2">{expandido === idx ? '▲' : '▼'}</span>
          </button>

          {/* Items expandidos */}
          {expandido === idx && (
            <div className="border-t border-slate-100 px-4 py-2 space-y-1">
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
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
