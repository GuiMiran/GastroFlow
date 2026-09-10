/**
 * M0-PLATFORM — AuthController
 * POST /auth/login-pin  — PIN rápido sala (HU-M0-ROL-001)
 * POST /auth/login      — Email/password backoffice (HU-M0-ROL-002)
 */
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';
import { IsString, Length, MinLength, IsEmail } from 'class-validator';
import { AuthService } from './auth.service';
import { LoginResponse } from './auth.types';

class LoginPinDto {
  @IsString()
  establecimientoId!: string;

  @IsString()
  @Length(4, 4)
  pin!: string;
}

class LoginPasswordDto {
  @IsEmail()
  emailLogin!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * HU-M0-ROL-001 — Login rápido de sala por PIN de 4 dígitos.
   * Utilizado por camareros, cocineros y barmans desde TPV.
   * No requiere conexión previa; sólo el PIN del empleado y el ID del local.
   */
  @Post('login-pin')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Login sala por PIN (HU-M0-ROL-001)',
    description:
      'Autentica un empleado de sala mediante su PIN de 4 dígitos. ' +
      'Devuelve un JWT válido para los endpoints de TPV. ' +
      'No se requiere contraseña; el PIN se almacena hasheado (bcrypt).',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['establecimientoId', 'pin'],
      properties: {
        establecimientoId: {
          type: 'string',
          format: 'uuid',
          example: 'e1f2g3h4-0000-0000-0000-000000000001',
          description: 'UUID del establecimiento al que pertenece el empleado',
        },
        pin: {
          type: 'string',
          minLength: 4,
          maxLength: 4,
          pattern: '^[0-9]{4}$',
          example: '1234',
          description: 'PIN numérico de 4 dígitos del empleado',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'JWT y datos del empleado autenticado' })
  @ApiUnauthorizedResponse({ description: 'PIN incorrecto o empleado inactivo' })
  @ApiBadRequestResponse({ description: 'Parámetros inválidos (PIN no numérico, etc.)' })
  loginPin(@Body() dto: LoginPinDto): Promise<LoginResponse> {
    return this.authService.loginPin(dto.establecimientoId, dto.pin);
  }

  /**
   * HU-M0-ROL-002 — Login de backoffice mediante email + contraseña.
   * Utilizado por propietarios, gerentes y administradores.
   */
  @Post('login')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Login backoffice por email/password (HU-M0-ROL-002)',
    description:
      'Autentica un empleado con acceso backoffice mediante email y contraseña. ' +
      'La contraseña mínima es de 8 caracteres y se almacena con bcrypt (cost 12). ' +
      'El JWT incluye el rol, establecimientoId y empleadoId en el payload.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['emailLogin', 'password'],
      properties: {
        emailLogin: {
          type: 'string',
          format: 'email',
          example: 'gerente@mirestaurante.com',
        },
        password: {
          type: 'string',
          minLength: 8,
          example: 'Sup3rS3cr3t!',
          description: 'Mínimo 8 caracteres',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'JWT y datos del empleado autenticado' })
  @ApiUnauthorizedResponse({ description: 'Credenciales incorrectas o cuenta inactiva' })
  @ApiBadRequestResponse({ description: 'Email inválido o contraseña demasiado corta' })
  loginPassword(@Body() dto: LoginPasswordDto): Promise<LoginResponse> {
    return this.authService.loginPassword(dto.emailLogin, dto.password);
  }
}
