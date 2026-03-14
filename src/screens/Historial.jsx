/**
 * Historial.jsx
 * Lista todos los pedidos guardados ordenados por fecha desc.
 */
import { useEffect, useState } from 'react';
import { obtenerPedidos } from '../api/appsScript.js';
import Loader from '../components/ui/Loader.jsx';
import { formatDatetime } from '../utils/formatters.js';

export default function Historial() {
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoad]    = useState(true);
  const [error, setError]     = useState(null);
  const [expandido, setExpandido] = useState(null);

  useEffect(() => {
    obtenerPedidos()
      .then(res => setPedidos((res?.datos ?? []).reverse()))
      .catch(e  => setError(e.message))
      .finally(() => setLoad(false));
  }, []);

  if (loading) return <Loader message="Cargando historial…" />;

  return (
    <div className="p-4 space-y-3">
      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {pedidos.length === 0 ? (
        <div className="text-center text-slate-400 text-sm py-16">
          <p className="text-4xl mb-3">📂</p>
          <p>Sin pedidos registrados</p>
        </div>
      ) : (
        pedidos.map((p, idx) => (
          <div key={idx} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {/* Cabecera del pedido */}
            <button
              onClick={() => setExpandido(expandido === idx ? null : idx)}
              className="w-full text-left px-4 py-3 flex items-center justify-between"
            >
              <div>
                <div className="font-medium text-sm text-slate-800">{p.clienteNombre ?? p.clienteId}</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {formatDatetime(p.fecha)} · {p.totalItems ?? '?'} items
                </div>
              </div>
              <span className="text-slate-400 text-xs">{expandido === idx ? '▲' : '▼'}</span>
            </button>

            {/* Items expandidos */}
            {expandido === idx && p.items && (
              <div className="border-t border-slate-100 px-4 py-2 space-y-1">
                {p.items.map((it, i) => (
                  <div key={i} className="flex justify-between text-xs text-slate-600 py-0.5">
                    <span>{it.fragancia} <span className="text-slate-400">({it.producto})</span></span>
                    <span className="font-medium">{it.cantidad}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
