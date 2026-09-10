# INV-04.2 — Invariantes de Operación de Sala / TPV

> **Sección**: 04.2  
> **Dominio**: Mesas, comandas, cobro, caja  
> **Agentes relacionados**: AG-001 (TPV)  
> **Total invariantes**: 6 (INV-010 a INV-015)  
> **Última revisión**: 2026-03-14

---

## INV-010: Estado de mesa coherente

Una mesa está en UNO y solo UNO de estos estados en cualquier momento: `libre | ocupada | reservada | pendiente_cobro`. No puede estar en dos estados a la vez.

- **Relacionado**: RN-030
- **Historias**: HU-M1-SAL-001, HU-M1-SAL-002

---

## INV-011: Un servicio activo → una mesa ocupada

Si existe un servicio en estado "activo" para una mesa, esa mesa DEBE estar en estado "ocupada" o "pendiente_cobro". No hay servicios activos en mesas libres.

- **Relacionado**: RN-030, RN-031
- **Historias**: HU-M1-SAL-002

---

## INV-012: Comanda siempre ligada a servicio

Toda comanda pertenece a un servicio. No existen comandas sin servicio asociado.

- **Relacionado**: RN-031
- **Historias**: HU-M1-CMD-001

---

## INV-013: División de cuenta cuadra al céntimo

Si una cuenta de X€ se divide en N tickets parciales, entonces:

`Σ total_ticket_parcial[i] para i=1..N = X`

Exactamente, sin diferencia por redondeo.

- **Relacionado**: RN-034
- **Historias**: HU-M1-COB-002

---

## INV-014: Cobro cubre el total

La suma de importes pagados en todas las formas de pago de un cobro debe ser >= total de la cuenta. El exceso (si paga en efectivo) es el cambio.

`Σ importes_pagados >= total_cuenta`

- **Historias**: HU-M1-COB-001, HU-M1-COB-003

---

## INV-015: Arqueo suma correcta

El efectivo esperado en caja al cierre = fondo_de_caja + cobros_en_efectivo − retiradas_de_efectivo.

`efectivo_esperado = fondo + Σ cobros_efectivo - Σ retiradas`

- **Relacionado**: RN-036
- **Historias**: HU-M1-CAJ-002, HU-M1-CAJ-003
