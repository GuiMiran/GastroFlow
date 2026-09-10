# PROMPT MAESTRO — GastroFlow

> Usa este prompt para generar la implementación completa del sistema.
> Incluye toda la especificación condensada y las instrucciones de generación.

---

## 0. VARIABLE DE CONFIGURACIÓN

| Variable | Valor |
|----------|-------|
| `{{NOMBRE_PRODUCTO}}` | **GastroFlow** |

> **Nota**: Todas las specs usan `{{NOMBRE_PRODUCTO}}` como placeholder. Al generar código, reemplázalo siempre por el valor de esta tabla.

---

## INSTRUCCIÓN PRINCIPAL

Eres un ingeniero de software senior full-stack. Tu misión es implementar **GastroFlow**, un SaaS multitenant de gestión integral para hostelería en España. Debes generar código de producción, no prototipos. Todo el sistema debe derivarse EXCLUSIVAMENTE de la especificación que sigue. No inventes funcionalidades que no estén aquí.

---

## 1. VISIÓN DEL PRODUCTO

**GastroFlow** (`{{NOMBRE_PRODUCTO}}`) es una plataforma SaaS multitenant que unifica TPV, ERP, Contabilidad/Fiscal y CRM para bares, restaurantes, cafeterías y negocios de hostelería en España (peninsular + Baleares).

### Problema que resuelve
- Reemplaza 4-5 herramientas desconectadas (caja registradora, Excel, gestoría, libreta de reservas, WhatsApp) por una sola plataforma integrada.
- Dashboard fiscal en tiempo real con alerta de deuda tributaria estimada.
- Escandallos automáticos que descuentan stock por cada venta.
- CRM con historial de consumo, reservas online y promociones personalizadas.
- Asientos contables automáticos por cada ticket, contabilidad al día.
- División automática e inteligente de facturas por comensal.
- Control digital de turnos con fichaje legal (RD 8/2019).

### Usuarios del sistema
| Rol | Necesita |
|-----|---------|
| Propietario / Gerente | Visión global: ventas, costes, márgenes, impuestos, tesorería |
| Camarero / Sala | Rapidez: abrir mesa, tomar comanda, cobrar, dividir cuenta |
| Cocinero / Jefe de cocina | Ver comandas en tiempo real, gestionar escandallos y stock |
| Barra / Barista | Recibir comandas de bebidas, gestionar stock de barra |
| Contable / Asesor fiscal | Acceso a libros, asientos, modelos fiscales, exportación AEAT |
| Encargado de compras | Proveedores, pedidos, recepción de mercancía, facturas de compra |
| Cliente final | Reservar mesa, ver carta, acumular puntos, recibir promos |
| Super Admin plataforma | Gestión de tenants, facturación de suscripciones, soporte |

### Alcance — 4 Módulos

**M1 — TPV/Ventas**: Mesas y zonas, comandas, cobro (efectivo/tarjeta/mixto), tickets y facturas simplificadas, división de cuentas, IVA automático, arqueo de caja, turnos de caja.

**M2 — ERP/Backoffice**: Catálogo de productos con tipo IVA, escandallos (fichas técnicas), inventario con descontado automático, pedidos a proveedores, recepción de mercancía, facturas de compra, RRHH (turnos, fichaje legal, calendario).

**M3 — Contabilidad y Fiscal**: Asientos contables automáticos, libro de IVA repercutido/soportado, modelo 303/390/347/111/115, PGC Pymes, balance y PyG.

**M4 — CRM/Web Usuario**: Reservas online, ficha de cliente con historial, fidelización (puntos/niveles), comunicaciones personalizadas (email/SMS), carta digital, valoraciones.

### NO incluido en Fase 1
- Gestión hotelera de habitaciones (PMS)
- Delivery / riders propios
- Nóminas completas (solo turnos y fichaje)
- Operaciones fuera de España peninsular + Baleares
- Grupos empresariales consolidados
- Facturación al sector público (Facturae)
- Multi-divisa

---

## 2. GLOSARIO — TERMINOLOGÍA OBLIGATORIA

Usa EXCLUSIVAMENTE estos términos. Los sinónimos entre paréntesis están PROHIBIDOS en código y UI.

### Operación de Sala / TPV
| ID | Término | Definición clave |
|----|---------|-----------------|
| G-001 | **Mesa** | Unidad de servicio. Estados: libre, ocupada, reservada, pendiente_cobro. Pertenece a una Zona. *(NO: tabla, puesto)* |
| G-002 | **Zona** | Agrupación de mesas por ubicación. *(NO: área, sección, sector)* |
| G-003 | **Comanda** | Pedido de un camarero asociado a una mesa. Contiene Líneas de Comanda. *(NO: pedido, orden)* |
| G-004 | **Línea de Comanda** | Producto individual con cantidad, modificadores, precio. *(NO: ítem, artículo)* |
| G-005 | **Modificador** | Variación sobre una línea de comanda. *(NO: nota, comentario)* |
| G-006 | **Servicio** | Período completo de atención de una mesa (abertura → cierre tras cobro). *(NO: sesión, turno de mesa)* |
| G-007 | **Cuenta** | Importe total acumulado de todas las comandas de un servicio. *(NO: nota, ticket antes de cobrar)* |
| G-008 | **División de Cuenta** | Separación de la cuenta en múltiples tickets. *(NO: partir cuenta)* |
| G-009 | **Ticket** | Factura simplificada. Cumple VeriFactu. *(NO: recibo)* |
| G-010 | **Factura Completa** | Documento fiscal completo con datos emisor y receptor. |
| G-011 | **Factura Simplificada** | Ticket fiscal permitido hasta 3.000€ en hostelería. |
| G-012 | **Arqueo de Caja** | Cierre que compara efectivo físico vs sistema. |
| G-013 | **Turno de Caja** | Período de operación de un cajero: apertura (fondo) → arqueo. |
| G-014 | **Fondo de Caja** | Efectivo inicial para dar cambio. |
| G-015 | **Forma de Pago** | Efectivo, Tarjeta, Mixto, Bizum, Invitación. |

### Productos y Catálogo
| ID | Término | Definición clave |
|----|---------|-----------------|
| G-020 | **Producto** | Artículo vendible con precio, tipo IVA, categoría. *(NO: artículo, ítem)* |
| G-021 | **Categoría de Producto** | Agrupación: Entrantes, Carnes, Postres, Cervezas... *(NO: familia, grupo)* |
| G-022 | **Tipo IVA del Producto** | Clasificación fiscal: General 21%, Reducido 10%, Superreducido 4%. |
| G-023 | **Escandallo** | Ficha técnica: ingredientes con cantidades y costes. *(NO: receta es sinónimo coloquial pero el oficial es Escandallo)* |
| G-024 | **Ingrediente** | Materia prima para escandallos. *(NO: insumo, materia prima)* |
| G-025 | **Merma** | % de ingrediente perdido en manipulación. |
| G-026 | **Coste Teórico** | Coste según escandallo. |
| G-027 | **Food Cost** | (Coste / PVP sin IVA) × 100. Indicador clave en hostelería. |
| G-028 | **Alérgeno** | 14 alérgenos regulados UE: Gluten, Crustáceos, Huevos, Pescado, Cacahuetes, Soja, Lácteos, Frutos de cáscara, Apio, Mostaza, Sésamo, Sulfitos, Altramuces, Moluscos. |

