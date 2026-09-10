# SPEC-INDEX — Índice Maestro

> Mapa navegable de toda la especificación.  
> Instrucciones para la IA agéntica sobre cómo consumir las specs.  
> Última actualización: 2026-09-10

---

## Instrucciones para la IA Agéntica

### Cómo leer esta especificación

1. **Empieza siempre por este índice** para entender la estructura.
2. **El Glosario (Capa 01) es ley**: usa solo los términos definidos allí.
3. **Las Invariantes (Capa 04) nunca se violan**: son restricciones absolutas.
4. **Las Reglas de Negocio (Capa 03) son obligatorias**: derivan de normativa legal española.
5. **Las Políticas (Capa 06)** resuelven decisiones condicionales.
6. **Los Contratos (Capa 05)** definen qué debe ser cierto antes y después de cada operación.
7. **Los Agentes (Capa 08)** son los roles autónomos que ejecutan. Cada uno tiene skills, eventos e invariantes asignados.
8. **Los Skills (Capa 09)** son las piezas atómicas: nunca inventes skills que no estén aquí.
9. **Los Workflows (Capa 10)** son la orquestación: siguen los pasos exactos definidos.

### Convenciones de IDs

| Prefijo | Capa | Ejemplo |
|---------|------|---------|
| G-XXX | Glosario | G-001 (Mesa) |
| HU-M{n}-{ÁMB}-{seq} | Historias de Usuario | HU-M1-COB-001 (Cobrar mesa) |
| RN-XXX | Reglas de Negocio | RN-001 (Tipos IVA) |
| INV-XXX | Invariantes | INV-001 (Secuencialidad) |
| OP-XXX | Contratos de Operación | OP-004 (CobrarMesa) |
| POL-XXX | Políticas de Decisión | POL-001 (Tipo IVA) |
| EVT-XXX | Eventos de Dominio | EVT-004 (TicketEmitido) |
| AG-XXX | Agentes | AG-001 (AgenteTPV) |
| SK-XXX | Skills | SK-006 (emitir_ticket_verifactu) |
| WF-XXX | Workflows | WF-001 (Servicio completo) |
| AC-XXX | Criterios de Aceptación | AC-001 (Cobro con IVA) |

### Regla de trazabilidad

Todo elemento debe ser trazable:
- Cada **Skill** referencia las **Reglas** e **Invariantes** que aplica.
- Cada **Agente** lista sus **Skills**, **Eventos** e **Invariantes**.
- Cada **Workflow** indica qué **Agentes** y **Skills** usa en cada paso.
- Cada **Criterio de Aceptación** referencia **Historias**, **Reglas** e **Invariantes**.

### Catalogo SDD Spectra

GastroFlow es una demo de implementacion del catalogo SDD de Spectra. La fuente de verdad para la organización, la precedencia documental y el ciclo de cambio está en [SDD-GOVERNANCE.md](SDD-GOVERNANCE.md). Ningún ID se considera canónico hasta que esté publicado en su capa e indexado.

---

## Mapa de Archivos

