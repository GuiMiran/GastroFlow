# DT-02 — Backend: Módulos NestJS

> Parte de la [documentación técnica](_index.md).  
> Usa este documento para entender qué hace cada módulo, sus dependencias y qué skills/operaciones implementa.

---

## TpvModule — Punto de Venta

**Ubicación**: `src/modules/tpv/`

Módulo principal del flujo de venta. Gestiona mesas, comandas, cobros y caja.

```
tpv/
├── tpv.module.ts
├── controllers/
│   ├── mesa.controller.ts       → /mesas/*
│   ├── comanda.controller.ts    → /comandas/*
│   ├── cobro.controller.ts      → /cobros/*
│   ├── caja.controller.ts       → /caja/*
│   └── producto.controller.ts   → /productos/*
└── services/
    ├── mesa.service.ts          SK-001, OP-001
    ├── comanda.service.ts       SK-002, SK-003, SK-004, OP-002, OP-003
    ├── cobro.service.ts         SK-005–SK-008, OP-004, OP-006
    └── caja.service.ts          SK-009, OP-010, OP-011, OP-012
```

**Dependencias**: Importa `VeriFactuModule` para hash de tickets en el cobro.

---

## InventarioModule

**Ubicación**: `src/modules/inventario/`

Gestión de stock, ingredientes, escandallos (recetas) y deducción automática de stock al vender.

**Listener de eventos**: Reacciona a `EVT-004 TicketEmitido` → deduce stock según escandallo del producto.

---

## ContableModule

**Ubicación**: `src/modules/contable/`

Asientos automáticos en partida doble según PGC Pymes. Servicio principal: `AsientoService`.

**Listener de eventos**: Reacciona a `EVT-004 TicketEmitido` → crea asiento contable de venta.

---

## FiscalModule

**Ubicación**: `src/modules/fiscal/`

Generación de modelos fiscales españoles trimestrales/anuales:
- Modelo 303 (IVA trimestral)
- Modelo 390 (resumen anual IVA)
- Modelo 347 (operaciones con terceros)
- Modelo 111 (retenciones IRPF)
- Modelo 115 (retenciones alquileres)

---

## VeriFactuModule

**Ubicación**: `src/modules/verifactu/`

Implementa la cadena de hash SHA-256 para integridad fiscal según RD 1007/2023.

- Genera `hashActual` = SHA-256(`datosRegistro` + `hashAnterior`)
- Almacena en tabla `RegistroVeriFactu` (inmutable — ver INV-007, INV-008)
- Exporta `VeriFactuService` para uso por `CobroService`

---

## Módulo global: PrismaModule

**Ubicación**: `src/common/prisma/`

Decorado con `@Global()`. Provee `PrismaService` a toda la aplicación sin necesidad de importarlo en cada módulo.

Usa `@prisma/adapter-pg` con `PrismaPg({ connectionString: process.env.DATABASE_URL })`.

---

## Estructura de src/

```
src/
├── app.module.ts           ← Raíz: importa todos los módulos
├── main.ts                 ← Bootstrap: puerto 3000, prefijo /api/v1, ValidationPipe, CORS
├── common/
│   ├── prisma/             ← PrismaModule + PrismaService (@Global)
│   └── events/
│       └── domain-events.ts ← Clases de eventos de dominio tipados
└── modules/
    ├── tpv/
    ├── inventario/
    ├── contable/
    ├── fiscal/
    └── verifactu/
```