### Inventario y Almacén
| ID | Término | Definición clave |
|----|---------|-----------------|
| G-030 | **Almacén** | Espacio de almacenamiento (general, cámara, bodega, barra). |
| G-031 | **Stock** | Cantidad actual de un ingrediente/producto en un almacén. *(NO: existencias)* |
| G-032 | **Stock Mínimo** | Umbral de alerta de reposición. |
| G-033 | **Inventario** | Proceso de conteo físico (stock real vs teórico). |
| G-034 | **Desviación de Inventario** | Diferencia entre stock teórico y real. |
| G-035 | **Movimiento de Stock** | Entrada o salida trazable de stock. |
| G-036 | **Unidad de Medida** | Kg, litros, unidades, botellas (con conversiones). |

### Compras y Proveedores
| ID | Término | Definición clave |
|----|---------|-----------------|
| G-040 | **Proveedor** | Suministrador con datos fiscales. |
| G-041 | **Pedido a Proveedor** | Solicitud formal de mercancía. |
| G-042 | **Albarán de Entrada** | Documento de recepción de mercancía. |
| G-043 | **Factura de Compra** | Factura del proveedor → genera IVA soportado. |
| G-044 | **Precio de Coste** | Precio de compra sin IVA. |

### Fiscal y Contable
| ID | Término | Definición clave |
|----|---------|-----------------|
| G-050 | **IVA Repercutido** | IVA cobrado al cliente → se ingresa a Hacienda. |
| G-051 | **IVA Soportado** | IVA pagado a proveedores → deducible. |
| G-052 | **Liquidación de IVA** | Repercutido - Soportado. Positivo = pagar. Negativo = compensar. |
| G-053–G-057 | **Modelos 303, 390, 347, 111, 115** | Declaraciones fiscales trimestrales/anuales AEAT. |
| G-058 | **Asiento Contable** | Registro en libro diario: cargo(s) + abono(s) que cuadran. |
| G-059 | **PGC Pymes** | Plan General Contable para Pymes. |
| G-060 | **Hecho Imponible** | Operación sujeta a impuesto (cada servicio de comida/bebida). |
| G-061 | **Base Imponible** | Importe antes de impuesto: `base = precio / (1 + tipo_iva)`. |
| G-062 | **Devengo** | Momento de la obligación tributaria (en hostelería: al cobrar). |
| G-063–G-064 | **Libros Registro** | Facturas Emitidas y Facturas Recibidas (obligatorios). |
| G-065 | **VeriFactu** | Sistema de verificación: hash SHA-256 encadenado, registros inalterables. |

### RRHH y Laboral
| ID | Término | Definición clave |
|----|---------|-----------------|
| G-070 | **Empleado** | Persona con relación laboral. |
| G-071 | **Turno** | Franja horaria asignada a un empleado. |
| G-072 | **Cuadrante** | Planificación semanal/mensual de turnos. |
| G-073 | **Fichaje** | Registro de entrada/salida (obligatorio RD 8/2019). |
| G-074 | **Horas Extra** | Horas sobre jornada legal. Máximo 80h/año. |

### CRM y Cliente
| ID | Término | Definición clave |
|----|---------|-----------------|
| G-080 | **Cliente** | Puede ser anónimo o registrado (con ficha CRM). |
| G-081 | **Reserva** | Asignación anticipada de mesa. |
| G-082 | **Programa de Fidelización** | Sistema de puntos y niveles. |
| G-083 | **Nivel de Fidelización** | Bronce (<500 pts), Plata (500-1499), Oro (1500+). |
| G-084 | **Promoción** | Acción comercial con condiciones y vigencia. |
| G-085 | **Comunicación** | Mensaje a clientes (requiere consentimiento LSSI). |

### Establecimiento
| ID | Término | Definición clave |
|----|---------|-----------------|
| G-090 | **Establecimiento** | Local físico concreto. |
| G-091 | **Tenant** | Entidad cliente del SaaS (puede tener N establecimientos). |
| G-092 | **Ejercicio Fiscal** | Período contable = año natural (enero-diciembre). |
| G-093 | **Serie de Facturación** | Secuencia numérica para facturas (ventas, rectificativas, etc.). |
| G-094 | **Caja** | Punto de cobro (puede haber varias por establecimiento). |

---

## 3. REGLAS DE NEGOCIO — OBLIGATORIAS

### 3.1 Reglas Fiscales — IVA

**RN-001**: Tipos de IVA en hostelería España peninsular + Baleares:
- **21% General**: bebidas alcohólicas, tabaco, servicios no alimentarios
- **10% Reducido**: comida/bebidas no alcohólicas servidas en local
- **4% Superreducido**: pan, leche, quesos, huevos, frutas, verduras SIN elaborar
- **0% Exento**: no aplica habitualmente en hostelería

**RN-002**: En B2C, el precio de carta INCLUYE IVA. Base = `precio / (1 + tipo_iva)`.
- Ejemplo: Cerveza 3,50€ (21%) → base = 2,89€, IVA = 0,61€

**RN-003**: Tickets con varios tipos de IVA deben DESGLOSAR cada base y cuota por separado.

**RN-004**: Recargo de equivalencia NO aplica a hostelería (es prestación de servicios).

**RN-005**: IVA soportado deducible requiere: factura original, vinculado a actividad, registrado en Libro Recibidas, dentro de 4 años.

**RN-006**: IVA se devenga al COBRAR (no al tomar comanda).

**RN-007**: Adquisiciones intracomunitarias → autorrepercusión IVA español + Modelo 349.

### 3.2 Reglas de Facturación

**RN-010**: Factura simplificada (ticket) permitida hasta **3.000€** en hostelería.
**RN-011**: Contenido mínimo ticket: número secuencial, fecha, NIF/nombre emisor, descripción, tipo IVA, total.
**RN-012**: Factura completa obligatoria SI: cliente la pide, importe > 3.000€, destinatario es AAPP, o entrega intracomunitaria.
**RN-013**: Factura completa: todo lo del ticket + datos completos destinatario + desglose base/cuota por tipo IVA.
**RN-014**: **Numeración secuencial SIN saltos ni huecos**. N+1 = N + 1, siempre.
**RN-015**: Emisión al cobrar. B2B: antes del día 16 del mes siguiente.
**RN-016**: Factura rectificativa: serie propia "R", referencia al original, por sustitución o por diferencias.
**RN-017**: **VeriFactu (RD 1007/2023)**: inalterabilidad, hash SHA-256 encadenado, trazabilidad, conservación 4 años, declaración responsable.
**RN-018**: Conservar facturas mínimo **6 años** (obligación mercantil art. 30 C.Comercio).

### 3.3 Reglas de Modelos Tributarios

**RN-020**: Plazos Modelo 303: 1T→20 abril, 2T→20 julio, 3T→20 octubre, 4T→30 enero siguiente. **Alerta 15 días antes**.
**RN-021**: Resultado 303 = IVA repercutido trimestral - IVA soportado deducible trimestral.
**RN-022**: Modelo 347: operaciones con terceros > 3.005,06€/año (IVA incluido), desglosadas por trimestre.
**RN-023**: Modelo 111: retenciones IRPF a empleados (según tabla) y profesionales (15% general, 7% nuevos).
**RN-024**: Modelo 115: retención 19% alquiler local (excepciones: arrendador con >10 inmuebles o renta <900€/año).
**RN-025**: SII obligatorio si facturación > 6.014.060,10€.

