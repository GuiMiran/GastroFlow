# DT-12 — Autenticación, Autorización y Seguridad

> Parte de la [documentación técnica](_index.md).  
> **Lee este documento ANTES de** implementar nuevos endpoints protegidos, añadir roles o modificar la lógica de autenticación.  
> Última actualización: 8 abril 2026

---

## Visión general

GastroFlow implementa un sistema de **autenticación dual**:
1. **PIN de 4 dígitos** (sala/TPV) → Rápido, táctil, sin teclado
2. **Email + password** (backoffice) → Seguro, para gestión y administración

Ambos métodos generan un **JWT (JSON Web Token)** que autoriza llamadas posteriores a la API.

**Estado actual**: ✅ Implementado (HU-M0-ROL-001, HU-M0-ROL-002)  
**Documentación completa de variables**: [DT-11](DT-11-variables-entorno.md)

---

## Arquitectura de autenticación

```
┌────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                        │
│                                                            │
│  1. Usuario ingresa PIN o email/password                  │
│  2. POST /api/v1/auth/login-pin o /login                  │
│                            │                               │
└────────────────────────────┼────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────────┐
│                    BACKEND (NestJS)                        │
│                                                            │
│  ┌───────────────┐                                        │
│  │ AuthController│                                        │
│  └───────┬───────┘                                        │
│          │                                                 │
│          ▼                                                 │
│  ┌───────────────┐     1. Buscar empleado activo         │
│  │  AuthService  │────►2. Verificar hash (bcrypt)        │
│  └───────┬───────┘     3. Generar JWT con payload        │
│          │                                                 │
│          ▼                                                 │
│  ┌───────────────┐                                        │
│  │   JwtModule   │ (global, secret, expiresIn)           │
│  └───────────────┘                                        │
└──────────────────────────┬─────────────────────────────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │ Response: JWT + datos  │
              └────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│           LLAMADAS POSTERIORES (con JWT)                   │
│                                                            │
│  Frontend → Header: Authorization: Bearer <JWT>           │
│                            │                               │
│                            ▼                               │
│  Backend → @UseGuards(JwtAuthGuard)                       │
│          → Decodifica y valida JWT                        │
│          → Extrae payload: { sub, rol, establecimientoId }│
│          → Request.user = payload                         │
│          → Endpoint ejecuta lógica                        │
└────────────────────────────────────────────────────────────┘
```

---

## Flujos de autenticación

### Flujo 1: Login por PIN (HU-M0-ROL-001)

**Casos de uso**: Camarero, cocinero, barman en sala usando terminal táctil.

```
┌────────────┐                  ┌──────────────┐
│  Frontend  │                  │   Backend    │
└─────┬──────┘                  └──────┬───────┘
      │                                │
      │ POST /auth/login-pin           │
      │ { establecimientoId, pin }     │
      │───────────────────────────────>│
      │                                │
      │                                │ 1. Buscar empleados activos
      │                                │    con pinHash != null
      │                                │ 2. Para cada uno:
      │                                │    bcrypt.compare(pin, hash)
      │                                │ 3. Si match:
      │                                │    - payload = { sub, rol, nombre }
      │                                │    - JWT = sign(payload, secret)
      │                                │
      │ 200 + { accessToken, ... }     │
      │<───────────────────────────────│
      │                                │
      │ Guardar token en localStorage  │
      │ Redirigir a /sala              │
      │                                │
```

**Payload del JWT**:
```json
{
  "sub": "empleado-uuid",           // Subject: ID del empleado
  "establecimientoId": "uuid",      // Establecimiento al que pertenece
  "rol": "CAMARERO",                // Rol del empleado
  "nombre": "Ana Martínez",         // Nombre para UI
  "iat": 1712563200,                // Issued At (timestamp)
  "exp": 166344000                 // Expiration (timestamp + 24h)
}
```

**Seguridad**:
- PIN hasheado con bcrypt (cost 10)
- Bloqueo temporal tras 3 intentos fallidos (60 segundos)
- Solo empleados `activo: true` pueden autenticarse
- JWT expira en 24h por defecto (configurable con `JWT_EXPIRES_IN`)

---

### Flujo 2: Login por email/password (HU-M0-ROL-002)

**Casos de uso**: Gerente, propietario, contable desde PC de oficina.

```
┌────────────┐                  ┌──────────────┐
│  Frontend  │                  │   Backend    │
└─────┬──────┘                  └──────┬───────┘
      │                                │
      │ POST /auth/login               │
      │ { emailLogin, password }       │
      │───────────────────────────────>│
      │                                │
      │                                │ 1. Buscar empleado por emailLogin
      │                                │ 2. Validar:
      │                                │    - empleado existe
      │                                │    - activo: true
      │                                │    - passwordHash != null
      │                                │ 3. bcrypt.compare(pass, hash)
      │                                │ 4. Si OK:
      │                                │    - JWT = sign(payload, secret)
      │                                │
      │ 200 + { accessToken, ... }     │
      │<───────────────────────────────│
      │                                │
      │ Guardar token en localStorage  │
      │ Redirigir a /dashboard         │
      │                                │
```

