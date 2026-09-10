# DT-06 — Seed de Datos Demo

> Parte de la [documentación técnica](_index.md).  
> Usa este documento antes de modificar `prisma/seed.ts` o cuando necesites re-ejecutar el seed.

---

## Datos que crea el seed

El script `prisma/seed.ts` carga datos suficientes para probar el flujo completo de M1-TPV:

| Entidad | Cantidad | Detalle |
|---------|----------|---------|
| Tenant | 1 | "Restaurante Demo S.L.", NIF B12345678 |
| Establecimiento | 1 | "Bar El Rincón", Madrid |
| Empleados | 4 | Gerente (Carlos), Camarero (Ana), Camarero (Pedro), Cocinera (María) |
| Zonas | 3 | Terraza (6 mesas), Salón (8 mesas), Barra (4 mesas) |
| Mesas | 18 | Distribuidas en las 3 zonas |
| Categorías | 8 | Entrantes, Carnes, Pescados, Postres, Cervezas, Vinos, Refrescos, Cafetería |
| Productos | 32 | IVA 10% comida, IVA 21% bebidas |
| Caja | 1 | "Caja Principal" |
| Series de facturación | 3 | V (ventas), F (facturas completas), R (rectificativas) |
| Alérgenos | 14 | Los 14 alérgenos de obligatoria declaración UE |
| Programa de fidelización | 1 | 1 punto/€, nivel plata 500 pts, nivel oro 2000 pts |
| Almacén | 1 | "Almacén Principal" |

Al ejecutarse, el seed imprime los UUIDs que deben introducirse en la página `/setup` del frontend.

---

## IDs de referencia (seed actual — 2026-03-14)

| Entidad | Nombre | UUID |
|---------|--------|------|
| Establecimiento | Bar El Rincón | `58e4bd90-3729-44af-91cd-8dc83bc52fdd` |
| Caja | Caja Principal | `4ac90d54-7173-4c66-9e9d-197987759171` |
| Empleado | Carlos (Gerente) | `33b314c5-14df-4508-85ce-c9c7a0a1198b` |
| Empleado | Ana (Camarera) | `434c252c-e9bd-4840-9a9b-8a0cd44421dc` |
| Empleado | Pedro (Camarero) | `912d7631-456a-4f00-b853-a2355dfdf5ec` |
| Empleado | María (Cocinera) | `3c445e2e-cdf8-43c7-a404-b17a3b27fc93` |
| Zona | Terraza | `2eaa19b4-231b-4762-816b-b7ab778e0c76` |
| Zona | Salón | `f49ae015-0700-4cbe-b4ca-39cfdf7d7e72` |
| Zona | Barra | `50bd6198-c50f-46eb-a756-4f20a5b296ef` |

---

## Reglas obligatorias del seed

> ⚠️ **Estas reglas son mandatorias. Ignorarlas provoca errores en ejecución.**

### Regla 1 — Sincronización con schema.prisma

Cada vez que se **añada, renombre o elimine** un campo en `prisma/schema.prisma`, el archivo `prisma/seed.ts` debe actualizarse en el **mismo commit**.

Los nombres de campo en `seed.ts` deben coincidir exactamente con los del schema, incluyendo capitalización camelCase. Prisma genera un cliente tipado — si hay desajuste, fallará en compilación TypeScript o con error P2009 en runtime.

### Regla 2 — Re-ejecución tras fallo parcial

Si el seed falla a mitad de ejecución, la base de datos queda en estado inconsistente (datos parciales con restricciones de unicidad ya violadas para los siguientes intentos). Para re-ejecutarlo limpiamente:

```bash
npx prisma migrate reset --force
```

Esto borra **todos los datos**, re-aplica todas las migraciones desde cero y ejecuta el seed. **Solo usar en desarrollo.**

### Regla 3 — Todos los campos requeridos deben estar presentes

Cualquier campo `@required` del schema sin `@default()` debe incluirse en el objeto `data` del `create` correspondiente. Campos ausentes producen errores de tipo en TypeScript o P2009 en runtime.

Campos que han causado problemas en el pasado y deben estar presentes:

| Modelo | Campos requeridos a no olvidar |
|--------|-------------------------------|
| `Tenant` | `nif`, `email` |
| `Establecimiento` | `nif`, `codigoPostal`, `ciudad`, `provincia` |
| `Producto` | `establecimientoId` |

---

## Ejecutar el seed

```bash
npx prisma db seed          # Ejecuta seed.ts directamente
npx prisma migrate reset --force  # Limpia + migra + seed (si hay datos previos)
```
