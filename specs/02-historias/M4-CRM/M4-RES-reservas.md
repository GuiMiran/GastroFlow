# M4-RES — Historias de Usuario: Reservas

> **Módulo**: M4-CRM  
> **Ámbito**: RES — Reservas online, mapa de mesas, reglas, recordatorios  
> **Agente responsable**: AG-006 (AgenteCRM)  
> **Estado**: No implementado (backlog)  
> **Última revisión**: 2026-03-14

---

## HU-M4-RES-001 | Reserva online | Must

**COMO** cliente  
**QUIERO** reservar una mesa online  
**PARA** asegurar mi sitio sin llamar por teléfono.

**Criterios de aceptación:**

- **AC-01**: DADO que la web muestra disponibilidad para el viernes 21:00 CUANDO selecciono 4 personas y confirmo ENTONCES recibo confirmación por email/SMS y la reserva aparece en el sistema del restaurante.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Skills | SK-060 (crear_reserva_online) |
| Eventos | EVT-020 (ReservaCreada) |

**Estado implementación:** No implementado

---

## HU-M4-RES-002 | Reservas en mapa de mesas | Must

**COMO** camarero  
**QUIERO** ver las reservas del día en el mapa de mesas  
**PARA** saber qué mesas están reservadas y a qué hora.

**Criterios de aceptación:**

- **AC-01**: DADO que hay 3 reservas para hoy CUANDO veo el mapa de mesas ENTONCES las mesas reservadas aparecen marcadas con la hora y nombre del cliente.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Skills | SK-061 (visualizar_reservas_mapa) |

**Estado implementación:** No implementado

---

## HU-M4-RES-003 | Reglas de reservas | Should

**COMO** propietario  
**QUIERO** configurar las reglas de reservas  
**PARA** gestionar la capacidad (antelación mínima/máxima, duración estimada, límite de comensales).

**Criterios de aceptación:**

- **AC-01**: DADO que configuro "reservas con mínimo 2h de antelación" y "duración estimada 2h" CUANDO un cliente intenta reservar para dentro de 30min ENTONCES no le deja.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-060 (validaciones reglas de reserva configurables) |

**Estado implementación:** No implementado

---

## HU-M4-RES-004 | Recordatorio automático de reserva | Should

**COMO** propietario  
**QUIERO** enviar recordatorio automático de reserva  
**PARA** reducir no-shows.

**Criterios de aceptación:**

- **AC-01**: DADO que hay reserva para mañana a las 21:00 CUANDO son las 12:00 de hoy ENTONCES se envía SMS/email al cliente: "Recordatorio: tu reserva en La Esquina mañana a las 21:00 para 4 personas. ¿Confirmas?".

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Skills | SK-062 (enviar_recordatorio_reserva) |
| Eventos | EVT-021 (RecordatorioReservaEnviado) |

**Estado implementación:** No implementado
