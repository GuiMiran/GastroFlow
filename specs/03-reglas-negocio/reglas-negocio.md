# CAPA 03 — REGLAS DE NEGOCIO

> **⚠️ [DEPRECATED] — Este archivo ha sido reemplazado por la estructura modular.**  
> **Consultar `_index.md` para el directorio actualizado.**  
> **Archivos modulares: RN-03.1 a RN-03.9 (uno por dominio).**  
> **Este archivo se conserva únicamente como referencia histórica.**

> Formato: `RN-XXX: [Regla]`  
> Cada regla con: Fuente normativa, Ejemplos, Excepciones  
> Clasificación: Fiscal, Facturación, Operativa, Laboral, Datos, Sanitaria

---

## 03.1 — Reglas Fiscales — IVA

**RN-001: Tipos de IVA en Hostelería**  
Los productos vendidos en un establecimiento de hostelería en España peninsular + Baleares tributan al tipo de IVA correspondiente a su naturaleza.

| Tipo | Porcentaje | Aplica a | Fuente |
|------|-----------|----------|--------|
| General | 21% | Bebidas alcohólicas (cerveza, vino, licores, combinados, cócteles), tabaco, servicios no alimentarios | Art. 90 Ley 37/1992 |
| Reducido | 10% | Alimentos y bebidas no alcohólicas servidos en restauración (comidas, refrescos, cafés, agua, zumos). Incluye servicio de restaurante como prestación de servicios | Art. 91.Uno.2.2º Ley 37/1992 |
| Superreducido | 4% | Pan común, harinas, leche, quesos, huevos, frutas, verduras, legumbres, cereales y tubérculos naturales — **solo cuando se venden como producto (no elaborado en restaurante)** | Art. 91.Dos Ley 37/1992 |
| Exento | 0% | Seguros, servicios financieros — **no aplica habitualmente en hostelería** | Art. 20 Ley 37/1992 |

- **Excepción**: Los alimentos para llevar (take-away) sin servicio de mesa tributan al tipo del producto (4% o 10% según naturaleza) y no como servicio de restauración.

**RN-002: El IVA se incluye en el precio mostrado al consumidor final**  
En operaciones B2C (venta directa a consumidor), el precio de carta INCLUYE IVA. La base imponible se calcula hacia atrás: `base = precio / (1 + tipo_iva)`.

- Fuente: Art. 11 RD 2505/1983 (información al consumidor).
- Ejemplo: Cerveza a 3,50€ (IVA incluido 21%) → base = 3,50 / 1,21 = 2,89€, cuota IVA = 0,61€.
- Ejemplo: Tortilla a 8,00€ (IVA incluido 10%) → base = 8,00 / 1,10 = 7,27€, cuota IVA = 0,73€.

**RN-003: Tickets con varios tipos de IVA deben desglosar cada tipo**  
Cuando un ticket incluye productos con distintos tipos de IVA, el desglose debe mostrar cada base imponible y cuota por separado.

- Fuente: Art. 6 RD 1619/2012.
- Ejemplo: Ticket con comida (10%) y cerveza (21%) → desglose: base 10% = X, cuota 10% = Y, base 21% = Z, cuota 21% = W.

**RN-004: Recargo de Equivalencia**  
Los establecimientos cuyo titular es una persona física (autónomo) en régimen de comercio minorista pueden estar sujetos a recargo de equivalencia en sus compras, que es un IVA adicional no deducible.

| IVA | Recargo |
|-----|---------|
| 21% | 5,2% |
| 10% | 1,4% |
| 4% | 0,5% |

- Fuente: Arts. 148-163 Ley 37/1992.
- **Excepción**: La mayoría de hostelería NO aplica recargo de equivalencia porque se considera actividad de prestación de servicios, no comercio minorista. Solo aplica si vende productos sin transformación (ej: tienda de alimentación anexa).

