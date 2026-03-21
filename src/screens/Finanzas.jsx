/**
 * Finanzas.jsx — Sprint E v2
 * Módulo financiero. Solo ADMIN.
 *
 * Novedades v2:
 *   - Selector de vendedor (filtra clientes y recalcula resumen)
 *   - Botón copiar resumen → texto formateado para WhatsApp
 *
 * Solo lectura — no marca pagos desde esta pantalla.
 */

import { useEffect, useState, useCallback, useMemo } from 'react';
import { obtenerFinanzas } from '../api/appsScript.js';
import Loader from '../components/ui/Loader.jsx';

// ─── Helpers de fecha ─────────────────────────────────────────────────────────

function toInputDate(d) {
  const y   = d.getFullYear();
  const m   = String(d.getMonth() + 1).padStart(2, '0');
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

function formatFechaCorta(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-');
  return `${d}/${m}`;
}

// ─── Formateo de pesos ────────────────────────────────────────────────────────

function formatPeso(n) {
  if (n == null || isNaN(Number(n))) return '—';
  return new Intl.NumberFormat('es-AR', {
    style:                 'currency',
    currency:              'ARS',
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

function TablaVendedores({ vendedores, vendedorFiltro }) {
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
            <tr
              key={i}
              className={`text-slate-700 ${vendedorFiltro === v.vendedor ? 'bg-brand-50' : ''}`}
            >
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
  const [desde,          setDesde]          = useState(hace7Dias());
  const [hasta,          setHasta]          = useState(hoy());
  const [vendedorFiltro, setVendedorFiltro] = useState('');   // '' = todos
  const [datos,          setDatos]          = useState(null);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState(null);
  const [copiado,        setCopiado]        = useState(false);

  const cargar = useCallback(() => {
    if (!desde || !hasta) return;
    setLoading(true);
    setError(null);
    setVendedorFiltro(''); // resetear filtro vendedor al recargar fechas
    obtenerFinanzas(desde, hasta)
      .then(res => setDatos(res))
      .catch(e  => setError(e.message ?? 'Error al cargar finanzas'))
      .finally(() => setLoading(false));
  }, [desde, hasta]);

  useEffect(() => { cargar(); }, [cargar]);

  // ─── Lista de vendedores disponibles en el período ────────────
  const vendedoresDisponibles = useMemo(() => {
    if (!datos?.por_vendedor) return [];
    return datos.por_vendedor
      .filter(v => v.vendedor && v.vendedor.trim() !== '')
      .map(v => v.vendedor);
  }, [datos]);

  // ─── Clientes filtrados por vendedor ─────────────────────────
  // Requiere que el backend incluya campo `vendedor` en cada entrada de por_cliente
  const clientesFiltrados = useMemo(() => {
    if (!datos?.por_cliente) return [];
    if (!vendedorFiltro) return datos.por_cliente;
    return datos.por_cliente.filter(c =>
      (c.vendedor || '').toLowerCase().trim() === vendedorFiltro.toLowerCase().trim()
    );
  }, [datos, vendedorFiltro]);

  // ─── Resumen recalculado según filtro ─────────────────────────
  const resumen = useMemo(() => {
    if (!datos) return null;
    if (!vendedorFiltro) return datos.resumen;
    // Recalcular desde clientes filtrados
    const totCliente = clientesFiltrados.reduce((s, c) => s + Number(c.total_cliente), 0);
    const totSheru   = clientesFiltrados.reduce((s, c) => s + Number(c.total_sheru),   0);
    const pendiente  = clientesFiltrados.reduce((s, c) => s + Number(c.pendiente),     0);
    const count      = clientesFiltrados.reduce((s, c) => s + Number(c.pedidos),       0);
    const r = v => Math.round(v * 100) / 100;
    return {
      total_cliente: r(totCliente),
      total_sheru:   r(totSheru),
      margen:        r(totCliente - totSheru),
      pendiente:     r(pendiente),
      pedidos_count: count,
    };
  }, [datos, vendedorFiltro, clientesFiltrados]);

  const margen = resumen ? (Number(resumen.total_cliente) - Number(resumen.total_sheru)) : 0;

  // ─── Generar texto para copiar ────────────────────────────────
  const generarResumen = () => {
    if (!datos || !resumen) return '';

    const labelVendedor = vendedorFiltro
      ? `👤 Vendedor: ${vendedorFiltro}`
      : '👥 Todos los vendedores';

    const pct = resumen.total_cliente > 0
      ? ` (${((margen / resumen.total_cliente) * 100).toFixed(1)}%)`
      : '';

    const lineasClientes = clientesFiltrados
      .map(c => {
        const pendiente = Number(c.pendiente);
        const semaforo  = pendiente > 0 ? '🟠' : '🟢';
        const pendStr   = pendiente > 0
          ? ` — debe ${formatPeso(pendiente)}`
          : ' — al día ✓';
        return `${semaforo} ${c.nombre || c.id}: ${formatPeso(c.total_cliente)}${pendStr}`;
      })
      .join('\n');

    return [
      `💰 *Finanzas CaribbeanSaphirus*`,
      `📅 ${formatFechaCorta(desde)} al ${formatFechaCorta(hasta)}/${hasta.split('-')[0]}`,
      labelVendedor,
      ``,
      `📊 *Resumen · ${resumen.pedidos_count} pedido${resumen.pedidos_count !== 1 ? 's' : ''}*`,
      `Facturado clientes: ${formatPeso(resumen.total_cliente)}`,
      `Pagado a Sheru: ${formatPeso(resumen.total_sheru)}`,
      `Margen: ${formatPeso(margen)}${pct}`,
      `Pendiente de cobro: ${formatPeso(resumen.pendiente)}`,
      ``,
      `👥 *Por cliente*`,
      lineasClientes || '—',
    ].join('\n');
  };

  const copiarResumen = async () => {
    const texto = generarResumen();
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      // Fallback para Safari/iOS
      const ta = document.createElement('textarea');
      ta.value = texto;
      ta.style.position = 'fixed';
      ta.style.opacity  = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  // ─── Render ───────────────────────────────────────────────────

  return (
    <div className="p-4 space-y-5 pb-24">

      {/* Título */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">💰 Finanzas</h1>
        <p className="text-xs text-slate-400 mt-0.5">Solo lectura · Solo ADMIN</p>
      </div>

      {/* Filtros: fechas + vendedor */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
        <h2 className="font-semibold text-slate-700 text-sm">Filtros</h2>

        {/* Fechas */}
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

        {/* Selector de vendedor — aparece solo cuando hay datos */}
        {vendedoresDisponibles.length > 0 && (
          <div>
            <label className="block text-xs text-slate-500 mb-1">Vendedor</label>
            <select
              value={vendedorFiltro}
              onChange={e => setVendedorFiltro(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              <option value="">Todos los vendedores</option>
              {vendedoresDisponibles.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Estado de carga / error */}
      {loading && <Loader message="Cargando finanzas…" />}

      {error && (
        <div className="bg-red-50 text-red-600 rounded-xl p-4 text-sm text-center">
          {error}
          <button onClick={cargar} className="block mx-auto mt-2 text-xs underline">
            Reintentar
          </button>
        </div>
      )}

      {!loading && !error && datos && (
        <>
          {/* Resumen */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-700 text-sm">
                {vendedorFiltro
                  ? `${vendedorFiltro} · ${resumen?.pedidos_count ?? 0} pedido${resumen?.pedidos_count !== 1 ? 's' : ''}`
                  : `Resumen · ${resumen?.pedidos_count ?? 0} pedido${resumen?.pedidos_count !== 1 ? 's' : ''}`
                }
              </h2>
              {/* Botón copiar */}
              <button
                onClick={copiarResumen}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                  copiado
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-white text-slate-600 border-slate-200 active:bg-slate-50'
                }`}
              >
                <span>{copiado ? '✓' : '📋'}</span>
                <span>{copiado ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>

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
            <h2 className="font-semibold text-slate-700 text-sm">
              Por cliente
              {vendedorFiltro && (
                <span className="ml-2 text-xs font-normal text-brand-500">· {vendedorFiltro}</span>
              )}
            </h2>
            <TablaClientes clientes={clientesFiltrados} />
          </div>

          {/* Por vendedor — siempre muestra todos, resalta el filtrado */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3">
            <h2 className="font-semibold text-slate-700 text-sm">Por vendedor</h2>
            <TablaVendedores
              vendedores={datos.por_vendedor}
              vendedorFiltro={vendedorFiltro}
            />
          </div>
        </>
      )}
    </div>
  );
}
