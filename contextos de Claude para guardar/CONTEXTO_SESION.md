# CaribbeanSaphirus — Contexto de sesión
Actualizado: 2026-03-21

---

## Sprint actual
**Sprint E** — Módulo Finanzas (solo ADMIN) — ✅ COMPLETADO

---

## Completado esta sesión (2026-03-21)

### Sprint E — Módulo Finanzas
- ✅ `src/screens/Finanzas.jsx` creado — selector de fechas (default 7 días), resumen general, tabla por cliente con semáforo 🟠/🟢, tabla por vendedor
- ✅ `src/App.jsx` — ruta `/finanzas` agregada (ADMIN only)
- ✅ `src/screens/Inicio.jsx` — botón 💰 Finanzas en accesos rápidos ADMIN (grid 3 columnas)
- ✅ `Finanzas.jsx` v2 — selector de vendedor (filtra clientes y recalcula resumen), botón 📋 Copiar resumen para WhatsApp
- ✅ `webapp_endpoint.gs` v2.5 — `obtenerFinanzas` agrega campo `vendedor` en cada entrada de `por_cliente` (necesario para filtrado frontend)

### Fix — Formulario trae todos los clientes según rol
- **Causa raíz**: `FormularioVendedor.jsx` tenía `const CANAL = 'CHINOS'` hardcodeado
- ✅ `src/hooks/useCatalogo.js` — recibe `user` en lugar de `canal`; filtra por `c.vendedor === user.nombre` para VENDEDOR; ADMIN ve todos
- ✅ `src/screens/FormularioVendedor.jsx` — eliminado CANAL hardcodeado, usa `useAuth()` y pasa `user` a `useCatalogo`
- ✅ `src/context/AuthContext.jsx` — `user` ahora incluye campo `canal` (leído de CS_Vendedores col C)
- ✅ `webapp_endpoint.gs` v2.5 — `verificarUsuario` devuelve `canal` además de `vendedor_id`, `nombre`, `rol`

### Fix — Inicio mostraba pedidos de otros vendedores
- ✅ `src/screens/Inicio.jsx` — `pedidosHoy` filtra por `p.Vendedor === user.nombre` para VENDEDOR; ADMIN ve todos
- ✅ Botón "Nuevo Pedido" en Inicio redirige a `/nuevo` para ADMIN y `/formulario` para VENDEDOR

---

## Estado actual de archivos clave

| Archivo | Versión | Dónde vive |
|---|---|---|
| `webapp_endpoint.gs` | v2.5 | Apps Script — **redesployado** |
| `src/api/appsScript.js` | v1.6 | GitHub |
| `src/context/AuthContext.jsx` | v2 (canal en user) | GitHub |
| `src/hooks/useCatalogo.js` | v3 (filtro por vendedor) | GitHub |
| `src/screens/Finanzas.jsx` | v2 (filtro vendedor + copiar) | GitHub |
| `src/screens/Inicio.jsx` | v4 (filtro pedidos + btn finanzas) | GitHub |
| `src/screens/FormularioVendedor.jsx` | v3 (sin CANAL hardcodeado) | GitHub |
| `src/screens/Historial.jsx` | v3 | GitHub |
| `src/screens/Consolidado.jsx` | v2 | GitHub |
| `src/screens/EditarPedido.jsx` | v2 fix | GitHub |
| `src/App.jsx` | v3 (ruta /finanzas) | GitHub |

---

## Lógica de roles — confirmada y funcionando

| Funcionalidad | ADMIN | VENDEDOR |
|---|---|---|
| Inicio — pedidos del día | Todos | Solo los suyos (`p.Vendedor === user.nombre`) |
| Botón Nuevo Pedido | → `/nuevo` (parser) | → `/formulario` |
| Formulario — clientes | Todos los clientes | Solo `c.vendedor === user.nombre` |
| Historial | Todos + filtro vendedor | Solo los suyos |
| Consolidado | ✅ | ❌ |
| Finanzas | ✅ | ❌ |
| Editar/eliminar pedidos | ✅ | ❌ |

---

## Filtro de clientes — cómo funciona

`useCatalogo(user)` llama siempre a `obtenerCatalogo(null)` → backend devuelve todos los clientes.
Filtro client-side en `useCatalogo.js`:
- ADMIN → sin filtro, ve todos
- VENDEDOR → `lista.filter(c => c.vendedor.toLowerCase() === user.nombre.toLowerCase())`

`user.nombre` viene de CS_Vendedores col B (nombre exacto).
`c.vendedor` viene de CS_Clientes col D (debe coincidir exactamente con CS_Vendedores.nombre).

**Importante:** si un vendedor tiene mail asignado en CS_Vendedores y su nombre coincide con la columna D de CS_Clientes, el filtro funciona automáticamente.

---

## Sprint F — Próximo (último)
- Manual operativo: carga de pedidos, corrección de ítems, actualización catálogo/precios, aliases, flujo Sheru completo
- `PROMPT_MAESTRO_CaribbeanSaphirus.md` actualizado

---

## Estructura CS_Pedidos confirmada
Columnas en orden actual:
`Timestamp, Fecha, Canal, Vendedor, Cliente_ID, Cliente_Nombre, Total_Unidades, Estado,
Requiere_Revision, Items_JSON, Mensaje_Original, Notas, total_sheru, total_cliente,
estado_pago, fecha_pago, archivado, editado_por, fecha_edicion`

- ID del pedido → columna `Timestamp` (formato PED-XXXX)
- Notas → columna `Notas`

---

## Notas importantes
- Sesiones activas en localStorage NO tienen campo `canal` hasta nuevo login — los usuarios deben cerrar sesión y volver a entrar tras este deploy
- `webapp_endpoint.gs` v2.5 ya incluye `canal` en `verificarUsuario` — redesployado