**Requisitos de contraseña** (AC-02 HU-M0-ROL-002):
- Mínimo 8 caracteres
- Validación adicional recomendada:
  - Al menos 1 mayúscula
  - Al menos 1 número
  - Al menos 1 carácter especial

**Seguridad**:
- Password hasheado con bcrypt (cost 10-12)
- Bloqueo temporal tras 5 intentos fallidos (15 minutos)
- Email único por empleado (`emailLogin` con constraint UNIQUE)
- Implementar rotación de contraseña cada 90 días (futuro)

---

## Protección de endpoints

### Guards disponibles

#### `JwtAuthGuard`
Verifica que el JWT sea válido y no haya expirado.

**Uso**:
```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Controller('comandas')
export class ComandaController {
  @Post()
  @UseGuards(JwtAuthGuard)  // ← Requiere JWT válido
  tomarComanda(@Body() dto: TomarComandaDto) {
    // Request.user contiene el payload del JWT
  }
}
```

#### `RolesGuard`
Verifica que el usuario tenga uno de los roles requeridos.

**Uso**:
```typescript
import { UseGuards, SetMetadata } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

@Controller('caja')
@UseGuards(JwtAuthGuard, RolesGuard)  // ← Aplicar ambos guards
export class CajaController {
  
  @Post('turno/cerrar')
  @Roles('CAJERO', 'ADMIN')  // Solo CAJERO o ADMIN pueden cerrar turno
  cerrarTurno(@Body() dto: CerrarTurnoDto) {
    // ...
  }
}
```

---

## Roles y permisos (RBAC)

### Roles disponibles (enum `RolEmpleado`)

```typescript
enum RolEmpleado {
  ADMIN = 'ADMIN',         // Propietario, gerente con acceso total
  CAJERO = 'CAJERO',       // Manejo de caja, arqueos, retiradas
  CAMARERO = 'CAMARERO',   // Toma de comandas, servicio de sala
  COCINERO = 'COCINERO',   // KDS cocina, preparación platos
  BARMAN = 'BARMAN',       // KDS barra, preparación bebidas
  COMPRAS = 'COMPRAS',     // Gestión de proveedores, pedidos, inventario
  CONTABLE = 'CONTABLE',   // Acceso a contabilidad, informes fiscales
}
```

### Matriz de permisos

| Rol | Mesas | Comandas | Cobros | Caja | Productos | Inventario | Compras | Contabilidad | Empleados |
|-----|-------|----------|--------|------|-----------|------------|---------|--------------|-----------|
| **ADMIN** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **CAJERO** | 🔍 | 🔍 | ✅ | ✅ | 🔍 | ❌ | ❌ | ❌ | ❌ |
| **CAMARERO** | ✅ | ✅ | ✅ | ❌ | 🔍 | ❌ | ❌ | ❌ | ❌ |
| **COCINERO** | 🔍 | 🔍 (KDS) | ❌ | ❌ | 🔍 | ❌ | ❌ | ❌ | ❌ |
| **BARMAN** | 🔍 | 🔍 (KDS) | ❌ | ❌ | 🔍 | ❌ | ❌ | ❌ | ❌ |
| **COMPRAS** | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **CONTABLE** | ❌ | 🔍 | 🔍 | 🔍 | 🔍 | 🔍 | 🔍 | ✅ | ❌ |

**Leyenda**:
- ✅ = Lectura + Escritura (CRUD completo)
- 🔍 = Solo lectura (consulta, no modificación)
- ❌ = Sin acceso (401 Unauthorized)

### Implementación en endpoints

```typescript
@Post('comandas/:id/anular')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'CAMARERO')  // Solo ADMIN o CAMARERO pueden anular
anularLinea(@Param('id') id: string, @Body() dto: AnularLineaDto) {
  // AC-06 HU-M1-CMD-006: ADMIN puede anular sin restricción
  // CAMARERO solo puede anular sus propias comandas (validar en service)
}
```

---

## Seguridad adicional

### 1. **Rate Limiting** (implementación futura)

**Objetivo**: Prevenir ataques de fuerza bruta.

**Límites recomendados**:
- `/auth/login-pin`: 5 intentos/minuto por IP
- `/auth/login`: 3 intentos/minuto por IP
- Endpoints públicos: 10 req/minuto por IP
- Endpoints autenticados: 100 req/minuto por usuario

