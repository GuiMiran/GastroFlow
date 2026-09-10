-- CreateEnum
CREATE TYPE "EstadoMesa" AS ENUM ('libre', 'ocupada', 'reservada', 'pendiente_cobro');

-- CreateEnum
CREATE TYPE "EstadoComanda" AS ENUM ('enviada', 'en_preparacion', 'lista', 'servida', 'anulada');

-- CreateEnum
CREATE TYPE "TipoDocumentoFiscal" AS ENUM ('ticket', 'factura_completa', 'rectificativa');

-- CreateEnum
CREATE TYPE "FormaPago" AS ENUM ('efectivo', 'tarjeta', 'bizum', 'invitacion');

-- CreateEnum
CREATE TYPE "TipoIVA" AS ENUM ('general_21', 'reducido_10', 'superreducido_4', 'exento_0');

-- CreateEnum
CREATE TYPE "TipoMovimientoStock" AS ENUM ('entrada_compra', 'salida_venta', 'ajuste_inventario', 'traspaso_entrada', 'traspaso_salida', 'merma');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('pendiente', 'enviado', 'recibido_parcial', 'recibido', 'cancelado');

-- CreateEnum
CREATE TYPE "RolEmpleado" AS ENUM ('ADMIN', 'GERENTE', 'CAJERO', 'CAMARERO', 'COCINERO', 'BARRA', 'CONTABLE');

-- CreateEnum
CREATE TYPE "EstadoReserva" AS ENUM ('confirmada', 'cancelada', 'cumplida', 'noshow');

