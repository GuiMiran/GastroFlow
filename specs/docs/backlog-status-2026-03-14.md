# Reporte de Estado del Backlog — GastroFlow

**Fecha**: 2026-03-14 | **Metodología**: CMMI-DEV ML3 / Scrum  
**Proyecto**: GastroFlow SaaS Multitenant — Hostelería española  
**Autor**: Agente IA (revisión automática)

---

## 1. Resumen Ejecutivo

| Indicador | Valor |
|-----------|-------|
| **HU totales especificadas** | **61** |
| **HU implementadas (Done)** | **13** |
| **HU parciales (In Progress)** | **2** |
| **HU en backlog (Not Started)** | **46** |
| **% completado** | **21,3%** |
| **% con algo de trabajo** | **24,6%** |

---

## 2. Desglose por Módulo

| Módulo | HU Total | Done | Parcial | Backlog | % Done | Estado |
|--------|----------|------|---------|---------|--------|--------|
| **M1 — TPV/Ventas** | 20 | 12 | 2 | 6 | 60% | En producción parcial |
| **M2 — ERP/Backoffice** | 18 | 1 | 0 | 17 | 6% | Mínimo viable |
| **M3 — Contabilidad** | 10 | 0 | 0 | 10 | 0% | No iniciado |
| **M4 — CRM/Web** | 13 | 0 | 0 | 13 | 0% | No iniciado |
| **TOTAL** | **61** | **13** | **2** | **46** | **21%** | — |

---

## 3. Detalle por Historia (MoSCoW + Estado)

### M1 — TPV/Ventas (63% completado)

| HU | Nombre | Prioridad | Estado |
|----|--------|-----------|--------|
| HU-M1-SAL-001 | Configurar zonas y mesas | Must | Done |
| HU-M1-SAL-002 | Abrir mesa | Must | Done |
| HU-M1-SAL-003 | Mover servicio de mesa | Should | Backlog |
| HU-M1-SAL-004 | Unir mesas | Should | Backlog |
| HU-M1-CMD-001 | Tomar comanda en mesa | Must | Done |
| HU-M1-CMD-002 | Modificadores de producto | Must | Parcial (backend ok, frontend pending) |
| HU-M1-CMD-003 | KDS cocina | Must | Backlog (iteración 2) |
| HU-M1-CMD-004 | KDS barra | Should | Backlog |
| HU-M1-CMD-005 | Anular línea de comanda | Must | Done |
| HU-M1-CMD-006 | Repetir última comanda | Could | Backlog |
| HU-M1-COB-001 | Cobrar mesa | Must | Done |
| HU-M1-COB-002 | Dividir cuenta | Must | Done |
| HU-M1-COB-003 | Pago mixto | Must | Done |
| HU-M1-COB-004 | Factura completa | Must | Done |
| HU-M1-COB-005 | Descuentos e invitaciones | Should | Backlog |
| HU-M1-COB-006 | Ticket VeriFactu | Must | Done |
| HU-M1-COB-007 | Compartir ticket / Imprimir factura | Should | Backlog (utils implementados) |
| HU-M1-CAJ-001 | Abrir turno de caja | Must | Done |
| HU-M1-CAJ-002 | Arqueo y cierre | Must | Done |
| HU-M1-CAJ-003 | Retiradas de caja | Should | Done |

### M2 — ERP/Backoffice (6% completado)

