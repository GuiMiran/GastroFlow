# CAPA 05 — CONTRATOS DE OPERACIÓN

> Para cada operación importante: Precondiciones (PRE), Postcondiciones (POST), Errores (ERROR).  
> Formato: `OP-XXX: NombreOperación`

---

## 05.1 — Operaciones de Sala / TPV

**OP-001: AbrirMesa**  
- PRE: La mesa existe. La mesa está en estado "libre" o "reservada" (si llega el cliente de la reserva).
- POST: La mesa pasa a estado "ocupada". Se crea un Servicio nuevo asociado a la mesa con hora de apertura = ahora. El servicio está en estado "activo".
- ERROR: Si la mesa ya está "ocupada" → rechazar con motivo "mesa ya tiene servicio activo".

**OP-002: TomarComanda**  
- PRE: La mesa tiene un servicio activo. Se selecciona al menos 1 producto. Todos los productos seleccionados existen en el catálogo y están activos.
- POST: Se crea una Comanda asociada al servicio. Cada producto se convierte en una Línea de Comanda con cantidad, precio, tipo IVA y modificadores. La comanda se envía a los destinos correspondientes (cocina/barra). Comanda estado = "enviada".
- ERROR: Si no hay servicio activo → rechazar. Si un producto no existe → rechazar esa línea.

**OP-003: AnularLineaComanda**  
- PRE: La línea de comanda existe. La comanda está en estado "enviada" (aún no en preparación).
- POST: La línea se marca como "anulada". No genera coste ni descuento de stock. Se notifica a destino (cocina/barra).
- ERROR: Si la comanda ya está "en preparación" → requiere autorización de encargado (escalar a OP-003b). Si ya está "servida" → rechazar, usar anulación de ticket (OP-010).

**OP-003b: AnularLineaComandaConAutorizacion**  
- PRE: La comanda está "en preparación" o "lista". El encargado autentica la anulación con su clave.
- POST: La línea se marca como "anulada con autorización". Se registra merma del stock si el ingrediente ya se consumió. Se registra quién autorizó.
- ERROR: Si la clave del encargado es inválida → rechazar.

**OP-004: CobrarMesa**  
- PRE: La mesa tiene servicio activo con al menos 1 comanda. Hay una cuenta calculada (total > 0). Se indica forma(s) de pago. La suma de pagos ≥ total de la cuenta.
- POST: Se genera ticket (factura simplificada) con número secuencial (INV-001). Se registra el hash VeriFactu encadenado (INV-008). El cobro se registra con forma(s) de pago. Si pago en efectivo > total → se calcula cambio. La mesa pasa a estado "libre". El servicio pasa a estado "cerrado". Se descuenta stock de ingredientes según escandallos (RN-041). Se genera asiento contable automático.
- ERROR: Si suma de pagos < total cuenta → rechazar con "importe insuficiente". Si no se puede generar número secuencial → error grave (parar, no generar ticket corrupto).

**OP-005: DividirCuenta**  
- PRE: La mesa tiene servicio activo con cuenta total > 0. Se indica método de división (partes iguales, por comensal con asignación de productos, o por importes personalizados).
- POST: Se generan N sub-cuentas cuya suma exacta = cuenta original (INV-013). Cada sub-cuenta tiene su propio desglose de IVA correcto. Cada sub-cuenta puede cobrarse independientemente.
- ERROR: Si la suma de las partes ≠ total → rechazar (corregir redondeo).

**OP-006: EmitirFacturaCompleta**  
- PRE: Existe un ticket cobrado. El cliente proporciona NIF válido y razón social/nombre. El importe no supera reglas de facturación o el cliente lo solicita.
- POST: Se genera factura completa con serie propia, numeración secuencial, datos del destinatario, desglose completo de bases e IVA. El ticket original queda referenciado. Se registra en libro de facturas emitidas.
- ERROR: Si NIF no es válido → advertir y requerir corrección. Si la factura completa ya se emitió para ese ticket → rechazar duplicado.

---

## 05.2 — Operaciones de Caja

**OP-010: AbrirTurnoCaja**  
- PRE: La caja existe. No hay turno activo en esa caja. Se indica cajero y fondo de caja (≥0€).
- POST: Turno creado en estado "activo" con: hora apertura, cajero, fondo registrado. La caja está operativa.
- ERROR: Si ya hay turno activo → rechazar o solicitar cierre previo.

**OP-011: ArqueoCaja (CerrarTurno)**  
- PRE: Existe turno activo en la caja. Se indica conteo de efectivo real.
- POST: Se calcula efectivo esperado (INV-015). Se registra descuadre = efectivo_real - efectivo_esperado. Turno pasa a estado "cerrado". Se genera informe de turno. La caja queda disponible para nuevo turno.
- ERROR: Si no hay turno activo → rechazar.

**OP-012: RetiradaEfectivo**  
- PRE: Existe turno activo. Importe de retirada > 0 e ≤ efectivo actual estimado en caja.
- POST: Se registra movimiento de salida. El efectivo esperado disminuye. Se registra motivo y quién retiró.
- ERROR: Si importe > efectivo estimado → advertencia (permitir pero avisar).

---

## 05.3 — Operaciones de Inventario