### 3.4 Reglas Operativas del TPV

**RN-030**: Una mesa solo puede tener UN servicio activo a la vez.
**RN-031**: Toda comanda pertenece a un servicio. (Excepción: comanda de barra = servicio "barra" sin mesa).
**RN-032**: Ticket se genera SOLO al cobrar.
**RN-033**: Cobro total del servicio debe ser ≥ 0.
**RN-034**: División de cuenta: **la suma de las partes = total exacto**.
**RN-035**: Ticket ya emitido (VeriFactu) NO se elimina. Se corrige con factura rectificativa.
**RN-036**: Arqueo de caja obligatorio al cerrar turno.
**RN-037**: Las propinas NO forman parte de la base imponible.
**RN-038**: Los descuentos reducen la base imponible. IVA se calcula DESPUÉS del descuento.

### 3.5 Reglas de Inventario

**RN-040**: Stock negativo: se permite la venta (no bloquear al cliente) pero se genera alerta urgente.
**RN-041**: Descuento de stock al COBRAR el ticket (no al tomar comanda, porque una comanda puede anularse).
**RN-042**: Coste teórico = Σ(cantidad_ingrediente × (1 + merma%) × precio_coste).
**RN-043**: Food cost = (coste_teórico / PVP_sin_IVA) × 100.
**RN-044**: Precios de coste se actualizan con la última factura de compra → recalcular escandallos.

### 3.6 Reglas Laborales

**RN-050**: Registro de jornada obligatorio (fichaje). Conservar 4 años.
**RN-051**: Jornada según convenio colectivo provincial (~1.800h/año).
**RN-052**: Máximo 80 horas extra/año por empleado.
**RN-053**: Descanso mínimo entre jornadas: 12 horas.
**RN-054**: Descanso semanal mínimo: día y medio ininterrumpido (acumulable en 14 días).

### 3.7 Reglas de Protección de Datos

**RN-060**: Datos clientes CRM requieren consentimiento RGPD explícito para comunicaciones comerciales.
**RN-061**: Derecho de supresión: eliminar datos CRM pero NO facturas (obligación fiscal).
**RN-062**: Comunicaciones comerciales requieren consentimiento previo LSSI. Excepción: clientes existentes para productos similares con opción de baja.
**RN-063**: Datos de empleados: base legal = contrato laboral + obligaciones legales.

### 3.8 Reglas Sanitarias

**RN-070**: 14 alérgenos obligatorios en carta y alertas de comanda.
**RN-071**: Trazabilidad de ingredientes hasta proveedor y lote.

### 3.9 Reglas Contables

**RN-080**: Partida doble: Σ cargos = Σ abonos SIEMPRE.
**RN-081**: PGC Pymes. Cuentas clave: 4000 Proveedores, 4300 Clientes, 4720 IVA soportado, 4770 IVA repercutido, 5700 Caja, 5720 Bancos, 5730 Tarjetas, 6000/6020 Compras, 6210 Arrendamientos, 6400 Sueldos, 7000/7050 Ventas.
**RN-082**: Ejercicio contable = año natural.
**RN-083**: Libros obligatorios: Diario + Inventarios y Cuentas Anuales.

---

## 4. INVARIANTES — NUNCA SE VIOLAN

> Si una invariante se viola, el sistema está en estado corrupto. Son restricciones absolutas.

### Fiscales y Facturación
- **INV-001**: Numeración secuencial sin saltos: N+1 = N + 1.
- **INV-002**: Total ticket = Σ(base_linea + cuota_iva_linea).
- **INV-003**: cuota_iva = base_imponible × tipo_iva (tolerancia ±0,01€).
- **INV-004**: IVA repercutido trimestral = Σ cuotas IVA de todos los tickets del período.
- **INV-005**: IVA soportado trimestral = Σ cuotas IVA de facturas de compra del período.
- **INV-006**: Resultado 303 = IVA repercutido - IVA soportado.
- **INV-007**: Registro VeriFactu NUNCA se modifica ni elimina (solo rectificativa).
- **INV-008**: Cadena hash VeriFactu ininterrumpida (cada registro contiene hash del anterior).

### TPV / Sala
- **INV-010**: Mesa en UNO y solo UNO de: libre | ocupada | reservada | pendiente_cobro.
- **INV-011**: Servicio activo → mesa en estado "ocupada" o "pendiente_cobro".
- **INV-012**: Toda comanda pertenece a un servicio (no huérfanas).
- **INV-013**: División de cuenta cuadra al céntimo: Σ tickets parciales = total original.
- **INV-014**: Σ importes pagados ≥ total cuenta. Exceso = cambio.
- **INV-015**: Efectivo esperado = fondo + Σ cobros_efectivo - Σ retiradas.

### Inventario
- **INV-020**: Stock teórico trazable: stock = inicial + entradas - salidas - mermas ± ajustes.
- **INV-021**: Todo movimiento de stock tiene origen documentado.
- **INV-022**: Coste escandallo determinista (mismas entradas → mismo resultado).

### Contables
- **INV-030**: Partida doble: Σ cargos = Σ abonos en todo asiento.
- **INV-031**: Balance: Activo = Pasivo + Patrimonio Neto.
- **INV-032**: Libro IVA emitidas = 1:1 con tickets/facturas emitidos.
- **INV-033**: Libro IVA recibidas = 1:1 con facturas de compra.

### Laborales
- **INV-040**: No turnos solapados para un mismo empleado.
- **INV-041**: Descanso mínimo entre turnos: ≥ 12 horas.
- **INV-042**: Horas extra anuales ≤ 80h por empleado.

### CRM
- **INV-050**: Puntos de fidelización ≥ 0.
- **INV-051**: Canjeo ≤ saldo de puntos.
- **INV-052**: No comunicación comercial sin consentimiento activo registrado.

---

## 5. CONTRATOS DE OPERACIÓN — PRE/POST/ERROR

### 5.1 Sala / TPV

**OP-001 AbrirMesa**: PRE: mesa existe, estado libre/reservada. POST: mesa→ocupada, servicio creado con hora. ERROR: mesa ya ocupada→rechazar.

**OP-002 TomarComanda**: PRE: servicio activo, ≥1 producto activo. POST: comanda creada, líneas con precio/IVA/modificadores, enviada a cocina/barra. ERROR: sin servicio→rechazar.

**OP-003 AnularLineaComanda**: PRE: línea existe, comanda en "enviada". POST: línea anulada, sin stock ni coste. ERROR: si "en preparación"→requiere clave encargado (OP-003b). Si cobrada→rechazar, usar rectificativa.

**OP-004 CobrarMesa**: PRE: servicio activo, ≥1 comanda, cuenta>0, formas de pago≥total. POST: ticket con nº secuencial (INV-001), hash VeriFactu (INV-008), cobro registrado, cambio calculado, mesa→libre, servicio→cerrado, stock descontado (RN-041), asiento contable auto. ERROR: pago insuficiente→rechazar, error numeración→PARAR (no generar ticket corrupto).

