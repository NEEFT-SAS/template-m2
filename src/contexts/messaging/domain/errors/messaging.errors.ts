import { DomainError } from '@/core/errors/domain-error';
import { MessagingScope } from '../types/messaging.types';

export class MessagingConversationNotFoundError extends DomainError {
  constructor(conversationId: string) {
    super({
      code: 'MESSAGING_CONVERSATION_NOT_FOUND',
      message: 'Conversation not found',
      statusCode: 404,
      fields: { conversationId: ['not_found'] },
      details: { conversationId },
    });
  }
}

export class MessagingForbiddenError extends DomainError {
  constructor(conversationId?: string) {
    super({
      code: 'MESSAGING_FORBIDDEN',
      message: 'Access denied',
      statusCode: 403,
      fields: { conversation: ['forbidden'] },
      details: { conversationId: conversationId ?? null },
    });
  }
}

export class MessagingInvalidScopeError extends DomainError {
  constructor(scope?: string | null) {
    super({
      code: 'MESSAGING_INVALID_SCOPE',
      message: 'Invalid scope',
      statusCode: 400,
      fields: { scope: ['invalid'] },
      details: { scope: scope ?? null, allowedScopes: ['SELF', 'TEAM'] satisfies MessagingScope[] },
    });
  }
}

export class MessagingEmptyMessageError extends DomainError {
  constructor() {
    super({
      code: 'MESSAGING_EMPTY_MESSAGE',
      message: 'Message content cannot be empty',
      statusCode: 400,
      fields: { content: ['required'] },
    });
  }
}

export class MessagingTeamContextRequiredError extends DomainError {
  constructor() {
    super({
      code: 'MESSAGING_TEAM_CONTEXT_REQUIRED',
      message: 'Team context is required for this scope',
      statusCode: 400,
      fields: { teamId: ['required'] },
    });
  }
}

export class MessagingTargetRequiredError extends DomainError {
  constructor() {
    super({
      code: 'MESSAGING_TARGET_REQUIRED',
      message: 'Target reference is required',
      statusCode: 400,
      fields: { target: ['required'] },
    });
  }
}

export class MessagingInvalidEntityTypeError extends DomainError {
  constructor(field: 'targetType' | 'sourceType', value: string | null) {
    super({
      code: 'MESSAGING_INVALID_ENTITY_TYPE',
      message: 'Invalid entity type',
      statusCode: 400,
      fields: { [field]: ['invalid'] },
      details: { field, value, allowed: ['PLAYER', 'TEAM'] },
    });
  }
}

export class MessagingTargetNotFoundError extends DomainError {
  constructor(targetType: 'PLAYER' | 'TEAM', targetRef: string) {
    super({
      code: 'MESSAGING_TARGET_NOT_FOUND',
      message: 'Target not found',
      statusCode: 404,
      fields: { target: ['not_found'] },
      details: { targetType, targetRef },
    });
  }
}

export class MessagingSelfConversationNotAllowedError extends DomainError {
  constructor() {
    super({
      code: 'MESSAGING_SELF_CONVERSATION_NOT_ALLOWED',
      message: 'Cannot start a conversation with yourself',
      statusCode: 400,
      fields: { target: ['invalid'] },
    });
  }
}
