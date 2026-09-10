# M4-CMP — Historias de Usuario: Comunicaciones y Promos

> **Módulo**: M4-CRM  
> **Ámbito**: CMP — Promociones, cumpleaños, carta digital, baja RGPD  
> **Agente responsable**: AG-006 (AgenteCRM)  
> **Estado**: No implementado (backlog)  
> **Última revisión**: 2026-03-14

---

## HU-M4-CMP-001 | Promociones personalizadas | Should

**COMO** propietario  
**QUIERO** enviar promociones personalizadas a clientes  
**PARA** aumentar la recurrencia.

**Criterios de aceptación:**

- **AC-01**: DADO que creo promo "2x1 en cócteles miércoles" para clientes que piden cócteles habitualmente CUANDO la envío ENTONCES se envía email/SMS solo a esos clientes y se respeta consentimiento LSSI.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-070 (consentimiento LSSI obligatorio para envíos comerciales) |
| Skills | SK-070 (enviar_promo_segmentada) |
| Eventos | EVT-030 (PromocionEnviada) |

**Estado implementación:** No implementado

---

## HU-M4-CMP-002 | Felicitación de cumpleaños | Could

**COMO** propietario  
**QUIERO** enviar felicitación y oferta de cumpleaños  
**PARA** generar experiencia personalizada.

**Criterios de aceptación:**

- **AC-01**: DADO que María cumple años el 15 de marzo CUANDO es 14 de marzo ENTONCES se envía automáticamente: "¡Feliz cumple, María! Te invitamos a un postre este viernes".

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Skills | SK-071 (enviar_felicitacion_cumpleanos) |

**Estado implementación:** No implementado

---

## HU-M4-CMP-003 | Carta digital | Should

**COMO** cliente  
**QUIERO** ver la carta digital del restaurante  
**PARA** consultar platos, precios y alérgenos antes de ir.

**Criterios de aceptación:**

- **AC-01**: DADO que accedo a la carta digital CUANDO la veo ENTONCES muestra categorías, productos con foto/descripción, precio con IVA incluido, iconos de alérgenos e indicación de disponibilidad.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-021 (alérgenos Reglamento 1169/2011) |

**Estado implementación:** No implementado

---

## HU-M4-CMP-004 | Baja de comunicaciones (RGPD/LSSI) | Must

**COMO** cliente  
**QUIERO** darme de baja de comunicaciones comerciales  
**PARA** ejercer mi derecho LSSI/RGPD.

**Criterios de aceptación:**

- **AC-01**: DADO que recibo un email de promo CUANDO pulso "darme de baja" ENTONCES inmediatamente dejo de recibir comunicaciones y mi consentimiento se revoca en el sistema.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-071 (RGPD: revocación inmediata de consentimiento), RN-072 (LSSI: no enviar tras baja) |
| Invariantes | INV-040 (consentimiento revocado → 0 envíos) |

**Estado implementación:** No implementado
