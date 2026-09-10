---
description: Levanta el stack completo de GastroFlow (DB Docker + backend NestJS + frontend React)
allowed-tools: [Bash, Read, Edit]
---

# Launch GastroFlow

Levanta el stack completo de GastroFlow: PostgreSQL en Docker, backend NestJS en :3000 y frontend React en :5173.

## Pasos

### 1. Verificar y corregir .env

Lee `.env` y confirma que `DATABASE_URL` usa `localhost:5432` (NO `postgres:5432`).
Si tiene `@postgres:5432`, cámbialo a `@localhost:5432`. El host `postgres` solo funciona dentro de la red Docker interna.

### 2. Verificar Docker Desktop

Ejecuta: `docker info 2>&1 | head -5`

Si Docker no responde, informa al usuario que debe abrir Docker Desktop manualmente y esperar a que arranque antes de continuar.

### 3. Levantar PostgreSQL

```bash
cd c:/REpos/DEMOPRO2
docker compose up -d postgres
```

Espera a que el healthcheck pase (hasta 30s):
```bash
for i in $(seq 1 30); do
  docker exec gastroflow-db pg_isready -U gastroflow 2>/dev/null && echo "PostgreSQL listo" && break
  sleep 1
done
```

### 4. Ejecutar migraciones Prisma (si es necesario)

Comprueba si ya existe la tabla `Tenant` en la BD:
```bash
docker exec gastroflow-db psql -U gastroflow -d gastroflow -c "SELECT to_regclass('public.\"Tenant\"');" 2>/dev/null
```

Si devuelve `NULL` (esquema no creado):
```bash
cd c:/REpos/DEMOPRO2
npx prisma migrate dev --name init
```

Si la migración falla por "migration already exists", usa:
```bash
npx prisma db push
```

### 5. Seed de datos demo (si la BD está vacía)

Comprueba si hay datos en `Tenant`:
```bash
docker exec gastroflow-db psql -U gastroflow -d gastroflow -c "SELECT COUNT(*) FROM \"Tenant\";" 2>/dev/null
```

Si el conteo es 0:
```bash
cd c:/REpos/DEMOPRO2
npx tsx prisma/seed.ts
```

Captura los UUIDs impresos por el seed (tenant_id, establecimiento_id, empleado_id, caja_id) y muéstralos al usuario para que los pegue en la página /setup del frontend.

### 6. Arrancar backend NestJS

```bash
cd c:/REpos/DEMOPRO2
npm run start:dev &
```

Espera 8 segundos y verifica que responde:
```bash
sleep 8 && curl -s http://localhost:3000/api/v1/health 2>/dev/null || echo "backend arrancando..."
```

### 7. Arrancar frontend React

```bash
cd c:/REpos/DEMOPRO2/frontend
npm run dev &
```

### 8. Informe final

Muestra al usuario:

```
✅ GastroFlow arrancado:
  Frontend:  http://localhost:5173
  Backend:   http://localhost:3000/api/v1
  API Docs:  http://localhost:3000/docs
  Database:  postgresql://localhost:5432/gastroflow

  Si es primera vez: abre /setup y pega los UUIDs del seed.
```

## Problemas comunes y soluciones

| Síntoma | Causa | Solución |
|---------|-------|----------|
| `getaddrinfo ENOTFOUND postgres` | `.env` con host `postgres` en vez de `localhost` | Corrige `.env`: `@localhost:5432` |
| `docker: command not found` en bash | Docker no está en PATH del shell | Usa PowerShell: `.\setup.ps1` |
| `nest: command not found` | Usar `npx nest` o `./node_modules/.bin/nest` | Ya cubierto por `npm run start:dev` |
| `Port 5432 already in use` | PostgreSQL local ya corre | Detén el servicio local o cambia el puerto en docker-compose |
| `Migration already applied` | Migraciones ya existen | Usa `npx prisma db push` |
