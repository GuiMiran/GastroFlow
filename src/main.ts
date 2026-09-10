import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors();
  app.setGlobalPrefix('api/v1');

  // ── Swagger / OpenAPI ────────────────────────────────────────────────────────
  const config = new DocumentBuilder()
    .setTitle('GastroFlow API')
    .setDescription(
      'API REST del SaaS de gestión integral para hostelería.\n\n' +
      '**Módulos**: M0 Platform · M1 TPV · M2 ERP · M3 Contabilidad\n\n' +
      'Autenticación: `POST /api/v1/auth/pin` o `POST /api/v1/auth/login` → Bearer token',
    )
    .setVersion('0.1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'JWT',
    )
    .addTag('Auth', 'Autenticación PIN y email/password (M0-PLATFORM)')
    .addTag('Empleados', 'Gestión de empleados y roles (M0-PLATFORM)')
    .addTag('Mesas', 'Mapa de sala y ciclo de vida de mesas (M1-TPV)')
    .addTag('Comandas', 'Tomar, modificar y anular comandas (M1-TPV)')
    .addTag('Cobros', 'Cobro, tickets y facturas emitidas (M1-TPV)')
    .addTag('KDS', 'Pantalla cocina/barra – Server-Sent Events (M1-TPV)')
    .addTag('Caja', 'Arqueo y cierre de caja (M1-TPV)')
    .addTag('Catálogo', 'Productos, categorías e ingredientes (M2-ERP)')
    .addTag('Compras', 'Proveedores, pedidos, albaranes y facturas (M2-ERP)')
    .addTag('Inventario', 'Stock, alertas y conteo manual (M2-ERP)')
    .addTag('RRHH', 'Empleados, nóminas y fichajes (M2-ERP)')
    .addTag('Contabilidad', 'Asientos contables y balance (M3)')
    .addTag('Fiscal', 'Modelos tributarios y libro IVA (M3)')
    .addTag('VeriFactu', 'Cadena hash RD 1007/2023 (M3)')
    .addTag('Setup', 'Datos iniciales del establecimiento')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,       // mantiene el token al recargar
      tryItOutEnabled: true,            // botón "Try it out" activado por defecto
      defaultModelsExpandDepth: 1,
    },
    customSiteTitle: 'GastroFlow API Docs',
  });
  // ────────────────────────────────────────────────────────────────────────────

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`GastroFlow running on port ${port}`);
  console.log(`Swagger docs → http://localhost:${port}/docs`);
}
bootstrap();
