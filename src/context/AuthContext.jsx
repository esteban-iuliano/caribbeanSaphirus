/**
 * AuthContext.jsx — Sprint E fix
 *
 * Cambio: user ahora incluye campo `canal` (leído desde CS_Vendedores)
 * Esto permite que useCatalogo filtre clientes por canal del vendedor.
 *
 * Interfaz pública:
 *   user  → { email, nombre, rol, vendedor_id, canal } | null
 *   isAdmin     → boolean
 *   isVendedor  → boolean
 *   loading     → boolean
 *   signIn(credential) → Promise<void>
 *   signOut()          → void
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

const SESSION_KEY = 'cs_session';
const SESSION_TTL = 24 * 60 * 60 * 1000;

const API_URL =
  'https://script.google.com/macros/s/AKfycbyDpfH_Ly56ja6rtXgFucnvKHVCaYj7A6T6nVrM2-gZQjUZt4Q_CJzjG8nqmKrL45PdNA/exec';

function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64    = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const { user, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > SESSION_TTL) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

function saveSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ user, timestamp: Date.now() }));
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = loadSession();
    if (saved) setUser(saved);
    setLoading(false);
  }, []);

  const signIn = useCallback(async (credential) => {
    const payload = decodeJWT(credential);
    if (!payload?.email) throw new Error('Token de Google inválido');

    const params = encodeURIComponent(
      JSON.stringify({ accion: 'verificarUsuario', email: payload.email })
    );
    const res      = await fetch(`${API_URL}?datos=${params}`);
    const envelope = await res.json();

    if (!envelope.ok) throw new Error(envelope.error || 'Error de conexión con el backend');
    const data = envelope.data;
    if (!data.ok) throw new Error(data.error || 'Email no autorizado en CaribbeanSaphirus');

    // Incluye canal — agregado Sprint E fix
    const newUser = {
      email:       payload.email,
      nombre:      data.nombre      || payload.name || payload.email,
      rol:         data.rol,
      vendedor_id: data.vendedor_id,
      canal:       data.canal || '',
    };

    saveSession(newUser);
    setUser(newUser);
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const isAdmin    = user?.rol === 'ADMIN';
  const isVendedor = user?.rol === 'VENDEDOR';

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
