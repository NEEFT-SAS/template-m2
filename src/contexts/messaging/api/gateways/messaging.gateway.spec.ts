import { WsException } from '@nestjs/websockets';
import { DomainError } from '../../../../core/errors/domain-error';
import { MessagingGateway } from './messaging.gateway';

const PROFILE_ID = '11111111-1111-4111-8111-111111111111';
const CONVERSATION_ID = '22222222-2222-4222-8222-222222222222';
const MESSAGE_ID = '33333333-3333-4333-8333-333333333333';
const MESSAGE_DATE = '2026-04-01T12:00:00.000Z';

function createClient(overrides?: Partial<any>) {
  return {
    data: { user: { pid: PROFILE_ID } },
    emit: jest.fn(),
    join: jest.fn(),
    disconnect: jest.fn(),
    handshake: { auth: {}, query: {}, headers: {} },
    ...overrides,
  } as any;
}

describe('MessagingGateway', () => {
  let gateway: MessagingGateway;
  let tokenService: { verifyAccessToken: jest.Mock };
  let messagingRealtime: { setServer: jest.Mock; profileRoom: jest.Mock };
  let startConversationUseCase: { execute: jest.Mock };
  let sendConversationMessageUseCase: { execute: jest.Mock };
  let markConversationReadUseCase: { execute: jest.Mock };

  beforeEach(() => {
    tokenService = { verifyAccessToken: jest.fn() };
    messagingRealtime = {
      setServer: jest.fn(),
      profileRoom: jest.fn().mockReturnValue(`messaging:user:${PROFILE_ID}`),
    };
    startConversationUseCase = { execute: jest.fn() };
    sendConversationMessageUseCase = { execute: jest.fn() };
    markConversationReadUseCase = { execute: jest.fn() };

    gateway = new MessagingGateway(
      tokenService as any,
      messagingRealtime as any,
      startConversationUseCase as any,
      sendConversationMessageUseCase as any,
      markConversationReadUseCase as any,
    );
  });

  it('returns send-message payload with native socket ack flow', async () => {
    const client = createClient();
    const presenter = {
      id: MESSAGE_ID,
      conversationId: CONVERSATION_ID,
      senderType: 'PROFILE',
      senderProfileId: PROFILE_ID,
      senderSystemKey: null,
      content: 'Salut',
      createdAt: MESSAGE_DATE,
      isOwn: true,
      deliveryStatus: 'UNREAD',
      readByCount: 0,
      recipientCount: 1,
    };

    sendConversationMessageUseCase.execute.mockResolvedValue(presenter);

    const result = await gateway.subscribeSendMessage(client, {
      conversationId: CONVERSATION_ID,
      content: 'Salut',
    });

    expect(sendConversationMessageUseCase.execute).toHaveBeenCalledWith(PROFILE_ID, CONVERSATION_ID, { content: 'Salut' });
    expect(result).toEqual(presenter);
  });

  it('throws WsException with domain payload when usecase fails', async () => {
    const client = createClient();
    const error = new DomainError({
      code: 'MESSAGING_FORBIDDEN',
      message: 'Access denied',
      statusCode: 403,
      fields: { conversation: ['forbidden'] },
      details: { conversationId: CONVERSATION_ID },
    });

    sendConversationMessageUseCase.execute.mockRejectedValue(error);

    let caught: unknown;
    try {
      await gateway.subscribeSendMessage(client, {
        conversationId: CONVERSATION_ID,
        content: 'Salut',
      });
      fail('Expected WsException');
    } catch (wsError) {
      caught = wsError;
    }

    expect(caught).toBeInstanceOf(WsException);
    expect((caught as WsException).getError()).toEqual({
      code: 'MESSAGING_FORBIDDEN',
      message: 'Access denied',
      statusCode: 403,
      fields: { conversation: ['forbidden'] },
      details: { conversationId: CONVERSATION_ID },
    });
  });

  it('throws WsException with validation payload for invalid DTO', async () => {
    const client = createClient();

    let caught: unknown;
    try {
      await gateway.subscribeSendMessage(client, {
        conversationId: 'bad-id',
        content: 'Salut',
      });
      fail('Expected WsException');
    } catch (wsError) {
      caught = wsError;
    }

    expect(caught).toBeInstanceOf(WsException);
    expect((caught as WsException).getError()).toEqual(
      expect.objectContaining({
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        statusCode: 400,
        fields: expect.objectContaining({
          conversationId: expect.any(Array),
        }),
      }),
    );
  });
});
