# M4-FID — Historias de Usuario: Fidelización

> **Módulo**: M4-CRM  
> **Ámbito**: FID — Puntos, canjeos, niveles, historial de cliente  
> **Agente responsable**: AG-006 (AgenteCRM)  
> **Estado**: No implementado (backlog)  
> **Última revisión**: 2026-03-14  
> **HUs**: FID-001 a FID-005

---

## HU-M4-FID-001 | Acumular puntos | Must

**COMO** cliente  
**QUIERO** acumular puntos por mis consumiciones  
**PARA** obtener recompensas.

**Criterios de aceptación:**

- **AC-01**: DADO que soy cliente registrado y mi ticket es de 45€ CUANDO se cobra ENTONCES obtengo 45 puntos (1 punto/€) y mi saldo se actualiza.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-065 (ratio puntos configurable: por defecto 1 punto/€) |
| Skills | SK-065 (acumular_puntos_fidelizacion) |
| Eventos | EVT-004 (TicketEmitido → trigger puntos) |

**Estado implementación:** No implementado

---

## HU-M4-FID-002 | Canjear puntos | Should

**COMO** cliente  
**QUIERO** canjear mis puntos por descuentos  
**PARA** que mi fidelidad tenga recompensa.

**Criterios de aceptación:**

- **AC-01**: DADO que tengo 200 puntos CUANDO canjeo 100 puntos ENTONCES obtengo 5€ de descuento en mi próxima visita.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-066 (ratio canje configurable: por defecto 100 puntos = 5€) |
| Skills | SK-066 (canjear_puntos) |

**Estado implementación:** No implementado

---

## HU-M4-FID-003 | Niveles de fidelización | Should

**COMO** propietario  
**QUIERO** configurar niveles de fidelización  
**PARA** premiar a los mejores clientes.

**Criterios de aceptación:**

- **AC-01**: DADO que defino: Bronce (0-499 puntos, sin beneficio extra), Plata (500-1499, 5% dto), Oro (1500+, 10% dto + invitación cumpleaños) CUANDO un cliente llega a 500 puntos ENTONCES sube a Plata automáticamente.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-067 (niveles configurables con umbrales) |
| Skills | SK-067 (evaluar_nivel_fidelizacion) |
| Eventos | EVT-025 (NivelFidelizacionCambiado) |

**Estado implementación:** No implementado

---

## HU-M4-FID-004 | Historial de consumo de cliente | Must

**COMO** propietario  
**QUIERO** ver el historial de consumo de un cliente  
**PARA** conocer sus preferencias.

**Criterios de aceptación:**

- **AC-01**: DADO que consulto la ficha de María García CUANDO abro su historial ENTONCES veo: visitas totales, gasto medio, productos más pedidos, último día de visita, nivel de fidelización, puntos acumulados.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Skills | SK-068 (consultar_historial_cliente) |

**Estado implementación:** No implementado

---

## HU-M4-FID-005 | Ticket vinculado a cuenta de cliente | Must

**COMO** cliente registrado  
**QUIERO** que cada vez que consuma en el restaurante el ticket quede vinculado a mi cuenta automáticamente  
**PARA** ver mi historial completo, acumular puntos y recibir mi comprobante sin tener que pedirlo.

**Criterios de aceptación:**

- **AC-01**: DADO que soy cliente registrado y el camarero me identifica al cobrar (busca mi ficha por nombre o teléfono) CUANDO se emite el ticket ENTONCES el ticket aparece en mi historial de consumo con fecha, importe y detalle de líneas.
- **AC-02**: DADO que el ticket queda vinculado a mi cuenta CUANDO acabo de cobrar ENTONCES los puntos se acumulan automáticamente según POL-030 (1 punto/€) y se dispara EVT-051.
- **AC-03**: DADO que tengo teléfono registrado en mi ficha CUANDO se genera el ticket ENTONCES el link de WhatsApp usa mi número como destinatario (`wa.me/{telefono}`) en lugar del genérico, sin que el camarero tenga que teclearlo.
- **AC-04**: DADO que el cliente no está identificado al inicio del servicio CUANDO llega el momento de cobrar ENTONCES el camarero puede buscar y asignar el cliente antes de cobrar, y los puntos se asignan igualmente.
- **AC-05**: DADO que el cliente pide ver sus tickets anteriores CUANDO accede a su perfil (futuro portal web M4-CRM) ENTONCES ve el listado con fecha, importe, puntos ganados y enlace de descarga PDF.

**Notas de diseño:**
- La vinculación ocurre en el momento del cobro, no antes, para no bloquear el flujo del camarero.
- Si el cliente no está registrado, el cobro prosigue sin vinculación (degradación elegante).
- El historial visible para el propietario es HU-M4-FID-004; este historial es el del propio cliente.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-065 (ratio puntos), RN-070 (consentimiento LSSI para envío WhatsApp) |
| Invariantes | INV-050 (puntos ≥ 0), INV-053 (ticket vinculado a un único cliente) |
| Políticas | POL-030 (asignación puntos), POL-031 (subida de nivel) |
| Skills | SK-074 (identificar_cliente_al_cobrar — nuevo), SK-065 (acumular_puntos_fidelizacion) |
| Eventos | EVT-004 (TicketEmitido), EVT-051 (PuntosAcumulados) |
| Cross-ref | HU-M1-COB-007 (canales de entrega ticket), HU-M4-FID-001 (acumulación puntos), HU-M4-FID-004 (historial propietario) |

**Estado implementación:** No implementado (backlog iteración 2). Requiere campo `id_cliente` opcional en el payload de cobro y nueva skill SK-063.