| HU | Nombre | Prioridad | Estado |
|----|--------|-----------|--------|
| HU-M2-CAT-001 | Alta de productos en carta | Must | Parcial (CRUD básico) |
| HU-M2-CAT-002 | Escandallo / ficha técnica | Must | Backlog |
| HU-M2-CAT-003 | Alérgenos de productos | Must | Backlog (data model existe) |
| HU-M2-CAT-004 | Mermas por ingrediente | Should | Backlog |
| HU-M2-INV-001 | Descuento automático de stock | Must | Backlog |
| HU-M2-INV-002 | Alertas de stock mínimo | Must | Backlog |
| HU-M2-INV-003 | Inventario manual (conteo) | Must | Backlog |
| HU-M2-INV-004 | Informe de desviaciones | Should | Backlog |
| HU-M2-INV-005 | Traspaso entre almacenes | Should | Backlog |
| HU-M2-COM-001 | Alta de proveedores | Must | Backlog |
| HU-M2-COM-002 | Pedido a proveedor | Must | Backlog |
| HU-M2-COM-003 | Recepción albarán | Must | Backlog |
| HU-M2-COM-004 | Facturas de proveedores | Must | Backlog |
| HU-M2-COM-005 | OCR de facturas | Could | Backlog |
| HU-M2-RRH-001 | Alta de empleados | Must | Backlog |
| HU-M2-RRH-002 | Cuadrantes de turnos | Must | Backlog |
| HU-M2-RRH-003 | Fichaje entrada/salida | Must | Backlog |
| HU-M2-RRH-004 | Informe horas y extras | Should | Backlog |

### M3 — Contabilidad (0% completado)

| HU | Nombre | Prioridad | Estado |
|----|--------|-----------|--------|
| HU-M3-ASI-001 | Asiento automático por venta | Must | Not Started |
| HU-M3-ASI-002 | Asiento automático por compra | Must | Not Started |
| HU-M3-ASI-003 | Revisar y ajustar asientos | Should | Not Started |
| HU-M3-ASI-004 | Consultar libros contables | Must | Not Started |
| HU-M3-IMP-001 | Dashboard IVA en tiempo real | Must | Not Started |
| HU-M3-IMP-002 | Borrador Modelo 303 | Must | Not Started |
| HU-M3-IMP-003 | Libros Registro facturas | Must | Not Started |
| HU-M3-IMP-004 | Borrador Modelo 347 | Should | Not Started |
| HU-M3-IMP-005 | Borrador Modelo 111 | Should | Not Started |
| HU-M3-IMP-006 | Borrador Modelo 115 | Should | Not Started |

### M4 — CRM/Web (0% completado)

| HU | Nombre | Prioridad | Estado |
|----|--------|-----------|--------|
| HU-M4-RES-001 | Reserva online | Must | Not Started |
| HU-M4-RES-002 | Reservas en mapa de mesas | Must | Not Started |
| HU-M4-RES-003 | Reglas de reservas | Should | Not Started |
| HU-M4-RES-004 | Recordatorio automático | Should | Not Started |
| HU-M4-FID-001 | Acumular puntos | Must | Not Started |
| HU-M4-FID-002 | Canjear puntos | Should | Not Started |
| HU-M4-FID-003 | Niveles de fidelización | Should | Not Started |
| HU-M4-FID-004 | Historial consumo cliente | Must | Not Started |
| HU-M4-FID-005 | Ticket vinculado a cuenta cliente | Must | Not Started |
| HU-M4-CMP-001 | Promociones personalizadas | Should | Not Started |
| HU-M4-CMP-002 | Felicitación cumpleaños | Could | Not Started |
| HU-M4-CMP-003 | Carta digital | Should | Not Started |
| HU-M4-CMP-004 | Baja RGPD/LSSI | Must | Not Started |

---

## 4. Análisis por Prioridad MoSCoW

| Prioridad | Total | Done | % Done | Pendiente |
|-----------|-------|------|--------|-----------|
| **Must** | 41 | 12 | 29% | 29 |
| **Should** | 16 | 1 | 6% | 15 |
| **Could** | 4 | 0 | 0% | 4 |

> **Deuda de Must**: 29 historias obligatorias sin implementar. Riesgo alto para MVP.

---

## 5. Cobertura Técnica Actual