-- CreateTable
CREATE TABLE "tenants" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nif" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "establecimientos" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nif" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "codigoPostal" TEXT NOT NULL,
    "ciudad" TEXT NOT NULL,
    "provincia" TEXT NOT NULL,
    "telefono" TEXT,
    "regimenFiscal" TEXT NOT NULL DEFAULT 'general',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "establecimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "zonas" (
    "id" TEXT NOT NULL,
    "establecimientoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "zonas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mesas" (
    "id" TEXT NOT NULL,
    "zonaId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "capacidad" INTEGER NOT NULL DEFAULT 4,
    "estado" "EstadoMesa" NOT NULL DEFAULT 'libre',
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "mesas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "servicios" (
    "id" TEXT NOT NULL,
    "mesaId" TEXT,
    "camareroId" TEXT NOT NULL,
    "comensales" INTEGER NOT NULL DEFAULT 1,
    "abierto" BOOLEAN NOT NULL DEFAULT true,
    "horaApertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "horaCierre" TIMESTAMP(3),

    CONSTRAINT "servicios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comandas" (
    "id" TEXT NOT NULL,
    "servicioId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "estado" "EstadoComanda" NOT NULL DEFAULT 'enviada',
    "destino" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comandas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lineas_comanda" (
    "id" TEXT NOT NULL,
    "comandaId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "precioUnitario" DECIMAL(10,2) NOT NULL,
    "tipoIva" DECIMAL(4,2) NOT NULL,
    "baseImponible" DECIMAL(10,2) NOT NULL,
    "cuotaIva" DECIMAL(10,2) NOT NULL,
    "descuento" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "anulada" BOOLEAN NOT NULL DEFAULT false,
    "motivoAnulacion" TEXT,
    "ticketId" TEXT,

    CONSTRAINT "lineas_comanda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modificadores" (
    "id" TEXT NOT NULL,
    "lineaComandaId" TEXT NOT NULL,
    "texto" TEXT NOT NULL,
    "precioExtra" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "modificadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "series_facturacion" (
    "id" TEXT NOT NULL,
    "establecimientoId" TEXT NOT NULL,
    "prefijo" TEXT NOT NULL,
    "tipo" "TipoDocumentoFiscal" NOT NULL,
    "ultimoNumero" INTEGER NOT NULL DEFAULT 0,
    "year" INTEGER NOT NULL,

    CONSTRAINT "series_facturacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "servicioId" TEXT NOT NULL,
    "serieFacturacionId" TEXT NOT NULL,
    "tipo" "TipoDocumentoFiscal" NOT NULL,
    "numeroSecuencial" INTEGER NOT NULL,
    "codigoCompleto" TEXT NOT NULL,
    "baseImponible4" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cuotaIva4" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "baseImponible10" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cuotaIva10" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "baseImponible21" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cuotaIva21" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalSinIva" DECIMAL(10,2) NOT NULL,
    "totalIva" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "destinatarioNif" TEXT,
    "destinatarioNombre" TEXT,
    "destinatarioDireccion" TEXT,
    "ticketOriginalId" TEXT,
    "motivoRectificacion" TEXT,
    "tipoRectificacion" TEXT,
    "asientoContableId" TEXT,
    "clienteId" TEXT,
    "fechaEmision" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registros_verifactu" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "hashActual" TEXT NOT NULL,
    "hashAnterior" TEXT NOT NULL,
    "datosRegistro" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registros_verifactu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cobros" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "formaPago" "FormaPago" NOT NULL,
    "importe" DECIMAL(10,2) NOT NULL,
    "cambio" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cobros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cajas" (
    "id" TEXT NOT NULL,
    "establecimientoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "cajas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turnos_caja" (
    "id" TEXT NOT NULL,
    "cajaId" TEXT NOT NULL,
    "cajeroId" TEXT NOT NULL,
    "fondoCaja" DECIMAL(10,2) NOT NULL,
    "abierto" BOOLEAN NOT NULL DEFAULT true,
    "horaApertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "horaCierre" TIMESTAMP(3),
    "efectivoEsperado" DECIMAL(10,2),
    "efectivoReal" DECIMAL(10,2),
    "descuadre" DECIMAL(10,2),

    CONSTRAINT "turnos_caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_caja" (
    "id" TEXT NOT NULL,
    "turnoCajaId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "importe" DECIMAL(10,2) NOT NULL,
    "concepto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_caja_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias_producto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "destino" TEXT,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activa" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "categorias_producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "productos" (
    "id" TEXT NOT NULL,
    "establecimientoId" TEXT NOT NULL,
    "categoriaId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precioConIva" DECIMAL(10,2) NOT NULL,
    "tipoIva" "TipoIVA" NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "productos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alergenos" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "icono" TEXT,

    CONSTRAINT "alergenos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producto_alergenos" (
    "productoId" TEXT NOT NULL,
    "alergenoId" TEXT NOT NULL,

    CONSTRAINT "producto_alergenos_pkey" PRIMARY KEY ("productoId","alergenoId")
);

-- CreateTable
CREATE TABLE "escandallos" (
    "id" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "costeTeorico" DECIMAL(10,4) NOT NULL,
    "foodCost" DECIMAL(5,2) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "escandallos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "escandallo_ingredientes" (
    "id" TEXT NOT NULL,
    "escandalloId" TEXT NOT NULL,
    "ingredienteId" TEXT NOT NULL,
    "cantidadNeta" DECIMAL(10,4) NOT NULL,
    "merma" DECIMAL(5,2) NOT NULL DEFAULT 0,

    CONSTRAINT "escandallo_ingredientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "unidadMedida" TEXT NOT NULL,
    "precioCoste" DECIMAL(10,4) NOT NULL,
    "stockMinimo" DECIMAL(10,4) NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ingredientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "almacenes" (
    "id" TEXT NOT NULL,
    "establecimientoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "almacenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stocks" (
    "id" TEXT NOT NULL,
    "ingredienteId" TEXT NOT NULL,
    "almacenId" TEXT NOT NULL,
    "cantidad" DECIMAL(10,4) NOT NULL,

    CONSTRAINT "stocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_stock" (
    "id" TEXT NOT NULL,
    "ingredienteId" TEXT NOT NULL,
    "tipo" "TipoMovimientoStock" NOT NULL,
    "cantidad" DECIMAL(10,4) NOT NULL,
    "origenDocumento" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedores" (
    "id" TEXT NOT NULL,
    "establecimientoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nif" TEXT NOT NULL,
    "direccion" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "proveedores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos_proveedor" (
    "id" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'pendiente',
    "fechaPedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaEntrega" TIMESTAMP(3),

    CONSTRAINT "pedidos_proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lineas_pedido" (
    "id" TEXT NOT NULL,
    "pedidoId" TEXT NOT NULL,
    "ingredienteId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidadPedida" DECIMAL(10,4) NOT NULL,
    "unidadMedida" TEXT NOT NULL,
    "precioEstimado" DECIMAL(10,4),

    CONSTRAINT "lineas_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "albaranes_entrada" (
    "id" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "pedidoId" TEXT,
    "numeroAlbaran" TEXT NOT NULL,
    "fechaRecepcion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "albaranes_entrada_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lineas_albaran" (
    "id" TEXT NOT NULL,
    "albaranId" TEXT NOT NULL,
    "ingredienteId" TEXT NOT NULL,
    "cantidadRecibida" DECIMAL(10,4) NOT NULL,
    "cantidadEsperada" DECIMAL(10,4),
    "diferencia" DECIMAL(10,4),

    CONSTRAINT "lineas_albaran_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "facturas_compra" (
    "id" TEXT NOT NULL,
    "proveedorId" TEXT NOT NULL,
    "numeroFactura" TEXT NOT NULL,
    "fechaFactura" TIMESTAMP(3) NOT NULL,
    "fechaRegistro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "baseImponible4" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cuotaIva4" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "baseImponible10" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cuotaIva10" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "baseImponible21" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "cuotaIva21" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalSinIva" DECIMAL(10,2) NOT NULL,
    "totalIva" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "asientoContableId" TEXT,

    CONSTRAINT "facturas_compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ejercicios_fiscales" (
    "id" TEXT NOT NULL,
    "establecimientoId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "cerrado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ejercicios_fiscales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asientos_contables" (
    "id" TEXT NOT NULL,
    "establecimientoId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "concepto" TEXT NOT NULL,
    "origen" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asientos_contables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apuntes_contables" (
    "id" TEXT NOT NULL,
    "asientoId" TEXT NOT NULL,
    "cuentaPgc" TEXT NOT NULL,
    "concepto" TEXT,
    "cargo" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "abono" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "apuntes_contables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "libro_registro_emitidas" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "fechaExpedicion" TIMESTAMP(3) NOT NULL,
    "baseImponible" DECIMAL(10,2) NOT NULL,
    "cuotaIva" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "tipoDocumento" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "libro_registro_emitidas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "libro_registro_recibidas" (
    "id" TEXT NOT NULL,
    "facturaCompraId" TEXT NOT NULL,
    "fechaRecepcion" TIMESTAMP(3) NOT NULL,
    "proveedorNif" TEXT NOT NULL,
    "baseImponible" DECIMAL(10,2) NOT NULL,
    "cuotaIva" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "libro_registro_recibidas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "licencias_modulo" (
    "id" TEXT NOT NULL,
    "establecimientoId" TEXT NOT NULL,
    "modulo" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "activadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "desactivadoEn" TIMESTAMP(3),

    CONSTRAINT "licencias_modulo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_log" (
    "id" TEXT NOT NULL,
    "establecimientoId" TEXT,
    "empleadoId" TEXT,
    "accion" TEXT NOT NULL,
    "entidad" TEXT,
    "entidadId" TEXT,
    "detalle" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "empleados" (
    "id" TEXT NOT NULL,
    "establecimientoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "nif" TEXT NOT NULL,
    "email" TEXT,
    "telefono" TEXT,
    "puesto" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fechaAlta" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaBaja" TIMESTAMP(3),
    "emailLogin" TEXT,
    "passwordHash" TEXT,
    "pinHash" TEXT,
    "rol" "RolEmpleado" NOT NULL DEFAULT 'CAMARERO',

    CONSTRAINT "empleados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "turnos" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "horaInicio" TIMESTAMP(3) NOT NULL,
    "horaFin" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turnos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fichajes" (
    "id" TEXT NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "hora" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fichajes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "establecimientoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT,
    "email" TEXT,
    "telefono" TEXT,
    "fechaNacimiento" DATE,
    "puntos" INTEGER NOT NULL DEFAULT 0,
    "nivel" TEXT NOT NULL DEFAULT 'bronce',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consentimientos" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "otorgado" BOOLEAN NOT NULL DEFAULT false,
    "fechaAccion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT,

    CONSTRAINT "consentimientos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "programas_fidelizacion" (
    "id" TEXT NOT NULL,
    "establecimientoId" TEXT NOT NULL,
    "puntosPorEuro" INTEGER NOT NULL DEFAULT 1,
    "umbralPlata" INTEGER NOT NULL DEFAULT 500,
    "umbralOro" INTEGER NOT NULL DEFAULT 1500,
    "revisionAnual" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "programas_fidelizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservas" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT,
    "mesaId" TEXT,
    "nombreContacto" TEXT NOT NULL,
    "telefonoContacto" TEXT,
    "emailContacto" TEXT,
    "fecha" DATE NOT NULL,
    "hora" TIME(6) NOT NULL,
    "comensales" INTEGER NOT NULL,
    "estado" "EstadoReserva" NOT NULL DEFAULT 'confirmada',
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reservas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_nif_key" ON "tenants"("nif");

-- CreateIndex
CREATE INDEX "establecimientos_tenantId_idx" ON "establecimientos"("tenantId");

-- CreateIndex
CREATE INDEX "zonas_establecimientoId_idx" ON "zonas"("establecimientoId");

-- CreateIndex
CREATE UNIQUE INDEX "mesas_zonaId_numero_key" ON "mesas"("zonaId", "numero");

-- CreateIndex
CREATE INDEX "servicios_mesaId_abierto_idx" ON "servicios"("mesaId", "abierto");

-- CreateIndex
CREATE INDEX "comandas_servicioId_idx" ON "comandas"("servicioId");

-- CreateIndex
CREATE INDEX "lineas_comanda_comandaId_idx" ON "lineas_comanda"("comandaId");

-- CreateIndex
CREATE UNIQUE INDEX "series_facturacion_establecimientoId_prefijo_year_key" ON "series_facturacion"("establecimientoId", "prefijo", "year");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_codigoCompleto_key" ON "tickets"("codigoCompleto");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_asientoContableId_key" ON "tickets"("asientoContableId");

-- CreateIndex
CREATE INDEX "tickets_servicioId_idx" ON "tickets"("servicioId");

-- CreateIndex
CREATE UNIQUE INDEX "tickets_serieFacturacionId_numeroSecuencial_key" ON "tickets"("serieFacturacionId", "numeroSecuencial");

-- CreateIndex
CREATE UNIQUE INDEX "registros_verifactu_ticketId_key" ON "registros_verifactu"("ticketId");

-- CreateIndex
CREATE INDEX "turnos_caja_cajaId_abierto_idx" ON "turnos_caja"("cajaId", "abierto");

-- CreateIndex
CREATE INDEX "productos_establecimientoId_categoriaId_idx" ON "productos"("establecimientoId", "categoriaId");

-- CreateIndex
CREATE UNIQUE INDEX "alergenos_nombre_key" ON "alergenos"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "escandallos_productoId_key" ON "escandallos"("productoId");

-- CreateIndex
CREATE UNIQUE INDEX "stocks_ingredienteId_almacenId_key" ON "stocks"("ingredienteId", "almacenId");

-- CreateIndex
CREATE INDEX "movimientos_stock_ingredienteId_createdAt_idx" ON "movimientos_stock"("ingredienteId", "createdAt");

-- CreateIndex
CREATE INDEX "proveedores_establecimientoId_idx" ON "proveedores"("establecimientoId");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_compra_asientoContableId_key" ON "facturas_compra"("asientoContableId");

-- CreateIndex
CREATE UNIQUE INDEX "facturas_compra_proveedorId_numeroFactura_key" ON "facturas_compra"("proveedorId", "numeroFactura");

-- CreateIndex
CREATE UNIQUE INDEX "ejercicios_fiscales_establecimientoId_year_key" ON "ejercicios_fiscales"("establecimientoId", "year");

-- CreateIndex
CREATE INDEX "asientos_contables_establecimientoId_fecha_idx" ON "asientos_contables"("establecimientoId", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "libro_registro_emitidas_ticketId_key" ON "libro_registro_emitidas"("ticketId");

-- CreateIndex
CREATE UNIQUE INDEX "libro_registro_recibidas_facturaCompraId_key" ON "libro_registro_recibidas"("facturaCompraId");

-- CreateIndex
CREATE INDEX "licencias_modulo_establecimientoId_idx" ON "licencias_modulo"("establecimientoId");

-- CreateIndex
CREATE UNIQUE INDEX "licencias_modulo_establecimientoId_modulo_key" ON "licencias_modulo"("establecimientoId", "modulo");

-- CreateIndex
CREATE INDEX "audit_log_establecimientoId_createdAt_idx" ON "audit_log"("establecimientoId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_log_empleadoId_idx" ON "audit_log"("empleadoId");

-- CreateIndex
CREATE UNIQUE INDEX "empleados_emailLogin_key" ON "empleados"("emailLogin");

-- CreateIndex
CREATE INDEX "empleados_establecimientoId_idx" ON "empleados"("establecimientoId");

-- CreateIndex
CREATE INDEX "empleados_emailLogin_idx" ON "empleados"("emailLogin");

-- CreateIndex
CREATE INDEX "turnos_empleadoId_fecha_idx" ON "turnos"("empleadoId", "fecha");

-- CreateIndex
CREATE INDEX "fichajes_empleadoId_hora_idx" ON "fichajes"("empleadoId", "hora");

-- CreateIndex
CREATE INDEX "clientes_establecimientoId_email_idx" ON "clientes"("establecimientoId", "email");

-- CreateIndex
CREATE INDEX "consentimientos_clienteId_tipo_idx" ON "consentimientos"("clienteId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "programas_fidelizacion_establecimientoId_key" ON "programas_fidelizacion"("establecimientoId");

-- CreateIndex
CREATE INDEX "reservas_fecha_estado_idx" ON "reservas"("fecha", "estado");

-- AddForeignKey
ALTER TABLE "establecimientos" ADD CONSTRAINT "establecimientos_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "zonas" ADD CONSTRAINT "zonas_establecimientoId_fkey" FOREIGN KEY ("establecimientoId") REFERENCES "establecimientos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mesas" ADD CONSTRAINT "mesas_zonaId_fkey" FOREIGN KEY ("zonaId") REFERENCES "zonas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicios" ADD CONSTRAINT "servicios_camareroId_fkey" FOREIGN KEY ("camareroId") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "servicios" ADD CONSTRAINT "servicios_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "mesas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comandas" ADD CONSTRAINT "comandas_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "servicios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineas_comanda" ADD CONSTRAINT "lineas_comanda_comandaId_fkey" FOREIGN KEY ("comandaId") REFERENCES "comandas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineas_comanda" ADD CONSTRAINT "lineas_comanda_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineas_comanda" ADD CONSTRAINT "lineas_comanda_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "modificadores" ADD CONSTRAINT "modificadores_lineaComandaId_fkey" FOREIGN KEY ("lineaComandaId") REFERENCES "lineas_comanda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "series_facturacion" ADD CONSTRAINT "series_facturacion_establecimientoId_fkey" FOREIGN KEY ("establecimientoId") REFERENCES "establecimientos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_asientoContableId_fkey" FOREIGN KEY ("asientoContableId") REFERENCES "asientos_contables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_serieFacturacionId_fkey" FOREIGN KEY ("serieFacturacionId") REFERENCES "series_facturacion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "servicios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_ticketOriginalId_fkey" FOREIGN KEY ("ticketOriginalId") REFERENCES "tickets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_verifactu" ADD CONSTRAINT "registros_verifactu_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cobros" ADD CONSTRAINT "cobros_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cajas" ADD CONSTRAINT "cajas_establecimientoId_fkey" FOREIGN KEY ("establecimientoId") REFERENCES "establecimientos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos_caja" ADD CONSTRAINT "turnos_caja_cajaId_fkey" FOREIGN KEY ("cajaId") REFERENCES "cajas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos_caja" ADD CONSTRAINT "turnos_caja_cajeroId_fkey" FOREIGN KEY ("cajeroId") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_caja" ADD CONSTRAINT "movimientos_caja_turnoCajaId_fkey" FOREIGN KEY ("turnoCajaId") REFERENCES "turnos_caja"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_categoriaId_fkey" FOREIGN KEY ("categoriaId") REFERENCES "categorias_producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productos" ADD CONSTRAINT "productos_establecimientoId_fkey" FOREIGN KEY ("establecimientoId") REFERENCES "establecimientos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_alergenos" ADD CONSTRAINT "producto_alergenos_alergenoId_fkey" FOREIGN KEY ("alergenoId") REFERENCES "alergenos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producto_alergenos" ADD CONSTRAINT "producto_alergenos_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escandallos" ADD CONSTRAINT "escandallos_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "productos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escandallo_ingredientes" ADD CONSTRAINT "escandallo_ingredientes_escandalloId_fkey" FOREIGN KEY ("escandalloId") REFERENCES "escandallos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "escandallo_ingredientes" ADD CONSTRAINT "escandallo_ingredientes_ingredienteId_fkey" FOREIGN KEY ("ingredienteId") REFERENCES "ingredientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "almacenes" ADD CONSTRAINT "almacenes_establecimientoId_fkey" FOREIGN KEY ("establecimientoId") REFERENCES "establecimientos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_almacenId_fkey" FOREIGN KEY ("almacenId") REFERENCES "almacenes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_ingredienteId_fkey" FOREIGN KEY ("ingredienteId") REFERENCES "ingredientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_stock" ADD CONSTRAINT "movimientos_stock_ingredienteId_fkey" FOREIGN KEY ("ingredienteId") REFERENCES "ingredientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proveedores" ADD CONSTRAINT "proveedores_establecimientoId_fkey" FOREIGN KEY ("establecimientoId") REFERENCES "establecimientos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pedidos_proveedor" ADD CONSTRAINT "pedidos_proveedor_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineas_pedido" ADD CONSTRAINT "lineas_pedido_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos_proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "albaranes_entrada" ADD CONSTRAINT "albaranes_entrada_pedidoId_fkey" FOREIGN KEY ("pedidoId") REFERENCES "pedidos_proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "albaranes_entrada" ADD CONSTRAINT "albaranes_entrada_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lineas_albaran" ADD CONSTRAINT "lineas_albaran_albaranId_fkey" FOREIGN KEY ("albaranId") REFERENCES "albaranes_entrada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas_compra" ADD CONSTRAINT "facturas_compra_asientoContableId_fkey" FOREIGN KEY ("asientoContableId") REFERENCES "asientos_contables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "facturas_compra" ADD CONSTRAINT "facturas_compra_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "proveedores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ejercicios_fiscales" ADD CONSTRAINT "ejercicios_fiscales_establecimientoId_fkey" FOREIGN KEY ("establecimientoId") REFERENCES "establecimientos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asientos_contables" ADD CONSTRAINT "asientos_contables_establecimientoId_fkey" FOREIGN KEY ("establecimientoId") REFERENCES "establecimientos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apuntes_contables" ADD CONSTRAINT "apuntes_contables_asientoId_fkey" FOREIGN KEY ("asientoId") REFERENCES "asientos_contables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "libro_registro_emitidas" ADD CONSTRAINT "libro_registro_emitidas_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "libro_registro_recibidas" ADD CONSTRAINT "libro_registro_recibidas_facturaCompraId_fkey" FOREIGN KEY ("facturaCompraId") REFERENCES "facturas_compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "licencias_modulo" ADD CONSTRAINT "licencias_modulo_establecimientoId_fkey" FOREIGN KEY ("establecimientoId") REFERENCES "establecimientos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "empleados" ADD CONSTRAINT "empleados_establecimientoId_fkey" FOREIGN KEY ("establecimientoId") REFERENCES "establecimientos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "turnos" ADD CONSTRAINT "turnos_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fichajes" ADD CONSTRAINT "fichajes_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "empleados"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clientes" ADD CONSTRAINT "clientes_establecimientoId_fkey" FOREIGN KEY ("establecimientoId") REFERENCES "establecimientos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consentimientos" ADD CONSTRAINT "consentimientos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "programas_fidelizacion" ADD CONSTRAINT "programas_fidelizacion_establecimientoId_fkey" FOREIGN KEY ("establecimientoId") REFERENCES "establecimientos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reservas" ADD CONSTRAINT "reservas_mesaId_fkey" FOREIGN KEY ("mesaId") REFERENCES "mesas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
