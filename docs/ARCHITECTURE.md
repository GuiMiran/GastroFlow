# GastroFlow — Documentación de Arquitectura y Buenas Prácticas

> **Versión**: 0.1.0 · **Stack**: NestJS 11 + React 19 + PostgreSQL 16 + Prisma 7.5  
> **Fecha**: 2026-03-15 · **Estado de tests**: 138/138 passing

---

## Tabla de contenido

1. [Visión general del sistema](#1-visión-general-del-sistema)
2. [Arquitectura de alto nivel](#2-arquitectura-de-alto-nivel)
3. [Estructura de directorios](#3-estructura-de-directorios)
4. [Backend — NestJS](#4-backend--nestjs)
   - 4.1 [Módulos del dominio](#41-módulos-del-dominio)
   - 4.2 [Capa común (common)](#42-capa-común-common)
   - 4.3 [Patrones aplicados](#43-patrones-aplicados)
5. [Frontend — React 19](#5-frontend--react-19)
6. [Persistencia — Prisma + PostgreSQL](#6-persistencia--prisma--postgresql)
7. [Autenticación y autorización](#7-autenticación-y-autorización)
8. [Eventos de dominio](#8-eventos-de-dominio)
9. [Compliance fiscal — VeriFactu](#9-compliance-fiscal--verifactu)
10. [Estrategia de testing](#10-estrategia-de-testing)
11. [Buenas prácticas aplicadas](#11-buenas-prácticas-aplicadas)
12. [DevOps y calidad de código](#12-devops-y-calidad-de-código)
13. [Análisis de patrones — Validación por tests](#13-análisis-de-patrones--validación-por-tests)

---

## 1. Visión general del sistema

**GastroFlow** es un SaaS multitenant de gestión integral para hostelería en España. Integra cinco módulos funcionales bajo una arquitectura monolítica modular, preparada para escalar hacia microservicios.

```
Módulo         Estado      HU implementadas
──────────────────────────────────────────
M0-PLATFORM    ~33%        Auth + RBAC + Empleados
M1-TPV         ~95%        Mesa, Comanda, Cobro, KDS, Caja
M2-ERP         ~72%        Catálogo, Compras, Inventario, RRHH
M3-Contabilidad ~20%       Asientos automáticos, Fiscal
M4-CRM           0%        No iniciado
```

---

## 2. Arquitectura de alto nivel

```
┌────────────────────────────────────────────────────────────┐
│                        CLIENTE                              │
│   Browser (React 19 + Vite)   ←→   Nginx (producción)     │
└───────────────────────┬────────────────────────────────────┘
                        │ HTTP (REST) / SSE (KDS)
                        ▼
┌────────────────────────────────────────────────────────────┐
│              BACKEND — NestJS 11                            │
│                                                             │
│  main.ts ──► AppModule                                      │
│              ├── AuthModule (JWT global, bcrypt)            │
│              ├── TpvModule (Mesa/Comanda/Cobro/KDS/Caja)   │
│              ├── CatalogoModule                             │
│              ├── ComprasModule                              │
│              ├── InventarioModule                           │
│              ├── RrhhModule                                 │
│              ├── ContableModule (asientos automáticos)      │
│              ├── FiscalModule                               │
│              ├── VeriFactuModule (RD 1007/2023)             │
│              └── EmpleadoModule                             │
│                                                             │
│  common/                                                    │
│  ├── PrismaModule (ORM shared)                              │
│  ├── events/domain-events.ts (14+ eventos)                  │
│  └── types/iva.ts (cálculos fiscales)                       │
└───────────────────────┬────────────────────────────────────┘
                        │ Prisma ORM (Connection Pool)
                        ▼
┌────────────────────────────────────────────────────────────┐
│           PostgreSQL 16  (Docker / producción)              │
│           53+ modelos, migraciones versionadas              │
└────────────────────────────────────────────────────────────┘
```

### Flujo de una solicitud HTTP

```
Request
  → ValidationPipe (class-validator: whitelist + forbidNonWhitelisted)
  → JwtAuthGuard (verifica Bearer token)
  → RolesGuard (verifica @Roles(...))
  → Controller
  → Service (lógica de dominio, transacciones Prisma)
  → EventEmitter2 (eventos de dominio asíncronos)
  → Response
```

---

## 3. Estructura de directorios

```
DEMOPRO2/
├── src/
│   ├── main.ts                  # Bootstrap: ValidationPipe, CORS, prefix api/v1
│   ├── app.module.ts            # Módulo raíz — composición de todos los módulos
│   ├── common/
│   │   ├── prisma/              # PrismaService singleton (OnModuleInit/Destroy)
│   │   ├── events/              # Clases de eventos de dominio tipadas
│   │   └── types/               # iva.ts — cálculos fiscales puros y testeables
│   └── modules/
│       ├── auth/                # JWT, bcrypt, guards, decorators
│       ├── empleado/            # RBAC, auditoría, gestión de empleados
│       ├── tpv/                 # Núcleo operativo (controllers + services)
│       │   ├── controllers/     # caja, cobro, comanda, kds, mesa, producto, setup
│       │   └── services/        # caja, cobro, comanda, kds, mesa
│       ├── catalogo/
│       ├── compras/
│       ├── inventario/
│       ├── rrhh/
│       ├── contable/            # Asientos automáticos vía eventos
│       ├── fiscal/              # Declaraciones (Modelo 303, etc.)
│       └── verifactu/           # Cadena hash RD 1007/2023
├── test/                        # Tests unitarios + integración (Jest)
├── prisma/
│   ├── schema.prisma            # 53+ modelos, relaciones, índices
│   ├── seed.ts                  # Datos iniciales idempotentes
│   └── migrations/              # Versionado de esquema DB
├── frontend/
│   └── src/
│       ├── api.ts               # Cliente HTTP tipado (interfaces TypeScript)
│       ├── App.tsx              # Routing principal
│       ├── context/             # AuthContext (JWT + rol)
│       ├── pages/               # Una página por HU principal
│       ├── components/          # Componentes reutilizables
│       └── hooks/               # Custom hooks (SWR-like)
├── specs/                       # Especificaciones de dominio (11 capas)
├── docs/                        # Documentación técnica
└── docker-compose.yml           # PostgreSQL + backend + frontend
```

---

## 4. Backend — NestJS

### 4.1 Módulos del dominio

#### AuthModule

Responsabilidad única: autenticación y emisión de JWT.

| Componente | Responsabilidad |
|---|---|
| `AuthService` | Login por PIN (sala) y email/password (backoffice) |
| `JwtAuthGuard` | Valida Bearer token en cada petición protegida |
| `RolesGuard` | Verifica `@Roles(...)` contra el payload JWT |
| `JwtModule.forRoot()` | JWT global — disponible sin reimportar en ningún módulo |

**Seguridad implementada**:
- Bcrypt para hashing de PIN y password (no se almacenan en claro)
- Rate limiting en memoria: 3 intentos PIN → bloqueo 60s; 5 intentos password → bloqueo 15min
- Timing-safe: el bloqueo PIN se referencia por `establecimientoId + primer dígito` (evita enumerar empleados)
- JWT con expiración configurable (defecto 24h)

#### TpvModule

Módulo más complejo — contiene el ciclo de vida completo de una venta.

```
mesa.service    → abrir/cerrar/mover/unir mesas (INV-002)
comanda.service → tomar comanda, modificadores, anular línea (INV-004)
cobro.service   → cobrar (transacción atómica), ticket, VeriFactu (INV-001/007/008)
kds.service     → SSE para pantallas cocina/barra (EVT-003)
caja.service    → arqueo de caja, cierre de turno (AC-008)
```

#### VeriFactuModule

Cumple `RD 1007/2023` (España). Garantiza:

| Invariante | Implementación |
|---|---|
| `INV-001` | `ultimoNumero: { increment: 1 }` dentro de transacción con row lock |
| `INV-007` | Registros inmutables — nunca se hace UPDATE/DELETE sobre `registroVeriFactu` |
| `INV-008` | Hash SHA-256 encadenado: `hash = SHA256(JSON(datos) + hashAnterior)` |

#### ContableModule

Asientos contables automáticos mediante eventos de dominio:

```typescript
@OnEvent(TicketEmitidoEvent.event)
async onTicketEmitido(event: TicketEmitidoEvent) { ... }

@OnEvent(FacturaCompraRegistradaEvent.event)
async onFacturaCompraRegistrada(event: ...) { ... }
```

Plan de cuentas PGC pymes hostelería: `570 Caja`, `700 Ventas`, `477 IVA Repercutido`, `400 Proveedores`, etc.

### 4.2 Capa común (common)

#### PrismaService

```typescript
@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  // Ciclo de vida gestionado por NestJS IoC
  async onModuleInit()    { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}
```

Patrón: **singleton global** exportado por `PrismaModule`. Cada módulo lo declara como dependencia; NestJS asegura una única instancia.

#### Tipos IVA (`common/types/iva.ts`)

Funciones puras y testeables para cálculos fiscales:

```typescript
calcularBaseImponible(pvpConIva, tipoIva)  // PVP → base
calcularCuotaIva(base, tipoIva, pvp)       // base → cuota
calcularDesgloseIva(lineas)                // array → { base4/iva4/base10/... }
round2(n)                                  // redondeo bancario a 2 decimales
```

#### Eventos de dominio (`common/events/domain-events.ts`)

14+ eventos tipados como clases con `static readonly event`:

```typescript
ComandaRegistradaEvent.event  // 'comanda.registrada'
TicketEmitidoEvent.event      // 'ticket.emitido'
MesaAbiertaEvent.event        // 'mesa.abierta'
// ...
```

### 4.3 Patrones aplicados

| Patrón | Dónde | Beneficio |
|---|---|---|
| **Repository (via Prisma)** | Todos los servicios | Abstracción DB, testeabilidad con mocks |
| **Guard Chain** | JwtAuthGuard → RolesGuard | Separación autenticación/autorización |
| **Domain Events** | EventEmitter2 + clases tipadas | Desacoplamiento entre módulos |
| **Event Sourcing (parcial)** | VeriFactu chain + AuditLog | Trazabilidad inmutable |
| **Transaction Script** | Operaciones críticas (cobro) | Atomicidad garantizada por Prisma |
| **DTO Validation** | class-validator + ValidationPipe | Validación en frontera del sistema |
| **Singleton Service** | PrismaService, todos los `@Injectable()` | Un único estado por módulo |
| **Observer** | `@OnEvent(...)` en AsientoService | Reacción asíncrona a eventos |
| **Decorator Pattern** | `@Roles()`, `@UseGuards()` | Metadatos legibles en controllers |

---

## 5. Frontend — React 19

### Arquitectura del cliente

```
App.tsx
├── AuthContext          → estado global JWT + rol + empleadoId
├── Layout.tsx           → menú dinámico por rol (HU-M0-ROL-004)
└── Pages/
    ├── LoginPage        → PIN (sala) / email:password (backoffice)
    ├── MesasPage        → mapa de mesas en tiempo real
    ├── ComandaPage      → tomar/modificar comanda
    ├── CobroPage        → cobro + ticket + WhatsApp/imprimir
    ├── KdsPage          → pantalla cocina SSE
    ├── CajaPage         → arqueo/cierre
    └── ...ERP/Backoffice pages
```

### Cliente HTTP tipado (`api.ts`)

- Función genérica `request<T>()` con manejo de errores centralizado
- Interfaces TypeScript completas para cada entidad del dominio
- Sin librerías de fetch adicionales — usa `fetch` nativo del navegador
- Todas las respuestas de la API tienen tipos en tiempo de compilación

### Ciclo de vida del ticket (`TicketDia.cicloVida`)

```
EMITIDA → ASIENTO_GENERADO → LIBRO_IVA_REGISTRADO → VERIFACTU_FIRMADA → CONSERVADA
```

Este tipo union refleja exactamente los eventos de dominio del backend, garantizando consistencia entre capas.

---

## 6. Persistencia — Prisma + PostgreSQL

### Modelo de datos (resumen)

```
Tenant (1)
  └── Establecimiento (N)
        ├── Zona (N) → Mesa (N) → Servicio (N) → Comanda (N) → LineaComanda (N)
        ├── SerieFacturacion (N) → Ticket (N) → RegistroVeriFactu (N)
        ├── Producto (N) → Categoria, Alergeno
        ├── Empleado (N) → rol, pinHash, passwordHash, emailLogin
        ├── AsientoContable (N) → LineaAsiento (N)
        ├── Proveedor (N) → FacturaCompra (N) → LineaFacturaCompra (N)
        └── LicenciaModulo (N)
```

### Convenciones del esquema

- UUIDs como `@id @default(uuid())` para todos los modelos principales
- `createdAt` / `updatedAt` en todos los modelos con datos temporales
- Índices explícitos en `tenantId`, `establecimientoId` (campos de alta cardinalidad usados en WHERE)
- `@@map()` para nombres de tabla en snake_case
- Enums para valores finitos: `RolEmpleado`, `EstadoMesa`, etc.

### Transacciones

Las operaciones críticas usan `prisma.$transaction(async (tx) => { ... })`:
- Cobro de mesa: obtener siguiente número + crear ticket + crear VeriFactu + cerrar servicio (todo atómico)
- Numeración VeriFactu: `ultimoNumero: { increment: 1 }` dentro de transacción garantiza ausencia de saltos

---

## 7. Autenticación y autorización

### Flujo de autenticación

```
[1] PIN login:
  POST /api/v1/auth/pin
  { establecimientoId, pin }
  → busca empleados activos del establecimiento
  → bcrypt.compare(pin, pinHash) para cada empleado
  → JWT(24h) con { sub: empleadoId, rol, establecimientoId }

[2] Email/password login (backoffice):
  POST /api/v1/auth/login
  { emailLogin, password }
  → findUnique por email (índice único)
  → bcrypt.compare(password, passwordHash)
  → JWT(24h) con payload idéntico
```

### Control de acceso basado en roles (RBAC)

```typescript
// Definición de roles
enum RolEmpleado {
  ADMIN, GERENTE, ENCARGADO, CAMARERO, COCINERO, BARTENDER, CAJA
}

// Uso en controllers
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolEmpleado.ADMIN, RolEmpleado.GERENTE)
@Delete(':id')
eliminarEmpleado(@Param('id') id: string) { ... }
```

### Protección anti-fuerza bruta

| Tipo | Umbral | Bloqueo | Almacén |
|---|---|---|---|
| PIN | 3 intentos | 60 segundos | Map en memoria |
| Password | 5 intentos | 15 minutos | Map en memoria |

> **Nota para producción**: Migrar a Redis para persistir bloqueos en instancias múltiples.

---

## 8. Eventos de dominio

### Catálogo de eventos (EVT-001 → EVT-014)

```typescript
EVT-001  MesaAbiertaEvent          'mesa.abierta'
EVT-002  ComandaRegistradaEvent    'comanda.registrada'
EVT-003  PlatoListoEvent           'plato.listo'
EVT-004  TicketEmitidoEvent        'ticket.emitido'
EVT-005  FacturaCompraRegistrada   'factura.compra.registrada'
EVT-006  MovimientoStockEvent      'stock.movimiento'
EVT-007  LineaComandaAnuladaEvent  'linea.comanda.anulada'
EVT-008  AsientoContableCreado     'asiento.creado'
EVT-009  VacacionesSolicitadas     'vacaciones.solicitadas'
// ...
```

### Beneficios del patrón

1. **Desacoplamiento**: `CobroService` emite `TicketEmitidoEvent`; `AsientoService` reacciona sin que cobro tenga dependencia de contable.
2. **Extensibilidad**: Añadir un nuevo subscriber (ej. notificación push) sin modificar código existente — abierto/cerrado (OCP).
3. **Trazabilidad**: Cada evento es una clase tipada con timestamp implícito — los handlers pueden auditar.
4. **Testabilidad**: Los eventos son POJOs — fáciles de instanciar y verificar en tests.

---

## 9. Compliance fiscal — VeriFactu

GastroFlow cumple el `RD 1007/2023` (Reglamento VeriFactu, España) mediante tres invariantes:

### INV-001 — Numeración secuencial sin saltos

```typescript
// Dentro de transacción Prisma con lock implícito en UPDATE
const serie = await tx.serieFacturacion.update({
  where: { id: serieFacturacionId },
  data: { ultimoNumero: { increment: 1 } },
});
// Formato: "A-2026-000001"
const codigoCompleto = `${serie.prefijo}-${serie.year}-${String(serie.ultimoNumero).padStart(6, '0')}`;
```

### INV-007 — Inmutabilidad de registros VeriFactu

- Nunca se ejecuta `UPDATE` ni `DELETE` sobre `RegistroVeriFactu`
- Solo operaciones `CREATE` y `findFirst` (lectura del último hash)
- Verificado por el test `verifactu-chain.integration.spec.ts`

### INV-008 — Cadena hash SHA-256

```
hash(registro_N) = SHA256(JSON(datos_N) + hash(registro_{N-1}))
hash(registro_1) = SHA256(JSON(datos_1) + "GENESIS")
```

Si se manipula cualquier registro intermedio, `verificarCadena()` detecta la ruptura de la cadena.

---

## 10. Estrategia de testing

### Pirámide de tests

```
         /──────────────────\
        /   E2E Integration   \     2 suites
       /  (supertest + AppModule)\
      /──────────────────────────\
     /      Unit Tests             \   10 suites, 138 tests
    /  (Jest + mocks de PrismaService)\
   /────────────────────────────────────\
  /      Domain / Business Logic          \   Sin mocks — funciones puras
 /   (criterios-aceptacion.spec.ts)        \
/──────────────────────────────────────────────\
```

### Tests unitarios (138 tests / 138 passing)

| Archivo | Cubre |
|---|---|
| `auth.service.spec.ts` | HU-M0-ROL-001/002/003 — PIN login, bloqueo, RBAC |
| `comanda.service.spec.ts` | OP-002/003 — tomar comanda, anular línea |
| `cobro.service.spec.ts` | OP-004 — cobro, VeriFactu, cambio |
| `mesa.service.spec.ts` | OP-001/007/008 — abrir/mover/unir mesas |
| `kds.service.spec.ts` | OP-009 — pantalla cocina |
| `caja.service.spec.ts` | AC-008 — arqueo de caja |
| `verifactu.service.spec.ts` | INV-001/007/008 — hash, numeración |
| `asiento.service.spec.ts` | INV-030 — partida doble |
| `criterios-aceptacion.spec.ts` | AC-001/002/006/008/030/INV-030 — lógica pura |
| `m2-erp-kds.spec.ts` | M2-ERP — inventario, compras |

### Tests de integración (E2E)

| Archivo | Flujo probado |
|---|---|
| `venta-completa.integration.spec.ts` | Mesa → Comanda → Cobro → Ticket → VeriFactu |
| `verifactu-chain.integration.spec.ts` | 2 ventas → cadena hash → tamper → detección |

### Estrategia de mocking

```typescript
// Patrón estándar: mock de PrismaService por objeto literal
const mockPrisma = {
  empleado: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  auditLog: { create: jest.fn() },
} as unknown as PrismaService;

// Inyección manual (sin TestingModule) para tests unitarios rápidos
service = new AuthService(mockPrisma, mockJwt);
```

Esto permite:
- Tests que arrancan en < 50ms (sin DB ni HTTP)
- Control total de datos de entrada/salida
- Verificación de efectos secundarios (`expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(...)`)

### Cobertura por módulo

| Módulo | Cobertura |
|---|---|
| M0-PLATFORM | Alta — auth, empleado, RBAC |
| M1-TPV | Alta — todos los servicios + E2E completo |
| M2-ERP | Media — servicios principales |
| M3-Contabilidad | Media — asientos + VeriFactu |
| M4-CRM | Ninguna (no implementado) |

---

## 11. Buenas prácticas aplicadas

### SOLID

| Principio | Aplicación concreta |
|---|---|
| **S** — Single Responsibility | Cada servicio tiene una responsabilidad: `ComandaService` solo gestiona comandas |
| **O** — Open/Closed | Los handlers de eventos (`@OnEvent`) extienden comportamiento sin modificar emisores |
| **L** — Liskov | Los guards implementan `CanActivate` — son intercambiables |
| **I** — Interface Segregation | DTOs específicos por operación — no un único DTO genérico |
| **D** — Dependency Inversion | Todos los servicios dependen de abstracciones (interfaces de Prisma, no implementaciones) |

### DRY (Don't Repeat Yourself)

- Cálculos IVA centralizados en `common/types/iva.ts` — reutilizados por TPV, Fiscal y tests
- `PrismaService` como singleton compartido — nunca instanciado directamente
- Función `request<T>()` en `api.ts` encapsula todo el manejo HTTP del frontend

### Seguridad (OWASP Top 10)

| Amenaza | Mitigación |
|---|---|
| Injection | Prisma ORM — parametrización automática, nunca SQL crudo |
| Broken Access Control | JwtAuthGuard + RolesGuard en cada endpoint sensible |
| Auth Failures | bcrypt (sal automática), rate limiting por IP/clave, JWT con expiración |
| Security Misconfiguration | ValidationPipe con `whitelist: true, forbidNonWhitelisted: true` |
| XSS | Backend API puro (JSON) — sin renderizado HTML en servidor |
| SSRF | Sin llamadas HTTP salientes por ahora |

### Inmutabilidad y trazabilidad

- `AuditLog` en operaciones de empleados (crear/modificar/dar de baja)
- `RegistroVeriFactu` inmutable — cumplimiento legal
- Eventos de dominio como hechos pasados — nunca se modifican

### Convenciones de código

- Todos los strings de errores llevan prefijo de operación: `'OP-002 ERROR: ...'`
- Los servicios loguean en `INFO` las operaciones exitosas y en `WARN` los fallos esperados
- Los controladores no contienen lógica de negocio — solo delegación
- Rutas estáticas ANTES que dinámicas en el mismo controller (ej. `/barra/abrir` antes que `/:mesaId/abrir`)

---

## 12. DevOps y calidad de código

### Pipeline de calidad

```
git commit
  → Husky pre-commit
    → ESLint (src/ + test/)
    → Prettier check
    → TypeScript (tsc --noEmit)
  → Commitlint (Conventional Commits)
```

### Scripts disponibles

```bash
npm test                  # Unit tests (138 tests)
npm run test:cov          # + cobertura de código
npm run test:integration  # E2E (requiere PostgreSQL)
npm run lint              # ESLint
npm run typecheck         # TypeScript sin compilar
npm run spec:validate     # Validación specs de dominio
npm run prisma:migrate    # Migraciones DB
npm run docker:up         # Levantar todo el stack
```

### Docker

```yaml
# docker-compose.yml
services:
  postgres:   # PostgreSQL 16
  backend:    # NestJS (Dockerfile multistage)
  frontend:   # React + Nginx (Dockerfile multistage)
```

El frontend usa Nginx para servir la SPA y hacer proxy de `/api/v1` al backend, evitando problemas de CORS en producción.

---

## 13. Análisis de patrones — Validación por tests

Esta sección audita que los patrones declarados son validados empíricamente por la suite de tests.

### Patrón: Transacciones atómicas

**Afirmación**: Las operaciones de cobro son atómicas — si falla cualquier paso, todo se revierte.

**Validación en tests**:
- `cobro.service.spec.ts` — verifica que `prisma.$transaction` es llamado exactamente una vez
- `venta-completa.integration.spec.ts` — flujo completo confirma que ticket + VeriFactu se crean juntos o ninguno

### Patrón: Invariante numeración secuencial (INV-001)

**Afirmación**: No pueden existir dos tickets con el mismo número en la misma serie.

**Validación en tests**:
```typescript
// verifactu-chain.integration.spec.ts
expect(ticket2.numero).toBe(ticket1.numero + 1); // N+1 = N + 1
```

### Patrón: Cadena hash inviolable (INV-008)

**Afirmación**: Cualquier manipulación de un registro VeriFactu es detectable.

**Validación en tests**:
```typescript
// verifactu-chain.integration.spec.ts
// Paso 3: antes de tamper → cadena íntegra
const check1 = await verifactuService.verificarCadena(prisma);
expect(check1.integra).toBe(true);

// Paso 4: tamper hash intermedio
await prisma.registroVeriFactu.update({ ... hashAnterior: 'manipulado' });

// Paso 5: cadena detecta ruptura
const check2 = await verifactuService.verificarCadena(prisma);
expect(check2.integra).toBe(false);
```

### Patrón: RBAC (HU-M0-ROL-003)

**Afirmación**: Solo roles priviligiados pueden modificar empleados.

**Validación en tests**:
```typescript
// auth.service.spec.ts
it('GERENTE puede dar de alta empleados', async () => {
  const result = await empleadoService.crearEmpleado(datosNuevoEmpleado, { rol: 'GERENTE' });
  expect(result.id).toBeDefined();
});

it('CAMARERO NO puede dar de alta empleados', async () => {
  await expect(
    empleadoService.crearEmpleado(datos, { rol: 'CAMARERO' })
  ).rejects.toThrow(ForbiddenException);
});
```

### Patrón: Rate limiting anti-fuerza bruta

**Afirmación**: Después de 3 intentos de PIN fallidos, se lanza error de bloqueo.

**Validación en tests**:
```typescript
// auth.service.spec.ts
it('bloquea tras 3 fallos consecutivos (AC-03 HU-M0-ROL-001)', async () => {
  // 3 intentos fallidos
  for (let i = 0; i < 3; i++) {
    await expect(service.loginPin('est-1', '1234')).rejects.toThrow(UnauthorizedException);
  }
  // El 4º lanza TooManyRequestsException
  await expect(service.loginPin('est-1', '1234')).rejects.toThrow(TooManyRequestsException);
});
```

### Patrón: Partida doble contable (INV-030)

**Afirmación**: Σ cargos = Σ abonos en todos los asientos generados automáticamente.

**Validación en tests**:
```typescript
// criterios-aceptacion.spec.ts y asiento.service.spec.ts
it('INV-030: partida doble — Σ debe = Σ haber', () => {
  const totalDebe  = lineas.filter(l => l.tipo === 'DEBE').reduce((s, l) => s + l.importe, 0);
  const totalHaber = lineas.filter(l => l.tipo === 'HABER').reduce((s, l) => s + l.importe, 0);
  expect(round2(totalDebe)).toBe(round2(totalHaber));
});
```

### Patrón: Cálculos IVA correctos (AC-001)

**Afirmación**: `PVP = Base + Cuota IVA` con exactitud de 2 decimales.

**Validación en tests** (`criterios-aceptacion.spec.ts`):
```
1× Tortilla (8,00€, IVA 10%): base = 7,27€, cuota = 0,73€ ✓
2× Cerveza   (7,00€, IVA 21%): base = 5,79€, cuota = 1,21€ ✓
Total: 7,27 + 0,73 + 5,79 + 1,21 = 15,00€ ✓
```

---

## Resumen ejecutivo

GastroFlow implementa una arquitectura modular bien estructurada que logra:

1. **Separación de responsabilidades**: Cada módulo encapsula su dominio sin dependencias cruzadas innecesarias.
2. **Compliance fiscal real**: VeriFactu con cadena hash SHA-256 verificada por tests de integración.
3. **Seguridad en capas**: Validación en frontera (ValidationPipe), autenticación (JWT + bcrypt), autorización (RBAC por rol) y protección anti-fuerza bruta.
4. **Trazabilidad**: AuditLog + eventos de dominio inmutables + cadena VeriFactu.
5. **Testabilidad alta**: Funciones puras para lógica fiscal, inyección de dependencias para todos los servicios, 138 tests passing.
6. **Extensibilidad**: EventEmitter2 permite añadir comportamiento reactivo (M3-Contabilidad escucha eventos de M1-TPV) sin acoplar módulos.

> Los tests no son solo red de seguridad — son la documentación ejecutable de los invariantes de negocio.
