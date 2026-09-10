# DT-11 — Variables de Entorno y Configuración

> Parte de la [documentación técnica](_index.md).  
> **Lee este documento ANTES de** desplegar en staging/producción o configurar un nuevo entorno.  
> Última actualización: 8 abril 2026

---

## Visión general

GastroFlow se configura mediante **variables de entorno**. Este documento lista todas las variables disponibles, su propósito, valores por defecto y requisitos de seguridad.

**Archivo de configuración**: `.env` en la raíz del proyecto (backend) y `frontend/.env` (frontend).

> ⚠️ **NUNCA commitear archivos `.env` a Git**. El archivo `.env.example` sirve como plantilla.

---

## Variables Backend (NestJS)

### **Base de Datos**

#### `DATABASE_URL` (OBLIGATORIA)
**Descripción**: URL de conexión completa a PostgreSQL.  
**Formato**: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA`  
**Ejemplo desarrollo**:
```
DATABASE_URL="postgresql://gastroflow:gastroflow@localhost:5432/gastroflow?schema=public"
```
**Ejemplo producción**:
```
DATABASE_URL="postgresql://user_prod:STRONG_PASSWORD@db.example.com:5432/gastroflow_prod?schema=public&sslmode=require"
```
**Notas**:
- En Prisma 7.5, esta URL va en `prisma.config.ts`, no en `schema.prisma`.
- En producción, usar siempre `sslmode=require` para conexiones seguras.
- Considerar usar connection pooling con PgBouncer para alta concurrencia.

---

### **Servidor**

#### `PORT`
**Descripción**: Puerto en el que escucha el servidor NestJS.  
**Valor por defecto**: `3000`  
**Ejemplo**: `PORT=3000`  
**Notas**: En producción con Docker, usar siempre 3000 internamente y mapear externamente (e.g., `80:3000`).

#### `NODE_ENV`
**Descripción**: Entorno de ejecución.  
**Valores permitidos**: `development` | `staging` | `production` | `test`  
**Valor por defecto**: `development`  
**Ejemplo**: `NODE_ENV=production`  
**Impacto**:
- `production`: Desactiva logs de debug, habilita optimizaciones.
- `development`: Habilita recarga en caliente, logs verbosos.
- `test`: Configuración para entorno de testing (mocks, BD en memoria).

---

### **Autenticación y Seguridad**

#### `JWT_SECRET` (OBLIGATORIA en producción)
**Descripción**: Clave secreta para firmar tokens JWT.  
**Valor por defecto (dev)**: `gastroflow-dev-secret-change-in-prod`  
**Ejemplo producción**: `JWT_SECRET=8f3a7b9e2c...` (64+ caracteres aleatorios)  
**Seguridad**:
- ⚠️ **CRÍTICO**: Debe ser una cadena criptográficamente segura de al menos 64 caracteres.
- Generar con: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
- Almacenar en gestor de secretos (AWS Secrets Manager, Azure Key Vault, HashiCorp Vault).
- Rotar cada 90 días en producción.

#### `JWT_EXPIRES_IN`
**Descripción**: Tiempo de expiración de los tokens JWT.  
**Valor por defecto**: `24h`  
**Formato**: `<número><unidad>` donde unidad = `s` | `m` | `h` | `d` | `w` | `y`  
**Ejemplos**:
- `JWT_EXPIRES_IN=1h` — Token válido 1 hora
- `JWT_EXPIRES_IN=7d` — Token válido 7 días
- `JWT_EXPIRES_IN=15m` — Token válido 15 minutos (alta seguridad)

**Recomendación**:
- **TPV web interno**: `12h` a `24h` (los usuarios permanecen en el local)
- **API pública**: `1h` con refresh token
- **Admin panel**: `4h` con re-autenticación periódica

#### `BCRYPT_ROUNDS`
**Descripción**: Número de rondas para hashing de contraseñas con bcrypt.  
**Valor por defecto**: `10`  
**Rango recomendado**: `10` a `12`  
**Ejemplo**: `BCRYPT_ROUNDS=12`  
**Notas**:
- Más rondas = más seguro pero más lento.
- Valor 10 es suficiente para 2026 según OWASP.
- Aumentar a 12 si se procesan >1000 logins/seg.

---

### **CORS (Cross-Origin Resource Sharing)**

#### `CORS_ORIGIN`
**Descripción**: Orígenes permitidos para peticiones CORS.  
**Valor por defecto**: `*` (cualquier origen — solo desarrollo)  
**Ejemplo desarrollo**:
```
CORS_ORIGIN=http://localhost:5173
```
**Ejemplo producción**:
```
CORS_ORIGIN=https://app.gastroflow.example.com,https://admin.gastroflow.example.com
```
**Notas**:
- En producción, **NUNCA usar `*`**. Especificar dominios exactos.
- Separar múltiples orígenes con comas (sin espacios).
- Incluir subdominios completos (ej: `www.` y sin `www.`).

#### `CORS_CREDENTIALS`
**Descripción**: Permitir envío de cookies en peticiones CORS.  
**Valor por defecto**: `false`  
**Ejemplo**: `CORS_CREDENTIALS=true`  
**Notas**: Activar solo si se usan cookies para sesiones. Requiere `CORS_ORIGIN` específico (no `*`).

---

### **Logging y Monitoreo**

#### `LOG_LEVEL`
**Descripción**: Nivel mínimo de logs a mostrar.  
**Valores permitidos**: `error` | `warn` | `log` | `debug` | `verbose`  
**Valor por defecto**: `log`  
**Recomendaciones por entorno**:
- **Desarrollo**: `debug` o `verbose`
- **Staging**: `log`
- **Producción**: `warn` o `error`

#### `LOG_FORMAT`
**Descripción**: Formato de salida de logs.  
**Valores permitidos**: `json` | `text`  
**Valor por defecto**: `text`  
**Ejemplo**: `LOG_FORMAT=json`  
**Notas**: Usar `json` en producción para integrar con Elasticsearch, CloudWatch, Datadog.

#### `SENTRY_DSN`
**Descripción**: Data Source Name de Sentry para tracking de errores.  
**Valor por defecto**: (vacío, desactivado)  
**Ejemplo**: `SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/789012`  
**Estado**: **Reservado para implementación futura**.

---

### **Rate Limiting**

#### `RATE_LIMIT_TTL`
**Descripción**: Ventana de tiempo para rate limiting (en segundos).  
**Valor por defecto**: `60` (1 minuto)  
**Ejemplo**: `RATE_LIMIT_TTL=60`  
**Estado**: **Reservado para implementación futura**.

#### `RATE_LIMIT_MAX`
**Descripción**: Número máximo de requests permitidos en la ventana de tiempo.  
**Valor por defecto**: `100`  
**Ejemplo**: `RATE_LIMIT_MAX=100`  
**Recomendaciones**:
- **Endpoints públicos**: 10 req/min
- **Endpoints autenticados**: 100 req/min
- **Webhooks**: 1000 req/min

---

### **Integraciones Externas**

#### `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`
**Descripción**: Configuración de servidor SMTP para envío de emails.  
**Estado**: **Reservado para implementación futura** (notificaciones, facturas por email).  
**Ejemplo**:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@gastroflow.example.com
SMTP_PASSWORD=app-specific-password
SMTP_FROM=GastroFlow <noreply@gastroflow.example.com>
```