```
specs/
├── 00-vision/
│   ├── vision-contexto.md          ← Propósito, usuarios, alcance, normativa
│   └── modelo-saas-licencias.md    ← Modelo SaaS, módulos, planes, tenancy, setup wizard
├── 01-glosario/
│   └── glosario-dominio.md         ← 94 términos en 8 contextos
├── 02-historias/
│   ├── historias-usuario.md        ← [DEPRECATED] Archivo original monolítico
│   ├── M0-PLATFORM/
│   │   ├── _index.md               ← Índice M0 (12 historias): SET, ROL, LIC
│   │   ├── M0-SET-setup-onboarding.md ← 4 HU: wizard, admin panel, zonas, auditoría
│   │   ├── M0-ROL-roles-acceso.md  ← 5 HU: PIN, email, empleados, menú dinámico, perfiles
│   │   └── M0-LIC-licencias-modulos.md ← 3 HU: activar módulo, bloqueo, panel licencias
│   ├── M1-TPV/
│   │   ├── _index.md               ← Índice M1 (19 historias)
│   │   ├── M1-SAL-sala-mesas.md    ← 4 HU: zonas, abrir mesa, mover, unir
│   │   ├── M1-CMD-comandas.md      ← 6 HU: tomar, modificadores, KDS, anular
│   │   ├── M1-COB-cobro-facturacion.md ← 6 HU: cobro, dividir, mixto, VeriFactu
│   │   └── M1-CAJ-caja.md          ← 3 HU: turno, arqueo, retiradas
│   ├── M2-ERP/
│   │   ├── _index.md               ← Índice M2 (18 historias)
│   │   ├── M2-CAT-catalogo-escandallos.md ← 4 HU: carta, escandallos, alérgenos
│   │   ├── M2-INV-inventario-stock.md     ← 5 HU: stock auto, alertas, conteo
│   │   ├── M2-COM-compras-proveedores.md  ← 5 HU: proveedores, pedidos, OCR
│   │   └── M2-RRH-recursos-humanos.md    ← 4 HU: empleados, turnos, fichaje
│   ├── M3-CONTABILIDAD/
│   │   ├── _index.md               ← Índice M3 (10 historias)
│   │   ├── M3-ASI-asientos.md      ← 4 HU: asientos venta/compra, libros
│   │   └── M3-IMP-impuestos.md     ← 6 HU: IVA, modelos 303/347/111/115
│   └── M4-CRM/
│       ├── _index.md               ← Índice M4 (12 historias)
│       ├── M4-RES-reservas.md      ← 4 HU: reserva online, mapa, reglas
│       ├── M4-FID-fidelizacion.md  ← 4 HU: puntos, canjeo, niveles
│       └── M4-CMP-comunicaciones.md← 4 HU: promos, cumpleaños, RGPD
├── 03-reglas-negocio/
│   ├── reglas-negocio.md           ← [DEPRECATED] Archivo original monolítico
│   ├── _index.md                   ← Índice de reglas (51 en 9 dominios)
│   ├── RN-03.1-fiscales-iva.md     ← 7 RN: tipos IVA, exenciones, recargo
│   ├── RN-03.2-facturacion.md      ← 9 RN: ticket, simplificada, VeriFactu
│   ├── RN-03.3-modelos-tributarios.md ← 6 RN: 303, 347, 111, 115, SII
│   ├── RN-03.4-operativas-tpv.md   ← 9 RN: arqueo, propinas, anulación
│   ├── RN-03.5-inventario.md       ← 5 RN: stock, escandallos, merma
│   ├── RN-03.6-laborales.md        ← 5 RN: turnos, descanso, horas extra
│   ├── RN-03.7-proteccion-datos.md ← 4 RN: RGPD, consentimiento, derecho olvido
│   ├── RN-03.8-sanitarias.md       ← 2 RN: alérgenos, trazabilidad
│   └── RN-03.9-contables.md        ← 4 RN: partida doble, PGC, libros
├── 04-invariantes/
│   ├── invariantes.md              ← [DEPRECATED] Archivo original monolítico
│   ├── _index.md                   ← Índice de invariantes (34 en 7 dominios)
│   ├── INV-04.1-fiscales-facturacion.md ← 9 INV: numeración, IVA, VeriFactu, asiento
│   ├── INV-04.2-operacion-sala-tpv.md  ← 6 INV: mesas, comandas, cobro, caja
│   ├── INV-04.3-inventario.md          ← 3 INV: stock, movimientos, escandallos
│   ├── INV-04.4-contables.md           ← 4 INV: partida doble, balance, libros IVA
│   ├── INV-04.5-laborales.md           ← 3 INV: turnos, descanso, horas extra
│   └── INV-04.6-crm-datos.md           ← 3 INV: puntos, canjeo, consentimiento
├── 05-contratos/
│   └── contratos-operacion.md      ← ~20 operaciones con PRE/POST/ERROR
├── 06-politicas/
│   ├── politicas-decision.md       ← [DEPRECATED] Archivo original monolítico
│   ├── _index.md                   ← Índice de políticas (27 en 6 dominios)
│   ├── POL-06.1-fiscales-iva.md    ← 7 POL: IVA, factura, SII, recargo
│   ├── POL-06.2-operativas-tpv.md  ← 5 POL: comanda, anulación, redondeo
│   ├── POL-06.3-inventario.md      ← 3 POL: escandallo, stock mínimo, coste
│   ├── POL-06.4-crm-fidelizacion.md← 4 POL: puntos, niveles, cumpleaños
│   ├── POL-06.5-laborales.md       ← 2 POL: conflicto turno, horas extra
│   └── POL-06.9-perfiles-roles-acceso.md ← 6 POL: roles, permisos, login, menú dinámico, auditoría
├── 07-eventos/
│   ├── eventos-dominio.md          ← [DEPRECATED] Archivo original monolítico
│   ├── _index.md                   ← Índice de eventos (24 en 6 dominios)
│   ├── EVT-07.1-sala-tpv.md        ← 7 EVT: mesa, comanda, ticket, pago
│   ├── EVT-07.2-caja.md            ← 2 EVT: turno abierto/cerrado
│   ├── EVT-07.3-inventario-compras.md ← 5 EVT: stock, albarán, pedido
│   ├── EVT-07.4-contables-fiscales.md ← 3 EVT: asiento, modelo, cierre
│   ├── EVT-07.5-rrhh.md            ← 2 EVT: fichaje, turno asignado
│   └── EVT-07.6-crm.md             ← 5 EVT: reserva, puntos, comunicación
├── 08-agentes/
│   ├── agentes.md                  ← [DEPRECATED] Archivo original monolítico
│   ├── _index.md                   ← Índice de agentes (directorio + matriz + flujo eventos)
│   ├── AG-001-agente-tpv.md        ← AgenteTPV (sala, comandas, cobro, caja)
│   ├── AG-002-agente-inventario.md ← AgenteInventario (stock, escandallos)
│   ├── AG-003-agente-compras.md    ← AgenteCompras (proveedores, pedidos, albaranes)
│   ├── AG-004-agente-contable.md   ← AgenteContable (asientos, libros, balance)
│   ├── AG-005-agente-fiscal.md     ← AgenteFiscal (IVA, modelos 303/347/111/115)
│   ├── AG-006-agente-rrhh.md       ← AgenteRRHH (turnos, fichajes, horas)
│   ├── AG-007-agente-crm.md        ← AgenteCRM (reservas, fidelización, promos)
│   ├── AG-008-agente-orquestador.md← AgenteOrquestador (coordina workflows)
│   └── AG-009-agente-documentacion.md ← AgenteDocumentación (trazabilidad specs)
├── 09-skills/
│   ├── skills.md                   ← [DEPRECATED] Archivo original monolítico
│   ├── _index.md                   ← Índice de skills (55 en 8 agentes)
│   ├── SK-09.1-agente-tpv.md       ← 9 SK: sala, comanda, cobro, caja
│   ├── SK-09.2-agente-inventario.md← 7 SK: stock, escandallos, alertas
│   ├── SK-09.3-agente-compras.md   ← 5 SK: proveedores, pedidos, albarán
│   ├── SK-09.4-agente-contable.md  ← 7 SK: asientos, libros, balance
│   ├── SK-09.5-agente-fiscal.md    ← 10 SK: IVA, modelos, SII, VeriFactu
│   ├── SK-09.6-agente-rrhh.md      ← 5 SK: turnos, fichajes, nómina
│   ├── SK-09.7-agente-crm.md       ← 9 SK: reservas, puntos, promos
│   └── SK-09.8-agente-orquestador.md ← 3 SK: orquestar, verificar, dashboard
├── 10-workflows/
│   └── workflows.md                ← 9 workflows orquestados
├── 11-criterios-aceptacion/
│   ├── criterios-aceptacion.md     ← [DEPRECATED] Archivo original monolítico
│   ├── _index.md                   ← Índice de criterios (26 en 7 dominios)
│   ├── AC-11.1-tpv-ventas.md       ← 8 AC: cobro, IVA, ticket, caja
│   ├── AC-11.2-inventario.md       ← 4 AC: descuento stock, alertas, conteo
│   ├── AC-11.3-compras.md          ← 1 AC: recepción albarán
│   ├── AC-11.4-fiscales.md         ← 3 AC: modelos 303, 347, SII
│   ├── AC-11.5-rrhh.md             ← 3 AC: turnos, fichaje, horas extra
│   ├── AC-11.6-crm.md              ← 5 AC: reserva, puntos, comunicación
│   └── AC-11.7-contabilidad.md     ← 2 AC: asiento automático, cierre
├── 12-documentacion/
│   └── documentacion-tecnica.md    ← Arquitectura, API, Frontend, BD, Testing, Trazabilidad
├── SDD-GOVERNANCE.md                ← Catalogo SDD Spectra, fuentes de verdad y ciclo Spec → Test → Código
└── SPEC-INDEX.md                   ← (este archivo)
```