**Implementación con `@nestjs/throttler`**:
```typescript
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([{
      ttl: 60000,  // 60 segundos
      limit: 10,   // máximo 10 requests
    }]),
  ],
})
export class AppModule {}
```

**Uso en endpoints**:
```typescript
import { Throttle } from '@nestjs/throttler';

@Post('login-pin')
@Throttle({ default: { limit: 5, ttl: 60000 } })  // 5 intentos/minuto
loginPin(@Body() dto: LoginPinDto) { /*...*/ }
```

---

### 2. **HTTPS Obligatorio en producción**

**Configuración en Nginx** (recomendado):
```nginx
server {
    listen 443 ssl http2;
    server_name api.gastroflow.es;

    ssl_certificate /etc/letsencrypt/live/gastroflow.es/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gastroflow.es/privkey.pem;

    # Redirigir HTTP a HTTPS
    if ($scheme != "https") {
        return 301 https://$host$request_uri;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

### 3. **Helmet (HTTP Headers)**

**Instalación**:
```bash
npm install helmet
```

**Configuración en `main.ts`**:
```typescript
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,  // 1 año
      includeSubDomains: true,
      preload: true,
    },
  }));
  
  await app.listen(3000);
}
```

---

### 4. **CORS Restrictivo**

**Desarrollo** (permisivo):
```typescript
app.enableCors({
  origin: 'http://localhost:5173',
  credentials: true,
});
```

**Producción** (restrictivo):
```typescript
app.enableCors({
  origin: process.env.CORS_ORIGIN?.split(',') || false,  // Solo dominios autorizados
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});
```

**Variable de entorno** (ver [DT-11](DT-11-variables-entorno.md)):
```bash
CORS_ORIGIN=https://app.gastroflow.es,https://admin.gastroflow.es
```

---

### 5. **Validación de Inputs (class-validator)**

**Ya implementado globalmente** en `main.ts`:
```typescript
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,             // Remueve propiedades no definidas en DTO
    forbidNonWhitelisted: true,  // Lanza error si hay propiedades extra
    transform: true,             // Transforma tipos automáticamente
  }),
);
```

**Ejemplo de DTO**:
```typescript
import { IsString, IsUUID, Length } from 'class-validator';

export class LoginPinDto {
  @IsUUID()
  establecimientoId!: string;

  @IsString()
  @Length(4, 4)
  pin!: string;
}
```

---

### 6. **SQL Injection** (protección automática con Prisma)

✅ **Prisma ORM protege automáticamente** contra SQL injection usando prepared statements.

**Ejemplo seguro**:
```typescript
const empleado = await prisma.empleado.findUnique({
  where: { emailLogin: email },  // ← Prisma escapa automáticamente
});
```

**❌ NO hacer** (query crudo sin escapar):
```typescript
// PELIGROSO - nunca usar:
await prisma.$queryRawUnsafe(`SELECT * FROM empleados WHERE email = '${email}'`);
```

**✅ Alternativa segura** (tagged template):
```typescript
await prisma.$queryRaw`SELECT * FROM empleados WHERE email = ${email}`;  // Escaped
```

---

## Mejoras futuras (Roadmap)

### **Prioridad ALTA** (antes de producción pública)

#### 1. Refresh Tokens
**Problema actual**: JWT de 24h. Si es comprometido, es válido hasta expirar.  
**Solución**: Implementar refresh tokens de vida larga + access tokens cortos (1h).

**Flujo propuesto**:
```
1. Login → { accessToken (1h), refreshToken (7d) }
2. Frontend guarda refreshToken en HttpOnly cookie
3. Al expirar accessToken:
   - POST /auth/refresh con refreshToken
   - Backend valida y emite nuevo accessToken
