import { useLocation } from 'react-router-dom';
import { useApp }  from '../../context/AppContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const TITLES = {
  '/':            'Inicio',
  '/nuevo':       'Nuevo Pedido',
  '/resultado':   'Resultado',
  '/consolidado': 'Consolidado Sheru',
  '/historial':   'Historial',
  '/formulario':  'Nuevo Pedido',
};

export default function Header() {
  const { pathname }  = useLocation();
  const { state }     = useApp();
  const { user, signOut } = useAuth();

  const title     = TITLES[pathname] ?? 'CaribbeanSaphirus';
  const backendOk = state.backendOk;

  return (
    <header className="sticky top-0 z-20 bg-brand-700 text-white shadow-md">
      <div className="flex items-center justify-between px-4 h-14">

        {/* Título de pantalla */}
        <span className="text-lg font-semibold tracking-tight">{title}</span>

        <div className="flex items-center gap-3">
          {/* Indicador backend */}
          <span
            title={
              backendOk === null ? 'Verificando…' :
              backendOk          ? 'Backend OK'   : 'Sin conexión'
            }
            className={`inline-block w-2 h-2 rounded-full transition-colors ${
              backendOk === null ? 'bg-yellow-400 animate-pulse' :
              backendOk          ? 'bg-emerald-400' :
                                   'bg-red-400'
            }`}
          />

          {/* Nombre + rol */}
          {user && (
            <span className="text-xs text-brand-200 hidden sm:inline">
              {user.nombre}
              <span className="ml-1 opacity-60">
                ({user.rol === 'ADMIN' ? 'admin' : 'vendedor'})
              </span>
            </span>
          )}

          {/* Botón cerrar sesión */}
          {user && (
            <button
              onClick={signOut}
              title="Cerrar sesión"
              className="text-brand-200 hover:text-white transition-colors text-base leading-none"
              aria-label="Cerrar sesión"
            >
              🚪
            </button>
          )}
        </div>
      </div>

      {/* Barra de cliente seleccionado */}
      {state.clienteSeleccionado && ['/nuevo', '/resultado'].includes(pathname) && (
        <div className="bg-brand-800 px-4 py-1.5 text-xs text-brand-100 flex items-center gap-1">
          <span>👤</span>
          <span className="font-medium">{state.clienteSeleccionado.nombre}</span>
          <span className="text-brand-300 ml-auto">{state.clienteSeleccionado.id}</span>
        </div>
      )}
    </header>
  );
}
