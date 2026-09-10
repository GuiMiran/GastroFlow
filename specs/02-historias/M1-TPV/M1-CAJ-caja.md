# M1-CAJ — Historias de Usuario: Caja y Turnos

> **Módulo**: M1-TPV  
> **Ámbito**: CAJ — Apertura/cierre de caja, arqueos, retiradas  
> **Agente responsable**: AG-002 (AgenteCaja)  
> **Estado**: Implementado (iteración 1)  
> **Última revisión**: 2026-03-14

---

## HU-M1-CAJ-001 | Abrir turno de caja | Must

**COMO** cajero  
**QUIERO** abrir turno de caja declarando el fondo  
**PARA** empezar a operar con un fondo de caja conocido.

**Criterios de aceptación:**

- **AC-01**: DADO que la caja está cerrada CUANDO declaro un fondo de 200€ ENTONCES se abre un nuevo turno con importe fondo_apertura = 200€ y estado "abierto".
- **AC-02**: DADO que ya existe un turno abierto en esa caja CUANDO intento abrir otro turno ENTONCES se rechaza la apertura (solo un turno abierto por caja).

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Reglas | RN-040 (un turno abierto por caja) |
| Invariantes | INV-009 (turno_caja abierto = exactamente uno por punto) |
| Contratos | OP-010 (AbrirTurnoCaja: PRE no hay turno abierto) |
| Skills | SK-009 (apertura_turno_caja) |
| Eventos | EVT-006 (TurnoCajaAbierto) |

**Estado implementación:**
- Backend: `CajaService.abrirTurno()` → `POST /caja/abrir`
- Frontend: `CajaPage.tsx` — formulario apertura con campo fondo

---

## HU-M1-CAJ-002 | Arqueo y cierre | Must

**COMO** cajero  
**QUIERO** hacer el arqueo y cerrar el turno  
**PARA** cuadrar la caja al final de mi jornada.

**Criterios de aceptación:**

- **AC-01**: DADO que el turno tiene venta efectivo = 350€ y fondo = 200€ CUANDO declaro conteo efectivo de 540€ ENTONCES la diferencia es -10€ (descuadre) y se registra con el cierre.
- **AC-02**: DADO que cierro turno CUANDO confirmo el arqueo ENTONCES se genera resumen con: fondo, ventas efectivo, ventas tarjeta, retiradas, diferencia, y el turno pasa a "cerrado".

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Invariantes | INV-010 (fondo + ventas_efectivo – retiradas = esperado) |
| Contratos | OP-011 (CerrarTurnoCaja: PRE turno abierto + conteo declarado) |
| Skills | SK-010 (arqueo_cierre_turno) |
| Eventos | EVT-007 (TurnoCajaCerrado) |

**Estado implementación:**
- Backend: `CajaService.cerrarTurno()` → `POST /caja/cerrar`
- Frontend: `CajaPage.tsx` — sección arqueo con conteo y resumen

---

## HU-M1-CAJ-003 | Retiradas de caja | Should

**COMO** encargado  
**QUIERO** registrar retiradas de efectivo del cajón  
**PARA** mantener un nivel seguro de efectivo y tener trazabilidad.

**Criterios de aceptación:**

- **AC-01**: DADO que hay 500€ en caja CUANDO registro una retirada de 200€ con motivo "ingreso en banco" ENTONCES el esperado de caja baja a 300€ y queda registrada la retirada con fecha/hora, importe y motivo.

**Trazabilidad:**
| Tipo | Referencia |
|------|-----------|
| Contratos | OP-012 (RegistrarRetirada: PRE importe > 0, turno abierto) |
| Invariantes | INV-010 |

**Estado implementación:**
- Backend: `CajaService.registrarRetirada()` → `POST /caja/retirada`