**OP-005 DividirCuenta**: PRE: servicio activo, cuenta>0, método indicado. POST: N subcuentas, Σ=total (INV-013), cada una con IVA correcto. ERROR: suma≠total→rechazar.

**OP-006 EmitirFacturaCompleta**: PRE: ticket cobrado, cliente da NIF válido. POST: factura completa con serie propia, datos destinatario, desglose IVA, registrada en libro emitidas. ERROR: NIF inválido→advertir, duplicado→rechazar.

### 5.2 Caja

**OP-010 AbrirTurnoCaja**: PRE: caja existe, sin turno activo, cajero+fondo definidos. POST: turno activo con hora y fondo. ERROR: turno activo existente→rechazar.

**OP-011 ArqueoCaja**: PRE: turno activo, conteo real indicado. POST: efectivo_esperado calculado (INV-015), descuadre registrado, turno→cerrado, informe generado. ERROR: sin turno→rechazar.

**OP-012 RetiradaEfectivo**: PRE: turno activo, importe>0. POST: movimiento salida, efectivo esperado disminuye. ERROR: importe>efectivo→advertir (permitir pero avisar).

### 5.3 Inventario

**OP-020 RegistrarAlbaranEntrada**: PRE: pedido existe (o sin pedido). POST: stock incrementado, fecha/proveedor/cantidades registrados, diferencias con pedido si aplica.

**OP-021 RegistrarFacturaCompra**: PRE: proveedor existe, factura con nº/fecha/NIF/líneas/IVA. POST: factura registrada, asiento auto (compras+IVA soportado→proveedores), precio coste actualizado, escandallos recalculados, libro recibidas actualizado. ERROR: factura duplicada→advertir.

**OP-022 RealizarInventarioFisico**: PRE: almacén + conteo por ingrediente. POST: desviación calculada, stock ajustado a real, informe generado.

**OP-023 DescontarStockPorVenta**: PRE: ticket cobrado, escandallos existentes. POST: stock[ingrediente] -= cantidad_escandallo × unidades. Si stock<mínimo→alerta. ERROR: sin escandallo→no descontar pero registrar warning.

### 5.4 Contable / Fiscal

**OP-030 GenerarAsientoVenta**: PRE: ticket cobrado. POST: asiento cargo caja/banco → abono ventas + IVA repercutido. Cuadra (INV-030). ERROR: no cuadra→error grave, no registrar.

**OP-031 GenerarAsientoCompra**: PRE: factura compra validada. POST: asiento cargo compras + IVA soportado → abono proveedores. ERROR: no cuadra→error grave.

**OP-032 GenerarBorradorModelo303**: PRE: trimestre+año, registros de ventas/compras. POST: borrador con IVA repercutido (4/10/21%), soportado, resultado. Cifras coinciden con libros (INV-004/005/006). ERROR: inconsistencias→alertar antes de generar.

**OP-033 EmitirFacturaRectificativa**: PRE: factura/ticket original existe. POST: rectificativa serie "R", referencia a original, IVA ajustado, asiento de ajuste, registro VeriFactu nuevo (no modifica original). ERROR: original no existe→rechazar.

### 5.5 CRM

**OP-040 RegistrarCliente**: PRE: nombre+contacto. POST: ficha creada, 0 puntos, nivel Bronce, consentimiento gestionado. ERROR: email duplicado→proponer fusión.

**OP-041 AcumularPuntos**: PRE: cliente registrado, ticket cobrado, importe>0. POST: puntos sumados (1pt/€), verificar subida nivel. ERROR: puntos ya asignados→rechazar.

**OP-042 CrearReserva**: PRE: fecha/hora/comensales/contacto, disponibilidad. POST: reserva confirmada, mesa→reservada, confirmación enviada. ERROR: sin disponibilidad→rechazar con alternativas.

**OP-043 CancelarReserva**: PRE: reserva existe, fecha futura. POST: reserva cancelada, mesa liberada, confirmación enviada. ERROR: hora pasada→marcar no-show.

---

## 6. POLÍTICAS DE DECISIÓN — SI/ENTONCES

### Fiscales

**POL-001 Tipo IVA**: Bebida alcohólica→21% | Comida/bebida no alcohólica servida→10% | Productos sin elaborar (pan/leche/fruta/verdura)→4% | Duda→21%.

**POL-002 Simplificada vs Completa**: Cliente la pide→completa | >3.000€→completa | AAPP→completa | Sino→simplificada.

**POL-003 Rectificativa**: Anulación total→sustitución | Corrección parcial→diferencias | Error datos→sustitución.

**POL-004 Modelo 347**: Operaciones proveedor >3.005,06€/año→incluir.

**POL-005 SII**: Facturación >6.014.060,10€→obligado. Sino→trimestral normal.

**POL-006 Recargo Equivalencia**: Hostelería→NO aplica.

**POL-007 Retención alquiler**: Local alquilado→19% y M115. Excepciones: arrendador >10 inmuebles o renta <900€/año.

### Operativas TPV

**POL-010 Destino comanda**: Categoría cocina→pantalla COCINA | Categoría barra→pantalla BARRA | Ambas→ambos | Ni una→directo.

**POL-011 Anulación**: Estado "enviada"→camarero anula | "En preparación"/"lista"→clave encargado | "Servida" no cobrada→clave gerente+motivo | Cobrada→factura rectificativa.

**POL-012 Redondeo división**: N-1 primeros truncados a 2 decimales, último = resto. Ej: 100€/3 = 33,33 + 33,33 + 33,34.

**POL-013 Alérgenos**: Producto con alérgenos→alerta icono | Sin alérgenos configurados→advertencia "configurar".

**POL-014 Propinas**: Voluntaria→NO base imponible, NO IVA | Cargo servicio obligatorio→SÍ base imponible, SÍ IVA.

### Inventario

**POL-020**: Sin escandallo→no descontar stock, registrar warning.
**POL-021**: Stock ≤ mínimo→alerta reposición. Stock < 0→alerta URGENTE.
**POL-022**: Nuevo precio compra→actualizar (opción configuración: "último precio" o "precio medio ponderado").

### CRM

**POL-030 Puntos**: Cliente registrado+identificado→1pt/€. No registrado→no puntos, sugerir registro. Canjeos NO generan puntos.
**POL-031 Nivel**: Puntos ≥ umbral siguiente→subir automáticamente. Configurable: permanentes o revisión anual.
**POL-032 Cumpleaños**: Fecha nacimiento+consentimiento→enviar 1 día antes.
**POL-033 No-show**: +30min sin aparecer→no-show, liberar mesa. ≤15min retraso→mantener. Avisa retraso→mantener hasta hora indicada.

### Laborales

**POL-040 Conflicto turno**: Solape→rechazar | Descanso <12h→advertir+confirmación | OK→asignar.
**POL-041 Horas extra**: Extra_acumuladas + nuevas > 80h→alerta GRAVE, bloquear asignación.

---

## 7. EVENTOS DE DOMINIO

> Hechos pasados e inmutables que disparan reacciones en cadena.

