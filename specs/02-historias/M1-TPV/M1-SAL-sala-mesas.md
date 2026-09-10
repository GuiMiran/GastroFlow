# M1-SAL — Historias de Usuario: Sala y Mesas

> **Módulo**: M1-TPV  
> **Ámbito**: SAL — Gestión de Sala, Zonas y Mesas  
> **Agente responsable**: AG-001 (AgenteTPV)  
> **Estado**: Implementado (iteración 1)  
> **Última revisión**: 2026-03-14

---

## HU-M1-SAL-001 | Configurar zonas y mesas | Must

**COMO** propietario  
**QUIERO** configurar las zonas y mesas de mi establecimiento  
**PARA** que el personal de sala vea el mapa real del local.

**Criterios de aceptación:**

- **AC-01**: DADO que soy propietario CUANDO creo una zona "Terraza" con 8 mesas ENTONCES aparece en el mapa del TPV con las 8 mesas en estado "libre".
- **AC-02**: DADO que una mesa está ocupada CUANDO la veo en el mapa ENTONCES aparece visualmente diferenciada (color/icono).

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-030 (estados de mesa) |
| Invariantes | INV-010 (estado coherente) |
| Contratos | OP-001 (AbrirMesa) |
| Skills | SK-001 (abrir_mesa) |
| Eventos | EVT-001 (MesaAbierta) |

**Estado implementación:**
- Backend: `MesaService.obtenerMapaSala()` → `GET /mesas/establecimiento/:id/mapa`
- Frontend: `SalaPage.tsx` — mapa visual con zonas y colores por estado

---

## HU-M1-SAL-002 | Abrir mesa | Must

**COMO** camarero  
**QUIERO** abrir una mesa  
**PARA** iniciar un servicio y poder tomar comandas.

**Criterios de aceptación:**

- **AC-01**: DADO que la Mesa 7 está libre CUANDO la abro ENTONCES pasa a estado "ocupada", se registra la hora de apertura y puedo añadir comandas.
- **AC-02**: DADO que la Mesa 7 ya está ocupada CUANDO intento abrirla ENTONCES el sistema me informa de que ya tiene un servicio activo.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-030, RN-031 |
| Invariantes | INV-010 |
| Contratos | OP-001 (AbrirMesa: PRE mesa=libre, POST mesa=ocupada+servicio) |
| Skills | SK-001 |
| Eventos | EVT-001 |

**Estado implementación:**
- Backend: `MesaService.abrirMesa()` → `POST /mesas/:mesaId/abrir`
- Frontend: `SalaPage.tsx` — clic en mesa libre → modal comensales → crear servicio

---

## HU-M1-SAL-003 | Mover servicio de mesa | Should

**COMO** camarero  
**QUIERO** cambiar una mesa de sitio (mover servicio)  
**PARA** reubicar clientes sin perder las comandas.

**Criterios de aceptación:**

- **AC-01**: DADO que Mesa 7 tiene 2 comandas CUANDO la muevo a Mesa 12 ENTONCES todas las comandas se trasladan a Mesa 12 y Mesa 7 queda libre.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-030 |
| Invariantes | INV-010 |

**Estado implementación:** No implementado (backlog iteración 2)

---

## HU-M1-SAL-004 | Unir mesas | Should

**COMO** camarero  
**QUIERO** unir dos mesas en un solo servicio  
**PARA** atender grupos grandes.

**Criterios de aceptación:**

- **AC-01**: DADO que Mesa 7 y Mesa 8 están libres CUANDO las uno ENTONCES se crea un servicio conjunto "Mesa 7+8" con una sola cuenta.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-030 |
| Invariantes | INV-010 |

**Estado implementación:** No implementado (backlog iteración 2)
