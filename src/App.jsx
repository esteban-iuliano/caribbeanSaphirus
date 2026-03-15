/**
 * App.jsx — Sprint C'
 *
 * ProtectedRoute maneja 3 casos:
 *   1. loading        → spinner (evita flash de redirect)
 *   2. sin sesión     → redirect a /login
 *   3. rol insuficiente → redirect a fallback (default "/")
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import BottomNav from './components/layout/BottomNav.jsx';
import Header from './components/layout/Header.jsx';
import Inicio from './screens/Inicio.jsx';
import NuevoPedido from './screens/NuevoPedido.jsx';
import Resultado from './screens/Resultado.jsx';
import Consolidado from './screens/Consolidado.jsx';
import Historial from './screens/Historial.jsx';
import FormularioVendedor from './screens/FormularioVendedor.jsx';
import Login from './screens/Login.jsx';
import EditarPedido from './screens/EditarPedido.jsx';

// ─── ProtectedRoute ───────────────────────────────────────────────────────────

/**
 * @param {ReactNode} children
 * @param {'ADMIN'|'VENDEDOR'|null} requiredRole
 *   null  → cualquier usuario autenticado puede acceder
 *   'ADMIN' → solo ADMIN
 * @param {string} fallback → ruta a la que redirigir si no tiene permiso
 */
function ProtectedRoute({ children, requiredRole = null, fallback = '/' }) {
  const { user, loading } = useAuth();

  // 1. Cargando sesión → spinner mínimo
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="inline-block w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 2. Sin sesión → al login
  if (!user) return <Navigate to="/login" replace />;

  // 3. Rol insuficiente → fallback
  if (requiredRole && user.rol !== requiredRole) {
    return <Navigate to={fallback} replace />;
  }

  return children;
}

// ─── App ─────────────────────────────────────────────────────────────────────

export default function App() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col h-full max-w-md mx-auto bg-white shadow-xl">

      {/* Header y BottomNav solo se muestran cuando hay sesión */}
      {user && <Header />}

      <main className="flex-1 overflow-y-auto pb-safe">
        <Routes>

          {/* ── Pública ── */}
          <Route path="/login" element={<Login />} />

          {/* ── Autenticadas — cualquier rol ── */}
          <Route path="/" element={
            <ProtectedRoute>
              <Inicio />
            </ProtectedRoute>
          } />

          <Route path="/formulario" element={
            <ProtectedRoute>
              <FormularioVendedor />
            </ProtectedRoute>
          } />

          <Route path="/resultado" element={
            <ProtectedRoute>
              <Resultado />
            </ProtectedRoute>
          } />

          <Route path="/historial" element={
            <ProtectedRoute>
              <Historial />
            </ProtectedRoute>
          } />

          {/* ── Solo ADMIN ── */}
          <Route path="/nuevo" element={
            <ProtectedRoute requiredRole="ADMIN" fallback="/formulario">
              <NuevoPedido />
            </ProtectedRoute>
          } />

          <Route path="/consolidado" element={
            <ProtectedRoute requiredRole="ADMIN" fallback="/">
              <Consolidado />
            </ProtectedRoute>
          } />

          <Route path="/editar/:pedidoId" element={
            <ProtectedRoute requiredRole="ADMIN" fallback="/">
              <EditarPedido />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </main>

      {user && <BottomNav />}
    </div>
  );
}
