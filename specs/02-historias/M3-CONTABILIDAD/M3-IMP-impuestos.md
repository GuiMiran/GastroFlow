# M3-IMP — Historias de Usuario: Impuestos y Modelos Fiscales

> **Módulo**: M3-CONTABILIDAD  
> **Ámbito**: IMP — IVA dashboard, Modelos 303/347/111/115, Libros registro  
> **Agente responsable**: AG-004 (AgenteContable — fiscal)  
> **Estado**: No implementado (backlog)  
> **Última revisión**: 2026-03-14

---

## HU-M3-IMP-001 | Dashboard IVA en tiempo real | Must

**COMO** propietario  
**QUIERO** ver en tiempo real cuánto IVA debo a Hacienda este trimestre  
**PARA** no gastarme ese dinero.

**Criterios de aceptación:**

- **AC-01**: DADO que estamos a 15 de febrero CUANDO consulto el dashboard fiscal ENTONCES veo: IVA repercutido acumulado Q1, IVA soportado acumulado Q1, resultado estimado a pagar/compensar, fecha límite de presentación.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-001 a RN-003 (tipos IVA) |
| Skills | SK-043 (calcular_estimacion_iva_trimestral) |

**Estado implementación:** No implementado

---

## HU-M3-IMP-002 | Borrador Modelo 303 | Must

**COMO** contable  
**QUIERO** generar el borrador del Modelo 303  
**PARA** presentar la declaración trimestral de IVA.

**Criterios de aceptación:**

- **AC-01**: DADO que es fin de trimestre CUANDO pido el borrador del 303 ENTONCES el sistema genera el formulario con: casillas de IVA repercutido (al 4%, 10%, 21%), casillas de IVA soportado deducible, resultado de la liquidación, datos de identificación.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-051 (normativa Modelo 303 AEAT) |
| Skills | SK-044 (generar_borrador_303) |

**Estado implementación:** No implementado

---

## HU-M3-IMP-003 | Libros Registro facturas | Must

**COMO** contable  
**QUIERO** generar el Libro Registro de Facturas Emitidas y Recibidas  
**PARA** cumplir obligaciones y facilitar inspecciones.

**Criterios de aceptación:**

- **AC-01**: DADO que pido el libro de emitidas del Q1 CUANDO lo genero ENTONCES lista todos los tickets y facturas con: número, fecha, base imponible, tipo IVA, cuota IVA, total. Agrupado y totalizado.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Skills | SK-045 (generar_libro_registro) |

**Estado implementación:** No implementado

---

## HU-M3-IMP-004 | Borrador Modelo 347 | Should

**COMO** contable  
**QUIERO** generar el borrador del Modelo 347  
**PARA** declarar operaciones con terceros >3.005,06€.

**Criterios de aceptación:**

- **AC-01**: DADO que compré 12.000€ anuales a Makro CUANDO genero el 347 ENTONCES Makro aparece con el total de operaciones, desglosado por trimestre.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-052 (umbral 3.005,06€ para Modelo 347) |
| Skills | SK-046 (generar_borrador_347) |

**Estado implementación:** No implementado

---

## HU-M3-IMP-005 | Borrador Modelo 111 | Should

**COMO** contable  
**QUIERO** generar el borrador del Modelo 111  
**PARA** declarar retenciones de IRPF a empleados.

**Criterios de aceptación:**

- **AC-01**: DADO que es fin de trimestre y hay 8 empleados con retenciones CUANDO pido el 111 ENTONCES muestra perceptores, retenciones practicadas y total a ingresar.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-053 (normativa Modelo 111 AEAT) |
| Skills | SK-047 (generar_borrador_111) |

**Estado implementación:** No implementado

---

## HU-M3-IMP-006 | Borrador Modelo 115 | Should

**COMO** contable  
**QUIERO** generar el borrador del Modelo 115  
**PARA** declarar retenciones del alquiler del local.

**Criterios de aceptación:**

- **AC-01**: DADO que el alquiler del local es 2.000€/mes con retención del 19% CUANDO pido el 115 del Q1 ENTONCES muestra retención: 3 × 380€ = 1.140€ a ingresar.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-054 (retención alquiler 19% normativa) |
| Skills | SK-048 (generar_borrador_115) |

**Estado implementación:** No implementado
