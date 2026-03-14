/**
 * Consolidado.jsx
 * Muestra todos los items pendientes agrupados por producto+fragancia.
 * Botón de copiar para pegar en el sistema de Sheru.
 */
import { useEffect, useState } from 'react';
import { obtenerConsolidado } from '../api/appsScript.js';
import Loader from '../components/ui/Loader.jsx';
import Badge from '../components/ui/Badge.jsx';
import { getProductoMeta } from '../utils/formatters.js';

export default function Consolidado() {
  const [items, setItems]   = useState([]);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState(null);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    obtenerConsolidado()
      .then(res => setItems(res?.datos ?? []))
      .catch(e  => setError(e.message))
      .finally(() => setLoad(false));
  }, []);

  const totalUnidades = items.reduce((s, it) => s + (it.cantidad ?? 0), 0);

  const copiarTexto = () => {
    const lineas = items.map(it => `${it.cantidad}x ${it.fragancia} (${it.producto})`).join('\n');
    navigator.clipboard.writeText(lineas).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  if (loading) return <Loader message="Cargando consolidado…" />;

  return (
    <div className="p-4 space-y-4">
      {/* Resumen */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">
          <span className="font-semibold text-slate-800">{items.length}</span> productos ·{' '}
          <span className="font-semibold text-slate-800">{totalUnidades}</span> unidades
        </div>
        <button
          onClick={copiarTexto}
          className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
            copiado
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-brand-100 text-brand-700 hover:bg-brand-200'
          }`}
        >
          {copiado ? '✅ Copiado' : '📋 Copiar lista'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
      )}

      {/* Lista consolidada */}
      {items.length === 0 ? (
        <div className="text-center text-slate-400 text-sm py-16">
          <p className="text-4xl mb-3">📦</p>
          <p>Sin items pendientes para Sheru</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((it, idx) => {
            const prod = getProductoMeta(it.producto);
            return (
              <li key={idx} className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <span className="text-2xl w-8 text-center">{prod.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-slate-800">{it.fragancia}</div>
                  <Badge className={`${prod.color} mt-0.5`}>{prod.label}</Badge>
                </div>
                <div className="text-xl font-bold text-brand-700 shrink-0">{it.cantidad}</div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
