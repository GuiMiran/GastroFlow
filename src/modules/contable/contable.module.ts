import { Module } from '@nestjs/common';
import { AsientoService } from './asiento.service';
import { ContableController } from './contable.controller';

@Module({
  controllers: [ContableController],
  providers: [AsientoService],
  exports: [AsientoService],
})
export class ContableModule {}
