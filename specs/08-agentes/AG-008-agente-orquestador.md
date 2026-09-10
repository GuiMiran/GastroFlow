# AG-008 — AgenteOrquestador (Agente Director)

> **Código**: AG-008  
> **Módulo principal**: Transversal (todos los módulos)  
> **Estado**: Activo (parcial)  
> **Última revisión**: 2026-03-14

---

## Responsabilidad

Orquestar la coordinación entre los demás agentes. No ejecuta lógica de negocio directa: coordina flujos (workflows) que involucran a múltiples agentes.

---

## Skills que usa

| Skill | Nombre | Descripción |
|-------|--------|-------------|
| SK-070 | ejecutar_workflow | Ejecuta un workflow orquestado paso a paso |
| SK-071 | verificar_consistencia_global | Verifica coherencia entre todos los agentes |
| SK-072 | generar_dashboard_ejecutivo | Dashboard resumen para propietario |

---

## Eventos que escucha

**TODOS los eventos** — monitoriza el sistema completo.

---

## Eventos que produce

| Evento | Cuándo |
|--------|--------|
| AlertaInconsistencia | Cuando detecta incoherencia entre agentes |
| InformeEstado | Resumen periódico de estado del sistema |

---

## Invariantes que respeta

**TODAS** — es el verificador global de invariantes.

---

## Agentes que coordina

| Agente | Módulo |
|--------|--------|
| AG-001 AgenteTPV | M1-TPV |
| AG-002 AgenteInventario | M2-ERP (Inventario) |
| AG-003 AgenteCompras | M2-ERP (Compras) |
| AG-004 AgenteContable | M3-CONTABILIDAD |
| AG-005 AgenteFiscal | M3-CONTABILIDAD (Fiscal) |
| AG-006 AgenteRRHH | M2-ERP (RRHH) |
| AG-007 AgenteCRM | M4-CRM |
| AG-009 AgenteDocumentacion | Transversal (Specs) |

---

## Workflows que orquesta

Ver `specs/10-workflows/workflows.md` — WF-001 a WF-009
