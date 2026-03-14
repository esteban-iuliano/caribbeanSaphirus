/**
 * AppContext.jsx
 * Estado global compartido entre screens.
 */

import { createContext, useContext, useEffect, useReducer } from 'react';
import { obtenerClientes, ping } from '../api/appsScript.js';

// ─── Estado inicial ──────────────────────────────────────────────────────────

const initialState = {
  // Datos de negocio
  clientes: [],          // [{id, nombre, canal, segmento, vendedorId}]
  backendOk: null,       // null=sin verificar, true, false

  // Flujo de nuevo pedido
  clienteSeleccionado: null,  // objeto cliente completo
  pedidoParsado: null,        // { items: [], rawText: '', clienteId: '' }

  // UI
  loading: false,
  error: null,
};

// ─── Reducer ─────────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload, error: null };
    case 'SET_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'SET_BACKEND_OK':
      return { ...state, backendOk: action.payload };
    case 'SET_CLIENTES':
      return { ...state, clientes: action.payload, loading: false };
    case 'SET_CLIENTE':
      return { ...state, clienteSeleccionado: action.payload };
    case 'SET_PEDIDO_PARSADO':
      return { ...state, pedidoParsado: action.payload };
    case 'CLEAR_PEDIDO':
      return { ...state, pedidoParsado: null, clienteSeleccionado: null };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Al montar: ping + cargar clientes
  useEffect(() => {
    (async () => {
      try {
        await ping();
        dispatch({ type: 'SET_BACKEND_OK', payload: true });
      } catch {
        dispatch({ type: 'SET_BACKEND_OK', payload: false });
      }

      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        const res = await obtenerClientes();
        if (res?.datos) {
          dispatch({ type: 'SET_CLIENTES', payload: res.datos });
        }
      } catch (err) {
        dispatch({ type: 'SET_ERROR', payload: err.message });
      }
    })();
  }, []);

  const actions = {
    setCliente:       (cliente) => dispatch({ type: 'SET_CLIENTE', payload: cliente }),
    setPedidoParsado: (pedido)  => dispatch({ type: 'SET_PEDIDO_PARSADO', payload: pedido }),
    clearPedido:      ()        => dispatch({ type: 'CLEAR_PEDIDO' }),
  };

  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return ctx;
}
