# API Contract — GastroFlow REST API

> **Versión**: 0.1.0  
> **Fecha**: 2026-03-15  
> **Base URL**: `http://localhost:3000/api/v1`  
> **Swagger UI**: `http://localhost:3000/docs`  
> **Schema source of truth**: `src/common/swagger/swagger-schemas.ts`  
> **Autenticación**: Bearer JWT (obtener con `POST /auth/login-pin` o `POST /auth/login`)

---

## Instrucciones para la IA Agéntica

> **LEER ANTES DE CUALQUIER EVOLUTIVO QUE MODIFIQUE O AÑADA ENDPOINTS**

### Reglas de contrato de API (INV-API-001 a INV-API-006)

| ID | Invariante de contrato | Consecuencia de violación |
|----|------------------------|--------------------------|
| **INV-API-001** | Todo endpoint nuevo DEBE tener `@ApiOperation` con `summary` y `description` completos | Swagger incompleto; rompe documentación agéntica |
| **INV-API-002** | Todo endpoint que devuelva datos DEBE declarar `@ApiOkResponse` o `@ApiCreatedResponse` con `description` | La IA agéntica no puede inferir el schema de respuesta |
| **INV-API-003** | Todo endpoint protegido DEBE tener `@ApiBearerAuth('JWT')` en el controller | El botón Authorize de Swagger no funciona para ese tag |
| **INV-API-004** | Los shapes de respuesta reutilizables DEBEN declararse en `src/common/swagger/swagger-schemas.ts` | Duplicación; riesgo de inconsistencia |
| **INV-API-005** | Toda operación de escritura fiscalmente relevante DEBE mencionar la invariante relacionada (INV-XXX) en `@ApiOperation.description` | La IA no puede validar restricciones fiscales al implementar evolutivos |
| **INV-API-006** | Al añadir un nuevo tag de módulo, DEBE registrarse en `main.ts` con `.addTag()` | El tag no aparece en Swagger UI |

### Workflow de validación para evolutivos

```
NUEVO EVOLUTIVO
     │
     ├─ 1. Consultar specs/02-historias/{módulo}/_index.md → HU a implementar
     ├─ 2. Consultar specs/04-invariantes/ → invariantes del dominio afectado
     ├─ 3. Consultar specs/09-skills/ → skills relacionados
     ├─ 4. Implementar endpoint en controller con:
     │      @ApiOperation (summary + description + referencias HU/SK/INV)
     │      @ApiBody (si POST/PATCH)
     │      @ApiOkResponse / @ApiCreatedResponse
     │      @ApiNotFoundResponse / @ApiBadRequestResponse (si aplica)
     ├─ 5. Si hay DTO de respuesta reutilizable → añadir a swagger-schemas.ts
     ├─ 6. Verificar que INV-API-001 a INV-API-006 se cumplen
     └─ 7. Actualizar este archivo (api-contract.md) con el nuevo endpoint
```

---

## Mapa de endpoints por módulo

### M0-PLATFORM — Auth y Empleados

| Método | Ruta | Summary | Auth | HU / SK | INV |
|--------|------|---------|------|---------|-----|
| `POST` | `/auth/login-pin` | Login sala por PIN | ❌ Pública | HU-M0-ROL-001 | — |
| `POST` | `/auth/login` | Login backoffice email/password | ❌ Pública | HU-M0-ROL-002 | — |
| `GET` | `/empleados` | Listar empleados | ✅ ADMIN/GERENTE | HU-M0-ROL-003 | — |
| `GET` | `/empleados/:id` | Obtener empleado | ✅ ADMIN/GERENTE | HU-M0-ROL-003 | — |
| `POST` | `/empleados` | Crear empleado | ✅ ADMIN/GERENTE | HU-M0-ROL-003 | — |
| `PUT` | `/empleados/:id` | Actualizar empleado | ✅ ADMIN/GERENTE | HU-M0-ROL-003 | — |
| `DELETE` | `/empleados/:id` | Dar de baja empleado | ✅ ADMIN/GERENTE | HU-M0-ROL-003 | — |

---

### M1-TPV — Sala, Comandas, Cobros, Caja, KDS

#### Mesas

