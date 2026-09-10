# M2-RRH — Historias de Usuario: Recursos Humanos

> **Módulo**: M2-ERP  
> **Ámbito**: RRH — Empleados, Turnos, Fichaje, Informes laborales  
> **Agente responsable**: AG-005 (AgenteRRHH)  
> **Estado**: No implementado (backlog)  
> **Última revisión**: 2026-03-14

---

## HU-M2-RRH-001 | Alta de empleados | Must

**COMO** propietario  
**QUIERO** dar de alta empleados con sus datos laborales  
**PARA** gestionar turnos y cumplir obligaciones.

**Criterios de aceptación:**

- **AC-01**: DADO que creo empleado "Juan Pérez", camarero, contrato indefinido, 40h/semana CUANDO guardo ENTONCES queda registrado con su categoría, tipo contrato y jornada.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-035 (datos obligatorios según normativa laboral) |

**Estado implementación:** No implementado

---

## HU-M2-RRH-002 | Cuadrantes de turnos | Must

**COMO** propietario  
**QUIERO** crear cuadrantes de turnos semanales  
**PARA** organizar al equipo.

**Criterios de aceptación:**

- **AC-01**: DADO que tengo 6 camareros CUANDO asigno turnos para la semana ENTONCES se genera cuadrante visible para todos y se detectan conflictos (misma persona en dos turnos simultáneos).

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Invariantes | INV-020 (un empleado no puede tener dos turnos solapados) |
| Skills | SK-030 (generar_cuadrante_semanal) |

**Estado implementación:** No implementado

---

## HU-M2-RRH-003 | Fichaje entrada/salida | Must

**COMO** empleado  
**QUIERO** fichar mi entrada y salida  
**PARA** cumplir la ley de registro de jornada.

**Criterios de aceptación:**

- **AC-01**: DADO que Juan empieza su turno CUANDO ficha entrada a las 17:58 ENTONCES queda registrado con hora exacta.
- **AC-02**: DADO que Juan termina CUANDO ficha salida a las 02:03 ENTONCES se calcula horas trabajadas (8h 05min) y se registra.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-036 (RD 8/2019 registro jornada obligatorio) |
| Eventos | EVT-014 (FichajeRegistrado) |

**Estado implementación:** No implementado

---

## HU-M2-RRH-004 | Informe de horas y extras | Should

**COMO** propietario  
**QUIERO** ver un informe de horas trabajadas y extras  
**PARA** controlar costes laborales.

**Criterios de aceptación:**

- **AC-01**: DADO que quiero ver las horas de marzo CUANDO genero el informe ENTONCES muestra por empleado: horas ordinarias, horas extra, ausencias y total.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Skills | SK-031 (generar_informe_horas) |

**Estado implementación:** No implementado
