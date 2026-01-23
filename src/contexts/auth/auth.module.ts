/***************************
 *
 * AuthModule (register only)
 *
 ***************************/

import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './api/auth.controller';
import { UserRegisterUsecase } from './app/usecases/register.usecase';
import { AUTH_REPOSITORY } from './app/ports/auth.repository.port';
import { AuthRepositoryTypeorm } from './infra/persistence/repositories/auth.repository';
import { UserCredentialsEntity } from './infra/persistence/entities/user-credentials.entity';
import { UserProfileEntity } from './infra/persistence/entities/user-profile.entity';
import { TOKEN_SERVICE } from './app/ports/token.port';
import { JwtTokenService } from './infra/persistence/security/token.service';
import { PASSWORD_HASHER } from './app/ports/password-hasher.port';
import { BcryptPasswordHasherService } from './infra/persistence/security/bcrypt-password.service';
import { JwtModule } from '@nestjs/jwt';
import { UserLoginUsecase } from './app/usecases/login.usecase';
import { AUTH_MAILER } from './app/ports/auth-mailer.port';
import { AuthMailerCoreAdapter } from './mailer/auth-mailer.core.adapter';
import { SendUserRegisteredEmailHandler } from './app/handlers/send-user-registered.handler';
import { GetUserSessionUseCase } from './app/usecases/session.usecase';
import { BillingModule } from '../billing/billing.module';

@Module({
  imports: [TypeOrmModule.forFeature([
      UserCredentialsEntity,
      UserProfileEntity
    ]),
    JwtModule.register({}),
    forwardRef(() => BillingModule),
  ],
  controllers: [AuthController],
  providers: [
    UserRegisterUsecase,
    UserLoginUsecase,
    GetUserSessionUseCase,
    SendUserRegisteredEmailHandler,
    { provide: AUTH_REPOSITORY, useClass: AuthRepositoryTypeorm },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasherService },
    { provide: AUTH_MAILER, useClass: AuthMailerCoreAdapter },
  ],
  exports: [AUTH_REPOSITORY, PASSWORD_HASHER, TOKEN_SERVICE],
})
export class AuthModule {}
