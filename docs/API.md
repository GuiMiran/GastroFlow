# GastroFlow — API REST

> Referencia completa de la API REST del backend NestJS.  
> Base URL: `http://localhost:3000/api/v1`

---

## Convenciones

- **Content-Type**: `application/json` en todas las peticiones/respuestas
- **Errores**: `{ statusCode, message, error }` con HTTP status apropiado
- **Decimales**: Los importes se devuelven como `Decimal` (string en JSON) — usar `Number()` en frontend
- **IDs**: UUID v4 (`string`)
- **IVA**: Siempre incluido en `precioConIva`. Base imponible calculada: `precio / (1 + tasa)` (RN-002)

---

## Índice de Endpoints

| # | Método | Ruta | Operación | Spec |
|---|--------|------|-----------|------|
| 1 | GET | `/mesas/establecimiento/:establecimientoId/mapa` | Mapa de sala | SK-001 |
| 2 | POST | `/mesas/:mesaId/abrir` | Abrir mesa | SK-001, OP-001 |
| 3 | POST | `/mesas/barra/abrir` | Servicio de barra | RN-031 |
| 4 | GET | `/productos/catalogo` | Catálogo de productos | — |
| 5 | POST | `/comandas` | Tomar comanda | SK-002, OP-002 |
| 6 | GET | `/comandas/servicio/:servicioId/cuenta` | Calcular cuenta | SK-003 |
| 7 | POST | `/comandas/servicio/:servicioId/dividir` | Dividir cuenta | SK-004 |
| 8 | DELETE | `/comandas/lineas/:lineaId` | Anular línea | OP-003 |
| 9 | POST | `/cobros/servicio/:servicioId` | Cobrar servicio | SK-005, SK-006 |
| 10 | POST | `/cobros/factura-completa` | Factura completa | SK-007 |
| 11 | POST | `/cobros/rectificativa` | Factura rectificativa | SK-008, RN-016 |
| 12 | POST | `/caja/turno/abrir` | Abrir turno de caja | OP-010 |
| 13 | POST | `/caja/turno/:turnoCajaId/movimiento` | Movimiento de caja | OP-012 |
| 14 | POST | `/caja/turno/:turnoCajaId/cerrar` | Cerrar turno (arqueo) | OP-011 |

---

## 1. Mesas

### `GET /mesas/establecimiento/:establecimientoId/mapa`

Devuelve el mapa visual de la sala: zonas con sus mesas y estado actual.

**Parámetros de ruta:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `establecimientoId` | UUID | ID del establecimiento |

**Respuesta 200:**
```json
[
  {
    "id": "uuid",
    "nombre": "Terraza",
    "mesas": [
      {
        "id": "uuid",
        "numero": 1,
        "capacidad": 4,
        "estado": "libre",
        "servicios": []
      },
      {
        "id": "uuid",
        "numero": 2,
        "capacidad": 6,
        "estado": "ocupada",
        "servicios": [
          {
            "id": "uuid-servicio",
            "mesaId": "uuid",
            "camareroId": "uuid",
            "comensales": 3,
            "abierto": true
          }
        ]
      }
    ]
  }
]
```

**Estados de mesa:** `libre` | `ocupada` | `reservada` | `pendiente_cobro`

---

### `POST /mesas/:mesaId/abrir`

Abre una mesa: crea un servicio y transiciona la mesa a `ocupada`.

**Parámetros de ruta:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `mesaId` | UUID | ID de la mesa a abrir |

**Request body:**
```json
{
  "camareroId": "uuid",
  "comensales": 4
}
```

**Respuesta 201:**
```json
{
  "idServicio": "uuid"
}
```

**Errores:**
- `400` — Mesa no está en estado `libre`
- `404` — Mesa no encontrada

---

### `POST /mesas/barra/abrir`

Crea un servicio de barra sin mesa asignada (RN-031).

**Request body:**
```json
{
  "camareroId": "uuid"
}
```

