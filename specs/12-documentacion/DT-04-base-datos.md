# DT-04 — Base de Datos: Modelo de Datos

> Parte de la [documentación técnica](_index.md).  
> Usa este documento para entender el modelo de datos, relaciones entre entidades y enums disponibles.  
> Schema completo: `prisma/schema.prisma` (51 modelos). Configuración: `prisma.config.ts`.

---

## Diagrama de relaciones (simplificado)

```
Tenant 1──N Establecimiento
                │
    ┌───────────┼───────────┬──────────────┐
    ▼           ▼           ▼              ▼
  Zona       Producto    Caja          Empleado
    │           │           │              │
    ▼           │           ▼              ▼
  Mesa          │       TurnoCaja       Turno/Fichaje
    │           │           │
    ▼           │           ▼
  Servicio      │     MovimientoCaja
    │           │
    ▼           ▼
  Comanda   ◄── LineaComanda ──► Producto
    │                               │
    │                               ▼
    │                        CategoriaProducto
    ▼
  Ticket ────► RegistroVeriFactu (hash chain)
    │
    ▼
  Cobro (formas de pago)
```

---

## Tablas por dominio

| Dominio | Modelos Prisma |
|---------|----------------|
| **Multi-tenant** | `Tenant`, `Establecimiento` |
| **Sala / Servicio** | `Zona`, `Mesa`, `Servicio` |
| **Comandas** | `Comanda`, `LineaComanda`, `Modificador` |
| **Facturación** | `SerieFacturacion`, `Ticket`, `Cobro`, `RegistroVeriFactu` |
| **Caja** | `Caja`, `TurnoCaja`, `MovimientoCaja` |
| **Catálogo** | `CategoriaProducto`, `Producto`, `Alergeno`, `ProductoAlergeno` |
| **Recetas** | `Escandallo`, `EscandalloIngrediente`, `Ingrediente` |
| **Stock** | `Almacen`, `Stock`, `MovimientoStock` |
| **Compras** | `Proveedor`, `PedidoProveedor`, `LineaPedido`, `AlbaranEntrada`, `LineaAlbaran`, `FacturaCompra` |
| **Contabilidad** | `EjercicioFiscal`, `AsientoContable`, `ApunteContable`, `LibroRegistroEmitida`, `LibroRegistroRecibida` |
| **RRHH** | `Empleado`, `Turno`, `Fichaje` |
| **CRM** | `Cliente`, `Consentimiento`, `ProgramaFidelizacion`, `Reserva` |

---

## Enums

| Enum | Valores |
|------|---------|
| `EstadoMesa` | `libre`, `ocupada`, `reservada`, `pendiente_cobro` |
| `TipoIVA` | `general_21`, `reducido_10`, `superreducido_4`, `exento_0` |
| `FormaPago` | `efectivo`, `tarjeta`, `bizum`, `invitacion` |
| `TipoTicket` | `simplificada`, `completa`, `rectificativa` |
| `TipoMovimientoStock` | `entrada_compra`, `salida_venta`, `ajuste`, `merma`, `traspaso` |
| `EstadoPedido` | `borrador`, `enviado`, `recibido_parcial`, `recibido`, `cancelado` |
| `EstadoReserva` | `confirmada`, `cancelada`, `completada`, `no_show` |
| `NivelCliente` | `bronce`, `plata`, `oro` |

---

## Configuración de Prisma 7.5

> ⚠️ **Restricción crítica**: Ver [DT-08 §10.1](DT-08-decisiones-restricciones.md) para la regla de dónde va la URL del datasource.

- Schema: `prisma/schema.prisma`
- Config (URL, migrations): `prisma.config.ts`
- Adapter: `@prisma/adapter-pg` con pool de conexiones via `pg`
- La `DATABASE_URL` va **solo** en `prisma.config.ts → datasource.url`, nunca en `schema.prisma`

### Comandos habituales

