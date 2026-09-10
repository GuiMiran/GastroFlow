# 07.2 — Eventos de Caja

> **Sección**: 07.2 de Capa 07 — Eventos de Dominio  
> **Dominio**: Caja  
> **Total eventos**: 2 (EVT-010 a EVT-011)  
> **Agentes productores**: AG-001 AgenteTPV  
> **Fecha**: 2026-03-14

---

**EVT-010: TurnoCajaAbierto**  
- Ocurre cuando: Un cajero abre su turno con fondo de caja.
- Datos del evento: id_turno, id_caja, id_cajero, fondo_caja, hora_apertura.
- DISPARA:
  1. Caja operativa para cobros.

**EVT-011: TurnoCajaCerrado**  
- Ocurre cuando: Se completa el arqueo y se cierra el turno.
- Datos del evento: id_turno, id_caja, efectivo_esperado, efectivo_real, descuadre, total_ventas_turno, hora_cierre.
- DISPARA:
  1. Generar informe de turno.
  2. Si descuadre > umbral configurado → alerta al propietario.
  3. Caja queda libre para nuevo turno.

---

### Trazabilidad

| EVT | Agentes que escuchan | Skills disparados | HU relacionadas |
|-----|---------------------|-------------------|-----------------|
| EVT-010 | AG-001 | SK-009 | HU-M1-CAJ-001 |
| EVT-011 | AG-001 | SK-009 | HU-M1-CAJ-002 |