| Método | Ruta | Summary | Auth | HU / SK | INV clave |
|--------|------|---------|------|---------|-----------|
| `POST` | `/mesas/barra/abrir` | Abrir servicio barra | ✅ JWT | — | INV-011 |
| `POST` | `/mesas/:mesaId/abrir` | Abrir mesa | ✅ JWT | HU-M1-SAL-002, SK-001 | INV-010, INV-011 |
| `GET` | `/mesas/establecimiento/:id/mapa` | Mapa de sala | ✅ JWT | HU-M1-SAL-001 | INV-010 |
| `PATCH` | `/mesas/servicios/:id/mover` | Mover servicio | ✅ JWT | HU-M1-SAL-003 | INV-010, INV-011 |
| `POST` | `/mesas/servicios/unir` | Unir servicios | ✅ JWT | HU-M1-SAL-004 | INV-013 |

#### Comandas

| Método | Ruta | Summary | Auth | HU / SK | INV clave |
|--------|------|---------|------|---------|-----------|
| `POST` | `/comandas` | Tomar comanda | ✅ JWT | HU-M1-CMD-001, SK-002 | INV-012 |
| `GET` | `/comandas/servicio/:id/cuenta` | Calcular cuenta | ✅ JWT | SK-003 | INV-002, INV-003 |
| `POST` | `/comandas/servicio/:id/dividir` | Dividir cuenta | ✅ JWT | HU-M1-COB-003, SK-004 | INV-013 |
| `DELETE` | `/comandas/lineas/:id` | Anular línea | ✅ JWT | HU-M1-CMD-005 | — |

#### Cobros

| Método | Ruta | Summary | Auth | HU / SK | INV clave |
|--------|------|---------|------|---------|-----------|
| `GET` | `/cobros/tickets/:id` | Obtener ticket | ✅ JWT | HU-M1-COB-008, SK-006 | INV-001, INV-007 |
| `GET` | `/cobros/tickets` | Listar tickets del día | ✅ JWT | HU-M1-COB-008 | — |
| `POST` | `/cobros/servicio/:id` | Cobrar servicio | ✅ JWT | SK-005, SK-006 | **INV-002, INV-003, INV-007, INV-008, INV-014** |
| `POST` | `/cobros/factura-completa` | Emitir factura completa | ✅ JWT | HU-M1-COB-006, SK-007 | INV-001 |
| `POST` | `/cobros/rectificativa` | Emitir rectificativa | ✅ JWT | HU-M1-COB-007, SK-008 | INV-007 |

#### Caja

| Método | Ruta | Summary | Auth | HU / SK | INV clave |
|--------|------|---------|------|---------|-----------|
| `GET` | `/caja/turno/activo` | Turno activo | ✅ JWT | HU-M1-CAJ-001 | — |
| `POST` | `/caja/turno/abrir` | Abrir turno | ✅ JWT | HU-M1-CAJ-001, SK-009 | INV-015 |
| `POST` | `/caja/turno/:id/movimiento` | Registrar movimiento | ✅ JWT | — | INV-015 |
| `POST` | `/caja/turno/:id/cerrar` | Cerrar turno (arqueo) | ✅ JWT | HU-M1-CAJ-002, SK-009 | INV-015 |

#### KDS

| Método | Ruta | Summary | Auth | HU / SK | INV clave |
|--------|------|---------|------|---------|-----------|
| `SSE` | `/kds/stream` | Stream tiempo real | ✅ JWT | HU-M1-CMD-003/004 | — |
| `GET` | `/kds/pendientes` | Comandas pendientes | ✅ JWT | — | — |
| `PATCH` | `/kds/lineas/:id/listo` | Marcar plato listo | ✅ JWT | EVT-003 | — |
| `PATCH` | `/kds/comandas/:id/lista` | Marcar comanda lista | ✅ JWT | — | — |

---

### M2-ERP — Catálogo, Inventario, Compras, RRHH

#### Catálogo

| Método | Ruta | Summary | Auth | HU / SK | INV clave |
|--------|------|---------|------|---------|-----------|
| `GET` | `/productos/catalogo` | Catálogo TPV activo | ✅ JWT | — | — |
| `POST` | `/catalogo/productos` | Crear producto | ✅ JWT | HU-M2-CAT-001 | — |
| `PATCH` | `/catalogo/productos/:id` | Actualizar producto | ✅ JWT | HU-M2-CAT-001 | — |
| `GET` | `/catalogo/productos/:id` | Obtener producto | ✅ JWT | HU-M2-CAT-001 | — |
| `GET` | `/catalogo/productos` | Listar productos | ✅ JWT | HU-M2-CAT-001 | — |
| `POST` | `/catalogo/productos/:id/escandallo` | Crear escandallo | ✅ JWT | HU-M2-CAT-002, SK-011 | INV-020 |
| `GET` | `/catalogo/alergenos` | Listar alérgenos | ✅ JWT | HU-M2-CAT-003 | RN-031 |
| `PATCH` | `/catalogo/productos/:id/alergenos` | Asignar alérgenos | ✅ JWT | HU-M2-CAT-003 | RN-031 |
| `POST` | `/catalogo/categorias` | Crear categoría | ✅ JWT | — | — |
| `GET` | `/catalogo/categorias` | Listar categorías | ✅ JWT | — | — |
| `POST` | `/catalogo/ingredientes` | Crear ingrediente | ✅ JWT | — | INV-020 |
| `GET` | `/catalogo/ingredientes` | Listar ingredientes | ✅ JWT | — | — |