| Capa | Implementado | Pendiente |
|------|-------------|-----------|
| **Prisma schema** | 40+ modelos (M1-M4 completos) | Migraciones M2/M3/M4 no probadas en producción |
| **Backend NestJS** | 5 controllers, 4 services (M1) | Faltan 14+ controllers para M2/M3/M4 |
| **Frontend React** | 5 páginas (Sala, Comanda, Cobro, Caja, Setup) | Faltan ~15 páginas (KDS, Inventario, Compras, RRHH, Contabilidad, CRM) |
| **Tests (Jest)** | 19/19 passing (AC-001 a AC-008, M1) | 0 tests para M2/M3/M4 |
| **Eventos dominio** | EventEmitter configurado | Solo M1 emite eventos |

---

## 6. Cobertura Especificación vs Implementación

| Artefacto spec | Especificados | Usados en código | Cobertura |
|---------------|---------------|-----------------|-----------|
| Reglas de negocio | 51 | ~15 (M1) | 29% |
| Invariantes | 28 | ~10 (M1) | 36% |
| Políticas decisión | 21 | ~7 (fiscal/TPV) | 33% |
| Eventos dominio | 24 | ~8 (M1) | 33% |
| Skills | 57 | ~12 (AG-001) | 21% |
| Criterios aceptación | 26 | 8 (M1 tests) | 31% |

---

## 7. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Runtime | Node.js | ≥18 |
| Backend | NestJS | 11.1.16 |
| Lenguaje | TypeScript | 5.9.3 |
| Base de datos | PostgreSQL | 16 (Docker) |
| ORM | Prisma | 7.5.0 |
| Frontend | React | 19.2.4 |
| Bundler | Vite | 8.0.0 |
| Router | React Router | 7.13.1 |
| Testing | Jest | 30.3.0 |
| Event Bus | @nestjs/event-emitter | 3.0.1 |

---

## 8. Deuda Técnica y Riesgos

| Riesgo | Impacto | Mitigación sugerida |
|--------|---------|---------------------|
| M3 Contabilidad sin empezar | Alto — obligación legal fiscal | Priorizar M3-ASI + M3-IMP en siguiente iteración |
| KDS (CMD-003/004) no existe | Medio — flujo cocina/barra manual | Implementar antes de piloto real |
| M2-ERP casi vacío | Alto — sin inventario no hay control de costes | Implementar INV + COM como segundo bloque |
| Frontend solo 5 páginas | Medio — UX limitada | Implementar siguiendo mismo patrón existente |
| Tests solo M1 | Alto — regresiones silenciosas | Añadir AC para cada módulo al implementar |

---

## 9. Roadmap Sugerido (por iteraciones)

```
Iteración 1 (actual) ─── M1-TPV Core ──────────── ✅ 63% DONE
  └─ Pendiente: CMD-002 frontend, CMD-003 KDS, SAL-003/004

Iteración 2 ─────────── M2-ERP Catálogo + Inventario
  └─ CAT-001..004, INV-001..003 (7 Must HU)

Iteración 3 ─────────── M2-ERP Compras + RRHH
  └─ COM-001..004, RRH-001..003 (7 Must HU)

Iteración 4 ─────────── M3-Contabilidad
  └─ ASI-001..004, IMP-001..003 (7 Must HU)

Iteración 5 ─────────── M4-CRM + Fiscal avanzado
  └─ RES-001..002, FID-001/004, CMP-004, IMP-004..006

Iteración 6 ─────────── Polish + Should/Could
  └─ Descuentos, OCR, carta digital, promos, niveles
```

---

## 10. Conclusión

El módulo M1-TPV tiene una base sólida (63%) con lógica fiscal VeriFactu correcta y 19 tests pasando. El Prisma schema cubre los 4 módulos, lo que facilita la expansión. La deuda principal son las **27 HU Must pendientes** — especialmente M3-Contabilidad (obligación legal). El siguiente paso lógico es completar M1 (KDS) y atacar M2-ERP (Catálogo + Inventario).

---

> *Generado automáticamente por el Agente de Documentación (AG-009)*  
> *Próxima revisión sugerida: al completar cada iteración*
