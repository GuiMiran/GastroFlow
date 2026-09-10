# Documentación Técnica — GastroFlow

> ⚠️ **DEPRECADO** — Este archivo monolítico ha sido reemplazado por la estructura modular.
>
> Consultar: **[_index.md](_index.md)** → índice de todos los documentos técnicos.
>
> Archivos individuales:
> - [DT-01-arquitectura.md](DT-01-arquitectura.md) — Arquitectura, patrones, convenciones
> - [DT-02-backend-modulos.md](DT-02-backend-modulos.md) — Módulos NestJS
> - [DT-03-api-rest.md](DT-03-api-rest.md) — Endpoints REST completos
> - [DT-04-base-datos.md](DT-04-base-datos.md) — Modelo de datos y Prisma
> - [DT-05-frontend.md](DT-05-frontend.md) — Frontend, rutas, cliente API
> - [DT-06-seed-datos.md](DT-06-seed-datos.md) — Seed de demo y reglas
> - [DT-07-testing-trazabilidad.md](DT-07-testing-trazabilidad.md) — Tests y trazabilidad spec→código
> - [DT-08-decisiones-restricciones.md](DT-08-decisiones-restricciones.md) — Decisiones de diseño y restricciones no negociables
> - [DT-09-setup-entorno.md](DT-09-setup-entorno.md) — Setup y solución de problemas
>
> **No editar este archivo.**

---

## Instrucciones para la IA

Este documento es la **referencia técnica de implementación**. Úsalo cuando:
- Un agente necesite saber qué endpoints existen y sus shapes exactos.
- Necesites entender la arquitectura de módulos.
- Debas extender el frontend con nuevas páginas.
- Necesites verificar la alineación entre specs y código.

**No sustituye a las specs de dominio** (capas 00-11). Este documento describe *cómo se implementó*, no *qué debe hacer*.

---

## 1. Arquitectura General

### 1.1 Visión de componentes

```
┌──────────────────────────────────────────────────────────┐
│                      FRONTEND                            │
│  React 19 · Vite 8 · TypeScript · React Router 7        │
│  Puerto: 5173                                            │
│  Proxy /api → backend                                    │
│                                                          │
│  Páginas: Setup → Sala → Comanda → Cobro → Caja          │
└─────────────────────────┬────────────────────────────────┘
                          │ HTTP JSON
┌─────────────────────────▼────────────────────────────────┐
│                      BACKEND                             │
│  NestJS 11 · TypeScript · Prefijo /api/v1                │
│  Puerto: 3000                                            │
│                                                          │
│  ┌─────────┐ ┌───────────┐ ┌──────────┐ ┌────────────┐  │
│  │   TPV   │ │ Inventario│ │ Contable │ │   Fiscal   │  │
│  │ (5 ctrl)│ │  (service)│ │ (service)│ │  (service) │  │
│  └────┬────┘ └─────┬─────┘ └────┬─────┘ └─────┬──────┘  │
│       └────────┬───┘────────────┘──────────────┘         │
│           ┌────▼────┐                                    │
│           │ Prisma  │  @Global PrismaModule               │
│           │ ORM 7.5 │  Adapter: @prisma/adapter-pg       │
│           └────┬────┘                                    │
└────────────────┼─────────────────────────────────────────┘
                 │
          ┌──────▼──────┐
          │ PostgreSQL   │
          │ 16 (Docker)  │
          │ Puerto: 5432 │
          └─────────────┘
```

### 1.2 Patrones de diseño

| Patrón | Dónde | Por qué |
|--------|-------|---------|
| **Modular Monolith** | Módulos NestJS (tpv, inventario, contable, fiscal, verifactu) | Separación de dominios sin complejidad de microservicios |
| **Global ORM** | `PrismaModule` con `@Global()` | Acceso a base de datos desde cualquier módulo sin imports |
| **Domain Events** | `@nestjs/event-emitter` | Desacoplamiento: cobro emite `TicketEmitido`, contable reacciona creando asiento |
| **Contract-First** | Specs capa 05 (contratos) → implementación en services | Cada operación tiene PRE/POST/ERROR documentados |
| **Hash Chain (VeriFactu)** | `VeriFactuService` | SHA-256 encadenado para integridad fiscal (RD 1007/2023) |
| **Typed API Client** | `frontend/src/api.ts` | Cada método frontend mapea 1:1 con un endpoint |

### 1.3 Convenciones de código

