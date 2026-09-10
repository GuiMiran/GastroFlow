# DT-09 — Setup y Arranque del Entorno Local

> Parte de la [documentación técnica](_index.md).  
> Usa este documento para arrancar el entorno de desarrollo, solucionar problemas de setup o reproducir el entorno desde cero.

---

## 🚀 Arranque Rápido (Uso Diario)

**Si ya completaste el setup inicial**, arrancar el sistema es simple:

### Con Docker (contenedores - recomendado)

```powershell
# 1. Asegurar que Docker Desktop está corriendo
# 2. Levantar toda la aplicación:
docker compose up -d
```

✅ **Listo**. Aplicación disponible:
- Frontend: **http://localhost** (puerto 80)
- API: **http://localhost:3000/api/v1**
- Swagger: **http://localhost:3000/docs**

**Detener todo**:
```powershell
docker compose down    # Detiene contenedores (datos persisten ✅)
```

**Ver logs**:
```powershell
docker compose logs -f backend    # Solo backend
docker compose logs -f frontend   # Solo frontend  
docker compose logs -f            # Todos
```

### Con desarrollo local (sin Docker)

```powershell
# Terminal 1: Backend
npm run start:dev    # http://localhost:3000

# Terminal 2: Frontend
cd frontend
npm run dev          # http://localhost:5173
```

> **Nota**: PostgreSQL debe estar corriendo (Docker o instalación local).

---

## Requisitos previos (Primera instalación)

| Herramienta | Versión mínima | Verificar |
|-------------|----------------|-----------|
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| Docker Desktop | cualquier reciente | `docker --version` |
| PowerShell | 5.1+ (Windows) | incluido en Windows 10/11 |

---

## Ruta 1 — Setup automático con Docker (recomendada)

```powershell
.\setup.ps1
```

El script hace:
1. Verifica Node.js ≥ 18 y Docker instalados
2. `npm install` en raíz y en `frontend/`
3. `docker compose up -d` → arranca PostgreSQL 16 en contenedor
4. Espera a que PostgreSQL responda en puerto 5432
5. `npx prisma migrate dev --name init` → crea esquema
6. `npx tsx prisma/seed.ts` → carga datos demo
7. Arranca backend (`npm run start:dev`) y frontend (`npm run dev`) en paralelo

**Resultado**: App disponible en http://localhost:5173

> Si `setup.ps1` falla porque Docker no puede descargar la imagen, ver Ruta 2.

---

## Ruta 2 — Setup manual con PostgreSQL portable (sin Docker)

Usar cuando Docker Hub no está accesible (red corporativa, proxy, etc.).

### Paso 1 — Arrancar PostgreSQL

```powershell
# Si PostgreSQL portable está instalado en C:\pgsql:
Remove-Item "C:\pgsql\data\postmaster.pid" -ErrorAction SilentlyContinue
& "C:\pgsql\bin\pg_ctl.exe" -D "C:\pgsql\data" -l "C:\pgsql\logs\postgres.log" start
Start-Sleep -Seconds 3

# Verificar que levantó:
(Test-NetConnection localhost -Port 5432 -WarningAction 0).TcpTestSucceeded  # debe ser True
```

Datos de conexión del entorno local de referencia:

| Parámetro | Valor |
|-----------|-------|
| Host | `localhost` |
| Puerto | `5432` |
| Usuario | `gastroflow` |
| Contraseña | `gastroflow` |
| Base de datos | `gastroflow` |
| DATABASE_URL | `postgresql://gastroflow:gastroflow@localhost:5432/gastroflow?schema=public` |

### Paso 2 — Instalar dependencias y migrarar

```powershell
npm install
Set-Location frontend; npm install; Set-Location ..

$env:DATABASE_URL = "postgresql://gastroflow:gastroflow@localhost:5432/gastroflow?schema=public"
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
```

### Paso 3 — Arrancar backend y frontend

```powershell
# Backend (en background)
$backendJob = Start-Job -Name "backend" -ScriptBlock {
  Set-Location "C:\REpos\DEMOPRO2"
  $env:DATABASE_URL = "postgresql://gastroflow:gastroflow@localhost:5432/gastroflow?schema=public"
  npx ts-node src/main.ts 2>&1
}
Start-Sleep -Seconds 12   # esperar a que NestJS inicialice completamente

# Frontend (en background)
$frontendJob = Start-Job -Name "frontend" -ScriptBlock {
  Set-Location "C:\REpos\DEMOPRO2\frontend"
  npm run dev 2>&1
}

# Verificar backend activo:
Receive-Job $backendJob.Id -Keep | Select-String "successfully started"
```

**URLs**: Frontend → http://localhost:5173 | API → http://localhost:3000/api/v1

---

## Persistencia de datos (Docker)

Cuando usas `docker compose` (Ruta 1), **todos los datos de PostgreSQL persisten automáticamente** gracias al volumen `pgdata` definido en `docker-compose.yml`:

```yaml
volumes:
  - pgdata:/var/lib/postgresql/data
```

| Comando | Efecto en datos |
|---------|----------------|
| `docker compose down` | ✅ **Conserva** todos los datos (BD, migraciones, seed) |
| `docker compose up -d` | ✅ Restaura el estado exacto anterior |
| `docker compose restart` | ✅ Conserva todos los datos |
| `docker compose down -v` | ⚠️ **ELIMINA** todos los datos (flag `-v` borra volúmenes) |

**Para resetear completamente la BD** (útil en desarrollo):
```powershell
docker compose down -v              # Elimina contenedores + volumen
docker compose up -d                # Crea contenedores + volumen vacío
npx prisma migrate dev --name init  # Re-crea esquema
npx tsx prisma/seed.ts              # Re-carga datos demo
```

**Las migraciones (`prisma/migrations/`) siempre persisten** porque están en el sistema de archivos del proyecto, no en Docker.

---

## Solución de problemas frecuentes

### PostgreSQL no arranca — "another server might be running"

Hay un stale PID file. Solución:
```powershell
Remove-Item "C:\pgsql\data\postmaster.pid" -Force -ErrorAction SilentlyContinue
& "C:\pgsql\bin\pg_ctl.exe" -D "C:\pgsql\data" -l "C:\pgsql\logs\postgres.log" start
```
Ver [DT-08 RES-04](DT-08-decisiones-restricciones.md) para explicación completa.

### `prisma migrate dev` falla con P3014 (shadow database)

El usuario de BD necesita permiso `CREATEDB`:
```sql
ALTER USER gastroflow CREATEDB;
```
Ver [DT-08 RES-03](DT-08-decisiones-restricciones.md).

### `prisma migrate dev` falla con P1012 (url not allowed)

No añadir `url` al bloque `datasource` de `schema.prisma`. La URL va en `prisma.config.ts`.  
Ver [DT-08 RES-01](DT-08-decisiones-restricciones.md).

### Seed falla con "Unique constraint" en segunda ejecución

Limpiar datos parciales:
```bash
npx prisma migrate reset --force
```
Ver [DT-06 §Reglas](DT-06-seed-datos.md).

### Backend devuelve 500 con Prisma P2025 en rutas tipo `/recursos/accion`

Verificar el orden de rutas en el controller afectado. Las rutas literales deben ir antes que los parámetros dinámicos.  
Ver [DT-08 RES-02](DT-08-decisiones-restricciones.md).