**RN-005: IVA soportado deducible — Requisitos**  
El IVA pagado en facturas de proveedores solo es deducible si:
1. Está directamente vinculado a la actividad económica.
2. Se dispone de factura original completa a nombre del titular del negocio.
3. Está registrado en el Libro de Facturas Recibidas.
4. Se declara dentro de los 4 años desde el devengo.

- Fuente: Arts. 92-114 Ley 37/1992.
- Ejemplo deducible: Factura de proveedor de carne para el restaurante.
- Ejemplo NO deducible: Factura de restaurante personal del propietario sin justificación empresarial.

**RN-006: Criterio de devengo del IVA en hostelería**  
El IVA se devenga en el momento de la prestación del servicio, que en hostelería coincide con el momento del cobro/cierre del ticket.

- Fuente: Art. 75.Uno.2º Ley 37/1992.
- **Nota**: No confundir con el momento de tomar la comanda (ahí no hay devengo todavía).

**RN-007: Operaciones intracomunitarias**  
Si el establecimiento adquiere bienes a proveedores de otros países de la UE (ej: vino de Francia):
- El proveedor factura sin IVA si el establecimiento tiene NIF-IVA intracomunitario.
- El establecimiento debe declarar la adquisición intracomunitaria e ingresar el IVA español (autorrepercusión).
- Se declara en el Modelo 349.

- Fuente: Arts. 13-16 Ley 37/1992.

---

## 03.2 — Reglas de Facturación

**RN-010: Factura simplificada (ticket) en hostelería**  
Los establecimientos de hostelería pueden emitir factura simplificada (ticket) cuando el importe no supere **3.000€** (límite sectorial para hostelería, superior al general de 400€).

- Fuente: Art. 4.2.c RD 1619/2012.
- No requiere datos del destinatario.

**RN-011: Contenido mínimo de la factura simplificada (ticket)**  
Toda factura simplificada debe incluir:
1. Número secuencial dentro de su serie.
2. Fecha de emisión.
3. NIF y nombre/razón social del emisor.
4. Descripción de los bienes/servicios.
5. Tipo impositivo aplicado (o indicación de "IVA incluido").
6. Contraprestación total.

- Fuente: Art. 7 RD 1619/2012.

**RN-012: Factura completa — Cuándo es obligatoria**  
Se debe emitir factura completa (no simplificada) cuando:
1. El cliente la solicita expresamente.
2. El importe supera 3.000€.
3. Se realiza una entrega intracomunitaria.
4. El destinatario es una Administración Pública.

- Fuente: Art. 2 y 6 RD 1619/2012.

**RN-013: Contenido de la factura completa**  
Además de lo requerido para simplificada, debe incluir:
1. Datos completos del destinatario (nombre, NIF, dirección).
2. Base imponible por cada tipo de IVA.
3. Cuota tributaria por cada tipo de IVA.
4. Tipo impositivo aplicado.

- Fuente: Art. 6 RD 1619/2012.

**RN-014: Numeración secuencial obligatoria**  
Las facturas (completas y simplificadas) deben numerarse de forma secuencial dentro de cada serie, sin saltos ni huecos. Puede haber múltiples series.

- Fuente: Art. 6.1.a RD 1619/2012.
- **Regla**: Si el último ticket es V-2026-001234, el siguiente DEBE ser V-2026-001235.

**RN-015: Plazo de emisión de facturas**  
Las facturas deben emitirse en el momento de la operación (en hostelería, al cobrar). En operaciones B2B, antes del día 16 del mes siguiente al devengo.

- Fuente: Art. 11 RD 1619/2012.

**RN-016: Factura rectificativa**  
Si hay que corregir una factura ya emitida (error en datos, devolución parcial, etc.), se emite una factura rectificativa que:
1. Lleva serie propia (ej: serie "R").
2. Hace referencia a la factura original.
3. Puede ser por sustitución (reemplaza) o por diferencias (corrige la diferencia).

- Fuente: Art. 15 RD 1619/2012.