- **Controllers**: Solo validación de entrada y delegación a services
- **Controllers — orden de rutas**: Las rutas con segmentos literales (estáticas) **deben declararse ANTES** que las rutas con parámetros dinámicos (`:param`) del mismo nivel de profundidad en el mismo controller. De lo contrario, NestJS captura la ruta estática con el patrón dinámico (ej.: `barra/abrir` sería capturada por `:mesaId/abrir` con `mesaId = 'barra'`).
- **Services**: Toda la lógica de negocio, transacciones Prisma con `$transaction`
- **Módulos**: Cada módulo exporta sus services para uso por otros módulos
- **Eventos**: Definidos en `common/events/domain-events.ts`, emitidos desde services
- **IVA**: Siempre se almacena `precioConIva` (PVP). Base se calcula: `pvp / (1 + tasa)`
- **IDs**: UUID v4 generado por Prisma (`@default(uuid())`)

---

## 2. Backend — Módulos

### 2.1 TpvModule (Punto de Venta)

**Ubicación**: `src/modules/tpv/`

Es el módulo principal que maneja el flujo de venta:

```
tpv/
├── tpv.module.ts
├── controllers/
│   ├── mesa.controller.ts       → /mesas/*
│   ├── comanda.controller.ts    → /comandas/*
│   ├── cobro.controller.ts      → /cobros/*
│   ├── caja.controller.ts       → /caja/*
│   └── producto.controller.ts   → /productos/*
└── services/
    ├── mesa.service.ts          SK-001, OP-001
    ├── comanda.service.ts       SK-002, SK-003, SK-004, OP-002, OP-003
    ├── cobro.service.ts         SK-005–SK-008, OP-004, OP-006
    └── caja.service.ts          SK-009, OP-010, OP-011, OP-012
```

**Dependencias**: Importa `VeriFactuModule` para hash de tickets.

### 2.2 InventarioModule

**Ubicación**: `src/modules/inventario/`

Gestión de stock, ingredientes, escandallos (recetas), deducción automática.

**Listener**: Reacciona a `EVT-004 TicketEmitido` → deduce stock según escandallo.

### 2.3 ContableModule

**Ubicación**: `src/modules/contable/`

Asientos automáticos en partida doble (PGC Pymes). Servicio: `AsientoService`.

**Listener**: Reacciona a `EVT-004 TicketEmitido` → crea asiento contable de venta.

### 2.4 FiscalModule

**Ubicación**: `src/modules/fiscal/`

Generación de modelos fiscales españoles: 303, 390, 347, 111, 115.

### 2.5 VeriFactuModule

**Ubicación**: `src/modules/verifactu/`

Cadena de hash SHA-256 para integridad fiscal (RD 1007/2023). Servicio: `VeriFactuService`.

- Genera `hashActual` = SHA-256(`datosRegistro` + `hashAnterior`)
- Almacena en tabla `RegistroVeriFactu` (inmutable)

---

## 3. API REST — Referencia Completa

### 3.1 Mesas

| Endpoint | Método | Request | Response |
|----------|--------|---------|----------|
| `/mesas/establecimiento/:id/mapa` | GET | — | `Zona[]` con `mesas[]` |
| `/mesas/:mesaId/abrir` | POST | `{ camareroId, comensales }` | `{ idServicio }` |
| `/mesas/barra/abrir` | POST | `{ camareroId }` | `{ idServicio }` |

**Estados de mesa**: `libre` → `ocupada` → `pendiente_cobro` → `libre`

### 3.2 Catálogo

| Endpoint | Método | Response |
|----------|--------|----------|
| `/productos/catalogo` | GET | `{ categorias[], productos[] }` |

**Tipo IVA** (enum): `general_21` \| `reducido_10` \| `superreducido_4` \| `exento_0`

### 3.3 Comandas

| Endpoint | Método | Request | Response |
|----------|--------|---------|----------|
| `/comandas` | POST | `{ servicioId, camareroId, lineas[] }` | `{ id, numero, lineas[] }` |
| `/comandas/servicio/:id/cuenta` | GET | — | `{ total, desglose, lineas[] }` |
| `/comandas/servicio/:id/dividir` | POST | `{ modo, numPartes?, grupos? }` | `{ tickets[] }` |
| `/comandas/lineas/:id` | DELETE | `{ motivo, empleadoId, rolEmpleado }` | `{ success }` |

**Linea comanda** (request): `{ productoId, cantidad, modificadores?, notas? }`

**Desglose IVA**: `{ base4, iva4, base10, iva10, base21, iva21 }`

