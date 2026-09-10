# POL-06.9 — Perfiles, Roles y Control de Acceso

> **Capa**: 06 — Políticas de Decisión  
> **Dominio**: Seguridad, Acceso y Operativa  
> **Afecta a**: Todos los módulos  
> **Última revisión**: 2026-03-15  
> **Estado**: Normativo

---

## Principio General

> El sistema aplica el principio de **mínimo privilegio**: cada empleado ve y puede hacer únicamente lo necesario para su función. Esto no es solo seguridad; es ergonomía — el cocinero no necesita ver la caja, el camarero no necesita ver la contabilidad.

Toda acción de cobro queda registrada con el **identificador del empleado** que la realizó. No existe el cobro anónimo.

---

## POL-070 — Definición de Roles

El sistema reconoce los siguientes roles. Un empleado puede tener **un solo rol base**, pero el ADMINISTRADOR puede crear **perfiles combinados** para roles híbridos frecuentes en hostelería.

### Roles base

| Rol | Código | Descripción |
|-----|--------|-------------|
| **Administrador** | `ADMIN` | Propietario o gerente técnico del sistema. Configura todo el establecimiento. Solo 1 por establecimiento (puede haber más si se delega). |
| **Gerente** | `GERENTE` | Encargado / jefe de sala. Ve y controla todo lo operativo y financiero. No puede cambiar configuración del sistema. |
| **Cajero** | `CAJERO` | Personal de caja. Puede cobrar, abrir/cerrar turno de caja. No accede a backoffice. |
| **Camarero** | `CAMARERO` | Personal de sala. Gestiona mesas, toma comandas, imprime/envía tickets. **No puede cobrar**. |
| **Cocinero** | `COCINERO` | Personal de cocina. Solo ve el KDS de cocina. Sin acceso a sala ni caja. |
| **Barista / Barra** | `BARRA` | Personal de barra. Solo ve el KDS de barra. Sin acceso a sala ni caja. |
| **Contable** | `CONTABLE` | Asesor externo o contable interno. Acceso de solo lectura a M3 (contabilidad, fiscal). No puede hacer operaciones. |

### Perfiles combinados predefinidos

| Perfil | Roles que combina | Caso de uso típico |
|--------|-------------------|--------------------|
| **Camarero-Cajero** | `CAMARERO` + `CAJERO` | Bar pequeño donde el mismo empleado sirve y cobra |
| **Gerente-Admin** | `GERENTE` + `ADMIN` | Propietario que también hace de encargado |
| **Cocinero-Almacén** | `COCINERO` + acceso lectura inventario M2 | Jefe de cocina que controla el stock de cocina |

> El ADMINISTRADOR puede crear perfiles combinados personalizados adicionales desde la pantalla de Configuración > Gestión de Empleados.

---

## POL-071 — Matriz de Permisos por Módulo y Función

### M1 — TPV

| Función | ADMIN | GERENTE | CAJERO | CAMARERO | COCINERO | BARRA | CONTABLE |
|---------|:-----:|:-------:|:------:|:--------:|:--------:|:-----:|:--------:|
| Ver plano de sala | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Abrir mesa | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Mover / unir mesas | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Tomar comanda | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Añadir modificadores | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Anular línea de comanda | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Repetir comanda | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Cobrar mesa** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Dividir cuenta | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Pago mixto | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Emitir factura completa | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Aplicar descuentos/invitaciones | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Abrir turno de caja** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Cerrar turno de caja / arqueo** | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Retiradas de caja | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Ver KDS Cocina | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Marcar plato listo (KDS Cocina) | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| Ver KDS Barra | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Marcar preparado (KDS Barra) | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Ver resumen ventas del día | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

### M2 — ERP / Backoffice

| Función | ADMIN | GERENTE | CAJERO | CAMARERO | COCINERO | BARRA | CONTABLE |
|---------|:-----:|:-------:|:------:|:--------:|:--------:|:-----:|:--------:|
| Ver catálogo de productos | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Crear / editar productos | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gestionar escandallos | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Ver stock de inventario | ✅ | ✅ | ❌ | ❌ | 👁️* | ❌ | ❌ |
| Registrar conteo de inventario | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gestionar proveedores | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Crear pedidos a proveedores | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Registrar facturas de compra | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Ver empleados | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Alta/baja empleados | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gestionar cuadrante de turnos | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Ver mis fichajes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| Ver fichajes de todos | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Informe de horas y extras | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

> 👁️\* Solo en perfil combinado Cocinero-Almacén, lectura únicamente.

### M3 — Contabilidad y Fiscal

