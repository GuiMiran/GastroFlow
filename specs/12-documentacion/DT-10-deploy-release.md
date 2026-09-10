# DT-10 — Checklist de Deploy y Release

> Parte de la [documentación técnica](_index.md).  
> Usa este documento cada vez que vayas a desplegar una nueva versión o generar una release.  
> El objetivo es no saltarse ningún paso crítico y verificar el sistema antes/después de cada despliegue.

---

## Visión general

GastroFlow tiene tres entornos relevantes:

| Entorno | Base de datos | Cómo arrancar |
|---------|--------------|---------------|
| **Local (dev)** | Docker `gastroflow-db` o PostgreSQL portable | `.\setup.ps1` o manual — ver [DT-09](DT-09-setup-entorno.md) |
| **Staging** | BD dedicada, misma imagen Docker | `docker compose -f docker-compose.staging.yml up -d` |
| **Producción** | BD gestionada (RDS / Supabase / DO) | CI/CD pipeline — `prisma migrate deploy` + deploy imagen |

---

## A — Antes de mergear a `main` (checklist PR)

Ejecutar en local con la BD de Docker levantada:

```powershell
# 1. Tests unitarios de dominio
npm test

# 2. Smoke test de API (integración HTTP real)
powershell -ExecutionPolicy Bypass -File scripts/smoke-test-api.ps1
```

Ambos deben terminar con exit code 0. Si alguno falla, no mergear.

> El smoke test crea datos reales (abre barra, toma comanda, cobra). Se puede ejecutar tantas veces como se quiera en local/staging sin problema. Cada ejecución genera un ticket nuevo: `V-2026-XXXXXX`.

---

## B — Proceso de release (paso a paso)

### B.1 — Preparar la release

```powershell
# Asegurarse de estar en main y al día
git checkout main
git pull origin main

# Verificar que no hay cambios sin commitear
git status   # debe mostrar "nothing to commit"
```

### B.2 — Ejecutar la batería de tests completa

```powershell
# Tests unitarios
npm test

# Smoke test (requiere stack arrancado localmente)
powershell -ExecutionPolicy Bypass -File scripts/smoke-test-api.ps1
```

Si cualquier test falla → **parar, corregir, volver al paso B.1**.

### B.3 — Build de producción

```powershell
# Build del frontend
Set-Location frontend
npm run build        # genera frontend/dist/
Set-Location ..

# Verificar que el build de TypeScript del backend compila sin errores
npx tsc --noEmit
```

### B.4 — Construir y etiquetar imagen Docker

```powershell
# Sustituir X.Y.Z por el número de versión (semver)
docker build -t gastroflow-backend:X.Y.Z .
docker build -t gastroflow-frontend:X.Y.Z ./frontend
```

### B.5 — Aplicar migraciones en staging

```powershell
# Con DATABASE_URL apuntando a la BD de staging
$env:DATABASE_URL = "postgresql://user:pass@staging-host:5432/gastroflow?schema=public"
npx prisma migrate deploy
```

> **Nunca usar `prisma migrate dev` en staging ni producción.** Solo `migrate deploy`.  
> `migrate dev` crea una shadow DB y puede alterar el schema de formas inesperadas.

### B.6 — Smoke test en staging

```powershell
powershell -ExecutionPolicy Bypass -File scripts/smoke-test-api.ps1 -BaseUrl "https://staging.gastroflow.example.com/api/v1"
```

7/7 pasos deben pasar. Si falla → rollback (ver sección D).

### B.7 — Tag de Git y changelog

```powershell
git tag -a vX.Y.Z -m "Release X.Y.Z — <descripción breve>"
git push origin vX.Y.Z
```

### B.8 — Deploy a producción

Aplicar migraciones con `prisma migrate deploy` (igual que B.5, apuntando a prod).  
Desplegar imagen Docker nueva.  
Verificar health check: `GET /api/v1/setup/info` debe responder 200.

---

## C — Después de cada deploy (verificación post-despliegue)

| Verificación | Comando / URL |
|---|---|
| Backend responde | `Invoke-RestMethod https://<host>/api/v1/setup/info` |
| Frontend carga | Abrir `https://<host>` en navegador |
| Sin errores en logs | `docker logs gastroflow-backend --tail 50` |
| Migraciones aplicadas | `npx prisma migrate status` — sin migraciones pendientes |
| Smoke test (si hay entorno de pruebas) | `scripts/smoke-test-api.ps1 -BaseUrl https://<host>/api/v1` |

---

## D — Rollback

Si el deploy introduce un bug crítico:

```powershell
# 1. Revertir imagen Docker al tag anterior
docker pull gastroflow-backend:X.Y.Z-anterior
docker compose up -d --no-build   # con imagen anterior en docker-compose.yml

# 2. Si hubo migraciones: revertir con una migración de rollback manual
#    (Prisma no tiene rollback automático — hay que crear migración inversa)
#    Ver: https://www.prisma.io/docs/guides/database/production-troubleshooting

# 3. Verificar que el sistema vuelve a responder
Invoke-RestMethod http://localhost:3000/api/v1/setup/info
```

> Prisma no tiene `migrate rollback`. Para migraciones destructivas (drop column, rename), preparar siempre una migración manual de reversa antes de deployar.

---

## E — Resumen rápido (chuleta)

```
ANTES DE MERGEAR:
  npm test                                              ✅ unit tests
  powershell -f scripts/smoke-test-api.ps1             ✅ integration

RELEASE:
  npm test  →  smoke-test  →  tsc --noEmit  →  docker build
  prisma migrate deploy (staging)  →  smoke-test staging
  git tag  →  prisma migrate deploy (prod)  →  docker deploy prod
  GET /setup/info → 200 ✅

ROLLBACK:
  imagen anterior  →  migración inversa si aplica  →  verificar /setup/info
```

---

## F — Tests disponibles y su propósito

| Comando | Tipo | Requiere BD | Cuándo ejecutar |
|---------|------|-------------|-----------------|
| `npm test` | Unitario — lógica de dominio pura | No | Siempre, en cualquier cambio |
| `scripts/smoke-test-api.ps1` | Integración HTTP end-to-end | Sí (stack levantado) | Antes de mergear a main, antes/después de deploy |

**No existe aún**: tests e2e de interfaz (Playwright/Cypress). Añadir en futuras iteraciones.