**Respuesta 201:**
```json
{
  "idServicio": "uuid"
}
```

---

## 2. Catálogo de Productos

### `GET /productos/catalogo`

Devuelve todas las categorías activas y productos activos.

**Respuesta 200:**
```json
{
  "categorias": [
    { "id": "uuid", "nombre": "Entrantes", "orden": 1 },
    { "id": "uuid", "nombre": "Carnes", "orden": 2 }
  ],
  "productos": [
    {
      "id": "uuid",
      "nombre": "Tortilla Española",
      "precioConIva": "8.00",
      "tipoIva": "reducido_10",
      "categoriaId": "uuid"
    }
  ]
}
```

**Tipos de IVA (POL-001):**
| Valor | Tasa | Aplica a |
|-------|------|----------|
| `general_21` | 21% | Alcohol, refrescos |
| `reducido_10` | 10% | Comida preparada, zumos naturales |
| `superreducido_4` | 4% | Pan, leche, frutas |
| `exento_0` | 0% | Servicios exentos |

---

## 3. Comandas

### `POST /comandas`

Toma una comanda: crea líneas con precio, IVA y envío a cocina/barra.

**Request body:**
```json
{
  "servicioId": "uuid",
  "camareroId": "uuid",
  "lineas": [
    {
      "productoId": "uuid",
      "cantidad": 2,
      "modificadores": ["sin cebolla"],
      "notas": "poco hecho"
    }
  ]
}
```

**Respuesta 201:**
```json
{
  "id": "uuid-comanda",
  "numero": 1,
  "estado": "en_preparacion",
  "lineas": [
    {
      "id": "uuid-linea",
      "productoId": "uuid",
      "cantidad": 2,
      "precioUnitario": "8.00",
      "tipoIva": "reducido_10",
      "baseImponible": "14.55",
      "cuotaIva": "1.45"
    }
  ]
}
```

**Validaciones:**
- `400` — Al menos 1 línea requerida (OP-002)
- `400` — Servicio no activo
- `404` — Producto no encontrado o inactivo

---

### `GET /comandas/servicio/:servicioId/cuenta`

Calcula la cuenta total del servicio con desglose por tipo de IVA (RN-003).

**Respuesta 200:**
```json
{
  "servicioId": "uuid",
  "total": 37.50,
  "totalSinIva": 33.18,
  "desglose": {
    "base4": 0,
    "iva4": 0,
    "base10": 21.82,
    "iva10": 2.18,
    "base21": 11.36,
    "iva21": 2.14
  },
  "lineas": [
    {
      "id": "uuid-linea",
      "productoNombre": "Tortilla Española",
      "cantidad": 2,
      "precioUnitario": 8.00,
      "subtotal": 16.00
    }
  ]
}
```

---

### `POST /comandas/servicio/:servicioId/dividir`

Divide la cuenta en múltiples tickets (SK-004).

**Request body (partes iguales):**
```json
{
  "modo": "partes_iguales",
  "numPartes": 3
}
```

**Request body (por productos):**
```json
{
  "modo": "por_productos",
  "grupos": [
    { "lineasIds": ["uuid-linea-1", "uuid-linea-2"] },
    { "lineasIds": ["uuid-linea-3"] }
  ]
}
```

---

### `DELETE /comandas/lineas/:lineaId`

Anula una línea de comanda. Requiere autorización de gerente (OP-003).

**Request body:**
```json
{
  "motivo": "Cliente cambió de opinión",
  "empleadoId": "uuid",
  "rolEmpleado": "gerente"
}
```

---

## 4. Cobros

### `POST /cobros/servicio/:servicioId`

Cobra el servicio, emite ticket VeriFactu con cadena hash SHA-256 (SK-005 + SK-006).

**Request body:**
```json
{
  "formasPago": [
    { "forma": "efectivo", "importe": 20.00 },
    { "forma": "tarjeta", "importe": 17.50 }
  ],
  "clienteId": "uuid-opcional"
}
```

