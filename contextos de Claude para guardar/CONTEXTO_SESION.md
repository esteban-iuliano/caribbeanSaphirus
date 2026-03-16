# CaribbeanSaphirus — Contexto de sesión
Actualizado: 2026-03-15

---

## Sprint actual
**Sprint C'** — Edición y eliminación de pedidos desde Historial (solo ADMIN)
**Estado: 95% completo — 1 fix pendiente de aplicar**

---

## Completado esta sesión

- ✅ `webapp_endpoint.gs` v2.2 aplicado y re-deployd
- ✅ `src/api/appsScript.js` v1.4 aplicado
- ✅ `src/screens/EditarPedido.jsx` creado y funcionando
- ✅ `src/screens/Historial.jsx` v2 aplicado
- ✅ `src/App.jsx` con ruta `/editar/:pedidoId`
- ✅ Fix bug: `pedidoId` mapeaba `ID_Pedido` pero la hoja usa `Timestamp`
  - Solución: helper `_getIdCol()` en backend, `p.Timestamp` en appsScript.js
- ✅ Fix bug: botón Guardar tapado por BottomNav → `bottom-16`
- ✅ Eliminar pedido funcionando correctamente
- ✅ Editar pedido (ítems + cabecera) funcionando correctamente

---

## PENDIENTE APLICAR ⚠️

**Fix: campo Notas no se guarda**

El campo en CS_Pedidos se llama `Notas` (no `Notas_Pedido`).

**Archivo 1 — `webapp_endpoint.gs`**
Reemplazar con `webapp_endpoint_v2.2.gs` (ya tiene el fix).
Cambio exacto en `editarPedido()`:
```javascript
// ANTES:
if (cambios.notas_pedido !== undefined) setCol('Notas_Pedido', cambios.notas_pedido);
// DESPUÉS:
if (cambios.notas_pedido !== undefined) { setCol('Notas_Pedido', cambios.notas_pedido); setCol('Notas', cambios.notas_pedido); }
```
→ Guardar → **Re-deploy obligatorio**

**Archivo 2 — `src/screens/EditarPedido.jsx`**
Reemplazar con `EditarPedido_v3.jsx` (ya tiene el fix).
Cambio exacto en `cargarDatos()`:
```javascript
// ANTES:
setNotasPedido(det.pedido.Notas_Pedido || '');
// DESPUÉS:
setNotasPedido(det.pedido.Notas_Pedido ?? det.pedido.Notas ?? '');
```
→ Commit + push:
```bash
git add .
git commit -m "Fix: guardar notas usando columna 'Notas' de CS_Pedidos"
git push
```

---

## Hallazgos sobre estructura real de CS_Pedidos

Campos confirmados por consola (orden real):
`Timestamp, Fecha, Cliente_ID, Cliente_Nombre, Total_Unidades, Estado, Requiere_Revision, Items_JSON, Mensaje_Original, Notas, total_sheru, total_cliente, estado_pago, fecha_pago, archivado, editado_por, fecha_edicion`

**Importante:**
- El ID del pedido está en columna `Timestamp` (no `ID_Pedido`)
- Las notas están en columna `Notas` (no `Notas_Pedido`)
- `Canal` y `Vendedor` no aparecen como columnas en CS_Pedidos

---

## Próximos sprints

**Sprint C'' (corto) — Estados del pedido**
Acordado: agregar estados Pendiente / Armado / Entregado / Pagado con colores.
- 🔴 Pendiente
- 🟡 Armado
- 🟠 Entregado
- 🟢 Pagado

**Sprint D — Consolidado Sheru mejorado**
- Filtros por fecha, vista agrupada, Web Share API

**Sprint E — Módulo finanzas (solo ADMIN)**
- `obtenerFinanzas()` ya existe en backend

---

## Preguntas abiertas
- ¿`Canal` y `Vendedor` se guardan en CS_Pedidos en pedidos nuevos?
