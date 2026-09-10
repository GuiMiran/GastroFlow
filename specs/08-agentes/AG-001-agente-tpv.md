# AG-001 — AgenteTPV (Agente de Punto de Venta)

> **Código**: AG-001  
> **Módulo principal**: M1-TPV  
> **Estado**: Activo (iteración 1)  
> **Última revisión**: 2026-03-14

---

## Responsabilidad

Gestionar toda la operación de sala — mesas, comandas, cobros y facturación en tiempo real.

---

## Skills que usa

| Skill | Nombre | Descripción |
|-------|--------|-------------|
| SK-001 | abrir_mesa | Abre servicio en una mesa |
| SK-002 | tomar_comanda | Registra comanda con productos |
| SK-003 | calcular_cuenta | Calcula total con IVA |
| SK-004 | dividir_cuenta | Divide cuenta entre comensales |
| SK-005 | cobrar_servicio | Procesa cobro (efectivo/tarjeta/mixto) |
| SK-006 | emitir_ticket_verifactu | Genera ticket con hash VeriFactu |
| SK-007 | emitir_factura_completa | Genera factura con datos fiscales |
| SK-008 | emitir_factura_rectificativa | Genera factura de corrección |
| SK-009 | gestionar_arqueo_caja | Apertura/cierre turno y arqueo |
| SK-073 | compartir_ticket | Envía ticket por WhatsApp o lo imprime |

---

## Eventos que escucha

| Evento | Reacción |
|--------|----------|
| EVT-052 (ReservaCreada) | Marca mesas como reservadas en el mapa |
| EVT-053 (ReservaCancelada) | Libera mesas reservadas |

---

## Eventos que produce

| Evento | Cuándo |
|--------|--------|
| EVT-001 (MesaAbierta) | Al abrir un servicio en mesa |
| EVT-002 (ComandaRegistrada) | Al confirmar comanda |
| EVT-004 (TicketEmitido) | Al cobrar servicio |
| EVT-005 (FacturaCompletaEmitida) | Al emitir factura con datos fiscales |
| EVT-006 (FacturaRectificativaEmitida) | Al corregir factura |
| EVT-007 (LineaComandaAnulada) | Al anular línea de comanda |
| EVT-010 (TurnoCajaAbierto) | Al abrir turno de caja |
| EVT-011 (TurnoCajaCerrado) | Al cerrar turno con arqueo |

---

## Invariantes que respeta

| Invariante | Descripción |
|-----------|-------------|
| INV-001 | Secuencialidad de numeración |
| INV-002 | Integridad del total |
| INV-003 | Cuadre de IVA |
| INV-007 | Inalterabilidad VeriFactu |
| INV-008 | Cadena de hash |
| INV-010 | Estado de mesa coherente |
| INV-013 | División de cuenta cuadra |
| INV-014 | Cobro cubre total |
| INV-015 | Arqueo suma correcta |

---

## Reglas de negocio clave

| Reglas | Dominio |
|--------|---------|
| RN-001 a RN-003 | IVA hostelería |
| RN-010 a RN-017 | Facturación |
| RN-030 a RN-038 | Operativas TPV |

---

## Historias de usuario asociadas

Ámbitos: SAL, CMD, COB, CAJ → ver `specs/02-historias/M1-TPV/`
