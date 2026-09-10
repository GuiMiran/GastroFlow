import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { faker } from '@faker-js/faker/locale/es';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// ════════════════════════════════════════════════════════════════════════════
// 🎲 CONFIGURACIÓN DE DATOS MASIVOS
// ════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  TENANTS: 3,
  ESTABLECIMIENTOS_POR_TENANT: 2,
  EMPLEADOS_POR_ESTABLECIMIENTO: 15,
  CLIENTES: 200,
  PRODUCTOS_POR_ESTABLECIMIENTO: 80,
  PROVEEDORES_POR_ESTABLECIMIENTO: 5,
  INGREDIENTES: 100,
  SERVICIOS_HISTORICOS: 500, // ventas pasadas
  TURNOS_CAJA_HISTORICOS: 30,
  FACTURAS_COMPRA: 50,
  RESERVAS_FUTURAS: 30,
};

// ════════════════════════════════════════════════════════════════════════════
// 🛠️ UTILIDADES
// ════════════════════════════════════════════════════════════════════════════

const hashPin = (pin: string) => bcrypt.hash(pin, 10);
const hashPass = (pass: string) => bcrypt.hash(pass, 10);

const randomIVA = (): 'general_21' | 'reducido_10' | 'superreducido_4' => {
  const rand = Math.random();
  if (rand < 0.7) return 'reducido_10'; // 70% comida
  if (rand < 0.9) return 'general_21'; // 20% bebidas
  return 'superreducido_4'; // 10% pan, leche, etc.
};

const calcularIVA = (precioConIva: number, tipoIva: string) => {
  let tasaIva = 0.21;
  if (tipoIva === 'reducido_10') tasaIva = 0.10;
  if (tipoIva === 'superreducido_4') tasaIva = 0.04;
  
  const base = precioConIva / (1 + tasaIva);
  const cuota = precioConIva - base;
  return { base, cuota, tasa: tasaIva };
};

const randomFormaPago = () => {
  const opciones = ['efectivo', 'tarjeta', 'bizum'];
  const pesos = [0.4, 0.5, 0.1]; // 40% efectivo, 50% tarjeta, 10% bizum
  const rand = Math.random();
  let acum = 0;
  for (let i = 0; i < opciones.length; i++) {
    acum += pesos[i];
    if (rand < acum) return opciones[i] as any;
  }
  return 'efectivo';
};

// ════════════════════════════════════════════════════════════════════════════
// 📋 DATOS MAESTROS (Categorías, Alérgenos, etc.)
// ════════════════════════════════════════════════════════════════════════════

const CATEGORIAS = [
  { nombre: 'Entrantes', destino: 'COCINA', orden: 1 },
  { nombre: 'Carnes', destino: 'COCINA', orden: 2 },
  { nombre: 'Pescados', destino: 'COCINA', orden: 3 },
  { nombre: 'Arroces', destino: 'COCINA', orden: 4 },
  { nombre: 'Ensaladas', destino: 'COCINA', orden: 5 },
  { nombre: 'Pastas', destino: 'COCINA', orden: 6 },
  { nombre: 'Hamburguesas', destino: 'COCINA', orden: 7 },
  { nombre: 'Pizzas', destino: 'COCINA', orden: 8 },
  { nombre: 'Postres', destino: 'COCINA', orden: 9 },
  { nombre: 'Cervezas', destino: 'BARRA', orden: 10 },
  { nombre: 'Vinos', destino: 'BARRA', orden: 11 },
  { nombre: 'Refrescos', destino: 'BARRA', orden: 12 },
  { nombre: 'Cafés', destino: 'BARRA', orden: 13 },
  { nombre: 'Cócteles', destino: 'BARRA', orden: 14 },
];

const ALERGENOS_DATA = [
  { nombre: 'Gluten', icono: '🌾' },
  { nombre: 'Crustáceos', icono: '🦐' },
  { nombre: 'Huevos', icono: '🥚' },
  { nombre: 'Pescado', icono: '🐟' },
  { nombre: 'Cacahuetes', icono: '🥜' },
  { nombre: 'Soja', icono: '🫘' },
  { nombre: 'Lácteos', icono: '🥛' },
  { nombre: 'Frutos de cáscara', icono: '🌰' },
  { nombre: 'Apio', icono: '🥬' },
  { nombre: 'Mostaza', icono: '🟡' },
  { nombre: 'Sésamo', icono: '🫘' },
  { nombre: 'Sulfitos', icono: '🧪' },
  { nombre: 'Moluscos', icono: '🦪' },
];

