# M0-ROL — Historias de Usuario: Roles y Control de Acceso

> **Módulo**: M0-PLATFORM  
> **Ámbito**: ROL — Autenticación, roles y permisos  
> **Última revisión**: 2026-03-15

---

## HU-M0-ROL-001 | Login con PIN rápido (TPV / Sala) | Must

**COMO** empleado de sala o cocina  
**QUIERO** identificarme con un PIN de 4 dígitos desde cualquier pantalla del TPV  
**PARA** cambiar rápidamente de turno sin interrumpir el servicio.

**Criterios de aceptación:**

- **AC-01**: DADO que estoy en la pantalla de sala CUANDO pulso "Cambiar empleado" ENTONCES aparece un teclado numérico de pantalla completa pidiendo el PIN.
- **AC-02**: DADO que introduzco el PIN correcto ENTONCES en menos de 1 segundo quedo identificado y el sistema muestra mi nombre en la barra superior.
- **AC-03**: DADO que introduzco 3 PINs incorrectos consecutivos ENTONCES se bloquea la entrada durante 60 segundos y se notifica al GERENTE/ADMIN.
- **AC-04**: DADO que soy COCINERO y me identifico con PIN ENTONCES solo veo el KDS de cocina, el menú de sala no aparece aunque esté en el mismo dispositivo.
- **AC-05**: DADO que mi sesión lleva 8 horas sin actividad ENTONCES el sistema me desloguea automáticamente y vuelve a la pantalla de PIN.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Políticas | POL-073 (login y sesión), POL-074 (visibilidad por rol) |

---

## HU-M0-ROL-002 | Login con Email/Password (Backoffice) | Must

**COMO** GERENTE, ADMINISTRADOR o CONTABLE  
**QUIERO** acceder con mis credenciales de email y contraseña  
**PARA** tener una sesión segura en el backoffice y los módulos de contabilidad.

**Criterios de aceptación:**

- **AC-01**: DADO que accedo a la URL del sistema CUANDO introduzco email y contraseña correctos ENTONCES recibo un JWT de sesión y entro al dashboard con mi menú adaptado a mi rol y módulos.
- **AC-02**: DADO que mi contraseña tiene menos de 8 caracteres ENTONCES el formulario de registro/cambio de contraseña no la acepta.
- **AC-03**: DADO que fallo el login 5 veces ENTONCES mi cuenta queda bloqueada 15 minutos y recibo un email de aviso.
- **AC-04**: DADO que el JWT expira (24 horas) CUANDO intento hacer una operación ENTONCES el sistema me redirige a login sin perder los datos del formulario que estaba rellenando.
- **AC-05**: DADO que soy CONTABLE y hago login ENTONCES solo veo el módulo M3 en modo lectura. No aparecen M1, M2 ni Configuración.

---

## HU-M0-ROL-003 | Gestión de Empleados y Asignación de Roles | Must

**COMO** ADMINISTRADOR  
**QUIERO** dar de alta, modificar y dar de baja empleados asignándoles su rol  
**PARA** controlar quién puede hacer qué en el sistema.

**Criterios de aceptación:**

- **AC-01**: DADO que doy de alta un empleado ENTONCES debo especificar: nombre, apellidos, NIF, puesto laboral, rol en el sistema (ADMIN/GERENTE/CAJERO/CAMARERO/COCINERO/BARRA/CONTABLE) y PIN (si es empleado de sala).
- **AC-02**: DADO que asigno rol CAJERO a un empleado ENTONCES ese empleado puede cobrar mesas y gestionar la caja pero NO puede ver backoffice ni contabilidad.
- **AC-03**: DADO que un empleado tiene un servicio de mesa abierto CUANDO intento dar de baja a ese empleado ENTONCES el sistema bloquea la baja: "El empleado X tiene servicios activos."
- **AC-04**: DADO que cambio el rol de un empleado ENTONCES el cambio tiene efecto inmediato — si está logueado, su sesión se invalida y debe volver a identificarse.
- **AC-05**: El GERENTE puede dar de alta empleados pero **no puede crear otros ADMIN** ni **cambiar el rol de un ADMIN existente**. Solo el ADMIN puede crear o modificar otros ADMIN.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Políticas | POL-070 (definición de roles), POL-075 (auditoría de alta/baja/cambio de rol) |

---

## HU-M0-ROL-004 | Menú Adaptado a Rol y Módulos Activos | Must

**COMO** empleado o gerente del establecimiento  
**QUIERO** que el menú del sistema muestre solo lo que puedo usar  
**PARA** no perderme entre opciones que no son para mí ni cometer errores.

**Criterios de aceptación:**

- **AC-01**: DADO que soy CAMARERO CUANDO abro la aplicación ENTONCES solo veo: Sala/Mesas. No veo Caja, Backoffice ni Contabilidad.
- **AC-02**: DADO que soy GERENTE en un establecimiento con M1+M2 CUANDO abro la aplicación ENTONCES veo: Sala, KDS Cocina, KDS Barra, Caja, Backoffice (Catálogo, Empleados, Compras, Inventario). No veo Contabilidad (módulo M3 no contratado).
- **AC-03**: DADO que el establecimiento activa M3 CUANDO el GERENTE refresca la aplicación ENTONCES aparece la sección Contabilidad en el menú sin necesidad de reinstalar nada.
- **AC-04**: DADO que intento acceder manualmente a una URL de un módulo no contratado (ej: `/contabilidad/fiscal` sin M3) ENTONCES el sistema muestra "Este módulo no está incluido en tu plan. Contacta con soporte para ampliar tu suscripción."
- **AC-05**: DADO que intento acceder a una URL para la que no tengo permisos de rol (ej: CAMARERO a `/caja`) ENTONCES el sistema devuelve pantalla de acceso denegado y registra el intento (no el contenido).

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Políticas | POL-074 (visibilidad según rol y módulos) |

---

## HU-M0-ROL-005 | Perfil Combinado Personalizado | Should

**COMO** ADMINISTRADOR  
**QUIERO** crear un perfil combinado con permisos de varios roles  
**PARA** adaptarme a los casos reales de mi negocio (ej: el mismo empleado sirve, cobra y hace pedidos).

**Criterios de aceptación:**

- **AC-01**: DADO que creo un perfil combinado CUANDO selecciono los permisos individuales de una lista ENTONCES puedo nombrar el perfil (ej: "Camarero-Cajero") y asignárselo a uno o varios empleados.
- **AC-02**: DADO que un empleado tiene perfil "Camarero-Cajero" ENTONCES puede gestionar mesas, tomar comandas Y cobrar, pero no accede a backoffice.
- **AC-03**: Un perfil combinado no puede conceder permisos de ADMIN puro (gestión de configuración del sistema, series de facturación, parámetros fiscales). Esos permisos solo se otorgan con el rol ADMIN explícito.
- **AC-04**: DADO que edito un perfil combinado ya asignado a empleados CUANDO guardo los cambios ENTONCES los empleados con ese perfil ven el efecto en su próximo login.

**Perfiles combinados predefinidos que aparecen listos para usar:**
- Camarero-Cajero (mesas + cobro)
- Gerente-Admin (todo operativo + configuración)
- Cocinero-Almacén (KDS + lectura de stock)
