# CAPA 01 — GLOSARIO DE DOMINIO

> Lenguaje canónico del sistema. Toda la especificación usa EXCLUSIVAMENTE estos términos.  
> Si un término no está aquí, no existe en el dominio.

---

## 01.1 — Contexto: Operación de Sala / TPV

| ID | Término | Definición | Ejemplo | NO usar (sinónimos prohibidos) |
|----|---------|-----------|---------|-------------------------------|
| G-001 | **Mesa** | Unidad física o virtual de servicio donde se atiende a uno o más comensales. Tiene un estado (libre, ocupada, reservada, pendiente de cobro) y pertenece a una Zona. | Mesa 7, Terraza exterior | "Tabla", "puesto" |
| G-002 | **Zona** | Agrupación lógica de mesas que comparten ubicación física o características. | Terraza, Salón interior, Barra, VIP | "Área", "sección", "sector" |
| G-003 | **Comanda** | Pedido registrado por un camarero asociado a una mesa. Contiene una o más Líneas de Comanda. Una mesa puede tener varias comandas durante un servicio. | Comanda #1 de Mesa 7: 2x Cerveza, 1x Tortilla | "Pedido", "orden" |
| G-004 | **Línea de Comanda** | Cada producto individual dentro de una comanda, con cantidad, modificadores y precio. | "1x Cerveza artesana (sin gluten) — 3,50€" | "Ítem", "artículo" |
| G-005 | **Modificador** | Variación o instrucción especial sobre una línea de comanda. | "Sin cebolla", "Punto medio", "Extra queso", "Sin alcohol" | "Nota", "comentario" |
| G-006 | **Servicio** | Período completo de atención de una mesa desde que se abre hasta que se cierra tras el cobro. Un servicio puede incluir múltiples comandas. | Servicio de Mesa 7: apertura 21:00, cierre 23:15 | "Sesión", "turno de mesa" |
| G-007 | **Cuenta** | Importe total acumulado de todas las comandas de un servicio en una mesa, antes o después de dividir. | Cuenta de Mesa 7: 87,50€ (4 comandas) | "Nota", "ticket" (antes de cobrar) |
| G-008 | **División de Cuenta** | Separación de la cuenta de una mesa en múltiples tickets o facturas, por comensal, por importes iguales o por selección de productos. | Mesa 7: 4 comensales → 4 tickets de ~22€ | "Partir cuenta", "separar" |
| G-009 | **Ticket** | Documento de venta (factura simplificada) que se entrega al cliente tras el cobro. Cumple requisitos de VeriFactu. | Ticket #V-2026-001234 — Total: 22,30€ | "Recibo" (no es lo mismo legalmente) |
| G-010 | **Factura Completa** | Documento fiscal completo con todos los datos del emisor y receptor. Se emite cuando el cliente lo solicita o la operación supera 3.000€. | Factura F-2026-000012 a nombre de Empresa SL | "Factura" a secas se refiere siempre a factura completa |
| G-011 | **Factura Simplificada** | Documento fiscal reducido (ticket) permitido en hostelería hasta 3.000€. No requiere datos del destinatario. | Ticket de caja del bar | "Ticket fiscal" |
| G-012 | **Arqueo de Caja** | Proceso de cierre que compara el efectivo físico en caja con lo registrado por el sistema. | Arqueo turno noche: sistema 1.234€, caja física 1.230€, descuadre -4€ | "Cierre de caja" (el arqueo ES el cierre) |
| G-013 | **Turno de Caja** | Período durante el cual un cajero/camarero opera una caja. Inicia con apertura (fondo de caja) y termina con arqueo. | Turno de Juan: 18:00-02:00, fondo 200€ | "Sesión de caja" |
| G-014 | **Fondo de Caja** | Efectivo inicial con el que se abre un turno de caja, destinado a dar cambio. | Fondo de caja apertura: 200€ en monedas y billetes | "Cambio inicial" |
| G-015 | **Forma de Pago** | Método utilizado para liquidar una cuenta. | Efectivo, Tarjeta, Mixto (efectivo + tarjeta), Bizum, Invitación | "Método de pago" |

---

## 01.2 — Contexto: Productos y Catálogo