### 3.4 Cobros

| Endpoint | Método | Request | Response |
|----------|--------|---------|----------|
| `/cobros/servicio/:id` | POST | `{ formasPago[], clienteId? }` | `{ ticketId, codigoCompleto, total }` |
| `/cobros/factura-completa` | POST | `{ ticketId, destinatarioNif, nombre, direccion, establecimientoId }` | `{ facturaId }` |
| `/cobros/rectificativa` | POST | `{ ticketOriginalId, tipo, motivo, establecimientoId }` | `{ rectificativaId }` |

**FormaPago**: `{ forma: 'efectivo'|'tarjeta'|'bizum'|'invitacion', importe: number }`

### 3.5 Caja

| Endpoint | Método | Request | Response |
|----------|--------|---------|----------|
| `/caja/turno/abrir` | POST | `{ cajaId, empleadoId, fondoApertura }` | `{ id, fondoCaja, abierto }` |
| `/caja/turno/:id/movimiento` | POST | `{ tipo, importe, concepto, empleadoId }` | `{ id }` |
| `/caja/turno/:id/cerrar` | POST | `{ contadoEfectivo, empleadoId }` | `{ id, descuadre }` |

---

## 4. Base de Datos — Modelo de datos

### 4.1 Diagrama de relaciones (simplificado)

```
Tenant 1──N Establecimiento
                │
    ┌───────────┼───────────┬──────────────┐
    ▼           ▼           ▼              ▼
  Zona       Producto    Caja          Empleado
    │           │           │              │
    ▼           │           ▼              ▼
  Mesa          │       TurnoCaja       Turno/Fichaje
    │           │           │
    ▼           │           ▼
  Servicio      │     MovimientoCaja
    │           │
    ▼           ▼
  Comanda   ◄── LineaComanda ──► Producto
    │                               │
    │                               ▼
    │                        CategoriaProducto
    ▼
  Ticket ────► RegistroVeriFactu (hash chain)
    │
    ▼
  Cobro (formas de pago)
```

### 4.2 Tablas por dominio

| Dominio | Modelos Prisma |
|---------|----------------|
| **Multi-tenant** | `Tenant`, `Establecimiento` |
| **Sala / Servicio** | `Zona`, `Mesa`, `Servicio` |
| **Comandas** | `Comanda`, `LineaComanda`, `Modificador` |
| **Facturación** | `SerieFacturacion`, `Ticket`, `Cobro`, `RegistroVeriFactu` |
| **Caja** | `Caja`, `TurnoCaja`, `MovimientoCaja` |
| **Catálogo** | `CategoriaProducto`, `Producto`, `Alergeno`, `ProductoAlergeno` |
| **Recetas** | `Escandallo`, `EscandalloIngrediente`, `Ingrediente` |
| **Stock** | `Almacen`, `Stock`, `MovimientoStock` |
| **Compras** | `Proveedor`, `PedidoProveedor`, `LineaPedido`, `AlbaranEntrada`, `LineaAlbaran`, `FacturaCompra` |
| **Contabilidad** | `EjercicioFiscal`, `AsientoContable`, `ApunteContable`, `LibroRegistroEmitida`, `LibroRegistroRecibida` |
| **RRHH** | `Empleado`, `Turno`, `Fichaje` |
| **CRM** | `Cliente`, `Consentimiento`, `ProgramaFidelizacion`, `Reserva` |

### 4.3 Enums

| Enum | Valores |
|------|---------|
| `EstadoMesa` | `libre`, `ocupada`, `reservada`, `pendiente_cobro` |
| `TipoIVA` | `general_21`, `reducido_10`, `superreducido_4`, `exento_0` |
| `FormaPago` | `efectivo`, `tarjeta`, `bizum`, `invitacion` |
| `TipoTicket` | `simplificada`, `completa`, `rectificativa` |
| `TipoMovimientoStock` | `entrada_compra`, `salida_venta`, `ajuste`, `merma`, `traspaso` |
| `EstadoPedido` | `borrador`, `enviado`, `recibido_parcial`, `recibido`, `cancelado` |
| `EstadoReserva` | `confirmada`, `cancelada`, `completada`, `no_show` |
| `NivelCliente` | `bronce`, `plata`, `oro` |

---

## 5. Frontend — Mapa de componentes

### 5.1 Árbol de rutas

