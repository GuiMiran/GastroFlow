# 06 — Políticas de Decisión — Índice Modular

> **Capa**: 06 — Políticas de Decisión  
> **Total archivos**: 6  
> **Total políticas**: 27  
> **Última actualización**: 2026-03-15

---

## Directorio de archivos

| Archivo | Dominio | POL IDs | Total |
|---------|---------|---------|-------|
| POL-06.1-fiscales-iva.md | Fiscal / IVA | POL-001 → POL-007 | 7 |
| POL-06.2-operativas-tpv.md | Operativas TPV / Sala | POL-010 → POL-014 | 5 |
| POL-06.3-inventario.md | Inventario | POL-020 → POL-022 | 3 |
| POL-06.4-crm-fidelizacion.md | CRM / Fidelización / Reservas | POL-030 → POL-033 | 4 |
| POL-06.5-laborales.md | Laboral | POL-040 → POL-041 | 2 |
| POL-06.9-perfiles-roles-acceso.md | Perfiles, Roles y Acceso | POL-070 → POL-075 | 6 |

---

## Matriz Política → Dominio → Agentes → Módulos

| Dominio | Agentes | Módulo | POL count |
|---------|---------|--------|-----------|
| Fiscal / IVA | AG-001, AG-005 | M1-TPV, M3-CONTABILIDAD | 7 |
| Operativas TPV | AG-001 | M1-TPV | 5 |
| Inventario | AG-002 | M2-ERP | 3 |
| CRM / Fidelización | AG-007 | M4-CRM | 4 |
| Laboral | AG-006 | M2-ERP | 2 |
| Perfiles, Roles y Acceso | AG-008, todos | M0-PLATFORM (transversal) | 6 |

---

## Índice rápido de todas las políticas

| POL | Nombre | Archivo |
|-----|--------|---------|
| POL-001 | Determinación del tipo de IVA de un producto | POL-06.1 |
| POL-002 | Factura simplificada vs completa | POL-06.1 |
| POL-003 | Factura rectificativa — sustitución o diferencias | POL-06.1 |
| POL-004 | Declaración proveedor en Modelo 347 | POL-06.1 |
| POL-005 | Obligación SII | POL-06.1 |
| POL-006 | Recargo de equivalencia | POL-06.1 |
| POL-007 | Retención alquiler del local | POL-06.1 |
| POL-010 | Destino líneas de comanda | POL-06.2 |
| POL-011 | Autorización para anular comanda | POL-06.2 |
| POL-012 | División cuenta — redondeo | POL-06.2 |
| POL-013 | Alerta de alérgenos | POL-06.2 |
| POL-014 | Gestión de propinas | POL-06.2 |
| POL-020 | Producto sin escandallo | POL-06.3 |
| POL-021 | Stock llega a nivel mínimo | POL-06.3 |
| POL-022 | Actualización precio de coste | POL-06.3 |
| POL-030 | Puntos de fidelización | POL-06.4 |
| POL-031 | Subida de nivel | POL-06.4 |
| POL-032 | Comunicación de cumpleaños | POL-06.4 |
| POL-033 | No-show en reservas | POL-06.4 |
| POL-040 | Conflicto de turno | POL-06.5 |
| POL-041 | Control de horas extra | POL-06.5 |
| POL-070 | Definición de roles y perfiles combinados | POL-06.9 |
| POL-071 | Matriz de permisos por rol y módulo | POL-06.9 |
| POL-072 | Trazabilidad del cobro (audit trail) | POL-06.9 |
| POL-073 | Modos de login: PIN vs email/password | POL-06.9 |
| POL-074 | Menú dinámico según rol y módulos activos | POL-06.9 |
| POL-075 | Log de auditoría de acciones sensibles | POL-06.9 |

---

## Flujo de aplicación (visión esquemática)

```
  Evento (Capa 07)
       ↓
  ¿Qué POLÍTICA aplica? → Capa 06 (este índice)
       ↓
  Evaluar condiciones → resultado
       ↓
  Validar REGLAS (Capa 03) + INVARIANTES (Capa 04)
       ↓
  Ejecutar SKILL (Capa 09) del AGENTE (Capa 08)
```
