# CaribbeanSaphirus — Contexto de sesión
Actualizado: 2026-03-20

---

## Sprint actual
**Sprint E** — Módulo Finanzas (solo ADMIN) — PENDIENTE

---

## Completado en sesión 2026-03-20

### Fix crítico — pedidos duplicados por "Failed to fetch"
- **Causa raíz**: `guardarPedido` usaba `apiGet` → URL demasiado larga en pedidos grandes → backend guardaba pero la respuesta fallaba → usuario reintentaba → duplicados
- ✅ `appsScript.js` v1.6: `guardarPedido` migrado a `apiPost` (payload en body, sin límite de tamaño)
- ✅ `Resultado.jsx` fix: `handleGuardar` solo activa estado "guardado" si la respuesta es exitosa; si falla muestra advertencia anti-duplicados con botón directo al Historial
- ✅ `webapp_endpoint.gs` v2.4: ya tenía `case 'guardarPedido'` en `doPost` — sin cambios necesarios

### Historial mejorado
- ✅ ID de pedido (PED-XXXX) visible en la línea de fecha de cada pedido
- ✅ Filtro por vendedor para ADMIN (dropdown con vendedores únicos)
- ✅ VENDEDOR ve solo sus propios pedidos automáticamente (filtra por `user.nombre`)
- ✅ `appsScript.js` v1.6: agrega `obtenerFinanzas(desde, hasta)` — listo para Sprint E

### Datos corregidos en Google Sheets
- ✅ `CS_Pedidos`: columnas `Canal` y `Vendedor` agregadas en posiciones col C y D
- ✅ `CS_Clientes`: columna D `Vendedor` completada (German para todos los CHINOS, etc.)
- ✅ Verificado: pedidos nuevos se guardan con Canal y Vendedor correctamente

### Nota de deploy
- Error recurrente: archivos entregados con sufijos (_v1.6, _fix) en lugar del nombre exacto
- **Regla agregada al contexto fijo**: siempre entregar con el nombre exacto del archivo destino

---

## Estado actual de archivos clave

| Archivo | Versión | Dónde vive |
|---|---|---|
| `webapp_endpoint.gs` | v2.4 | Apps Script (deployado, sin cambios) |
| `src/api/appsScript.js` | v1.6 | GitHub |
| `src/screens/Resultado.jsx` | v2 fix POST + warning | GitHub |
| `src/screens/Historial.jsx` | v3 ID + filtro vendedor | GitHub |
| `src/screens/Consolidado.jsx` | v2 | GitHub |
| `src/screens/Inicio.jsx` | v3 | GitHub |
| `src/screens/EditarPedido.jsx` | v2 fix | GitHub |
| `src/screens/FormularioVendedor.jsx` | v2 notas | GitHub |

---

## Pedidos pendientes de limpiar
- PED-0004, PED-0005, PED-0006 — duplicados generados por el bug de POST — eliminar desde Historial con usuario admin

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
- Selector de rango de fechas hasta 2 meses hacia atrás
- Sección resumen: total_cliente, total_sheru, margen ($ = total_cliente - total_sheru), pendiente ($), pedidos_count
- Sección por cliente: tabla con semáforo pendiente (🟠)/pagado (🟢)
- Sección por vendedor: tabla resumen
- `obtenerFinanzas(desde, hasta)` ya está en `appsScript.js` v1.6 ✅

### Acordado
- Solo ADMIN accede
- Acceso desde Inicio.jsx (botón, como Consolidado Sheru) — NO en BottomNav para no agregar 6to ítem
- Selector de fechas igual al del Consolidado (mismo patrón)
- Semáforo: 🟠 naranja = tiene pendiente, 🟢 verde = todo pagado
- `margen` = monto en $ (total_cliente - total_sheru), no porcentaje
- `pendiente` = monto en $ pendiente de cobro
- Solo lectura — no marca pagos desde esta pantalla
- `por_vendedor` se muestra pero puede llegar vacío en pedidos viejos (sin Vendedor) — mostrar "sin datos" si vacío

---

## Sprint F — Documentación (último)
- Manual operativo: carga de pedidos, corrección de ítems, actualización catálogo/precios, aliases, flujo Sheru completo
- `PROMPT_MAESTRO_CaribbeanSaphirus.md` actualizado

---

## Estructura CS_Pedidos confirmada (2026-03-20)
Columnas en orden actual:
`Timestamp, Fecha, Canal, Vendedor, Cliente_ID, Cliente_Nombre, Total_Unidades, Estado,
Requiere_Revision, Items_JSON, Mensaje_Original, Notas, total_sheru, total_cliente,
estado_pago, fecha_pago, archivado, editado_por, fecha_edicion`

**Reglas importantes:**
- ID del pedido → columna `Timestamp` (formato PED-XXXX)
- Notas → columna `Notas`
- Canal y Vendedor → cols C y D (agregadas 2026-03-20, vacías en PED-0001/0002/0003)
