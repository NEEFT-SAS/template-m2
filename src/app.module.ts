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
import { SocialGraphModule } from './contexts/follows/social-graph.module';
import { MessagingModule } from './contexts/messaging/messaging.module';
import { NotificationsModule } from './contexts/notifications/notifications.module';
import { RecruitmentModule } from './contexts/recruitment/recruitment.module';
import { CalendarModule } from './contexts/calendar/calendar.module';
import { FeedModule } from './contexts/feed/feed.module';
import { AdsModule } from './contexts/ads/ads.module';
import { HttpExceptionFilter } from './core/http/exceptions/http-exception.filter';
import { SendInternalServerErrorEmailHandler } from './core/http/handlers/send-internal-server-error-email.handler';

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
    TeamsModule,
    SocialGraphModule,
    MessagingModule,
    NotificationsModule,
    RecruitmentModule,
    CalendarModule,
    FeedModule,
    AdsModule,
  ],
  controllers: [AppController],
  providers: [AppService, HttpExceptionFilter, SendInternalServerErrorEmailHandler],
})
export class AppModule { }