```
<BrowserRouter>
  <AppProvider>                        ← Estado global + toasts
    <Routes>
      /setup              → SetupPage      (sin Layout)
      <Layout>                             ← Sidebar + Topbar
        /sala             → SalaPage
        /comanda/:id      → ComandaPage
        /cobro/:id        → CobroPage
        /caja             → CajaPage
      </Layout>
      *                   → Redirect /setup
    </Routes>
  </AppProvider>
</BrowserRouter>
```

### 5.2 Flujo de usuario

```
1. Setup (IDs)
   │
   ▼
2. Sala (mapa de mesas)
   ├── Clic mesa libre    → Modal abrir mesa → Crear servicio
   ├── Clic mesa ocupada  → Comanda (tomar pedido)
   ├── Clic mesa cobro    → Cobro (pagar)
   └── Btn "Barra"        → Crear servicio barra → Comanda
   │
   ▼
3. Comanda (TPV)
   ├── Seleccionar categoría → Ver productos
   ├── Clic producto → Añadir al ticket
   ├── ± cantidad
   ├── Enviar comanda → POST /comandas
   └── Ir a cobrar → Cobro
   │
   ▼
4. Cobro
   ├── Ver resumen + desglose IVA
   ├── Seleccionar método (efectivo/tarjeta/bizum)
   ├── Numpad para efectivo
   └── Cobrar → POST /cobros/servicio/:id → Ticket confirmado
   │
   ▼
5. Caja (independiente)
   ├── Abrir turno con fondo
   ├── Registrar entradas/salidas
   └── Cerrar turno con conteo → Calcular descuadre
```

### 5.3 Cliente API (`api.ts`)

Wrapper tipado sobre `fetch`:
- HttpError automático con `message` del backend
- Content-Type JSON en todas las peticiones
- Proxy de Vite elimina necesidad de CORS

```
api.mesas.mapa(establecimientoId)
api.mesas.abrir(mesaId, camareroId, comensales)
api.mesas.abrirBarra(camareroId)
api.catalogo.get()
api.comandas.tomar({ servicioId, camareroId, lineas })
api.comandas.cuenta(servicioId)
api.comandas.dividir(servicioId, modo, ...)
api.comandas.anularLinea(lineaId, ...)
api.cobros.cobrar(servicioId, formasPago)
api.caja.abrirTurno({ cajaId, empleadoId, fondoInicial })
api.caja.movimiento({ turnoCajaId, tipo, importe, concepto })
api.caja.cerrar({ turnoCajaId, conteoEfectivo })
```

### 5.4 Estado global (`AppContext`)

```typescript
AppState {
  establecimientoId: string   // UUID establecimiento activo
  empleadoId: string          // UUID empleado
  empleadoNombre: string      // Nombre visible en sidebar
  cajaId: string              // UUID caja física
  turnoCajaId: string | null  // UUID turno abierto (null = cerrado)
}
```

---

## 6. Seed de datos demo

El script `prisma/seed.ts` crea datos suficientes para probar todo el flujo:

| Entidad | Cantidad | Detalles |
|---------|----------|----------|
| Tenant | 1 | "Restaurante Demo S.L." |
| Establecimiento | 1 | "Bar El Rincón" |
| Empleados | 4 | Gerente, 2 camareros, cocinera |
| Zonas | 3 | Terraza (6), Salón (8), Barra (4) |
| Mesas | 18 | Distribuidas en 3 zonas |
| Categorías | 8 | Entrantes, Carnes, Pescados, Postres, Cervezas, Vinos, Refrescos, Cafetería |
| Productos | 32 | Con IVA correcto (10% comida, 21% bebidas) |
| Caja | 1 | "Caja Principal" |
| Series | 3 | V (ventas), F (facturas), R (rectificativas) |
| Alérgenos | 14 | Los 14 alérgenos obligatorios UE |
| Programa fidelización | 1 | 1 pto/€, plata 500, oro 2000 |
| Almacén | 1 | "Almacén Principal" |

El seed imprime los UUIDs necesarios para la página Setup.

### 6.1 Reglas obligatorias del seed

> **⚠️ Estas reglas son mandatorias. Ignorarlas provoca errores en ejecución.**

1. **Sincronización con schema**: cada vez que se añada, renombre o elimine un campo en `prisma/schema.prisma`, el archivo `prisma/seed.ts` debe actualizarse en el **mismo commit**. Los nombres de campo en `seed.ts` deben coincidir exactamente con los del schema (incluyendo capitalización camelCase).

