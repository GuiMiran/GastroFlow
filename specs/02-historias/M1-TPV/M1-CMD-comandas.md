# M1-CMD — Historias de Usuario: Comandas

> **Módulo**: M1-TPV  
> **Ámbito**: CMD — Toma de Comandas y Gestión de Pedidos  
> **Agente responsable**: AG-001 (AgenteTPV)  
> **Estado**: Implementado parcial (iteración 1)  
> **Última revisión**: 2026-03-14

---

## HU-M1-CMD-001 | Tomar comanda en mesa | Must

**COMO** camarero  
**QUIERO** tomar una comanda en una mesa  
**PARA** registrar lo que piden los clientes.

**Criterios de aceptación:**

- **AC-01**: DADO que Mesa 7 está ocupada CUANDO añado "2x Cerveza, 1x Tortilla, 1x Gin Tonic" ENTONCES la comanda se registra con los precios, IVAs y se envía a los destinos (cocina/barra).
- **AC-02**: DADO que añado un producto con alérgenos CUANDO confirmo la comanda ENTONCES se muestra una alerta visual de alérgenos.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-001 (IVA), RN-002 (PVP incluye IVA) |
| Invariantes | INV-002 (integridad total), INV-003 (cuadre IVA) |
| Contratos | OP-002 (TomarComanda: PRE servicio activo + ≥1 línea) |
| Skills | SK-002 (tomar_comanda) |
| Eventos | EVT-002 (ComandaRegistrada) |
| Políticas | POL-010 (destino cocina/barra) |

**Estado implementación:**
- Backend: `ComandaService.tomarComanda()` → `POST /comandas`
- Frontend: `ComandaPage.tsx` — categorías, grid de productos, ticket en tiempo real

---

## HU-M1-CMD-002 | Añadir modificadores a producto | Must

**COMO** camarero  
**QUIERO** añadir modificadores a un producto  
**PARA** personalizar el pedido del cliente.

**Criterios de aceptación:**

- **AC-01**: DADO que añado "1x Hamburguesa" CUANDO selecciono modificador "Sin cebolla" y "Punto medio" ENTONCES la comanda incluye los modificadores y se muestran en cocina.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Contratos | OP-002 |
| Skills | SK-002 |

**Estado implementación:**
- Backend: Soportado (campo `modificadores[]` en LineaComanda)
- Frontend: Pendiente UI de modificadores (iteración 2)

---

## HU-M1-CMD-003 | Ver comandas en cocina | Must

**COMO** cocinero  
**QUIERO** ver las comandas en tiempo real en pantalla  
**PARA** preparar los platos en orden.

**Criterios de aceptación:**

- **AC-01**: DADO que el camarero confirma una comanda con productos de cocina CUANDO llega a la pantalla de cocina ENTONCES aparece con la hora de entrada, mesa y detalle de platos.
- **AC-02**: DADO que marco un plato como "listo" CUANDO lo confirmo ENTONCES el camarero recibe notificación de que el plato está para servir.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Políticas | POL-010 (destino cocina/barra) |
| Eventos | EVT-002 (ComandaRegistrada) |

**Estado implementación:** No implementado (pantalla KDS — iteración 2)

---

## HU-M1-CMD-004 | Ver comandas de bebidas en barra | Should

**COMO** barman  
**QUIERO** ver solo las comandas de bebidas en mi pantalla  
**PARA** prepararlas sin confundirme con los platos.

**Criterios de aceptación:**

- **AC-01**: DADO que una comanda tiene cerveza y tortilla CUANDO se envía ENTONCES la tortilla va a pantalla cocina y la cerveza va a pantalla barra.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Políticas | POL-010 (destino por categoría) |

**Estado implementación:** No implementado (pantalla KDS — iteración 2)

---

## HU-M1-CMD-005 | Anular línea de comanda | Must

**COMO** camarero  
**QUIERO** anular una línea de comanda antes de que se prepare  
**PARA** corregir errores.

**Criterios de aceptación:**

- **AC-01**: DADO que la comanda aún no se ha marcado como "en preparación" CUANDO anulo la línea ENTONCES se elimina y el stock no se descuenta.
- **AC-02**: DADO que la comanda ya está "en preparación" CUANDO intento anular ENTONCES se requiere autorización del encargado.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Contratos | OP-003 (AnularLinea: PRE motivo + autorización si en preparación) |
| Eventos | EVT-007 (LineaComandaAnulada) |
| Reglas | RN-035 (anulación con autorización) |

**Estado implementación:**
- Backend: `ComandaService.anularLinea()` → `DELETE /comandas/lineas/:lineaId`

---

## HU-M1-CMD-006 | Repetir última comanda | Could

**COMO** camarero  
**QUIERO** repetir la última comanda (o parte de ella)  
**PARA** agilizar cuando el cliente pide "otra ronda".

**Criterios de aceptación:**

- **AC-01**: DADO que Mesa 7 tiene una comanda previa con "4x Cerveza" CUANDO pulso "repetir ronda" ENTONCES se crea nueva comanda con "4x Cerveza".

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Skills | SK-002 |

**Estado implementación:** No implementado (backlog iteración 3)
