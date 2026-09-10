# CAPA 08 — Índice de Agentes

> 9 agentes autónomos que operan sobre el dominio GastroFlow.  
> Cada agente es un rol funcional con skills, eventos e invariantes asignados.  
> Última revisión: 2026-03-14

---

## Instrucciones para la IA Agéntica

1. **Cada agente es un .md independiente** — consume solo el fichero del agente que necesitas.
2. **El Orquestador (AG-008) coordina** — nunca dos agentes operan sobre el mismo recurso sin pasar por él.
3. **Las invariantes son absolutas** — si un agente viola una invariante, el flujo se detiene.
4. **Los skills son atómicos** — un agente solo ejecuta los skills que tiene asignados.

---

## Directorio de Agentes

| Código | Nombre | Módulo | Archivo | Skills | Estado |
|--------|--------|--------|---------|--------|--------|
| AG-001 | AgenteTPV | M1-TPV | [AG-001-agente-tpv.md](AG-001-agente-tpv.md) | SK-001 a SK-009 | Activo |
| AG-002 | AgenteInventario | M2-ERP | [AG-002-agente-inventario.md](AG-002-agente-inventario.md) | SK-010 a SK-016 | Parcial |
| AG-003 | AgenteCompras | M2-ERP | [AG-003-agente-compras.md](AG-003-agente-compras.md) | SK-020 a SK-024 | Backlog |
| AG-004 | AgenteContable | M3-CONTAB | [AG-004-agente-contable.md](AG-004-agente-contable.md) | SK-030 a SK-036 | Backlog |
| AG-005 | AgenteFiscal | M3-CONTAB | [AG-005-agente-fiscal.md](AG-005-agente-fiscal.md) | SK-040 a SK-049 | Backlog |
| AG-006 | AgenteRRHH | M2-ERP | [AG-006-agente-rrhh.md](AG-006-agente-rrhh.md) | SK-050 a SK-054 | Backlog |
| AG-007 | AgenteCRM | M4-CRM | [AG-007-agente-crm.md](AG-007-agente-crm.md) | SK-060 a SK-068 | Backlog |
| AG-008 | AgenteOrquestador | Transversal | [AG-008-agente-orquestador.md](AG-008-agente-orquestador.md) | SK-070 a SK-072 | Parcial |
| AG-009 | AgenteDocumentacion | Transversal | [AG-009-agente-documentacion.md](AG-009-agente-documentacion.md) | SK-080 a SK-084 | Activo |

---

## Matriz Agente → Módulo → Historias

| Agente | Módulo | Ámbitos HU |
|--------|--------|------------|
| AG-001 | M1-TPV | SAL, CMD, COB, CAJ |
| AG-002 | M2-ERP | CAT, INV |
| AG-003 | M2-ERP | COM |
| AG-004 | M3-CONTABILIDAD | ASI |
| AG-005 | M3-CONTABILIDAD | IMP |
| AG-006 | M2-ERP | RRH |
| AG-007 | M4-CRM | RES, FID, CMP |
| AG-008 | Transversal | Todos (orquestación) |
| AG-009 | Transversal | Todos (documentación) |

---

## Flujo de Eventos entre Agentes

```
AG-001 (TPV) ──EVT-004──→ AG-002 (Inventario) ──descuenta stock
                │                    │
                │              EVT-020──→ AG-003 (Compras) ──sugiere pedido
                │
                ├──EVT-004──→ AG-004 (Contable) ──genera asiento venta
                │                    │
                │              EVT-030──→ AG-005 (Fiscal) ──acumula IVA
                │
                └──EVT-004──→ AG-007 (CRM) ──acumula puntos fidelización

AG-003 (Compras) ──EVT-023──→ AG-004 (Contable) ──genera asiento compra
                         └──→ AG-005 (Fiscal) ──acumula IVA soportado

AG-008 (Orquestador) ──monitoriza TODOS los eventos──→ consistencia global
AG-009 (Documentación) ──verifica specs vs implementación
```
