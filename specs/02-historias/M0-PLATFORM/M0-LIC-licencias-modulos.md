# M0-LIC — Historias de Usuario: Licencias y Módulos

> **Módulo**: M0-PLATFORM  
> **Ámbito**: LIC — Gestión de licencias y módulos contratados  
> **Última revisión**: 2026-03-15

---

## HU-M0-LIC-001 | Activación de Módulo Adicional | Must

**COMO** ADMINISTRADOR del establecimiento  
**QUIERO** poder activar un nuevo módulo desde el panel de configuración  
**PARA** ampliar las funcionalidades del sistema cuando el negocio lo requiera, sin migraciones ni interrupciones.

**Criterios de aceptación:**

- **AC-01**: DADO que estoy en Configuración > Módulos y Licencias CUANDO veo un módulo no contratado ENTONCES aparece con estado "No activado" y un botón "Ampliar plan" que abre el flujo de contratación.
- **AC-02**: DADO que la contratación del nuevo módulo se confirma CUANDO el pago se procesa ENTONCES en menos de 5 minutos el módulo queda activo, aparece en el menú de todos los empleados con los permisos que corresponden a su rol, y el ADMIN recibe un email de confirmación.
- **AC-03**: DADO que activo M2 (ERP) ENTONCES el sistema realiza una migración de datos inicial automática: crea el almacén por defecto "Almacén Principal" asociado al establecimiento.
- **AC-04**: DADO que activo M3 (Contabilidad) ENTONCES el sistema crea automáticamente el plan de cuentas PGC pymes base y solicita confirmar el ejercicio fiscal de inicio.
- **AC-05**: La activación de un módulo **nunca borra datos existentes** aunque el módulo se active, desactive y reactive.

---

## HU-M0-LIC-002 | Bloqueo de Funcionalidades por Módulo No Contratado | Must

**COMO** plataforma GastroFlow  
**QUIERO** que las funcionalidades de módulos no contratados sean completamente inaccesibles  
**PARA** respetar el modelo de negocio y proteger la integridad del sistema.

**Criterios de aceptación:**

- **AC-01**: DADO que el establecimiento tiene solo M1 activo CUANDO cualquier empleado intenta acceder a una URL de M2, M3 o M4 ENTONCES recibe una pantalla de "Módulo no disponible en tu plan" con enlace a información de precios.
- **AC-02**: Las rutas de módulos no contratados devuelven HTTP 403 en el backend, independientemente de que el frontend esté bien configurado. La seguridad no depende solo del menú visual.
- **AC-03**: DADO que M2 no está activo CUANDO se realiza un cobro (M1) ENTONCES el stock NO se descuenta (esa lógica pertenece a M2). El cobro funciona correctamente sin M2.
- **AC-04**: DADO que M3 no está activo CUANDO se registra un cobro ENTONCES los asientos contables NO se generan. Al activar M3 posteriormente, existe una opción de "Regenerar asientos históricos desde fecha X".

---

## HU-M0-LIC-003 | Panel de Licencias y Estado de Suscripción | Should

**COMO** ADMINISTRADOR  
**QUIERO** ver el estado de mi suscripción y los módulos activos en un solo lugar  
**PARA** tener control total sobre lo que tengo contratado y cuándo vence.

**Criterios de aceptación:**

- **AC-01**: DADO que abro Configuración > Módulos y Licencias ENTONCES veo: módulos activos (con fecha de activación), módulos no contratados (con descripción y precio), fecha de renovación de la suscripción, y plan actual.
- **AC-02**: DADO que mi suscripción vence en 7 días ENTONCES aparece un banner amarillo en el dashboard para el ADMIN: "Tu suscripción vence el [fecha]. Renueva para evitar interrupciones."
- **AC-03**: DADO que mi suscripción vence y no se renueva ENTONCES el sistema pasa a modo "solo lectura" durante 30 días (pueden verse los datos, no operar). Pasados 30 días el acceso queda bloqueado pero los datos se conservan 90 días adicionales.
- **AC-04**: DADO que exporto el histórico de facturación ENTONCES se descarga un PDF/CSV con todas las facturas de la suscripción, compatible con la documentación contable.