#### Inventario

| Método | Ruta | Summary | Auth | HU / SK | INV clave |
|--------|------|---------|------|---------|-----------|
| `GET` | `/inventario/almacenes` | Listar almacenes | ✅ JWT | — | — |
| `GET` | `/inventario/stock` | Consultar stock | ✅ JWT | SK-011 | **INV-020** |
| `POST` | `/inventario/conteo` | Conteo inventario | ✅ JWT | HU-M2-INV-003, SK-014 | INV-022 |
| `POST` | `/inventario/traspaso` | Traspaso entre almacenes | ✅ JWT | HU-M2-INV-005, SK-015 | INV-021 |

#### Compras

| Método | Ruta | Summary | Auth | HU / SK | INV clave |
|--------|------|---------|------|---------|-----------|
| `POST` | `/compras/proveedores` | Crear proveedor | ✅ JWT | HU-M2-COM-001 | — |
| `GET` | `/compras/proveedores` | Listar proveedores | ✅ JWT | HU-M2-COM-001 | — |
| `GET` | `/compras/proveedores/:id` | Obtener proveedor | ✅ JWT | HU-M2-COM-001 | — |
| `POST` | `/compras/pedidos` | Crear pedido | ✅ JWT | HU-M2-COM-002, SK-020 | — |
| `GET` | `/compras/pedidos` | Listar pedidos | ✅ JWT | HU-M2-COM-002 | — |
| `POST` | `/compras/albaranes` | Registrar albarán | ✅ JWT | HU-M2-COM-003, SK-021 | INV-022 |
| `GET` | `/compras/albaranes` | Listar albaranes | ✅ JWT | HU-M2-COM-003 | — |
| `POST` | `/compras/facturas` | Registrar factura compra | ✅ JWT | HU-M2-COM-004, SK-022 | **INV-005, INV-033** |
| `GET` | `/compras/facturas` | Listar facturas | ✅ JWT | HU-M2-COM-004 | — |

#### RRHH

| Método | Ruta | Summary | Auth | HU / SK | INV clave |
|--------|------|---------|------|---------|-----------|
| `POST` | `/rrhh/empleados` | Crear empleado laboral | ✅ JWT | HU-M2-RRH-001 | — |
| `PATCH` | `/rrhh/empleados/:id` | Actualizar empleado | ✅ JWT | HU-M2-RRH-001 | — |
| `GET` | `/rrhh/empleados` | Listar empleados | ✅ JWT | HU-M2-RRH-001 | — |
| `GET` | `/rrhh/empleados/:id` | Obtener empleado | ✅ JWT | HU-M2-RRH-001 | — |
| `POST` | `/rrhh/turnos` | Asignar turno | ✅ JWT | HU-M2-RRH-002 | INV-040 |
| `GET` | `/rrhh/cuadrante` | Cuadrante turnos | ✅ JWT | HU-M2-RRH-002 | — |
| `POST` | `/rrhh/fichajes` | Registrar fichaje | ✅ JWT | HU-M2-RRH-003 | INV-041 |
| `GET` | `/rrhh/fichajes` | Listar fichajes | ✅ JWT | HU-M2-RRH-003 | INV-042 |

---

### M3-CONTABILIDAD — Contable y Fiscal

#### Contabilidad

| Método | Ruta | Summary | Auth | HU / SK | INV clave |
|--------|------|---------|------|---------|-----------|
| `GET` | `/contable/balance` | Balance sumas y saldos | ✅ JWT | SK-034 | **INV-030, INV-031** |
| `GET` | `/contable/diario` | Libro diario (asientos) | ✅ JWT | SK-033 | INV-030 |
| `GET` | `/contable/cierre` | Cierre diario caja | ✅ JWT | — | INV-015 |

#### Fiscal

| Método | Ruta | Summary | Auth | HU / SK | INV clave |
|--------|------|---------|------|---------|-----------|
| `GET` | `/fiscal/iva-trimestral` | IVA repercutido/soportado | ✅ JWT | SK-040, SK-041 | **INV-004, INV-005, INV-006** |
| `GET` | `/fiscal/modelo303` | Borrador Modelo 303 | ✅ JWT | SK-042, HU-M3-IMP-002 | INV-006 |
| `GET` | `/fiscal/libro-registro` | Libro registro IVA | ✅ JWT | SK-046, SK-047 | INV-005 |