---

## Matriz de Referencias Cruzadas

### Agentes → Skills → Reglas

| Agente | Skills | Reglas principales |
|--------|--------|--------------------|
| AG-001 AgenteTPV | SK-001 a SK-009 | RN-001 a RN-003, RN-010 a RN-017, RN-030 a RN-038 |
| AG-002 AgenteInventario | SK-010 a SK-016 | RN-040 a RN-044 |
| AG-003 AgenteCompras | SK-020 a SK-024 | RN-005 |
| AG-004 AgenteContable | SK-030 a SK-036 | RN-080 a RN-083 |
| AG-005 AgenteFiscal | SK-040 a SK-049 | RN-001 a RN-007, RN-020 a RN-025 |
| AG-006 AgenteRRHH | SK-050 a SK-054 | RN-050 a RN-054 |
| AG-007 AgenteCRM | SK-060 a SK-068 | RN-060 a RN-063, RN-070 |
| AG-008 AgenteOrquestador | SK-070 a SK-072 | Todas (verificador) |
| AG-009 AgenteDocumentacion | Pendiente de catálogo | Gobierno de especificaciones |

### Workflows → Agentes

| Workflow | Agentes involucrados |
|----------|---------------------|
| WF-001 Servicio Mesa | AG-001, AG-002, AG-004, AG-005, AG-007 |
| WF-002 Ciclo Compra | AG-003, AG-002, AG-004, AG-005 |
| WF-003 Cierre Trimestral | AG-005, AG-004, AG-008 |
| WF-004 Cierre Anual | AG-005, AG-004 |
| WF-005 Reserva Completa | AG-007, AG-001 |
| WF-006 Inventario Periódico | AG-002, AG-008 |
| WF-007 Onboarding | AG-008, AG-001 a AG-007 |
| WF-008 Dashboard Diario | AG-001 a AG-008 |
| WF-009 Factura Rectificativa | AG-001, AG-004, AG-005, AG-002, AG-007 |