| ID | Término | Definición | Ejemplo | NO usar |
|----|---------|-----------|---------|---------|
| G-020 | **Producto** | Artículo vendible que aparece en la carta del establecimiento. Tiene precio, tipo IVA, categoría y opcionalmente un Escandallo. | Hamburguesa Clásica (10% IVA, 12,50€) | "Artículo", "ítem" |
| G-021 | **Categoría de Producto** | Agrupación de productos para organización de carta y reporting. | Entrantes, Carnes, Pescados, Postres, Cervezas, Combinados, Refrescos | "Familia", "grupo" |
| G-022 | **Tipo IVA del Producto** | Clasificación fiscal del producto que determina el tipo impositivo aplicable según la normativa española. | Alimentación servida = 10%, Bebida alcohólica = 21% | "Categoría fiscal" |
| G-023 | **Escandallo** | Ficha técnica que descompone un producto vendible en sus ingredientes con cantidades exactas y costes unitarios. Permite calcular el **coste teórico** de un plato. | Escandallo de "Gin Tonic": 50ml Ginebra (0,80€) + 200ml Tónica (0,40€) + Hielo (0,05€) + Limón (0,03€) = Coste: 1,28€ | "Receta" (se acepta como sinónimo coloquial pero el término oficial es Escandallo) |
| G-024 | **Ingrediente** | Materia prima que forma parte de un escandallo y se gestiona en inventario. | Ginebra Tanqueray, Tónica Schweppes, Lechuga Iceberg | "Insumo", "materia prima" |
| G-025 | **Merma** | Porcentaje de ingrediente que se pierde en la manipulación (limpieza, cocción, desperdicio). Se aplica sobre la cantidad bruta para obtener la cantidad neta utilizable. | Lechuga: merma 15% (de 1kg bruto, 850g útiles) | "Desperdicio", "pérdida" |
| G-026 | **Coste Teórico** | Coste estimado de producir un producto según su escandallo, antes de mermas reales y variaciones de precio. | Gin Tonic: coste teórico 1,28€, PVP 9,50€, margen teórico 86,5% | "Coste de receta" |
| G-027 | **Food Cost** | Porcentaje del coste del producto sobre su precio de venta. Indicador clave en hostelería. | Gin Tonic: food cost = 1,28€ / 9,50€ = 13,5% | "Ratio de coste" |
| G-028 | **Alérgeno** | Sustancia que puede causar reacción alérgica y cuya presencia debe informarse por ley (14 alérgenos regulados en UE). | Gluten, Crustáceos, Huevos, Pescado, Cacahuetes, Soja, Lácteos, Frutos de cáscara, Apio, Mostaza, Sésamo, Sulfitos, Altramuces, Moluscos | N/A |

---

## 01.3 — Contexto: Inventario y Almacén

| ID | Término | Definición | Ejemplo | NO usar |
|----|---------|-----------|---------|---------|
| G-030 | **Almacén** | Espacio físico o lógico donde se almacenan ingredientes y productos. Un establecimiento puede tener varios almacenes. | Almacén general, Cámara frigorífica, Bodega, Barra | "Depósito" |
| G-031 | **Stock** | Cantidad actual de un ingrediente o producto en un almacén en un momento dado. | Ginebra Tanqueray: 4 botellas (2,8 litros) en Barra | "Existencias", "inventario" (inventario es el proceso) |
| G-032 | **Stock Mínimo** | Cantidad por debajo de la cual se debe generar una alerta de reposición. | Ginebra Tanqueray: stock mínimo = 2 botellas | "Punto de pedido" |
| G-033 | **Inventario** | Proceso de conteo físico del stock real para contrastarlo con el stock teórico del sistema. | Inventario mensual de bodega: contar botellas vs sistema | "Recuento", "conteo" |
| G-034 | **Desviación de Inventario** | Diferencia entre el stock teórico (según sistema) y el stock real (conteo). | Sistema dice 6 botellas de ron, conteo real 5 → desviación -1 | "Descuadre" |
| G-035 | **Movimiento de Stock** | Cualquier entrada o salida de stock de un almacén. Siempre trazable. | Entrada por compra, Salida por venta, Salida por merma, Traspaso entre almacenes | "Transacción de almacén" |
| G-036 | **Unidad de Medida** | Forma en que se mide un ingrediente. Puede tener conversiones (ej: botella = 700ml). | Kg, litros, unidades, botellas (con equivalencia en ml) | N/A |

---

## 01.4 — Contexto: Compras y Proveedores

