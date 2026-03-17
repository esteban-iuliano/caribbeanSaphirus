# CaribbeanSaphirus — Contexto de sesión
Actualizado: 2026-03-17

---

## Sprint actual
**Sprint D** — Consolidado Sheru mejorado (filtro de fechas)

---

## Completado en sesión anterior (2026-03-16/17)

- ✅ Bug crítico resuelto: ítems huérfanos en CS_Items causaban que pedidos nuevos
  heredaran ítems de pedidos eliminados (ID reciclado). Fix en `eliminarPedidoAdmin`.
- ✅ `webapp_endpoint.gs` → v2.3 aplicado y re-deployd
- ✅ Fix notas: columna real es `Notas` (no `Notas_Pedido`) — fix en backend y frontend
- ✅ Edición de fragancia en ítems existentes desde `EditarPedido.jsx`
- ✅ Edición de fragancia en ítems REVISAR/NUEVA desde `Resultado.jsx`
- ✅ Campo notas al crear pedido en `FormularioVendedor.jsx` (paso 2, opcional)
- ✅ Nota visible en HOME (`Inicio.jsx`) con 📝
- ✅ Nota visible al expandir en Historial (`Historial.jsx`)
- ✅ Mapeo campo `Notas` en `appsScript.js` v1.5

---

## Estado actual de archivos clave

| Archivo | Versión | Dónde vive |
|---|---|---|
| `webapp_endpoint.gs` | v2.3 | Apps Script (deployd) |
| `src/api/appsScript.js` | v1.5 | GitHub |
| `src/screens/EditarPedido.jsx` | v2 fix | GitHub |
| `src/screens/Resultado.jsx` | v2 fix | GitHub |
| `src/screens/FormularioVendedor.jsx` | v2 notas | GitHub |
| `src/screens/Inicio.jsx` | v2 notas | GitHub |
| `src/screens/Historial.jsx` | v2 notas | GitHub |

---

## Sprint D — Consolidado Sheru mejorado

### Estado actual
- Pantalla `Sheru` funciona y muestra el consolidado
- Botón "Copiar lista" genera texto listo para pegar en WhatsApp
- Formato actual: `400x Cony (Aerosol Ambar)`
- **Problema:** no tiene filtro de fechas — muestra SIEMPRE todos los pedidos activos

### Qué hay que hacer
1. Agregar selector de fecha inicio y fecha fin en la pantalla Sheru
2. El backend ya tiene `obtenerConsolidado(desde, hasta)` — solo hay que pasarle los parámetros
3. Rango máximo: 1 mes hacia atrás
4. Sugerencia de implementación: fecha fin = hoy por defecto, fecha inicio = hace 7 días por defecto
5. Solo ADMIN accede al consolidado (ya está restringido por ruta)
6. El botón "Copiar lista" ya funciona bien — mantenerlo tal cual
7. Evaluar si agregar Web Share API (WhatsApp directo) o dejar solo "Copiar"

### Preguntas abiertas para Sprint D
- ¿El default del filtro debería ser "últimos 7 días" o "mes actual"?
- ¿Querés ver el total de unidades por producto agrupado también por tipo
  (ej: subtotal Aerosoles, subtotal Textiles) o solo lista plana como ahora?

---

## Sprint E — Módulo finanzas (después de D)

### Alcance acordado
- Selector de rango de fechas (hasta 2 meses hacia atrás)
- Totales por cliente: total_cliente, pendiente/pagado
- Total general del período
- Solo ADMIN
- `obtenerFinanzas(desde, hasta)` ya existe en backend y está completo

---

## Sprint F — Documentación (último)
- Manual operativo: carga de pedidos, corrección de ítems, actualización de catálogo/precios, aliases, flujo Sheru completo
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

## Preguntas abiertas generales
- ¿`Canal` y `Vendedor` se guardan en CS_Pedidos en pedidos nuevos?
  (aparecen vacíos en la UI de Editar)
