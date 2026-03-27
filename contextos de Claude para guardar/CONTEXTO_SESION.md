# CaribbeanSaphirus — Contexto de sesión
Actualizado: 2026-03-26

---

## Sprint actual
**Sprint Admin** — Gestión de Vendedores y Clientes (CRUD completo)
**Estado: ✅ COMPLETADO**

---

## Completado esta sesión

### Sprint Admin — Backend
- ✅ `webapp_endpoint.gs` v2.6 aplicado y re-deployd
  - Base: backend original v2.5 (21/03) restaurado íntegro
  - Agregado: `obtenerVendedores`, `crearVendedor`, `editarVendedor`, `eliminarVendedor`
  - Agregado: `crearCliente`, `editarCliente`, `eliminarCliente`
  - Fix: `verificarUsuario` valida Estado=ACTIVO en CS_Vendedores
  - Fix: `obtenerClientes` normaliza Estado (Activo/ACTIVO → igual)
  - CS_Clientes pasó de 2 filas de encabezado a 1 (se eliminó fila título)
  - Función `_generarId()` para IDs correlativos VEN-XXX y CLI-XXX

### Sprint Admin — Frontend
- ✅ `src/api/appsScript.js` v1.7 aplicado
  - Fusión completa con v1.6 original — conserva: `compressImage`, `parsearImagen`, `obtenerCatalogo`, `obtenerPedidoDetalle`, `apiPost`, firmas originales de `guardarPedido` y `obtenerFinanzas`
  - Agrega: `obtenerVendedores`, `crearVendedor`, `editarVendedor`, `eliminarVendedor`
  - Agrega: `crearCliente`, `editarCliente`, `eliminarCliente`
  - Normalización de `obtenerClientes` → campos en minúscula para `Administracion.jsx`
- ✅ `src/screens/Administracion.jsx` v1.0 creada
  - Ruta `/admin?tab=vendedores` | `/admin?tab=clientes`
  - Tab Vendedores: lista, crear, editar, activar/desactivar, eliminar (con modal de advertencia cascada)
  - Tab Clientes: lista con buscador, crear, editar, activar/desactivar, eliminar
  - Solo visible para ADMIN
- ✅ `src/App.jsx` actualizado — ruta `/admin` protegida con `requiredRole="ADMIN"`
- ✅ `src/screens/Inicio.jsx` actualizado — fila 2 admin: 👤 Vendedores · 🏪 Clientes
- ✅ `src/context/AuthContext.jsx` fix — eliminado chequeo `data.ok` incorrecto, corregido `data.vendedor_id` → `data.id_vendedor`

### Fixes aplicados durante el sprint
- Fix build: `appsScript.js` v1.7 restituye `compressImage` y `parsearImagen` (perdidos en v1.6 del sprint)
- Fix runtime: `TabClientes` leía `data.clientes` en lugar de `data.datos`
- Fix crash: null safety en filtro de búsqueda de clientes (`c.nombre || ''`)
- Fix estructura: CS_Clientes tenía 2 filas de encabezado → eliminada fila título

---

## Estado actual de la APP

### Funciones verificadas operativas ✅
- Login Google OAuth con validación Estado=ACTIVO
- Inicio con accesos rápidos (Consolidado, Finanzas, Historial, Vendedores, Clientes)
- Formulario Vendedor (obtenerCatalogo funciona)
- Historial con filtro por vendedor, editar, eliminar
- Consolidado Sheru con rango de fechas
- Finanzas (solo ADMIN)
- Administración: lista, crear, editar, activar/desactivar vendedores y clientes
- Eliminar vendedor con cascada de clientes + modal de advertencia

### Pendientes menores
- CS_Pedidos_Archivo tiene filas con columnas mezcladas (distintos formatos históricos) — no afecta la app, es cosmético del Sheet
- `Canal` y `Vendedor` — verificar si se guardan correctamente en CS_Pedidos en pedidos nuevos (abierto desde sesión anterior)

---

## Estructura de Sheets — estado actual

### CS_Vendedores (10 columnas)
`ID_Vendedor | Nombre | Canal | Teléfono_WhatsApp | Forma_Cobro | Frecuencia_Entrega | Notas | Email | Rol | Estado`
- Fila 1 = headers (una sola fila)
- Estado: ACTIVO / INACTIVO
- IDs: VEN-001 a VEN-008 existentes, nuevos auto-correlativos VEN-00X

### CS_Clientes (10 columnas)
`ID_Cliente | Nombre_Cliente | Canal | Vendedor | Dirección | Teléfono | Segmento_Precio | Estado | Notas | Frecuencia_Pedido`
- Fila 1 = headers (UNA sola fila — se eliminó fila título "MAESTRO DE CLIENTES")
- Estado: Activo / ACTIVO (backend normaliza ambos)
- IDs: CLI-001 a CLI-030 existentes, nuevos auto-correlativos CLI-XXX
- Vendedor guarda el NOMBRE (ej: "German"), no el ID

### CS_Segmentos (segmentos de precio)
`Segmento | Descripción | Canal | Markup_Sheru | Precio_Ejemplo_Aerosol | Bonificación | Notas`
- 2 filas de encabezado (fila 1 = título, fila 2 = columnas) — `_cargarMarkups()` hace `.slice(2)`
- Segmentos: CHINOS (1.095x), PEPE (1.11x), VALENTINA (1.14x), ANALIA (1.196x), LUKY (1.2x), 120_UNIDADES (1.196x)

