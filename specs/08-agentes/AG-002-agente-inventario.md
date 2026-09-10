# AG-002 — AgenteInventario (Agente de Inventario y Stock)

> **Código**: AG-002  
> **Módulo principal**: M2-ERP (Inventario)  
> **Estado**: Activo (parcial iteración 1)  
> **Última revisión**: 2026-03-14

---

## Responsabilidad

Mantener el inventario actualizado, gestionar escandallos, alertar de stock bajo y coordinar con compras.

---

## Skills que usa

| Skill | Nombre | Descripción |
|-------|--------|-------------|
| SK-010 | descontar_stock_por_venta | Descuenta ingredientes del stock al vender |
| SK-011 | calcular_escandallo | Calcula coste teórico y food cost |
| SK-012 | verificar_stock_minimo | Comprueba umbrales de stock |
| SK-013 | registrar_entrada_mercancia | Suma stock por albarán recibido |
| SK-014 | realizar_inventario_fisico | Registra conteo manual y desviaciones |
| SK-015 | traspasar_stock_entre_almacenes | Mueve stock entre ubicaciones |
| SK-016 | calcular_food_cost | Calcula % food cost por producto |

---

## Eventos que escucha

| Evento | Reacción |
|--------|----------|
| EVT-004 (TicketEmitido) | Descuenta stock según escandallos |
| EVT-022 (AlbaranRecibido) | Suma stock recibido |
| EVT-023 (FacturaCompraRegistrada) | Actualiza precios de coste |

---

## Eventos que produce

| Evento | Cuándo |
|--------|--------|
| EVT-020 (StockBajoMinimo) | Cuando stock < umbral configurado |
| EVT-021 (StockNegativo) | Cuando stock teórico < 0 |
| EVT-024 (InventarioFisicoRealizado) | Al completar conteo manual |

---

## Invariantes que respeta

| Invariante | Descripción |
|-----------|-------------|
| INV-020 | Stock trazable (todo movimiento tiene origen) |
| INV-021 | Movimiento con origen documentado |
| INV-022 | Coste escandallo determinista |

---

## Reglas de negocio clave

| Reglas | Dominio |
|--------|---------|
| RN-040 a RN-044 | Inventario y escandallos |

---

## Historias de usuario asociadas

Ámbitos: CAT, INV → ver `specs/02-historias/M2-ERP/`