### Sala / TPV
| Evento | Datos clave | Reacciones |
|--------|------------|------------|
| **EVT-001 MesaAbierta** | id_mesa, id_servicio, camarero, hora | Actualizar mapa sala, marcar reserva cumplida si aplica |
| **EVT-002 ComandaRegistrada** | id_comanda, líneas, precios, IVAs | Enviar a cocina/barra, actualizar cuenta, alertar alérgenos |
| **EVT-003 PlatoListo** | id_línea, id_mesa, hora | Notificar camarero, registrar tiempo preparación |
| **EVT-004 TicketEmitido** | id_ticket, nº, serie, líneas, IVAs, total, formas_pago, hash_verifactu | Libro emitidas, asiento venta, descontar stock, actualizar IVA repercutido, liberar mesa, cerrar servicio, acumular puntos, dashboard |
| **EVT-005 FacturaCompletaEmitida** | id_factura, datos destinatario, desglose | Libro emitidas, ajustar asiento si sustituye ticket |
| **EVT-006 FacturaRectificativaEmitida** | id_rectificativa, original, motivo, importe | Libro emitidas, asiento ajuste, ajustar IVA, evaluar stock, ajustar puntos |
| **EVT-007 LineaComandaAnulada** | id_línea, motivo, autorización | Actualizar destino, recalcular cuenta, registrar merma si en prep. |

### Caja
| Evento | Datos clave | Reacciones |
|--------|------------|------------|
| **EVT-010 TurnoCajaAbierto** | id_turno, caja, cajero, fondo | Caja operativa |
| **EVT-011 TurnoCajaCerrado** | esperado, real, descuadre | Informe turno, alerta si descuadre > umbral |

### Inventario / Compras
| Evento | Datos clave | Reacciones |
|--------|------------|------------|
| **EVT-020 StockBajoMinimo** | ingrediente, actual, mínimo | Alerta reposición, sugerir pedido, notificar compras |
| **EVT-021 StockNegativo** | ingrediente, actual | Alerta URGENTE, marcar "revisar inventario" |
| **EVT-022 AlbaranRecibido** | albaran, proveedor, líneas | Incrementar stock, generar incidencia si diferencias |
| **EVT-023 FacturaCompraRegistrada** | factura, proveedor, IVA | Asiento compra, actualizar IVA soportado, libro recibidas, actualizar precios, recalcular escandallos, evaluar M347 |
| **EVT-024 InventarioFisicoRealizado** | almacen, desviaciones | Ajustar stock, informe desviaciones, alerta si significativo |

### Contable / Fiscal
| Evento | Datos clave | Reacciones |
|--------|------------|------------|
| **EVT-030 AsientoContableCreado** | id_asiento, apuntes, origen | Actualizar saldos, actualizar balance/PyG |
| **EVT-031 TrimestreFiscalProximoACerrar** | trimestre, modelos, vencimiento | Alerta propietario/contable, generar borradores, dashboard fiscal |
| **EVT-032 Modelo303Generado** | trimestre, resultado | Notificar contable, actualizar calendario fiscal |

### RRHH
| Evento | Datos clave | Reacciones |
|--------|------------|------------|
| **EVT-040 EmpleadoFicho** | empleado, tipo, hora | Log fichaje, calcular horas, registrar extras, alerta si ~80h |
| **EVT-041 ConflictoTurnoDetectado** | empleado, turno, motivo | Bloquear asignación, informar encargado |

### CRM
| Evento | Datos clave | Reacciones |
|--------|------------|------------|
| **EVT-050 ClienteRegistrado** | cliente, email, consentimiento | Ficha CRM Bronce/0pts, email bienvenida si consintió |
| **EVT-051 PuntosAcumulados** | cliente, puntos_nuevos, saldo | Verificar subida nivel, notificar si sube |
| **EVT-052 ReservaCreada** | reserva, fecha, comensales | Confirmar, marcar mesa reservada, programar recordatorio 24h |
| **EVT-053 ReservaCancelada** | reserva, motivo | Liberar mesa, confirmar cancelación |
| **EVT-054 NoShowDetectado** | reserva, cliente | Marcar no-show, liberar mesa, registrar en ficha |

---

## 8. ARQUITECTURA DE AGENTES

> 8 agentes funcionales autónomos. Cada uno con skills, eventos e invariantes asignados.

### AG-001: AgenteTPV
Responsabilidad: Operación de sala — mesas, comandas, cobros, facturación, caja.
Skills: SK-001 a SK-009 | Escucha: EVT-052, EVT-053 | Produce: EVT-001, 002, 004, 005, 006, 007, 010, 011
Invariantes: INV-001, 002, 003, 007, 008, 010, 013, 014, 015

### AG-002: AgenteInventario
Responsabilidad: Stock, escandallos, alertas, food cost.
Skills: SK-010 a SK-016 | Escucha: EVT-004, 022, 023 | Produce: EVT-020, 021, 024
Invariantes: INV-020, 021, 022

### AG-003: AgenteCompras
Responsabilidad: Ciclo de compra — proveedores, pedidos, recepción, facturas compra.
Skills: SK-020 a SK-024 | Escucha: EVT-020 | Produce: EVT-022, 023
Invariantes: INV-033

### AG-004: AgenteContable
Responsabilidad: Asientos, libros, balance, PyG.
Skills: SK-030 a SK-036 | Escucha: EVT-004, 006, 023 | Produce: EVT-030
Invariantes: INV-030, 031, 032, 033

### AG-005: AgenteFiscal
Responsabilidad: IVA, retenciones, modelos tributarios, calendario fiscal.
Skills: SK-040 a SK-049 | Escucha: EVT-004, 023, 030 | Produce: EVT-031, 032
Invariantes: INV-004, 005, 006

### AG-006: AgenteRRHH
Responsabilidad: Cuadrantes, fichajes, horas, cumplimiento laboral.
Skills: SK-050 a SK-054 | Produce: EVT-040, 041
Invariantes: INV-040, 041, 042

### AG-007: AgenteCRM
Responsabilidad: Reservas, fidelización, comunicaciones, carta digital.
Skills: SK-060 a SK-068 | Escucha: EVT-004, 001 | Produce: EVT-050, 051, 052, 053, 054
Invariantes: INV-050, 051, 052

### AG-008: AgenteOrquestador
Responsabilidad: Coordinar flujos multi-agente, verificar consistencia global, dashboard.
Skills: SK-070 a SK-072 | Escucha: TODOS los eventos
Invariantes: TODAS (verificador global)

---

## 9. SKILLS — PIEZAS ATÓMICAS

> ~70 skills. Nunca inventes skills que no estén aquí.

### AG-001 Skills (TPV)
| Skill | Entrada | Salida | Reglas | Invariantes |
|-------|---------|--------|--------|-------------|
| SK-001 abrir_mesa | id_mesa, id_camarero, comensales | id_servicio, hora, mesa→ocupada | RN-030 | INV-010, 011 |
| SK-002 tomar_comanda | id_servicio, líneas[{producto, cant, modif}] | id_comanda, precios, IVA, destinos | RN-001, 031, 070 | INV-012 |
| SK-003 calcular_cuenta | id_servicio | total, desglose IVA, líneas | RN-002, 003 | INV-002, 003 |
| SK-004 dividir_cuenta | id_servicio, método, config | subcuentas[{líneas, base, iva, total}] | RN-034 | INV-013 |
| SK-005 cobrar_servicio | id_cuenta, formas_pago | cobro, cambio, id_ticket | RN-032, 033, 037 | INV-014 |
| SK-006 emitir_ticket_verifactu | datos_cobro, hash_anterior | ticket nº secuencial + hash SHA-256 | RN-010, 011, 014, 017 | INV-001, 007, 008 |
| SK-007 emitir_factura_completa | datos_cobro, datos_destinatario | factura serie propia, campos legales | RN-012, 013 | INV-001 |
| SK-008 emitir_factura_rectificativa | id_original, tipo, motivo, importe | rectificativa serie "R" | RN-016, 035 | — |
| SK-009 gestionar_arqueo_caja | id_turno, efectivo_contado | esperado, descuadre, informe | RN-036 | INV-015 |