### CS_Pedidos
- ID en columna `ID_Pedido` (formato PED-XXXX)
- Estado: `CONFIRMADO` (requerido por obtenerFinanzas)
- Columnas clave: ID_Pedido, Fecha, Cliente_ID, Cliente_Nombre, Canal, Vendedor, Total_Unidades, Estado, Notas, Items_JSON, total_sheru, total_cliente, estado_pago, fecha_pago, archivado

---

## Archivos clave — versiones actuales

| Archivo | Versión | Ubicación |
|---|---|---|
| `webapp_endpoint.gs` | v2.6 | Apps Script (deployd) |
| `src/api/appsScript.js` | v1.7 | GitHub |
| `src/screens/Administracion.jsx` | v1.0 | GitHub |
| `src/screens/Inicio.jsx` | Sprint E fix + Admin | GitHub |
| `src/App.jsx` | Sprint E + Admin | GitHub |
| `src/context/AuthContext.jsx` | Sprint E fix + Admin fix | GitHub |
| `src/screens/Historial.jsx` | Sprint C' | GitHub |
| `src/screens/Finanzas.jsx` | Sprint E | GitHub |
| `src/screens/EditarPedido.jsx` | Sprint C' | GitHub |
| `src/screens/Consolidado.jsx` | Sprint D | GitHub |
| `src/screens/FormularioVendedor.jsx` | Sprint B | GitHub |

---

## Roles y accesos

| Email | ID | Nombre | Rol | Canal |
|---|---|---|---|---|
| esteban.iuliano@gmail.com | VEN-008 | esteban.admin | ADMIN | DIRECTO |
| analuci.iuliano@gmail.com | VEN-007 | ana.admin | ADMIN | DIRECTO |
| esteban.iuliano2022@gmail.com | VEN-006 | esteban.test | VENDEDOR | CHINOS |

### Rutas por rol
- Todos autenticados: `/`, `/formulario`, `/historial`, `/resultado`
- Solo ADMIN: `/nuevo`, `/consolidado`, `/finanzas`, `/admin`, `/editar/:pedidoId`

---

## Próximos sprints

**Sprint F — Manual operativo**
Documentación de uso diario: ingreso de pedidos, corrección de ítems, actualización de catálogo/precios, gestión de alias, flujo completo Sheru.

**Issues pendientes**
- CS_Fragancias: "Pistacho Caramel" dividido en dos entradas incorrectamente; Sahumerio Hierbas/Himalaya con fragancias incorrectas; faltan Sahumerios Ambar (28 fragancias) y Disney (Textil + Difusor por personaje)
- Verificar si `Canal` y `Vendedor` se guardan en CS_Pedidos en pedidos nuevos

---

## Principios técnicos clave (NO olvidar)

1. **CORS constraint**: todas las llamadas al backend son GET con `?datos=encodeURIComponent(JSON.stringify({accion,...}))`. La excepción es `guardarPedido` y `parsearImagen` que usan POST con `Content-Type: text/plain`.
2. **`appsScript.js` es la única capa de normalización**: nunca normalizar en los screens.
3. **`obtenerClientes` devuelve `{ datos: [...] }`** — los screens leen `data.datos`, no `data.clientes`.
4. **`obtenerVendedores` devuelve `{ vendedores: [...] }`** — `Administracion.jsx` lee `data.vendedores`.
5. **CS_Clientes tiene 1 fila de headers** (desde hoy 26/03) — el backend lee desde `slice(1)`.
6. **CS_Segmentos tiene 2 filas de headers** — `_cargarMarkups()` usa `slice(2)`.
7. **Estado en CS_Vendedores**: ACTIVO / INACTIVO — afecta login (verificarUsuario lo valida).
8. **Estado en CS_Clientes**: Activo / ACTIVO — backend normaliza con `.toUpperCase()`.
9. **Eliminar vendedor hace cascada**: elimina todos los clientes donde `Vendedor === nombre del vendedor`.
10. **Pedidos históricos sobreviven** a la eliminación de un cliente — `Cliente_Nombre` quedó guardado como texto.
11. **IDs de pedidos**: formato PED-XXXX. `_getIdCol()` busca entre ['ID_Pedido', 'Pedido_ID', 'Timestamp', 'id_pedido'].
12. **PWA cache**: siempre probar fixes en incógnito o con Clear site data.
13. **GitHub Actions**: el build falla si hay imports de funciones que no existen en el archivo — siempre verificar que el `appsScript.js` tenga TODAS las funciones que importan los screens.

---

## Prompt de continuación para nueva sesión

```
Proyecto: CaribbeanSaphirus — PWA de gestión de pedidos para distribuidor de aromatizantes Saphirus.

Stack: React + Vite + Tailwind → GitHub Pages. Backend: Google Apps Script v2.6. DB: Google Sheets.

Repo: github.com/esteban-iuliano/caribbeanSaphirus
Backend URL: https://script.google.com/macros/s/AKfycbyDpfH_Ly56ja6rtXgFucnvKHVCaYj7A6T6nVrM2-gZQjUZt4Q_CJzjG8nqmKrL45PdNA/exec
Sheet ID: 1rFB9oSt_h7fysTl8zrGzmGmAjzmk1LSHefs-xgz2UAw

Sprint Admin completado el 26/03/2026. Ver CONTEXTO_SESION.md en el proyecto para estado completo.

Próximo trabajo: [describir qué se va a hacer]
```
