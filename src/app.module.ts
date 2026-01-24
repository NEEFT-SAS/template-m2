import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './core/config/config.module';
import { DatabaseModule } from './core/database/database.module';
import { AuthModule } from './contexts/auth/auth.module';
import { MailerModule } from './core/mailer/mailer.module';
import { EventsModule } from './core/events/event.modules';
import { PlayerModule } from './contexts/players/player.module';
import { ResourcesModule } from './contexts/resources/resources.module';
import { BillingModule } from './contexts/billing/billing.module';
import { SearchModule } from './contexts/search/search.module';
import { TeamsModule } from './contexts/teams/teams.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    MailerModule,
    EventsModule,
    AuthModule,
    BillingModule,
    PlayerModule,
    ResourcesModule,
    SearchModule,
    TeamsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
