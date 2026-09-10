# CAPA 12 — Documentación Técnica de Implementación

> Referencia técnica de **cómo está construido** GastroFlow.  
> No sustituye a las specs de dominio (capas 00-11). Describe la implementación, no el qué.  
> Última actualización: 2026-03-14

---

## Instrucciones para la IA agéntica

**Carga solo el documento que necesitas.** Cada archivo es autocontenido.

| Cuándo usarlo | Documento |
|---|---|
| **Arrancar el sistema ya configurado (uso diario)** | **[../../QUICK-START.md](../../QUICK-START.md)** ⚡ |
| Entender la arquitectura general, patrones y convenciones de código | [DT-01-arquitectura.md](DT-01-arquitectura.md) |
| Ver qué módulos NestJS existen y qué hace cada uno | [DT-02-backend-modulos.md](DT-02-backend-modulos.md) |
| Conocer endpoints, métodos, request/response de la API REST | [DT-03-api-rest.md](DT-03-api-rest.md) |
| **Ver tablas, campos, tipos y relaciones del modelo de datos** | **[DT-04-base-datos.md](DT-04-base-datos.md)** 🗄️ |
| Extender el frontend, ver rutas, componentes, estado global | [DT-05-frontend.md](DT-05-frontend.md) |
| Modificar o re-ejecutar el seed de datos demo | [DT-06-seed-datos.md](DT-06-seed-datos.md) |
| Escribir tests o verificar trazabilidad spec → código | [DT-07-testing-trazabilidad.md](DT-07-testing-trazabilidad.md) |
| Entender por qué se tomó una decisión técnica o antes de cambiar stack | [DT-08-decisiones-restricciones.md](DT-08-decisiones-restricciones.md) |
| **Arrancar el entorno local por primera vez, solucionar problemas de setup** | **[DT-09-setup-entorno.md](DT-09-setup-entorno.md)** 🚀 |
| Checklist de deploy y release: qué ejecutar antes/después de desplegar | [DT-10-deploy-release.md](DT-10-deploy-release.md) |

---

## Stack en una línea

`NestJS 11` + `React 19 / Vite 8` + `PostgreSQL 16` + `Prisma 7.5 (adapter-pg)` + `Jest 30`

- Backend: puerto **3000**, prefijo `/api/v1`
- Frontend: puerto **5173**, proxy `/api` → backend
- DB: `gastroflow` / `gastroflow` @ `localhost:5432`
