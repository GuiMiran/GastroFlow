# CAPA 03 — REGLAS DE NEGOCIO — Índice Modular

> Directorio de todas las reglas de negocio organizadas por dominio.  
> Cada archivo contiene las reglas de un dominio temático.  
> **Total**: 51 reglas en 9 dominios.  
> **Fecha**: 2026-03-14

---

## Directorio de Archivos

| Archivo | Dominio | Reglas | Rango |
|---------|---------|--------|-------|
| [RN-03.1-fiscales-iva.md](RN-03.1-fiscales-iva.md) | Fiscal — IVA | 7 | RN-001 a RN-007 |
| [RN-03.2-facturacion.md](RN-03.2-facturacion.md) | Facturación | 9 | RN-010 a RN-018 |
| [RN-03.3-modelos-tributarios.md](RN-03.3-modelos-tributarios.md) | Modelos Tributarios | 6 | RN-020 a RN-025 |
| [RN-03.4-operativas-tpv.md](RN-03.4-operativas-tpv.md) | Operativas TPV | 9 | RN-030 a RN-038 |
| [RN-03.5-inventario-escandallos.md](RN-03.5-inventario-escandallos.md) | Inventario/Escandallos | 5 | RN-040 a RN-044 |
| [RN-03.6-laborales.md](RN-03.6-laborales.md) | Laborales | 5 | RN-050 a RN-054 |
| [RN-03.7-proteccion-datos.md](RN-03.7-proteccion-datos.md) | Protección Datos (RGPD) | 4 | RN-060 a RN-063 |
| [RN-03.8-sanitarias.md](RN-03.8-sanitarias.md) | Sanitarias | 2 | RN-070 a RN-071 |
| [RN-03.9-contables.md](RN-03.9-contables.md) | Contables | 4 | RN-080 a RN-083 |

---

## Matriz Dominio → Agentes → Módulo

| Dominio | Agentes | Módulo principal |
|---------|---------|-----------------|
| Fiscal — IVA | AG-001, AG-005 | M1-TPV, M3-CONTABILIDAD |
| Facturación | AG-001, AG-005 | M1-TPV |
| Modelos Tributarios | AG-005 | M3-CONTABILIDAD |
| Operativas TPV | AG-001 | M1-TPV |
| Inventario/Escandallos | AG-002 | M2-ERP |
| Laborales | AG-006 | M2-ERP |
| Protección Datos | AG-007 | M4-CRM |
| Sanitarias | AG-001, AG-002 | M1-TPV, M2-ERP |
| Contables | AG-004 | M3-CONTABILIDAD |

---

## Índice Rápido — Todas las Reglas

| RN | Descripción corta | Archivo |
|----|-------------------|---------|
| RN-001 | Tipos de IVA hostelería | RN-03.1 |
| RN-002 | IVA incluido en precio B2C | RN-03.1 |
| RN-003 | Desglose IVA por tipo en tickets | RN-03.1 |
| RN-004 | Recargo de equivalencia | RN-03.1 |
| RN-005 | IVA soportado deducible — requisitos | RN-03.1 |
| RN-006 | Criterio de devengo IVA | RN-03.1 |
| RN-007 | Operaciones intracomunitarias | RN-03.1 |
| RN-010 | Factura simplificada ≤3.000€ | RN-03.2 |
| RN-011 | Contenido mínimo ticket | RN-03.2 |
| RN-012 | Factura completa obligatoria | RN-03.2 |
| RN-013 | Contenido factura completa | RN-03.2 |
| RN-014 | Numeración secuencial | RN-03.2 |
| RN-015 | Plazo emisión facturas | RN-03.2 |
| RN-016 | Factura rectificativa | RN-03.2 |
| RN-017 | VeriFactu integridad | RN-03.2 |
| RN-018 | Conservación facturas 6 años | RN-03.2 |
| RN-020 | Modelo 303 plazos | RN-03.3 |
| RN-021 | Modelo 303 cálculo | RN-03.3 |
| RN-022 | Modelo 347 operaciones terceros | RN-03.3 |
| RN-023 | Modelo 111 retenciones IRPF | RN-03.3 |
| RN-024 | Modelo 115 retenciones alquiler | RN-03.3 |
| RN-025 | SII suministro inmediato | RN-03.3 |
| RN-030 | Mesa: un servicio activo | RN-03.4 |
| RN-031 | Comanda ligada a servicio | RN-03.4 |
| RN-032 | Ticket solo al cobrar | RN-03.4 |
| RN-033 | Cobro ≥ 0 | RN-03.4 |
| RN-034 | División cuenta cuadra | RN-03.4 |
| RN-035 | Anulación → rectificativa | RN-03.4 |
| RN-036 | Arqueo obligatorio | RN-03.4 |
| RN-037 | Propinas fuera base IVA | RN-03.4 |
| RN-038 | Descuentos reducen base | RN-03.4 |
| RN-040 | Stock no negativo (alerta) | RN-03.5 |
| RN-041 | Stock descuenta al cobrar | RN-03.5 |
| RN-042 | Escandallo con mermas | RN-03.5 |
| RN-043 | Food cost % | RN-03.5 |
| RN-044 | Precio coste por última factura | RN-03.5 |
| RN-050 | Registro jornada obligatorio | RN-03.6 |
| RN-051 | Jornada máxima convenio | RN-03.6 |
| RN-052 | Máximo 80h extra/año | RN-03.6 |
| RN-053 | Descanso 12h entre jornadas | RN-03.6 |
| RN-054 | Descanso semanal 1,5 días | RN-03.6 |
| RN-060 | Base legal RGPD clientes | RN-03.7 |
| RN-061 | Derecho de supresión | RN-03.7 |
| RN-062 | Consentimiento LSSI | RN-03.7 |
| RN-063 | Datos empleados contrato | RN-03.7 |
| RN-070 | 14 alérgenos obligatorios | RN-03.8 |
| RN-071 | Trazabilidad ingredientes | RN-03.8 |
| RN-080 | Partida doble | RN-03.9 |
| RN-081 | Plan cuentas PGC Pymes | RN-03.9 |
| RN-082 | Ejercicio = año natural | RN-03.9 |
| RN-083 | Libros contables obligatorios | RN-03.9 |
