/**
 * AuthContext.jsx
 *
 * Sprint A: contexto de autenticación mínimo (sin restricciones).
 * Sprint C: aquí se implementará Google OAuth + roles (ADMIN / VENDEDOR).
 *
 * Interfaz pública (no cambia entre sprints):
 *   user        → { email, nombre, rol: 'ADMIN'|'VENDEDOR'|null }
 *   isAdmin     → boolean
 *   isVendedor  → boolean
 *   loading     → boolean (durante verificación OAuth)
 *   signIn()    → Promise<void>
 *   signOut()   → Promise<void>
 */

import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Sprint A: usuario "anónimo" con acceso total.
  // Sprint C: reemplazar este estado por la lógica de Google OAuth.
  const [user] = useState({
    email: null,
    nombre: 'Admin',
    rol: 'ADMIN', // todos son ADMIN por ahora
  });

  const [loading] = useState(false);

  const isAdmin    = user?.rol === 'ADMIN';
  const isVendedor = user?.rol === 'VENDEDOR';

  // Sprint C: estas funciones dispararán el flujo de Google Sign-In.
  const signIn  = async () => {};
  const signOut = async () => {};

  return (
    <AuthContext.Provider value={{ user, isAdmin, isVendedor, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
