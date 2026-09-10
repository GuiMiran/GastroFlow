/**
 * M0-PLATFORM — AuthModule
 */
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

const JWT_SECRET = process.env.JWT_SECRET ?? 'gastroflow-dev-secret-change-in-prod';
const JWT_EXPIRES = (process.env.JWT_EXPIRES_IN ?? '24h') as `${number}${'s' | 'm' | 'h' | 'd' | 'w' | 'y'}` | number;

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      global: true,           // disponible en todos los módulos sin reimportar
      secret: JWT_SECRET,
      signOptions: { expiresIn: JWT_EXPIRES },
    }),
  ],
  providers: [AuthService, JwtAuthGuard, RolesGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard, RolesGuard],
})
export class AuthModule {}
