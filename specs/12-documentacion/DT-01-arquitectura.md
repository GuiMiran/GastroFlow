# DT-01 — Arquitectura General

> Parte de la [documentación técnica](_index.md).  
> Usa este documento para entender la arquitectura del sistema, sus patrones y las convenciones de código antes de implementar cualquier funcionalidad.

---

## Visión de componentes

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
          │ 16           │
          │ Puerto: 5432 │
          └─────────────┘
```

---

## Patrones de diseño

| Patrón | Dónde | Por qué |
|--------|-------|---------|
| **Modular Monolith** | Módulos NestJS (tpv, inventario, contable, fiscal, verifactu) | Separación de dominios sin complejidad de microservicios |
| **Global ORM** | `PrismaModule` con `@Global()` | Acceso a BD desde cualquier módulo sin imports |
| **Domain Events** | `@nestjs/event-emitter` | Desacoplamiento: cobro emite `TicketEmitido`, contable reacciona creando asiento |
| **Contract-First** | Specs capa 05 (contratos) → implementación en services | Cada operación tiene PRE/POST/ERROR documentados |
| **Hash Chain (VeriFactu)** | `VeriFactuService` | SHA-256 encadenado para integridad fiscal (RD 1007/2023) |
| **Typed API Client** | `frontend/src/api.ts` | Cada método frontend mapea 1:1 con un endpoint |

---

## Convenciones de código

- **Controllers**: Solo validación de entrada y delegación a services. Cero lógica de negocio.
- **Controllers — orden de rutas**: Las rutas con segmentos **literales** (estáticas) **deben declararse ANTES** que las rutas con parámetros dinámicos (`:param`) del mismo nivel en el mismo controller. NestJS evalúa en orden de declaración — un `:param` captura cualquier segmento incluyendo literales que aparezcan después.
  ```typescript
  // ✅ literal primero, dinámico después
  @Post('barra/abrir') abrirBarra() {}
  @Post(':mesaId/abrir') abrirMesa() {}
  ```
- **Services**: Toda la lógica de negocio. Transacciones con `prisma.$transaction`.
- **Módulos**: Cada módulo exporta sus services para que otros módulos puedan inyectarlos.
- **Eventos**: Definidos en `src/common/events/domain-events.ts`, emitidos desde services con `EventEmitter2`.
- **IVA**: Se almacena siempre `precioConIva` (PVP). La base imponible se calcula: `pvp / (1 + tasa)`.
- **IDs**: UUID v4 generado automáticamente por Prisma (`@default(uuid())`). Nunca generar IDs manualmente.
