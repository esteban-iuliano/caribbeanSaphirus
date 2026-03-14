import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/',            icon: '🏠', label: 'Inicio' },
  { to: '/nuevo',       icon: '➕', label: 'Nuevo' },
  { to: '/formulario',  icon: '📝', label: 'Formulario' },
  { to: '/consolidado', icon: '📋', label: 'Sheru' },
  { to: '/historial',   icon: '📂', label: 'Historial' },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-slate-200 z-20 bottom-nav-height">
      <ul className="grid grid-cols-5 h-16">
        {NAV_ITEMS.map(({ to, icon, label }) => (
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
