# M0-SET — Historias de Usuario: Setup y Onboarding

> **Módulo**: M0-PLATFORM  
> **Ámbito**: SET — Configuración inicial y administración del establecimiento  
> **Última revisión**: 2026-03-15

---

## HU-M0-SET-001 | Asistente de Configuración Inicial | Must

**COMO** nuevo cliente de GastroFlow (propietario de un bar/restaurante)  
**QUIERO** un asistente guiado que me configure el sistema desde cero  
**PARA** estar operativo en menos de 30 minutos sin conocimientos técnicos.

**Criterios de aceptación:**

- **AC-01**: DADO que accedo por primera vez al sistema CUANDO ingreso el código de activación de mi suscripción ENTONCES el sistema me presenta un wizard de 7 pasos con progreso visible, sin la posibilidad de acceder al resto del sistema hasta completarlo.
- **AC-02**: DADO que estoy en el Paso 1 CUANDO introduzco NIF/CIF con formato inválido ENTONCES el campo se marca en rojo con el mensaje exacto del error antes de poder pasar al siguiente paso.
- **AC-03**: DADO que estoy en el Paso 1 y cambio el régimen fiscal ENTONCES aparece un banner amarillo: "Este dato afecta al cálculo de todos los impuestos. Asegúrate de que es correcto."
- **AC-04**: DADO que completo todos los pasos CUANDO pulso «Finalizar setup» ENTONCES el sistema crea todos los datos base, me lleva al dashboard principal y muestra el mensaje "¡Bienvenido a GastroFlow, [Nombre del establecimiento]!".
- **AC-05**: DADO que el setup está incompleto CUANDO cierro el navegador y vuelvo ENTONCES el wizard retoma desde el último paso completado.
- **AC-06**: DADO que el setup ha sido completado ENTONCES el enlace al wizard queda desactivado y solo es accesible desde Configuración > Restablecer setup (requiere confirmación de ADMIN).

**Pasos del wizard:**
1. Datos del establecimiento (nombre legal, NIF, dirección, logo, régimen fiscal, régimen IVA)
2. Módulos activos (confirmación visual de la suscripción contratada)
3. Crear primer empleado ADMINISTRADOR / GERENTE
4. Zonas y mesas (crear al menos 1 zona con 1 mesa)
5. Configurar caja (nombre, modo impresión, series de facturación)
6. Catálogo inicial (opcional si M2 activo: importar CSV o crear 1 producto de ejemplo)
7. Parámetros contables (si M3 activo: ejercicio, confirmación plan de cuentas)

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Políticas | POL-074 (visibilidad por módulo), INV-SETUP-001 (inmutabilidad datos fiscales) |
| Documentos | `modelo-saas-licencias.md` §5 |

---

## HU-M0-SET-002 | Pantalla de Configuración Permanente | Must

**COMO** ADMINISTRADOR del establecimiento  
**QUIERO** una sección de configuración siempre accesible y exclusiva para mi rol  
**PARA** poder seguir ajustando el sistema a medida que el negocio evoluciona.

**Criterios de aceptación:**

- **AC-01**: DADO que soy ADMINISTRADOR CUANDO abro el menú lateral ENTONCES veo la sección "Configuración" que no es visible para ningún otro rol.
- **AC-02**: DADO que estoy en Configuración y modifico un campo fiscal (régimen IVA, régimen fiscal) ENTONCES antes de guardar aparece un diálogo de confirmación con el texto: "Este cambio afecta a los cálculos de impuestos y se registrará en el log de auditoría. ¿Confirmar?"
- **AC-03**: DADO que cambio cualquier dato en Configuración CUANDO pulso Guardar ENTONCES el cambio se registra en `AuditLog` con: admin_id, campo, valor_anterior, valor_nuevo, timestamp. El log es de solo lectura.
- **AC-04**: DADO que accedo a "Series de facturación" CUANDO intento cambiar el número de inicio de serie ENTONCES el sistema muestra "⚠️ IRREVERSIBLE: resetear la numeración puede provocar duplicados de factura contrarios a la normativa. Solo proceder si estás al inicio del ejercicio fiscal."
- **AC-05**: DADO que un empleado con rol CAMARERO, CAJERO, COCINERO o GERENTE intenta acceder a `/configuracion` ENTONCES recibe HTTP 403 y el frontend le muestra "No tienes permisos para acceder a esta sección."

**Secciones de la pantalla:**
- Datos del establecimiento
- Módulos y licencias (ver activos, botón "Ampliar suscripción")
- Gestión de empleados y roles
- Zonas y mesas
- Series de facturación
- Almacenes (si M2)
- Parámetros fiscales y contables (si M3)
- Integraciones (VeriFactu, WhatsApp, impresora)
- Log de auditoría

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Políticas | POL-071 (matriz de permisos sección M0), POL-075 (auditoría) |

---

## HU-M0-SET-003 | Gestión de Zonas y Mesas desde Configuración | Must

**COMO** ADMINISTRADOR o GERENTE  
**QUIERO** poder añadir, renombrar, o reorganizar zonas y mesas sin necesidad del wizard  
**PARA** adaptar el plano del local cuando se reorganiza físicamente (ej: nueva terraza de verano).

**Criterios de aceptación:**

- **AC-01**: DADO que añado una nueva zona CUANDO guardo ENTONCES aparece inmediatamente en el plano de sala para todos los empleados conectados.
- **AC-02**: DADO que elimino una mesa CUANDO esa mesa tiene un servicio abierto ENTONCES el sistema impide la eliminación: "No se puede eliminar la mesa X porque tiene un servicio activo."
- **AC-03**: DADO que cambio la capacidad de una mesa ENTONCES el cambio no afecta a servicios ya abiertos en esa mesa.
- **AC-04**: DADO que renombro una zona ENTONCES los servicios históricos y tickets ya emitidos en esa zona **no cambian** (se almacena snapshot del nombre en el ticket).

---

## HU-M0-SET-004 | Auditoría de Cambios en Datos Críticos | Must

**COMO** ADMINISTRADOR  
**QUIERO** ver un historial de todos los cambios realizados en configuración  
**PARA** tener trazabilidad completa ante una inspección de Hacienda o un problema operativo.

**Criterios de aceptación:**

- **AC-01**: DADO que accedo a Configuración > Log de Auditoría ENTONCES veo una tabla con: fecha/hora, usuario, acción, campo modificado, valor anterior, valor nuevo. Ordenada por fecha descendente.
- **AC-02**: DADO que el log tiene más de 100 entradas CUANDO pagino ENTONCES el rendimiento no se degrada (paginación server-side).
- **AC-03**: El log de auditoría es de **solo lectura**. No existe botón de borrar ni editar, ni siquiera para el ADMINISTRADOR.
- **AC-04**: DADO que exporto el log ENTONCES se descarga un CSV con todas las columnas, compatible con Excel y con la gestoría.

**Campos auditados como mínimo:** datos fiscales del establecimiento, series de facturación, altas/bajas de empleados, cambios de rol, ajustes manuales de asientos (M3).

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Políticas | POL-075 (tabla completa de acciones auditables) |
| Legal | RGPD Art. 5(1)(f) — integridad y confidencialidad |