| ID | Término | Definición | Ejemplo | NO usar |
|----|---------|-----------|---------|---------|
| G-040 | **Proveedor** | Empresa o persona física que suministra ingredientes, productos o servicios al establecimiento. | Mahou SA, Distribuciones García, Makro | "Suministrador" |
| G-041 | **Pedido a Proveedor** | Solicitud formal de mercancía a un proveedor. Contiene productos, cantidades y precios pactados. | Pedido #P-2026-045 a Makro: 10 cajas cerveza, 5kg ternera | "Orden de compra" |
| G-042 | **Albarán de Entrada** | Documento que acredita la recepción de mercancía. Se coteja con el pedido. | Albarán de Makro: recibidas 10 cajas cerveza (conforme) + 4kg ternera (falta 1kg) | "Nota de entrega" |
| G-043 | **Factura de Compra** | Documento fiscal emitido por el proveedor. Genera IVA soportado deducible. | Factura de Makro #FM-34521: base 850€ + IVA 10% (85€) = 935€ | "Factura de proveedor" |
| G-044 | **Precio de Coste** | Precio al que se adquiere un ingrediente al proveedor (sin IVA). Base del cálculo de escandallos. | Ternera: 12,50€/kg (precio de coste) | "Precio de compra" |

---

## 01.5 — Contexto: Fiscal y Contable

| ID | Término | Definición | Ejemplo | NO usar |
|----|---------|-----------|---------|---------|
| G-050 | **IVA Repercutido** | IVA que el establecimiento cobra al cliente en cada venta y que debe ingresar a Hacienda. | Ticket de 50€ con IVA incluido → base: 45,45€, IVA repercutido: 4,55€ (al 10%) | "IVA de ventas", "IVA cobrado" |
| G-051 | **IVA Soportado** | IVA que el establecimiento paga a sus proveedores en cada compra y que puede deducirse. | Factura proveedor: base 100€ + IVA 21€ → IVA soportado: 21€ | "IVA de compras", "IVA pagado" |
| G-052 | **Liquidación de IVA** | Resultado de IVA repercutido menos IVA soportado en un período. Si es positivo, se paga a Hacienda. Si es negativo, se compensa o solicita devolución. | Trimestre: repercutido 15.000€ - soportado 6.000€ = a pagar 9.000€ | "Declaración de IVA" (no es lo mismo que liquidación) |
| G-053 | **Modelo 303** | Declaración trimestral de autoliquidación de IVA ante la AEAT. | Modelo 303 T1-2026: a ingresar 9.000€, plazo hasta 20 abril 2026 | N/A |
| G-054 | **Modelo 390** | Declaración-resumen anual de IVA. | Modelo 390 ejercicio 2025: resumen de los 4 trimestres | N/A |
| G-055 | **Modelo 347** | Declaración informativa anual de operaciones con terceros que superan 3.005,06€ en el año natural. | Declarar operaciones con Makro si compras anuales > 3.005,06€ | N/A |
| G-056 | **Modelo 111** | Declaración trimestral de retenciones e ingresos a cuenta del IRPF (trabajadores y profesionales). | Modelo 111 T1-2026: retenciones a empleados del trimestre | N/A |
| G-057 | **Modelo 115** | Declaración trimestral de retenciones por alquiler de inmuebles urbanos. | Modelo 115: retención 19% del alquiler del local | N/A |
| G-058 | **Asiento Contable** | Registro en el libro diario que refleja un hecho económico con cargo(s) y abono(s) que siempre cuadran. | Venta ticket: Cargo Caja 55€ → Abono Ventas 50€ + Abono IVA repercutido 5€ | "Apunte", "registro" |
| G-059 | **Plan General Contable (PGC)** | Marco normativo que define las cuentas contables, su estructura y las normas de registro. En {{NOMBRE_PRODUCTO}} se usa el PGC Pymes. | Cuenta 7000: Ventas de mercaderías, Cuenta 4720: HP IVA soportado | N/A |
| G-060 | **Hecho Imponible** | Operación económica sujeta a un impuesto. En hostelería, cada prestación de servicio (servir comida/bebida) es un hecho imponible del IVA. | Servir un plato de comida = hecho imponible IVA | "Evento fiscal" |
| G-061 | **Base Imponible** | Importe sobre el que se calcula el impuesto, antes de aplicar el tipo. | Menú a 15€ IVA incluido → base imponible = 15 / 1,10 = 13,64€ | "Base", "importe neto" |
| G-062 | **Devengo** | Momento en que nace la obligación tributaria. En hostelería, cuando se presta el servicio (se cobra). | El IVA de un ticket se devenga al cobrar, no al tomar la comanda | "Causación" |
| G-063 | **Libro Registro de Facturas Emitidas** | Libro obligatorio donde se registran todas las facturas y tickets emitidos. | Libro IVA emitidas trimestre 1: 4.523 tickets registrados | "Libro de ventas" |
| G-064 | **Libro Registro de Facturas Recibidas** | Libro obligatorio donde se registran todas las facturas de compra. | Libro IVA recibidas trimestre 1: 87 facturas de proveedores | "Libro de compras" |
| G-065 | **VeriFactu** | Sistema de verificación de facturas que exige que los registros de facturación sean inalterables, con hash encadenado y trazabilidad. | Cada ticket del TPV genera un registro VeriFactu con hash SHA-256 encadenado al anterior | N/A |

