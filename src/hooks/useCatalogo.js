/**
 * useCatalogo.js
 * Carga el catálogo necesario para FormularioVendedor:
 * clientes por canal, productos y fragancias.
 *
 * Uso:
 *   const { clientes, productos, todasFragancias, loading, error } = useCatalogo('CHINOS');
 */
import { useState, useEffect } from 'react';
import { obtenerCatalogo } from '../api/appsScript.js';

export function useCatalogo(canal = 'CHINOS') {
  const [clientes,   setClientes]   = useState([]);
  const [productos,  setProductos]  = useState([]);
  const [fragancias, setFragancias] = useState({});
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    setLoading(true);
    obtenerCatalogo(canal)
      .then(data => {
        setClientes(data.clientes   ?? []);
        setProductos(data.productos ?? []);
        setFragancias(data.fragancias ?? {});
      })
      .catch(e => setError(e?.message ?? 'Error al cargar catálogo'))
      .finally(() => setLoading(false));
  }, [canal]);

  // Lista plana de fragancias únicas y ordenadas A→Z
  // Se usa cuando no hay mapeo exacto por tipo de producto
  const todasFragancias = [
    ...new Set(Object.values(fragancias).flat()),
  ].sort((a, b) => a.localeCompare(b, 'es'));

  /**
   * Devuelve fragancias para un tipo de producto.
   * La clave del mapa es el nombre exacto del producto (igual que CS_Precios_Sheru col0).
   * Si no hay coincidencia exacta, devuelve todas.
   */
  function fraganciasPara(nombreProducto) {
    if (!nombreProducto || Object.keys(fragancias).length === 0) return todasFragancias;
    // 1. Coincidencia exacta
    if (fragancias[nombreProducto]) return fragancias[nombreProducto];
    // 2. Case-insensitive
    const norm = nombreProducto.toLowerCase();
    for (const clave of Object.keys(fragancias)) {
      if (clave.toLowerCase() === norm) return fragancias[clave];
    }
    // 3. Parcial — primer token del nombre
    const token = norm.split(' ')[0];
    for (const clave of Object.keys(fragancias)) {
      if (clave.toLowerCase().includes(token)) return fragancias[clave];
    }
    return todasFragancias;
  }

  return { clientes, productos, fragancias, todasFragancias, fraganciasPara, loading, error };
}