#### `SMS_PROVIDER`, `SMS_API_KEY`
**Descripción**: Proveedor de SMS (Twilio, Nexmo, etc.) para notificaciones.  
**Estado**: **Reservado para implementación futura** (reservas, recordatorios).  
**Ejemplo**:
```
SMS_PROVIDER=twilio
SMS_API_KEY=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
SMS_API_SECRET=your_auth_token
SMS_FROM=+34123456789
```

#### `PAYMENT_GATEWAY_PROVIDER`
**Descripción**: Pasarela de pago integrada (Stripe, Redsys, etc.).  
**Estado**: **Reservado para implementación futura** (cobros con tarjeta online).  
**Valores posibles**: `stripe` | `redsys` | `paypal` | `none`  
**Ejemplo**:
```
PAYMENT_GATEWAY_PROVIDER=stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### `STORAGE_PROVIDER`
**Descripción**: Proveedor de almacenamiento de archivos (facturas PDF, imágenes).  
**Estado**: **Reservado para implementación futura**.  
**Valores posibles**: `local` | `s3` | `azure-blob` | `gcs`  
**Ejemplo S3**:
```
STORAGE_PROVIDER=s3
AWS_REGION=eu-west-1
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_S3_BUCKET=gastroflow-documents-prod
```

---

### **Features Flags**

#### `ENABLE_SWAGGER`
**Descripción**: Activar documentación Swagger en `/api/docs`.  
**Valor por defecto**: `true` (desarrollo), `false` (producción recomendado)  
**Ejemplo**: `ENABLE_SWAGGER=false`  
**Seguridad**: Desactivar en producción pública. Activar solo en VPN interna.

#### `ENABLE_VERIFACTU`
**Descripción**: Activar cadena hash VeriFactu (RD 1007/2023).  
**Valor por defecto**: `true`  
**Ejemplo**: `ENABLE_VERIFACTU=true`  
**Notas**: Obligatorio en España desde julio 2025. No desactivar en producción.

#### `ENABLE_SEED_ON_START`
**Descripción**: Ejecutar seed de datos demo al arrancar.  
**Valor por defecto**: `false`  
**Ejemplo**: `ENABLE_SEED_ON_START=true`  
**Uso**: Solo para entornos de desarrollo/demo. **NUNCA en producción**.

---

## Variables Frontend (Vite + React)

> **Nota**: Vite expone solo variables con prefijo `VITE_`.

#### `VITE_API_BASE_URL`
**Descripción**: URL base del backend API.  
**Valor por defecto**: `http://localhost:3000/api/v1`  
**Ejemplo producción**: `VITE_API_BASE_URL=https://api.gastroflow.example.com/api/v1`  
**Ubicación**: `frontend/.env`