```bash
npx prisma migrate dev --name <nombre>   # Nueva migración (desarrollo)
npx prisma migrate deploy                # Aplicar migraciones (producción)
npx prisma migrate reset --force         # Borrar datos + re-migrar + seed (solo desarrollo)
npx prisma studio                        # GUI visual de la BD
npx prisma generate                      # Regenerar cliente tras cambios en schema
```

---

## Detalle de tablas principales

### **Multi-tenancy**

#### `tenants`
| Campo | Tipo | Descripción | Relaciones |
|-------|------|-------------|------------|
| `id` | UUID (PK) | Identificador único del tenant | - |
| `nombre` | String | Nombre de la empresa/organización | - |
| `nif` | String (UNIQUE) | NIF/CIF del tenant | - |
| `email` | String | Email de contacto | - |
| `activo` | Boolean | Si el tenant puede operar | - |
| | | **1:N** → `establecimientos` | Establecimientos del tenant |

#### `establecimientos`
| Campo | Tipo | Descripción | Relaciones |
|-------|------|-------------|------------|
| `id` | UUID (PK) | ID único del establecimiento | - |
| `tenantId` | UUID (FK) | Tenant propietario | N:1 → `tenants` |
| `nombre` | String | Nombre comercial (ej: "Bar El Rincón") | - |
| `nif` | String | NIF del establecimiento | - |
| `direccion`, `codigoPostal`, `ciudad`, `provincia` | String | Dirección fiscal | - |
| `regimenFiscal` | String | `general`, `recargo_equivalencia`, etc. | - |
| `activo` | Boolean | Si está operativo | - |
| | | **1:N** → `zonas`, `productos`, `empleados`, `cajas` | Datos del establecimiento |

---

### **M1 — TPV / Sala**

#### `zonas`
| Campo | Tipo | Descripción | Relaciones |
|-------|------|-------------|------------|
| `id` | UUID (PK) | ID de la zona | - |
| `establecimientoId` | UUID (FK) | Establecimiento | N:1 → `establecimientos` |
| `nombre` | String | Ej: "Terraza", "Salón", "Barra" | - |
| `activa` | Boolean | Si está disponible para usar | - |
| | | **1:N** → `mesas` | Mesas de esta zona |

#### `mesas`
| Campo | Tipo | Descripción | Relaciones |
|-------|------|-------------|------------|
| `id` | UUID (PK) | ID de la mesa | - |
| `zonaId` | UUID (FK) | Zona a la que pertenece | N:1 → `zonas` |
| `numero` | Int | Número de mesa (UNIQUE dentro de zona) | - |
| `capacidad` | Int | Número de comensales | - |
| `estado` | EstadoMesa | `libre`, `ocupada`, `reservada`, `pendiente_cobro` | - |
| `activa` | Boolean | Si está disponible | - |
| | | **1:N** → `servicios` | Servicios en esta mesa |
| | | **1:N** → `reservas` | Reservas de esta mesa |

**Constraint**: `UNIQUE(zonaId, numero)` — número único dentro de zona

#### `servicios`
| Campo | Tipo | Descripción | Relaciones |
|-------|------|-------------|------------|
| `id` | UUID (PK) | ID del servicio | - |
| `mesaId` | UUID (FK) | Mesa atendida (nullable para llevar) | N:1 → `mesas` |
| `camareroId` | UUID (FK) | Empleado que atiende | N:1 → `empleados` |
| `comensales` | Int | Número de personas | - |
| `abierto` | Boolean | Si sigue activo | - |
| `horaApertura` | DateTime | Cuándo se abrió la mesa | - |
| `horaCierre` | DateTime? | Cuándo se cerró (null = abierto) | - |
| | | **1:N** → `comandas` | Comandas del servicio |
| | | **1:N** → `tickets` | Tickets emitidos |

---

### **M1 — TPV / Comandas**

#### `comandas`
| Campo | Tipo | Descripción | Relaciones |
|-------|------|-------------|------------|
| `id` | UUID (PK) | ID de la comanda | - |
| `servicioId` | UUID (FK) | Servicio al que pertenece | N:1 → `servicios` |
| `numero` | Int | Número secuencial en el servicio | - |
| `estado` | EstadoComanda | `enviada`, `lista`, `servida`, `anulada` | - |
| `destino` | String? | "Cocina", "Barra" (para KDS) | - |
| `createdAt` | DateTime | Timestamp de creación | - |
| | | **1:N** → `lineas_comanda` | Líneas de productos |

