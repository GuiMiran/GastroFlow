# DT-08 — Decisiones de Diseño y Restricciones Técnicas

> Parte de la [documentación técnica](_index.md).  
> **Lee este documento ANTES de** cambiar de stack, modificar la configuración de Prisma, reestructurar controllers de NestJS o cambiar la configuración de PostgreSQL.

---

## Decisiones de diseño

| Decisión tomada | Alternativa descartada | Motivo |
|----------------|----------------------|--------|
| Prisma 7 con `adapter-pg` | Prisma 5/6 con `url` directo en schema | Prisma 7 usa adapter pattern; más flexible para connection pooling |
| URL datasource en `prisma.config.ts` | `url = env(...)` en `schema.prisma` | Prisma 7 no acepta `url` en el bloque `datasource` del schema — error P1012 |
| React + Vite sin framework | Next.js / Angular | App SPA interna, no necesita SSR. Complejidad mínima |
| CSS puro con variables | Tailwind / MUI | Menor dependencia, control total del diseño TPV táctil |
| `@Global()` PrismaModule | Importar PrismaModule en cada módulo | Reduce boilerplate, acceso universal a la BD |
| Event emitter para desacoplar módulos | Imports directos entre módulos | Añadir listeners sin modificar el emisor (Open/Closed) |
| UUIDs en página Setup (sin auth) | Sistema Login/JWT propio | Prototipo funcional; auth se añade en producción |

---

## Restricciones técnicas no negociables

> Estas restricciones son **mandatorias**. Cualquier agente o desarrollador que construya o extienda este sistema debe conocerlas. Su incumplimiento produce errores que no son evidentes por el mensaje de error en sí mismo.

---

### RES-01 — Prisma 7: la URL del datasource va en `prisma.config.ts`

**La URL de conexión a PostgreSQL NO va en `prisma/schema.prisma`.** Va exclusivamente en `prisma.config.ts`.

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
  // ← NO hay 'url' aquí en Prisma 7
}
```

```prisma
// ❌ INCORRECTO — causa error P1012 en Prisma 7
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")   // ← NO permitido en Prisma 7
}
```

**Por qué**: En Prisma 7, la configuración se centralizó en `prisma.config.ts`. El bloque `datasource` del schema eliminó el argumento `url`. En una migración desde Prisma 5/6, este es el cambio breaking principal.

---

### RES-02 — NestJS: rutas estáticas antes que dinámicas en el mismo controller

**Las rutas con segmentos literales deben declararse ANTES que las rutas con parámetros dinámicos** (`:param`) en el mismo controller y mismo nivel de profundidad.

```typescript
// ✅ CORRECTO — el literal 'barra/abrir' va primero
@Post('barra/abrir')
abrirBarra(@Body() body: { camareroId: string }) { ... }

@Post(':mesaId/abrir')
abrirMesa(@Param('mesaId') mesaId: string, ...) { ... }
```

```typescript
// ❌ INCORRECTO — ':mesaId/abrir' captura 'barra/abrir' con mesaId = 'barra'
@Post(':mesaId/abrir')   // captura todo: mesaId='barra', 'sala', etc.
abrirMesa(...) { ... }

@Post('barra/abrir')     // esta ruta nunca se alcanza
abrirBarra(...) { ... }
```

**Por qué**: NestJS evalúa las rutas en **orden de declaración**. Un parámetro dinámico como `:mesaId` actúa como wildcard y captura cualquier segmento de URL, incluyendo segmentos literales declarados después.

**Aplica a todos los verbos**: `@Get`, `@Post`, `@Patch`, `@Put`, `@Delete`.

---

### RES-03 — PostgreSQL: el usuario de desarrollo necesita CREATEDB

El usuario de PostgreSQL usado por Prisma en **desarrollo** debe tener el atributo `CREATEDB`.

```sql
ALTER USER gastroflow CREATEDB;
```

**Por qué**: `prisma migrate dev` crea una **shadow database** temporal para calcular el diff del schema. Sin `CREATEDB`, falla con error P3014.

`prisma migrate deploy` (producción) **no** necesita este permiso porque no usa shadow database.

**Nota Docker**: Si el usuario de la aplicación es `postgres` (superusuario por defecto del contenedor oficial), ya tiene el permiso. Solo es relevante cuando se crea un usuario específico para la app.

---

### RES-04 — PostgreSQL portable: eliminar postmaster.pid antes de arrancar

*Solo aplica si se usa PostgreSQL portable (sin Docker).*

Tras un cierre forzado (kill de proceso, apagado brusco del sistema), PostgreSQL deja el fichero `data/postmaster.pid` en disco. En el siguiente arranque, `pg_ctl start` lo detecta e interpreta que ya hay una instancia corriendo → el servidor no arranca.

```
Síntoma: pg_ctl devuelve "another server might be running; trying to start server anyway"
         seguido de "could not start server" o "no server running" en pg_ctl status
```

```powershell
# Fix — eliminar PID obsoleto y arrancar limpiamente
Remove-Item "C:\pgsql\data\postmaster.pid" -Force -ErrorAction SilentlyContinue
& "C:\pgsql\bin\pg_ctl.exe" -D "C:\pgsql\data" -l "C:\pgsql\logs\postgres.log" start
```
