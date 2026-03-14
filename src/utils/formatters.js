/**
 * formatters.js
 * Utilidades de presentación reutilizables en toda la app.
 */

// ─── Fechas ───────────────────────────────────────────────────────────────────

const DATE_FMT = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit', month: '2-digit', year: 'numeric',
});

const DATETIME_FMT = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit', month: '2-digit', year: 'numeric',
  hour: '2-digit', minute: '2-digit',
});

export const formatDate     = (d) => DATE_FMT.format(new Date(d));
export const formatDatetime = (d) => DATETIME_FMT.format(new Date(d));

// ─── Precios ──────────────────────────────────────────────────────────────────

const PRICE_FMT = new Intl.NumberFormat('es-AR', {
  style: 'currency', currency: 'ARS', maximumFractionDigits: 0,
});

export const formatPrice = (n) => PRICE_FMT.format(n);

// ─── Productos ────────────────────────────────────────────────────────────────

/**
 * Retorna { emoji, label, color } para cada tipo de producto.
 * "color" son clases Tailwind para badge.
 */
export const PRODUCTO_META = {
  aerosol:    { emoji: '💨', label: 'Aerosol',     color: 'bg-blue-100 text-blue-800' },
  difusor:    { emoji: '🌿', label: 'Difusor',     color: 'bg-green-100 text-green-800' },
  textil:     { emoji: '👕', label: 'Textil',      color: 'bg-purple-100 text-purple-800' },
  shiny:      { emoji: '🚗', label: 'Shiny',       color: 'bg-amber-100 text-amber-800' },
  antihumedad:{ emoji: '💧', label: 'Antihumedad', color: 'bg-cyan-100 text-cyan-800' },
  touch:      { emoji: '🔌', label: 'Touch',       color: 'bg-orange-100 text-orange-800' },
};

export const getProductoMeta = (tipo) =>
  PRODUCTO_META[tipo?.toLowerCase()] ?? { emoji: '📦', label: tipo ?? '?', color: 'bg-slate-100 text-slate-700' };

// ─── Flags de parser ──────────────────────────────────────────────────────────

export const FLAG_META = {
  OK:      { color: 'bg-emerald-100 text-emerald-800', label: 'OK' },
  NUEVA:   { color: 'bg-blue-100 text-blue-700',    label: 'NUEVA' },
  REVISAR: { color: 'bg-yellow-100 text-yellow-800', label: 'REVISAR' },
  QUEMA:   { color: 'bg-red-100 text-red-800',      label: 'QUEMA' },
};

export const getFlagMeta = (flag) =>
  FLAG_META[flag?.toUpperCase()] ?? { color: 'bg-slate-100 text-slate-600', label: flag ?? '?' };

// ─── Segmentos / markups ──────────────────────────────────────────────────────

export const MARKUPS = {
  CHINOS:       1.095,
  PEPE:         1.11,
  VALENTINA:    1.14,
  '120_UNIDADES': 1.196,
  ANALIA:       1.196,
  LUKY:         1.20,
};