const PRODUCTOS_PLANTILLA = [
  // Entrantes (IVA 10%)
  { nombre: 'Patatas bravas', categoria: 'Entrantes', precio: [5, 8], tipoIva: 'reducido_10' },
  { nombre: 'Croquetas caseras', categoria: 'Entrantes', precio: [6, 10], tipoIva: 'reducido_10' },
  { nombre: 'Ensalada mixta', categoria: 'Entrantes', precio: [7, 9], tipoIva: 'reducido_10' },
  { nombre: 'Jamón ibérico', categoria: 'Entrantes', precio: [15, 25], tipoIva: 'reducido_10' },
  { nombre: 'Tortilla española', categoria: 'Entrantes', precio: [6, 9], tipoIva: 'reducido_10' },
  { nombre: 'Calamares fritos', categoria: 'Entrantes', precio: [10, 14], tipoIva: 'reducido_10' },
  { nombre: 'Chistorra asada', categoria: 'Entrantes', precio: [7, 11], tipoIva: 'reducido_10' },
  { nombre: 'Tabla de quesos', categoria: 'Entrantes', precio: [12, 18], tipoIva: 'reducido_10' },
  
  // Carnes (IVA 10%)
  { nombre: 'Entrecot de ternera', categoria: 'Carnes', precio: [18, 28], tipoIva: 'reducido_10' },
  { nombre: 'Solomillo al whisky', categoria: 'Carnes', precio: [20, 30], tipoIva: 'reducido_10' },
  { nombre: 'Pollo al ajillo', categoria: 'Carnes', precio: [12, 16], tipoIva: 'reducido_10' },
  { nombre: 'Secreto ibérico', categoria: 'Carnes', precio: [16, 22], tipoIva: 'reducido_10' },
  { nombre: 'Costillas BBQ', categoria: 'Carnes', precio: [14, 20], tipoIva: 'reducido_10' },
  
  // Pescados (IVA 10%)
  { nombre: 'Merluza a la plancha', categoria: 'Pescados', precio: [14, 20], tipoIva: 'reducido_10' },
  { nombre: 'Dorada al horno', categoria: 'Pescados', precio: [16, 24], tipoIva: 'reducido_10' },
  { nombre: 'Pulpo a la gallega', categoria: 'Pescados', precio: [17, 25], tipoIva: 'reducido_10' },
  { nombre: 'Bacalao al pil-pil', categoria: 'Pescados', precio: [16, 23], tipoIva: 'reducido_10' },
  { nombre: 'Salmón a la plancha', categoria: 'Pescados', precio: [15, 22], tipoIva: 'reducido_10' },
  
  // Arroces (IVA 10%)
  { nombre: 'Paella marinera', categoria: 'Arroces', precio: [12, 16], tipoIva: 'reducido_10' },
  { nombre: 'Arroz negro', categoria: 'Arroces', precio: [13, 17], tipoIva: 'reducido_10' },
  { nombre: 'Arroz con bogavante', categoria: 'Arroces', precio: [22, 30], tipoIva: 'reducido_10' },
  
  // Pizzas/Pastas (IVA 10%)
  { nombre: 'Pizza Margarita', categoria: 'Pizzas', precio: [9, 13], tipoIva: 'reducido_10' },
  { nombre: 'Pizza Cuatro Quesos', categoria: 'Pizzas', precio: [10, 14], tipoIva: 'reducido_10' },
  { nombre: 'Espaguetis carbonara', categoria: 'Pastas', precio: [10, 14], tipoIva: 'reducido_10' },
  { nombre: 'Lasaña boloñesa', categoria: 'Pastas', precio: [11, 15], tipoIva: 'reducido_10' },
  
  // Hamburguesas (IVA 10%)
  { nombre: 'Hamburguesa clásica', categoria: 'Hamburguesas', precio: [9, 13], tipoIva: 'reducido_10' },
  { nombre: 'Hamburguesa con queso', categoria: 'Hamburguesas', precio: [10, 14], tipoIva: 'reducido_10' },
  { nombre: 'Hamburguesa BBQ', categoria: 'Hamburguesas', precio: [11, 15], tipoIva: 'reducido_10' },
  
  // Postres (IVA 10%)
  { nombre: 'Tarta de queso', categoria: 'Postres', precio: [5, 7], tipoIva: 'reducido_10' },
  { nombre: 'Brownie con helado', categoria: 'Postres', precio: [6, 8], tipoIva: 'reducido_10' },
  { nombre: 'Flan casero', categoria: 'Postres', precio: [4, 6], tipoIva: 'reducido_10' },
  { nombre: 'Tiramisú', categoria: 'Postres', precio: [6, 8], tipoIva: 'reducido_10' },
  
  // Cervezas (IVA 21%)
  { nombre: 'Cerveza caña', categoria: 'Cervezas', precio: [2, 3], tipoIva: 'general_21' },
  { nombre: 'Cerveza jarra', categoria: 'Cervezas', precio: [3.5, 5], tipoIva: 'general_21' },
  { nombre: 'Cerveza botellín', categoria: 'Cervezas', precio: [2.5, 3.5], tipoIva: 'general_21' },
  { nombre: 'Cerveza sin alcohol', categoria: 'Cervezas', precio: [2.5, 3.5], tipoIva: 'general_21' },
  
  // Vinos (IVA 21%)
  { nombre: 'Vino tinto copa', categoria: 'Vinos', precio: [2.5, 4], tipoIva: 'general_21' },
  { nombre: 'Vino blanco copa', categoria: 'Vinos', precio: [2.5, 4], tipoIva: 'general_21' },
  { nombre: 'Vino rosado copa', categoria: 'Vinos', precio: [2.5, 4], tipoIva: 'general_21' },
  { nombre: 'Vino tinto botella', categoria: 'Vinos', precio: [12, 25], tipoIva: 'general_21' },
  
  // Refrescos (IVA 21%)
  { nombre: 'Coca-Cola', categoria: 'Refrescos', precio: [2, 3], tipoIva: 'general_21' },
  { nombre: 'Fanta Naranja', categoria: 'Refrescos', precio: [2, 3], tipoIva: 'general_21' },
  { nombre: 'Agua mineral', categoria: 'Refrescos', precio: [1.5, 2.5], tipoIva: 'general_21' },
  { nombre: 'Zumo natural', categoria: 'Refrescos', precio: [3, 4.5], tipoIva: 'general_21' },
  
  // Cafés (IVA 21%)
  { nombre: 'Café solo', categoria: 'Cafés', precio: [1.2, 1.8], tipoIva: 'general_21' },
  { nombre: 'Café con leche', categoria: 'Cafés', precio: [1.5, 2.2], tipoIva: 'general_21' },
  { nombre: 'Cortado', categoria: 'Cafés', precio: [1.3, 1.9], tipoIva: 'general_21' },
  { nombre: 'Capuchino', categoria: 'Cafés', precio: [2, 3], tipoIva: 'general_21' },
  
  // Cócteles (IVA 21%)
  { nombre: 'Mojito', categoria: 'Cócteles', precio: [6, 9], tipoIva: 'general_21' },
  { nombre: 'Gin Tonic', categoria: 'Cócteles', precio: [7, 10], tipoIva: 'general_21' },
  { nombre: 'Margarita', categoria: 'Cócteles', precio: [7, 10], tipoIva: 'general_21' },
];

