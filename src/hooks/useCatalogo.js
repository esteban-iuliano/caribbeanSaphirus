/**
 * useCatalogo.js — Sprint E fix v2
 *
 * Filtrado de clientes por rol:
 *   ADMIN    → todos los clientes sin filtro
 *   VENDEDOR → solo clientes donde CS_Clientes.vendedor === user.nombre
 *
 * CS_Clientes col D (vendedor) contiene el nombre exacto del vendedor
 * tal como aparece en CS_Vendedores col B (nombre).
 * Ejemplos: "German", "Pepe", "Valentina", "esteban.test"
 *
 * El backend obtenerCatalogo(null) devuelve todos los clientes.
 * El filtro se aplica client-side.
 *
 * Uso:
 *   const { clientes, productos, fraganciasPara, loading, error } = useCatalogo(user);
 */
import { useState, useEffect } from 'react';
import { obtenerCatalogo } from '../api/appsScript.js';

export function useCatalogo(user = null) {
  const [clientes,   setClientes]   = useState([]);
  const [productos,  setProductos]  = useState([]);
  const [fragancias, setFragancias] = useState({});
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);

  useEffect(() => {
    setLoading(true);
    // Sin filtro de canal → backend devuelve todos los clientes
    obtenerCatalogo(null)
      .then(data => {
        let lista = data.clientes ?? [];

        // VENDEDOR: filtrar solo sus clientes
        // CS_Clientes col D (vendedor) debe coincidir exactamente con user.nombre
        if (user && user.rol !== 'ADMIN') {
          const nombreVendedor = (user.nombre || '').toLowerCase().trim();
          lista = lista.filter(c =>
            (c.vendedor || '').toLowerCase().trim() === nombreVendedor
          );
        }

        setClientes(lista);
        setProductos(data.productos ?? []);
        setFragancias(data.fragancias ?? {});
      })
      .catch(e => setError(e?.message ?? 'Error al cargar catálogo'))
      .finally(() => setLoading(false));
  }, [user?.rol, user?.nombre]);

  const todasFragancias = [
    ...new Set(Object.values(fragancias).flat()),
  ].sort((a, b) => a.localeCompare(b, 'es'));

  function fraganciasPara(nombreProducto) {
    if (!nombreProducto || Object.keys(fragancias).length === 0) return todasFragancias;
    if (fragancias[nombreProducto]) return fragancias[nombreProducto];
    const norm = nombreProducto.toLowerCase();
    for (const clave of Object.keys(fragancias)) {
      if (clave.toLowerCase() === norm) return fragancias[clave];
    }
    const token = norm.split(' ')[0];
    for (const clave of Object.keys(fragancias)) {
      if (clave.toLowerCase().includes(token)) return fragancias[clave];
    }
    return todasFragancias;
  }

  return { clientes, productos, fragancias, todasFragancias, fraganciasPara, loading, error };
}
