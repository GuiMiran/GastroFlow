# AG-005 — AgenteFiscal (Agente Fiscal y Tributario)

> **Código**: AG-005  
> **Módulo principal**: M3-CONTABILIDAD (Fiscal)  
> **Estado**: No implementado (backlog)  
> **Última revisión**: 2026-03-14

---

## Responsabilidad

Calcular y preparar todas las obligaciones fiscales — IVA, retenciones, modelos tributarios, calendario fiscal.

---

## Skills que usa

| Skill | Nombre | Descripción |
|-------|--------|-------------|
| SK-040 | calcular_iva_repercutido_periodo | Acumula IVA repercutido del período |
| SK-041 | calcular_iva_soportado_periodo | Acumula IVA soportado del período |
| SK-042 | generar_borrador_modelo_303 | Borrador declaración trimestral IVA |
| SK-043 | generar_borrador_modelo_347 | Borrador operaciones con terceros |
| SK-044 | generar_borrador_modelo_111 | Borrador retenciones IRPF empleados |
| SK-045 | generar_borrador_modelo_115 | Borrador retenciones alquiler |
| SK-046 | generar_libro_registro_emitidas | Libro registro facturas emitidas |
| SK-047 | generar_libro_registro_recibidas | Libro registro facturas recibidas |
| SK-048 | verificar_calendario_fiscal | Alerta plazos AEAT |
| SK-049 | calcular_retencion_alquiler | Calcula retención 19% alquiler |

---

## Eventos que escucha

| Evento | Reacción |
|--------|----------|
| EVT-004 (TicketEmitido) | Acumula IVA repercutido |
| EVT-023 (FacturaCompraRegistrada) | Acumula IVA soportado |
| EVT-030 (AsientoContableCreado) | Verifica coherencia fiscal-contable |

---

## Eventos que produce

| Evento | Cuándo |
|--------|--------|
| EVT-031 (TrimestreFiscalProximoACerrar) | 15 días antes del cierre trimestral |
| EVT-032 (Modelo303Generado) | Al generar borrador 303 |

---

## Invariantes que respeta

| Invariante | Descripción |
|-----------|-------------|
| INV-004 | IVA repercutido trimestral correcto |
| INV-005 | IVA soportado trimestral correcto |
| INV-006 | Resultado 303 = repercutido − soportado |

---

## Reglas de negocio clave

| Reglas | Dominio |
|--------|---------|
| RN-001 a RN-007 | Todas las reglas de IVA |
| RN-020 a RN-025 | Modelos tributarios |

---

## Historias de usuario asociadas

Ámbito: IMP → ver `specs/02-historias/M3-CONTABILIDAD/M3-IMP-impuestos.md`
