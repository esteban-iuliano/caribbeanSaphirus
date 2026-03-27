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
* Sprint C': Edición y eliminación de pedidos (solo ADMIN)
* Sprint D: Consolidado Sheru con filtro de fechas
* Sprint E: Módulo Finanzas (solo ADMIN) + fix filtro clientes/pedidos por rol
* Sprint Admin: Pantalla /admin con CRUD completo de vendedores y clientes

---

## Roles y usuarios
* `ADMIN`: esteban.admin (`esteban.iuliano@gmail.com`), ana.admin (`analuci.iuliano@gmail.com`)
* `VENDEDOR`: German, Pepe, Valentina, Analia, Luky — cada uno con su mail en CS_Vendedores
* Login valida Estado=ACTIVO en CS_Vendedores — usuarios INACTIVO no pueden entrar
* Clientes con Estado=INACTIVO no aparecen en el selector del formulario

---

## Objeto user (AuthContext)
```
{
  email:       string,
  nombre:      string,   // coincide con CS_Vendedores.nombre (col B)
  rol:         'ADMIN' | 'VENDEDOR',
  vendedor_id: string,   // ej: 'VEN-001'
  canal:       string,   // ej: 'CHINOS', 'PEPE', 'DIRECTO'
}
```

---

## Archivos clave del frontend
* `src/context/AuthContext.jsx` — OAuth, sesión localStorage 24hs, user incluye canal. Fix: eliminado chequeo data.ok incorrecto, usa id_vendedor no vendedor_id
* `src/screens/Login.jsx` — pantalla login con GoogleLogin
* `src/App.jsx` — ProtectedRoute + rutas por rol (incluye /finanzas y /admin)
* `src/components/layout/Header.jsx` — nombre/rol + botón signOut
* `src/components/layout/BottomNav.jsx` — ítems filtrados por rol
* `src/api/appsScript.js` — v1.7: capa API, normaliza respuestas, guardarPedido usa POST, incluye CRUD admin
* `src/hooks/useCatalogo.js` — recibe user; ADMIN ve todos; VENDEDOR filtra por c.vendedor === user.nombre
* `src/screens/Administracion.jsx` — v1.0: pantalla /admin con tabs Vendedores/Clientes, solo ADMIN

---

## Archivos clave del backend (Apps Script)
* `webapp_endpoint.gs` v2.6 — doGet + doPost; verificarUsuario devuelve canal y valida Estado=ACTIVO; obtenerFinanzas incluye vendedor en por_cliente; CRUD admin completo
* `parser_pedidos_v2.gs` — Claude API parser texto
* `mantenimiento.gs` — cargarPreciosSheru, alias management

---

## Google Sheets
* `CS_Precios_Sheru`: col A=Producto_Parser, B=Nombre_Sheru, C=Precio, D=tiene_fragancia
* `CS_Fragancias`: col A=Fragancia, B=Producto
* `CS_Segmentos`: 2 filas header, datos desde fila 3, markup en col D
* `CS_Pedidos`: headers dinámicos, columnas en orden actual:
  `Timestamp, Fecha, Canal, Vendedor, Cliente_ID, Cliente_Nombre, Total_Unidades, Estado,
  Requiere_Revision, Items_JSON, Mensaje_Original, Notas, total_sheru, total_cliente,
  estado_pago, fecha_pago, archivado, editado_por, fecha_edicion`
  — ID del pedido → columna `Timestamp` (formato PED-XXXX)
  — Notas → columna `Notas`
  — Estado: `CONFIRMADO` (requerido por obtenerFinanzas)
* `CS_Items`: ID_Pedido, Fecha, Cliente_ID, Cliente_Nombre, Canal, Fragancia, Producto, Cantidad, Flag, Alias_Usado, Nota, precio_unit_sheru, precio_unit_cliente
* `CS_Vendedores`: col A=ID_Vendedor, B=Nombre, C=Canal, D=Teléfono_WhatsApp, E=Forma_Cobro, F=Frecuencia_Entrega, G=Notas, H=Email, I=Rol, J=Estado (ACTIVO/INACTIVO)
  — 1 sola fila de headers
  — IDs formato VEN-XXX, auto-correlativos