#### `VITE_WS_URL`
**Descripción**: URL de WebSocket para eventos en tiempo real (KDS).  
**Valor por defecto**: `ws://localhost:3000`  
**Ejemplo producción**: `VITE_WS_URL=wss://api.gastroflow.example.com`  
**Estado**: **Reservado para implementación futura**.

#### `VITE_SENTRY_DSN`
**Descripción**: DSN de Sentry para tracking de errores frontend.  
**Ejemplo**: `VITE_SENTRY_DSN=https://xyz@o123.ingest.sentry.io/456`  
**Estado**: **Reservado para implementación futura**.

---

## Plantillas por entorno

### Desarrollo (`.env`)
```bash
# Base de datos
DATABASE_URL="postgresql://gastroflow:gastroflow@localhost:5432/gastroflow?schema=public"

# Servidor
NODE_ENV=development
PORT=3000

# Auth (dev - NO usar en producción)
JWT_SECRET=gastroflow-dev-secret-change-in-prod
JWT_EXPIRES_IN=24h

# CORS
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=debug
LOG_FORMAT=text

# Features
ENABLE_SWAGGER=true
ENABLE_VERIFACTU=true
```

### Staging (`.env.staging`)
```bash
# Base de datos
DATABASE_URL="postgresql://user_staging:PASSWORD@db-staging.internal:5432/gastroflow_staging?schema=public&sslmode=require"

# Servidor
NODE_ENV=staging
PORT=3000

# Auth
JWT_SECRET=<GENERAR_CON_CRYPTO>
JWT_EXPIRES_IN=12h

# CORS
CORS_ORIGIN=https://staging.gastroflow.example.com

# Logging
LOG_LEVEL=log
LOG_FORMAT=json

# Monitoring (si aplica)
# SENTRY_DSN=https://...ingest.sentry.io/...

# Features
ENABLE_SWAGGER=true
ENABLE_VERIFACTU=true
```

