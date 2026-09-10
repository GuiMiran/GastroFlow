# GastroFlow — Guía de Referencia Rápida

⚡ **Comandos esenciales para el día a día**

---

## 🚀 Arrancar la aplicación

```powershell
docker compose up -d
```

Acceder a:
- **Frontend**: http://localhost
- **API**: http://localhost:3000/api/v1
- **Swagger**: http://localhost:3000/docs

---

## 🛑 Detener la aplicación

```powershell
docker compose down              # Detiene contenedores (datos persisten ✅)
docker compose down -v           # Detiene + ELIMINA datos ⚠️ (reset completo)
```

---

## 📋 Ver logs

```powershell
docker compose logs -f           # Todos los servicios
docker compose logs -f backend   # Solo backend
docker compose logs -f frontend  # Solo frontend
docker compose logs backend --tail 50  # Últimas 50 líneas
```

---

## 🔄 Reiniciar servicios

```powershell
docker compose restart           # Reinicia todos
docker compose restart backend   # Solo backend
docker compose restart frontend  # Solo frontend
```

---

## 🗄️ Base de datos

```powershell
# Ver estado de contenedores
docker compose ps

# Conectar a PostgreSQL (CLI)
docker compose exec postgres psql -U gastroflow -d gastroflow

# Abrir Prisma Studio (GUI visual - recomendado)
npx prisma studio                # http://localhost:5555

# Generar diagrama ERD del schema
# Ver specs/12-documentacion/DT-04-base-datos.md para detalle de tablas

# Aplicar migraciones
npx prisma migrate deploy        # Producción
npx prisma migrate dev           # Desarrollo (crea nueva migración si hay cambios)

# Seeds de datos
npm run seed                     # Demo básico (Bar El Rincón + datos mínimos)
npm run seed:massive             # 🎲 Seed masivo con Faker (3 tenants, 6 establecimientos, miles de registros)

# Reset completo de BD (desarrollo)
npx prisma migrate reset --force
npm run seed:massive             # Repoblar con datos masivos
```

**Explorar datos**: Abre **Prisma Studio** con `npx prisma studio` para ver/editar datos visualmente.

**Documentación completa**: [DT-04-base-datos.md](specs/12-documentacion/DT-04-base-datos.md) — 45 tablas documentadas con campos y relaciones.

---

## 🔐 Datos de login (demo)

| Rol | Nombre | PIN |
|-----|--------|-----|
| 👔 Admin | Carlos García | **1234** |
| 🍽️ Camarero | Ana Martínez | **2222** |
| 💰 Cajero | Pedro Sánchez | **3333** |
| 👨‍🍳 Cocinero | María Fernández | **4444** |

**Establecimiento**: Bar El Rincón (`60523486-eb74-4d76-a34f-f00e4fca67eb`)

---

## 🧪 Tests

```powershell
npm test                         # Tests unitarios
npm run test:watch               # Watch mode
npm run test:cov                 # Con cobertura
npm run test:integration         # Tests de integración
npm run spec:validate            # Validación specs ↔ tests
```

---

## 🔧 Desarrollo

```powershell
# Backend (modo desarrollo - sin Docker)
npm run start:dev                # http://localhost:3000

# Frontend (modo desarrollo - sin Docker)
cd frontend
npm run dev                      # http://localhost:5173

# Linting y formateo
npm run lint                     # Verificar
npm run lint:fix                 # Auto-corregir
npm run format                   # Formatear código
npm run typecheck                # Verificar tipos TypeScript
```

---

## 🐛 Troubleshooting

**Backend no arranca (Prisma error)**:
```powershell
npx prisma generate              # Regenerar cliente Prisma
docker compose restart backend
```

**Puerto 3000 ocupado**:
```powershell
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# O cambiar puerto en docker-compose.yml
```

**Docker no puede conectar a BD**:
```powershell
docker compose down
docker compose up -d
# Esperar 10 segundos para que PostgreSQL arranque completamente
```

**Reset completo (empezar de cero)**:
```powershell
docker compose down -v           # Elimina todo (contenedores + volúmenes)
.\setup.ps1                      # Re-ejecuta setup completo
# O manualmente:
docker compose up -d
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
docker compose restart backend frontend
```

---

## 📚 Documentación completa

- **README.md** — Visión general y arquitectura
- **specs/** — Especificaciones completas (historias, reglas, invariantes, agentes)
- **docs/API.md** — Endpoints y contratos API
- **docs/ARCHITECTURE.md** — Decisiones arquitectónicas
- **specs/12-documentacion/DT-09-setup-entorno.md** — Setup completo y troubleshooting

---

**Última actualización**: 8 abril 2026
