# DT-03 — API REST: Referencia Completa

> Parte de la [documentación técnica](_index.md).  
> Usa este documento cuando necesites saber qué endpoints existen, sus métodos HTTP, el shape del request y del response.  
> Prefijo global: `/api/v1`. Base URL local: `http://localhost:3000/api/v1`.

---

## Mesas — `/mesas`

| Endpoint | Método | Request body | Response |
|----------|--------|-------------|----------|
| `/mesas/establecimiento/:id/mapa` | GET | — | `Zona[]` con `mesas[]` anidadas |
| `/mesas/barra/abrir` | POST | `{ camareroId }` | `{ idServicio }` |
| `/mesas/:mesaId/abrir` | POST | `{ camareroId, comensales }` | `{ idServicio, hora, mesaEstado }` |

> ⚠️ **Orden de rutas**: `barra/abrir` está declarada ANTES que `:mesaId/abrir` en el controller. No cambiar este orden (ver [DT-01 §Convenciones](DT-01-arquitectura.md)).

**Ciclo de vida de estado de mesa**: `libre` → `ocupada` → `pendiente_cobro` → `libre`

---

## Catálogo — `/productos`

| Endpoint | Método | Response |
|----------|--------|----------|
| `/productos/catalogo` | GET | `{ categorias: CategoriaProducto[], productos: Producto[] }` |

**Tipo IVA** (enum `TipoIVA`): `general_21` \| `reducido_10` \| `superreducido_4` \| `exento_0`

---

## Comandas — `/comandas`

| Endpoint | Método | Request body | Response |
|----------|--------|-------------|----------|
| `/comandas` | POST | `{ servicioId, camareroId, lineas[] }` | `{ id, numero, lineas[] }` |
| `/comandas/servicio/:id/cuenta` | GET | — | `{ total, desglose, lineas[] }` |
| `/comandas/servicio/:id/dividir` | POST | `{ modo, numPartes?, grupos? }` | `{ tickets[] }` |
| `/comandas/lineas/:id` | DELETE | `{ motivo, empleadoId, rolEmpleado }` | `{ success }` |

**Shape de línea de comanda** (en request de POST `/comandas`):
```json
{ "productoId": "uuid", "cantidad": 2, "modificadores": [], "notas": "sin sal" }
```

**Desglose IVA** (en response de cuenta):
```json
{ "base4": 0, "iva4": 0, "base10": 12.50, "iva10": 1.25, "base21": 8.26, "iva21": 1.74 }
```

---

## Cobros — `/cobros`

| Endpoint | Método | Request body | Response |
|----------|--------|-------------|----------|
| `/cobros/servicio/:id` | POST | `{ formasPago[], clienteId? }` | `{ ticketId, codigoCompleto, total }` |
| `/cobros/factura-completa` | POST | `{ ticketId, destinatarioNif, nombre, direccion, establecimientoId }` | `{ facturaId }` |
| `/cobros/rectificativa` | POST | `{ ticketOriginalId, tipo, motivo, establecimientoId }` | `{ rectificativaId }` |

**Shape de formaPago**:
```json
{ "forma": "efectivo", "importe": 20.00 }
```
Valores de `forma`: `efectivo` \| `tarjeta` \| `bizum` \| `invitacion`

---

## Caja — `/caja`

| Endpoint | Método | Request body | Response |
|----------|--------|-------------|----------|
| `/caja/turno/abrir` | POST | `{ cajaId, empleadoId, fondoApertura }` | `{ id, fondoCaja, abierto }` |
| `/caja/turno/:id/movimiento` | POST | `{ tipo, importe, concepto, empleadoId }` | `{ id }` |
| `/caja/turno/:id/cerrar` | POST | `{ contadoEfectivo, empleadoId }` | `{ id, descuadre }` |

**Tipos de movimiento**: `entrada` \| `salida`

---

## Convenciones generales de la API

- Todos los IDs son UUIDs v4.
- Errores devuelven `{ statusCode, message }`.
- Validación de entrada con `class-validator` vía `ValidationPipe` global.
- CORS habilitado para `http://localhost:5173`.
- Sin autenticación por ahora (prototipo). Auth se añadirá en producción.
