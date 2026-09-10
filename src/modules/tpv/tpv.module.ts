import { Module } from '@nestjs/common';
import { MesaService } from './services/mesa.service';
import { ComandaService } from './services/comanda.service';
import { CobroService } from './services/cobro.service';
import { CajaService } from './services/caja.service';
import { KdsService } from './services/kds.service';
import { VeriFactuModule } from '../verifactu/verifactu.module';
import { MesaController } from './controllers/mesa.controller';
import { ComandaController } from './controllers/comanda.controller';
import { CobroController } from './controllers/cobro.controller';
import { CajaController } from './controllers/caja.controller';
import { ProductoController } from './controllers/producto.controller';
import { KdsController } from './controllers/kds.controller';
import { SetupController } from './controllers/setup.controller';

@Module({
  imports: [VeriFactuModule],
  providers: [MesaService, ComandaService, CobroService, CajaService, KdsService],
  controllers: [MesaController, ComandaController, CobroController, CajaController, ProductoController, KdsController, SetupController],
  exports: [MesaService, ComandaService, CobroService, CajaService, KdsService],
})
export class TpvModule {}
