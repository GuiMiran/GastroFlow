/**
 * M0-PLATFORM — EmpleadoModule
 */
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { EmpleadoService } from './empleado.service';
import { EmpleadoController } from './empleado.controller';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [EmpleadoService],
  controllers: [EmpleadoController],
  exports: [EmpleadoService],
})
export class EmpleadoModule {}
