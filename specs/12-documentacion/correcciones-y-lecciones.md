# Correcciones y Lecciones Aprendidas — GastroFlow

> Registro de bugs corregidos, incompatibilidades detectadas y decisiones de diseño derivadas de errores reales.  
> **Propósito**: que cualquier agente IA o desarrollador que itere sobre este proyecto no repita los mismos errores.  
> Última actualización: 2026-03-15

---

## Instrucciones para la IA

Consulta este documento **antes de**:
- Modificar rutas en controllers de NestJS.
- Cambiar la configuración de Prisma (schema o config).
- Modificar el modelo de seed (`prisma/seed.ts`).
- Agregar campos a modelos existentes de Prisma.
- Configurar el entorno de desarrollo local.

Cada corrección incluye: síntoma, causa raíz, fix aplicado y reglas a seguir en el futuro.

---

## CORRECCIÓN 1 — Orden de rutas en NestJS: estáticas antes que dinámicas

**Fecha**: 2026-03-14  
**Archivo afectado**: `src/modules/tpv/controllers/mesa.controller.ts`  
**Error observado**: `POST /api/v1/mesas/barra/abrir` devolvía **HTTP 500** con `P2025: No record found for a query` en `mesa.findUniqueOrThrow`.

### Causa raíz

NestJS evalúa las rutas de un controlador **en el orden en que están declaradas**. La ruta dinámica `@Post(':mesaId/abrir')` estaba declarada **antes** que la ruta estática `@Post('barra/abrir')`. Al llegar una petición a `/mesas/barra/abrir`, NestJS la capturaba con el patrón dinámico, asignando `mesaId = 'barra'`. El servicio intentaba hacer `findUniqueOrThrow({ where: { id: 'barra' } })`, que no existe en base de datos → Prisma P2025.

```
// ❌ INCORRECTO — la dinámica captura a la estática
@Post(':mesaId/abrir')   ← se declara primero
abrirMesa(...) { ... }

@Post('barra/abrir')     ← nunca se alcanza
abrirBarra(...) { ... }
```

### Fix aplicado

Mover la ruta específica/estática **antes** del parámetro dinámico:

```typescript
// ✅ CORRECTO — la estática va primero
@Post('barra/abrir')
abrirBarra(@Body() body: { camareroId: string }) {
  return this.mesaService.abrirServicioBarra(body.camareroId);
}

@Post(':mesaId/abrir')
abrirMesa(
  @Param('mesaId') mesaId: string,
  @Body() body: { camareroId: string; comensales: number },
) {
  return this.mesaService.abrirMesa({ mesaId, ...body });
}
```

### Regla a seguir

> **En NestJS, dentro de un mismo controlador, las rutas con segmentos literales (estáticas) siempre deben declararse ANTES que las rutas con parámetros dinámicos (`:param`) del mismo nivel de profundidad.**

Aplica a todos los verbos HTTP (`@Get`, `@Post`, `@Patch`, `@Delete`).  
Ejemplos de pares afectados: `barra/abrir` vs `:mesaId/abrir`, `config/global` vs `:id/config`, etc.

---

## CORRECCIÓN 2 — Prisma 7.5: la URL de datasource va en `prisma.config.ts`, NO en `schema.prisma`

**Fecha**: 2026-03-14  
**Archivos afectados**: `prisma.config.ts`, `prisma/schema.prisma`  
**Errores observados**:
- `Error: The datasource.url property is required` al correr `prisma migrate dev`
- `P1012: Argument url is not allowed in schema.prisma` al intentar añadir `url` al bloque `datasource`

### Causa raíz

Prisma 7.x introduce un nuevo sistema de configuración basado en `prisma.config.ts`. En esta versión:
- El bloque `datasource db { ... }` en `schema.prisma` **NO acepta la propiedad `url`** (rompe con P1012).
- La URL de conexión debe configurarse en `prisma.config.ts` bajo `datasource.url`.

