import {
  MarkConversationReadDto,
  SendConversationMessageDto,
} from '@neeft-sas/shared';
import { IsUUID } from 'class-validator';

export class SendConversationMessageSocketDto extends SendConversationMessageDto {
  @IsUUID()
  conversationId!: string;
}

export class MarkConversationReadSocketDto extends MarkConversationReadDto {
  @IsUUID()
  conversationId!: string;
}