#### `lineas_comanda`
| Campo | Tipo | Descripción | Relaciones |
|-------|------|-------------|------------|
| `id` | UUID (PK) | ID de la línea | - |
| `comandaId` | UUID (FK) | Comanda | N:1 → `comandas` |
| `productoId` | UUID (FK) | Producto pedido | N:1 → `productos` |
| `cantidad` | Int | Unidades | - |
| `precioUnitario` | Decimal(10,2) | Precio sin IVA | - |
| `tipoIva` | Decimal(4,2) | % IVA (4.00, 10.00, 21.00) | - |
| `baseImponible` | Decimal(10,2) | cantidad × precioUnitario | - |
| `cuotaIva` | Decimal(10,2) | baseImponible × tipoIva | - |
| `descuento` | Decimal(10,2) | Descuento aplicado | - |
| `anulada` | Boolean | Si fue anulada | - |
| `motivoAnulacion` | String? | Razón de anulación | - |
| `ticketId` | UUID (FK)? | Ticket al que se facturó | N:1 → `tickets` |
| | | **1:N** → `modificadores` | Extras/modificaciones |

**INV-001**: Una línea de comanda solo puede facturarse a un ticket.

#### `modificadores`
| Campo | Tipo | Descripción | Relaciones |
|-------|------|-------------|------------|
| `id` | UUID (PK) | ID del modificador | - |
| `lineaComandaId` | UUID (FK) | Línea que modifica | N:1 → `lineas_comanda` |
| `texto` | String | Ej: "Sin cebolla", "Extra bacon" | - |
| `precioExtra` | Decimal(10,2) | Coste adicional | - |

---

### **M1 — TPV / Facturación**

#### `series_facturacion`
| Campo | Tipo | Descripción | Relaciones |
|-------|------|-------------|------------|
| `id` | UUID (PK) | ID de la serie | - |
| `establecimientoId` | UUID (FK) | Establecimiento | N:1 → `establecimientos` |
| `prefijo` | String | Ej: "SIMP", "FACT", "RECT" | - |
| `tipo` | TipoDocumentoFiscal | `simplificada`, `completa`, `rectificativa` | - |
| `ultimoNumero` | Int | Contador secuencial | - |
| `year` | Int | Año fiscal | - |
| | | **1:N** → `tickets` | Tickets de esta serie |

**Constraint**: `UNIQUE(establecimientoId, prefijo, year)` — una serie por año

#### `tickets` 
| Campo | Tipo | Descripción | Relaciones |
|-------|------|-------------|------------|
| `id` | UUID (PK) | ID del ticket | - |
| `servicioId` | UUID (FK) | Servicio facturado | N:1 → `servicios` |
| `serieFacturacionId` | UUID (FK) | Serie de numeración | N:1 → `series_facturacion` |
| `tipo` | TipoDocumentoFiscal | Tipo de documento | - |
| `numeroSecuencial` | Int | Número en la serie | - |
| `codigoCompleto` | String (UNIQUE) | "SIMP-2026-00042" | - |
| `baseImponible4/10/21` | Decimal(10,2) | Bases por tipo de IVA | - |
| `cuotaIva4/10/21` | Decimal(10,2) | Cuotas IVA | - |
| `totalSinIva` | Decimal(10,2) | Suma de bases | - |
| `totalIva` | Decimal(10,2) | Suma de cuotas | - |
| `total` | Decimal(10,2) | Total a pagar | - |
| `destinatarioNif/Nombre/Direccion` | String? | Datos cliente (completas) | - |
| `asientoContableId` | UUID (FK)? | Asiento generado | N:1 → `asientos_contables` |
| `clienteId` | UUID (FK)? | Cliente CRM | N:1 → `clientes` |
| `ticketOriginalId` | UUID (FK)? | Si es rectificativa | N:1 → `tickets` (self) |
| `fechaEmision` | DateTime | Timestamp fiscal | - |
| | | **1:N** → `cobros` | Formas de pago |
| | | **1:1** → `registros_verifactu` | Registro VeriFactu |
| | | **1:1** → `libro_registro_emitidas` | Libro registro IVA |