**RN-017: VeriFactu — Integridad de registros de facturación**  
El sistema de facturación debe cumplir los requisitos de VeriFactu (RD 1007/2023):
1. **Inalterabilidad**: Los registros de facturación no pueden modificarse una vez generados.
2. **Trazabilidad**: Cada registro incluye hash SHA-256 encadenado al registro anterior.
3. **Accesibilidad**: Los registros deben poder enviarse a la AEAT si se requiere.
4. **Conservación**: Mínimo 4 años en formato legible.
5. **Declaración responsable**: El software debe declarar cumplimiento VeriFactu.

- Fuente: RD 1007/2023 arts. 8-14.

**RN-018: Conservación de facturas**  
Todas las facturas emitidas y recibidas deben conservarse:
- **4 años** (plazo de prescripción fiscal, art. 66 LGT).
- **6 años** (obligación mercantil, art. 30 Código de Comercio).
- En la práctica: **conservar 6 años** para cumplir ambas obligaciones.

---

## 03.3 — Reglas de Modelos Tributarios

**RN-020: Modelo 303 — Plazos de presentación**  
| Período | Plazo |
|---------|-------|
| 1T (enero-marzo) | 1-20 abril |
| 2T (abril-junio) | 1-20 julio |
| 3T (julio-septiembre) | 1-20 octubre |
| 4T (octubre-diciembre) | 1-30 enero año siguiente |

- Fuente: Art. 71 Reglamento IVA.
- **Alerta**: El sistema debe avisar al propietario 15 días antes del vencimiento.

**RN-021: Modelo 303 — Cálculo**  
`Resultado = IVA Repercutido total del trimestre - IVA Soportado deducible del trimestre`
- Si resultado > 0: a ingresar.
- Si resultado < 0: a compensar en trimestres siguientes (o solicitar devolución en 4T).

**RN-022: Modelo 347 — Operaciones con terceros**  
Deben declararse las operaciones con cualquier proveedor o cliente que superen **3.005,06€** en el año natural (IVA incluido), desglosadas por trimestre.

- Fuente: Arts. 31-35 RGAT.
- No se declaran operaciones ya informadas en el SII.

**RN-023: Modelo 111 — Retenciones IRPF**  
Se presentan trimestralmente las retenciones practicadas a:
- Empleados (nóminas): tipo según tabla de retención estatal.
- Profesionales (ej: gestor externo): 15% general, 7% nuevos profesionales.

- Fuente: Art. 108 Reglamento IRPF.

**RN-024: Modelo 115 — Retenciones alquileres**  
Si el local es alquilado, el arrendatario (restaurante) debe retener el **19%** del alquiler y ingresarlo trimestralmente.

- Fuente: Art. 100 Reglamento IRPF.
- Ejemplo: Alquiler 2.000€/mes → retención 380€/mes → M115 trimestral 1.140€.
- **Excepción**: No retención si el arrendador alquila más de 10 inmuebles o si la renta anual por inmueble es <900€.

**RN-025: SII — Suministro Inmediato de Información**  
Obligatorio para establecimientos con facturación >6.014.060,10€. En ese caso:
- Las facturas emitidas se comunican en 4 días (8 días primer semestre de vigencia).
- Las facturas recibidas se comunican en 4 días.
- No se presenta modelo 347 ni 390.

- Fuente: RD 596/2016.

---

## 03.4 — Reglas Operativas del TPV

**RN-030: Una mesa solo puede tener UN servicio activo a la vez**  
No se pueden abrir dos servicios simultáneos en la misma mesa.

**RN-031: Una comanda siempre pertenece a un servicio de mesa**  
No pueden existir comandas huérfanas (sin mesa/servicio asociado). Excepción: comanda de barra (servicio especial "barra" sin mesa).

**RN-032: Un ticket/factura se genera SOLO al cobrar**  
No se genera documento fiscal hasta que se realiza el cobro. Las comandas no son documentos fiscales.

**RN-033: El cobro total de un servicio debe ser >= 0**  
No se puede cobrar un importe negativo. Las devoluciones se gestionan con facturas rectificativas.

