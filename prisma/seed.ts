import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding GastroFlow demo data...');

  // 1. Tenant
  const tenant = await prisma.tenant.create({
    data: {
      nombre: 'Restaurante Demo S.L.',
      nif: 'B12345678',
      email: 'demo@restaurantedemo.es',
    },
  });
  console.log('  ✅ Tenant creado');

  // 2. Establecimiento
  const estab = await prisma.establecimiento.create({
    data: {
      tenantId: tenant.id,
      nombre: 'Bar El Rincón',
      nif: 'B12345678',
      direccion: 'Calle Mayor 15',
      codigoPostal: '28001',
      ciudad: 'Madrid',
      provincia: 'Madrid',
      telefono: '911234567',
    },
  });
  console.log('  ✅ Establecimiento creado');

  // 3. Empleados
  //
  // PINs demo:
  //   Carlos (ADMIN/Gerente):  1234  — también email: admin@elrincon.es / Admin1234!
  //   Ana (CAMARERO):          2222
  //   Pedro (CAJERO):          3333
  //   María (COCINERO):        4444
  //
  const hashPin = (pin: string) => bcrypt.hash(pin, 10);
  const hashPass = (pass: string) => bcrypt.hash(pass, 10);

  const gerente = await prisma.empleado.create({
    data: {
      establecimientoId: estab.id,
      nombre: 'Carlos',
      apellidos: 'García López',
      nif: '12345678A',
      email: 'carlos@elrincon.es',
      emailLogin: 'admin@elrincon.es',
      puesto: 'gerente',
      rol: 'ADMIN',
      pinHash: await hashPin('1234'),
      passwordHash: await hashPass('Admin1234!'),
    },
  });

  const camarero1 = await prisma.empleado.create({
    data: {
      establecimientoId: estab.id,
      nombre: 'Ana',
      apellidos: 'Martínez Ruiz',
      nif: '23456789B',
      email: 'ana@elrincon.es',
      puesto: 'camarero',
      rol: 'CAMARERO',
      pinHash: await hashPin('2222'),
    },
  });

  const camarero2 = await prisma.empleado.create({
    data: {
      establecimientoId: estab.id,
      nombre: 'Pedro',
      apellidos: 'Sánchez Díaz',
      nif: '34567890C',
      puesto: 'cajero',
      rol: 'CAJERO',
      pinHash: await hashPin('3333'),
    },
  });

  const cocinero = await prisma.empleado.create({
    data: {
      establecimientoId: estab.id,
      nombre: 'María',
      apellidos: 'Fernández Torres',
      nif: '45678901D',
      puesto: 'cocinero',
      rol: 'COCINERO',
      pinHash: await hashPin('4444'),
    },
  });
  console.log('  ✅ 4 empleados creados (con roles y PINs)');

  // 4. Zonas y Mesas
  const terraza = await prisma.zona.create({
    data: {
      establecimientoId: estab.id,
      nombre: 'Terraza',
      activa: true,
      mesas: {
        create: Array.from({ length: 6 }, (_, i) => ({
          numero: i + 1,
          capacidad: i < 4 ? 4 : 6,
          estado: 'libre',
          activa: true,
        })),
      },
    },
    include: { mesas: true },
  });

  const salon = await prisma.zona.create({
    data: {
      establecimientoId: estab.id,
      nombre: 'Salón Principal',
      activa: true,
      mesas: {
        create: Array.from({ length: 8 }, (_, i) => ({
          numero: i + 7,
          capacidad: i < 4 ? 2 : i < 6 ? 4 : 8,
          estado: 'libre',
          activa: true,
        })),
      },
    },
    include: { mesas: true },
  });

  const barra = await prisma.zona.create({
    data: {
      establecimientoId: estab.id,
      nombre: 'Barra',
      activa: true,
      mesas: {
        create: Array.from({ length: 4 }, (_, i) => ({
          numero: i + 15,
          capacidad: 1,
          estado: 'libre',
          activa: true,
        })),
      },
    },
    include: { mesas: true },
  });
  console.log('  ✅ 3 zonas + 18 mesas creadas');

  // 5. Categorías de producto
  const catEntrantes = await prisma.categoriaProducto.create({
    data: { nombre: 'Entrantes', destino: 'COCINA', orden: 1 },
  });
  const catCarnes = await prisma.categoriaProducto.create({
    data: { nombre: 'Carnes', destino: 'COCINA', orden: 2 },
  });
  const catPescados = await prisma.categoriaProducto.create({
    data: { nombre: 'Pescados', destino: 'COCINA', orden: 3 },
  });
  const catPostres = await prisma.categoriaProducto.create({
    data: { nombre: 'Postres', destino: 'COCINA', orden: 4 },
  });
  const catCervezas = await prisma.categoriaProducto.create({
    data: { nombre: 'Cervezas', destino: 'BARRA', orden: 5 },
  });
  const catVinos = await prisma.categoriaProducto.create({
    data: { nombre: 'Vinos', destino: 'BARRA', orden: 6 },
  });
  const catRefrescos = await prisma.categoriaProducto.create({
    data: { nombre: 'Refrescos', destino: 'BARRA', orden: 7 },
  });
  const catCafes = await prisma.categoriaProducto.create({
    data: { nombre: 'Cafés', destino: 'BARRA', orden: 8 },
  });
  console.log('  ✅ 8 categorías creadas');

  // 6. Productos (precioConIva = PVP con IVA incluido)
  const productos = [
    // Entrantes (IVA 10%)
    { nombre: 'Patatas bravas', precioConIva: 6.50, tipoIva: 'reducido_10', categoriaId: catEntrantes.id },
    { nombre: 'Croquetas caseras (6 uds)', precioConIva: 8.00, tipoIva: 'reducido_10', categoriaId: catEntrantes.id },
    { nombre: 'Ensalada mixta', precioConIva: 7.50, tipoIva: 'reducido_10', categoriaId: catEntrantes.id },
    { nombre: 'Jamón ibérico', precioConIva: 18.00, tipoIva: 'reducido_10', categoriaId: catEntrantes.id },
    { nombre: 'Gazpacho andaluz', precioConIva: 5.50, tipoIva: 'reducido_10', categoriaId: catEntrantes.id },
    { nombre: 'Tortilla española', precioConIva: 7.00, tipoIva: 'reducido_10', categoriaId: catEntrantes.id },
    // Carnes (IVA 10%)
    { nombre: 'Entrecot a la brasa', precioConIva: 22.00, tipoIva: 'reducido_10', categoriaId: catCarnes.id },
    { nombre: 'Solomillo al whisky', precioConIva: 19.50, tipoIva: 'reducido_10', categoriaId: catCarnes.id },
    { nombre: 'Pollo al ajillo', precioConIva: 13.50, tipoIva: 'reducido_10', categoriaId: catCarnes.id },
    { nombre: 'Secreto ibérico', precioConIva: 17.00, tipoIva: 'reducido_10', categoriaId: catCarnes.id },
    // Pescados (IVA 10%)
    { nombre: 'Merluza a la plancha', precioConIva: 16.00, tipoIva: 'reducido_10', categoriaId: catPescados.id },
    { nombre: 'Pulpo a la gallega', precioConIva: 18.50, tipoIva: 'reducido_10', categoriaId: catPescados.id },
    { nombre: 'Bacalao al pil-pil', precioConIva: 17.50, tipoIva: 'reducido_10', categoriaId: catPescados.id },
    // Postres (IVA 10%)
    { nombre: 'Tarta de queso', precioConIva: 6.00, tipoIva: 'reducido_10', categoriaId: catPostres.id },
    { nombre: 'Crema catalana', precioConIva: 5.50, tipoIva: 'reducido_10', categoriaId: catPostres.id },
    { nombre: 'Helado artesanal', precioConIva: 4.50, tipoIva: 'reducido_10', categoriaId: catPostres.id },
    // Cervezas (IVA 21%)
    { nombre: 'Caña', precioConIva: 2.00, tipoIva: 'general_21', categoriaId: catCervezas.id },
    { nombre: 'Caña doble', precioConIva: 3.50, tipoIva: 'general_21', categoriaId: catCervezas.id },
    { nombre: 'Tercio Mahou', precioConIva: 3.00, tipoIva: 'general_21', categoriaId: catCervezas.id },
    { nombre: 'Cerveza artesana', precioConIva: 4.50, tipoIva: 'general_21', categoriaId: catCervezas.id },
    // Vinos (IVA 21%)
    { nombre: 'Copa de vino tinto', precioConIva: 3.50, tipoIva: 'general_21', categoriaId: catVinos.id },
    { nombre: 'Copa de vino blanco', precioConIva: 3.50, tipoIva: 'general_21', categoriaId: catVinos.id },
    { nombre: 'Botella Ribera del Duero', precioConIva: 22.00, tipoIva: 'general_21', categoriaId: catVinos.id },
    { nombre: 'Botella Albariño', precioConIva: 18.00, tipoIva: 'general_21', categoriaId: catVinos.id },
    // Refrescos (IVA 21%)
    { nombre: 'Coca-Cola', precioConIva: 2.50, tipoIva: 'general_21', categoriaId: catRefrescos.id },
    { nombre: 'Agua mineral', precioConIva: 1.80, tipoIva: 'general_21', categoriaId: catRefrescos.id },
    { nombre: 'Zumo de naranja', precioConIva: 3.00, tipoIva: 'general_21', categoriaId: catRefrescos.id },
    { nombre: 'Tónica', precioConIva: 2.50, tipoIva: 'general_21', categoriaId: catRefrescos.id },
    // Cafés (IVA 10%)
    { nombre: 'Café solo', precioConIva: 1.30, tipoIva: 'reducido_10', categoriaId: catCafes.id },
    { nombre: 'Café con leche', precioConIva: 1.60, tipoIva: 'reducido_10', categoriaId: catCafes.id },
    { nombre: 'Cortado', precioConIva: 1.40, tipoIva: 'reducido_10', categoriaId: catCafes.id },
    { nombre: 'Infusión', precioConIva: 1.80, tipoIva: 'reducido_10', categoriaId: catCafes.id },
  ];

  for (const p of productos) {
    await prisma.producto.create({
      data: {
        nombre: p.nombre,
        precioConIva: p.precioConIva,
        tipoIva: p.tipoIva as any,
        categoriaId: p.categoriaId,
        establecimientoId: estab.id,
        activo: true,
      },
    });
  }
  console.log(`  ✅ ${productos.length} productos creados`);

  // 7. Caja
  const caja = await prisma.caja.create({
    data: {
      establecimientoId: estab.id,
      nombre: 'Caja Principal',
      activa: true,
    },
  });
  console.log('  ✅ Caja creada');

  // 8. Serie de facturación
  await prisma.serieFacturacion.create({
    data: {
      establecimientoId: estab.id,
      prefijo: 'V',
      tipo: 'ticket',
      ultimoNumero: 0,
      year: new Date().getFullYear(),
    },
  });
  await prisma.serieFacturacion.create({
    data: {
      establecimientoId: estab.id,
      prefijo: 'F',
      tipo: 'factura_completa',
      ultimoNumero: 0,
      year: new Date().getFullYear(),
    },
  });
  await prisma.serieFacturacion.create({
    data: {
      establecimientoId: estab.id,
      prefijo: 'R',
      tipo: 'rectificativa',
      ultimoNumero: 0,
      year: new Date().getFullYear(),
    },
  });
  console.log('  ✅ 3 series de facturación creadas');

  // 9. Alérgenos (EU 14 obligatorios)
  const alergenos = [
    'Gluten', 'Crustáceos', 'Huevos', 'Pescado', 'Cacahuetes',
    'Soja', 'Lácteos', 'Frutos de cáscara', 'Apio', 'Mostaza',
    'Sésamo', 'Sulfitos', 'Altramuces', 'Moluscos',
  ];
  for (const a of alergenos) {
    await prisma.alergeno.create({ data: { nombre: a } });
  }
  console.log('  ✅ 14 alérgenos EU creados');

  // 10. Programa de fidelización
  await prisma.programaFidelizacion.create({
    data: {
      establecimientoId: estab.id,
      puntosPorEuro: 1,
      umbralPlata: 500,
      umbralOro: 1500,
      revisionAnual: true,
    },
  });
  console.log('  ✅ Programa de fidelización creado');

  // 11. Almacén
  const almacen = await prisma.almacen.create({
    data: {
      establecimientoId: estab.id,
      nombre: 'Almacén General',
      activo: true,
    },
  });
  console.log('  ✅ Almacén creado');

  // 12. Proveedores de demo
  const makro = await prisma.proveedor.create({
    data: {
      establecimientoId: estab.id,
      nombre: 'Makro',
      nif: 'A28017895',
      direccion: 'Av. de Burgos km 14,5, Madrid',
      telefono: '900123456',
      email: 'pedidos@makro.es',
      activo: true,
    },
  });

  const provefresco = await prisma.proveedor.create({
    data: {
      establecimientoId: estab.id,
      nombre: 'Provefresco S.L.',
      nif: 'B78901234',
      direccion: 'Mercamadrid, Nave 45',
      telefono: '912345678',
      email: 'pedidos@provefresco.es',
      activo: true,
    },
  });

  const cervezasnorte = await prisma.proveedor.create({
    data: {
      establecimientoId: estab.id,
      nombre: 'Cervezas del Norte',
      nif: 'B45678901',
      direccion: 'Polígono Industrial Norte, Bilbao',
      telefono: '944567890',
      email: 'comercial@cervezasnorte.es',
      activo: true,
    },
  });
  console.log('  ✅ 3 proveedores de demo creados');

  // Summary
  console.log('\n🎉 Seed completado!\n');
  console.log('📋 Datos de demo:');
  console.log(`   Establecimiento: "${estab.nombre}" (${estab.id})`);
  console.log(`   Gerente: Carlos García (${gerente.id})`);
  console.log(`   Camareros: Ana (${camarero1.id}), Pedro (${camarero2.id})`);
  console.log(`   Cocinera: María (${cocinero.id})`);
  console.log(`   Caja: ${caja.id}`);
  console.log(`   Almacén: ${almacen.id}`);
  console.log(`   Zonas: Terraza (${terraza.id}), Salón (${salon.id}), Barra (${barra.id})`);
  console.log(`   Mesas: ${terraza.mesas.length + salon.mesas.length + barra.mesas.length} mesas`);
  console.log(`   Productos: ${productos.length} productos en carta`);
  console.log(`   Proveedores: Makro (${makro.id}), Provefresco (${provefresco.id}), Cervezas del Norte (${cervezasnorte.id})`);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