La configuración original en `prisma.config.ts` tenía una estructura inválida (`migrate.async url()`) que no aportaba la URL al runner de migraciones.

### Fix aplicado

**`prisma/schema.prisma`** — sin cambios, el bloque datasource queda sin `url`:
```prisma
datasource db {
  provider = "postgresql"
  // ← NO hay url aquí en Prisma 7
}
```

**`prisma.config.ts`** — estructura correcta para Prisma 7.5:
```typescript
import path from 'node:path';
import { defineConfig } from 'prisma/config';

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://gastroflow:gastroflow@localhost:5432/gastroflow?schema=public',
  },
});
```

### Regla a seguir

> **En Prisma 7+, nunca añadir `url = env("DATABASE_URL")` al bloque `datasource` de `schema.prisma`. La URL de la base de datos pertenece exclusivamente a `prisma.config.ts` bajo la clave `datasource.url`.**

Si se migra desde Prisma 5/6 a Prisma 7, este es el primer cambio breaking a aplicar.

---

## CORRECCIÓN 3 — Permisos de usuario Prisma: `CREATEDB` necesario para shadow database

**Fecha**: 2026-03-14  
**Error observado**: `P3014: Prisma Migrate could not create the shadow database` al ejecutar `prisma migrate dev`

### Causa raíz

`prisma migrate dev` necesita crear una **shadow database** temporal para calcular el diff del schema. Para ello, el usuario de PostgreSQL que usa Prisma debe tener el permiso `CREATEDB`. El usuario `gastroflow` fue creado inicialmente sin este permiso.

### Fix aplicado

```sql
ALTER USER gastroflow CREATEDB;
```

### Regla a seguir

> **El usuario de PostgreSQL usado por Prisma en entorno de desarrollo debe tener el atributo `CREATEDB`.** Incluir este `ALTER USER` en los scripts de provisioning del entorno local (`setup.ps1`, `docker-compose.yml` init scripts, etc.).

En producción, `prisma migrate deploy` (no `dev`) no necesita CREATEDB porque no usa shadow database.

---

## CORRECCIÓN 4 — Seed: campos obligatorios del schema no reflejados en `prisma/seed.ts`

**Fecha**: 2026-03-14  
**Archivo afectado**: `prisma/seed.ts`  
**Errores observados**: Errores de validación de Prisma al crear registros de `Tenant`, `Establecimiento` y `Producto`.

### Causa raíz

El seed fue escrito usando nombres de campo que no coincidían con el schema de Prisma actualizado, y omitía campos `@required` sin valor default.

### Campos corregidos

| Modelo | Campo incorrecto/faltante | Corrección aplicada |
|---|---|---|
| `Tenant` | `nifEmpresa` (no existe en schema) | → `nif: 'B12345678'` |
| `Tenant` | `plan` (no existe en schema) | → `email: 'demo@restaurantedemo.es'` |
| `Establecimiento` | faltaban: `nif`, `codigoPostal`, `ciudad`, `provincia` | → añadidos con valores de demo |
| `Producto` | faltaba `establecimientoId` | → `establecimientoId: estab.id` |

### Regla a seguir

> **Cada vez que se añada o renombre un campo en `schema.prisma`, revisar `prisma/seed.ts` y actualizarlo en el mismo commit.** Considerar mantener el seed como un test de compilación: si el seed no compila con el schema actual, el PR no debería mergearse.

---

## CORRECCIÓN 5 — Seed idempotente: limpiar datos antes de re-ejecutar

**Fecha**: 2026-03-14  
**Error observado**: `Unique constraint failed on the fields: (nif)` al ejecutar el seed por segunda vez tras un fallo parcial en la primera ejecución.

### Causa raíz

Un fallo en mitad del seed dejó datos parciales en la base de datos. Al re-ejecutar con `prisma db seed`, los primeros `create` volvieron a fallar por violación de unicidad en `nif`.

### Fix aplicado (immediate)