**INV-002**: `numeroSecuencial` NUNCA puede tener huecos dentro de un (serie, year).

#### `registros_verifactu`
| Campo | Tipo | Descripción | Relaciones |
|-------|------|-------------|------------|
| `id` | UUID (PK) | ID del registro | - |
| `ticketId` | UUID (FK) UNIQUE | Ticket asociado | 1:1 → `tickets` |
| `hashActual` | String | SHA-256 de este registro | - |
| `hashAnterior` | String | Hash del ticket anterior | - |
| `datosRegistro` | String (JSON) | Campos fiscales completos | - |

**INV-VER-001**: La cadena de hashes nunca puede romperse (RD 1007/2023).

#### `cobros`
| Campo | Tipo | Descripción | Relaciones |
|-------|------|-------------|------------|
| `id` | UUID (PK) | ID del cobro | - |
| `ticketId` | UUID (FK) | Ticket cobrado | N:1 → `tickets` |
| `formaPago` | FormaPago | `efectivo`, `tarjeta`, `bizum`, `invitacion` | - |
| `importe` | Decimal(10,2) | Cantidad cobrada | - |
| `cambio` | Decimal(10,2) | Dinero devuelto | - |

**Regla**: La suma de cobros debe ser ≥ ticket.total

---

### **M1 — TPV / Caja**

#### `cajas`
| Campo | Tipo | Descripción | Relaciones |
|-------|------|-------------|------------|
| `id` | UUID (PK) | ID de la caja | - |
| `establecimientoId` | UUID (FK) | Establecimiento | N:1 → `establecimientos` |
| `nombre` | String | Ej: "Caja Principal", "Caja 2" | - |
| `activa` | Boolean | Si está operativa | - |
| | | **1:N** → `turnos_caja` | Turnos de esta caja |

#### `turnos_caja`
| Campo | Tipo | Descripción | Relaciones |
|-------|------|-------------|------------|
| `id` | UUID (PK) | ID del turno | - |
| `cajaId` | UUID (FK) | Caja usada | N:1 → `cajas` |
| `cajeroId` | UUID (FK) | Empleado responsable | N:1 → `empleados` |
| `fondoCaja` | Decimal(10,2) | Efectivo inicial | - |
| `abierto` | Boolean | Si está activo | - |
| `horaApertura` | DateTime | Cuándo se abrió | - |
| `horaCierre` | DateTime? | Cuándo se cerró | - |
| `efectivoEsperado` | Decimal(10,2)? | Según ventas | - |
| `efectivoReal` | Decimal(10,2)? | Contado en arqueo | - |
| `descuadre` | Decimal(10,2)? | Real - Esperado | - |
| | | **1:N** → `movimientos_caja` | Entradas/salidas |

**INV-CAJ-001**: Solo puede haber 1 turno abierto por caja a la vez.

#### `movimientos_caja`
| Campo | Tipo | Descripción | Relaciones |
|-------|------|-------------|------------|
| `id` | UUID (PK) | ID del movimiento | - |
| `turnoCajaId` | UUID (FK) | Turno | N:1 → `turnos_caja` |
| `tipo` | String | `retirada`, `entrada`, `fondo_inicial` | - |
| `importe` | Decimal(10,2) | Cantidad (+ entrada, - retirada) | - |
| `concepto` | String | Descripción del movimiento | - |
| `createdAt` | DateTime | Timestamp | - |

---

### **M2 — ERP / Catálogo**

#### `categorias_producto`
| Campo | Tipo | Descripción | Relaciones |
|-------|------|-------------|------------|
| `id` | UUID (PK) | ID de categoría | - |
| `nombre` | String | Ej: "Tapas", "Bebidas", "Postres" | - |
| `activa` | Boolean | Si está visible | - |
| | | **1:N** → `productos` | Productos de esta categoría |

