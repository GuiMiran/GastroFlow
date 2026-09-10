# MODELO DE NEGOCIO — SaaS por Módulos para Hostelería

> **Capa**: 00 — Visión y Contexto  
> **Documento**: Modelo comercial, licencias y estructura de la plataforma  
> **Última revisión**: 2026-03-15  
> **Estado**: Normativo — fuente de verdad para decisiones de producto y arquitectura

---

## 1. Propuesta de Valor

GastroFlow es una plataforma SaaS de gestión integral para negocios de hostelería española. Se vende **por módulos** — cada establecimiento contrata los módulos que necesita según su madurez operativa y presupuesto, pudiendo añadir nuevos módulos en cualquier momento sin migración ni cambio de sistema.

**Filosofía del producto:**
- Un hostelero de toda la vida sabe de cocina y de gente, no de software. El sistema debe ser **invisible**: que fluya y no estorbe.
- Los datos fiscales y contables se generan solos, en tiempo real, desde las operaciones del día a día. **No hace falta contador para saber cuánto IVA se debe.**
- Todo lo que el camarero hace en sala alimenta automáticamente el stock, la contabilidad y el CRM. **Una sola operación, cero doble entrada.**

---

## 2. Módulos Comerciales

### M1 — TPV (Terminal Punto de Venta) — *BASE OBLIGATORIO*

> El módulo fundacional. Sin él no funciona nada. Está incluido en todos los planes.

| Funcionalidad | Descripción |
|--------------|-------------|
| Gestión de sala y mesas | Plano interactivo de zonas, estados de mesas en tiempo real |
| Comandas digitales | Toma de comanda por productos, modificadores, notas |
| KDS Cocina y Barra | Pantalla de cocina y barra con estados en tiempo real |
| Cobro y caja | Efectivo, tarjeta, Bizum, pago mixto, división de cuentas |
| Tickets y facturas | Ticket simplificado y factura completa con NIF, WhatsApp + impresión |
| Arqueo de caja | Apertura/cierre de turno, retiradas, descuadre |
| VeriFactu | Hash encadenado para cumplimiento Ley Antifraude 2021 |

**Precio orientativo**: desde 49 €/mes por establecimiento.

---

### M2 — ERP / Backoffice — *Add-on*

> Para el hostelero que quiere controlar de verdad su negocio por dentro.

| Funcionalidad | Descripción |
|--------------|-------------|
| Catálogo y escandallos | Gestión de productos, categorías, ingredientes, alérgenos, fichas técnicas |
| Inventario y stock | Descuento automático desde ventas, alertas stock mínimo, inventario manual |
| Compras y proveedores | Alta proveedores, pedidos, recepción albarán, facturas de compra |
| RRHH básico | Alta empleados, cuadrante de turnos, fichaje legal (RD 8/2019), informe horas |

**Precio orientativo**: +29 €/mes adicionales al M1.  
**Requisito**: M1 activo.

---

### M3 — Contabilidad y Fiscal — *Add-on*

> Para el hostelero que quiere llevar las cuentas sin depender de la gestoría para el día a día. Con 30+ años de experiencia contable detrás de cada cálculo.

| Funcionalidad | Descripción |
|--------------|-------------|
| Asientos automáticos | Cada venta y compra genera su asiento contable según PGC pymes |
| Balance de sumas y saldos | En tiempo real, por período |
| Libro diario | Asientos navegables con apuntes Debe/Haber |
| IVA trimestral | Dashboard en tiempo real de IVA repercutido vs soportado |
| Modelo 303 | Autoliquidación IVA trimestral, casillas oficiales, resultado a ingresar/devolver |
| Libros de registro | Facturas emitidas y recibidas según normativa AEAT |
| Modelo 347 | Operaciones con terceros > 3.005,06 € |
| Modelo 111 | Retenciones IRPF a empleados |
| Modelo 115 | Retenciones IRPF arrendamientos |

**Precio orientativo**: +29 €/mes adicionales al M1.  
**Requisito**: M1 activo. Recomendado con M2 para tener compras integradas.

---

### M4 — CRM / Canal Cliente — *Add-on*

> Para el hostelero que quiere crecer fidelizando a sus clientes.

| Funcionalidad | Descripción |
|--------------|-------------|
| Reservas online | Widget embebible en web/Google, confirmación automática, recordatorio |
| Gestión de reservas | Asignación en plano de sala, reglas de ocupación, lista de espera |
| Fidelización (puntos) | Acumulación automática por ticket, niveles, canje por descuentos |
| Historial de cliente | Todo lo que ha consumido, cuándo y cuánto ha gastado |
| Promos personalizadas | Descuentos por cumpleaños, por nivel de fidelidad, por inactividad |
| Carta digital | QR en mesa, actualización en tiempo real desde catálogo de M2 |
| Baja RGPD/LSSI | Flujo de baja de datos conforme a normativa |

**Precio orientativo**: +19 €/mes adicionales al M1.  
**Requisito**: M1 activo.

---

## 3. Planes Comerciales Preconfigurados

