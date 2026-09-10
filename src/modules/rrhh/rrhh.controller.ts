import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RrhhService } from './rrhh.service';

@ApiTags('RRHH')
@ApiBearerAuth('JWT')
/**
 * HU-M2-RRH-001: Empleados
 * HU-M2-RRH-002: Turnos
 * HU-M2-RRH-003: Fichajes
 */
@Controller('rrhh')
export class RrhhController {
  constructor(private readonly rrhhService: RrhhService) {}

  // ─── Empleados ───

  @Post('empleados')
  @ApiOperation({
    summary: 'Crear empleado laboral (HU-M2-RRH-001)',
    description:
      'Registra un empleado en el módulo RRHH/ERP (diferente al empleado de acceso M0). ' +
      'Contiene datos laborales: NIF, puesto, turnos. ' +
      'Para permisos de acceso al sistema, usar el endpoint de Empleados (M0).',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['establecimientoId', 'nombre', 'apellidos', 'nif', 'puesto'],
      properties: {
        establecimientoId: { type: 'string', format: 'uuid' },
        nombre: { type: 'string', example: 'Carlos' },
        apellidos: { type: 'string', example: 'Martínez López' },
        nif: { type: 'string', example: '87654321B' },
        email: { type: 'string', format: 'email' },
        telefono: { type: 'string', example: '666 000 000' },
        puesto: { type: 'string', example: 'Cocinero' },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Empleado laboral creado' })
  crearEmpleado(
    @Body()
    body: {
      establecimientoId: string;
      nombre: string;
      apellidos: string;
      nif: string;
      email?: string;
      telefono?: string;
      puesto: string;
    },
  ) {
    return this.rrhhService.crearEmpleado(body);
  }

  @Patch('empleados/:id')
  @ApiOperation({ summary: 'Actualizar datos laborales de empleado' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOkResponse({ description: 'Empleado actualizado' })
  @ApiNotFoundResponse({ description: 'Empleado no encontrado' })
  actualizarEmpleado(
    @Param('id') id: string,
    @Body()
    body: {
      nombre?: string;
      apellidos?: string;
      email?: string;
      telefono?: string;
      puesto?: string;
      activo?: boolean;
    },
  ) {
    return this.rrhhService.actualizarEmpleado(id, body);
  }

  @Get('empleados')
  @ApiOperation({ summary: 'Listar empleados laborales del establecimiento' })
  @ApiQuery({ name: 'establecimientoId', required: true })
  @ApiOkResponse({ description: 'Array de empleados activos con puesto' })
  listarEmpleados(@Query('establecimientoId') establecimientoId: string) {
    return this.rrhhService.listarEmpleados(establecimientoId);
  }

  @Get('empleados/:id')
  @ApiOperation({ summary: 'Obtener empleado laboral con historial de fichajes' })
  @ApiParam({ name: 'id', type: 'string' })
  @ApiOkResponse({ description: 'Empleado con turnos y fichajes recientes' })
  obtenerEmpleado(@Param('id') id: string) {
    return this.rrhhService.obtenerEmpleado(id);
  }

  // ─── Turnos ───

  @Post('turnos')
  @ApiOperation({
    summary: 'Asignar turno a empleado (HU-M2-RRH-002)',
    description:
      'Crea una asignación de turno para un día concreto. ' +
      'Invariante INV-040: el empleado no puede tener dos turnos solapados el mismo día.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['empleadoId', 'fecha', 'horaInicio', 'horaFin'],
      properties: {
        empleadoId: { type: 'string', format: 'uuid' },
        fecha: { type: 'string', format: 'date-time', example: '2026-03-20T00:00:00.000Z' },
        horaInicio: { type: 'string', format: 'date-time', example: '2026-03-20T09:00:00.000Z' },
        horaFin: { type: 'string', format: 'date-time', example: '2026-03-20T17:00:00.000Z' },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Turno asignado' })
  asignarTurno(
    @Body()
    body: {
      empleadoId: string;
      fecha: string;
      horaInicio: string;
      horaFin: string;
    },
  ) {
    return this.rrhhService.asignarTurno({
      empleadoId: body.empleadoId,
      fecha: new Date(body.fecha),
      horaInicio: new Date(body.horaInicio),
      horaFin: new Date(body.horaFin),
    });
  }

  @Get('cuadrante')
  @ApiOperation({
    summary: 'Obtener cuadrante de turnos por período',
    description: 'Devuelve el cuadrante semanal/mensual de todos los empleados para el rango de fechas indicado.',
  })
  @ApiQuery({ name: 'establecimientoId', required: true })
  @ApiQuery({ name: 'fechaInicio', required: true, description: 'ISO 8601 fecha inicio' })
  @ApiQuery({ name: 'fechaFin', required: true, description: 'ISO 8601 fecha fin' })
  @ApiOkResponse({ description: 'Cuadrante agrupado por empleado' })
  obtenerCuadrante(
    @Query('establecimientoId') establecimientoId: string,
    @Query('fechaInicio') fechaInicio: string,
    @Query('fechaFin') fechaFin: string,
  ) {
    return this.rrhhService.obtenerCuadrante({
      establecimientoId,
      fechaInicio: new Date(fechaInicio),
      fechaFin: new Date(fechaFin),
    });
  }

  // ─── Fichajes ───

  @Post('fichajes')
  @ApiOperation({
    summary: 'Registrar fichaje de entrada o salida (HU-M2-RRH-003)',
    description:
      'Registra un fichaje con timestamp automático. ' +
      'Alternancia obligatoria: entrada → salida → entrada... (INV-041). ' +
      'Cumplimiento RGPD: los datos de geolocalizar del fichaje son opcionales.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['empleadoId', 'tipo'],
      properties: {
        empleadoId: { type: 'string', format: 'uuid' },
        tipo: { type: 'string', enum: ['entrada', 'salida'], example: 'entrada' },
      },
    },
  })
  @ApiCreatedResponse({ description: 'Fichaje registrado con timestamp' })
  registrarFichaje(
    @Body() body: { empleadoId: string; tipo: 'entrada' | 'salida' },
  ) {
    return this.rrhhService.registrarFichaje(body);
  }

  @Get('fichajes')
  @ApiOperation({ summary: 'Listar fichajes de un empleado en un rango de fechas' })
  @ApiQuery({ name: 'empleadoId', required: true })
  @ApiQuery({ name: 'fechaInicio', required: false })
  @ApiQuery({ name: 'fechaFin', required: false })
  @ApiOkResponse({ description: 'Fichajes ordenados por timestamp asc' })
  listarFichajes(
    @Query('empleadoId') empleadoId: string,
    @Query('fechaInicio') fechaInicio?: string,
    @Query('fechaFin') fechaFin?: string,
  ) {
    return this.rrhhService.listarFichajes({
      empleadoId,
      fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
      fechaFin: fechaFin ? new Date(fechaFin) : undefined,
    });
  }
}