#### `productos`
| Campo | Tipo | Descripción | Relaciones |
|-------|------|-------------|------------|
| `id` | UUID (PK) | ID del producto | - |
| `establecimientoId` | UUID (FK) | Establecimiento | N:1 → `establecimientos` |
| `categoriaId` | UUID (FK) | Categoría | N:1 → `categorias_producto` |
| `nombre` | String | Nombre del producto | - |
| `precioSinIva` | Decimal(10,2) | Precio base | - |
| `tipoIva` | TipoIVA | `general_21`, `reducido_10`, `superreducido_4` | - |
| `precioConIva` | Decimal(10,2) | Precio final | - |
| `activo` | Boolean | Si se puede vender | - |
| `controlStock` | Boolean | Si descuenta inventario | - |
| | | **1:1** → `escandallos` | Receta (opcional) |
| | | **N:M** → `alergenos` | Via `producto_alergenos` |

**POL-001**: Tipo IVA se calcula según categoría + normativa.

#### `escandallos`
| Campo | Tipo | Descripción | Relaciones |
|-------|------|-------------|------------|
| `id` | UUID (PK) | ID del escandallo | - |
| `productoId` | UUID (FK) UNIQUE | Producto al que pertenece | 1:1 → `productos` |
| `costeTotal` | Decimal(10,2) | Suma de ingredientes | - |
| | | **1:N** → `escandallo_ingredientes` | Ingredientes |

#### `escandallo_ingredientes`
| Campo | Tipo | Descripción | Relaciones |
|-------|------|-------------|------------|
| `id` | UUID (PK) | ID de la línea | - |
| `escandalloId` | UUID (FK) | Escandallo | N:1 → `escandallos` |
| `ingredienteId` | UUID (FK) | Ingrediente | N:1 → `ingredientes` |
| `cantidad` | Decimal(10,3) | Cantidad en unidad base | - |

---

### **M2 — ERP / Inventario**

#### `ingredientes`
| Campo | Tipo | Descripción | Relaciones |
|-------|------|-------------|------------|
| `id` | UUID (PK) | ID del ingrediente | - |
| `nombre` | String | Ej: "Tomate", "Aceite" | - |
| `unidadMedida` | String | `kg`, `l`, `ud` | - |
| `precioMedioUnitario` | Decimal(10,2) | Coste por unidad | - |
| `stockMinimo` | Decimal(10,3)? | Alerta de reposición | - |
| | | **1:N** → `stocks` | Stock por almacén |
| | | **1:N** → `movimientos_stock` | Historial de movimientos |

#### `almacenes`
| Campo | Tipo | Descripción | Relaciones |
|-------|------|-------------|------------|
| `id` | UUID (PK) | ID del almacén | - |
| `establecimientoId` | UUID (FK) | Establecimiento | N:1 → `establecimientos` |
| `nombre` | String | Ej: "Almacén Principal", "Cámara" | - |
| `activo` | Boolean | Si está operativo | - |
| | | **1:N** → `stocks` | Stock en este almacén |

#### `stocks`
| Campo | Tipo | Descripción | Relaciones |
|-------|------|-------------|------------|
| `id` | UUID (PK) | ID del stock | - |
| `ingredienteId` | UUID (FK) | Ingrediente | N:1 → `ingredientes` |
| `almacenId` | UUID (FK) | Almacén | N:1 → `almacenes` |
| `cantidadActual` | Decimal(10,3) | Stock físico | - |
| `cantidadReservada` | Decimal(10,3) | Pendiente de salida | - |

**Constraint**: `UNIQUE(ingredienteId, almacenId)` — un stock por ingrediente-almacén.

#### `movimientos_stock`
| Campo | Tipo | Descripción | Relaciones |
|-------|------|-------------|------------|
| `id` | UUID (PK) | ID del movimiento | - |
| `ingredienteId` | UUID (FK) | Ingrediente afectado | N:1 → `ingredientes` |
| `tipo` | TipoMovimientoStock | `entrada_compra`, `salida_venta`, `ajuste`, `merma` | - |
| `cantidad` | Decimal(10,3) | + entrada, - salida | - |
| `saldoTras` | Decimal(10,3) | Saldo después del movimiento | - |
| `concepto` | String | Descripción | - |
| `createdAt` | DateTime | Timestamp | - |

