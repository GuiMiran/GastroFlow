# AG-007 — AgenteCRM (Agente de Relación con Cliente)

> **Código**: AG-007  
> **Módulo principal**: M4-CRM  
> **Estado**: No implementado (backlog)  
> **Última revisión**: 2026-03-14

---

## Responsabilidad

Gestionar la relación con el cliente — reservas, fidelización, comunicaciones, carta digital.

---

## Skills que usa

| Skill | Nombre | Descripción |
|-------|--------|-------------|
| SK-060 | crear_reserva | Crea reserva online con confirmación |
| SK-061 | cancelar_reserva | Cancela reserva y libera mesa |
| SK-062 | detectar_noshow | Detecta reservas no cumplidas |
| SK-063 | acumular_puntos_fidelizacion | Suma puntos por ticket cobrado |
| SK-064 | canjear_puntos | Aplica descuento por canje de puntos |
| SK-065 | evaluar_subida_nivel | Evalúa si cliente sube nivel (Bronce→Plata→Oro) |
| SK-066 | enviar_comunicacion_personalizada | Envía promo/recordatorio segmentado |
| SK-067 | generar_carta_digital | Genera carta web con alérgenos |
| SK-068 | gestionar_consentimientos | Gestiona opt-in/opt-out RGPD/LSSI |
| SK-074 | identificar_cliente_al_cobrar | Asocia cliente a servicio en el momento del cobro |

---

## Eventos que escucha

| Evento | Reacción |
|--------|----------|
| EVT-004 (TicketEmitido) | Acumula puntos al cliente identificado |
| EVT-001 (MesaAbierta) | Marca reserva como "cumplida" si aplica |

---

## Eventos que produce

| Evento | Cuándo |
|--------|--------|
| EVT-050 (ClienteRegistrado) | Al dar de alta nuevo cliente |
| EVT-051 (PuntosAcumulados) | Al sumar puntos tras cobro |
| EVT-052 (ReservaCreada) | Al confirmar nueva reserva |
| EVT-053 (ReservaCancelada) | Al cancelar reserva |
| EVT-054 (NoShowDetectado) | Al detectar reserva no cumplida |

---

## Invariantes que respeta

| Invariante | Descripción |
|-----------|-------------|
| INV-050 | Puntos fidelización ≥ 0 |
| INV-051 | Canjeo ≤ saldo de puntos |
| INV-052 | Consentimiento activo antes de cualquier comunicación |
| INV-053 | Ticket vinculado a un único cliente |

---

## Reglas de negocio clave

| Reglas | Dominio |
|--------|---------|
| RN-060 a RN-063 | Protección de datos (RGPD/LSSI) |
| RN-070 | Alérgenos en carta digital |

---

## Historias de usuario asociadas

Ámbitos: RES, FID, CMP → ver `specs/02-historias/M4-CRM/`
