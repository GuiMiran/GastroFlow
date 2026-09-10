# 07.6 — Eventos de CRM

> **Sección**: 07.6 de Capa 07 — Eventos de Dominio  
> **Dominio**: CRM / Fidelización / Reservas  
> **Total eventos**: 5 (EVT-050 a EVT-054)  
> **Agentes productores**: AG-007 AgenteCRM  
> **Fecha**: 2026-03-14

---

**EVT-050: ClienteRegistrado**  
- Ocurre cuando: Un nuevo cliente se registra (web o en local).
- Datos del evento: id_cliente, nombre, email, telefono, consentimiento_comercial, canal_registro.
- DISPARA:
  1. Crear ficha de cliente con nivel Bronce y 0 puntos.
  2. Si dio consentimiento → enviar email de bienvenida.

**EVT-051: PuntosAcumulados**  
- Ocurre cuando: Un cliente registrado acumula puntos tras un cobro.
- Datos del evento: id_cliente, puntos_nuevos, saldo_total, id_ticket.
- DISPARA:
  1. Verificar si el cliente sube de nivel (POL-031).
  2. Si sube de nivel → notificar al cliente con beneficios desbloqueados.

**EVT-052: ReservaCreada**  
- Ocurre cuando: Un cliente crea una reserva (web o teléfono).
- Datos del evento: id_reserva, id_cliente(si registrado), fecha, hora, comensales, id_mesa(si asignada).
- DISPARA:
  1. Enviar confirmación al cliente (email/SMS).
  2. Marcar mesa como "reservada" para la franja.
  3. Programar recordatorio automático (24h antes).

**EVT-053: ReservaCancelada**  
- Ocurre cuando: Se cancela una reserva.
- Datos del evento: id_reserva, motivo, cancelado_por(cliente|establecimiento).
- DISPARA:
  1. Liberar mesa reservada.
  2. Enviar confirmación de cancelación.

**EVT-054: NoShowDetectado**  
- Ocurre cuando: Un cliente no aparece a su reserva tras el margen de espera.
- Datos del evento: id_reserva, id_cliente, hora_limite.
- DISPARA:
  1. Marcar reserva como "no-show".
  2. Liberar mesa.
  3. Registrar no-show en ficha de cliente (para detección de patrones).

---

### Trazabilidad

| EVT | Agentes que escuchan | Skills disparados | HU relacionadas |
|-----|---------------------|-------------------|-----------------|
| EVT-050 | AG-007 | SK-068 | HU-M4-FID-001 |
| EVT-051 | AG-007 | SK-063, SK-065 | HU-M4-FID-001 |
| EVT-052 | AG-007, AG-001 | SK-060 | HU-M4-RES-001 |
| EVT-053 | AG-007 | SK-061 | HU-M4-RES-001 |
| EVT-054 | AG-007 | SK-062 | HU-M4-RES-003 |
