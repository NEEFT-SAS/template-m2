import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@/contexts/auth/auth.module';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { NotificationEntity } from './infra/entities/notification.entity';
import { NotificationsController } from './api/controllers/notifications.controller';
import { NotificationsGateway } from './api/gateways/notifications.gateway';
import { NotificationsRealtimeService } from './infra/realtime/notifications-realtime.service';
import { NotificationsService } from './app/services/notifications.service';
import { GetNotificationsUseCase } from './app/usecases/get-notifications.usecase';
import { GetNotificationsUnreadCountUseCase } from './app/usecases/get-notifications-unread-count.usecase';
import { MarkNotificationReadUseCase } from './app/usecases/mark-notification-read.usecase';
import { MarkAllNotificationsReadUseCase } from './app/usecases/mark-all-notifications-read.usecase';
import { DeleteNotificationUseCase } from './app/usecases/delete-notification.usecase';
import { MockNotificationsUseCase } from './app/usecases/mock-notifications.usecase';
import { ExecuteNotificationActionUseCase } from './app/usecases/execute-notification-action.usecase';
import { CreateMessageReceivedNotificationHandler } from './app/handlers/create-message-received-notification.handler';
import { MarkConversationNotificationsReadHandler } from './app/handlers/mark-conversation-notifications-read.handler';
import { NOTIFICATIONS_REPOSITORY } from './app/ports/notifications.repository.port';
import { NotificationsRepositoryTypeorm } from './infra/persistence/notifications.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotificationEntity, UserProfileEntity]),
    AuthModule,
  ],
  controllers: [NotificationsController],
  providers: [
    NotificationsGateway,
    NotificationsRealtimeService,
    NotificationsService,
    GetNotificationsUseCase,
    GetNotificationsUnreadCountUseCase,
    MarkNotificationReadUseCase,
    MarkAllNotificationsReadUseCase,
    DeleteNotificationUseCase,
    MockNotificationsUseCase,
    ExecuteNotificationActionUseCase,
    CreateMessageReceivedNotificationHandler,
    MarkConversationNotificationsReadHandler,
    {
      provide: NOTIFICATIONS_REPOSITORY,
      useClass: NotificationsRepositoryTypeorm,
    },
  ],
})
export class NotificationsModule {}
