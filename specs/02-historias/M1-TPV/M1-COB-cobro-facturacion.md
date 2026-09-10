# M1-COB — Historias de Usuario: Cobro y Facturación

> **Módulo**: M1-TPV  
> **Ámbito**: COB — Cobro, Facturación y VeriFactu  
> **Agente responsable**: AG-001 (AgenteTPV)  
> **Estado**: Implementado (iteración 1) — HU-007 pendiente  
> **Última revisión**: 2026-03-14

---

## HU-M1-COB-001 | Cobrar mesa | Must

**COMO** camarero  
**QUIERO** cobrar una mesa  
**PARA** cerrar el servicio y liberar la mesa.

**Criterios de aceptación:**

- **AC-01**: DADO que Mesa 7 tiene cuenta de 87,50€ CUANDO cobro en efectivo con 100€ ENTONCES el sistema calcula cambio 12,50€, genera ticket, y la mesa pasa a "libre".
- **AC-02**: DADO que cobro con tarjeta CUANDO paso la tarjeta ENTONCES se registra como pago tarjeta y se genera ticket.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-001 a RN-003 (IVA), RN-010 (simplificada), RN-011 (contenido ticket) |
| Invariantes | INV-002 (integridad total), INV-014 (cobro cubre total) |
| Contratos | OP-004 (CobrarMesa: PRE cuenta calculada + formas pago ≥ total) |
| Skills | SK-005 (cobrar_servicio), SK-006 (emitir_ticket_verifactu) |
| Eventos | EVT-004 (TicketEmitido) |

**Estado implementación:**
- Backend: `CobroService.cobrarServicio()` → `POST /cobros/servicio/:servicioId`
- Frontend: `CobroPage.tsx` — resumen cuenta + selector pago + numpad + confirmación

---

## HU-M1-COB-002 | Dividir cuenta | Must

**COMO** camarero  
**QUIERO** dividir la cuenta de una mesa  
**PARA** que cada comensal pague lo suyo.

**Criterios de aceptación:**

- **AC-01**: DADO que Mesa 7 tiene 4 comensales y cuenta de 80€ CUANDO divido a partes iguales ENTONCES se generan 4 tickets de 20€ cada uno.
- **AC-02**: DADO que divido por productos CUANDO asigno las cervezas a Comensal 1 y la comida a Comensal 2 ENTONCES cada ticket tiene solo los productos asignados con su IVA correcto.
- **AC-03**: DADO que divido la cuenta CUANDO un producto tiene IVA 10% y otro 21% ENTONCES cada ticket parcial calcula su IVA correctamente según los productos que contiene.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-003 (multi-IVA en ticket) |
| Invariantes | INV-013 (Σ tickets parciales = total original) |
| Skills | SK-004 (dividir_cuenta) |

**Estado implementación:**
- Backend: `ComandaService.dividirCuenta()` → `POST /comandas/servicio/:id/dividir`

---

## HU-M1-COB-003 | Pago mixto | Must

**COMO** camarero  
**QUIERO** cobrar con pago mixto  
**PARA** cuando el cliente paga parte en efectivo y parte en tarjeta.

**Criterios de aceptación:**

- **AC-01**: DADO que la cuenta es 50€ CUANDO el cliente paga 20€ en efectivo y 30€ con tarjeta ENTONCES se registran ambas formas de pago y se genera un solo ticket por 50€.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Invariantes | INV-014 (Σ pagos ≥ total) |
| Contratos | OP-004 |
| Skills | SK-005 |

**Estado implementación:**
- Backend: Soportado (array `formasPago[]` admite múltiples entradas)
- Frontend: `CobroPage.tsx` — selector permite múltiples formas de pago

---

## HU-M1-COB-004 | Factura completa | Must

**COMO** cliente  
**QUIERO** pedir factura completa con mis datos fiscales  
**PARA** deducirme el gasto.

**Criterios de aceptación:**

- **AC-01**: DADO que el cliente proporciona su NIF y razón social CUANDO se emite la factura ENTONCES se genera factura completa (no simplificada) con todos los datos fiscales, desglose de IVA y numeración secuencial de serie de facturas completas.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-012 (contenido factura completa), RN-013 (serie diferenciada) |
| Invariantes | INV-001 (secuencialidad) |
| Skills | SK-007 (emitir_factura_completa) |
| Eventos | EVT-005 (FacturaCompletaEmitida) |

**Estado implementación:**
- Backend: `CobroService.emitirFacturaCompleta()` → `POST /cobros/factura-completa`

---

## HU-M1-COB-005 | Descuentos e invitaciones | Should

**COMO** propietario  
**QUIERO** aplicar descuentos o invitaciones  
**PARA** gestionar cortesías a clientes especiales.

**Criterios de aceptación:**

- **AC-01**: DADO que quiero invitar a un café de 1,50€ CUANDO aplico "invitación" sobre esa línea ENTONCES el importe se descuenta de la cuenta pero se registra contablemente como gasto de representación.
- **AC-02**: DADO que aplico un descuento del 10% a la cuenta CUANDO cobro ENTONCES el ticket refleja el descuento y la base imponible se recalcula.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-002 (recálculo base imponible) |