4. Si refreshToken expira o es revocado → logout forzoso
```

**Tabla adicional en Prisma**:
```prisma
model RefreshToken {
  id           String   @id @default(uuid())
  empleadoId   String
  token        String   @unique
  expiresAt    DateTime
  createdAt    DateTime @default(now())
  revoked      Boolean  @default(false)
  empleado     Empleado @relation(fields: [empleadoId], references: [id])
}
```

---

#### 2. Logout y Revocación de Tokens
**Problema actual**: No hay endpoint `/auth/logout`. JWT sigue válido hasta expirar.  
**Solución**:
- Endpoint `POST /auth/logout` que revoca refresh token
- Opcionalmente, mantener blacklist de accessTokens revocados (Redis)

**Implementación con Redis**:
```typescript
@Post('logout')
@UseGuards(JwtAuthGuard)
async logout(@Req() req) {
  const jti = req.user.jti;  // JWT ID (añadir al payload)
  const expiresIn = req.user.exp - Math.floor(Date.now() / 1000);
  await redis.setex(`blacklist:${jti}`, expiresIn, '1');
  return { message: 'Logout exitoso' };
}
```

---

#### 3. Autenticación Multifactor (MFA/2FA)
**Estado**: No implementado.  
**Justificación**: Roles ADMIN y CONTABLE manejan datos sensibles.

**Opciones**:
- **TOTP** (Google Authenticator, Authy): Código de 6 dígitos cada 30s
- **SMS**: Código enviado por SMS (requiere integración con Twilio/Nexmo)
- **Email**: Código enviado por correo (más simple, menos seguro)

**Flujo TOTP**:
```
1. Usuario activa 2FA en perfil
2. Backend genera secreto TOTP y QR code
3. Usuario escanea QR con app de autenticación
4. Login requiere: email/pass + TOTP
```

**Librerías recomendadas**:
- `otplib` — Generación y validación de TOTP
- `qrcode` — Generación de QR codes

---

### **Prioridad MEDIA**

#### 4. Auditoría de accesos
**Objetivo**: Registrar todos los logins, logouts y acciones críticas.

**Tabla sugerida**:
```prisma
model AuditLogin {
  id           String   @id @default(uuid())
  empleadoId   String?
  metodo       String   // "PIN" | "PASSWORD"
  exito        Boolean
  ip           String
  userAgent    String?
  timestamp    DateTime @default(now())
}
```

**Uso**: POST /auth/login-pin → guardar registro en `AuditLogin`

---

#### 5. Políticas de contraseña
**Implementar validaciones**:
- Mínimo 1 mayúscula, 1 número, 1 símbolo
- No permitir contraseñas comunes (base de datos de 10k contraseñas débiles)
- Historial de últimas 5 contraseñas (no reutilizar)
- Forzar cambio cada 90 días

**Librería recomendada**: `zxcvbn` (password strength estimator)

---

#### 6. Session Management
**Implementar**:
- Límite de sesiones concurrentes (ej: máximo 3 dispositivos por usuario)
- Endpoint `GET /auth/sessions` — lista dispositivos activos
- Endpoint `DELETE /auth/sessions/:id` — revocar sesión específica

---

### **Prioridad BAJA**

#### 7. OAuth 2.0 / OpenID Connect
**Para integraciones con**: Google Workspace, Microsoft 365, Apple Sign-In.

**Librería recomendada**: `@nestjs/passport` con estrategias OAuth2.

---

#### 8. Biometría (futuro lejano)
**Para terminales móviles (tablet/smartphone)**:
- Touch ID / Face ID para re-autenticación rápida
- Requiere app nativa (React Native o Flutter)

---

## Troubleshooting

### Error: `401 Unauthorized` en todas las peticiones
**Causa**: JWT inválido o falta header `Authorization`.  
**Solución**:
1. Verificar que el frontend envía: `Authorization: Bearer <token>`
2. Verificar que el token no haya expirado (decodificar en jwt.io)
3. Verificar que `JWT_SECRET` es el mismo en frontend y backend

### Error: `JWT secret or public key must be provided`
**Causa**: Variable `JWT_SECRET` no está definida.  
**Solución**: Configurar en `.env` (ver [DT-11](DT-11-variables-entorno.md)).

### PIN funciona en local pero no en Docker
**Causa**: Base de datos diferente (local vs Docker).  
**Solución**: Ejecutar seed en contenedor Docker:
```bash
docker compose exec backend npx tsx prisma/seed.ts
```

### Error: `RolesGuard` no funciona (siempre rechaza)
**Causa**: Guard de roles requiere que `JwtAuthGuard` vaya primero.  
**Solución**:
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)  // ← Orden correcto
@Roles('ADMIN')
```

---

## Checklist de seguridad (pre-producción)

- [ ] `JWT_SECRET` criptográficamente seguro (64+ chars)
- [ ] JWT expira en tiempo razonable (≤ 24h)
- [ ] HTTPS habilitado con certificado válido
- [ ] CORS configurado con dominios específicos (no `*`)
- [ ] Helmet instalado con CSP configurado
- [ ] Rate limiting en endpoints de autenticación
- [ ] Passwords hasheados con bcrypt (cost ≥ 10)
- [ ] Validación de inputs con `class-validator`
- [ ] Logs de autenticación habilitados
- [ ] Bloqueo temporal tras intentos fallidos
- [ ] Refresh tokens implementados (recomendado)
- [ ] MFA habilitado para roles ADMIN/CONTABLE (recomendado)
- [ ] Variables sensibles en gestor de secretos (no en `.env`)

---

**Última actualización**: 8 abril 2026  
**Mantenedor**: Equipo GastroFlow  
**Revisión**: Cualquier cambio en auth debe actualizarse aquí
