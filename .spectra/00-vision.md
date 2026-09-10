# LAYER 00 — VISIÓN Y CONTEXTO

> Estado: piloto ejecutable de SPECTRA para el flujo de cobro de GastroFlow.

## Propósito

Demostrar el ciclo completo `especificación → código → prueba → trazabilidad`
sobre una capacidad real del TPV: cobrar un servicio de mesa y emitir su ticket.

## Usuarios

- Camarero: registra el pago y entrega el ticket.
- Responsable del establecimiento: necesita ventas y caja consistentes.
- Cliente: recibe un cobro correcto, con desglose fiscal y cambio cuando procede.

## Alcance incluido

- Cobro de un servicio activo con comandas.
- Pago suficiente mediante una o varias formas de pago.
- Cálculo del cambio.
- Emisión del ticket y finalización del servicio.

## Fuera de alcance del piloto

- División de cuenta.
- Factura completa y factura rectificativa.
- Presentación de impuestos.
- Migración completa del directorio histórico `specs/`.

## Convivencia con las especificaciones históricas

`.spectra/` es la fuente canónica únicamente para este piloto. El resto del
producto continúa documentado en `specs/`. Una migración futura debe trasladar
cada dominio de forma explícita y evitar dos definiciones activas de una regla.