**Estado implementación:** No implementado (backlog iteración 2)

---

## HU-M1-COB-006 | Ticket VeriFactu | Must

**COMO** camarero/cajero  
**QUIERO** que cada ticket cumpla con VeriFactu  
**PARA** cumplir la normativa.

**Criterios de aceptación:**

- **AC-01**: DADO que cobro y se genera un ticket CUANDO el sistema lo registra ENTONCES incluye el hash encadenado con el ticket anterior, es inalterable y queda trazado en el registro VeriFactu.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-015 a RN-017 (VeriFactu) |
| Invariantes | INV-007 (inalterabilidad), INV-008 (cadena hash) |
| Skills | SK-006 (emitir_ticket_verifactu) |

**Estado implementación:**
- Backend: `VeriFactuService` — SHA-256 hash chain en `RegistroVeriFactu`

---

## HU-M1-COB-007 | Compartir ticket / Imprimir factura | Should

**COMO** camarero  
**QUIERO** enviar el ticket al cliente por WhatsApp o imprimirlo en papel  
**PARA** que el cliente tenga su comprobante en el formato que prefiera.

**Criterios de aceptación:**

- **AC-01**: DADO que acabo de cobrar una mesa CUANDO pulso «Enviar por WhatsApp» ENTONCES se abre WhatsApp con el ticket formateado (número, fecha, detalle de líneas, base imponible, IVA y total) listo para enviar al número del cliente.
- **AC-02**: DADO que el cliente pide comprobante en papel CUANDO pulso «Imprimir» ENTONCES se genera un documento HTML con diseño de factura y se lanza `window.print()` directamente desde el navegador.
- **AC-03**: DADO que el cliente tiene cuenta registrada (id_cliente asignado al cobro) CUANDO se emite el ticket ENTONCES el ticket queda vinculado a su historial de consumo y se acumulan puntos automáticamente (POL-030), sin necesidad de acción adicional del camarero.
- **AC-04**: DADO que el cliente NO tiene cuenta registrada CUANDO se cobra ENTONCES el sistema sugiere al camarero invitarle a registrarse para acumular puntos, pero permite continuar sin registro.

**Notas de UX:**
- Los botones «WhatsApp» e «Imprimir» aparecen en la pantalla de confirmación de cobro (`CobroPage.tsx`) inmediatamente después de cobrar.
- Si el cliente tiene `telefono` en su ficha, el link de WhatsApp usa `https://wa.me/{telefono}?text=...` en lugar del genérico sin destinatario.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-011 (contenido mínimo ticket simplificado), RN-012 (factura completa si solicitada) |
| Invariantes | INV-001 (secuencialidad ticket), INV-002 (integridad total) |
| Políticas | POL-030 (acumulación de puntos si cliente registrado) |
| Skills | SK-006 (emitir_ticket_verifactu), SK-073 (compartir_ticket — nuevo) |
| Eventos | EVT-004 (TicketEmitido), EVT-051 (PuntosAcumulados si cliente registrado) |
| Cross-ref | HU-M4-FID-005 (vinculación automática ticket → cuenta cliente) |

**Implementación frontend:**
- `renderInvoiceText(invoice)` → `buildWhatsAppLink(invoice)` — `src/utils/invoiceGen.ts`
- `renderInvoiceHTML(invoice, customer)` → Blob URL en `<iframe>` + `window.print()` — `src/utils/invoiceGen.ts`

**Estado implementación:** Utilidades implementadas (`invoiceGen.ts`). Integración en `CobroPage.tsx` pendiente (backlog iteración 2).

---

## HU-M1-COB-008 | Historial de facturas del turno de caja | Must

**COMO** cajero o propietario  
**QUIERO** ver el listado de todas las facturas/tickets emitidos en el turno actual de caja  
**PARA** conocer en tiempo real el estado fiscal y contable de cada operación del día.

**Criterios de aceptación:**

- **AC-01**: DADO que estoy en el turno de caja CUANDO abro la sección «Facturas del día» ENTONCES veo una tabla con todos los tickets/facturas del turno ordenados por hora descendente, mostrando: número (código completo), hora, mesa/barra, cliente (nombre o "Anónimo"), total (€), forma de pago, y **estado del ciclo de vida**.
- **AC-02**: DADO que una factura tiene todos sus estados completos CUANDO la visualizo en la lista ENTONCES aparece con indicador visual (badge verde «Completo»). Si falta el asiento, badge amarillo «Pendiente contable». Si falta VeriFactu, badge rojo «Error fiscal».
- **AC-03**: DADO que pulso sobre una fila ENTONCES se expande un panel de detalle con: desglose de IVA por tipo, cobros registrados, número de asiento contable vinculado, estado VeriFactu (hash parcial), y botones de acción (imprimir, WhatsApp, generar factura completa si es ticket simplificado).
- **AC-04**: DADO que el día tiene más de 100 tickets ENTONCES la lista pagina a 50 por pantalla con controles de navegación.
- **AC-05**: DADO que el turno está abierto CUANDO se cobra una nueva mesa ENTONCES el nuevo ticket aparece en la lista automáticamente sin necesidad de recargar la página (actualización en tiempo real o refresco automático cada 30s).

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-014 (numeración secuencial), RN-018 (conservación 6 años) |
| Invariantes | INV-001 (secuencialidad), INV-009 (trazabilidad ticket→asiento) |
| Políticas | POL-075 (log de auditoría — quien consulta el historial queda registrado) |
| Skills | SK-031 (consultar_balance), SK-042 (libro_registro) |
| Eventos | EVT-033 (AsientoVinculadoATicket) |
| Cross-ref | HU-M1-CAJ-002 (arqueo), HU-M3-IMP-003 (libro registro IVA) |

