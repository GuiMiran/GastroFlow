# 06.3 — Políticas de Inventario

> **Sección**: 06.3 de Capa 06 — Políticas de Decisión  
> **Dominio**: Inventario  
> **Total políticas**: 3 (POL-020 a POL-022)  
> **Agentes**: AG-002 AgenteInventario  
> **Fecha**: 2026-03-14

---

**POL-020: Producto sin escandallo — ¿Descontar stock?**  
```
SI el producto vendido no tiene escandallo asignado → No descontar stock. Registrar advertencia en log para que el propietario configure el escandallo.
SI_NO → Descontar ingredientes según escandallo.
```
- Referencia: OP-023

**POL-021: Stock llega a nivel mínimo**  
```
SI stock_actual de ingrediente ≤ stock_mínimo → Generar alerta de reposición visible en backoffice.
SI_NO SI stock_actual < 0 (teórico) → Generar alerta URGENTE: stock negativo, posible desfase.
```
- Referencia: RN-040, HU-051

**POL-022: Actualización de precio de coste**  
```
SI se registra nueva factura de compra con precio diferente al registrado → Actualizar precio de coste del ingrediente al nuevo precio.
SI_NO SI se quiere mantener precio medio ponderado → precio = (stock_anterior × precio_anterior + cantidad_nueva × precio_nuevo) / (stock_anterior + cantidad_nueva)
```
- Referencia: RN-044
- **Decisión de negocio**: El propietario elige en configuración si usa "último precio" o "precio medio ponderado".

---

### Trazabilidad

| POL | Skills que la aplican | Reglas | Invariantes | HU relacionadas |
|-----|-----------------------|--------|-------------|-----------------|
| POL-020 | SK-010 | — | — | HU-M2-INV-001 |
| POL-021 | SK-012 | RN-040 | — | HU-M2-INV-002 |
| POL-022 | SK-022 | RN-044 | — | HU-M2-COM-003 |