| Función | ADMIN | GERENTE | CAJERO | CAMARERO | COCINERO | BARRA | CONTABLE |
|---------|:-----:|:-------:|:------:|:--------:|:--------:|:-----:|:--------:|
| Ver balance de sumas y saldos | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Ver libro diario (asientos) | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Ver dashboard IVA trimestral | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Ver / generar Modelo 303 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Ver libros de registro | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Ver Modelos 347/111/115 | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Ajustar asientos manualmente | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Exportar a AEAT / CSV | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |

### M0 — Configuración del Sistema

| Función | ADMIN | GERENTE | CAJERO | CAMARERO | COCINERO | BARRA | CONTABLE |
|---------|:-----:|:-------:|:------:|:--------:|:--------:|:-----:|:--------:|
| Editar datos del establecimiento | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gestionar módulos y licencias | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gestionar roles y perfiles | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gestionar zonas y mesas | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gestionar series de facturación | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Gestionar almacenes | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Ver log de auditoría | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Backup / restaurar | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |

---

## POL-072 — Trazabilidad de Cobros

> Toda operación de cobro registra obligatoriamente el `empleadoId` del ejecutor. No se puede cobrar sin sesión activa del empleado.

**Campos auditables en cada cobro:**
- `cobradoPor: empleadoId` — quién realizó el cobro
- `rolEnMomento: string` — rol del empleado en el momento del cobro (inmutable post-cobro)
- `fechaHora: DateTime` — timestamp UTC del cobro
- `turnoCajaId` — turno de caja activo en ese momento

**Regla**: Si el `turno de caja` pertenece a un cajero distinto del que está cobrando, se registra como `cobro delegado` pero siempre con ambos IDs.

---

## POL-073 — Login y Sesión

Existen dos modelos de autenticación según el plan:

### Modo PIN rápido (Plan Starter / operativa de bar)
Cada empleado tiene un **PIN de 4 dígitos** para identificarse en el TPV. Rápido para cambiar entre empleados en sala.
- El gerente puede ver qué PIN usa cada empleado.
- El PIN nunca viaja al cliente en texto plano; se almacena como hash.

### Modo Password (Plan Negocio y superiores)
Email + contraseña con sesión JWT. Adecuado para backoffice y módulos M2/M3. Los empleados de sala pueden opcionalmente seguir usando PIN para las operaciones de sala.

### Flujo de cambio de turno
1. Empleado A está en sesión activa (camarero).
2. Empleado B se identifica con su PIN/password.
3. El sistema cierra la sesión de A y abre la de B.
4. Las comandas de A siguen abiertas y son visibles para cualquier empleado autorizado.

---

## POL-074 — Visibilidad del Menú según Módulos y Rol

El menú de navegación del frontend se construye dinámicamente según:
1. **Módulos activos** del establecimiento (`LicenciaModulo`)
2. **Rol** del empleado en sesión

```
Ejemplo: Camarero en establecimiento con M1+M2 activos:
  ✅ Sala / Mesas
  ✅ KDS Cocina (solo lectura, no puede marcar)
  ❌ Caja (no visible - sin permiso de cobro)
  ❌ Backoffice / Catálogo (no visible - sin permiso)
  ❌ Contabilidad (sin módulo M3 y sin rol)

Ejemplo: Gerente en establecimiento con M1+M2+M3:
  ✅ Sala / Mesas
  ✅ KDS Cocina + Barra
  ✅ Caja
  ✅ Backoffice completo (Catálogo, Empleados, Compras, Inventario)
  ✅ Contabilidad (Fiscal, Libro diario)
  ❌ Configuración del Sistema (solo ADMIN)
```

---

## POL-075 — Auditoría y Log de Acciones Sensibles

Las siguientes acciones generan un registro de auditoría inmutable:

| Acción | Datos auditados |
|--------|----------------|
| Cobro realizado | empleadoId, servicioId, total, formas de pago, timestamp |
| Anulación de línea de comanda | empleadoId, productoId, motivo, timestamp |
| Descuento / invitación aplicada | empleadoId, importe, motivo, timestamp |
| Arqueo de caja cerrado | cajeroId, fondoApertura, totalVentas, totalEfectivo, descuadre |
| Cambio de datos fiscales del establecimiento | adminId, campo, valor_anterior, valor_nuevo, timestamp |
| Alta/baja de empleado | adminId, empleadoId, acción, timestamp |
| Cambio de rol de empleado | adminId, empleadoId, rol_anterior, rol_nuevo, timestamp |
| Ajuste manual de asiento contable | empleadoId, asientoId, descripción_cambio, timestamp |

---

## Trazabilidad

| Tipo | Referencias |
|------|------------|
| Invariantes afectadas | INV-SETUP-001 (inmutabilidad datos fiscales), INV-007 (inalterabilidad VeriFactu) |
| Documentos relacionados | `modelo-saas-licencias.md`, `M0-SETUP-configuracion.md` |
| Implementación técnica pendiente | Guard de roles NestJS, middleware de sesión, tabla `AuditLog` en Prisma |
