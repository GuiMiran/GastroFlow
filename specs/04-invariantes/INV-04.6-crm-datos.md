# INV-04.6 — Invariantes de CRM / Datos

> **Sección**: 04.6  
> **Dominio**: Fidelización, consentimientos, RGPD  
> **Agentes relacionados**: AG-007 (CRM)  
> **Total invariantes**: 4 (INV-050 a INV-053)  
> **Última revisión**: 2026-03-14

---

## INV-050: Puntos de fidelización ≥ 0

El saldo de puntos de un cliente nunca puede ser negativo.

- **Historias**: HU-M4-FID-001, HU-M4-FID-002

---

## INV-051: Canjeo de puntos no excede saldo

No se pueden canjear más puntos de los que el cliente tiene acumulados.

`puntos_canjeados ≤ saldo_puntos_actual`

- **Historias**: HU-M4-FID-002

---

## INV-052: Consentimiento registrado antes de comunicación

No se envía ninguna comunicación comercial a un cliente sin que exista un registro previo de consentimiento activo.

- **Relacionado**: RN-062
- **Historias**: HU-M4-CMP-001, HU-M4-CMP-004

---

## INV-053: Ticket vinculado a un único cliente

Un ticket emitido no puede estar asociado a más de un cliente. Si el servicio no tenía cliente identificado en el momento del cobro, el ticket queda sin `id_cliente` (null). No se puede reasignar un ticket ya cobrado a otro cliente.

`ticket.id_cliente IS NULL OR ticket.id_cliente = UN Único cliente`

- **Corolario**: Los puntos acumulados por un ticket se asignan exactamente al cliente vinculado; nunca se duplican.
- **Historias**: HU-M4-FID-005
- **Skills**: SK-074 (identificar_cliente_al_cobrar)
