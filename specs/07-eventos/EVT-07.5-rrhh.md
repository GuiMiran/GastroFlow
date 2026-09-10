# 07.5 — Eventos de RRHH

> **Sección**: 07.5 de Capa 07 — Eventos de Dominio  
> **Dominio**: Recursos Humanos  
> **Total eventos**: 2 (EVT-040 a EVT-041)  
> **Agentes productores**: AG-006 AgenteRRHH  
> **Fecha**: 2026-03-14

---

**EVT-040: EmpleadoFicho**  
- Ocurre cuando: Un empleado registra su entrada o salida.
- Datos del evento: id_empleado, tipo(entrada|salida), hora, id_establecimiento.
- DISPARA:
  1. Registrar en log de fichajes.
  2. Si es salida → calcular horas trabajadas de la jornada.
  3. Si horas > jornada_diaria → registrar como horas extra.
  4. Si horas_extra_acumuladas se acerca a 80 → alerta.

**EVT-041: ConflictoTurnoDetectado**  
- Ocurre cuando: Se intenta asignar un turno que viola reglas laborales.
- Datos del evento: id_empleado, turno_propuesto, motivo(solape|descanso_insuficiente|exceso_horas).
- DISPARA:
  1. Bloquear asignación.
  2. Informar al encargado del conflicto específico.

---

### Trazabilidad

| EVT | Agentes que escuchan | Skills disparados | HU relacionadas |
|-----|---------------------|-------------------|-----------------|
| EVT-040 | AG-006 | SK-051, SK-052 | HU-M2-RRH-003 |
| EVT-041 | AG-006 | SK-053 | HU-M2-RRH-002 |