### AG-002 Skills (Inventario)
| Skill | Entrada | Salida | Reglas | Invariantes |
|-------|---------|--------|--------|-------------|
| SK-010 descontar_stock_por_venta | líneas_ticket | movimientos_stock, alertas | RN-041, 040 | INV-020 |
| SK-011 calcular_escandallo | ingredientes[{id, cant_neta, merma%}] | coste_teórico, food_cost%, detalle | RN-042, 043 | INV-022 |
| SK-012 verificar_stock_minimo | id_almacen | ingredientes_bajo_mínimo | POL-021 | — |
| SK-013 registrar_entrada_mercancia | id_albarán, líneas | stock actualizado | — | INV-020, 021 |
| SK-014 realizar_inventario_fisico | id_almacén, conteo | desviaciones, informe | — | INV-020 |
| SK-015 traspasar_stock_entre_almacenes | origen, destino, ingredientes | stock actualizado ambos | — | INV-021 |
| SK-016 calcular_food_cost | período, filtro | food_cost global y por producto/categoría | — | — |

### AG-003 Skills (Compras)
| Skill | Entrada | Salida |
|-------|---------|--------|
| SK-020 crear_pedido_proveedor | id_proveedor, líneas | id_pedido, estado=pendiente |
| SK-021 registrar_albaran_entrada | id_proveedor, líneas_recibidas | id_albarán, diferencias |
| SK-022 registrar_factura_compra | proveedor, nº, fecha, líneas, IVA | factura registrada, asiento auto, IVA soportado |
| SK-023 validar_factura_proveedor | datos_factura | {válida, errores[]} |
| SK-024 extraer_datos_factura_ocr | archivo img/pdf | datos extraídos + confianza% |

### AG-004 Skills (Contable)
| Skill | Entrada | Salida | Invariantes |
|-------|---------|--------|-------------|
| SK-030 generar_asiento_venta | datos_ticket | asiento{apuntes[]} | INV-030 |
| SK-031 generar_asiento_compra | datos_factura | asiento{apuntes[]} | INV-030 |
| SK-032 generar_asiento_manual | fecha, concepto, apuntes | asiento registrado | INV-030 |
| SK-033 consultar_libro_diario | período | asientos cronológicos | — |
| SK-034 generar_balance_situacion | fecha_corte | activo/pasivo/patrimonio | INV-031 |
| SK-035 generar_cuenta_pyg | período | ingresos/gastos/resultado | — |
| SK-036 cuadrar_cuentas | — | {cuadra, descuadres[]} | INV-030, 031 |

### AG-005 Skills (Fiscal)
| Skill | Entrada | Salida | Invariantes |
|-------|---------|--------|-------------|
| SK-040 calcular_iva_repercutido_periodo | trimestre, año | total_por_tipo, global | INV-004 |
| SK-041 calcular_iva_soportado_periodo | trimestre, año | total_por_tipo, global | INV-005 |
| SK-042 generar_borrador_modelo_303 | trimestre, año | casillas 303, resultado | INV-006 |
| SK-043 generar_borrador_modelo_347 | año | terceros >3.005,06€ por trimestre | — |
| SK-044 generar_borrador_modelo_111 | trimestre, año | perceptores, retenciones | — |
| SK-045 generar_borrador_modelo_115 | trimestre, año | arrendadores, retención 19% | — |
| SK-046 generar_libro_registro_emitidas | período | registros + totales | INV-032 |
| SK-047 generar_libro_registro_recibidas | período | registros + totales | INV-033 |
| SK-048 verificar_calendario_fiscal | fecha_actual | obligaciones próximas con días restantes | — |
| SK-049 calcular_retencion_alquiler | renta_mensual | retención mensual y trimestral | — |

### AG-006 Skills (RRHH)
| Skill | Entrada | Salida | Invariantes |
|-------|---------|--------|-------------|
| SK-050 crear_cuadrante_turnos | semana, empleados, turnos | cuadrante validado o errores | INV-040, 041 |
| SK-051 registrar_fichaje | id_empleado, tipo, hora | fichaje registrado, horas jornada | — |
| SK-052 calcular_horas_trabajadas | id_empleado, período | ordinarias, extra, total, extra_año | INV-042 |
| SK-053 detectar_conflicto_turno | id_empleado, turno_propuesto | {válido, conflictos[]} | — |
| SK-054 generar_informe_horas | período | por empleado: ordinarias/extra/ausencias | — |

### AG-007 Skills (CRM)
| Skill | Entrada | Salida | Invariantes |
|-------|---------|--------|-------------|
| SK-060 crear_reserva | fecha, hora, comensales, datos_cliente | id_reserva, confirmación | — |
| SK-061 cancelar_reserva | id_reserva, motivo | reserva cancelada, mesa liberada | — |
| SK-062 detectar_noshow | hora_actual | reservas_noshow[] | — |
| SK-063 acumular_puntos_fidelizacion | id_cliente, importe_ticket | puntos_nuevos, saldo, cambio_nivel | INV-050 |
| SK-064 canjear_puntos | id_cliente, puntos_a_canjear | descuento_€, saldo_restante | INV-050, 051 |
| SK-065 evaluar_subida_nivel | id_cliente | nivel_actual, nivel_nuevo, beneficios | — |
| SK-066 enviar_comunicacion_personalizada | segmento, mensaje, canal | enviados, fallidos, rechazados | INV-052 |
| SK-067 generar_carta_digital | id_establecimiento | carta{categorías, productos, alérgenos} | — |
| SK-068 gestionar_consentimientos | id_cliente, acción, tipo | estado_consentimiento | — |

### AG-008 Skills (Orquestador)
| Skill | Entrada | Salida |
|-------|---------|--------|
| SK-070 ejecutar_workflow | id_workflow, parámetros | resultado, pasos, errores |
| SK-071 verificar_consistencia_global | — | {consistente, violaciones[]} |
| SK-072 generar_dashboard_ejecutivo | período | ventas, ticket_medio, food_cost, iva, cashflow, alertas |

---

## 10. WORKFLOWS — ORQUESTACIÓN

### WF-001: Servicio Completo de Mesa
**Trigger**: Camarero abre mesa.
```
1. AG-001.SK-001 abrir_mesa → Mesa ocupada
2. AG-001.SK-002 tomar_comanda → Comandas a cocina/barra (repetir N veces)
3. AG-001.SK-003 calcular_cuenta → Cuenta preparada
4. AG-001.SK-004 dividir_cuenta → (opcional) Subcuentas
5. AG-001.SK-005 cobrar_servicio → Pago registrado
6. AG-001.SK-006 emitir_ticket_verifactu → Ticket legal ▶ SI FALLA: PARAR TODO
7. AG-002.SK-010 descontar_stock_por_venta → Stock actualizado (si falla: cobro sigue, alerta)
8. AG-004.SK-030 generar_asiento_venta → Asiento (si falla: cobro válido, asiento pendiente)
9. AG-005.SK-040 calcular_iva_repercutido → IVA trimestre actualizado
10. AG-007.SK-063 acumular_puntos → (si cliente registrado)
```

