/**
 * Consolidado.jsx — v2 (Sprint D)
 * Consolidado Sheru con filtro de fechas y agrupado por tipo de producto.
 *
 * Cambios vs v1:
 * - Selector fecha inicio / fecha fin (default: últimos 7 días)
 * - Re-fetch automático al cambiar rango
 * - Ítems agrupados por tipo de producto con subtotal por grupo
 * - Botón "Copiar lista" mantiene formato plano listo para Sheru
 */
import { useEffect, useState, useMemo } from 'react';
import { obtenerConsolidado } from '../api/appsScript.js';
import Loader from '../components/ui/Loader.jsx';
import Badge from '../components/ui/Badge.jsx';
import { getProductoMeta } from '../utils/formatters.js';

// ─── Helpers de fecha ────────────────────────────────────────────────────────

/** Devuelve 'yyyy-MM-dd' de hoy en hora local */
function fechaHoy() {
  const d = new Date();
  const y  = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

/** Devuelve 'yyyy-MM-dd' de hace N días en hora local */
function fechaHaceNDias(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const y  = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

/** Fecha mínima permitida: 1 mes atrás */
function fechaMinima() {
  return fechaHaceNDias(31);
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function Consolidado() {
  const hoy = fechaHoy();

  const [fechaDesde, setFechaDesde] = useState(fechaHaceNDias(7));
  const [fechaHasta, setFechaHasta] = useState(hoy);
  const [items,      setItems]      = useState([]);
  const [loading,    setLoad]       = useState(true);
  const [error,      setError]      = useState(null);
  const [copiado,    setCopiado]    = useState(false);

  // Re-fetch cada vez que cambia el rango
  useEffect(() => {
    setLoad(true);
    setError(null);
    obtenerConsolidado(fechaDesde, fechaHasta)
      .then(res => setItems(res?.datos ?? []))
      .catch(e  => setError(e.message))
      .finally(() => setLoad(false));
  }, [fechaDesde, fechaHasta]);

  // ── Agrupado por tipo de producto ──────────────────────────────────────────
  const grupos = useMemo(() => {
    const map = {};
    items.forEach(it => {
      const meta  = getProductoMeta(it.producto);
      const clave = meta.label; // ej: 'Aerosol', 'Difusor', etc.
      if (!map[clave]) {
        map[clave] = { meta, items: [], subtotal: 0 };
      }
      map[clave].items.push(it);
      map[clave].subtotal += it.cantidad ?? 0;
    });
    // Ordenar grupos por subtotal desc, ítems dentro por cantidad desc
    return Object.values(map)
      .sort((a, b) => b.subtotal - a.subtotal)
      .map(g => ({
        ...g,
        items: [...g.items].sort((a, b) => b.cantidad - a.cantidad),
      }));
  }, [items]);

  const totalUnidades = items.reduce((s, it) => s + (it.cantidad ?? 0), 0);

  // ── Texto para copiar (plano, agrupado por tipo) ───────────────────────────
  const copiarTexto = () => {
    const lineas = grupos.flatMap(g => [
      `— ${g.meta.label.toUpperCase()} (${g.subtotal} uds) —`,
      ...g.items.map(it => `${it.cantidad}x ${it.fragancia} (${it.producto})`),
    ]);
    const texto = lineas.join('\n');
    navigator.clipboard.writeText(texto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  // ── Handlers de fecha con validación ──────────────────────────────────────
  const handleDesde = e => {
    const val = e.target.value;
    if (val > fechaHasta) return; // no permitir inicio > fin
    setFechaDesde(val);
  };

  const handleHasta = e => {
    const val = e.target.value;
    if (val < fechaDesde) return; // no permitir fin < inicio
    setFechaHasta(val);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 space-y-4">

      {/* Filtro de fechas */}
      <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 space-y-2">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Rango de fechas</p>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-xs text-slate-500 block mb-1">Desde</label>
            <input
              type="date"
              value={fechaDesde}
              min={fechaMinima()}
              max={fechaHasta}
              onChange={handleDesde}
              className="w-full text-sm border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div className="flex-1">
            <label className="text-xs text-slate-500 block mb-1">Hasta</label>
            <input
              type="date"
              value={fechaHasta}
              min={fechaDesde}
              max={hoy}
              onChange={handleHasta}
              className="w-full text-sm border border-slate-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>
      </div>

      {/* Resumen + botón copiar */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-500">
          <span className="font-semibold text-slate-800">{items.length}</span> productos ·{' '}
          <span className="font-semibold text-slate-800">{totalUnidades}</span> unidades
        </div>
        <button
          onClick={copiarTexto}
          disabled={items.length === 0}
          className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40 ${
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

      {/* Estado de carga */}
      {loading ? (
        <Loader message="Cargando consolidado…" />
      ) : items.length === 0 ? (
        <div className="text-center text-slate-400 text-sm py-16">
          <p className="text-4xl mb-3">📦</p>
          <p>Sin ítems para el rango seleccionado</p>
        </div>
      ) : (
        /* Lista agrupada por tipo */
        <div className="space-y-4">
          {grupos.map(grupo => (
            <div key={grupo.meta.label}>
              {/* Cabecera del grupo */}
              <div className="flex items-center gap-2 mb-2 px-1">
                <span className="text-lg">{grupo.meta.emoji}</span>
                <span className="text-sm font-semibold text-slate-700">{grupo.meta.label}</span>
                <span className="ml-auto text-xs font-semibold text-slate-500 bg-slate-100 rounded-full px-2 py-0.5">
                  {grupo.subtotal} uds
                </span>
              </div>

              {/* Ítems del grupo */}
              <ul className="space-y-2">
                {grupo.items.map((it, idx) => (
                  <li
                    key={idx}
                    className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-slate-800">{it.fragancia}</div>
                      <Badge className={`${grupo.meta.color} mt-0.5`}>{grupo.meta.label}</Badge>
                    </div>
                    <div className="text-xl font-bold text-brand-700 shrink-0">{it.cantidad}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