**Formas de pago:** `efectivo` | `tarjeta` | `bizum` | `invitacion`

**Respuesta 201:**
```json
{
  "ticketId": "uuid",
  "codigoCompleto": "V-2026-000001",
  "total": "37.50",
  "totalIva": "4.32",
  "tipo": "simplificada"
}
```

**Reglas aplicadas:**
- RN-010: Factura simplificada si total < 3.000€
- RN-011: Contenido mínimo del ticket (nº secuencial, fecha, NIF, desglose IVA)
- INV-007/008: Hash VeriFactu encadenado con el ticket anterior

---

### `POST /cobros/factura-completa`

Genera factura completa con datos fiscales del destinatario (SK-007).

**Request body:**
```json
{
  "ticketId": "uuid",
  "destinatarioNif": "B12345678",
  "destinatarioNombre": "Empresa S.L.",
  "destinatarioDireccion": "Calle Mayor 1, Madrid",
  "establecimientoId": "uuid"
}
```

---

### `POST /cobros/rectificativa`

Emite factura rectificativa anulando o corrigiendo un ticket (SK-008, RN-016).

**Request body:**
```json
{
  "ticketOriginalId": "uuid",
  "tipoRectificacion": "sustitucion",
  "motivo": "Error en el precio",
  "establecimientoId": "uuid"
}
```

**Tipos de rectificación:** `sustitucion` | `diferencias`

---

## 5. Caja

### `POST /caja/turno/abrir`

Abre un turno de caja con fondo inicial (OP-010).

**Request body:**
```json
{
  "cajaId": "uuid",
  "empleadoId": "uuid",
  "fondoApertura": 100.00
}
```

**Respuesta 201:**
```json
{
  "id": "uuid-turno",
  "cajaId": "uuid",
  "cajeroId": "uuid",
  "fondoCaja": "100.00",
  "abierto": true,
  "horaApertura": "2026-03-14T08:00:00.000Z"
}
```

**Precondiciones (OP-010):**
- La caja no tiene otro turno abierto
- El empleado está activo

---

### `POST /caja/turno/:turnoCajaId/movimiento`

Registra una entrada o salida de caja (OP-012).

**Parámetros de ruta:**
| Param | Tipo | Descripción |
|-------|------|-------------|
| `turnoCajaId` | UUID | ID del turno activo |

**Request body:**
```json
{
  "tipo": "salida",
  "importe": 25.00,
  "concepto": "Pago proveedor hielo",
  "empleadoId": "uuid"
}
```

**Tipos:** `entrada` | `salida`

---

### `POST /caja/turno/:turnoCajaId/cerrar`

Cierra el turno realizando el arqueo de caja (OP-011).

**Request body:**
```json
{
  "contadoEfectivo": 487.50,
  "empleadoId": "uuid"
}
```

**Respuesta 200:**
```json
{
  "id": "uuid-turno",
  "abierto": false,
  "horaCierre": "2026-03-14T23:30:00.000Z",
  "efectivoEsperado": "492.00",
  "efectivoReal": "487.50",
  "descuadre": "-4.50"
}
```

**Cálculo de descuadre (RN-040):**
```
descuadre = contadoEfectivo − efectivoEsperado
efectivoEsperado = fondoApertura + Σentradas − Σsalidas + cobrosEfectivo
```

---

## Módulos adicionales (Backend-only)

Estos módulos tienen servicios activos pero no están expuestos en el frontend actual:

| Módulo | Servicio | Capacidades |
|--------|----------|-------------|
| **Inventario** | `InventarioService` | Gestión de stock, escandallos, deducción automática en venta |
| **Contable** | `AsientoService` | Asientos automáticos double-entry (PGC Pymes) |
| **Fiscal** | `FiscalService` | Generación de modelos 303/390/347/111/115 |
| **VeriFactu** | `VeriFactuService` | Hash SHA-256 encadenado, registro fiscal inmutable |