### Producción (`.env.production`)
```bash
# Base de datos
DATABASE_URL="postgresql://user_prod:STRONG_PASSWORD@db-prod.internal:5432/gastroflow_prod?schema=public&sslmode=require&pgbouncer=true"

# Servidor
NODE_ENV=production
PORT=3000

# Auth (OBLIGATORIO generar nuevo secreto)
JWT_SECRET=<GENERAR_64_CHARS_CRYPTO>
JWT_EXPIRES_IN=12h
BCRYPT_ROUNDS=12

# CORS (dominios exactos)
CORS_ORIGIN=https://app.gastroflow.es,https://admin.gastroflow.es

# Logging
LOG_LEVEL=warn
LOG_FORMAT=json

# Monitoring
SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/789012

# Rate Limiting
RATE_LIMIT_TTL=60
RATE_LIMIT_MAX=100

# Features
ENABLE_SWAGGER=false  # ⚠️ Desactivar en producción pública
ENABLE_VERIFACTU=true
ENABLE_SEED_ON_START=false
```

---

## Gestión de secretos en producción

### ⚠️ **NUNCA** almacenar secretos en:
- Archivos `.env` commiteados a Git
- Variables hardcodeadas en código
- Documentación pública
- Logs

### ✅ **Usar gestores de secretos**:

| Proveedor Cloud | Servicio |
|-----------------|----------|
| AWS | AWS Secrets Manager + Parameter Store |
| Azure | Azure Key Vault |
| Google Cloud | Secret Manager |
| DigitalOcean | App Platform Environment Variables (encriptadas) |
| Kubernetes | Kubernetes Secrets + Sealed Secrets |
| Genérico | HashiCorp Vault, Doppler, Infisical |

### Ejemplo con AWS Secrets Manager:

```typescript
// src/config/secrets.ts
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

export async function getSecret(secretName: string): Promise<string> {
  const client = new SecretsManagerClient({ region: "eu-west-1" });
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );
  return response.SecretString!;
}

// Uso en main.ts
const jwtSecret = await getSecret("gastroflow/prod/jwt-secret");
```

---

## Validación de variables en runtime

### Implementación recomendada (futuro):

```typescript
// src/config/env.validation.ts
import { plainToClass } from 'class-transformer';
import { IsEnum, IsString, IsNumber, validateSync } from 'class-validator';

enum Environment {
  Development = 'development',
  Staging = 'staging',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsString()
  DATABASE_URL: string;

  @IsNumber()
  PORT: number = 3000;

  @IsString()
  JWT_SECRET: string;
}

export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToClass(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(`Config validation error: ${errors.toString()}`);
  }
  return validatedConfig;
}
```

**Integración en `app.module.ts`**:
```typescript
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      validate,  // ← Valida variables al arrancar
      isGlobal: true,
    }),
    // ...
  ],
})
export class AppModule {}
```

---

## Troubleshooting

### Error: `P1012: url is not an allowed argument in this Prisma version`
**Causa**: Tienes `url` en `prisma/schema.prisma`.  
**Solución**: Mover la URL a `prisma.config.ts` (ver [DT-08 RES-01](DT-08-decisiones-restricciones.md)).

### Error: `JWT_SECRET is not defined`
**Causa**: Variable `JWT_SECRET` no está en `.env` o no se cargó.  
**Solución**:
1. Verificar que `.env` existe y contiene `JWT_SECRET=...`
2. Asegurar que `import 'dotenv/config'` está en `src/main.ts` (primera línea)
3. En Docker, pasar la variable con `-e JWT_SECRET=...` o en `docker-compose.yml` bajo `environment:`

### Warning: `Using default JWT secret in production`
**Causa**: No sobrescribiste el secreto por defecto.  
**Solución**: Generar secreto fuerte y configurar en producción.

---

## Checklist pre-deploy

- [ ] Todas las variables **OBLIGATORIAS** están configuradas
- [ ] `JWT_SECRET` es único y criptográficamente seguro (64+ chars)
- [ ] `NODE_ENV=production`
- [ ] `CORS_ORIGIN` contiene **solo** los dominios necesarios (no `*`)
- [ ] `ENABLE_SWAGGER=false` en producción pública
- [ ] `DATABASE_URL` usa `sslmode=require`
- [ ] Secretos están en gestor de secretos (no en archivos)
- [ ] Variables sensibles no están en logs

---

**Última actualización**: 8 abril 2026  
**Mantenedor**: Equipo GastroFlow  
**Revisión**: Cada nueva variable debe documentarse aquí
