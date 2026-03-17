/**
 * Inicio.jsx
 * Pantalla principal: resumen del día + estado del backend.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { obtenerPedidos } from '../api/appsScript.js';
import Loader from '../components/ui/Loader.jsx';

// Convierte cualquier formato de fecha a "yyyy-mm-dd" en hora local
function toLocalDateStr(val) {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d)) return val.toString().substring(0, 10);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function hoyStr() {
  return toLocalDateStr(new Date());
}

export default function Inicio() {
  const { state } = useApp();
  const navigate  = useNavigate();
  const [pedidos, setPedidos]               = useState([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);
  const [errorPedidos, setErrorPedidos]     = useState(null);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setLoadingPedidos(false);
      setErrorPedidos('El servidor tardó demasiado. Reintentá más tarde.');
    }, 15000);

    obtenerPedidos()
      .then(res => setPedidos(res?.datos ?? []))
      .catch(e  => setErrorPedidos(e.message))
      .finally(() => { clearTimeout(timeout); setLoadingPedidos(false); });

    return () => clearTimeout(timeout);
  }, []);

  const hoy = new Date().toLocaleDateString('es-AR', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const pedidosHoy = pedidos.filter(p => toLocalDateStr(p.fecha) === hoyStr());

  return (
    <div className="p-4 space-y-4">
      {/* Fecha */}
      <div className="text-sm text-slate-500 capitalize">{hoy}</div>

      {/* Estado backend */}
      <div className={`rounded-xl p-3 text-sm font-medium flex items-center gap-2 ${
        state.backendOk === null ? 'bg-yellow-50 text-yellow-700' :
        state.backendOk          ? 'bg-emerald-50 text-emerald-700' :
                                   'bg-red-50 text-red-700'
      }`}>
        <span>{state.backendOk === null ? '⏳' : state.backendOk ? '✅' : '❌'}</span>
        <span>
          {state.backendOk === null ? 'Verificando conexión…' :
           state.backendOk          ? 'Backend conectado' :
                                      'Sin conexión al backend'}
        </span>
      </div>

      {/* Botón nuevo pedido */}
      <button
        onClick={() => navigate('/nuevo')}
        className="w-full bg-brand-700 hover:bg-brand-800 active:bg-brand-900 text-white font-semibold py-4 rounded-2xl text-lg transition-colors shadow-md"
      >
        ➕ Nuevo Pedido
      </button>

      {/* Resumen del día */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <h2 className="font-semibold text-slate-700 mb-3">Pedidos de hoy</h2>

        {loadingPedidos ? (
          <Loader message="Cargando pedidos…" />
        ) : errorPedidos ? (
          <p className="text-red-400 text-sm text-center py-4">{errorPedidos}</p>
        ) : pedidosHoy.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">Sin pedidos por hoy</p>
        ) : (
          <ul className="space-y-2">
            {pedidosHoy.map((p, i) => {
              // Nota: puede venir como Notas, notas o notasPedido según normalización
              const nota = p.Notas ?? p.notas ?? p.notasPedido ?? '';
              return (
                <li key={i} className="text-sm border-b border-slate-50 last:border-0 pb-2 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">
                      {p.clienteNombre || p.clienteId}
                    </span>
                    <span className="text-slate-400">{p.totalItems} u.</span>
                  </div>
                  {/* NUEVO: mostrar nota si existe */}
                  {nota && (
                    <div className="text-xs text-slate-500 mt-0.5 flex items-start gap-1">
                      <span>📝</span>
                      <span className="truncate">{nota}</span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/consolidado')}
          className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm active:bg-slate-50"
        >
          <div className="text-2xl mb-1">📋</div>
          <div className="text-xs font-medium text-slate-600">Consolidado Sheru</div>
        </button>
        <button
          onClick={() => navigate('/historial')}
          className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm active:bg-slate-50"
        >
          <div className="text-2xl mb-1">📂</div>
          <div className="text-xs font-medium text-slate-600">Historial</div>
        </button>
      </div>
    </div>
  );
}
