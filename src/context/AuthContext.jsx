/**
 * AuthContext.jsx — Sprint C
 *
 * Flujo:
 *   1. Al montar, intenta restaurar sesión desde localStorage (TTL 24hs)
 *   2. signIn(credential) recibe el JWT de Google, lo decodifica,
 *      llama a Apps Script verificarUsuario(email) y guarda la sesión
 *   3. signOut() limpia localStorage y resetea estado
 *
 * Interfaz pública (sin cambios respecto Sprint A):
 *   user        → { email, nombre, rol, vendedor_id } | null
 *   isAdmin     → boolean
 *   isVendedor  → boolean
 *   loading     → boolean
 *   signIn(credential) → Promise<void>  — credential = JWT string de Google
 *   signOut()          → void
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

// ─── Constantes ──────────────────────────────────────────────────────────────

const SESSION_KEY = 'cs_session';
const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 horas en ms

const API_URL =
  'https://script.google.com/macros/s/AKfycbyDpfH_Ly56ja6rtXgFucnvKHVCaYj7A6T6nVrM2-gZQjUZt4Q_CJzjG8nqmKrL45PdNA/exec';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Decodifica el payload de un JWT sin verificar firma (confiamos en Google) */
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64    = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

/** Lee la sesión guardada; retorna user o null si expiró / no existe */
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

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  // Al montar: restaurar sesión si existe y es válida
  useEffect(() => {
    const saved = loadSession();
    if (saved) setUser(saved);
    setLoading(false);
  }, []);

  /**
   * signIn — llamado desde Login.jsx con el JWT de Google
   * @param {string} credential — token JWT devuelto por GoogleLogin onSuccess
   */
  const signIn = useCallback(async (credential) => {
    // 1. Decodificar JWT para obtener email y nombre
    const payload = decodeJWT(credential);
    if (!payload?.email) throw new Error('Token de Google inválido');

    // 2. Verificar en Apps Script si el email está autorizado
    const params = encodeURIComponent(
      JSON.stringify({ accion: 'verificarUsuario', email: payload.email })
    );
    const res      = await fetch(`${API_URL}?datos=${params}`);
    const envelope = await res.json();

    // respuestaOK() envuelve: { ok: true, data: { ok, vendedor_id, nombre, rol } }
    if (!envelope.ok) throw new Error(envelope.error || 'Error de conexión con el backend');
    const data = envelope.data;
    if (!data.ok) throw new Error(data.error || 'Email no autorizado en CaribbeanSaphirus');

    // 3. Construir objeto user y guardar sesión
    const newUser = {
      email:       payload.email,
      nombre:      data.nombre || payload.name || payload.email,
      rol:         data.rol,          // 'ADMIN' | 'VENDEDOR'
      vendedor_id: data.vendedor_id,  // ej: 'VEN-008', 'VEN-006'
    };

    saveSession(newUser);
    setUser(newUser);
  }, []);

  /** signOut — limpia estado y localStorage */
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

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
