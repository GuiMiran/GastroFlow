# AG-009 — AgenteDocumentacion (Agente de Documentación)

> **Código**: AG-009  
> **Módulo principal**: Transversal (Especificaciones)  
> **Estado**: Activo (iteración 1)  
> **Última revisión**: 2026-03-14

---

## Responsabilidad

Mantener la trazabilidad, versionado y consistencia de la documentación de especificaciones del proyecto. Gestiona historias de usuario (codificación, ámbito, subámbito), criterios de aceptación, estado de implementación y correspondencia evolutiva entre iteraciones.

---

## Skills que usa

| Skill | Nombre | Descripción |
|-------|--------|-------------|
| SK-080 | validar_codificacion_historias | Verifica formato `HU-M{n}-{Ámbito}-{Seq}` |
| SK-081 | verificar_trazabilidad_completa | Cruza historias ↔ reglas ↔ invariantes ↔ contratos ↔ skills ↔ eventos |
| SK-082 | generar_informe_cobertura | % de historias con trazabilidad completa |
| SK-083 | detectar_historias_huerfanas | Historias sin regla/invariante asociada |
| SK-084 | actualizar_estado_implementacion | Sincroniza estado de historias con código real |

---

## Eventos que escucha

| Evento | Reacción |
|--------|----------|
| EVT-ALL | Verifica implementación vs especificación |
| IteracionCompletada | Genera snapshot evolutivo del estado de todas las historias |

---

## Eventos que produce

| Evento | Cuándo |
|--------|--------|
| DocumentacionDesactualizada | Cuando implementación y spec divergen |
| CoberturaInsuficiente | Cuando hay historias sin trazabilidad |

---

## Invariantes que respeta

| Invariante | Descripción |
|-----------|-------------|
| INV-DOC-001 | Toda historia tiene al menos un criterio de aceptación |
| INV-DOC-002 | Todo código sigue formato `HU-M{n}-{ÁMBITO}-{seq}` |
| INV-DOC-003 | Correspondencia antigua ↔ nueva es biyectiva (sin duplicados ni pérdidas) |

---

## Reglas de negocio

| Regla | Descripción |
|-------|-------------|
| RN-DOC-001 | Al completar iteración → snapshot estado historias (implementada/parcial/pendiente) |
| RN-DOC-002 | Ficheros organizados por módulo/ámbito en chunks <100 líneas |

---

## Historias de usuario asociadas

Transversal — aplica a todos los módulos y sus historias.