### WF-002: Ciclo de Compra
**Trigger**: Stock bajo o decisión manual.
```
1. AG-003.SK-020 crear_pedido → Pedido registrado
2. AG-003.SK-021 registrar_albaran → Albarán+diferencias
3. AG-002.SK-013 registrar_entrada → Stock incrementado
4. AG-003.SK-024 extraer_factura_ocr → (opcional)
5. AG-003.SK-023 validar_factura → ▶ SI INVÁLIDA: devolver al encargado
6. AG-003.SK-022 registrar_factura → Factura registrada
7. AG-004.SK-031 asiento_compra → Asiento compra
8. AG-005.SK-041 calcular_iva_soportado → IVA soportado actualizado
9. AG-002.SK-011 calcular_escandallo → Costes recalculados si precios cambiaron
```

### WF-003: Cierre Trimestral Fiscal
**Trigger**: 5 días antes vencimiento trimestral (EVT-031).
```
1. AG-008.SK-071 verificar_consistencia → Sistema limpio
2. AG-004.SK-036 cuadrar_cuentas → ▶ SI NO CUADRA: alertar, no seguir
3. AG-005.SK-046 libro_emitidas → Libro generado
4. AG-005.SK-047 libro_recibidas → Libro generado
5. AG-005.SK-040 iva_repercutido → Total
6. AG-005.SK-041 iva_soportado → Total
7. AG-005.SK-042 borrador_303 → Borrador listo
8. AG-005.SK-044 borrador_111 → Borrador retenciones
9. AG-005.SK-045 borrador_115 → Borrador alquiler (si aplica)
10. Notificar contable/propietario → Borradores para revisión
```

### WF-004: Cierre Anual Fiscal
**Trigger**: 15 enero siguiente.
```
1. WF-003 para Q4 → Q4 cerrado
2. AG-005.SK-043 borrador_347 → Operaciones terceros
3. AG-005 resumen 390 → Borrador anual
4. AG-004.SK-034 balance → Balance cierre ejercicio
5. AG-004.SK-035 PyG → Resultado ejercicio
6. Notificar → Documentación lista
```

### WF-005: Gestión de Reserva
**Trigger**: Cliente solicita reserva.
```
1. AG-007.SK-060 crear_reserva → Reserva confirmada
2. AG-007.SK-066 enviar_confirmación → Email/SMS
3. AG-007.SK-066 recordatorio 24h antes → Automático
4a. AG-001.SK-001 abrir_mesa → Si llega: WF-001
4b. AG-007.SK-062 detectar_noshow → Si no llega +30min: no-show, liberar
```

### WF-006: Inventario Periódico
**Trigger**: Según config o manual.
```
1. AG-002.SK-012 verificar_stock_mínimo → Alertas
2. AG-002.SK-014 inventario_físico → Desviaciones
3. AG-002.SK-016 calcular_food_cost → % food cost
4. AG-008.SK-072 dashboard → Informe ejecutivo a propietario
```

### WF-007: Onboarding Nuevo Establecimiento
```
1. Config datos establecimiento (NIF, dirección, régimen)
2. AG-001 config zonas y mesas
3. AG-001 alta productos (categorías, precios, tipo IVA)
4. AG-002 config escandallos
5. AG-003 alta proveedores
6. AG-006 alta empleados
7. AG-005 config ejercicio fiscal y series facturación
8. AG-007 config fidelización
9. AG-007 config carta digital y reglas reservas
10. AG-008.SK-071 verificar consistencia → Listo para operar
```

### WF-008: Dashboard Diario
**Trigger**: Cada mañana o bajo demanda.
```
1. Ventas ayer: total, tickets, ticket medio
2. AG-002.SK-012 alertas stock bajo
3. AG-002.SK-016 food cost actual
4. AG-005.SK-040+041 IVA estimado trimestre
5. AG-005.SK-048 próximas obligaciones fiscales
6. AG-006.SK-054 horas y alertas
7. Reservas hoy, clientes top
8. AG-008.SK-072 dashboard consolidado
```

### WF-009: Factura Rectificativa
**Trigger**: Cliente solicita devolución/corrección.
```
1. Localizar ticket/factura original
2. AG-001.SK-008 emitir_rectificativa
3. AG-004 asiento ajuste
4. AG-005 ajustar IVA repercutido
5. AG-002 evaluar devolución stock
6. AG-007 ajustar puntos fidelización
```

---

## 11. CRITERIOS DE ACEPTACIÓN — TESTS DE REFERENCIA

> Implementar como tests automatizados. Formato DADO/CUANDO/ENTONCES.

### TPV

**AC-001**: Mesa 7: 1×Tortilla (8€, 10%) + 2×Cerveza (3,50€, 21%). Cobro efectivo 20€ → Total 15€, IVA10% base=7,27 cuota=0,73, IVA21% base=5,79 cuota=1,21. Cambio=5€. Ticket VeriFactu ✓

**AC-002**: Mesa 12: 100€ entre 3 → 33,33 + 33,33 + 33,34 = 100,00€ ✓

**AC-003**: División por productos: ComenalA→Ensalada(9€,10%)+Agua(2€,10%)=11€. ComenalB→GinTonic(9,50€,21%). Total=20,50€ ✓

**AC-004**: Pago mixto 50€: 20€ efectivo + 30€ tarjeta. UN solo ticket. Asiento: Cargo 5700(20)+5730(30) → Abono 7050+4770.

**AC-005**: Factura completa: ticket 85€ cobrado → cliente da NIF B12345678 → factura F-2026-000032 con desglose completo.

**AC-006**: Secuencialidad: último V-2026-004521 hash "abc123" → siguiente V-2026-004522, hash incluye "abc123".

**AC-007**: Anulación ticket cobrado: V-2026-004522 NO se elimina → rectificativa R-2026-000015 → asiento ajuste → IVA ajustado.

**AC-008**: Arqueo: fondo 200 + efectivo 1.034 - retirada 500 = esperado 734. Real 730 → descuadre -4€.

### Inventario

**AC-010**: Stock Ginebra 2000ml, escandallo GinTonic=50ml, vendo 3 → stock=1850ml.

**AC-011**: Ginebra 600ml, mínimo 1400ml → alerta "Stock bajo" visible en backoffice.

**AC-012**: Escandallo Ensalada César: 200g lechuga (merma 15%) → 235g brutos × 0,003€/g = 0,71€.

**AC-013**: Ron sistema=6 botellas, conteo=5 → desviación -1, stock ajustado a 5.

### Compras

**AC-020**: Factura Makro FM-34521: base 850€ + IVA 10% = 935€ → Asiento: Cargo 6020(850)+4720(85) → Abono 4000(935). IVA soportado +85€. Libro recibidas.

### Fiscal

