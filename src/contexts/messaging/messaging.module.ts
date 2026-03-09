import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '@/contexts/auth/auth.module';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { TeamEntity } from '@/contexts/teams/infra/entities/team.entity';
import { TeamMemberEntity } from '@/contexts/teams/infra/entities/team-member.entity';
import { MessagingConversationEntity } from './infra/entities/messaging-conversation.entity';
import { MessagingMessageEntity } from './infra/entities/messaging-message.entity';
import { MessagingMessageReadEntity } from './infra/entities/messaging-message-read.entity';
import { MessagingController } from './api/controllers/messaging.controller';
import { MessagingGateway } from './api/gateways/messaging.gateway';
import { MessagingService } from './app/services/messaging.service';
import { MESSAGING_REPOSITORY } from './app/ports/messaging.repository.port';
import { MESSAGING_ACCESS_REPOSITORY } from './app/ports/messaging-access.repository.port';
import { MessagingRepositoryTypeorm } from './infra/persistence/messaging.repository';
import { MessagingAccessRepositoryTypeorm } from './infra/persistence/messaging-access.repository';
import { GetConversationsUseCase } from './app/usecases/get-conversations.usecase';
import { GetConversationMessagesUseCase } from './app/usecases/get-conversation-messages.usecase';
import { SendConversationMessageUseCase } from './app/usecases/send-conversation-message.usecase';
import { MarkConversationReadUseCase } from './app/usecases/mark-conversation-read.usecase';
import { GetUnreadCountUseCase } from './app/usecases/get-unread-count.usecase';
import { GetTeamContextsUseCase } from './app/usecases/get-team-contexts.usecase';
import { StartConversationUseCase } from './app/usecases/start-conversation.usecase';
import { MessagingRealtimeService } from './infra/realtime/messaging-realtime.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MessagingConversationEntity,
      MessagingMessageEntity,
      MessagingMessageReadEntity,
      UserProfileEntity,
      TeamEntity,
      TeamMemberEntity,
    ]),
    AuthModule,
  ],
  controllers: [MessagingController],
  providers: [
    MessagingGateway,
    MessagingRealtimeService,
    MessagingService,
    GetConversationsUseCase,
    GetConversationMessagesUseCase,
    SendConversationMessageUseCase,
    MarkConversationReadUseCase,
    GetUnreadCountUseCase,
    GetTeamContextsUseCase,
    StartConversationUseCase,
    { provide: MESSAGING_REPOSITORY, useClass: MessagingRepositoryTypeorm },
    { provide: MESSAGING_ACCESS_REPOSITORY, useClass: MessagingAccessRepositoryTypeorm },
  ],
  exports: [MessagingService],
})
export class MessagingModule {}