2. **Re-ejecución tras fallo parcial**: si el seed falla a mitad de ejecución, la base de datos queda en estado inconsistente. Para re-ejecutarlo limpiamente usar:
   ```bash
   npx prisma migrate reset --force
   ```
   Esto borra todos los datos, re-aplica todas las migraciones y ejecuta el seed desde cero.

3. **Campos requeridos sin default**: cualquier campo `@required` del schema sin `@default()` debe estar presente en el objeto `data` del `create` correspondiente. Si no se incluye, Prisma lo rechaza en validación de tipos (error en compilación de TypeScript o error P2009 en runtime).

---

## 7. Testing

### 7.1 Configuración

- Framework: **Jest 30** con **ts-jest**
- Config: `jest.config.ts`
- Path aliases: `@common/*`, `@modules/*`

### 7.2 Tests implementados

Archivo: `test/criterios-aceptacion.spec.ts`

| Test | Criterio | Qué verifica |
|------|----------|--------------|
| AC-001 | Cobro simple con IVA | Base + cuota para IVA 10% y 21%, total correcto |
| AC-002 | División de cuenta | Split a partes iguales con centavos correctos |
| AC-006 | Hash VeriFactu | Cadena SHA-256 encadenada, hash anterior correcto |
| AC-008 | Arqueo de caja | Descuadre = contado − esperado |
| AC-030 | Modelo 303 | Cálculo base imponible trimestral |
| INV-030 | Partida doble | Σ cargos = Σ abonos en asiento contable |

### 7.3 Ejecutar

```bash
npm test                  # Una vez
npm run test:watch        # Modo desarrollo
```

---

## 8. Trazabilidad Spec → Código

| Spec | Implementación |
|------|----------------|
| SK-001 (Abrir mesa) | `MesaService.abrirMesa()` → `MesaController.abrirMesa()` |
| SK-002 (Tomar comanda) | `ComandaService.tomarComanda()` → `ComandaController.tomarComanda()` |
| SK-003 (Calcular cuenta) | `ComandaService.calcularCuenta()` → `ComandaController.calcularCuenta()` |
| SK-004 (Dividir cuenta) | `ComandaService.dividirCuenta()` → `ComandaController.dividirCuenta()` |
| SK-005/006 (Cobrar + ticket) | `CobroService.cobrarServicio()` → `CobroController.cobrar()` |
| SK-007 (Factura completa) | `CobroService.emitirFacturaCompleta()` → `CobroController.facturaCompleta()` |
| SK-008 (Rectificativa) | `CobroService.emitirRectificativa()` → `CobroController.rectificativa()` |
| SK-009 (Caja) | `CajaService.*()` → `CajaController.*()` |
| OP-001 (Mesa PRE/POST) | `MesaService.abrirMesa()` — validación de estado |
| OP-002 (Comanda PRE/POST) | `ComandaService.tomarComanda()` — servicio activo, ≥1 línea |
| OP-003 (Anular línea) | `ComandaService.anularLinea()` — requiere rol gerente |
| OP-010/011/012 (Caja) | `CajaService.abrirTurno/cerrarTurno/registrarMovimiento()` |
| RN-001 (Tipos IVA) | Enum `TipoIVA` en Prisma schema |
| RN-002 (PVP incluye IVA) | Campo `precioConIva` en `Producto`, cálculo inverso en services |
| RN-003 (Multi-IVA) | `calcularCuenta()` desglosa por tipo de IVA |
| RN-010 (Simplificada) | `cobrarServicio()` → tipo `simplificada` si < 3.000€ |
| RN-040 (Descuadre) | `cerrarTurno()` → `descuadre = contado - esperado` |
| INV-007/008 (VeriFactu) | `VeriFactuService` → cadena SHA-256 |
| EVT-004 (TicketEmitido) | EventEmitter en `CobroService` → listeners en Contable + Inventario |

---

## 9. Decisiones de diseño

| Decisión | Alternativa descartada | Motivo |
|----------|----------------------|--------|
| Prisma 7 con adapter-pg | Prisma 5/6 con `url` directo | Prisma 7 requiere adapter pattern, más flexible |
| URL datasource en `prisma.config.ts` | `url = env(...)` en `schema.prisma` | Prisma 7 no acepta `url` en el bloque `datasource` de `schema.prisma` — arroja error P1012. La URL **solo** puede ir en `prisma.config.ts → datasource.url` |
| React + Vite (sin framework) | Next.js / Angular | App SPA interna, no necesita SSR. Simplicidad máxima |
| CSS puro con variables | Tailwind / MUI | Menor dependencia, control total del diseño TPV |
| `@Global()` PrismaModule | Import PrismaModule en cada módulo | Reduce boilerplate, servicio universal |
| Event emitter para desacoplar | Imports directos entre módulos | Permite añadir listeners sin modificar emisor |
| UUIDs en setup manual | Auth/Login propio | Prototipo, simplifica testing. Auth se añadirá en producción |