### Módulos funcionales → Historias → Reglas

| Módulo | Historias | Reglas |
|--------|-----------|--------|
| M0 — Plataforma/SaaS | HU-M0-SET-001 a HU-M0-LIC-003 | POL-070 a POL-075 |
| M1 — TPV/Ventas | HU-001 a HU-032 | RN-001 a RN-017, RN-030 a RN-038 |
| M2 — ERP/Backoffice | HU-040 a HU-073 | RN-040 a RN-054 |
| M3 — Contabilidad/Fiscal | HU-080 a HU-095 | RN-020 a RN-025, RN-080 a RN-083 |
| M4 — CRM/Web | HU-100 a HU-123 | RN-060 a RN-063, RN-070 |

### Invariantes críticas por operación

| Operación | Invariantes que verifica |
|-----------|------------------------|
| Cobrar mesa (OP-004) | INV-001, INV-002, INV-003, INV-007, INV-008, INV-014 |
| Dividir cuenta (OP-005) | INV-013 |
| Arqueo caja (OP-011) | INV-015 |
| Generar asiento (OP-030/031) | INV-030, INV-031 |
| Generar 303 (OP-032) | INV-004, INV-005, INV-006 |
| Descontar stock (OP-023) | INV-020, INV-021 |
| Acumular puntos (OP-041) | INV-050 |
| Canjear puntos | INV-050, INV-051 |
| Enviar comunicación | INV-052 |
| Asignar turno | INV-040, INV-041, INV-042 |

---

## Normativa aplicable (Índice rápido)

| Área | Normativa | Capas que la implementan |
|------|-----------|-------------------------|
| IVA | Ley 37/1992 + RD 1624/1992 | RN-001 a RN-007, POL-001, INV-004 a INV-006 |
| Facturación | RD 1619/2012 | RN-010 a RN-016, POL-002, POL-003 |
| VeriFactu | RD 1007/2023 | RN-017, INV-007, INV-008, SK-006 |
| Factura electrónica | Ley 18/2022 (Crea y Crece) | Visión (fase futura B2B) |
| Modelos tributarios | RIRPF, RIVA | RN-020 a RN-025, SK-042 a SK-049 |
| Contabilidad | Código Comercio, PGC Pymes | RN-080 a RN-083, INV-030, INV-031 |
| Laboral | ET, RD 8/2019 | RN-050 a RN-054, INV-040 a INV-042 |
| Datos | RGPD, LOPD-GDD, LSSI-CE | RN-060 a RN-063, INV-052 |
| Sanitaria | Rglto 852/2004, RD 126/2015 | RN-070, RN-071 |

---

## Métricas de la Especificación

| Métrica | Cantidad |
|---------|----------|
| Términos de glosario | ~94 |
| Historias de usuario | 71 |
| Reglas de negocio | 51 |
| Invariantes | 27 |
| Contratos de operación | ~20 |
| Políticas de decisión | 27 |
| Eventos de dominio | 24 |
| Agentes | 9 |
| Skills | 55 |
| Workflows | 9 |
| Criterios de aceptación | 26 |
| **Total de elementos especificados** | **~400+** |

---