**OP-020: RegistrarAlbaranEntrada**  
- PRE: El pedido a proveedor existe (o se crea albarán sin pedido previo). Los ingredientes del albarán están dados de alta.
- POST: Se incrementa el stock de cada ingrediente recibido. Se registra fecha de recepción, proveedor, cantidades. Si hay pedido asociado, se actualizan diferencias (entregas parciales, faltas).
- ERROR: Si un ingrediente no existe → rechazar esa línea o crear el ingrediente.

**OP-021: RegistrarFacturaCompra**  
- PRE: El proveedor existe. La factura tiene: número, fecha, NIF proveedor, líneas con base e IVA.
- POST: Se registra la factura. Se genera asiento contable automático (cargo compras + IVA soportado, abono proveedores). Se actualiza el precio de coste de los ingredientes si es diferente al registrado. Se recalculan automáticamente los escandallos afectados. Se registra en libro de facturas recibidas.
- ERROR: Si ya existe una factura con ese número de ese proveedor → posible duplicado, advertir.

**OP-022: RealizarInventarioFisico**  
- PRE: Se selecciona un almacén. Para cada ingrediente contado se indica la cantidad real.
- POST: Se calcula desviación por ingrediente (stock teórico vs real). Se registra el ajuste. El stock del sistema se iguala al conteo real. Se genera informe de desviaciones.
- ERROR: Si el almacén no existe → rechazar.

**OP-023: DescontarStockPorVenta**  
- PRE: Se ha cobrado un ticket. Los productos del ticket tienen escandallos con ingredientes.
- POST: Para cada producto vendido, se descuentan los ingredientes según su escandallo: `stock[ingrediente] -= cantidad_escandallo × unidades_vendidas`. Si stock resultante < stock_mínimo → generar alerta.
- ERROR: Si un producto no tiene escandallo → no descontar stock pero registrar advertencia.

---

## 05.4 — Operaciones Contables y Fiscales

**OP-030: GenerarAsientoVenta**  
- PRE: Se ha cobrado un ticket. La información fiscal del ticket es completa (bases, IVA, forma de pago).
- POST: Se crea asiento contable con: Cargo a cuenta de caja/banco según forma de pago → Abono a cuenta de ventas (por base) + Abono a IVA repercutido (por cuota). El asiento cuadra (INV-030).
- ERROR: Si el asiento no cuadra → error grave, no registrar y alertar.

**OP-031: GenerarAsientoCompra**  
- PRE: Se ha registrado y validado una factura de compra.
- POST: Se crea asiento contable con: Cargo a cuenta de compra (por base) + Cargo a IVA soportado (por cuota) → Abono a cuenta de proveedores (por total). El asiento cuadra (INV-030).
- ERROR: Si el asiento no cuadra → error grave.

**OP-032: GenerarBorradorModelo303**  
- PRE: Se solicita un trimestre y año. Existen registros de ventas y compras para ese período.
- POST: Se genera un borrador con: IVA repercutido desglosado por tipo (4%, 10%, 21%), IVA soportado deducible, resultado a ingresar o compensar. Los importes coinciden con los libros de IVA (INV-004, INV-005, INV-006).
- ERROR: Si hay inconsistencias entre tickets y libro IVA → alertar y detallar las diferencias antes de generar.

**OP-033: EmitirFacturaRectificativa**  
- PRE: Existe la factura/ticket original. Se indica motivo (error, devolución, etc.) y tipo (sustitución o diferencias). Se indica el importe a rectificar.
- POST: Se genera factura rectificativa con serie "R", numeración secuencial propia, referencia a factura original. Se modifica el IVA repercutido del período. Se genera asiento contable de ajuste. Se registra en VeriFactu como nuevo registro (no modifica el original).
- ERROR: Si la factura original no existe → rechazar. Si el importe rectificado > original → advertir.

---

## 05.5 — Operaciones de CRM

**OP-040: RegistrarCliente**  
- PRE: Se proporcionan al menos nombre y un dato de contacto (email o teléfono).
- POST: Se crea ficha de cliente con datos proporcionados. Se inicia con 0 puntos y nivel Bronce. Se registra consentimiento de tratamiento de datos (o se solicita).
- ERROR: Si ya existe un cliente con mismo email → proponer fusionar fichas.

**OP-041: AcumularPuntos**  
- PRE: El cliente está registrado. Se ha cobrado un ticket. Importe > 0.
- POST: Se suman puntos según regla vigente (ej: 1 punto por € gastado). Se verifica si el cliente sube de nivel (y se aplican beneficios). Se actualiza saldo total.
- ERROR: Si el ticket ya tiene puntos asignados (doble asignación) → rechazar.

**OP-042: CrearReserva**  
- PRE: Se indica: fecha, hora, número comensales, datos de contacto del cliente. Existe disponibilidad para esa franja.
- POST: La reserva se registra con estado "confirmada". La mesa (si se asigna) pasa a "reservada" para esa franja. Se envía confirmación al cliente.
- ERROR: Si no hay disponibilidad → rechazar con alternativas. Si datos incompletos → solicitar mínimo requerido.

**OP-043: CancelarReserva**  
- PRE: La reserva existe y su fecha/hora es futura.
- POST: La reserva pasa a estado "cancelada". La mesa se libera. Se envía confirmación de cancelación al cliente.
- ERROR: Si la hora de la reserva ya pasó → no se cancela, se marca como "no-show".

---