* `CS_Clientes`: 1 sola fila de headers (se eliminó fila título el 26/03/2026)
  col A=ID_Cliente, B=Nombre_Cliente, C=Canal, D=Vendedor (NOMBRE, no ID), E=Dirección, F=Teléfono, G=Segmento_Precio, H=Estado, I=Notas, J=Frecuencia_Pedido
  — IDs formato CLI-XXX, auto-correlativos
  — Estado: Activo / ACTIVO — backend normaliza ambos con toUpperCase()
  — Vendedor guarda el NOMBRE (ej: "German"), no el ID
* `CS_Pedidos_Archivo`: pedidos eliminados por admin

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
| `/editar/:pedidoId` | ✅ | ❌ → `/` |
| `/finanzas` | ✅ | ❌ → `/` |
| `/admin` | ✅ | ❌ → `/` |

---

## Lógica de filtrado por rol
| Elemento | ADMIN | VENDEDOR |
|---|---|---|
| Pedidos en Inicio | Todos | `p.Vendedor === user.nombre` |
| Clientes en Formulario | Todos | `c.vendedor === user.nombre` |
| Pedidos en Historial | Todos + filtro dropdown | Solo los suyos |
| Botón Nuevo Pedido (Inicio) | → `/nuevo` | → `/formulario` |
| Accesos rápidos Inicio fila 1 | Consolidado · Finanzas · Historial | Historial |
| Accesos rápidos Inicio fila 2 | Vendedores · Clientes | — |

---

## Pantalla Administración (/admin)
* Solo ADMIN
* Tab Vendedores: lista completa, crear, editar, activar/desactivar, eliminar
* Tab Clientes: lista con buscador, crear, editar, activar/desactivar, eliminar
* Eliminar vendedor → modal advertencia → elimina vendedor + todos sus clientes en cascada
* Eliminar cliente → solo el cliente, pedidos históricos intactos
* Acceso desde Inicio: botones 👤 Vendedores → `/admin?tab=vendedores` y 🏪 Clientes → `/admin?tab=clientes`

---

## Normalización en appsScript.js v1.7
* `obtenerClientes()` → `{ datos: [...] }` — screens leen `data.datos`
* `obtenerVendedores()` → `{ vendedores: [...] }` — Administracion.jsx lee `data.vendedores`
* `obtenerPedidos()` → `{ datos: [...] }` — screens leen `res.datos`
* Campos de cliente normalizados: `id, nombre, canal, vendedor, direccion, telefono, segmento_precio, estado, notas, frecuencia_pedido`
* Campos de vendedor normalizados: `id, nombre, canal, telefono, forma_cobro, frecuencia_entrega, notas, email, rol, estado`

---

## Reglas técnicas inamovibles
* CORS: todas las llamadas usan GET con `?datos=encodeURIComponent(JSON.stringify({accion,...}))`
* **EXCEPCIÓN**: `guardarPedido` y `parsearImagen` usan POST (payload en body)
* `respuestaOK()` envuelve en `{ ok: true, data: resultado }` → `apiGet()` desenvuelve automáticamente
* Headers de Sheets son dinámicos → siempre usar `headers.indexOf()`, nunca índices fijos
* `SHEET_ID` es la constante del backend (no `SPREADSHEET_ID`)
* CS_Clientes tiene 1 fila de headers — backend lee desde `slice(1)`
* CS_Segmentos tiene 2 filas de headers — `_cargarMarkups()` usa `slice(2)`
* Archivos completos listos para pegar, nunca diffs parciales
* Al entregar archivos: usar siempre el nombre exacto del archivo destino
* PWA cache: siempre probar fixes en incógnito o con Clear site data
* GitHub Actions: build falla si hay imports de funciones inexistentes — verificar que appsScript.js tenga TODAS las funciones que importan los screens

---

## Canales y markups
* CHINOS: vendor Germán, ~23 supermercados chinos, markup 1.095
* PEPE: reseller con ~5 clientes, markup 1.11
* DIRECTO: clientes individuales, markup variable (Valentina 1.14x, Analia 1.196x, Luky 1.2x, 120_UNIDADES 1.196x)

---

## Google Cloud OAuth
* Client ID: `722374870210-dl5sed2iq5b4r0ek5avjgl7qk4c2ho7b.apps.googleusercontent.com`
* Orígenes autorizados: `https://esteban-iuliano.github.io` + `http://localhost:5173`

---

## Estilo de trabajo
* Paso a paso, confirmación explícita antes de avanzar
* Archivos completos listos para pegar (nunca diffs)
* Indicar claramente: qué va a GitHub vs qué va a Apps Script, y cuándo re-deploy
* Al entregar archivos: usar siempre el nombre exacto del archivo destino
* Español en todas las interacciones
