# CAPA 02 — HISTORIAS DE USUARIO

> **⚠️ DEPRECATED** — Este archivo monolítico ha sido reemplazado por la estructura modular.  
> Consultar los archivos individuales por módulo/ámbito:
>
> - `M1-TPV/_index.md` → 19 historias (SAL, CMD, COB, CAJ)
> - `M2-ERP/_index.md` → 18 historias (CAT, INV, COM, RRH)
> - `M3-CONTABILIDAD/_index.md` → 10 historias (ASI, IMP)
> - `M4-CRM/_index.md` → 12 historias (RES, FID, CMP)
>
> Codificación nueva: `HU-M{n}-{ÁMBITO}-{seq}` (ej: HU-M1-COB-001)  
> Tabla de correspondencia antigua ↔ nueva: ver `_index.md` de cada módulo.  
> **No editar este archivo. Solo se conserva como referencia histórica.**

> Formato: COMO [rol] QUIERO [acción] PARA [beneficio]  
> Prioridad: **Must** = obligatorio Fase 1 | **Should** = importante | **Could** = deseable  
> Criterios de aceptación: DADO/CUANDO/ENTONCES

---

## M1 — MÓDULO TPV / VENTAS

### Gestión de Mesas y Zonas

**HU-001** | Must  
COMO **propietario** QUIERO **configurar las zonas y mesas de mi establecimiento** PARA que el personal de sala vea el mapa real del local.

- AC: DADO que soy propietario CUANDO creo una zona "Terraza" con 8 mesas ENTONCES aparece en el mapa del TPV con las 8 mesas en estado "libre".
- AC: DADO que una mesa está ocupada CUANDO la veo en el mapa ENTONCES aparece visualmente diferenciada (color/icono).

**HU-002** | Must  
COMO **camarero** QUIERO **abrir una mesa** PARA iniciar un servicio y poder tomar comandas.

- AC: DADO que la Mesa 7 está libre CUANDO la abro ENTONCES pasa a estado "ocupada", se registra la hora de apertura y puedo añadir comandas.
- AC: DADO que la Mesa 7 ya está ocupada CUANDO intento abrirla ENTONCES el sistema me informa de que ya tiene un servicio activo.

**HU-003** | Should  
COMO **camarero** QUIERO **cambiar una mesa de sitio (mover servicio)** PARA reubicar clientes sin perder las comandas.

- AC: DADO que Mesa 7 tiene 2 comandas CUANDO la muevo a Mesa 12 ENTONCES todas las comandas se trasladan a Mesa 12 y Mesa 7 queda libre.

**HU-004** | Should  
COMO **camarero** QUIERO **unir dos mesas en un solo servicio** PARA atender grupos grandes.

- AC: DADO que Mesa 7 y Mesa 8 están libres CUANDO las uno ENTONCES se crea un servicio conjunto "Mesa 7+8" con una sola cuenta.

---

### Comandas

**HU-010** | Must  
COMO **camarero** QUIERO **tomar una comanda en una mesa** PARA registrar lo que piden los clientes.

- AC: DADO que Mesa 7 está ocupada CUANDO añado "2x Cerveza, 1x Tortilla, 1x Gin Tonic" ENTONCES la comanda se registra con los precios, IVAs y se envía a los destinos (cocina/barra).
- AC: DADO que añado un producto con alérgenos CUANDO confirmo la comanda ENTONCES se muestra una alerta visual de alérgenos.

**HU-011** | Must  
COMO **camarero** QUIERO **añadir modificadores a un producto** PARA personalizar el pedido del cliente.

- AC: DADO que añado "1x Hamburguesa" CUANDO selecciono modificador "Sin cebolla" y "Punto medio" ENTONCES la comanda incluye los modificadores y se muestran en cocina.

**HU-012** | Must  
COMO **cocinero** QUIERO **ver las comandas en tiempo real en pantalla** PARA preparar los platos en orden.

- AC: DADO que el camarero confirma una comanda con productos de cocina CUANDO llega a la pantalla de cocina ENTONCES aparece con la hora de entrada, mesa y detalle de platos.
- AC: DADO que marco un plato como "listo" CUANDO lo confirmo ENTONCES el camarero recibe notificación de que el plato está para servir.