```powershell
npx prisma migrate reset --force
```
Borra todos los datos y re-aplica migraciones desde cero antes de ejecutar el seed.

### Regla a seguir

> **Para entornos locales, usar `prisma migrate reset --force` antes de re-ejecutar el seed si hubo un fallo previo.** Para hacer el seed robusto a re-ejecuciones, añadir `upsert` en lugar de `create`, o añadir un bloque de limpieza al inicio del seed:

```typescript
// Al inicio de seed.ts, para hacerlo idempotente:
await prisma.servicio.deleteMany();
await prisma.mesa.deleteMany();
await prisma.zona.deleteMany();
// ...resto de modelos en orden inverso de dependencias FK
```

---

## CORRECCIÓN 6 — Arranque de entorno local: PostgreSQL portable y stale PID file

**Fecha**: 2026-03-14  
**Contexto**: Docker no disponible (CDN de Docker Hub bloqueado por red corporativa). Se usa PostgreSQL 16.3 portable en `C:\pgsql`.

### Problema: PostgreSQL no arranca por stale PID file

**Error observado**: `pg_ctl start` devuelve "another server might be running; trying to start server anyway" pero el servidor no arranca. `pg_ctl status` devuelve "no server running". Puerto 5432 cerrado.

**Causa raíz**: Tras un apagado forzado (kill de proceso, apagado de máquina), PostgreSQL deja el fichero `C:\pgsql\data\postmaster.pid` en disco. Este fichero hace que `pg_ctl` asuma que ya hay una instancia corriendo y se niega a arrancar.

### Fix aplicado

```powershell
Remove-Item "C:\pgsql\data\postmaster.pid" -Force -ErrorAction SilentlyContinue
& "C:\pgsql\bin\pg_ctl.exe" -D "C:\pgsql\data" -l "C:\pgsql\logs\postgres.log" start
```

### Datos del entorno local de referencia

| Parámetro | Valor |
|---|---|
| Binarios | `C:\pgsql\bin\` |
| Data dir | `C:\pgsql\data\` |
| Log | `C:\pgsql\logs\postgres.log` |
| Usuario | `gastroflow` / `gastroflow` |
| Base de datos | `gastroflow` |
| Puerto | `5432` |
| DATABASE_URL | `postgresql://gastroflow:gastroflow@localhost:5432/gastroflow?schema=public` |

### Secuencia completa de arranque local (sin Docker)

```powershell
# 1. Arrancar PostgreSQL
Remove-Item "C:\pgsql\data\postmaster.pid" -ErrorAction SilentlyContinue
& "C:\pgsql\bin\pg_ctl.exe" -D "C:\pgsql\data" -l "C:\pgsql\logs\postgres.log" start
Start-Sleep -Seconds 3

# 2. Verificar que levantó
(Test-NetConnection localhost -Port 5432 -WarningAction 0).TcpTestSucceeded  # debe ser True

# 3. Arrancar backend
$env:DATABASE_URL = "postgresql://gastroflow:gastroflow@localhost:5432/gastroflow?schema=public"
$backendJob = Start-Job -Name "backend" -ScriptBlock {
  Set-Location "C:\REpos\DEMOPRO2"
  $env:DATABASE_URL = "postgresql://gastroflow:gastroflow@localhost:5432/gastroflow?schema=public"
  npx ts-node src/main.ts 2>&1
}
Start-Sleep -Seconds 12  # esperar a que NestJS inicialice

# 4. Arrancar frontend
$frontendJob = Start-Job -Name "frontend" -ScriptBlock {
  Set-Location "C:\REpos\DEMOPRO2\frontend"
  npm run dev 2>&1
}

# 5. Verificar
Receive-Job $backendJob.Id -Keep | Select-String "successfully started"
# URLs: API → http://localhost:3000/api/v1  |  Frontend → http://localhost:5173
```

### Regla a seguir