// ════════════════════════════════════════════════════════════════════════════
// 🚀 FUNCIÓN PRINCIPAL DE SEED
// ════════════════════════════════════════════════════════════════════════════

async function main() {
  console.log('🌱 Iniciando seed masivo de GastroFlow...\n');
  const startTime = Date.now();

  // ──────────────────────────────────────────────────────────────────────────
  // 1️⃣ CREAR ALÉRGENOS (global)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('🥜 Creando alérgenos...');
  const alergenos = [];
  for (const alergenoData of ALERGENOS_DATA) {
    const alergeno = await prisma.alergeno.upsert({
      where: { nombre: alergenoData.nombre },
      create: alergenoData,
      update: {},
    });
    alergenos.push(alergeno);
  }
  console.log(`  ✅ ${alergenos.length} alérgenos creados\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // 2️⃣ CREAR CATEGORÍAS (global)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('📂 Creando categorías de productos...');
  const categorias = [];
  for (const catData of CATEGORIAS) {
    const cat = await prisma.categoriaProducto.create({ data: catData });
    categorias.push(cat);
  }
  console.log(`  ✅ ${categorias.length} categorías creadas\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // 3️⃣ CREAR INGREDIENTES (global)
  // ──────────────────────────────────────────────────────────────────────────
  console.log('🥬 Creando ingredientes...');
  const ingredientes = [];
  const unidades = ['kg', 'l', 'unidad', 'g', 'ml'];
  for (let i = 0; i < CONFIG.INGREDIENTES; i++) {
    const ingrediente = await prisma.ingrediente.create({
      data: {
        nombre: faker.commerce.productName(),
        unidadMedida: faker.helpers.arrayElement(unidades),
        precioCoste: parseFloat(faker.commerce.price({ min: 0.5, max: 50, dec: 2 })),
        stockMinimo: Math.random() * 10,
        activo: true,
      },
    });
    ingredientes.push(ingrediente);
  }
  console.log(`  ✅ ${ingredientes.length} ingredientes creados\n`);

  // ──────────────────────────────────────────────────────────────────────────
  // 4️⃣ BUCLE: TENANTS → ESTABLECIMIENTOS → DATOS
  // ──────────────────────────────────────────────────────────────────────────
  const allClientes: any[] = [];
  
  for (let t = 0; t < CONFIG.TENANTS; t++) {
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`🏢 TENANT ${t + 1}/${CONFIG.TENANTS}`);
    console.log(`${'═'.repeat(80)}\n`);

    // Crear Tenant
    const tenant = await prisma.tenant.create({
      data: {
        nombre: faker.company.name(),
        nif: `B${faker.string.numeric(8)}`,
        email: faker.internet.email(),
        activo: true,
      },
    });
    console.log(`  ✅ Tenant: ${tenant.nombre}\n`);

    // Crear Establecimientos para este Tenant
    for (let e = 0; e < CONFIG.ESTABLECIMIENTOS_POR_TENANT; e++) {
      console.log(`  ┌─ 🏪 Establecimiento ${e + 1}/${CONFIG.ESTABLECIMIENTOS_POR_TENANT}`);
      
      const estab = await prisma.establecimiento.create({
        data: {
          tenantId: tenant.id,
          nombre: `${faker.company.name()} - Local ${e + 1}`,
          nif: tenant.nif,
          direccion: faker.location.streetAddress(),
          codigoPostal: faker.location.zipCode('#####'),
          ciudad: faker.location.city(),
          provincia: faker.location.state(),
          telefono: faker.phone.number(),
          regimenFiscal: 'general',
          activo: true,
        },
      });
      console.log(`  │  Nombre: ${estab.nombre}`);
      console.log(`  │  ID: ${estab.id}\n`);

      // ─────────────────────────────────────────────────────────────────────
      // ZONAS Y MESAS
      // ─────────────────────────────────────────────────────────────────────
      const zonasData = [
        { nombre: 'Terraza', numMesas: 8 },
        { nombre: 'Salón Principal', numMesas: 12 },
        { nombre: 'Barra', numMesas: 5 },
        { nombre: 'Comedor VIP', numMesas: 4 },
      ];

      const zonas = [];
      let numeroMesaGlobal = 1;
      for (const zd of zonasData) {
        const zona = await prisma.zona.create({
          data: {
            establecimientoId: estab.id,
            nombre: zd.nombre,
            activa: true,
            mesas: {
              create: Array.from({ length: zd.numMesas }, () => ({
                numero: numeroMesaGlobal++,
                capacidad: faker.helpers.arrayElement([2, 2, 4, 4, 6, 8]),
                estado: 'libre',
                activa: true,
              })),
            },
          },
          include: { mesas: true },
        });
        zonas.push(zona);
      }
      const todasMesas = zonas.flatMap(z => z.mesas);
      console.log(`  │  ✅ ${zonas.length} zonas, ${todasMesas.length} mesas`);

      // ─────────────────────────────────────────────────────────────────────
      // EMPLEADOS
      // ─────────────────────────────────────────────────────────────────────
      const roles = ['ADMIN', 'CAMARERO', 'CAMARERO', 'CAMARERO', 'CAJERO', 'COCINERO', 'COCINERO'];
      const empleados = [];
      
      for (let i = 0; i < CONFIG.EMPLEADOS_POR_ESTABLECIMIENTO; i++) {
        const rol = i === 0 ? 'ADMIN' : faker.helpers.arrayElement(roles);
        const puesto = rol.toLowerCase();
        const pin = i === 0 ? '1234' : faker.string.numeric(4); // Primer empleado con PIN conocido
        
        const empleado = await prisma.empleado.create({
          data: {
            establecimientoId: estab.id,
            nombre: i === 0 ? 'Carlos' : faker.person.firstName(),
            apellidos: i === 0 ? 'García Admin' : `${faker.person.lastName()} ${faker.person.lastName()}`,
            nif: `${faker.string.numeric(8)}${faker.string.alpha(1).toUpperCase()}`,
            email: faker.internet.email(),
            emailLogin: i === 0 ? `admin${t}${e}@gastroflow.es` : undefined, // Email único por establecimiento
            puesto,
            rol: rol as any,
            pinHash: await hashPin(pin),
            passwordHash: i === 0 ? await hashPass('Admin1234!') : undefined,
          },
        });
        empleados.push(empleado);
      }
      console.log(`  │  ✅ ${empleados.length} empleados (Carlos García con PIN 1234)`);

      const camareros = empleados.filter(e => e.rol === 'CAMARERO');
      const cajeros = empleados.filter(e => e.rol === 'CAJERO');
      const cocineros = empleados.filter(e => e.rol === 'COCINERO');

      // ─────────────────────────────────────────────────────────────────────
      // PRODUCTOS
      // ─────────────────────────────────────────────────────────────────────
      const productos = [];
      const categoriasMap = new Map(categorias.map(c => [c.nombre, c]));
      
      for (const plantilla of PRODUCTOS_PLANTILLA) {
        const cat = categoriasMap.get(plantilla.categoria);
        if (!cat) continue;
        
        const precioConIva = faker.number.float({
          min: plantilla.precio[0],
          max: plantilla.precio[1],
          fractionDigits: 2,
        });

        const producto = await prisma.producto.create({
          data: {
            establecimientoId: estab.id,
            categoriaId: cat.id,
            nombre: plantilla.nombre,
            descripcion: faker.lorem.sentence(),
            precioConIva,
            tipoIva: plantilla.tipoIva as any,
            activo: true,
          },
        });
        productos.push(producto);
      }

      // Productos adicionales aleatorios
      const productosExtra = CONFIG.PRODUCTOS_POR_ESTABLECIMIENTO - PRODUCTOS_PLANTILLA.length;
      for (let i = 0; i < productosExtra; i++) {
        const cat = faker.helpers.arrayElement(categorias);
        const tipoIva = randomIVA();
        const precioConIva = faker.number.float({ min: 3, max: 30, fractionDigits: 2 });

        const producto = await prisma.producto.create({
          data: {
            establecimientoId: estab.id,
            categoriaId: cat.id,
            nombre: faker.commerce.productName(),
            descripcion: faker.commerce.productDescription(),
            precioConIva,
            tipoIva,
            activo: Math.random() > 0.1, // 10% inactivos
          },
        });
        productos.push(producto);
      }
      console.log(`  │  ✅ ${productos.length} productos`);

      // ─────────────────────────────────────────────────────────────────────
      // CLIENTES (compartidos entre establecimientos del mismo tenant)
      // ─────────────────────────────────────────────────────────────────────
      if (e === 0) {
        // Solo crear clientes una vez por tenant
        for (let i = 0; i < CONFIG.CLIENTES; i++) {
          const cliente = await prisma.cliente.create({
            data: {
              establecimientoId: estab.id,
              nombre: faker.person.firstName(),
              apellidos: `${faker.person.lastName()} ${faker.person.lastName()}`,
              email: faker.internet.email(),
              telefono: faker.phone.number(),
              fechaNacimiento: Math.random() > 0.5 ? faker.date.birthdate({ min: 18, max: 80, mode: 'age' }) : undefined,
              puntos: Math.random() > 0.3 ? faker.number.int({ min: 0, max: 500 }) : 0,
              nivel: faker.helpers.arrayElement(['bronce', 'plata', 'oro']),
              activo: true,
            },
          });
          allClientes.push(cliente);
        }
        console.log(`  │  ✅ ${CONFIG.CLIENTES} clientes creados (compartidos en tenant)`);
      }

      // ─────────────────────────────────────────────────────────────────────
      // PROVEEDORES
      // ─────────────────────────────────────────────────────────────────────
      const proveedores = [];
      for (let i = 0; i < CONFIG.PROVEEDORES_POR_ESTABLECIMIENTO; i++) {
        const proveedor = await prisma.proveedor.create({
          data: {
            establecimientoId: estab.id,
            nombre: faker.company.name(),
            nif: `B${faker.string.numeric(8)}`,
            direccion: faker.location.streetAddress(),
            telefono: faker.phone.number(),
            email: faker.internet.email(),
            activo: true,
          },
        });
        proveedores.push(proveedor);
      }
      console.log(`  │  ✅ ${proveedores.length} proveedores`);

      // ─────────────────────────────────────────────────────────────────────
      // ALMACÉN Y STOCKS
      // ─────────────────────────────────────────────────────────────────────
      const almacen = await prisma.almacen.create({
        data: {
          establecimientoId: estab.id,
          nombre: 'Almacén Principal',
          activo: true,
        },
      });

      for (const ing of ingredientes.slice(0, 50)) {
        await prisma.stock.create({
          data: {
            ingredienteId: ing.id,
            almacenId: almacen.id,
            cantidad: faker.number.float({ min: 10, max: 500, fractionDigits: 2 }),
          },
        });
      }
      console.log(`  │  ✅ Almacén con stocks`);

      // ─────────────────────────────────────────────────────────────────────
      // CAJA Y TURNOS HISTÓRICOS
      // ─────────────────────────────────────────────────────────────────────
      const caja = await prisma.caja.create({
        data: {
          establecimientoId: estab.id,
          nombre: 'Caja 1',
          activa: true,
        },
      });

      for (let i = 0; i < CONFIG.TURNOS_CAJA_HISTORICOS; i++) {
        const cajero = faker.helpers.arrayElement(cajeros.length > 0 ? cajeros : empleados);
        const fechaApertura = faker.date.recent({ days: 90 });
        const fechaCierre = new Date(fechaApertura.getTime() + 8 * 60 * 60 * 1000); // +8 horas
        const fondoCaja = 100;
        const efectivoEsperado = fondoCaja + faker.number.float({ min: 200, max: 2000, fractionDigits: 2 });
        const efectivoReal = efectivoEsperado + faker.number.float({ min: -20, max: 20, fractionDigits: 2 });
        const descuadre = efectivoReal - efectivoEsperado;

        await prisma.turnoCaja.create({
          data: {
            cajaId: caja.id,
            cajeroId: cajero.id,
            fondoCaja,
            abierto: false,
            horaApertura: fechaApertura,
            horaCierre: fechaCierre,
            efectivoEsperado,
            efectivoReal,
            descuadre,
          },
        });
      }
      console.log(`  │  ✅ ${CONFIG.TURNOS_CAJA_HISTORICOS} turnos de caja históricos`);

      // ─────────────────────────────────────────────────────────────────────
      // SERIES DE FACTURACIÓN
      // ─────────────────────────────────────────────────────────────────────
      const prefijoEstab = `T${e + 1}${t + 1}`; // T11, T12, T21, T22, etc.
      
      const serieTkt = await prisma.serieFacturacion.create({
        data: {
          establecimientoId: estab.id,
          prefijo: prefijoEstab,
          tipo: 'ticket',
          ultimoNumero: 0,
          year: 2026,
        },
      });

      const serieFacturaCompleta = await prisma.serieFacturacion.create({
        data: {
          establecimientoId: estab.id,
          prefijo: `F${e + 1}${t + 1}`,
          tipo: 'factura_completa',
          ultimoNumero: 0,
          year: 2026,
        },
      });

      // ─────────────────────────────────────────────────────────────────────
      // SERVICIOS HISTÓRICOS (Ventas pasadas)
      // ─────────────────────────────────────────────────────────────────────
      console.log(`  │  🎲 Generando ${CONFIG.SERVICIOS_HISTORICOS} ventas históricas...`);
      
      for (let s = 0; s < CONFIG.SERVICIOS_HISTORICOS; s++) {
        if (camareros.length === 0) continue;
        
        const camarero = faker.helpers.arrayElement(camareros);
        const mesa = faker.helpers.arrayElement(todasMesas);
        const comensales = faker.number.int({ min: 1, max: 6 });
        const horaApertura = faker.date.recent({ days: 60 });
        const duracion = faker.number.int({ min: 30, max: 120 }); // minutos
        const horaCierre = new Date(horaApertura.getTime() + duracion * 60 * 1000);

        // Crear servicio
        const servicio = await prisma.servicio.create({
          data: {
            mesaId: mesa.id,
            camareroId: camarero.id,
            comensales,
            abierto: false,
            horaApertura,
            horaCierre,
          },
        });

        // Crear comanda
        const comanda = await prisma.comanda.create({
          data: {
            servicioId: servicio.id,
            numero: 1,
            estado: 'servida',
            destino: 'COCINA',
            createdAt: horaApertura,
          },
        });

        // Líneas de comanda (productos pedidos)
        const numLineas = faker.number.int({ min: 2, max: 8 });
        const lineasComanda = [];
        let baseTotal4 = 0, cuotaTotal4 = 0;
        let baseTotal10 = 0, cuotaTotal10 = 0;
        let baseTotal21 = 0, cuotaTotal21 = 0;

        for (let l = 0; l < numLineas; l++) {
          const producto = faker.helpers.arrayElement(productos.filter(p => p.activo));
          const cantidad = faker.number.int({ min: 1, max: 3 });
          const precioUnitario = parseFloat(producto.precioConIva.toString());
          const totalLinea = precioUnitario * cantidad;
          const { base, cuota, tasa } = calcularIVA(totalLinea, producto.tipoIva);

          const linea = await prisma.lineaComanda.create({
            data: {
              comandaId: comanda.id,
              productoId: producto.id,
              cantidad,
              precioUnitario,
              tipoIva: tasa,
              baseImponible: base,
              cuotaIva: cuota,
              descuento: 0,
              anulada: false,
            },
          });
          lineasComanda.push(linea);

          // Acumular por tipo de IVA
          if (producto.tipoIva === 'superreducido_4') {
            baseTotal4 += base;
            cuotaTotal4 += cuota;
          } else if (producto.tipoIva === 'reducido_10') {
            baseTotal10 += base;
            cuotaTotal10 += cuota;
          } else {
            baseTotal21 += base;
            cuotaTotal21 += cuota;
          }
        }

        const totalSinIva = baseTotal4 + baseTotal10 + baseTotal21;
        const totalIva = cuotaTotal4 + cuotaTotal10 + cuotaTotal21;
        const total = totalSinIva + totalIva;

        // Crear ticket
        const numeroSecuencial = ++serieTkt.ultimoNumero;
        const codigoCompleto = `${serieTkt.prefijo}-${numeroSecuencial.toString().padStart(8, '0')}`;

        const ticket = await prisma.ticket.create({
          data: {
            servicioId: servicio.id,
            serieFacturacionId: serieTkt.id,
            tipo: 'ticket',
            numeroSecuencial,
            codigoCompleto,
            baseImponible4: baseTotal4,
            cuotaIva4: cuotaTotal4,
            baseImponible10: baseTotal10,
            cuotaIva10: cuotaTotal10,
            baseImponible21: baseTotal21,
            cuotaIva21: cuotaTotal21,
            totalSinIva,
            totalIva,
            total,
            fechaEmision: horaCierre,
            clienteId: Math.random() > 0.7 ? faker.helpers.arrayElement(allClientes)?.id : undefined,
          },
        });

        // Asociar líneas al ticket
        for (const linea of lineasComanda) {
          await prisma.lineaComanda.update({
            where: { id: linea.id },
            data: { ticketId: ticket.id },
          });
        }

        // Crear cobro
        const formaPago = randomFormaPago();
        await prisma.cobro.create({
          data: {
            ticketId: ticket.id,
            formaPago,
            importe: total,
            cambio: formaPago === 'efectivo' ? faker.number.float({ min: 0, max: 10, fractionDigits: 2 }) : 0,
            createdAt: horaCierre,
          },
        });

        // Actualizar serie de facturación
        await prisma.serieFacturacion.update({
          where: { id: serieTkt.id },
          data: { ultimoNumero: numeroSecuencial },
        });
      }
      
      console.log(`  │  ✅ ${CONFIG.SERVICIOS_HISTORICOS} servicios históricos con tickets`);

      // ─────────────────────────────────────────────────────────────────────
      // FACTURAS DE COMPRA
      // ─────────────────────────────────────────────────────────────────────
      for (let i = 0; i < CONFIG.FACTURAS_COMPRA; i++) {
        const proveedor = faker.helpers.arrayElement(proveedores);
        const fechaFactura = faker.date.recent({ days: 90 });
        const base10 = faker.number.float({ min: 100, max: 1000, fractionDigits: 2 });
        const cuota10 = base10 * 0.10;
        const base21 = faker.number.float({ min: 50, max: 500, fractionDigits: 2 });
        const cuota21 = base21 * 0.21;
        const totalSinIva = base10 + base21;
        const totalIva = cuota10 + cuota21;
        const total = totalSinIva + totalIva;

        await prisma.facturaCompra.create({
          data: {
            proveedorId: proveedor.id,
            numeroFactura: `FC-${faker.string.numeric(8)}`,
            fechaFactura,
            fechaRegistro: fechaFactura,
            baseImponible10: base10,
            cuotaIva10: cuota10,
            baseImponible21: base21,
            cuotaIva21: cuota21,
            totalSinIva,
            totalIva,
            total,
          },
        });
      }
      console.log(`  │  ✅ ${CONFIG.FACTURAS_COMPRA} facturas de compra`);

      // ─────────────────────────────────────────────────────────────────────
      // RESERVAS FUTURAS
      // ─────────────────────────────────────────────────────────────────────
      for (let i = 0; i < CONFIG.RESERVAS_FUTURAS; i++) {
        const cliente = faker.helpers.arrayElement(allClientes);
        const mesa = faker.helpers.arrayElement(todasMesas);
        const fechaReserva = faker.date.soon({ days: 30 });

        await prisma.reserva.create({
          data: {
            mesaId: mesa.id,
            clienteId: cliente?.id,
            nombreContacto: `${faker.person.firstName()} ${faker.person.lastName()}`,
            telefonoContacto: faker.phone.number(),
            emailContacto: faker.internet.email(),
            comensales: faker.number.int({ min: 2, max: 8 }),
            fecha: fechaReserva,
            hora: fechaReserva,
            estado: 'confirmada',
            notas: Math.random() > 0.7 ? faker.lorem.sentence() : undefined,
          },
        });
      }
      console.log(`  │  ✅ ${CONFIG.RESERVAS_FUTURAS} reservas futuras`);

      // ─────────────────────────────────────────────────────────────────────
      // PROGRAMA DE FIDELIZACIÓN
      // ─────────────────────────────────────────────────────────────────────
      const programaFidelizacion = await prisma.programaFidelizacion.create({
        data: {
          establecimientoId: estab.id,
          puntosPorEuro: 10, // 10 puntos por euro
          umbralPlata: 500,
          umbralOro: 1500,
          revisionAnual: false,
          activo: true,
        },
      });
      console.log(`  │  ✅ Programa de fidelización configurado\n`);
      
      console.log(`  └─ ✅ Establecimiento completado\n`);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 🎉 RESUMEN FINAL
  // ══════════════════════════════════════════════════════════════════════════
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('\n' + '═'.repeat(80));
  console.log('🎉 SEED MASIVO COMPLETADO');
  console.log('═'.repeat(80));
  console.log(`\n⏱️  Tiempo total: ${totalTime}s\n`);
  
  console.log('📊 Resumen de datos generados:\n');
  
  const counts = {
    tenants: await prisma.tenant.count(),
    establecimientos: await prisma.establecimiento.count(),
    empleados: await prisma.empleado.count(),
    clientes: await prisma.cliente.count(),
    zonas: await prisma.zona.count(),
    mesas: await prisma.mesa.count(),
    productos: await prisma.producto.count(),
    categorias: await prisma.categoriaProducto.count(),
    ingredientes: await prisma.ingrediente.count(),
    proveedores: await prisma.proveedor.count(),
    servicios: await prisma.servicio.count(),
    tickets: await prisma.ticket.count(),
    turnos: await prisma.turnoCaja.count(),
    facturasCompra: await prisma.facturaCompra.count(),
    reservas: await prisma.reserva.count(),
  };

  console.log(`   🏢 Tenants: ${counts.tenants}`);
  console.log(`   🏪 Establecimientos: ${counts.establecimientos}`);
  console.log(`   👥 Empleados: ${counts.empleados}`);
  console.log(`   🧑 Clientes: ${counts.clientes}`);
  console.log(`   🪑 Zonas: ${counts.zonas}`);
  console.log(`   🍽️  Mesas: ${counts.mesas}`);
  console.log(`   🍕 Productos: ${counts.productos}`);
  console.log(`   📂 Categorías: ${counts.categorias}`);
  console.log(`   🥬 Ingredientes: ${counts.ingredientes}`);
  console.log(`   📦 Proveedores: ${counts.proveedores}`);
  console.log(`   🎫 Servicios (ventas): ${counts.servicios}`);
  console.log(`   🧾 Tickets: ${counts.tickets}`);
  console.log(`   💰 Turnos de caja: ${counts.turnos}`);
  console.log(`   📄 Facturas de compra: ${counts.facturasCompra}`);
  console.log(`   📅 Reservas: ${counts.reservas}`);

  // Mostrar primer establecimiento
  const primerEstab = await prisma.establecimiento.findFirst({
    orderBy: { createdAt: 'asc' },
  });

  if (primerEstab) {
    console.log(`\n📍 Primer establecimiento para usar:`);
    console.log(`   Nombre: "${primerEstab.nombre}"`);
    console.log(`   ID: ${primerEstab.id}`);
    console.log(`\n💡 Guarda este ID para usarlo en tus peticiones API\n`);
  }

  console.log('═'.repeat(80) + '\n');
}

// ════════════════════════════════════════════════════════════════════════════
// 🚀 EJECUTAR
// ════════════════════════════════════════════════════════════════════════════

main()
  .catch((e) => {
    console.error('\n❌ Error en seed masivo:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
