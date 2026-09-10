# CAPA 11 — CRITERIOS DE ACEPTACIÓN

> **⚠️ [DEPRECATED] — Este archivo ha sido reemplazado por la estructura modular.**  
> **Consultar `_index.md` para el directorio actualizado.**  
> **Archivos modulares: AC-11.1 a AC-11.7 (uno por dominio).**  
> **Este archivo se conserva únicamente como referencia histórica.**

> Tests funcionales en lenguaje natural. Formato DADO/CUANDO/ENTONCES.  
> Vinculados a Historias (HU), Reglas (RN), Invariantes (INV).  
> Cubren: camino feliz, errores, casos límite.

---

## 11.1 — Criterios del TPV / Ventas

**AC-001: Cobro simple con IVA correcto** [HU-020, RN-001, RN-002, INV-002]  
DADO que un cliente consume en Mesa 7:
- 1× Tortilla Española (8,00€, IVA 10%)
- 2× Cerveza Artesana (3,50€ c/u, IVA 21%)

CUANDO el camarero cobra en efectivo con 20€  
ENTONCES:
- Total ticket: 15,00€
- Desglose IVA 10%: base 7,27€, cuota 0,73€
- Desglose IVA 21%: base 5,79€, cuota 1,21€
- Cambio: 5,00€
- Total = 7,27 + 0,73 + 5,79 + 1,21 = 15,00€ ✓
- Ticket con número secuencial VeriFactu generado ✓

---

**AC-002: División de cuenta a partes iguales** [HU-021, RN-034, INV-013]  
DADO que Mesa 12 tiene cuenta total de 100,00€ para 3 comensales  
CUANDO el camarero divide a partes iguales  
ENTONCES:
- Ticket 1: 33,33€
- Ticket 2: 33,33€
- Ticket 3: 33,34€
- Suma: 33,33 + 33,33 + 33,34 = 100,00€ ✓
- Cada ticket tiene su propio desglose de IVA correcto ✓

---

**AC-003: División de cuenta por productos con distintos IVA** [HU-021, RN-001, RN-003, INV-013]  
DADO que Mesa 5 tiene:
- Comensal A pidió: 1× Ensalada (9,00€, 10%) + 1× Agua (2,00€, 10%)
- Comensal B pidió: 1× Gin Tonic (9,50€, 21%)

CUANDO dividen por productos  
ENTONCES:
- Ticket A: 11,00€ → base 10% = 10,00€, cuota = 1,00€
- Ticket B: 9,50€ → base 21% = 7,85€, cuota = 1,65€
- Total: 11,00 + 9,50 = 20,50€ = cuenta original ✓

---

**AC-004: Pago mixto (efectivo + tarjeta)** [HU-022, INV-014]  
DADO que la cuenta de Mesa 3 es 50,00€  
CUANDO el cliente paga 20,00€ en efectivo y el resto con tarjeta  
ENTONCES:
- Se registran dos formas de pago: Efectivo 20,00€ + Tarjeta 30,00€
- Total pagado: 50,00€ = total cuenta ✓
- Se genera UN solo ticket por 50,00€
- Asiento: Cargo 5700-Caja (20€) + Cargo 5730-Tarjetas (30€) → Abono 7050-Ventas + Abono 4770-IVA

---

**AC-005: Factura completa solicitada por cliente** [HU-023, RN-012, RN-013]  
DADO que un ticket de 85,00€ ya está cobrado  
CUANDO el cliente solicita factura completa con NIF "B12345678" y razón social "Empresa SL"  
ENTONCES:
- Se genera factura completa con serie propia (ej: "F-2026-000032")
- Incluye: NIF emisor, nombre emisor, NIF destinatario, razón social, dirección
- Desglose completo por tipo IVA
- Referencia al ticket original
- Registrada en libro facturas emitidas

---

**AC-006: Secuencialidad de tickets VeriFactu** [RN-014, RN-017, INV-001, INV-008]  
DADO que el último ticket emitido es V-2026-004521 con hash "abc123..."  
CUANDO se emite el siguiente ticket  
ENTONCES:
- Número: V-2026-004522 (exactamente +1, sin salto)
- El hash del nuevo ticket se calcula incluyendo el hash "abc123..." del anterior
- El registro es inalterable
- No existe V-2026-004521.5 ni se puede insertar nada entre ambos

---

**AC-007: Anulación de ticket ya cobrado** [RN-035, RN-016, INV-007]  
DADO que el ticket V-2026-004522 por 30,00€ ya está cobrado y registrado en VeriFactu  
CUANDO el propietario quiere anularlo (el cliente insiste en que su plato estaba mal)  
ENTONCES:
- El ticket V-2026-004522 NO se elimina ni modifica
- Se emite factura rectificativa R-2026-000015 que referencia a V-2026-004522
- La rectificativa anula el importe (total o parcial)
- Se genera asiento contable de ajuste
- Se ajusta el IVA repercutido del período

