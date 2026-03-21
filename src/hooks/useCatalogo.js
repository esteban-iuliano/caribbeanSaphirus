/**
 * useCatalogo.js — Sprint E fix
 *
 * Filtrado de clientes por rol:
 *   ADMIN    → todos los clientes sin filtro
 *   VENDEDOR → solo clientes de su canal (c.canal === user.canal)
 *
 * El backend obtenerCatalogo(null) devuelve todos los clientes.
 * El filtro se aplica client-side usando user.canal del AuthContext.
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
    // Siempre pedimos sin filtro de canal → backend devuelve todos los clientes
    obtenerCatalogo(null)
      .then(data => {
        let lista = data.clientes ?? [];

        // VENDEDOR: filtrar solo los clientes de su canal
        // CS_Clientes col C = canal (ej: 'CHINOS', 'PEPE', 'DIRECTO')
        // user.canal viene de CS_Vendedores col C (mismo valor)
        if (user && user.rol !== 'ADMIN' && user.canal) {
          lista = lista.filter(c =>
            (c.canal || '').toUpperCase().trim() === user.canal.toUpperCase().trim()
          );
        }

        setClientes(lista);
        setProductos(data.productos ?? []);
        setFragancias(data.fragancias ?? {});
      })
      .catch(e => setError(e?.message ?? 'Error al cargar catálogo'))
      .finally(() => setLoading(false));
  }, [user?.rol, user?.canal]);

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
