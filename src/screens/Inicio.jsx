/**
 * Inicio.jsx
 * Pantalla principal: resumen del día + estado del backend.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext.jsx';
import { obtenerPedidos } from '../api/appsScript.js';
import Loader from '../components/ui/Loader.jsx';
import { formatDate } from '../utils/formatters.js';

export default function Inicio() {
  const { state } = useApp();
  const navigate  = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [loadingPedidos, setLoadingPedidos] = useState(true);

  useEffect(() => {
    obtenerPedidos()
      .then(res => setPedidos(res?.datos ?? []))
      .catch(() => setPedidos([]))
      .finally(() => setLoadingPedidos(false));
  }, []);

  const hoy = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  const pedidosHoy = pedidos.filter(p => {
    const d = new Date(p.fecha);
    const n = new Date();
    return d.toDateString() === n.toDateString();
  });

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
        ) : pedidosHoy.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">Sin pedidos por hoy</p>
        ) : (
          <ul className="space-y-2">
            {pedidosHoy.map((p, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-700">{p.clienteNombre ?? p.clienteId}</span>
                <span className="text-slate-400">{p.totalItems} items · {formatDate(p.fecha)}</span>
              </li>
            ))}
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