**HU-013** | Should  
COMO **barman** QUIERO **ver solo las comandas de bebidas en mi pantalla** PARA prepararlas sin confundirme con los platos.

- AC: DADO que una comanda tiene cerveza y tortilla CUANDO se envía ENTONCES la tortilla va a pantalla cocina y la cerveza va a pantalla barra.

**HU-014** | Must  
COMO **camarero** QUIERO **anular una línea de comanda antes de que se prepare** PARA corregir errores.

- AC: DADO que la comanda aún no se ha marcado como "en preparación" CUANDO anulo la línea ENTONCES se elimina y el stock no se descuenta.
- AC: DADO que la comanda ya está "en preparación" CUANDO intento anular ENTONCES se requiere autorización del encargado.

**HU-015** | Could  
COMO **camarero** QUIERO **repetir la última comanda (o parte de ella)** PARA agilizar cuando el cliente pide "otra ronda".

- AC: DADO que Mesa 7 tiene una comanda previa con "4x Cerveza" CUANDO pulso "repetir ronda" ENTONCES se crea nueva comanda con "4x Cerveza".

---

### Cobro y Facturación

**HU-020** | Must  
COMO **camarero** QUIERO **cobrar una mesa** PARA cerrar el servicio y liberar la mesa.

- AC: DADO que Mesa 7 tiene cuenta de 87,50€ CUANDO cobro en efectivo con 100€ ENTONCES el sistema calcula cambio 12,50€, genera ticket, y la mesa pasa a "libre".
- AC: DADO que cobro con tarjeta CUANDO paso la tarjeta ENTONCES se registra como pago tarjeta y se genera ticket.

**HU-021** | Must  
COMO **camarero** QUIERO **dividir la cuenta de una mesa** PARA que cada comensal pague lo suyo.

- AC: DADO que Mesa 7 tiene 4 comensales y cuenta de 80€ CUANDO divido a partes iguales ENTONCES se generan 4 tickets de 20€ cada uno.
- AC: DADO que divido por productos CUANDO asigno las cervezas a Comensal 1 y la comida a Comensal 2 ENTONCES cada ticket tiene solo los productos asignados con su IVA correcto.
- AC: DADO que divido la cuenta CUANDO un producto tiene IVA 10% y otro 21% ENTONCES cada ticket parcial calcula su IVA correctamente según los productos que contiene.

**HU-022** | Must  
COMO **camarero** QUIERO **cobrar con pago mixto** PARA cuando el cliente paga parte en efectivo y parte en tarjeta.

- AC: DADO que la cuenta es 50€ CUANDO el cliente paga 20€ en efectivo y 30€ con tarjeta ENTONCES se registran ambas formas de pago y se genera un solo ticket por 50€.

**HU-023** | Must  
COMO **cliente** QUIERO **pedir factura completa con mis datos fiscales** PARA deducirme el gasto.

- AC: DADO que el cliente proporciona su NIF y razón social CUANDO se emite la factura ENTONCES se genera factura completa (no simplificada) con todos los datos fiscales, desglose de IVA y numeración secuencial de serie de facturas completas.

**HU-024** | Should  
COMO **propietario** QUIERO **aplicar descuentos o invitaciones** PARA gestionar cortesías a clientes especiales.

- AC: DADO que quiero invitar a un café de 1,50€ CUANDO aplico "invitación" sobre esa línea ENTONCES el importe se descuenta de la cuenta pero se registra contablemente como gasto de representación.
- AC: DADO que aplico un descuento del 10% a la cuenta CUANDO cobro ENTONCES el ticket refleja el descuento y la base imponible se recalcula.

**HU-025** | Must  
COMO **camarero/cajero** QUIERO **que cada ticket cumpla con VeriFactu** PARA cumplir la normativa.

- AC: DADO que cobro y se genera un ticket CUANDO el sistema lo registra ENTONCES incluye el hash encadenado con el ticket anterior, es inalterable y queda trazado en el registro VeriFactu.

---

### Caja

**HU-030** | Must  
COMO **cajero** QUIERO **abrir turno de caja con un fondo** PARA empezar a operar.

