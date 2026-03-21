/**
 * Finanzas.jsx — Sprint E
 * Módulo financiero. Solo ADMIN.
 *
 * Secciones:
 *   1. Selector de rango de fechas (default: últimos 7 días)
 *   2. Resumen general (total_cliente, total_sheru, margen, pendiente, pedidos_count)
 *   3. Por cliente (tabla con semáforo 🟠/🟢)
 *   4. Por vendedor (tabla, aviso si vacío)
 *
 * Solo lectura — no marca pagos desde esta pantalla.
 */

import { useEffect, useState, useCallback } from 'react';
import { obtenerFinanzas } from '../api/appsScript.js';
import Loader from '../components/ui/Loader.jsx';

// ─── Helpers de fecha ─────────────────────────────────────────────────────────

function toInputDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function hace7Dias() {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return toInputDate(d);
}

function hoy() {
  return toInputDate(new Date());
}

// ─── Formateo ─────────────────────────────────────────────────────────────────

function formatPeso(n) {
  if (n == null || isNaN(Number(n))) return '—';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(n));
}

// ─── Componentes internos ─────────────────────────────────────────────────────

function TarjetaResumen({ label, valor, sub, colorClass }) {
  return (
    <div className={`rounded-xl p-3 ${colorClass}`}>
      <div className="text-xs font-medium opacity-70 mb-0.5">{label}</div>
      <div className="text-lg font-bold leading-tight">{valor}</div>
      {sub && <div className="text-xs opacity-60 mt-0.5">{sub}</div>}
    </div>
  );
}

function TablaClientes({ clientes }) {
  if (!clientes || clientes.length === 0) {
    return (
      <p className="text-slate-400 text-sm text-center py-4">
        Sin datos de clientes para el período
      </p>
    );
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-slate-400 border-b border-slate-100">
            <th className="text-left pb-2 pl-1 font-medium">Cliente</th>
            <th className="text-right pb-2 font-medium">Total</th>
            <th className="text-right pb-2 font-medium">Pendiente</th>
            <th className="text-right pb-2 pr-1 font-medium">Ped.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {clientes.map((c, i) => {
            const tienePendiente = Number(c.pendiente) > 0;
            return (
              <tr key={i} className="text-slate-700">
                <td className="py-2 pl-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base leading-none">
                      {tienePendiente ? '🟠' : '🟢'}
                    </span>
                    <span className="font-medium truncate max-w-[110px]">
                      {c.nombre || c.id}
                    </span>
                  </div>
                </td>
                <td className="py-2 text-right font-medium text-slate-800">
                  {formatPeso(c.total_cliente)}
                </td>
                <td className={`py-2 text-right font-medium ${tienePendiente ? 'text-orange-600' : 'text-emerald-600'}`}>
                  {tienePendiente ? formatPeso(c.pendiente) : '✓'}
                </td>
                <td className="py-2 text-right pr-1 text-slate-400">
                  {c.pedidos}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function TablaVendedores({ vendedores }) {
  const validos = (vendedores ?? []).filter(v => v.vendedor && v.vendedor.trim() !== '');

  if (validos.length === 0) {
    return (
      <p className="text-slate-400 text-sm text-center py-4">
        Sin datos de vendedores para el período
      </p>
    );
  }

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-slate-400 border-b border-slate-100">
            <th className="text-left pb-2 pl-1 font-medium">Vendedor</th>
            <th className="text-right pb-2 font-medium">Cliente</th>
            <th className="text-right pb-2 font-medium">Sheru</th>
            <th className="text-right pb-2 pr-1 font-medium">Ped.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {validos.map((v, i) => (
            <tr key={i} className="text-slate-700">
              <td className="py-2 pl-1 font-medium truncate max-w-[90px]">{v.vendedor}</td>
              <td className="py-2 text-right text-slate-800">{formatPeso(v.total_cliente)}</td>
              <td className="py-2 text-right text-slate-500">{formatPeso(v.total_sheru)}</td>
              <td className="py-2 text-right pr-1 text-slate-400">{v.pedidos}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function Finanzas() {
  const [desde, setDesde] = useState(hace7Dias());
  const [hasta, setHasta] = useState(hoy());
  const [datos, setDatos]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const cargar = useCallback(() => {
    if (!desde || !hasta) return;
    setLoading(true);
    setError(null);
    obtenerFinanzas(desde, hasta)
      .then(res => setDatos(res))
      .catch(e  => setError(e.message ?? 'Error al cargar finanzas'))
      .finally(() => setLoading(false));
  }, [desde, hasta]);

  // Carga automática al cambiar fechas
  useEffect(() => {
    cargar();
  }, [cargar]);

  const resumen = datos?.resumen ?? null;
  const margen  = resumen ? (Number(resumen.total_cliente) - Number(resumen.total_sheru)) : 0;

  return (
    <div className="p-4 space-y-5 pb-24">

      {/* Título */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">💰 Finanzas</h1>
        <p className="text-xs text-slate-400 mt-0.5">Solo lectura · Solo ADMIN</p>
      </div>

      {/* Selector de fechas */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        <h2 className="font-semibold text-slate-700 text-sm">Período</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Desde</label>
            <input
              type="date"
              value={desde}
              max={hasta}
              onChange={e => setDesde(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Hasta</label>
            <input
              type="date"
              value={hasta}
              min={desde}
              max={hoy()}
              onChange={e => setHasta(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>
      </div>

      {/* Estado de carga / error */}
      {loading && <Loader message="Cargando finanzas…" />}

      {error && (
        <div className="bg-red-50 text-red-600 rounded-xl p-4 text-sm text-center">
          {error}
          <button
            onClick={cargar}
            className="block mx-auto mt-2 text-xs underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && datos && (
        <>
          {/* Resumen general */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
            <h2 className="font-semibold text-slate-700 text-sm">
              Resumen · {resumen?.pedidos_count ?? 0} pedido{resumen?.pedidos_count !== 1 ? 's' : ''}
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <TarjetaResumen
                label="Facturado clientes"
                valor={formatPeso(resumen?.total_cliente)}
                colorClass="bg-brand-50 text-brand-800"
              />
              <TarjetaResumen
                label="Pagado a Sheru"
                valor={formatPeso(resumen?.total_sheru)}
                colorClass="bg-slate-50 text-slate-700"
              />
              <TarjetaResumen
                label="Margen bruto"
                valor={formatPeso(margen)}
                sub={resumen?.total_cliente > 0
                  ? `${((margen / resumen.total_cliente) * 100).toFixed(1)}% sobre ventas`
                  : undefined}
                colorClass="bg-emerald-50 text-emerald-800"
              />
              <TarjetaResumen
                label="Pendiente de cobro"
                valor={formatPeso(resumen?.pendiente)}
                colorClass={
                  Number(resumen?.pendiente) > 0
                    ? 'bg-orange-50 text-orange-700'
                    : 'bg-emerald-50 text-emerald-700'
                }
              />
            </div>
          </div>

          {/* Por cliente */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
            <h2 className="font-semibold text-slate-700 text-sm">Por cliente</h2>
            <TablaClientes clientes={datos.por_cliente} />
          </div>

          {/* Por vendedor */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
            <h2 className="font-semibold text-slate-700 text-sm">Por vendedor</h2>
            <TablaVendedores vendedores={datos.por_vendedor} />
          </div>
        </>
      )}
    </div>
  );
}
