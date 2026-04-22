import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './core/config/config.module';
import { DatabaseModule } from './core/database/database.module';
import { AuthModule } from './contexts/auth/auth.module';
import { MailerModule } from './core/mailer/mailer.module';
import { EventsModule } from './core/events/event.modules';
import { PlayerModule } from './contexts/players/player.module';
import { HttpExceptionFilter } from './core/http/exceptions/http-exception.filter';
import { SendInternalServerErrorEmailHandler } from './core/http/handlers/send-internal-server-error-email.handler';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    MailerModule,
    EventsModule,
    AuthModule,
    PlayerModule,
  ],
  controllers: [AppController],
  providers: [AppService, HttpExceptionFilter, SendInternalServerErrorEmailHandler],
})
export class AppModule { }