- AC: DADO que abro la Caja 1 con fondo de 200€ CUANDO confirmo ENTONCES el turno queda registrado con la hora, el cajero y el fondo.

**HU-031** | Must  
COMO **cajero** QUIERO **hacer el arqueo de caja al cerrar turno** PARA cuadrar el efectivo.

- AC: DADO que el sistema registra ventas en efectivo por 1.234€ CUANDO cuento 1.230€ en caja ENTONCES el sistema muestra descuadre de -4€ y lo registra.
- AC: DADO que el turno se cierra CUANDO confirmo el arqueo ENTONCES se genera un informe de turno con: total ventas, formas de pago, descuadre, fondo final.

**HU-032** | Should  
COMO **propietario** QUIERO **hacer retiradas de efectivo durante el turno** PARA llevar el exceso al banco.

- AC: DADO que retiro 500€ de caja CUANDO lo registro ENTONCES el sistema descuenta 500€ del efectivo esperado sin afectar al cuadre de ventas.

---

## M2 — MÓDULO ERP / BACKOFFICE

### Catálogo de Productos y Escandallos

**HU-040** | Must  
COMO **propietario** QUIERO **dar de alta productos en la carta** PARA que aparezcan en el TPV.

- AC: DADO que creo "Hamburguesa Clásica" con PVP 12,50€, categoría "Carnes" y tipo IVA "Alimentación 10%" CUANDO guardo ENTONCES el producto aparece disponible en el TPV bajo "Carnes".
- AC: DADO que creo "Gin Tonic" con PVP 9,50€ y tipo IVA "Alcohol 21%" CUANDO guardo ENTONCES aplica IVA 21%.

**HU-041** | Must  
COMO **propietario** QUIERO **crear el escandallo (ficha técnica) de un producto** PARA saber su coste real y descontar stock al vender.

- AC: DADO que creo el escandallo de "Gin Tonic": 50ml Ginebra (0,80€) + 200ml Tónica (0,40€) + hielo + limón CUANDO guardo ENTONCES el sistema calcula coste teórico 1,28€ y food cost 13,5%.
- AC: DADO que cambio el precio de la Ginebra a 0,95€ CUANDO actualizo ENTONCES el coste del Gin Tonic se recalcula automáticamente.

**HU-042** | Must  
COMO **propietario** QUIERO **indicar los alérgenos de cada producto** PARA cumplir la normativa de información alimentaria.

- AC: DADO que la Hamburguesa lleva pan (gluten), huevo (huevos), lechuga CUANDO configuro alérgenos ENTONCES marca "Gluten" y "Huevos" y esta información se muestra en carta digital y alertas de comanda.

**HU-043** | Should  
COMO **jefe de cocina** QUIERO **definir mermas por ingrediente** PARA que el coste teórico sea más preciso.

- AC: DADO que la lechuga tiene merma del 15% CUANDO el escandallo usa 200g de lechuga ENTONCES calcula que necesita 235g brutos.

---

### Inventario y Stock

**HU-050** | Must  
COMO **sistema** QUIERO **descontar automáticamente los ingredientes del stock al vender un producto** PARA mantener el inventario actualizado.

- AC: DADO que vendo 1 Gin Tonic con escandallo (50ml ginebra + 200ml tónica) CUANDO se cobra el ticket ENTONCES se descuentan 50ml del stock de Ginebra y 200ml del stock de Tónica.

**HU-051** | Must  
COMO **encargado de compras** QUIERO **ver alertas cuando un ingrediente baje del stock mínimo** PARA hacer el pedido a tiempo.

- AC: DADO que la Ginebra tiene stock mínimo de 2 botellas CUANDO el stock baja a 1,5 botellas ENTONCES se genera alerta visible en el backoffice.

**HU-052** | Must  
COMO **encargado** QUIERO **hacer un inventario manual (conteo)** PARA detectar desviaciones.

- AC: DADO que el sistema dice 6 botellas de ron CUANDO cuento y registro 5 ENTONCES el sistema muestra desviación de -1 y ajusta el stock real.

**HU-053** | Should  
COMO **propietario** QUIERO **ver el informe de desviaciones de inventario** PARA detectar robos, mermas excesivas o errores.