> **Si PostgreSQL portable no arranca, lo primero es eliminar `C:\pgsql\data\postmaster.pid` antes de volver a intentar `pg_ctl start`.** Incluir este paso en cualquier script de reinicio del entorno.

---

## IDs de datos de demo (seed actual)

Útiles para llamadas manuales a la API y pruebas:

| Entidad | Nombre | ID |
|---|---|---|
| Establecimiento | Restaurante Demo | `58e4bd90-3729-44af-91cd-8dc83bc52fdd` |
| Caja | Caja Principal | `4ac90d54-7173-4c66-9e9d-197987759171` |
| Empleado | Carlos (Gerente) | `33b314c5-14df-4508-85ce-c9c7a0a1198b` |
| Empleado | Ana (Camarera) | `434c252c-e9bd-4840-9a9b-8a0cd44421dc` |
| Empleado | Pedro (Camarero) | `912d7631-456a-4f00-b853-a2355dfdf5ec` |
| Empleado | María (Cocinera) | `3c445e2e-cdf8-43c7-a404-b17a3b27fc93` |
| Zona | Terraza | `2eaa19b4-231b-4762-816b-b7ab778e0c76` |
| Zona | Salón | `f49ae015-0700-4cbe-b4ca-39cfdf7d7e72` |
| Zona | Barra | `50bd6198-c50f-46eb-a756-4f20a5b296ef` |

Conteo de datos semilla: 1 tenant · 1 establecimiento · 4 empleados · 3 zonas · 18 mesas · 32 productos · 8 categorías · 1 caja · 3 series de facturación · 14 alérgenos · 1 programa de fidelización · 1 almacén.

---

## CORRECCIÓN 7 — CobroPage: pantalla en blanco cuando el servicioId es inválido o stale

**Fecha**: 2026-03-15  
**Archivo afectado**: `frontend/src/pages/CobroPage.tsx`  
**Error observado**: Al navegar a `/cobro/<uuid>` con un servicioId que no existe en la BD (p.ej. UUID de una sesión anterior o de otra BD), la página se quedaba completamente en blanco sin mensaje de error visible.

### Causa raíz

El `useEffect` llamaba a `api.comandas.cuenta(servicioId)`. Si la llamada fallaba (404 o 500), el `catch` solo ejecutaba `notify(e.message, 'error')` y el estado `loading` pasaba a `false`. Sin un estado de error separado, el componente renderizaba el formulario de cobro con `cuenta = null` y `total = 0` — formulario vacío, sin líneas, sin mensaje explicativo. El usuario no entendía qué había fallado.

### Síntoma típico

Ocurre al:
- Navegar directamente a una URL de cobro guardada de una sesión anterior.
- Migrar de BD (portable → Docker): todos los UUIDs cambian al re-ejecutar el seed.
- Compartir una URL de cobro que ya fue cobrada (el servicio se cierra tras el cobro).

### Fix aplicado

Añadido estado `errorCarga: string | null`. Si `api.comandas.cuenta()` rechaza, se guarda el mensaje en `errorCarga` y se renderiza una pantalla de error explícita con botón "← Volver a Sala":

```typescript
const [errorCarga, setErrorCarga] = useState<string | null>(null);

// En el catch del useEffect:
setErrorCarga(e.message ?? 'No se pudo cargar la cuenta');
notify(e.message, 'error');

// En el render, antes del formulario de cobro:
if (errorCarga) {
  return (
    <div className="empty-state">
      <div className="icon">❌</div>
      <p>No se pudo cargar la cuenta</p>
      <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{errorCarga}</p>
      <button className="btn btn-outline" onClick={() => navigate('/sala')}>
        ← Volver a Sala
      </button>
    </div>
  );
}
```

### Regla a seguir

> **Toda página que carga un recurso por ID desde la URL (useParams) debe tener un estado de error explícito, no solo un toast.** Si el recurso no existe, el usuario necesita ver una pantalla que lo explique y le ofrezca una salida. El patrón es: `loading → errorCarga → ticketResult → formulario normal`.
