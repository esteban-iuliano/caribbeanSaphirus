import { useState, useCallback } from 'react';

/**
 * Hook genérico para envolver llamadas async con estado loading/error.
 *
 * @example
 *   const { loading, error, call } = useApi();
 *   const result = await call(() => parsearPedido(clienteId, texto));
 */
export function useApi() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const call = useCallback(async (fn) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fn();
      return result;
    } catch (err) {
      const msg = err?.message || 'Error desconocido';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return { loading, error, call, clearError };
}