- AC: DADO que hay 15 ingredientes con desviación CUANDO genero el informe ENTONCES muestra por cada uno: stock teórico, stock real, desviación en unidades y en euros.

**HU-054** | Should  
COMO **encargado** QUIERO **traspasar stock entre almacenes** PARA distribuir mercancía (de almacén general a barra).

- AC: DADO que traspaso 5 botellas de cerveza de "Almacén" a "Barra" CUANDO confirmo ENTONCES se resta de Almacén y se suma a Barra, con registro del movimiento.

---

### Compras y Proveedores

**HU-060** | Must  
COMO **encargado de compras** QUIERO **dar de alta proveedores con sus datos fiscales** PARA gestionar pedidos y facturas.

- AC: DADO que creo proveedor "Makro" con NIF, dirección, contacto CUANDO guardo ENTONCES queda disponible para crear pedidos y asociar facturas.

**HU-061** | Must  
COMO **encargado de compras** QUIERO **crear un pedido a proveedor** PARA solicitar mercancía.

- AC: DADO que necesito cerveza y ternera de Makro CUANDO creo pedido con cantidades y precios pactados ENTONCES el pedido queda registrado con estado "Pendiente".

**HU-062** | Must  
COMO **encargado de compras** QUIERO **registrar la recepción de mercancía (albarán)** PARA verificar que llegó lo que pedí.

- AC: DADO que llega el pedido de Makro CUANDO registro el albarán ENTONCES contrasto con el pedido original y marco diferencias (faltas, excesos, productos erróneos).
- AC: DADO que la recepción es conforme CUANDO confirmo el albarán ENTONCES el stock se actualiza automáticamente con las cantidades recibidas.

**HU-063** | Must  
COMO **encargado de compras** QUIERO **registrar/subir facturas de proveedores** PARA controlar gastos y contabilizar IVA soportado.

- AC: DADO que subo la factura de Makro #FM-34521 CUANDO la registro ENTONCES se extrae/valida: proveedor, base imponible, IVA, total, fecha, número de factura.
- AC: DADO que la factura se registra CUANDO se confirma ENTONCES genera automáticamente el asiento contable de compra y registra el IVA soportado.

**HU-064** | Could  
COMO **encargado de compras** QUIERO **que el sistema lea automáticamente (OCR) las facturas de proveedor** PARA no meterlas a mano.

- AC: DADO que subo foto/PDF de la factura CUANDO el OCR la procesa ENTONCES extrae: proveedor, NIF, fecha, número, líneas, IVA, total y lo presenta para validación.

---

### RRHH — Turnos y Fichaje

**HU-070** | Must  
COMO **propietario** QUIERO **dar de alta empleados con sus datos laborales** PARA gestionar turnos y cumplir obligaciones.

- AC: DADO que creo empleado "Juan Pérez", camarero, contrato indefinido, 40h/semana CUANDO guardo ENTONCES queda registrado con su categoría, tipo contrato y jornada.

**HU-071** | Must  
COMO **propietario** QUIERO **crear cuadrantes de turnos semanales** PARA organizar al equipo.

- AC: DADO que tengo 6 camareros CUANDO asigno turnos para la semana ENTONCES se genera cuadrante visible para todos y se detectan conflictos (misma persona en dos turnos simultáneos).

**HU-072** | Must  
COMO **empleado** QUIERO **fichar mi entrada y salida** PARA cumplir la ley de registro de jornada.

- AC: DADO que Juan empieza su turno CUANDO ficha entrada a las 17:58 ENTONCES queda registrado con hora exacta.
- AC: DADO que Juan termina CUANDO ficha salida a las 02:03 ENTONCES se calcula horas trabajadas (8h 05min) y se registra.

**HU-073** | Should  
COMO **propietario** QUIERO **ver un informe de horas trabajadas y extras** PARA controlar costes laborales.

- AC: DADO que quiero ver las horas de marzo CUANDO genero el informe ENTONCES muestra por empleado: horas ordinarias, horas extra, ausencias y total.

---

## M3 — MÓDULO CONTABILIDAD Y FISCAL

### Asientos Automáticos

