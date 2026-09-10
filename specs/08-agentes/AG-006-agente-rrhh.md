# AG-006 — AgenteRRHH (Agente de Recursos Humanos)

> **Código**: AG-006  
> **Módulo principal**: M2-ERP (RRHH)  
> **Estado**: No implementado (backlog)  
> **Última revisión**: 2026-03-14

---

## Responsabilidad

Gestionar cuadrantes de turnos, fichajes, control de horas y cumplimiento laboral.

---

## Skills que usa

| Skill | Nombre | Descripción |
|-------|--------|-------------|
| SK-050 | crear_cuadrante_turnos | Genera cuadrante semanal con detección de conflictos |
| SK-051 | registrar_fichaje | Registra entrada/salida con hora exacta |
| SK-052 | calcular_horas_trabajadas | Calcula horas ordinarias y extras |
| SK-053 | detectar_conflicto_turno | Detecta solapamientos y descanso < 12h |
| SK-054 | generar_informe_horas | Informe mensual de horas por empleado |

---

## Eventos que escucha

| Evento | Reacción |
|--------|----------|
| (Fichajes) | Registra y calcula horas |
| (Asignaciones turno) | Verifica conflictos |

---

## Eventos que produce

| Evento | Cuándo |
|--------|--------|
| EVT-040 (EmpleadoFicho) | Al registrar fichaje de entrada/salida |
| EVT-041 (ConflictoTurnoDetectado) | Al detectar solapamiento o incumplimiento |

---

## Invariantes que respeta

| Invariante | Descripción |
|-----------|-------------|
| INV-040 | No turnos solapados para mismo empleado |
| INV-041 | 12h mínimo entre turnos (RD 8/2019) |
| INV-042 | 80h extra máximo anual |

---

## Reglas de negocio clave

| Reglas | Dominio |
|--------|---------|
| RN-050 a RN-054 | Reglas laborales |

---

## Historias de usuario asociadas

Ámbito: RRH → ver `specs/02-historias/M2-ERP/M2-RRH-recursos-humanos.md`
