# DT-05 — Frontend: Mapa de Componentes

> Parte de la [documentación técnica](_index.md).  
> Usa este documento para extender el frontend, añadir páginas, entender el flujo de usuario o cambiar el cliente API.

---

## Stack frontend

- **React 19** + **TypeScript**
- **Vite 8** — bundler + dev server (puerto 5173)
- **React Router 7** — enrutado SPA
- **CSS puro con variables** — sin Tailwind ni MUI (control total del diseño TPV)
- Proxy `/api → http://localhost:3000` configurado en `vite.config.ts`

---

## Árbol de rutas

```
<BrowserRouter>
  <AppProvider>                        ← Estado global + toasts
    <Routes>
      /setup              → SetupPage      (sin Layout)
      <Layout>                             ← Sidebar + Topbar
        /sala             → SalaPage
        /comanda/:id      → ComandaPage    (:id = servicioId)
        /cobro/:id        → CobroPage      (:id = servicioId)
        /caja             → CajaPage
      </Layout>
      *                   → Redirect /setup
    </Routes>
  </AppProvider>
</BrowserRouter>
```

---

## Flujo de usuario

```
1. Setup (configurar IDs de establecimiento, empleado y caja)
   │
   ▼
2. Sala — mapa de mesas
   ├── Clic mesa libre      → Modal abrir mesa → POST /mesas/:id/abrir → Navegar a /comanda/:servicioId
   ├── Clic mesa ocupada    → Navegar a /comanda/:servicioId
   ├── Clic mesa cobro      → Navegar a /cobro/:servicioId
   └── Botón "Barra"        → POST /mesas/barra/abrir → Navegar a /comanda/:servicioId
   │
   ▼
3. Comanda — TPV de toma de pedido
   ├── Seleccionar categoría → filtrar productos
   ├── Clic producto         → añadir línea al ticket
   ├── Botones ± cantidad    → ajustar unidades
   ├── Enviar comanda        → POST /comandas
   └── Ir a cobrar           → Navegar a /cobro/:servicioId
   │
   ▼
4. Cobro — pantalla de pago
   ├── Ver resumen de cuenta + desglose IVA (GET /comandas/servicio/:id/cuenta)
   ├── Seleccionar método de pago (efectivo / tarjeta / bizum)
   ├── Numpad para importe efectivo
   └── Cobrar → POST /cobros/servicio/:id → Ticket confirmado → Volver a /sala
   │
   ▼
5. Caja (accesible independientemente desde sidebar)
   ├── Abrir turno con fondo inicial
   ├── Registrar entradas/salidas manuales
   └── Cerrar turno con conteo de efectivo → calcula descuadre
```

---

## Cliente API (`frontend/src/api.ts`)

Wrapper tipado sobre `fetch`. Todas las peticiones:
- Envían `Content-Type: application/json`
- Lanzan `HttpError` automático si la respuesta no es 2xx
- El proxy de Vite elimina la necesidad de gestionar CORS en desarrollo

```typescript
// Métodos disponibles:
api.mesas.mapa(establecimientoId)
api.mesas.abrir(mesaId, camareroId, comensales)
api.mesas.abrirBarra(camareroId)

api.catalogo.get()

api.comandas.tomar({ servicioId, camareroId, lineas })
api.comandas.cuenta(servicioId)
api.comandas.dividir(servicioId, modo, numPartes?, grupos?)
api.comandas.anularLinea(lineaId, { motivo, empleadoId, rolEmpleado })

api.cobros.cobrar(servicioId, formasPago, clienteId?)

api.caja.abrirTurno({ cajaId, empleadoId, fondoInicial })
api.caja.movimiento({ turnoCajaId, tipo, importe, concepto })
api.caja.cerrar({ turnoCajaId, conteoEfectivo })
```

---

## Estado global (`AppContext`)

Definido en `frontend/src/context/`. Persiste en `localStorage`.

```typescript
interface AppState {
  establecimientoId: string    // UUID del establecimiento activo
  empleadoId: string           // UUID del empleado en sesión
  empleadoNombre: string       // Nombre para mostrar en sidebar
  cajaId: string               // UUID de la caja física
  turnoCajaId: string | null   // UUID del turno abierto (null si cerrado)
}
```

La página `/setup` es el único lugar donde se configuran estos valores. Si `establecimientoId` está vacío, la app redirige a `/setup`.
