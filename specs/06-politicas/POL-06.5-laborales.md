# 06.5 — Políticas Laborales

> **Sección**: 06.5 de Capa 06 — Políticas de Decisión  
> **Dominio**: Laboral  
> **Total políticas**: 2 (POL-040 a POL-041)  
> **Agentes**: AG-006 AgenteRRHH  
> **Fecha**: 2026-03-14

---

**POL-040: Detección de conflicto de turno**  
```
SI se asigna un turno a un empleado Y ya tiene otro turno cuya franja se solapa → Rechazar asignación e informar del conflicto.
SI_NO SI el descanso entre turnos es < 12 horas → Advertir del incumplimiento legal y requerir confirmación del encargado.
SI_NO → Asignar turno normalmente.
```
- Referencia: INV-040, INV-041, RN-053

**POL-041: Control de horas extra**  
```
SI las horas trabajadas del empleado en el mes superan su jornada mensual → Las horas excedentes se computan como horas extra.
SI horas_extra_acumuladas_año + nuevas_horas_extra > 80 → Alerta GRAVE: se superaría el máximo legal. No permite asignar más turnos.
```
- Referencia: INV-042, RN-052

---

### Trazabilidad

| POL | Skills que la aplican | Reglas | Invariantes | HU relacionadas |
|-----|-----------------------|--------|-------------|-----------------|
| POL-040 | SK-053 | RN-053 | INV-040, INV-041 | HU-M2-RRH-002 |
| POL-041 | SK-052 | RN-052 | INV-042 | HU-M2-RRH-002 |
