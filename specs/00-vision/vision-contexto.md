# CAPA 00 — VISIÓN Y CONTEXTO

> Fuente de verdad del propósito, alcance y marco regulatorio del producto.

---

## 00.1 — Propósito del Producto

**Nombre**: {{NOMBRE_PRODUCTO}} (nombre de trabajo)  
**Tipo**: SaaS multitenant especializado en hostelería  
**Propósito**: Plataforma integral de gestión para negocios de hostelería en España (bares, restaurantes, cafeterías, chiringuitos, gastrobares, hoteles con restauración) que unifica en un solo sistema el punto de venta (TPV), la gestión interna del negocio (ERP), la contabilidad y fiscalidad automatizada, y la relación con el cliente final (CRM).

---

## 00.2 — Problema que Resuelve

| Problema actual | Cómo lo resuelve {{NOMBRE_PRODUCTO}} |
|----------------|---------------------------|
| El hostelero usa 4-5 herramientas desconectadas (caja registradora, Excel, gestoría, libreta de reservas, WhatsApp) | Una sola plataforma integrada donde todo fluye automáticamente |
| No sabe en tiempo real cuánto IVA debe a Hacienda y se gasta ese dinero | Dashboard fiscal en tiempo real con alerta de deuda tributaria estimada |
| El inventario se controla "a ojo" y no sabe su coste real por plato/copa | Escandallos automáticos que descuentan stock por cada venta |
| Pierde clientes porque no los conoce y no puede fidelizarlos | CRM con historial de consumo, reservas online y promociones personalizadas |
| La contabilidad se hace a posteriori con el gestor y llegan las sorpresas | Asientos contables automáticos por cada ticket, contabilidad al día |
| Dividir cuentas de una mesa es un caos manual | División automática e inteligente de facturas por comensal |
| Los turnos y fichajes se hacen en papel o no se hacen | Control digital de turnos con fichaje legal (RD 8/2019) |

---

## 00.3 — Usuarios Objetivo

| Rol | Quién es | Qué necesita |
|-----|----------|-------------|
| **Propietario / Gerente** | Dueño del negocio o encargado principal | Visión global: ventas, costes, márgenes, impuestos, tesorería |
| **Camarero / Personal de sala** | Empleado que atiende mesas y cobra | Rapidez: abrir mesa, tomar comanda, cobrar, dividir cuenta |
| **Cocinero / Jefe de cocina** | Responsable de cocina | Ver comandas en tiempo real, gestionar escandallos y stock de cocina |
| **Barra / Barista** | Personal de barra | Recibir comandas de bebidas, gestionar stock de barra |
| **Contable / Asesor fiscal** | Gestoría externa o contable interno | Acceso a libros, asientos, modelos fiscales, exportación AEAT |
| **Encargado de compras** | Responsable de pedidos a proveedores | Gestionar proveedores, pedidos, recepción de mercancía, facturas de compra |
| **Cliente final** | Persona que visita el establecimiento | Reservar mesa online, ver carta, acumular puntos, recibir promos |
| **Super Admin plataforma** | Administrador del SaaS (interno) | Gestión de tenants, facturación de suscripciones, soporte |

---

## 00.4 — Alcance Funcional

### QUÉ INCLUYE (Fase 1)

| Módulo | Alcance |
|--------|---------|
| **M1 — TPV / Ventas** | Gestión de mesas y zonas, comandas, cobro (efectivo, tarjeta, mixto), tickets y facturas simplificadas, división de cuentas, IVA automático por producto, arqueo de caja, turnos de caja |
| **M2 — ERP / Backoffice** | Catálogo de productos con tipo IVA, escandallos (recetas/fichas técnicas), gestión de inventario con descontado automático, pedidos a proveedores, recepción de mercancía, registro de facturas de compra, gestión de RRHH (turnos, fichaje legal, calendario) |
| **M3 — Contabilidad y Fiscal** | Asientos contables automáticos desde ventas y compras, libro de IVA repercutido y soportado, cálculo en tiempo real del IVA trimestral (modelo 303), modelo 390 resumen anual, modelo 347 operaciones con terceros, modelo 111 retenciones, Plan General Contable pymes, balance y cuenta de PyG |
| **M4 — CRM / Web Usuario** | Reservas online, ficha de cliente con historial, programa de fidelización (puntos, niveles), comunicaciones y promos personalizadas (email/SMS), carta digital, valoraciones |

### QUÉ NO INCLUYE (Fase 1)

