# 06.1 — Políticas Fiscales — Determinación de IVA

> **Sección**: 06.1 de Capa 06 — Políticas de Decisión  
> **Dominio**: Fiscal / IVA  
> **Total políticas**: 7 (POL-001 a POL-007)  
> **Agentes**: AG-001 AgenteTPV, AG-005 AgenteFiscal  
> **Fecha**: 2026-03-14

---

**POL-001: Determinación del tipo de IVA de un producto**  

| Condición: Naturaleza del producto | Tipo IVA | Cuota |
|-----------------------------------|----------|-------|
| Bebida alcohólica (cerveza, vino, sidra, licor, combinado, cóctel) | General | 21% |
| Comida elaborada servida en local (platos, tapas, raciones, menús) | Reducido | 10% |
| Bebida no alcohólica servida en local (café, refrescos, agua, zumos, infusiones) | Reducido | 10% |
| Pan común, leche, quesos, huevos, frutas, verduras, legumbres vendidos sin elaborar | Superreducido | 4% |
| Bebida alcohólica para llevar (botella vino tienda) | General | 21% |
| Comida para llevar (take-away sin servicio de mesa) | Según naturaleza | 10% (servicio preparación) |
| Servicio no alimentario (alquiler de espacio, eventos) | General | 21% |

- Referencia: RN-001
- **Regla de resolución**: SI hay duda → aplicar tipo general (21%) como tipo más seguro para Hacienda.

**POL-002: Factura simplificada vs completa**  
```
SI el cliente solicita factura completa → Emitir factura completa (OP-006)
SI_NO SI el importe > 3.000€ → Emitir factura completa obligatoriamente (RN-012)
SI_NO SI el destinatario es Administración Pública → Emitir factura completa
SI_NO → Emitir factura simplificada (ticket)
```
- Referencia: RN-010, RN-012

**POL-003: Factura rectificativa — ¿Sustitución o diferencias?**  
```
SI se anulan TODOS los conceptos de la factura original → Rectificativa por sustitución
SI_NO SI se corrige solo parte (devolver 1 plato de 5) → Rectificativa por diferencias
SI_NO SI es error en datos (NIF incorrecto) → Rectificativa por sustitución
```
- Referencia: RN-016

**POL-004: ¿Debe declararse un proveedor en el Modelo 347?**  
```
SI total operaciones con el proveedor en el año natural (IVA incluido) > 3.005,06€ → SÍ, incluir en 347
SI_NO → NO declarar
```
- Referencia: RN-022
- **Excepción**: SI el establecimiento está en SII → NO presenta 347 (POL-005).

**POL-005: ¿Está obligado el establecimiento al SII?**  
```
SI facturación anual del establecimiento > 6.014.060,10€ → SÍ, obligado a SII
SI_NO SI se opta voluntariamente → SÍ
SI_NO → NO, declaración trimestral normal (303)
```
- Referencia: RN-025

**POL-006: ¿Aplicar recargo de equivalencia?**  
```
SI el titular es persona física (autónomo) Y vende productos sin transformar (tienda) → SÍ, aplicar recargo
SI_NO SI el titular es sociedad (SL, SA) → NO
SI_NO SI la actividad es hostelería/restauración (prestación de servicios) → NO
```
- Referencia: RN-004

**POL-007: Retención del alquiler del local**  
```
SI el local es alquilado → Retener 19% al arrendador y declarar en Modelo 115
SI_NO SI el local es propio → No hay retención de alquiler
EXCEPCIÓN: SI el arrendador tiene más de 10 inmuebles alquilados → No retener
EXCEPCIÓN: SI la renta anual del inmueble < 900€ → No retener
```
- Referencia: RN-024

---

### Trazabilidad

| POL | Skills que la aplican | Reglas | Invariantes | HU relacionadas |
|-----|-----------------------|--------|-------------|-----------------|
| POL-001 | SK-002, SK-003 | RN-001 | — | HU-M1-COB-001 |
| POL-002 | SK-006, SK-007 | RN-010, RN-012 | — | HU-M1-COB-004, HU-M1-COB-005 |
| POL-003 | SK-008 | RN-016 | — | HU-M1-COB-006 |
| POL-004 | SK-043 | RN-022 | — | HU-M3-IMP-003 |
| POL-005 | — | RN-025 | — | HU-M3-IMP-006 |
| POL-006 | — | RN-004 | — | — |
| POL-007 | SK-045, SK-049 | RN-024 | — | HU-M3-IMP-005 |
