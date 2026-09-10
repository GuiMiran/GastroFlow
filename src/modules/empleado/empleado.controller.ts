/**
 * M0-PLATFORM — EmpleadoController
 * CRUD de empleados con RBAC (HU-M0-ROL-003)
 * Solo ADMIN/GERENTE pueden gestionar empleados.
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { RolEmpleado, JwtPayload } from '../auth/auth.types';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiOperation,
  ApiParam,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  EmpleadoService,
  CrearEmpleadoDto,
  ActualizarEmpleadoDto,
} from './empleado.service';

interface AuthRequest extends Request {
  user: JwtPayload;
}

@ApiTags('Empleados')
@ApiBearerAuth('JWT')
@Controller('empleados')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmpleadoController {
  constructor(private readonly empleadoService: EmpleadoService) {}

  @Get()
  @Roles(RolEmpleado.ADMIN, RolEmpleado.GERENTE)
  @ApiOperation({
    summary: 'Listar empleados del establecimiento (HU-M0-ROL-003)',
    description:
      'Devuelve todos los empleados activos. Solo accesible para roles ADMIN y GERENTE. ' +
      'Incluye rol, puesto, email de acceso y estado activo.',
  })
  @ApiOkResponse({ description: 'Array de empleados con rol y estado' })
  @ApiForbiddenResponse({ description: 'Rol insuficiente (requiere ADMIN o GERENTE)' })
  listar(@Request() req: AuthRequest) {
    return this.empleadoService.listar(req.user.establecimientoId);
  }

  @Get(':id')
  @Roles(RolEmpleado.ADMIN, RolEmpleado.GERENTE)
  @ApiOperation({ summary: 'Obtener empleado por ID' })
  @ApiParam({ name: 'id', description: 'UUID del empleado', type: 'string' })
  @ApiOkResponse({ description: 'Datos completos del empleado' })
  @ApiNotFoundResponse({ description: 'Empleado no encontrado' })
  @ApiForbiddenResponse({ description: 'Rol insuficiente' })
  obtener(@Param('id') id: string) {
    return this.empleadoService.obtener(id);
  }

  @Post()
  @Roles(RolEmpleado.ADMIN, RolEmpleado.GERENTE)
  @ApiOperation({
    summary: 'Crear empleado con acceso al sistema (HU-M0-ROL-003)',
    description:
      'Crea un empleado con rol RBAC. ' +
      'Si se proporciona `pin` (4 dígitos numéricos), el empleado puede hacer login PIN en TPV. ' +
      'Si se proporciona `emailLogin` + `password` (min 8 chars), puede acceder al backoffice. ' +
      'Solo ADMIN puede crear otro ADMIN.',
  })
  @ApiCreatedResponse({ description: 'Empleado creado con auditlog' })
  @ApiForbiddenResponse({ description: 'Solo ADMIN puede crear ADMINs' })
  crear(@Body() dto: CrearEmpleadoDto, @Request() req: AuthRequest) {
    return this.empleadoService.crear(
      req.user.establecimientoId,
      dto,
      req.user.sub,
      req.user.rol,
    );
  }

  @Put(':id')
  @Roles(RolEmpleado.ADMIN, RolEmpleado.GERENTE)
  @ApiOperation({
    summary: 'Actualizar empleado',
    description:
      'Actualiza datos del empleado incluyendo rol, PIN o contraseña. ' +
      'La contraseña nueva se hashea con bcrypt automáticamente. ' +
      'Todos los cambios quedan en AuditLog.',
  })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOkResponse({ description: 'Empleado actualizado con auditlog' })
  @ApiNotFoundResponse({ description: 'Empleado no encontrado' })
  actualizar(
    @Param('id') id: string,
    @Body() dto: ActualizarEmpleadoDto,
    @Request() req: AuthRequest,
  ) {
    return this.empleadoService.actualizar(id, dto, req.user.sub, req.user.rol);
  }

  @Delete(':id')
  @Roles(RolEmpleado.ADMIN, RolEmpleado.GERENTE)
  @ApiOperation({
    summary: 'Dar de baja a un empleado (soft delete)',
    description:
      'Marca al empleado como inactivo (activo: false). No borra el registro. ' +
      'El empleado no podrá hacer login pero su historial se conserva para auditoría.',
  })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOkResponse({ description: 'Empleado dado de baja; auditlog registrado' })
  darDeBaja(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.empleadoService.darDeBaja(id, req.user.sub);
  }
}
