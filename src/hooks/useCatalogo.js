/**
 * useCatalogo.js
 * Carga el catálogo necesario para FormularioVendedor.
 *
 * Recibe el objeto `user` del AuthContext:
 *   { email, nombre, rol, vendedor_id }
 *
 * Comportamiento:
 *   - ADMIN    → todos los clientes, sin filtro
 *   - VENDEDOR → solo sus clientes (filtra por c.vendedor === user.nombre)
 *
 * El backend obtenerCatalogo(null) devuelve todos los clientes cuando
 * no se pasa canal. El filtro por vendedor se aplica client-side.
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
    // Siempre pedimos sin filtro de canal → el backend devuelve todos los clientes
    obtenerCatalogo(null)
      .then(data => {
        let lista = data.clientes ?? [];

        // VENDEDOR: filtrar solo sus propios clientes
        // La columna CS_Clientes.vendedor guarda el nombre del vendedor
        // que coincide con CS_Vendedores.nombre (ej: "German", "Pepe")
        if (user && user.rol !== 'ADMIN' && user.nombre) {
          lista = lista.filter(c =>
            (c.vendedor || '').toLowerCase().trim() === user.nombre.toLowerCase().trim()
          );
        }

        setClientes(lista);
        setProductos(data.productos ?? []);
        setFragancias(data.fragancias ?? {});
      })
      .catch(e => setError(e?.message ?? 'Error al cargar catálogo'))
      .finally(() => setLoading(false));
  }, [user?.rol, user?.nombre]); // re-ejecutar si cambia el usuario

  // Lista plana de fragancias únicas y ordenadas A→Z
  const todasFragancias = [
    ...new Set(Object.values(fragancias).flat()),
  ].sort((a, b) => a.localeCompare(b, 'es'));

  /**
   * Devuelve fragancias para un tipo de producto.
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