**AC-030**: Q1-2026: repercutido 10%=12.000€ + 21%=3.200€ = 15.200€. Soportado=6.100€. Resultado 303=9.100€ a ingresar. Límite 20 abril.

**AC-031**: Makro 2026: 3.500+4.200+3.800+5.100=16.600€ > 3.005,06€ → incluir en 347 con desglose trimestral.

**AC-032**: Alquiler 2.000€/mes → Q1 retención 19% = 1.140€ (3×380€).

### RRHH

**AC-040**: Juan ficha 17:58→02:03 = 8h05min. Si jornada=8h → 5min extra.

**AC-041**: Juan turno acaba 02:00 sábado → turno propuesto sábado 10:00 → descanso 8h < 12h → RECHAZAR.

**AC-042**: Juan 78h extra + 3h más = 81h > 80h → alerta GRAVE, bloquear.

### CRM

**AC-050**: María Bronce 450pts, ticket 55€ → +55pts = 505pts → sube a Plata (≥500). Notificar.

**AC-051**: María 505pts, canjea 100 → descuento 5€, saldo 405pts.

**AC-052**: María 405pts, canjea 500 → RECHAZAR "insuficientes".

**AC-053**: Carlos sin consentimiento → campaña email → NO recibe, registrado como "excluido".

**AC-054**: María reserva viernes 21:00. A las 21:30 no aparece → no-show, liberar mesa.

### Contabilidad

**AC-060**: Ticket 55€ efectivo (base10%=40,91+IVA4,09 | base21%=8,26+IVA1,74) → Asiento: Cargo 5700(55) → Abono 7050(49,17) + 4770(5,83). 55=49,17+5,83 ✓

**AC-061**: Factura proveedor carne: base 200+IVA10%(20)=220 → Cargo 6020(200)+4720(20) → Abono 4000(220) ✓

---

## 12. MARCO REGULATORIO CLAVE

| Normativa | Impacto en GastroFlow |
|-----------|---------------------|
| Ley 37/1992 IVA + RD 1624/1992 | Tipos IVA: 10% comida, 21% alcohol, 4% productos sin elaborar |
| RD 1619/2012 Facturación | Tickets (hasta 3.000€ hostelería), facturas completas, contenido mínimo, numeración |
| RD 1007/2023 VeriFactu | Hash SHA-256 encadenado, inalterabilidad, trazabilidad, 4 años conservación |
| Ley 18/2022 Crea y Crece | Factura electrónica B2B |
| Modelo 303/390/347/111/115 | Declaraciones trimestrales/anuales con plazos y cálculos exactos |
| RD-Ley 8/2019 | Fichaje obligatorio, conservar 4 años |
| RGPD + LOPD-GDD | Consentimiento CRM, derechos ARCO+, datos empleados |
| LSSI-CE | Consentimiento para comunicaciones comerciales |
| Reglamento 852/2004 + RD 126/2015 | 14 alérgenos obligatorios en carta |

---

## 13. MODELO DE DATOS IMPLÍCITO

Deriva el modelo de datos de las entidades del glosario y las relaciones de las reglas:

```
Tenant (1) ──→ (N) Establecimiento
Establecimiento (1) ──→ (N) Zona ──→ (N) Mesa
Establecimiento (1) ──→ (N) Caja ──→ (N) TurnoCaja
Mesa (1) ──→ (N) Servicio ──→ (N) Comanda ──→ (N) LineaComanda
LineaComanda → Producto (con Modificadores)
Servicio → Cuenta → DivisiónCuenta → Ticket/FacturaSimplificada
Ticket → RegistroVeriFactu (hash encadenado)
Producto → CategoríaProducto + TipoIVA + Escandallo
Escandallo → (N) Ingrediente (con merma, cantidad)
Ingrediente → (N) Almacén (Stock por almacén)
Ingrediente → MovimientoStock (entrada/salida/ajuste/traspaso)
Proveedor → PedidoProveedor → AlbaránEntrada → FacturaCompra
FacturaCompra → AsientoContable + IVASoportado
Ticket → AsientoContable + IVARepercutido
AsientoContable → (N) Apunte (cuenta, cargo, abono)
Empleado → (N) Turno → Cuadrante
Empleado → (N) Fichaje
Cliente → ProgramaFidelización (puntos, nivel)
Cliente → (N) Reserva
Cliente → Consentimiento (datos, comunicaciones)
SerieFacturación → secuencia estricta sin saltos
```

---

## 14. INSTRUCCIONES DE IMPLEMENTACIÓN

### Stack tecnológico (sugerido, adaptar según contexto)
- **Backend**: API REST o GraphQL, arquitectura por módulos alineados con los 4 módulos funcionales (M1-M4)
- **Base de datos**: PostgreSQL (multitenancy por schema o por tabla con tenant_id)
- **Frontend**: SPA responsive (tablets para camarero/cocina, desktop para backoffice, web para cliente)
- **Eventos**: Sistema de eventos de dominio (puede ser in-process o message broker según escala)
- **VeriFactu**: Módulo dedicado para generación de hash SHA-256 encadenado

### Principios de diseño
1. **Domain-Driven Design**: Cada agente mapea a un bounded context
2. **Event-Driven**: Los eventos del dominio (Capa 07) son el mecanismo de comunicación entre módulos
3. **Multitenancy**: Aislamiento de datos por tenant desde día 1
4. **Audit trail**: Todo cambio en datos financieros/fiscales debe ser trazable e inalterable
5. **Idempotencia**: Las operaciones de cobro y facturación deben ser idempotentes

### Prioridad de implementación
1. **Primero**: INV-001 a INV-008 (fiscal/VeriFactu) — son infraestructura legal
2. **Segundo**: M1 (TPV) + WF-001 — es el core operativo diario
3. **Tercero**: M2 (ERP/inventario) + WF-002 — soporte al TPV
4. **Cuarto**: M3 (Contabilidad/Fiscal) + WF-003/004 — cumplimiento
5. **Quinto**: M4 (CRM) + WF-005 — valor añadido

### Validaciones críticas
- NUNCA generar un ticket sin número secuencial correcto
- NUNCA modificar un registro VeriFactu ya creado
- NUNCA permitir asiento contable que no cuadre (cargo ≠ abono)
- NUNCA permitir división de cuenta donde las partes no sumen el total
- NUNCA enviar comunicación comercial sin consentimiento verificado

---

## 15. CONVENCIONES DE IDs EN CÓDIGO

Usa estos prefijos para mantener trazabilidad con la especificación:

| Prefijo | Capa | Ejemplo código |
|---------|------|---------------|
| G-XXX | Glosario (entidades) | Modelos/entidades: Mesa, Servicio, Comanda... |
| HU-XXX | Historias | Features/endpoints |
| RN-XXX | Reglas negocio | Validaciones/servicios de dominio |
| INV-XXX | Invariantes | Asserts/guards/constraints |
| OP-XXX | Contratos | Métodos de servicio (pre/post conditions) |
| POL-XXX | Políticas | Strategy/decision functions |
| EVT-XXX | Eventos | Domain events |
| AG-XXX | Agentes | Modules/bounded contexts |
| SK-XXX | Skills | Use cases/application services |
| WF-XXX | Workflows | Orchestration/sagas |
| AC-XXX | Criterios | Test cases |
