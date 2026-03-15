import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

// Definición completa de ítems con restricción de rol
// requiredRole: null → cualquier usuario autenticado
//               'ADMIN' → solo ADMIN
const ALL_NAV_ITEMS = [
  { to: '/',            icon: '🏠', label: 'Inicio',     requiredRole: null },
  { to: '/nuevo',       icon: '➕', label: 'Nuevo',      requiredRole: 'ADMIN' },
  { to: '/formulario',  icon: '📝', label: 'Formulario', requiredRole: null },
  { to: '/consolidado', icon: '📋', label: 'Sheru',      requiredRole: 'ADMIN' },
  { to: '/historial',   icon: '📂', label: 'Historial',  requiredRole: null },
];

export default function BottomNav() {
  const { user } = useAuth();

  // Filtrar ítems según rol del usuario
  const navItems = ALL_NAV_ITEMS.filter(item =>
    item.requiredRole === null || user?.rol === item.requiredRole
  );

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-200 z-20 bottom-nav-height">
      <ul className={`grid h-16`} style={{ gridTemplateColumns: `repeat(${navItems.length}, 1fr)` }}>
        {navItems.map(({ to, icon, label }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center h-full gap-0.5 text-xs transition-colors ${
                  isActive
                    ? 'text-brand-700 font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`
              }
            >
              <span className="text-xl leading-none">{icon}</span>
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
