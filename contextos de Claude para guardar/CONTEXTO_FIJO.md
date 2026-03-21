# CaribbeanSaphirus — Contexto fijo (pegar al inicio de cada conversación nueva)

---

## Stack
* React PWA → GitHub Pages: `https://esteban-iuliano.github.io/caribbeanSaphirus/`
* Google Apps Script: `https://script.google.com/macros/s/AKfycbyDpfH_Ly56ja6rtXgFucnvKHVCaYj7A6T6nVrM2-gZQjUZt4Q_CJzjG8nqmKrL45PdNA/exec`
* Google Sheets ID: `1rFB9oSt_h7fysTl8zrGzmGmAjzmk1LSHefs-xgz2UAw`
* Repo: `github.com/esteban-iuliano/caribbeanSaphirus` (main branch)
* Claude API model: `claude-sonnet-4-20250514`

---

## Sprints completados ✅
* Sprint 0: Catálogo maestro
* Sprint 1: Parser de pedidos por texto (Claude API)
* Sprint A: PWA base (Inicio, NuevoPedido, Resultado, Consolidado, Historial)
* Sprint B: FormularioVendedor (entrada estructurada, 3 pasos)
* Sprint B': Modelo ampliado (total_sheru, total_cliente, estado_pago, archivado)
* Sprint C: Google OAuth + roles ADMIN/VENDEDOR
* Sprint D: Consolidado Sheru con filtro de fechas

---

## Roles y usuarios
* `ADMIN`: esteban.admin (`esteban.iuliano@gmail.com`), ana.admin (`analuci.iuliano@gmail.com`)
* `VENDEDOR`: esteban.test (`esteban.iuliano2022@gmail.com`) + resto sin email aún

---

## Archivos clave del frontend
* `src/context/AuthContext.jsx` — OAuth, sesión localStorage 24hs, `{ email, nombre, rol, vendedor_id }`
* `src/screens/Login.jsx` — pantalla login con GoogleLogin
* `src/App.jsx` — ProtectedRoute + rutas por rol
* `src/components/layout/Header.jsx` — nombre/rol + botón signOut
* `src/components/layout/BottomNav.jsx` — ítems filtrados por rol
* `src/api/appsScript.js` — v1.6: capa API, normaliza respuestas, `apiGet()` desenvuelve `json.data`, `guardarPedido` usa POST

---

## Archivos clave del backend (Apps Script)
* `webapp_endpoint.gs` v2.4 — doGet + doPost, SHEET_ID, helpers `_cargarPrecios`, `_cargarMarkups`, `buscarCliente`, `guardarItems`, `respuestaOK`
* `parser_pedidos_v2.gs` — Claude API parser texto
* `mantenimiento.gs` — `cargarPreciosSheru`, alias management

---

## Google Sheets
* `CS_Precios_Sheru`: col A=Producto_Parser, B=Nombre_Sheru, C=Precio, D=tiene_fragancia
* `CS_Fragancias`: col A=Fragancia, B=Producto (fragancias como objeto `{ Producto: [frag1, frag2] }`)
* `CS_Segmentos`: 2 filas header, datos desde fila 3, markup en col D
* `CS_Pedidos`: headers dinámicos (usar `headers.indexOf()`), columnas en orden actual:
  `Timestamp, Fecha, Canal, Vendedor, Cliente_ID, Cliente_Nombre, Total_Unidades, Estado,
  Requiere_Revision, Items_JSON, Mensaje_Original, Notas, total_sheru, total_cliente,
  estado_pago, fecha_pago, archivado, editado_por, fecha_edicion`
  — ID del pedido → columna `Timestamp` (formato PED-XXXX)
  — Notas → columna `Notas`
* `CS_Items`: ID_Pedido, Fecha, Cliente_ID, Cliente_Nombre, Canal, Fragancia, Producto, Cantidad, Flag, Alias_Usado, Nota, precio_unit_sheru, precio_unit_cliente
* `CS_Vendedores`: headers dinámicos, cols: vendedor_id, nombre, canal, email, rol (ADMIN/VENDEDOR)
* `CS_Clientes`: datos desde fila 3, col A=id, B=nombre, C=canal, D=vendedor (nombre exacto coincide con CS_Vendedores.nombre)
* `CS_Pedidos_Archivo`: pedidos eliminados/archivados

---

## Permisos por ruta
| Ruta | ADMIN | VENDEDOR |
|---|---|---|
| `/` | ✅ | ✅ |
| `/formulario` | ✅ | ✅ |
| `/historial` | ✅ | ✅ |
| `/resultado` | ✅ | ✅ |
| `/nuevo` (parser) | ✅ | ❌ → `/formulario` |
| `/consolidado` | ✅ | ❌ → `/` |
| `/editar/:pedidoId` | ✅ | ❌ |
| `/finanzas` | ✅ | ❌ → `/` |

---

## Reglas técnicas inamovibles
* CORS: todas las llamadas usan GET con `?datos=encodeURIComponent(JSON.stringify({accion,...}))`
* **EXCEPCIÓN**: `guardarPedido` y `parsearImagen` usan POST (payload en body, sin límite de tamaño)
* `respuestaOK()` envuelve en `{ ok: true, data: resultado }` → `apiGet()` desenvuelve automáticamente
* Headers de Sheets son dinámicos → siempre usar `headers.indexOf()`, nunca índices fijos
* `SHEET_ID` (no `SPREADSHEET_ID`) es la constante del backend
* Archivos completos listos para pegar, nunca diffs parciales

---

## Canales y markups
* CHINOS: vendor Germán, ~23 supermercados chinos, markup 1.095
* PEPE: reseller con ~5 clientes, markup 1.11
* DIRECTO: clientes individuales, markup variable

---

## Google Cloud OAuth
* Client ID: `722374870210-dl5sed2iq5b4r0ek5avjgl7qk4c2ho7b.apps.googleusercontent.com`
* Orígenes autorizados: `https://esteban-iuliano.github.io` + `http://localhost:5173`

---

## Estilo de trabajo
* Paso a paso, confirmación explícita antes de avanzar
* Archivos completos listos para pegar (nunca diffs)
* Indicar claramente: qué va a GitHub vs qué va a Apps Script, y cuándo re-deploy
* Preguntar todo lo necesario antes de escribir código
* Al entregar archivos: usar siempre el nombre exacto del archivo destino (no sufijos como _v1.6, _fix, etc.)