---

## 01.6 — Contexto: RRHH y Laboral

| ID | Término | Definición | Ejemplo | NO usar |
|----|---------|-----------|---------|---------|
| G-070 | **Empleado** | Persona física que presta servicios para el establecimiento bajo relación laboral. | Juan Pérez, Camarero, contrato indefinido | "Trabajador" (se acepta como sinónimo pero el término estándar es Empleado) |
| G-071 | **Turno** | Franja horaria asignada a un empleado en un día concreto. | Turno de Juan: jueves 18:00-02:00 (servicio noche) | "Horario" (el horario es el conjunto de turnos) |
| G-072 | **Cuadrante** | Planificación semanal o mensual de los turnos de todos los empleados. | Cuadrante semana 12: quién trabaja cada día y en qué turno | "Planning", "roster" |
| G-073 | **Fichaje** | Registro temporal del inicio y fin de jornada de un empleado. Obligatorio por RD 8/2019. | Fichaje Juan: entrada 17:58, salida 02:03 | "Marcaje", "control de presencia" |
| G-074 | **Horas Extra** | Horas trabajadas por encima de la jornada legal/convenio. Máximo 80h/año según ET. | Juan: 2h extra el viernes (turno extendido por evento) | "Horas adicionales" |

---

## 01.7 — Contexto: CRM y Cliente

| ID | Término | Definición | Ejemplo | NO usar |
|----|---------|-----------|---------|---------|
| G-080 | **Cliente** | Persona que consume en el establecimiento. Puede ser anónimo (no registrado) o registrado (con ficha CRM). | Cliente registrado: María García, email, teléfono, historial | "Consumidor", "usuario" |
| G-081 | **Reserva** | Asignación anticipada de una mesa para una fecha, hora y número de comensales determinados. | Reserva: María García, 4 personas, viernes 21:00, Mesa 12 | "Booking" |
| G-082 | **Programa de Fidelización** | Sistema de recompensas que incentiva la recurrencia del cliente. Basado en puntos, niveles o ambos. | Por cada 10€ de consumo = 1 punto. 100 puntos = 5€ de descuento | "Loyalty", "programa de puntos" |
| G-083 | **Nivel de Fidelización** | Categoría del cliente según su acumulado de consumo o visitas. Desbloquea beneficios. | Bronce (<500 puntos), Plata (500-1500), Oro (>1500) | "Tier", "categoría" |
| G-084 | **Promoción** | Acción comercial con condiciones y vigencia que modifica precio o aporta beneficio. | "2x1 en cócteles los miércoles", "10% dto en tu cumpleaños" | "Oferta", "descuento" (son tipos de promoción, no sinónimos) |
| G-085 | **Comunicación** | Mensaje enviado a clientes registrados por email, SMS o push. Debe cumplir LSSI-CE (consentimiento). | Email: "María, este viernes tienes 2x1 en cócteles" | "Newsletter", "mailing" |

---

## 01.8 — Contexto: Establecimiento y Configuración

| ID | Término | Definición | Ejemplo | NO usar |
|----|---------|-----------|---------|---------|
| G-090 | **Establecimiento** | Unidad de negocio física (un local concreto). Un tenant puede tener varios establecimientos. | "Bar La Esquina — Calle Mayor 5, Madrid" | "Local", "tienda", "restaurante" (son tipos de establecimiento) |
| G-091 | **Tenant** | Entidad cliente del SaaS (el negocio que paga la suscripción). Puede tener 1 o más establecimientos. | "Grupo Restauración García SL" con 3 establecimientos | "Cuenta", "organización" |
| G-092 | **Ejercicio Fiscal** | Período contable, normalmente coincidente con el año natural (enero-diciembre). | Ejercicio 2026: del 01/01/2026 al 31/12/2026 | "Año contable", "período" |
| G-093 | **Serie de Facturación** | Secuencia numérica independiente para facturas. Puede haber varias series (ventas, rectificativas, etc.). | Serie V: tickets venta (V-2026-000001), Serie R: rectificativas (R-2026-000001) | "Numeración" |
| G-094 | **Caja** | Punto de cobro físico o lógico. Un establecimiento puede tener varias cajas. | Caja 1 (barra), Caja 2 (salón), Caja 3 (terraza) | "Terminal", "punto de venta" |

---
