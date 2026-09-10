# CAPA 04 — INVARIANTES

> **⚠️ DEPRECATED** — Este archivo monolítico ha sido reemplazado por la estructura modular.
> Consultar los archivos individuales por dominio:
>
> - `_index.md` → Índice con directorio completo e índice rápido
> - `INV-04.1-fiscales-facturacion.md` a `INV-04.6-crm-datos.md` → Un archivo por dominio
>
> **No editar este archivo. Solo se conserva como referencia histórica.**

> Condiciones que SIEMPRE deben ser verdaderas en cualquier estado del sistema.  
> Si una invariante se viola, el sistema está en estado corrupto.  
> Formato: `INV-XXX: [condición booleana en lenguaje natural]`

---

## 04.1 — Invariantes Fiscales y de Facturación

**INV-001: Secuencialidad de numeración**  
Para cualquier serie de facturación, el número de la factura N+1 es exactamente el número de la factura N más 1. No existen saltos ni huecos en la secuencia.

- Relacionado: RN-014
- Verificación: Para toda serie S, ordenando por fecha: `num(ticket[i+1]) = num(ticket[i]) + 1`

**INV-002: Integridad del total de ticket**  
El total de cualquier ticket o factura = suma de (base_imponible × (1 + tipo_iva)) de todas las líneas, menos descuentos. En otras palabras:  
`total_ticket = Σ (precio_linea) = Σ (base_imponible_linea + cuota_iva_linea)`

- Relacionado: RN-002, RN-003

**INV-003: Cuadre de IVA por ticket**  
Para cada tipo de IVA en un ticket: `cuota_iva = base_imponible × tipo_iva`, con tolerancia de ±0,01€ por redondeo.

- Relacionado: RN-001, RN-003

**INV-004: IVA repercutido trimestral = suma de todas las cuotas de IVA de tickets emitidos en el trimestre**  
El total de IVA repercutido declarable en el modelo 303 es la suma exacta de todas las cuotas de IVA de todos los tickets y facturas emitidos en el período.

- Relacionado: RN-021, HU-091

**INV-005: IVA soportado trimestral = suma de cuotas de IVA de facturas de compra registradas en el trimestre**  
El IVA soportado deducible declarable es la suma de las cuotas de IVA de las facturas de compra registradas y aceptadas como deducibles.

- Relacionado: RN-005, RN-021

**INV-006: Resultado modelo 303 = IVA repercutido - IVA soportado**  
El resultado a pagar/compensar del trimestre siempre es esta resta exacta.

- Relacionado: RN-021

**INV-007: Inalterabilidad VeriFactu**  
Un registro de facturación (ticket o factura) una vez generado y firmado con hash NUNCA puede ser modificado ni eliminado. Solo puede ser corregido mediante factura rectificativa.

- Relacionado: RN-017, RN-035

**INV-008: Cadena de hash VeriFactu ininterrumpida**  
Cada registro de facturación contiene el hash del registro anterior. La cadena no tiene interrupciones ni bifurcaciones.

- Relacionado: RN-017

---

## 04.2 — Invariantes de Operación de Sala / TPV

**INV-010: Estado de mesa coherente**  
Una mesa está en UNO y solo UNO de estos estados en cualquier momento: `libre | ocupada | reservada | pendiente_cobro`. No puede estar en dos estados a la vez.

- Relacionado: RN-030

**INV-011: Un servicio activo → una mesa ocupada**  
Si existe un servicio en estado "activo" para una mesa, esa mesa DEBE estar en estado "ocupada" o "pendiente_cobro". No hay servicios activos en mesas libres.

- Relacionado: RN-030, RN-031

**INV-012: Comanda siempre ligada a servicio**  
Toda comanda pertenece a un servicio. No existen comandas sin servicio asociado.

- Relacionado: RN-031

**INV-013: División de cuenta cuadra al céntimo**  
Si una cuenta de X€ se divide en N tickets parciales, entonces: `Σ total_ticket_parcial[i] para i=1..N = X` exactamente (sin diferencia por redondeo).

- Relacionado: RN-034

**INV-014: Cobro cubre el total**  
La suma de importes pagados en todas las formas de pago de un cobro debe ser >= total de la cuenta. El exceso (si paga en efectivo) es el cambio.  
`Σ importes_pagados >= total_cuenta`

**INV-015: Arqueo suma correcta**  
El efectivo esperado en caja al cierre = fondo_de_caja + cobros_en_efectivo - retiradas_de_efectivo.  
`efectivo_esperado = fondo + Σ cobros_efectivo - Σ retiradas`

- Relacionado: RN-036

---

## 04.3 — Invariantes de Inventario

**INV-020: Stock teórico trazable**  
El stock teórico de un ingrediente en cualquier momento = stock_inicial + entradas (compras) - salidas (ventas vía escandallos) - mermas - ajustes.  
`stock_actual = stock_inicial + Σ entradas - Σ salidas - Σ mermas ± Σ ajustes`

- Relacionado: RN-040, RN-041

**INV-021: Movimiento de stock siempre con origen**  
Todo movimiento de stock (entrada, salida, traspaso, ajuste) tiene un origen documentado: albarán de compra, ticket de venta, inventario manual, o traspaso entre almacenes.

**INV-022: Coste teórico de escandallo es determinista**  
Para un escandallo dado con ingredientes a precios de coste conocidos:  
`coste_teorico = Σ (cantidad_ingrediente[i] × (1 + merma[i]) × precio_coste[i])`  
El resultado es siempre el mismo dadas las mismas entradas.

- Relacionado: RN-042

---

## 04.4 — Invariantes Contables

**INV-030: Partida doble siempre cuadra**  
En todo asiento contable: `Σ cargos = Σ abonos` exactamente.

- Relacionado: RN-080

**INV-031: Balance de situación siempre cuadra**  
`Activo total = Pasivo total + Patrimonio Neto` en cualquier momento.

- Relacionado: RN-083

**INV-032: Libro de IVA emitidas coincide con tickets/facturas**  
El número de registros en el libro de IVA de facturas emitidas = número total de tickets + facturas completas emitidos. Cada registro tiene correspondencia 1:1 con un documento fiscal.

- Relacionado: RN-011, HU-092

**INV-033: Libro de IVA recibidas coincide con facturas de compra**  
Cada factura de compra registrada genera exactamente una entrada en el libro de facturas recibidas.

---

## 04.5 — Invariantes Laborales

**INV-040: Un empleado no puede tener turnos solapados**  
Para cualquier empleado, no existen dos turnos cuya franja horaria se solape.

- Relacionado: HU-071

**INV-041: Descanso mínimo entre turnos: 12 horas**  
Para cualquier empleado, entre el fin del turno N y el inicio del turno N+1 hay ≥12 horas.

- Relacionado: RN-053

**INV-042: Horas extra anuales ≤ 80h**  
La suma de horas extra de cualquier empleado en un año natural no supera 80 horas.

- Relacionado: RN-052

---

## 04.6 — Invariantes de CRM / Datos

**INV-050: Puntos de fidelización ≥ 0**  
El saldo de puntos de un cliente nunca puede ser negativo.

**INV-051: Canjeo de puntos no excede saldo**  
No se pueden canjear más puntos de los que el cliente tiene acumulados.  
`puntos_canjeados ≤ saldo_puntos_actual`

**INV-052: Consentimiento registrado antes de comunicación**  
No se envía ninguna comunicación comercial a un cliente sin que exista un registro previo de consentimiento activo.

- Relacionado: RN-062

---
