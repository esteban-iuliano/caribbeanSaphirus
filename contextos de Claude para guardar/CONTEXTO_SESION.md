# CaribbeanSaphirus — Contexto de sesión
Actualizado: 2026-03-17

---

## Sprint actual
**Sprint E** — Módulo Finanzas (solo ADMIN)

---

## Completado en sesión 2026-03-17

- ✅ Sprint D: Consolidado Sheru con filtro de fechas
  - `Consolidado.jsx` v2: selector fecha inicio/fin, default últimos 7 días, límite 1 mes
  - Lista agrupada por tipo de producto con subtotal por grupo
  - Re-fetch automático al cambiar fechas
  - `appsScript.js` v1.5: `obtenerConsolidado(desde, hasta)` pasa parámetros al backend
- ✅ Fix: botón "Consolidado Sheru" oculto para rol VENDEDOR en `Inicio.jsx`
  - Usa `useAuth` → `user?.rol === 'ADMIN'`
- ✅ Fix Route 66 (auto): `webapp_endpoint.gs` v2.4
  - Helper `_normalizarProducto()` elimina sufijo `(auto)` antes de agrupar en consolidado
  - "Route 66" y "Route 66 (auto)" ahora se suman correctamente

---

## Estado actual de archivos clave

| Archivo | Versión | Dónde vive |
|---|---|---|
| `webapp_endpoint.gs` | v2.4 | Apps Script (deployd) |
| `src/api/appsScript.js` | v1.5 | GitHub |
| `src/screens/Consolidado.jsx` | v2 | GitHub |
| `src/screens/Inicio.jsx` | v3 (fix consolidado ADMIN) | GitHub |
| `src/screens/EditarPedido.jsx` | v2 fix | GitHub |
| `src/screens/Resultado.jsx` | v2 fix | GitHub |
| `src/screens/FormularioVendedor.jsx` | v2 notas | GitHub |
| `src/screens/Historial.jsx` | v2 notas | GitHub |

---

## Sprint E — Módulo Finanzas (solo ADMIN)

### Backend — YA COMPLETO en v2.4
`obtenerFinanzas(desde, hasta)` existe y devuelve:
```json
{
  "resumen": {
    "total_sheru": 0,
    "total_cliente": 0,
    "margen": 0,
    "pendiente": 0,
    "pedidos_count": 0
  },
  "por_cliente": [
    { "id": "", "nombre": "", "total_sheru": 0, "total_cliente": 0, "pendiente": 0, "pedidos": 0 }
  ],
  "por_vendedor": [
    { "vendedor": "", "total_sheru": 0, "total_cliente": 0, "pendiente": 0, "pedidos": 0 }
  ]
}
```

### Frontend — PENDIENTE
- Nueva pantalla `src/screens/Finanzas.jsx`
- Ruta `/finanzas` — solo ADMIN (agregar en `App.jsx` y `BottomNav.jsx`)
- Selector de rango de fechas (hasta 2 meses hacia atrás)
- Sección resumen: total_cliente, total_sheru, margen, pendiente, pedidos_count
- Sección por cliente: tabla con semáforo pendiente/pagado
- Sección por vendedor (opcional)
- Agregar `obtenerFinanzas(desde, hasta)` a `appsScript.js`

### Acordado
- Solo ADMIN accede
- Selector de fechas igual al del Consolidado (mismo patrón)
- Semáforo: naranja = tiene pendiente, verde = todo pagado

---

## Sprint F — Documentación (último)
- Manual operativo: carga de pedidos, corrección de ítems, actualización catálogo/precios, aliases, flujo Sheru completo
- `PROMPT_MAESTRO_CaribbeanSaphirus.md` actualizado

---

## Estructura CS_Pedidos confirmada (consola 2026-03-16)
Campos reales en orden:
`Timestamp, Fecha, Cliente_ID, Cliente_Nombre, Total_Unidades, Estado,
Requiere_Revision, Items_JSON, Mensaje_Original, Notas, total_sheru,
total_cliente, estado_pago, fecha_pago, archivado, editado_por, fecha_edicion`

**Reglas importantes:**
- ID del pedido → columna `Timestamp` (no `ID_Pedido`)
- Notas → columna `Notas` (no `Notas_Pedido`)
- `Canal` y `Vendedor` NO están en CS_Pedidos actualmente

---

## Hallazgos sobre productos — catálogo
- `CS_Precios_Sheru`: fuente de verdad de precios y lista de productos (25 productos)
- `CS_Fragancias`: combinaciones fragancia × producto (419 filas) — solo se usa en FormularioVendedor
- `CS_Items`: donde vive todo lo ya guardado — es la fuente del consolidado
- Solo `(auto)` es un sufijo cosmético en Route 66/Caritas — los demás paréntesis 
  (Equipos Deco, Pack Premium por color) SÍ son SKUs distintos

---

## Preguntas abiertas
- ¿`Canal` y `Vendedor` se guardan en CS_Pedidos en pedidos nuevos?
  (aparecen vacíos en la UI de Editar)