---

**AC-008: Arqueo de caja con descuadre** [HU-031, INV-015]  
DADO que el turno tiene:
- Fondo de caja: 200,00€
- Cobros en efectivo del turno: 1.034,00€
- Retirada de efectivo: 500,00€

CUANDO el cajero cuenta 730,00€ en caja y cierra turno  
ENTONCES:
- Efectivo esperado: 200 + 1.034 - 500 = 734,00€
- Efectivo real: 730,00€
- Descuadre: -4,00€
- Se registra el descuadre y se genera informe de turno

---

## 11.2 — Criterios de Inventario

**AC-010: Descuento automático de stock por venta** [HU-050, RN-041, INV-020]  
DADO que:
- Stock de Ginebra: 2.000ml
- Escandallo de Gin Tonic usa 50ml de Ginebra
- Se venden 3 Gin Tonics en un ticket

CUANDO se cobra el ticket  
ENTONCES:
- Stock de Ginebra tras la venta: 2.000 - (3 × 50) = 1.850ml
- Se registran 3 movimientos de salida (o 1 agrupado de 150ml) con referencia al ticket

---

**AC-011: Alerta de stock bajo** [HU-051, POL-021]  
DADO que:
- Stock de Ginebra: 600ml (equivalente a ≈0,85 botellas)
- Stock mínimo configurado: 2 botellas (1.400ml)

CUANDO el stock cae a 600ml tras una venta  
ENTONCES:
- Se genera alerta "Stock bajo: Ginebra — actual 600ml, mínimo 1.400ml"
- La alerta es visible en el backoffice
- Se notifica al encargado de compras

---

**AC-012: Escandallo con merma** [HU-043, RN-042, INV-022]  
DADO que el escandallo de "Ensalada César" necesita:
- 200g de lechuga (merma 15%)
- 50g de pollo (merma 10%)

CUANDO calculo el coste teórico  
ENTONCES:
- Lechuga: 200g / 0,85 = 235g brutos × 0,003€/g = 0,71€
- Pollo: 50g / 0,90 = 55,6g brutos × 0,012€/g = 0,67€
- Coste teórico: 0,71 + 0,67 + ... (otros ingredientes) = total

---

**AC-013: Inventario físico con desviación** [HU-052, OP-022]  
DADO que el sistema dice: Ron Havana stock = 6 botellas  
CUANDO hago inventario físico y cuento 5 botellas  
ENTONCES:
- Desviación: -1 botella (valor: ~18€ a precio de coste)
- El stock del sistema se ajusta a 5 botellas
- Se registra movimiento de ajuste con motivo "inventario físico"
- Aparece en informe de desviaciones

---

## 11.3 — Criterios de Compras

**AC-020: Registro de factura de compra y contabilización** [HU-063, OP-021, INV-033]  
DADO que Makro envía factura FM-34521:
- Base: 850,00€ (IVA 10%)
- IVA: 85,00€
- Total: 935,00€

CUANDO registro la factura en el sistema  
ENTONCES:
- La factura queda registrada y vinculada a Makro
- Se genera asiento: Cargo 6020-Compras (850€) + Cargo 4720-IVA Soportado (85€) → Abono 4000-Proveedores (935€)
- El IVA soportado del trimestre se incrementa en 85,00€
- La factura aparece en el libro de facturas recibidas

---

## 11.4 — Criterios Fiscales

**AC-030: Cálculo del Modelo 303 trimestral** [HU-091, RN-021, INV-006]  
DADO que en el Q1-2026:
- Total IVA repercutido: 15.200€ (de tickets al 10% y 21%)
  - Al 10%: bases 120.000€, cuotas 12.000€
  - Al 21%: bases 15.238€, cuotas 3.200€
- Total IVA soportado deducible: 6.100€

CUANDO genero el borrador del Modelo 303  
ENTONCES:
- Casilla IVA repercutido 10%: base 120.000, cuota 12.000
- Casilla IVA repercutido 21%: base 15.238, cuota 3.200
- Total repercutido: 15.200€
- Total soportado: 6.100€
- Resultado: 15.200 - 6.100 = 9.100€ a ingresar
- Fecha límite: 20 abril 2026

---

**AC-031: Modelo 347 — proveedor supera umbral** [HU-093, RN-022]  
DADO que las compras a Makro en 2026 (IVA incluido) son:
- Q1: 3.500€, Q2: 4.200€, Q3: 3.800€, Q4: 5.100€
- Total: 16.600€ (> 3.005,06€)

CUANDO genero el borrador del Modelo 347  
ENTONCES:
- Makro aparece con NIF, nombre y total 16.600€
- Desglose trimestral: Q1=3.500, Q2=4.200, Q3=3.800, Q4=5.100

---

