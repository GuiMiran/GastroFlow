# CAPA 04 — Índice de Invariantes

> Condiciones que SIEMPRE deben ser verdaderas en cualquier estado del sistema.  
> Si una invariante se viola, el sistema está en estado corrupto.  
> Total: 34 invariantes en 7 dominios.  
> Última revisión: 2026-09-10

---

## Instrucciones para la IA Agéntica

1. **Las invariantes son absolutas** — no se negocian ni se relajan.
2. **Cada sección es un .md independiente** — consume solo el dominio que necesitas.
3. **Si un skill o workflow viola una invariante, se detiene la ejecución.**
4. **Formato**: `INV-XXX: [condición booleana en lenguaje natural]`

---

## Directorio de Secciones

| Sección | Dominio | Archivo | Invariantes | Agentes |
|---------|---------|---------|-------------|---------|
| 04.1 | Fiscales y Facturación | [INV-04.1-fiscales-facturacion.md](INV-04.1-fiscales-facturacion.md) | INV-001 a INV-009 (9) | AG-001, AG-005 |
| 04.2 | Operación Sala / TPV | [INV-04.2-operacion-sala-tpv.md](INV-04.2-operacion-sala-tpv.md) | INV-010 a INV-015 (6) | AG-001 |
| 04.3 | Inventario | [INV-04.3-inventario.md](INV-04.3-inventario.md) | INV-020 a INV-022 (3) | AG-002 |
| 04.4 | Contables | [INV-04.4-contables.md](INV-04.4-contables.md) | INV-030 a INV-033 (4) | AG-004, AG-005 |
| 04.5 | Laborales | [INV-04.5-laborales.md](INV-04.5-laborales.md) | INV-040 a INV-042 (3) | AG-006 |
| 04.6 | CRM / Datos | [INV-04.6-crm-datos.md](INV-04.6-crm-datos.md) | INV-050 a INV-052 (3) | AG-007 |
| 04.7 | Contrato API / Swagger | [INV-04.7-api-contract.md](INV-04.7-api-contract.md) | INV-API-001 a INV-API-006 (6) | Todos |

---

## Resumen por Módulo

| Módulo | Secciones aplicables | Invariantes |
|--------|---------------------|-------------|
| M1-TPV | 04.1, 04.2 | INV-001 a INV-015 (14) |
| M2-ERP | 04.3, 04.5 | INV-020 a INV-022, INV-040 a INV-042 (6) |
| M3-CONTABILIDAD | 04.1, 04.4 | INV-004 a INV-006, INV-030 a INV-033 (7) |
| M4-CRM | 04.6 | INV-050 a INV-052 (3) |
| TODOS | 04.7 | INV-API-001 a INV-API-006 (6) |

---

## Índice Rápido

| Código | Nombre corto | Sección |
|--------|-------------|---------|
| INV-001 | Secuencialidad numeración | 04.1 |
| INV-002 | Integridad total ticket | 04.1 |
| INV-003 | Cuadre IVA por ticket | 04.1 |
| INV-004 | IVA repercutido trimestral | 04.1 |
| INV-005 | IVA soportado trimestral | 04.1 |
| INV-006 | Resultado modelo 303 | 04.1 |
| INV-007 | Inalterabilidad VeriFactu | 04.1 |
| INV-008 | Cadena hash VeriFactu | 04.1 |
| INV-009 | Trazabilidad ticket a asiento | 04.1 |
| INV-010 | Estado mesa coherente | 04.2 |
| INV-011 | Servicio activo → mesa ocupada | 04.2 |
| INV-012 | Comanda ligada a servicio | 04.2 |
| INV-013 | División cuenta cuadra | 04.2 |
| INV-014 | Cobro cubre total | 04.2 |
| INV-015 | Arqueo suma correcta | 04.2 |
| INV-020 | Stock teórico trazable | 04.3 |
| INV-021 | Movimiento con origen | 04.3 |
| INV-022 | Coste escandallo determinista | 04.3 |
| INV-030 | Partida doble cuadra | 04.4 |
| INV-031 | Balance cuadra | 04.4 |
| INV-032 | Libro IVA emitidas coincide | 04.4 |
| INV-033 | Libro IVA recibidas coincide | 04.4 |
| INV-040 | No turnos solapados | 04.5 |
| INV-041 | Descanso 12h entre turnos | 04.5 |
| INV-042 | Horas extra ≤ 80h/año | 04.5 |
| INV-050 | Puntos ≥ 0 | 04.6 |
| INV-051 | Canjeo ≤ saldo | 04.6 |
| INV-052 | Consentimiento antes de comunicación | 04.6 |
| INV-API-001 | Todo endpoint tiene @ApiOperation completo | 04.7 |
| INV-API-002 | Respuestas documentadas con @ApiOkResponse | 04.7 |
| INV-API-003 | Endpoints protegidos tienen @ApiBearerAuth | 04.7 |
| INV-API-004 | DTOs reutilizables en swagger-schemas.ts | 04.7 |
| INV-API-005 | Operaciones fiscales citan invariantes fiscales | 04.7 |
| INV-API-006 | Nuevos tags registrados en main.ts | 04.7 |
