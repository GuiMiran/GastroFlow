# INV-04.3 — Invariantes de Inventario

> **Sección**: 04.3  
> **Dominio**: Stock, escandallos, movimientos  
> **Agentes relacionados**: AG-002 (Inventario)  
> **Total invariantes**: 3 (INV-020 a INV-022)  
> **Última revisión**: 2026-03-14

---

## INV-020: Stock teórico trazable

El stock teórico de un ingrediente en cualquier momento = stock_inicial + entradas (compras) − salidas (ventas vía escandallos) − mermas − ajustes.

`stock_actual = stock_inicial + Σ entradas - Σ salidas - Σ mermas ± Σ ajustes`

- **Relacionado**: RN-040, RN-041
- **Historias**: HU-M2-INV-001, HU-M2-INV-003

---

## INV-021: Movimiento de stock siempre con origen

Todo movimiento de stock (entrada, salida, traspaso, ajuste) tiene un origen documentado: albarán de compra, ticket de venta, inventario manual, o traspaso entre almacenes.

- **Historias**: HU-M2-INV-001, HU-M2-INV-005, HU-M2-COM-003

---

## INV-022: Coste teórico de escandallo es determinista

Para un escandallo dado con ingredientes a precios de coste conocidos:

`coste_teorico = Σ (cantidad_ingrediente[i] × (1 + merma[i]) × precio_coste[i])`

El resultado es siempre el mismo dadas las mismas entradas.

- **Relacionado**: RN-042
- **Historias**: HU-M2-CAT-002, HU-M2-CAT-004