**INV-INV-001**: Los movimientos son inmutables (solo inserción, nunca UPDATE/DELETE).

---

### **M3 — Contabilidad**

#### `ejercicios_fiscales`
| Campo | Tipo | Descripción | Relaciones |
|-------|------|-------------|------------|
| `id` | UUID (PK) | ID del ejercicio | - |
| `establecimientoId` | UUID (FK) | Establecimiento | N:1 → `establecimientos` |
| `year` | Int | Año fiscal | - |
| `cerrado` | Boolean | Si ya se cerró | - |
| `fechaCierre` | DateTime? | Cuándo se cerró | - |

**Constraint**: `UNIQUE(establecimientoId, year)` — un ejercicio por año.

#### `asientos_contables`
| Campo | Tipo | Descripción | Relaciones |
|-------|------|-------------|------------|
| `id` | UUID (PK) | ID del asiento | - |
| `establecimientoId` | UUID (FK) | Establecimiento | N:1 → `establecimientos` |
| `numero` | Int | Número secuencial | - |
| `fecha` | DateTime | Fecha del asiento | - |
| `concepto` | String | Descripción | - |
| `origen` | String | `venta`, `compra`, `manual` | - |
| | | **1:N** → `apuntes_contables` | Apuntes debe/haber |
| | | **1:1** → `tickets` | Si es de una venta |

**INV-CON-001**: Suma(debe) = Suma(haber) para cada asiento.

#### `apuntes_contables`
| Campo | Tipo | Descripción | Relaciones |
|-------|------|-------------|------------|
| `id` | UUID (PK) | ID del apunte | - |
| `asientoId` | UUID (FK) | Asiento | N:1 → `asientos_contables` |
| `cuenta` | String | Código PGC (ej: "430") | - |
| `debe` | Decimal(10,2) | Importe en debe | - |
| `haber` | Decimal(10,2) | Importe en haber | - |

---

### **M4 — CRM**

#### `clientes`
| Campo | Tipo | Descripción | Relaciones |
|-------|------|-------------|------------|
| `id` | UUID (PK) | ID del cliente | - |
| `establecimientoId` | UUID (FK) | Establecimiento | N:1 → `establecimientos` |
| `nombre` | String | Nombre completo | - |
| `nif` | String? | NIF/CIF | - |
| `email` | String? | Email | - |
| `telefono` | String? | Teléfono | - |
| `puntosAcumulados` | Int | Puntos fidelización | - |
| `nivelFidelizacion` | NivelCliente? | `bronce`, `plata`, `oro` | - |
| | | **1:N** → `tickets` | Tickets del cliente |
| | | **1:N** → `reservas` | Reservas |
| | | **1:N** → `consentimientos` | Consentimientos RGPD |

#### `reservas`
| Campo | Tipo | Descripción | Relaciones |
|-------|------|-------------|------------|
| `id` | UUID (PK) | ID de la reserva | - |
| `clienteId` | UUID (FK) | Cliente | N:1 → `clientes` |
| `mesaId` | UUID (FK) | Mesa reservada | N:1 → `mesas` |
| `fecha` | DateTime | Fecha/hora reserva | - |
| `comensales` | Int | Número de personas | - |
| `estado` | EstadoReserva | `confirmada`, `cancelada`, `completada`, `no_show` | - |
| `notas` | String? | Observaciones | - |

---

## Herramientas de exploración

**Prisma Studio** (recomendado):
```bash
npx prisma studio    # Abre en http://localhost:5555
```

**DBeaver / TablePlus** (clientes GUI):
- Host: `localhost:5432`
- Database: `gastroflow`
- User: `gastroflow`
- Password: `gastroflow`

**SQL directo**:
```bash
docker compose exec postgres psql -U gastroflow -d gastroflow
```

---

**Última actualización**: 8 abril 2026