**HU-080** | Must  
COMO **contable** QUIERO **que cada ticket/factura de venta genere automáticamente su asiento contable** PARA tener la contabilidad al día sin trabajo manual.

- AC: DADO que se cobra un ticket de 55€ (base 50€ + IVA 5€) en efectivo CUANDO se cierra el ticket ENTONCES se genera asiento: Cargo 5700-Caja (55€) → Abono 7000-Ventas (50€) + Abono 4770-IVA Repercutido (5€).
- AC: DADO que se cobra con tarjeta CUANDO se cierra ENTONCES se usa cuenta 5730 en vez de 5700.

**HU-081** | Must  
COMO **contable** QUIERO **que cada factura de compra genere automáticamente su asiento contable** PARA registrar gastos e IVA soportado.

- AC: DADO que registro factura de proveedor de carne por base 200€ + IVA 10% (20€) CUANDO confirmo la factura ENTONCES se genera asiento: Cargo 6000-Compras (200€) + Cargo 4720-IVA Soportado (20€) → Abono 4000-Proveedores (220€).

**HU-082** | Should  
COMO **contable** QUIERO **revisar y modificar los asientos automáticos** PARA corregir excepciones o añadir información.

- AC: DADO que un asiento automático necesita ajuste CUANDO lo edito ENTONCES queda el asiento original (no se borra) más el asiento de ajuste, manteniendo trazabilidad.

**HU-083** | Must  
COMO **contable** QUIERO **consultar el libro diario, mayor, balance y PyG** PARA tener la visión contable completa.

- AC: DADO que pido el balance del mes CUANDO lo genero ENTONCES muestra activo/pasivo/patrimonio neto con todas las cuentas según PGC Pymes y cuadra.

---

### Impuestos

**HU-090** | Must  
COMO **propietario** QUIERO **ver en tiempo real cuánto IVA debo a Hacienda este trimestre** PARA no gastarme ese dinero.

- AC: DADO que estamos a 15 de febrero CUANDO consulto el dashboard fiscal ENTONCES veo: IVA repercutido acumulado Q1, IVA soportado acumulado Q1, resultado estimado a pagar/compensar, fecha límite de presentación.

**HU-091** | Must  
COMO **contable** QUIERO **generar el borrador del Modelo 303** PARA presentar la declaración trimestral de IVA.

- AC: DADO que es fin de trimestre CUANDO pido el borrador del 303 ENTONCES el sistema genera el formulario con: casillas de IVA repercutido (al 4%, 10%, 21%), casillas de IVA soportado deducible, resultado de la liquidación, datos de identificación.

**HU-092** | Must  
COMO **contable** QUIERO **generar el Libro Registro de Facturas Emitidas y Recibidas** PARA cumplir obligaciones y facilitar inspecciones.

- AC: DADO que pido el libro de emitidas del Q1 CUANDO lo genero ENTONCES lista todos los tickets y facturas con: número, fecha, base imponible, tipo IVA, cuota IVA, total. Agrupado y totalizado.

**HU-093** | Should  
COMO **contable** QUIERO **generar el borrador del Modelo 347** PARA declarar operaciones con terceros >3.005,06€.

- AC: DADO que compré 12.000€ anuales a Makro CUANDO genero el 347 ENTONCES Makro aparece con el total de operaciones, desglosado por trimestre.

**HU-094** | Should  
COMO **contable** QUIERO **generar el borrador del Modelo 111** PARA declarar retenciones de IRPF a empleados.

- AC: DADO que es fin de trimestre y hay 8 empleados con retenciones CUANDO pido el 111 ENTONCES muestra perceptores, retenciones practicadas y total a ingresar.

**HU-095** | Should  
COMO **contable** QUIERO **generar el borrador del Modelo 115** PARA declarar retenciones del alquiler del local.

- AC: DADO que el alquiler del local es 2.000€/mes con retención del 19% CUANDO pido el 115 del Q1 ENTONCES muestra retención: 3 × 380€ = 1.140€ a ingresar.

---

## M4 — MÓDULO CRM / WEB USUARIO

### Reservas

**HU-100** | Must  
COMO **cliente** QUIERO **reservar una mesa online** PARA asegurar mi sitio sin llamar por teléfono.