**RN-034: División de cuenta — La suma de las partes debe igualar el total**  
Si una cuenta de 100€ se divide en N tickets, la suma exacta de los N tickets debe ser 100,00€ (sin diferencias por redondeo mal gestionado).

**RN-035: Anulación de ticket ya cobrado requiere factura rectificativa**  
Un ticket ya emitido y registrado en VeriFactu NO puede eliminarse. Si hay que corregirlo, se emite una factura rectificativa que anula total o parcialmente el original.

**RN-036: Arqueo de caja obligatorio al cerrar turno**  
Todo turno de caja debe cerrarse con un arqueo. El sistema registra el descuadre positivo o negativo.

**RN-037: Las propinas NO forman parte de la base imponible del IVA**  
Las propinas voluntarias del cliente no se incluyen en el ticket ni se les aplica IVA (no son contraprestación por servicio).

- Fuente: Consulta vinculante DGT V0418-16.

**RN-038: Descuentos y su efecto en la base imponible**  
Los descuentos que se aplican en el momento de la operación reducen la base imponible. El IVA se calcula DESPUÉS del descuento.

- Ejemplo: Menú 20€ con 10% descuento → base = (20 - 2) / 1,10 = 16,36€, IVA = 1,64€.
- Fuente: Art. 78.Tres Ley 37/1992.

---

## 03.5 — Reglas de Inventario y Escandallos

**RN-040: El stock nunca puede ser negativo**  
Si una venta requiere ingredientes que no hay en stock, el sistema permite la venta (no bloquea al cliente esperando) pero genera alerta de stock negativo para revisión inmediata.

**RN-041: El descuento de stock se realiza al cobrar el ticket, no al tomar la comanda**  
Los ingredientes se descuentan del inventario cuando el servicio se cobra, no cuando se toman las comandas (porque una comanda puede anularse).

**RN-042: El coste teórico de un producto = suma de (cantidad_ingrediente × precio_coste_ingrediente) + mermas**  
El cálculo de escandallo incluye la merma de cada ingrediente.

- Ejemplo: Si la lechuga tiene merma 15% y necesito 200g netos, el escandallo calcula 235g brutos × precio/g.

**RN-043: El food cost se expresa como porcentaje: (coste_teórico / PVP_sin_IVA) × 100**  
Es el indicador clave de rentabilidad por producto.

**RN-044: Los precios de coste se actualizan con la última factura de compra recibida**  
Cuando se registra una nueva factura de proveedor, los precios de coste de los ingredientes afectados se actualizan y los escandallos se recalculan.

---

## 03.6 — Reglas Laborales

**RN-050: Registro de jornada obligatorio**  
Todos los empleados deben fichar inicio y fin de jornada diaria. El registro debe conservarse 4 años.

- Fuente: RD-Ley 8/2019 art. 34.9 ET.

**RN-051: Jornada máxima según convenio de hostelería**  
La jornada se rige por el convenio colectivo provincial de hostelería aplicable. Generalmente la jornada anual es de 1.800h (varía por convenio).

**RN-052: Horas extra — Máximo 80 horas/año**  
No se pueden superar 80 horas extra anuales por empleado (salvo fuerza mayor).

- Fuente: Art. 35.2 ET.

**RN-053: Descanso mínimo entre jornadas: 12 horas**  
Entre el final de una jornada y el inicio de la siguiente deben transcurrir al menos 12 horas.

- Fuente: Art. 34.3 ET.

**RN-054: Descanso semanal: mínimo día y medio ininterrumpido**  
Puede acumularse por períodos de 14 días.

- Fuente: Art. 37.1 ET.

---

## 03.7 — Reglas de Protección de Datos

**RN-060: Datos de clientes requieren base legal RGPD**  
El tratamiento de datos personales de clientes (CRM, fidelización) requiere:
- Consentimiento explícito para comunicaciones comerciales.
- Interés legítimo o ejecución de contrato para gestión de reservas.
- Información clara sobre finalidad, derechos y responsable.