| Plan | Módulos | A quién va | Precio orientativo |
|------|---------|-----------|-------------------|
| **Starter** | M1 | Bar/cafetería pequeño, quiosco, puesto de mercado | 49 €/mes |
| **Negocio** | M1 + M2 | Restaurante con cocina, necesita controlar stock y compras | 78 €/mes |
| **Profesional** | M1 + M2 + M3 | Restaurante que quiere llevar cuentas sin gestoría diaria | 107 €/mes |
| **Total** | M1 + M2 + M3 + M4 | Restaurante con ambición de fidelización y reservas online | 126 €/mes |

> Los precios son por establecimiento. Descuentos de volumen para cadenas (>3 locales).

---

## 4. Modelo de Tenancy (Multi-Tenant)

Cada cliente es un **tenant** representado por un `Establecimiento` en la base de datos. Los datos de diferentes establecimientos están completamente aislados.

```
Plataforma GastroFlow
│
├── Tenant A: "Bar El Rincón" — Plan Negocio (M1+M2)
│   ├── Módulos activos: [M1, M2]
│   ├── Empleados: Ana (camarera), Carlos (gerente), María (cocinera)
│   └── Datos: mesas, comandas, stock, compras...
│
├── Tenant B: "Restaurante La Pergola" — Plan Total (M1+M2+M3+M4)
│   ├── Módulos activos: [M1, M2, M3, M4]
│   └── ...
│
└── Tenant C: "Cafetería Sol" — Plan Starter (M1)
    └── ...
```

### Reglas de tenant
- `establecimientoId` es la clave de partición universal en todas las entidades.
- Un empleado pertenece exactamente a un establecimiento.
- Las licencias de módulo se almacenan en la entidad `LicenciaModulo` asociada al establecimiento.
- El frontend filtra el menú de navegación en función de los módulos activos del tenant.

---

## 5. Pantalla de Setup / Onboarding

La primera vez que un establecimiento accede al sistema (tras la contratación) se presenta el **Asistente de Configuración Inicial**. Es la pantalla más crítica del sistema: cada dato guardado aquí tiene repercusión global en toda la operativa posterior.

### Pasos del asistente (wizard)

```
Paso 1 — Establecimiento
  · Nombre legal y nombre comercial
  · NIF/CIF
  · Dirección fiscal completa
  · Teléfono, email de contacto
  · Logo (para tickets y facturas)
  · [CRÍTICO] Régimen fiscal: Estimación Directa / Normal / Simplificada
  · [CRÍTICO] Régimen IVA: General / Simplificado / Recargo de Equivalencia

Paso 2 — Módulos activos
  · Confirmación visual de los módulos contratados
  · Activar/desactivar funcionalidades dentro de cada módulo

Paso 3 — Empleados y Roles
  · Crear al menos 1 usuario ADMINISTRADOR / GERENTE
  · Alta de empleados con su rol asignado

Paso 4 — Zonas y Mesas (M1)
  · Crear zonas (Terraza, Interior, Barra…)
  · Añadir mesas con número y capacidad

Paso 5 — Caja y TPV (M1)
  · Nombre de la caja
  · Modo de impresión de tickets (térmica / PDF / ninguna)
  · Numeración de facturas: serie y número inicial

Paso 6 — Catálogo inicial (M2 si activo)
  · Importar catálogo desde Excel/CSV o crear categorías y productos uno a uno

Paso 7 — Parámetros contables (M3 si activo)
  · Ejercicio fiscal de inicio
  · Plan de cuentas (automático según PGC pymes)
  · Confirmación de cuentas bancarias de tesorería
```

### Invariante crítica del setup
> **INV-SETUP-001**: Ningún cambio en Paso 1 (datos fiscales, régimen) puede realizarse sin auditoría. Cada modificación queda registrada con timestamp, usuario y valor anterior/nuevo. Cambiar el régimen fiscal requiere confirmación explícita del ADMINISTRADOR.

---

## 6. Pantalla de Configuración Permanente (Admin)

Tras el setup inicial, el **ADMINISTRADOR** dispone de una sección `Configuración` accesible en cualquier momento. Esta sección está **bloqueada para todos los demás roles**.

| Sección | Acciones | Impacto |
|---------|----------|---------|
| **Datos del establecimiento** | Editar NIF, razón social, logo, dirección | Tickets, facturas, modelos fiscales |
| **Módulos y licencias** | Ver módulos activos, solicitar ampliación | Navegación, funcionalidades visibles |
| **Gestión de empleados** | Alta/baja/modificación, asignar roles | Accesos, operativa de sala |
| **Zonas y mesas** | Añadir/renombrar/eliminar zonas y mesas | Plano de sala |
| **Series de facturación** | Cambiar prefijos, reset de contador | [IRREVERSIBLE — requiere confirmación] |
| **Almacenes** | Crear/renombrar almacenes (M2) | Inventario, traspasos |
| **Parámetros fiscales** | Cambiar régimen fiscal/IVA | [CRÍTICO — auditable] |
| **Integraciones** | VeriFactu, WhatsApp, impresora | Tickets, reporting AEAT |

> **Regla de diseño**: Cada campo en Configuración que afecte a cálculos fiscales o a numeración de documentos muestra un banner de advertencia y requiere pulsar un segundo botón de confirmación antes de guardar.

---

## 7. Histórico de versiones de este documento

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 2026-03-15 | Versión inicial — modelo SaaS, módulos, planes, setup |
