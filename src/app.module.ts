import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { EmpleadoModule } from './modules/empleado/empleado.module';
import { TpvModule } from './modules/tpv/tpv.module';
import { VeriFactuModule } from './modules/verifactu/verifactu.module';
import { ContableModule } from './modules/contable/contable.module';
import { FiscalModule } from './modules/fiscal/fiscal.module';
import { InventarioModule } from './modules/inventario/inventario.module';
import { CatalogoModule } from './modules/catalogo/catalogo.module';
import { ComprasModule } from './modules/compras/compras.module';
import { RrhhModule } from './modules/rrhh/rrhh.module';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    PrismaModule,
    AuthModule,
    EmpleadoModule,
    VeriFactuModule,
    TpvModule,
    ContableModule,
    FiscalModule,
    InventarioModule,
    CatalogoModule,
    ComprasModule,
    RrhhModule,
  ],
})
export class AppModule {}
