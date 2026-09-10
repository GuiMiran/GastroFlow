# M0-PLATFORM — Índice de Historias de Usuario

> **Módulo**: M0 — Plataforma, Configuración y Seguridad  
> **Descripción**: Historias transversales que afectan a todos los módulos. Incluyen el setup inicial del establecimiento, gestión de licencias, roles, empleados y auditoría. Son independientes del negocio hostelero y aplican a cualquier tenant de la plataforma.  
> **Total historias**: 12  
> **Implementadas**: 0 (pendiente — arquitectura de autenticación y RBAC)  
> **Última revisión**: 2026-03-15

---

## Ámbitos

| Ámbito | Código | Archivo | Historias | Must | Should | Could |
|--------|--------|---------|-----------|------|--------|-------|
| Setup y Onboarding | SET | [M0-SET-setup-onboarding.md](M0-SET-setup-onboarding.md) | 4 | 4 | 0 | 0 |
| Roles y Acceso | ROL | [M0-ROL-roles-acceso.md](M0-ROL-roles-acceso.md) | 5 | 4 | 1 | 0 |
| Licencias y Módulos | LIC | [M0-LIC-licencias-modulos.md](M0-LIC-licencias-modulos.md) | 3 | 2 | 1 | 0 |

---

## Correspondencia de códigos

| Código | Descripción |
|--------|-------------|
| HU-M0-SET-001 | Asistente de configuración inicial (wizard) |
| HU-M0-SET-002 | Pantalla de configuración permanente (Admin) |
| HU-M0-SET-003 | Gestión de zonas y mesas desde configuración |
| HU-M0-SET-004 | Auditoría de cambios en datos críticos |
| HU-M0-ROL-001 | Login con PIN rápido (sala/TPV) |
| HU-M0-ROL-002 | Login con email/password (backoffice) |
| HU-M0-ROL-003 | Gestión de empleados y asignación de roles |
| HU-M0-ROL-004 | Menú adaptado a rol y módulos activos |
| HU-M0-ROL-005 | Perfil combinado personalizado |
| HU-M0-LIC-001 | Activación de módulo adicional |
| HU-M0-LIC-002 | Bloqueo de funcionalidades por módulo no contratado |
| HU-M0-LIC-003 | Panel de licencias y estado de suscripción |

---

## Prioridad y secuencia de implementación

```
Iteración 3 (arquitectura base):
  1. HU-M0-ROL-001  ← PIN login (impacto inmediato en operativa de sala)
  2. HU-M0-ROL-003  ← Gestión de empleados/roles (prerequisito de todo lo demás)
  3. HU-M0-ROL-004  ← Menú dinámico (impacto visual inmediato)
  4. HU-M0-LIC-002  ← Bloqueo por módulo (protección del sistema)

Iteración 4:
  5. HU-M0-SET-001  ← Wizard onboarding completo
  6. HU-M0-SET-002  ← Panel de configuración admin
  7. HU-M0-ROL-002  ← Login email/password
  8. HU-M0-SET-004  ← Auditoría

Iteración 5:
  9. HU-M0-LIC-001  ← Activación de módulos
  10. HU-M0-LIC-003 ← Panel de licencias
  11. HU-M0-ROL-005 ← Perfiles combinados personalizados
  12. HU-M0-SET-003 ← Gestión avanzada de zonas/mesas
```

---

## Nota sobre impacto arquitectónico

> **⚠️ ATENCIÓN**: La implementación de este módulo requiere cambios en toda la arquitectura existente:
>
> 1. **Backend**: Añadir tabla `Empleado` con campos `rol` y `pinHash`. Añadir guard `@Roles()` en NestJS a todos los controladores. Añadir `AuthModule` con JWT y PIN.
> 2. **Frontend**: Añadir pantalla de login. Reemplazar `SetupPage` actual por flujo de autenticación. Construir menú dinámico basado en `modulosActivos` y `rolEmpleado`.
> 3. **Base de datos**: Añadir tabla `LicenciaModulo`, campo `rol` en `Empleado`, tabla `AuditLog`.
> 4. **Impacto en código existente**: El `establecimientoId` y `empleadoId` actualmente hardcodeados desde `SetupPage` pasarán a venir del token JWT. Esto afecta a **todos los servicios y controladores** del backend.
>
> **Recomendación**: Implementar en rama separada con migración de datos para no romper lo existente.
