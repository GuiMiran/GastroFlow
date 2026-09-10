import { Module } from '@nestjs/common';
import { VeriFactuService } from './services/verifactu.service';

@Module({
  providers: [VeriFactuService],
  exports: [VeriFactuService],
})
export class VeriFactuModule {}