- Fuente: Art. 6 RGPD.

**RN-061: Derecho de supresión (olvido)**  
El cliente puede solicitar la eliminación de todos sus datos personales. Se eliminan datos de CRM, fidelización e historial. Los datos de facturas emitidas NO se eliminan (obligación fiscal de conservación).

- Fuente: Art. 17 RGPD + art. 29 RD 1619/2012 (conservación facturas).

**RN-062: Comunicaciones comerciales — Consentimiento previo LSSI**  
No se pueden enviar emails/SMS comerciales sin consentimiento previo, expreso, libre e informado del destinatario.

- Fuente: Art. 21 LSSI-CE.
- **Excepción**: Clientes que ya compraron pueden recibir comunicaciones de productos similares (art. 21.2 LSSI) con opción de baja.

**RN-063: Datos de empleados — Base legal contrato laboral**  
El tratamiento de datos de empleados (fichajes, nóminas, turnos) tiene como base legal la ejecución del contrato laboral y el cumplimiento de obligaciones legales.

- Fuente: Art. 6.1.b y 6.1.c RGPD.

---

## 03.8 — Reglas Sanitarias

**RN-070: Declaración obligatoria de los 14 alérgenos**  
Todo producto vendido debe informar de la presencia de los 14 alérgenos regulados por la UE. Esta información debe estar disponible:
1. En la carta (física o digital).
2. Para el camarero al tomar comanda (alerta en TPV).

- Fuente: Reglamento (UE) 1169/2011, RD 126/2015.
- Los 14 alérgenos: Gluten, Crustáceos, Huevos, Pescado, Cacahuetes, Soja, Lácteos, Frutos de cáscara, Apio, Mostaza, Sésamo, Sulfitos, Altramuces, Moluscos.

**RN-071: Trazabilidad de ingredientes**  
Se debe poder rastrear el origen de cada ingrediente hasta el proveedor y lote de compra.

- Fuente: Reglamento (CE) 178/2002 art. 18.

---

## 03.9 — Reglas Contables

**RN-080: Principio de partida doble**  
Todo asiento contable debe tener cargo(s) y abono(s) que sumen exactamente el mismo importe. La suma de cargos SIEMPRE = suma de abonos.

- Fuente: PGC pymes, marco conceptual.

**RN-081: Plan de cuentas — PGC Pymes**  
La contabilidad se estructura según el Plan General Contable para Pymes (RD 1515/2007). Cuentas relevantes para hostelería:

| Cuenta | Descripción | Uso habitual |
|--------|------------|-------------|
| 4000 | Proveedores | Deudas con proveedores |
| 4300 | Clientes | Créditos a clientes (ventas a crédito) |
| 4720 | HP IVA soportado | IVA pagado en compras |
| 4770 | HP IVA repercutido | IVA cobrado en ventas |
| 5700 | Caja | Efectivo en caja |
| 5720 | Bancos | Saldos bancarios |
| 5730 | Bancos c/c tarjetas | Cobros por tarjeta |
| 6000 | Compra de mercaderías | Compras a proveedores |
| 6020 | Compras de materias primas | Ingredientes |
| 6210 | Arrendamientos | Alquiler del local |
| 6400 | Sueldos y salarios | Nóminas |
| 6420 | SS a cargo empresa | Cotización SS |
| 7000 | Ventas de mercaderías | Ventas directas |
| 7050 | Prestaciones de servicios | Servicios de restauración |

**RN-082: Ejercicio contable = año natural**  
Para la mayoría de negocios hosteleros, el ejercicio contable coincide con el año natural (1 enero — 31 diciembre).

- Fuente: Art. 26 Código de Comercio.

**RN-083: Libros contables obligatorios**  
Todo establecimiento debe mantener:
1. Libro Diario (asientos cronológicos).
2. Libro de Inventarios y Cuentas Anuales (balance + PyG al cierre).

- Fuente: Art. 25 Código de Comercio.

---