- AC: DADO que la web muestra disponibilidad para el viernes 21:00 CUANDO selecciono 4 personas y confirmo ENTONCES recibo confirmación por email/SMS y la reserva aparece en el sistema del restaurante.

**HU-101** | Must  
COMO **camarero** QUIERO **ver las reservas del día en el mapa de mesas** PARA saber qué mesas están reservadas y a qué hora.

- AC: DADO que hay 3 reservas para hoy CUANDO veo el mapa de mesas ENTONCES las mesas reservadas aparecen marcadas con la hora y nombre del cliente.

**HU-102** | Should  
COMO **propietario** QUIERO **configurar las reglas de reservas** PARA gestionar la capacidad (antelación mínima/máxima, duración estimada, límite de comensales).

- AC: DADO que configuro "reservas con mínimo 2h de antelación" y "duración estimada 2h" CUANDO un cliente intenta reservar para dentro de 30min ENTONCES no le deja.

**HU-103** | Should  
COMO **propietario** QUIERO **enviar recordatorio automático de reserva** PARA reducir no-shows.

- AC: DADO que hay reserva para mañana a las 21:00 CUANDO son las 12:00 de hoy ENTONCES se envía SMS/email al cliente: "Recordatorio: tu reserva en La Esquina mañana a las 21:00 para 4 personas. ¿Confirmas?".

---

### Fidelización

**HU-110** | Must  
COMO **cliente** QUIERO **acumular puntos por mis consumiciones** PARA obtener recompensas.

- AC: DADO que soy cliente registrado y mi ticket es de 45€ CUANDO se cobra ENTONCES obtengo 45 puntos (1 punto/€) y mi saldo se actualiza.

**HU-111** | Should  
COMO **cliente** QUIERO **canjear mis puntos por descuentos** PARA que mi fidelidad tenga recompensa.

- AC: DADO que tengo 200 puntos CUANDO canjeo 100 puntos ENTONCES obtengo 5€ de descuento en mi próxima visita.

**HU-112** | Should  
COMO **propietario** QUIERO **configurar niveles de fidelización** PARA premiar a los mejores clientes.

- AC: DADO que defino: Bronce (0-499 puntos, sin beneficio extra), Plata (500-1499, 5% dto), Oro (1500+, 10% dto + invitación cumpleaños) CUANDO un cliente llega a 500 puntos ENTONCES sube a Plata automáticamente.

**HU-113** | Must  
COMO **propietario** QUIERO **ver el historial de consumo de un cliente** PARA conocer sus preferencias.

- AC: DADO que consulto la ficha de María García CUANDO abro su historial ENTONCES veo: visitas totales, gasto medio, productos más pedidos, último día de visita, nivel de fidelización, puntos acumulados.

---

### Comunicaciones y Promos

**HU-120** | Should  
COMO **propietario** QUIERO **enviar promociones personalizadas a clientes** PARA aumentar la recurrencia.

- AC: DADO que creo promo "2x1 en cócteles miércoles" para clientes que piden cócteles habitualmente CUANDO la envío ENTONCES se envía email/SMS solo a esos clientes y se respeta consentimiento LSSI.

**HU-121** | Could  
COMO **propietario** QUIERO **enviar felicitación y oferta de cumpleaños** PARA generar experiencia personalizada.

- AC: DADO que María cumple años el 15 de marzo CUANDO es 14 de marzo ENTONCES se envía automáticamente: "¡Feliz cumple, María! Te invitamos a un postre este viernes".

**HU-122** | Should  
COMO **cliente** QUIERO **ver la carta digital del restaurante** PARA consultar platos, precios y alérgenos antes de ir.

- AC: DADO que accedo a la carta digital CUANDO la veo ENTONCES muestra categorías, productos con foto/descripción, precio con IVA incluido, iconos de alérgenos y indicación de disponibilidad.

**HU-123** | Must  
COMO **cliente** QUIERO **darme de baja de comunicaciones comerciales** PARA ejercer mi derecho LSSI/RGPD.

- AC: DADO que recibo un email de promo CUANDO pulso "darme de baja" ENTONCES inmediatamente dejo de recibir comunicaciones y mi consentimiento se revoca en el sistema.

---