**Estado implementación:**
- Backend: `GET /cobros/tickets?cajaId=&fecha=` — `CobroController`
- Frontend: `FacturasPage.tsx` — ruta `/caja/facturas`

---

## HU-M1-COB-009 | Ciclo de vida de la factura | Must

**COMO** sistema GastroFlow (fiscal compliance)  
**QUIERO** que toda factura/ticket pase por estados auditables y trazables  
**PARA** garantizar la integridad fiscal, contable y legal de cada operación ante cualquier inspección de Hacienda.

**Estados del ciclo de vida:**

```
EMITIDA → ASIENTO_GENERADO → LIBRO_IVA_REGISTRADO → VERIFACTU_FIRMADA → CONSERVADA
```

- **EMITIDA**: El ticket/factura existe en BD con número secuencial (INV-001). Aún no hay asiento.
- **ASIENTO_GENERADO**: El asiento contable de doble partida ha sido creado y vinculado (INV-009). El campo `asientoContableId` en `Ticket` ya no es `null`.
- **LIBRO_IVA_REGISTRADO**: El registro aparece en `LibroRegistroEmitida` (INV-032). La base imponible y cuotas de IVA están capitalizadas para el 303.
- **VERIFACTU_FIRMADA**: El registro `RegistroVeriFactu` con hash SHA-256 encadenado existe y es válido (INV-007, INV-008).
- **CONSERVADA**: Todos los estados anteriores completados. La factura está en modo solo-lectura, conservable >6 años (RN-018).

**Criterios de aceptación:**

- **AC-01**: DADO que se cobra un servicio (OP-004 OK) CUANDO la transacción completa ENTONCES el ticket tiene estado **VERIFACTU_FIRMADA** al finalizar (los pasos EMITIDA → ASIENTO_GENERADO → LIBRO_IVA_REGISTRADO → VERIFACTU_FIRMADA ocurren dentro de la misma transacción atómica y/o su cascada síncrona de eventos).
- **AC-02**: DADO que la transacción de cobro termina CUANDO consulto el ticket ENTONCES `asientoContableId` **nunca es null** — si ocurre algún error en la generación del asiento, toda la transacción de cobro se revierte (INV-009).
- **AC-03**: DADO que existe un ticket con `asientoContableId = null` (dato corrupto o migración) CUANDO el sistema arranca o se ejecuta el proceso de saneamiento ENTONCES se genera automáticamente el asiento contable retroactivo y se vincula, registrando la incidencia en el log de auditoría.
- **AC-04**: DADO que el estado es CONSERVADA ENTONCES el ticket no puede ser borrado por ninguna operación del sistema. Solo puede tener una factura rectificativa (RN-016, INV-007).
- **AC-05**: DADO que una factura está en estado VERIFACTU_FIRMADA o CONSERVADA CUANDO el usuario intenta recobrar la misma mesa/servicio ENTONCES el sistema rechaza la operación con error OP-004 (servicio ya cerrado).

**Notas fiscales:**  
> Como experto en compliance fiscal, el ciclo de vida EMITIDA→CONSERVADA es la garantía frente a la AEAT de que ningún registro fue alterado, borrado o generado a posteriori. INV-007 y la cadena de hash VeriFactu son la columna vertebral de esta defensa. `ticket.asientoContableId` no puede quedar null bajo ningún concepto: es la única forma de demostrar que la factura tiene reflejo contable real en el ejercicio correspondiente.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-017 (VeriFactu inalterabilidad), RN-018 (conservación 6 años) |
| Invariantes | INV-001, INV-007, INV-008, INV-009 (nueva), INV-030, INV-032 |
| Contratos | OP-004 (CobrarMesa: POST incluye asiento vinculado), OP-030 (GenerarAsientoVenta) |
| Skills | SK-006 (emitir_ticket_verifactu), SK-030 (generar_asiento_automatico) |
| Eventos | EVT-004 (TicketEmitido), EVT-030 (AsientoContableCreado), EVT-033 (AsientoVinculadoATicket) |

**Estado implementación:**
- `AsientoService.onTicketEmitido()` ya genera el asiento; fix pendiente: vincular `ticket.asientoContableId`
- La propiedad computed `estadoCicloVida` se calcula en el controller/service al retornar el ticket
