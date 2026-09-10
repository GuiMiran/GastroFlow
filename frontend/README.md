# GastroFlow — Frontend

> Aplicación TPV/POS para hostelería construida con React 19 + Vite 8 + TypeScript.

---

## Stack

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| React | 19.x | UI declarativa |
| React Router | 7.x | Navegación SPA |
| Vite | 8.x | Bundler + HMR + proxy API |
| TypeScript | 5.x | Tipado estático |

---

## Estructura

```
frontend/
├── src/
│   ├── main.tsx                # Punto de entrada — BrowserRouter + StrictMode
│   ├── App.tsx                 # Definición de rutas
│   ├── api.ts                  # Cliente API tipado (fetch wrapper)
│   ├── context/
│   │   └── AppContext.tsx       # Estado global (establecimiento, empleado, caja, turno)
│   │                            # Sistema de notificaciones toast
│   ├── components/
│   │   └── Layout.tsx           # Layout principal: sidebar + topbar + <Outlet>
│   ├── pages/
│   │   ├── SetupPage.tsx        # Configuración inicial de sesión
│   │   ├── SalaPage.tsx         # Mapa visual de mesas
│   │   ├── ComandaPage.tsx      # TPV: toma de comandas
│   │   ├── CobroPage.tsx        # Proceso de cobro / pago
│   │   └── CajaPage.tsx         # Gestión de turnos de caja
│   └── styles/
│       └── global.css           # Custom CSS (sin framework, variables CSS)
├── index.html                   # Shell HTML
├── vite.config.ts               # Proxy /api → localhost:3000
├── tsconfig.json
└── package.json
```

---

## Rutas

| Ruta | Página | Descripción |
|------|--------|-------------|
| `/setup` | SetupPage | Introducir UUIDs del seed (establecimiento, empleado, caja) |
| `/sala` | SalaPage | Mapa de mesas agrupado por zonas. Colores por estado |
| `/comanda/:servicioId` | ComandaPage | TPV con categorías, productos, ticket en tiempo real |
| `/cobro/:servicioId` | CobroPage | Cuenta + forma de pago + numpad + confirmación |
| `/caja` | CajaPage | Abrir turno, registrar movimientos, cerrar con arqueo |

---

## Páginas — Detalle

### SetupPage (`/setup`)

Página de configuración de sesión. El usuario introduce los UUIDs generados por el seed:
- **Establecimiento ID** — identifica el local
- **Empleado ID** — camarero/a que opera
- **Nombre** — nombre visible en la UI
- **Caja ID** — caja física asignada

Al enviar, guarda en `AppContext` y redirige a `/sala`.

### SalaPage (`/sala`)

Mapa visual de la sala con auto-refresh cada 10 segundos:
- Mesas agrupadas por **Zona** (Terraza, Salón, Barra)
- Código de colores:
  - 🟢 `libre` — disponible, clic para abrir
  - 🟠 `ocupada` — con servicio activo, clic para ir a comanda
  - 🔴 `pendiente_cobro` — clic para ir a cobro
  - 🔵 `reservada` — no interactuable
- **Botón "Servicio Barra"** — servicio sin mesa asignada (RN-031)

### ComandaPage (`/comanda/:servicioId`)

Layout TPV a dos columnas:
- **Izquierda**: Pestañas de categorías + grid de productos (botones)
- **Derecha**: Ticket local con líneas, cantidades (±), total
- **Enviar Comanda** → `POST /comandas` — envía a cocina/barra
- **Ir a Cobrar** → navega a `/cobro/:servicioId`

### CobroPage (`/cobro/:servicioId`)

Proceso de cobro completo:
- Carga cuenta con desglose IVA (base 10%/21%/4%)
- Selección de forma de pago: **Efectivo** / **Tarjeta** / **Bizum**
- Numpad para introducir importe (solo efectivo)
- Botones de importe rápido: 5€, 10€, 20€, 50€
- Cálculo automático de cambio
- Pantalla de confirmación post-cobro con nº de ticket

### CajaPage (`/caja`)

Gestión del turno de caja:
- **Sin turno**: Formulario para abrir turno con fondo inicial
- **Turno activo**:
  - Stats: estado, fondo, ID turno
  - Registrar movimientos (entrada/salida + concepto)
  - Cerrar turno: conteo de efectivo → cálculo de descuadre

---

## Cliente API (`api.ts`)

Wrapper tipado sobre `fetch` con manejo de errores automático:

```typescript
api.mesas.mapa(establecimientoId)           // GET  /mesas/establecimiento/:id/mapa
api.mesas.abrir(mesaId, camareroId, n)      // POST /mesas/:id/abrir
api.mesas.abrirBarra(camareroId)            // POST /mesas/barra/abrir

api.catalogo.get()                          // GET  /productos/catalogo

api.comandas.tomar({ servicioId, ... })     // POST /comandas
api.comandas.cuenta(servicioId)             // GET  /comandas/servicio/:id/cuenta
api.comandas.dividir(servicioId, modo, ...) // POST /comandas/servicio/:id/dividir
api.comandas.anularLinea(lineaId, ...)      // DELETE /comandas/lineas/:id

api.cobros.cobrar(servicioId, formasPago)   // POST /cobros/servicio/:id

api.caja.abrirTurno({ cajaId, ... })        // POST /caja/turno/abrir
api.caja.movimiento({ turnoCajaId, ... })   // POST /caja/turno/:id/movimiento
api.caja.cerrar({ turnoCajaId, ... })       // POST /caja/turno/:id/cerrar
```

---

## Estado Global (`AppContext`)

```typescript
interface AppState {
  establecimientoId: string;   // UUID del establecimiento activo
  empleadoId: string;          // UUID del empleado logueado
  empleadoNombre: string;      // Nombre visible
  cajaId: string;              // UUID de la caja física
  turnoCajaId: string | null;  // UUID del turno activo (null = sin turno)
}
```

**Notificaciones toast**: `notify(mensaje, tipo)` — tipo: `success` | `error` | `info`. Auto-dismiss a los 3.5 segundos.

---

## Proxy API

Vite redirige `/api/*` al backend NestJS en `http://localhost:3000`:

```typescript
// vite.config.ts
server: {
  port: 5173,
  proxy: {
    '/api': { target: 'http://localhost:3000', changeOrigin: true }
  }
}
```

No hace falta CORS en desarrollo — el proxy resuelve el cross-origin.

---

## Comandos

```bash
npm run dev       # Servidor de desarrollo con HMR (http://localhost:5173)
npm run build     # Build de producción → frontend/dist/
npm run preview   # Preview del build de producción
```

---

## Estilos

CSS puro con variables (sin framework). Principales módulos:

| Selector / Zona | Propósito |
|------------------|-----------|
| `.app-layout` | Layout principal: sidebar + main |
| `.mesa-grid`, `.mesa-card` | Grid de mesas con colores por estado |
| `.tpv-layout` | Layout TPV 2 columnas (catálogo + ticket) |
| `.category-tabs`, `.product-grid` | Pestañas y botones de producto |
| `.ticket-panel`, `.ticket-line` | Panel de ticket con líneas |
| `.cobro-layout`, `.pago-metodo`, `.numpad` | Proceso de cobro |
| `.caja-stats`, `.stat-card` | Tarjetas de estadísticas de caja |
| `.btn`, `.btn-primary/success/danger` | Sistema de botones |
| `.toast` | Notificaciones flotantes |
