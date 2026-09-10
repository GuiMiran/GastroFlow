/**
 * M0-PLATFORM — Auth types
 * Roles, permisos y payloads JWT (HU-M0-ROL-001..004)
 */

export enum RolEmpleado {
  ADMIN = 'ADMIN',
  GERENTE = 'GERENTE',
  CAJERO = 'CAJERO',
  CAMARERO = 'CAMARERO',
  COCINERO = 'COCINERO',
  BARRA = 'BARRA',
  CONTABLE = 'CONTABLE',
}

/** Módulos contratables */
export enum Modulo {
  M1 = 'M1',
  M2 = 'M2',
  M3 = 'M3',
  M4 = 'M4',
}

/** Payload del JWT que viaja en cada request */
export interface JwtPayload {
  sub: string;           // empleadoId
  establecimientoId: string;
  rol: RolEmpleado;
  nombre: string;
  iat?: number;
  exp?: number;
}

/** Respuesta de cualquier endpoint de login */
export interface LoginResponse {
  accessToken: string;
  empleadoId: string;
  nombre: string;
  rol: RolEmpleado;
  establecimientoId: string;
}

/**
 * Permisos de módulo por rol (HU-M0-ROL-004)
 * Define qué módulos puede ver cada rol.
 */
export const MODULOS_POR_ROL: Record<RolEmpleado, Modulo[]> = {
  [RolEmpleado.ADMIN]:     [Modulo.M1, Modulo.M2, Modulo.M3, Modulo.M4],
  [RolEmpleado.GERENTE]:   [Modulo.M1, Modulo.M2, Modulo.M3, Modulo.M4],
  [RolEmpleado.CAJERO]:    [Modulo.M1],
  [RolEmpleado.CAMARERO]:  [Modulo.M1],
  [RolEmpleado.COCINERO]:  [Modulo.M1],
  [RolEmpleado.BARRA]:     [Modulo.M1],
  [RolEmpleado.CONTABLE]:  [Modulo.M3],
};