---

### Utility

| Método | Ruta | Summary | Auth |
|--------|------|---------|------|
| `GET` | `/setup/info` | Datos iniciales establecimiento | ❌ Pública |

---

## Convenciones de respuesta

### Códigos HTTP usados

| Código | Semántica en GastroFlow |
|--------|------------------------|
| `200 OK` | Consulta exitosa o actualización exitosa |
| `201 Created` | Recurso creado (POST de escritura) |
| `400 Bad Request` | Validación fallida o violación de invariante de negocio |
| `401 Unauthorized` | Token ausente, expirado o inválido |
| `403 Forbidden` | Token válido pero rol insuficiente |
| `404 Not Found` | Recurso no encontrado por ID |
| `409 Conflict` | Estado inconsistente (mesa ya ocupada, etc.) |
| `500 Internal Server Error` | Error inesperado (no debe contener stack traces en producción) |

### Formato de fechas

Todas las fechas se expresan en **ISO 8601** con UTC: `2026-03-15T13:30:00.000Z`.  
Son **strings** en los bodies de entrada y en las respuestas JSON.

### Formato de importes

Todos los importes monetarios son **números decimales en euros** con hasta 2 decimales.  
No se usan strings ni centavos enteros.

### IDs

Todos los IDs son **UUID v4** en formato string `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`.

---

## Consideraciones de seguridad

| Aspecto | Implementación |
|---------|---------------|
| **Autenticación** | JWT firmado con `JWT_SECRET` (env var). Expiración configurable (`JWT_EXPIRES_IN`). |
| **Autorización** | El guard `RolesGuard` comprueba `req.user.rol` contra el decorador `@Roles(...)`. |
| **Validación input** | `ValidationPipe` global con `whitelist: true, forbidNonWhitelisted: true`. |
| **SQL Injection** | Prisma usa queries parametrizadas; no se concatenan strings SQL. |
| **OWASP A01 (Access Control)** | `@UseGuards(JwtAuthGuard, RolesGuard)` en todos los endpoints sensibles. |
| **OWASP A02 (Crypto)** | Contraseñas con bcrypt (cost 12). PINs con bcrypt. JWT con HS256. |
| **OWASP A03 (Injection)** | Sin raw queries. Sin interpolación de inputs en SQL. |
| **OWASP A04 (Insecure Design)** | Invariantes fiscales (INV-001–INV-008) aplicadas en servicio, no en controller. |
| **CORS** | `app.enableCors()` configurado (restringir origins en producción). |

---

## Eventos de dominio relacionados

Los endpoints write disparan eventos que generan efectos secundarios:

| Endpoint | Evento emitido | Efecto |
|----------|---------------|--------|
| `POST /cobros/servicio/:id` | `EVT-001: TicketEmitido` | Asiento contable 70X/57X/47X generado |
| `POST /cobros/servicio/:id` | `EVT-002: ComandaFinalizada` | Stock descontado por escandallo (SK-010) |
| `POST /cobros/factura-completa` | — | Entrada en Libro Facturas Emitidas (SK-046) |
| `POST /compras/albaranes` | `EVT-004: MercanciaRecibida` | Stock incrementado en almacén (SK-013) |
| `POST /compras/facturas` | — | Asiento compra generado (SK-031) + Libro Recibidas (SK-047) |
| `PATCH /kds/lineas/:id/listo` | `EVT-003: PlatoListo` | Notificación SSE al camarero |
| `POST /caja/turno/:id/cerrar` | — | Asiento cierre de caja generado |

---

## Checklist de validación para la IA agéntica

Antes de marcar un evolutivo como completado, verificar:

- [ ] El endpoint tiene `@ApiOperation` con `summary` y `description`
- [ ] Se declara respuesta exitosa con `@ApiOkResponse` o `@ApiCreatedResponse`
- [ ] Se documentan respuestas de error esperadas (`@ApiBadRequestResponse`, `@ApiNotFoundResponse`)
- [ ] Si es protegido, tiene `@ApiBearerAuth('JWT')`
- [ ] Si hay DTO de respuesta reutilizable, está en `swagger-schemas.ts`
- [ ] La descripción menciona las invariantes (INV-XXX) que el endpoint debe respetar
- [ ] La tabla de endpoints de este archivo está actualizada
- [ ] `npm run build` compila sin errores TypeScript