**AC-032: Modelo 115 — retención alquiler** [HU-095, RN-024, POL-007]  
DADO que el alquiler del local es 2.000€/mes  
CUANDO genero el borrador del Modelo 115 del Q1  
ENTONCES:
- Renta trimestral: 6.000€
- Retención 19%: 1.140€ (3 × 380€)
- Datos del arrendador (NIF, nombre)

---

## 11.5 — Criterios de RRHH

**AC-040: Fichaje y cálculo de horas** [HU-072, RN-050]  
DADO que Juan ficha entrada a las 17:58 y salida a las 02:03  
CUANDO se calcula su jornada  
ENTONCES:
- Horas trabajadas: 8h 05min
- Si su jornada es de 8h → 5 min de horas extra
- Fichaje registrado con hora exacta (cumple RD 8/2019)

---

**AC-041: Conflicto de turno por descanso insuficiente** [INV-041, RN-053, POL-040]  
DADO que Juan tiene turno que termina a las 02:00 del sábado  
CUANDO se intenta asignar turno de sábado que empieza a las 10:00  
ENTONCES:
- Descanso: 8h (de 02:00 a 10:00) < 12h mínimo legal
- El sistema RECHAZA la asignación
- Muestra error: "Descanso insuficiente entre turnos: 8h (mínimo legal: 12h)"

---

**AC-042: Límite de horas extra** [INV-042, RN-052, POL-041]  
DADO que Juan lleva 78 horas extra acumuladas en 2026  
CUANDO trabaja 3 horas extra más  
ENTONCES:
- Horas extra acumuladas: 81h > 80h máximo legal
- Alerta GRAVE: "Juan ha superado el máximo de 80h extra anuales"
- Se bloquea la asignación de turnos que generen más horas extra

---

## 11.6 — Criterios de CRM

**AC-050: Acumulación de puntos** [HU-110, INV-050, POL-030]  
DADO que María (cliente registrada, nivel Bronce, 450 puntos) se identifica al cobrar  
CUANDO su ticket es de 55,00€  
ENTONCES:
- Puntos nuevos: 55
- Saldo total: 505 puntos
- María sube de nivel: Bronce (< 500) → Plata (500-1499)
- Se notifica a María: "¡Has subido a nivel Plata! Ahora disfrutas de 5% descuento"

---

**AC-051: Canjeo de puntos** [HU-111, INV-051]  
DADO que María tiene 505 puntos  
CUANDO canjea 100 puntos  
ENTONCES:
- Descuento generado: 5,00€
- Saldo restante: 405 puntos
- El descuento se aplica en la siguiente compra reduciendo la base imponible (RN-038)

---

**AC-052: Intento de canjeo con puntos insuficientes** [INV-051]  
DADO que María tiene 405 puntos  
CUANDO intenta canjear 500 puntos  
ENTONCES:
- El sistema RECHAZA: "Puntos insuficientes. Saldo: 405. Solicitados: 500"
- No se genera descuento
- Saldo no cambia

---

**AC-053: Comunicación sin consentimiento** [RN-062, INV-052]  
DADO que Carlos se registró pero NO dio consentimiento para comunicaciones comerciales  
CUANDO se ejecuta una campaña de email "2x1 en cócteles"  
ENTONCES:
- Carlos NO recibe el email
- Aparece en lista de "excluidos por falta de consentimiento"
- El sistema registra que se respetó la política LSSI

---

**AC-054: No-show en reserva** [POL-033]  
DADO que María tiene reserva para viernes 21:00 en Mesa 12  
CUANDO son las 21:30 y María no ha llegado ni avisado  
ENTONCES:
- La reserva se marca como "no-show"
- Mesa 12 se libera
- Se registra en ficha de María como no-show
- Se envía email: "Lamentamos que no hayas podido venir. Tu reserva ha sido cancelada"

---

## 11.7 — Criterios de Contabilidad

**AC-060: Asiento automático correcto para venta en efectivo** [HU-080, INV-030]  
DADO un ticket de 55,00€ (base 10%: 40,91€ + IVA 4,09€ | base 21%: 8,26€ + IVA 1,74€) cobrado en efectivo  
CUANDO se genera el asiento automático  
ENTONCES:
- Cargo 5700-Caja: 55,00€
- Abono 7050-Prestación servicios: 49,17€ (40,91 + 8,26)
- Abono 4770-IVA Repercutido: 5,83€ (4,09 + 1,74)
- Verificación: 55,00 = 49,17 + 5,83 ✓ (partida doble cuadra)

---

**AC-061: Asiento de compra con IVA soportado** [HU-081, INV-030]  
DADO factura proveedor de carne: base 200€ + IVA 10% (20€) = 220€  
CUANDO se genera el asiento  
ENTONCES:
- Cargo 6020-Compras materias primas: 200,00€
- Cargo 4720-IVA Soportado: 20,00€
- Abono 4000-Proveedores: 220,00€
- Verificación: 220,00 = 200,00 + 20,00 ✓

---