- Gestión hotelera de habitaciones (PMS) — solo restauración
- Delivery / riders propios (solo integración futura con plataformas externas)
- Nóminas completas (solo gestión de turnos, fichaje y datos básicos de empleado)
- Operaciones fuera de España peninsular + Baleares
- Grupos empresariales consolidados
- Facturación al sector público (Facturae)
- Multi-divisa

### FASES FUTURAS

| Fase | Alcance |
|------|---------|
| **Fase 2** | Canarias (IGIC 7%), Ceuta/Melilla (IPSI). Delivery integrado. Nóminas completas con modelo 111/190. |
| **Fase 3** | PMS hotelero básico. Multi-establecimiento avanzado. Integración con plataformas de delivery (Glovo, UberEats, JustEat). |
| **Fase 4** | Marketplace de proveedores. Benchmarking sectorial. IA predictiva de demanda y compras. |

---

## 00.5 — Marco Regulatorio Aplicable

### Fiscalidad y Facturación

| Normativa | Relevancia para {{NOMBRE_PRODUCTO}} |
|-----------|--------------------------|
| **Ley 37/1992 del IVA** + **RD 1624/1992 Reglamento** | Tipos de IVA aplicables a hostelería: 10% comida/bebidas no alcohólicas servidas, 21% bebidas alcohólicas, 4% pan/leche/etc. |
| **RD 1619/2012 Reglamento de Facturación** | Requisitos de facturas y facturas simplificadas (tickets). Límite 400€ para simplificada general, **3.000€ para hostelería** |
| **Ley 18/2022 Crea y Crece** | Factura electrónica obligatoria B2B (afecta a compras a proveedores si ambos son empresas) |
| **RD 1007/2023 VeriFactu** | Sistemas informáticos de facturación deben garantizar integridad e inalterabilidad. **Aplica directamente al TPV**. Hash encadenado de registros. |
| **Modelo 303** | Declaración trimestral de IVA. Diferencia entre IVA repercutido (ventas) e IVA soportado (compras) |
| **Modelo 390** | Resumen anual de IVA |
| **Modelo 347** | Operaciones con terceros >3.005,06€ anuales |
| **Modelo 111** | Retenciones IRPF a trabajadores y profesionales (trimestral) |
| **Modelo 115** | Retenciones por alquileres de locales (trimestral) |
| **Modelo 130/131** | Pagos fraccionados IRPF autónomos |
| **SII** | Suministro Inmediato de Información (si facturación >6.014.060,10€) |

### Laboral

| Normativa | Relevancia |
|-----------|-----------|
| **RD-Ley 8/2019** | Obligación de registro de jornada diario (fichaje). Conservación 4 años. |
| **Convenio Colectivo de Hostelería** (por provincia) | Jornada máxima, horas extra, descansos, festivos, categorías profesionales |
| **Estatuto de los Trabajadores** | Tipos de contrato, periodo de prueba, vacaciones, despido |

### Protección de Datos

| Normativa | Relevancia |
|-----------|-----------|
| **RGPD (UE 2016/679)** | Tratamiento de datos de clientes (CRM), empleados (RRHH), consentimiento |
| **LOPD-GDD (LO 3/2018)** | Adaptación española del RGPD. Derechos ARCO+. |
| **LSSI-CE** | Comunicaciones comerciales electrónicas (promos, email marketing) |

### Sanitaria y Sectorial

| Normativa | Relevancia |
|-----------|-----------|
| **Reglamento (CE) 852/2004** | Higiene alimentaria. Relevante para trazabilidad de ingredientes y alérgenos |
| **RD 126/2015 Información alimentaria** | Obligación de declarar los 14 alérgenos en carta |
| **Ley de prevención del consumo de alcohol en menores** | Restricciones de venta según edad |

---

## 00.6 — Modelo de Negocio del SaaS

| Plan | Destinatario | Incluye |
|------|-------------|---------|
| **Starter** | Autónomo con 1 local pequeño (<5 empleados) | TPV básico (1 caja) + Facturación + Inventario básico + Reservas |
| **Pro** | Pyme con 1-3 locales (5-25 empleados) | Todo Starter + ERP completo + Contabilidad + CRM + Multi-caja + Multi-local |
| **Enterprise** | Cadenas / grupos (>3 locales) | Todo Pro + Multi-establecimiento + API + Reporting avanzado + SLA dedicado |

**Modelo de precio**: Suscripción mensual/anual + posible coste por módulo adicional.

---
