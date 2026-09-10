# M2-INV — Historias de Usuario: Inventario y Stock

> **Módulo**: M2-ERP  
> **Ámbito**: INV — Stock automático, alertas, conteos, traspasos  
> **Agente responsable**: AG-003 (AgenteInventario)  
> **Estado**: Parcial (iteración 1)  
> **Última revisión**: 2026-03-14

---

## HU-M2-INV-001 | Descuento automático de stock | Must

**COMO** sistema  
**QUIERO** descontar automáticamente los ingredientes del stock al vender un producto  
**PARA** mantener el inventario actualizado.

**Criterios de aceptación:**

- **AC-01**: DADO que vendo 1 Gin Tonic con escandallo (50ml ginebra + 200ml tónica) CUANDO se cobra el ticket ENTONCES se descuentan 50ml del stock de Ginebra y 200ml del stock de Tónica.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Invariantes | INV-016 (stock_real ≥ 0 lógico) |
| Skills | SK-021 (descontar_stock_automatico) |
| Eventos | EVT-004 (TicketEmitido → trigger descuento) |

**Estado implementación:** No implementado (backlog iteración 2)

---

## HU-M2-INV-002 | Alertas de stock mínimo | Must

**COMO** encargado de compras  
**QUIERO** ver alertas cuando un ingrediente baje del stock mínimo  
**PARA** hacer el pedido a tiempo.

**Criterios de aceptación:**

- **AC-01**: DADO que la Ginebra tiene stock mínimo de 2 botellas CUANDO el stock baja a 1,5 botellas ENTONCES se genera alerta visible en el backoffice.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-025 (umbral configurable por ingrediente) |
| Eventos | EVT-010 (StockBajoMinimo) |

**Estado implementación:** No implementado (backlog iteración 2)

---

## HU-M2-INV-003 | Inventario manual (conteo) | Must

**COMO** encargado  
**QUIERO** hacer un inventario manual (conteo)  
**PARA** detectar desviaciones.

**Criterios de aceptación:**

- **AC-01**: DADO que el sistema dice 6 botellas de ron CUANDO cuento y registro 5 ENTONCES el sistema muestra desviación de -1 y ajusta el stock real.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Skills | SK-022 (registrar_conteo_inventario) |

**Estado implementación:** No implementado (backlog iteración 2)

---

## HU-M2-INV-004 | Informe de desviaciones | Should

**COMO** propietario  
**QUIERO** ver el informe de desviaciones de inventario  
**PARA** detectar robos, mermas excesivas o errores.

**Criterios de aceptación:**

- **AC-01**: DADO que hay 15 ingredientes con desviación CUANDO genero el informe ENTONCES muestra por cada uno: stock teórico, stock real, desviación en unidades y en euros.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Skills | SK-023 (generar_informe_desviaciones) |

**Estado implementación:** No implementado (backlog iteración 2)

---

## HU-M2-INV-005 | Traspaso entre almacenes | Should

**COMO** encargado  
**QUIERO** traspasar stock entre almacenes  
**PARA** distribuir mercancía (de almacén general a barra).

**Criterios de aceptación:**

- **AC-01**: DADO que traspaso 5 botellas de cerveza de "Almacén" a "Barra" CUANDO confirmo ENTONCES se resta de Almacén y se suma a Barra, con registro del movimiento.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Invariantes | INV-017 (Σ stock_almacenes = stock_total) |

**Estado implementación:** No implementado (backlog iteración 2)
