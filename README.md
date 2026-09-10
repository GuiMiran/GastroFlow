# GastroFlow

> SaaS multitenant de gestión integral para hostelería en España.  
> TPV · ERP · Contabilidad · Fiscal · CRM — todo en una plataforma.
>
> **Demo de uso e implementación del catálogo Spec Driven Development (SDD) de [Spectra](https://github.com/GuiMiran/spectra).**

La integración piloto con el formato actual de SPECTRA está documentada en
[`docs/SPECTRA-DEMO.md`](docs/SPECTRA-DEMO.md). La referencia técnica de cada
comando está en [`docs/SPECTRA-CLI.md`](docs/SPECTRA-CLI.md). Se puede ejecutar
el piloto con `npm run spectra:demo`.
La primera base de evidencia y planificacion de solo lectura esta en
[`docs/SPECTRA-AUTONOMY-PILOT.md`](docs/SPECTRA-AUTONOMY-PILOT.md).

---

## Tabla de Contenidos

- [🚀 Arranque Rápido](#-arranque-rápido-si-ya-está-instalado) — **Si ya tienes todo configurado**
- [Visión General](#visión-general)
- [Arquitectura](#arquitectura)
- [Stack Tecnológico](#stack-tecnológico)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Requisitos Previos](#requisitos-previos-primera-instalación)
- [Instalación Rápida](#instalación-rápida-primera-vez)
- [Instalación Manual](#instalación-manual)
- [Persistencia de Datos](#persistencia-de-datos)
- [Scripts Disponibles](#scripts-disponibles)
- [Variables de Entorno](#variables-de-entorno)
- [Base de Datos](#base-de-datos)
- [API REST](#api-rest)
- [Frontend](#frontend)
- [Testing](#testing)
- [DevOps & CI/CD](#devops--cicd)
- [Especificaciones](#especificaciones)
- [Licencia](#licencia)

---

## Visión General

**GastroFlow** unifica las herramientas fragmentadas de un negocio de hostelería en un único sistema:

| Módulo | Alcance |
|--------|---------|
| **M1 — TPV / Ventas** | Sala, mesas, comandas, cobros, tickets con IVA, VeriFactu, caja |
| **M2 — ERP / Backoffice** | Catálogo, escandallos, inventario, pedidos a proveedor, RRHH |
| **M3 — Contabilidad** | Asientos automáticos, libros registro, modelos fiscales (303/390/347) |
| **M4 — CRM / Web** | Reservas online, fidelización (puntos/niveles), carta digital |

**Usuarios**: Gerente, Camarero/a, Cocinero/a, Barra, Contable, Compras, Cliente final.

---

## Arquitectura

```
┌─────────────────┐        ┌──────────────────────────────────┐
│   React 19      │  HTTP  │         NestJS 11                │
│   Vite 8        │◄──────►│                                  │
│   :5173         │  /api  │  ┌──────────┐  ┌──────────────┐  │
│                 │        │  │ TpvModule │  │InventarioMod │  │
│  SetupPage      │        │  │  Mesas    │  │  Stock       │  │
│  SalaPage       │        │  │  Comandas │  │  Escandallos │  │
│  ComandaPage    │        │  │  Cobros   │  │  Proveedores │  │
│  CobroPage      │        │  │  Caja     │  └──────────────┘  │
│  CajaPage       │        │  │  Catálogo │                    │
│                 │        │  └──────────┘  ┌──────────────┐  │
└─────────────────┘        │  ┌──────────┐  │  FiscalModule │  │
                           │  │Contable  │  │  VeriFactu   │  │
                           │  │Asientos  │  │  Modelos 303 │  │
                           │  └──────────┘  └──────────────┘  │
                           │                                  │
                           │  PrismaModule (@Global)          │
                           └────────────┬─────────────────────┘
                                        │
                                        ▼
                           ┌──────────────────────┐
                           │  PostgreSQL 16        │
                           │  Docker · :5432       │
                           │  ~40 tablas           │
                           └──────────────────────┘
```

**Patrones aplicados**:
- **Modular monolith** — cada módulo NestJS encapsula dominio propio
- **Domain Events** — `@nestjs/event-emitter` desacopla módulos
- **Repository via ORM** — Prisma 7 con adapter PostgreSQL
- **Contratos de operación** — PRE/POST/ERROR documentados para cada operación
- **VeriFactu** — cadena SHA-256 para integridad fiscal (RD 1007/2023)

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Backend | NestJS + TypeScript | 11.x |
| Base de Datos | PostgreSQL | 16 |
| ORM | Prisma | 7.5 |
| Frontend | React + TypeScript | 19.x |
| Bundler | Vite | 8.x |
| Router | React Router | 7.x |
| Testing | Jest + ts-jest | 30.x |
| Contenedores | Docker Compose | — |
| Runtime | Node.js | ≥ 18 |

---

## Estructura del Proyecto

```
gastroflow/
├── src/                            # Backend NestJS
│   ├── main.ts                     # Bootstrap (puerto 3000, prefijo /api/v1)
│   ├── app.module.ts               # Módulo raíz
│   ├── common/
│   │   ├── prisma/                 # PrismaModule (@Global)
│   │   │   ├── prisma.module.ts
│   │   │   └── prisma.service.ts
│   │   ├── events/
│   │   │   └── domain-events.ts    # Definición de eventos de dominio
│   │   └── types/
│   │       └── iva.ts              # Utilidades de cálculo IVA
│   └── modules/
│       ├── tpv/                    # Punto de Venta
│       │   ├── controllers/
│       │   │   ├── mesa.controller.ts
│       │   │   ├── comanda.controller.ts
│       │   │   ├── cobro.controller.ts
│       │   │   ├── caja.controller.ts
│       │   │   └── producto.controller.ts
│       │   ├── services/
│       │   │   ├── mesa.service.ts
│       │   │   ├── comanda.service.ts
│       │   │   ├── cobro.service.ts
│       │   │   └── caja.service.ts
│       │   └── tpv.module.ts
│       ├── inventario/             # Gestión de stock
│       ├── contable/               # Contabilidad (partida doble)
│       ├── fiscal/                 # Modelos fiscales (303, 390…)
│       └── verifactu/              # Cadena hash fiscal
├── prisma/
│   ├── schema.prisma               # ~40 modelos de datos
│   └── seed.ts                     # Datos de demostración
├── frontend/                       # Aplicación React
│   ├── src/
│   │   ├── main.tsx                # Punto de entrada
│   │   ├── App.tsx                 # Router
│   │   ├── api.ts                  # Cliente API tipado
│   │   ├── context/
│   │   │   └── AppContext.tsx       # Estado global + notificaciones
│   │   ├── components/
│   │   │   └── Layout.tsx           # Sidebar + topbar
│   │   ├── pages/
│   │   │   ├── SetupPage.tsx        # Configuración inicial
│   │   │   ├── SalaPage.tsx         # Mapa de mesas
│   │   │   ├── ComandaPage.tsx      # Toma de comandas (TPV)
│   │   │   ├── CobroPage.tsx        # Cobro y pago
│   │   │   └── CajaPage.tsx         # Gestión de caja
│   │   └── styles/
│   │       └── global.css           # Estilos globales
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts               # Proxy /api → :3000
├── test/
│   └── criterios-aceptacion.spec.ts # Tests de aceptación
├── specs/                           # Especificación completa (13 capas: 00 a 12)
├── docker-compose.yml               # PostgreSQL
├── setup.ps1                        # Script de instalación automática
├── package.json                     # Backend
├── tsconfig.json
└── jest.config.ts
```

---

## 🚀 Arranque Rápido (Si ya está instalado)

> 💡 **Ver [QUICK-START.md](QUICK-START.md)** para una guía de referencia completa con todos los comandos del día a día.

**Si ya pasaste por el setup inicial**, simplemente:

```powershell
# 1. Asegúrate de que Docker Desktop está corriendo
# 2. Levanta toda la aplicación (BD + API + Frontend):
docker compose up -d
```

✅ **Listo**. Accede a **http://localhost** (o http://localhost:80)

**Para detener todo**:
```powershell
docker compose down    # Detiene contenedores (datos persisten)
```

**Ver logs en tiempo real**:
```powershell
docker compose logs -f backend    # Backend
docker compose logs -f frontend   # Frontend
docker compose logs -f            # Todos los servicios
```

---

## Requisitos Previos (Primera instalación)

- **Node.js** ≥ 18 — [nodejs.org](https://nodejs.org)
- **Docker Desktop** — [docker.com](https://www.docker.com/products/docker-desktop)
- **Git** (opcional, para clonar)

---

## Instalación Rápida (Primera vez)

```powershell
# Un solo comando levanta todo: DB + migraciones + seed + backend + frontend
.\setup.ps1
```

Esto:
1. Verifica Node.js y Docker
2. Instala dependencias (backend + frontend)
3. Levanta PostgreSQL en Docker
4. Ejecuta migraciones Prisma
5. Carga datos de demostración
6. Arranca backend (:3000) y frontend (:5173)

Abre **http://localhost:5173** y pega los UUIDs del seed en la página Setup.

---

## Instalación Manual

### 1. Base de datos

```bash
docker compose up -d
```

### 2. Variables de entorno

```bash
# ya existe .env — verificar que contiene:
DATABASE_URL="postgresql://gastroflow:gastroflow@localhost:5432/gastroflow?schema=public"
```

### 3. Backend

```bash
npm install
npx prisma migrate dev --name init   # Crear esquema
npx tsx prisma/seed.ts                # Datos demo
npm run start:dev                     # http://localhost:3000/api/v1
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev                           # http://localhost:5173
```

---

## Persistencia de Datos

**¿Los datos persisten entre reinicios de Docker?** → **SÍ** ✅

El archivo `docker-compose.yml` define un volumen persistente para PostgreSQL:

```yaml
volumes:
  - pgdata:/var/lib/postgresql/data
```

| Acción | Efecto en datos |
|--------|----------------|
| `docker compose down` | ✅ **Conserva** todos los datos (BD, usuarios, seed) |
| `docker compose restart` | ✅ **Conserva** todos los datos |
| `docker compose up -d` (después de `down`) | ✅ **Restaura** estado exacto anterior |
| `docker compose down -v` | ⚠️ **ELIMINA** todos los datos (flag `-v` borra volúmenes) |

**Las migraciones Prisma** (`prisma/migrations/`) siempre persisten porque están en archivos del proyecto, no en Docker.

**Para resetear completamente la BD** (útil cuando cambias el schema):

```bash
docker compose down -v              # Elimina contenedores + volumen
docker compose up -d                # Crea entorno limpio
npx prisma migrate dev --name init  # Re-crea schema
npx tsx prisma/seed.ts              # Re-carga datos demo
```

---

## Scripts Disponibles

### Backend (raíz)

| Script | Comando | Descripción |
|--------|---------|-------------|
| `start:dev` | `ts-node src/main.ts` | Servidor de desarrollo |
| `build` | `tsc` | Compilar TypeScript |
| `start` | `node dist/main.js` | Servidor de producción |
| `test` | `jest` | Ejecutar tests unitarios |
| `test:watch` | `jest --watch` | Tests en modo watch |
| `test:cov` | `jest --coverage` | Tests con reporte de cobertura |
| `test:integration` | `jest (integration config)` | Tests de integración con DB |
| `lint` | `eslint src/ test/` | Linter TypeScript |
| `lint:fix` | `eslint --fix` | Auto-corregir problemas de lint |
| `format` | `prettier --write` | Formatear código |
| `format:check` | `prettier --check` | Verificar formato |
| `typecheck` | `tsc --noEmit` | Verificar tipos sin compilar |
| `spec:validate` | `tsx scripts/spec-validation.ts` | Validación SDD (specs ↔ tests) |
| `prisma:generate` | `prisma generate` | Regenerar cliente Prisma |
| `prisma:migrate` | `prisma migrate dev` | Aplicar migraciones |
| `prisma:studio` | `prisma studio` | UI visual de la BD |
| `docker:up` | `docker compose up -d` | Levantar todo el stack |
| `docker:down` | `docker compose down` | Detener el stack |
| `docker:build` | `docker compose build` | Construir imágenes Docker |

### Frontend (`frontend/`)

| Script | Comando | Descripción |
|--------|---------|-------------|
| `dev` | `vite` | Dev server con HMR (:5173) |
| `build` | `vite build` | Build de producción |
| `preview` | `vite preview` | Preview del build |

---

## Variables de Entorno

| Variable | Valor por defecto | Descripción |
|----------|-------------------|-------------|
| `DATABASE_URL` | `postgresql://gastroflow:gastroflow@localhost:5432/gastroflow` | Cadena de conexión PostgreSQL |
| `NODE_ENV` | `development` | Entorno de ejecución |
| `PORT` | `3000` | Puerto del backend |

---

## Base de Datos

### Modelos principales (~40 tablas)

| Dominio | Modelos |
|---------|---------|
| **Multi-tenant** | Tenant, Establecimiento |
| **Sala / TPV** | Zona, Mesa, Servicio, Comanda, LineaComanda, Modificador |
| **Facturación** | SerieFacturacion, Ticket, Cobro, RegistroVeriFactu |
| **Caja** | Caja, TurnoCaja, MovimientoCaja |
| **Catálogo** | CategoriaProducto, Producto, Alergeno, ProductoAlergeno |
| **Inventario** | Ingrediente, Escandallo, EscandalloIngrediente, Stock, MovimientoStock, Almacen |
| **Compras** | Proveedor, PedidoProveedor, LineaPedido, AlbaranEntrada, LineaAlbaran, FacturaCompra |
| **Contabilidad** | EjercicioFiscal, AsientoContable, ApunteContable, LibroRegistroEmitida, LibroRegistroRecibida |
| **RRHH** | Empleado, Turno, Fichaje |
| **CRM** | Cliente, Consentimiento, ProgramaFidelizacion, Reserva |

### Datos de demostración (`prisma/seed.ts`)

El seed crea un entorno completo listo para probar:
- 1 tenant ("Restaurante Demo S.L.") + 1 establecimiento ("Bar El Rincón")
- 4 empleados (gerente, 2 camareros, cocinera)
- 3 zonas (Terraza 6 mesas, Salón 8 mesas, Barra 4 mesas = 18 mesas)
- 8 categorías de producto + 32 productos con IVA correcto
- 1 caja + 3 series de facturación (V/F/R)
- 14 alérgenos UE + programa de fidelización + almacén

---

## API REST

Base URL: `http://localhost:3000/api/v1`

Documentación completa de la API: **[docs/API.md](docs/API.md)**

### Resumen de endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/mesas/establecimiento/:id/mapa` | Mapa de sala con zonas y mesas |
| `POST` | `/mesas/:mesaId/abrir` | Abrir mesa → crear servicio |
| `POST` | `/mesas/barra/abrir` | Servicio de barra (sin mesa) |
| `GET` | `/productos/catalogo` | Catálogo: categorías + productos |
| `POST` | `/comandas` | Tomar comanda |
| `GET` | `/comandas/servicio/:id/cuenta` | Calcular cuenta con desglose IVA |
| `POST` | `/comandas/servicio/:id/dividir` | Dividir cuenta |
| `DELETE` | `/comandas/lineas/:id` | Anular línea de comanda |
| `POST` | `/cobros/servicio/:id` | Cobrar servicio → emitir ticket |
| `POST` | `/cobros/factura-completa` | Factura completa desde ticket |
| `POST` | `/cobros/rectificativa` | Factura rectificativa |
| `POST` | `/caja/turno/abrir` | Abrir turno de caja |
| `POST` | `/caja/turno/:id/movimiento` | Registrar movimiento de caja |
| `POST` | `/caja/turno/:id/cerrar` | Cerrar turno (arqueo) |

---

## Frontend

| Página | Ruta | Función |
|--------|------|---------|
| **Setup** | `/setup` | Configuración inicial (IDs tenant, empleado, caja) |
| **Sala** | `/sala` | Mapa visual de mesas por zonas con estados en color |
| **Comanda** | `/comanda/:servicioId` | TPV: categorías, productos, ticket en tiempo real |
| **Cobro** | `/cobro/:servicioId` | Pago: resumen cuenta, efectivo/tarjeta/bizum, numpad |
| **Caja** | `/caja` | Abrir/cerrar turno, movimientos, arqueo |

Más detalles: **[frontend/README.md](frontend/README.md)**

---

## Testing

```bash
# Tests unitarios
npm test

# Con cobertura
npm run test:cov

# Mode watch
npm run test:watch

# Tests de integración (requiere PostgreSQL activo)
npm run test:integration

# Validación SDD (specs ↔ tests)
npm run spec:validate
```

### Estado actual: 19/19 tests passing

**Tests de aceptación** (`test/criterios-aceptacion.spec.ts`):

| Test | Criterio | Qué valida |
|------|----------|------------|
| AC-001 | Cobro con IVA | Desglose 10% + 21% correcto |
| AC-002 | División cuenta | 100€ / 3 = 33,33 + 33,33 + 33,34 |
| AC-003 | División por productos | Cada comensal con IVA propio |
| AC-004 | Pago mixto | Σ pagos ≥ total |
| AC-006 | VeriFactu | Hash chain SHA-256 secuencial |
| AC-008 | Arqueo caja | Descuadre calculado correctamente |
| AC-010 | Stock automático | Descuento por escandallo |
| AC-030 | Modelo 303 | Repercutido − soportado |
| AC-050 | Puntos CRM | Acumulación y nivel |
| RN-038 | Descuento pre-IVA | Descuento antes de base imponible |
| INV-030 | Partida doble | Debe = Haber en asientos |

### Estrategia de testing

```
test/
├── criterios-aceptacion.spec.ts       ← Tests unitarios puros (sin DB)
├── *.integration.spec.ts              ← Tests con PostgreSQL real (futuro)
frontend/
└── src/**/*.test.tsx                  ← Tests React (futuro)
```

---

## DevOps & CI/CD

### Pipeline SDD (Spec-Driven Development)

El proyecto usa un pipeline CI/CD en GitHub Actions que valida no solo el código,
sino la trazabilidad entre especificaciones y tests.

```
┌──────────────────────────────────────────────────────────┐
│  Stage 1: LINT          eslint + prettier + tsc --noEmit │
│  Stage 2: UNIT TESTS    jest --coverage (19 tests)       │
│  Stage 3: INTEGRATION   jest + PostgreSQL (service)      │
│  Stage 4: BUILD         tsc + vite build                 │
│  Stage 5: SPEC VALIDATE spec-validation.ts (SDD)         │
│  Stage 6: DOCKER        docker build + compose test      │
└──────────────────────────────────────────────────────────┘
```

### Archivos de configuración

| Archivo | Propósito |
|---------|----------|
| `.github/workflows/ci.yml` | Pipeline completo GitHub Actions |
| `Dockerfile` | Backend multi-stage (Node 22 Alpine) |
| `frontend/Dockerfile` | Frontend multi-stage (Vite + nginx) |
| `frontend/nginx.conf` | Reverse proxy API + SPA routing |
| `docker-compose.yml` | Stack completo: DB + API + Web |
| `eslint.config.mjs` | ESLint flat config para TypeScript |
| `.prettierrc` | Estilo de código (single quotes, trailing commas) |
| `.husky/pre-commit` | Gate local: lint + typecheck + test |
| `.husky/commit-msg` | Conventional Commits enforcement |
| `commitlint.config.cjs` | Reglas de formato de commits |
| `jest.config.ts` | Tests unitarios |
| `jest.integration.config.ts` | Tests de integración |
| `scripts/spec-validation.ts` | Validación SDD specs ↔ tests |

### Docker

```bash
# Levantar todo el stack (DB + API + Frontend)
npm run docker:up

# Solo base de datos (desarrollo local)
docker compose up -d postgres

# Construir imágenes
npm run docker:build
```

### Conventional Commits

Formato: `tipo(scope): mensaje`

```
feat(tpv): añadir endpoint KDS cocina
fix(erp): corregir cálculo stock negativo
test(contabilidad): añadir AC-031 libro registro
ci(devops): configurar stage de deploy staging
```

Scopes válidos: `tpv`, `erp`, `contabilidad`, `crm`, `specs`, `devops`, `prisma`, `frontend`

---

## Especificaciones

El directorio `specs/` contiene la especificación completa del dominio en 11 capas,
**totalmente modularizada** para consumo de IA agéntica.

| Capa | Directorio | Archivos | Contenido |
|------|-----------|----------|----------|
| 00 | `00-vision/` | 1 | Propósito, usuarios, alcance, normativa |
| 01 | `01-glosario/` | 1 | 94 términos en 8 contextos |
| 02 | `02-historias/` | 13 + 4 idx | 59 historias en M1/M2/M3/M4 |
| 03 | `03-reglas-negocio/` | 9 + idx | 51 reglas en 9 dominios |
| 04 | `04-invariantes/` | 6 + idx | 27 invariantes en 6 dominios |
| 05 | `05-contratos/` | 1 | ~20 operaciones PRE/POST/ERROR |
| 06 | `06-politicas/` | 5 + idx | 21 políticas SI/ENTONCES |
| 07 | `07-eventos/` | 6 + idx | 24 eventos con reacciones |
| 08 | `08-agentes/` | 9 + idx | 9 agentes autónomos |
| 09 | `09-skills/` | 8 + idx | 55 skills atómicos |
| 10 | `10-workflows/` | 1 | 9 workflows orquestados |
| 11 | `11-criterios-aceptacion/` | 7 + idx | 26 criterios DADO/CUANDO/ENTONCES |
| docs | `docs/` | 1 | Reportes de estado del backlog |

**Total**: ~400+ elementos especificados en archivos modulares de <100 líneas.

Índice maestro: **[specs/SPEC-INDEX.md](specs/SPEC-INDEX.md)**

---

## Licencia

UNLICENSED — Uso privado.
