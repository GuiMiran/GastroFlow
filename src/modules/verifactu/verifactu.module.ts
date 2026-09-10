import { Module } from '@nestjs/common';
import { VeriFactuService } from './verifactu.service';

@Module({
  providers: [VeriFactuService],
  exports: [VeriFactuService],
})
export class VeriFactuModule {}