---

## 10. Restricciones técnicas no negociables

> Estas restricciones son mandatorias. Cualquier agente o desarrollador que construya o extienda este sistema debe conocerlas. Su incumplimiento produce errores que no son evidentes por los mensajes de error en sí mismos.

### 10.1 Prisma 7 — Configuración del datasource

**Regla**: La URL de conexión a PostgreSQL NO va en `prisma/schema.prisma`. Va exclusivamente en `prisma.config.ts`.

```typescript
// ✅ CORRECTO — prisma.config.ts
import path from 'node:path';
import { defineConfig } from 'prisma/config';
export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
```

```prisma
// ✅ CORRECTO — prisma/schema.prisma
datasource db {
  provider = "postgresql"
  // ← aquí NO hay url en Prisma 7
}
```

```prisma
// ❌ INCORRECTO — causa error P1012 en Prisma 7
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")  ← no permitido
}
```

**Por qué**: En Prisma 7, el sistema de configuración se centralizó en `prisma.config.ts`. El bloque `datasource` del schema perdió el argumento `url`. Cualquier migración desde Prisma 5/6 debe mover la URL al nuevo archivo.

### 10.2 NestJS — Orden de rutas en controllers

**Regla**: Las rutas literales (estáticas) deben declararse **antes** que las rutas con parámetros dinámicos (`:param`) cuando son del mismo prefijo en el mismo controller.

```typescript
// ✅ CORRECTO
@Post('barra/abrir')      // literal primero
abrirBarra(...) {}

@Post(':mesaId/abrir')    // dinámico después
abrirMesa(...) {}
```

```typescript
// ❌ INCORRECTO — ':mesaId/abrir' captura '/barra/abrir' con mesaId='barra'
@Post(':mesaId/abrir')    // dinámico primero → captura todo
abrirMesa(...) {}

@Post('barra/abrir')      // nunca se alcanza
abrirBarra(...) {}
```

**Por qué**: NestJS evalúa las rutas en orden de declaración. Un parámetro dinámico como `:mesaId` es un wildcard que atrapa cualquier segmento, incluyendo los literales que vengan después.

### 10.3 PostgreSQL — Permisos del usuario de desarrollo

**Regla**: El usuario de PostgreSQL que usa Prisma en desarrollo necesita el atributo `CREATEDB`. Sin él, `prisma migrate dev` falla al intentar crear la shadow database.

```sql
-- Aplicar al crear el usuario o después:
ALTER USER gastroflow CREATEDB;
```

**Por qué**: `prisma migrate dev` crea una base de datos temporal (shadow database) para calcular diffs del schema. Requiere permiso `CREATEDB`. `prisma migrate deploy` (producción) no necesita este permiso porque no usa shadow database.

**En Docker Compose**: el usuario `postgres` ya lo tiene. Relevante solo cuando se crea un usuario específico para la aplicación.

### 10.4 PostgreSQL portable — Arranque tras fallo

**Solo aplica si se usa PostgreSQL portable** (sin Docker). Si PostgreSQL se cierra forzadamente (kill del proceso, apagado brusco), deja un fichero `postmaster.pid` que impide el próximo arranque.

```powershell
# Síntoma: pg_ctl start devuelve "another server might be running"
# Fix:
Remove-Item "C:\pgsql\data\postmaster.pid" -Force -ErrorAction SilentlyContinue
& "C:\pgsql\bin\pg_ctl.exe" -D "C:\pgsql\data" -l "C:\pgsql\logs\postgres.log" start
```

---

## 11. Scripts de automatización

### `setup.ps1` (PowerShell)

Script one-click que:
1. Verifica Node.js ≥ 18 y Docker instalados
2. `npm install` en raíz y frontend
3. `docker compose up -d` → PostgreSQL
4. Espera a que PostgreSQL responda
5. `prisma migrate dev --name init`
6. `npx tsx prisma/seed.ts`
7. Arranca backend (`npm run start:dev`) y frontend (`npm run dev`) en paralelo

**Resultado**: Aplicación lista en http://localhost:5173
