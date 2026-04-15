import { QueryFailedError, type DataSource } from 'typeorm';
import type { Repository } from 'typeorm';
import { MessageService } from './message.service';
import { Message } from './message.entity';
import { Conversation } from './conversation.entity';
import { User } from '../user/user.entity';
import { MessageGateway } from './message.gateway';
import { PresenceService } from './presence.service';

type MockGateway = {
  emitToUser: jest.Mock<void, [string, string, unknown]>;
};

type MockDataSource = {
  transaction: jest.Mock<
    Promise<unknown>,
    [(manager: object) => Promise<unknown>]
  >;
};

describe('MessageService', () => {
  const createService = () => {
    const gateway: MockGateway = {
      emitToUser: jest.fn<void, [string, string, unknown]>(),
    };
    const presenceService = {
      isOnline: jest.fn(),
    } as unknown as PresenceService;
    const dataSource: MockDataSource = {
      transaction: jest.fn<
        Promise<unknown>,
        [(manager: object) => Promise<unknown>]
      >(),
    };

    const service = new MessageService(
      {} as Repository<Message>,
      {} as Repository<Conversation>,
      {} as Repository<User>,
      gateway as unknown as MessageGateway,
      presenceService,
      dataSource as unknown as DataSource,
    );

    return {
      service,
      gateway,
      dataSource,
    };
  };

  it('sends a message inside a transaction and emits to both participants', async () => {
    const { service, gateway, dataSource } = createService();
    dataSource.transaction.mockImplementation(async (handler) => {
      const manager = {
        findOne: jest.fn().mockResolvedValue({
          id: 'conversation-1',
          userAId: 'user-a',
          userBId: 'user-b',
          lastMessage: 'previous',
        }),
        save: jest
          .fn()
          .mockImplementation((_entity: unknown, value: unknown) =>
            Promise.resolve(value),
          ),
        create: jest
          .fn()
          .mockImplementation((_entity: unknown, value: unknown) => value),
      };

      return handler(manager);
    });

    const result = await service.sendMessage('user-a', 'user-b', 'hello');

    expect(result).toEqual({
      conversationId: 'conversation-1',
      senderId: 'user-a',
      recipientId: 'user-b',
      content: 'hello',
    });
    expect(gateway.emitToUser).toHaveBeenCalledWith(
      'user-b',
      'message:new',
      result,
    );
    expect(gateway.emitToUser).toHaveBeenCalledWith(
      'user-a',
      'message:new',
      result,
    );
  });

  it('recovers from a duplicate conversation insert by reloading the conversation', async () => {
    const { service, dataSource } = createService();

    dataSource.transaction.mockImplementation(async (handler) => {
      const duplicateError = new QueryFailedError(
        'INSERT INTO conversations ...',
        [],
        Object.assign(new Error('duplicate conversation'), {
          code: 'ER_DUP_ENTRY',
        }),
      );

      const manager = {
        findOne: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({
          id: 'conversation-1',
          userAId: 'user-a',
          userBId: 'user-b',
          lastMessage: 'hello',
        }),
        save: jest
          .fn()
          .mockRejectedValueOnce(duplicateError)
          .mockImplementation((_entity: unknown, value: unknown) =>
            Promise.resolve(value),
          ),
        create: jest
          .fn()
          .mockImplementation((_entity: unknown, value: unknown) => value),
      };

      return handler(manager);
    });

    const result = await service.sendMessage('user-a', 'user-b', 'hello');

    expect(result).toEqual(
      expect.objectContaining({
        conversationId: 'conversation-1',
        senderId: 'user-a',
        recipientId: 'user-b',
        content: 'hello',
      }),
    );
  });

  it('marks messages as read inside a transaction before emitting read events', async () => {
    const { service, gateway, dataSource } = createService();
    const update = jest.fn().mockResolvedValue({ affected: 2 });

    dataSource.transaction.mockImplementation(async (handler) => {
      const manager = {
        findOne: jest.fn().mockResolvedValue({
          id: 'conversation-1',
          userAId: 'user-a',
          userBId: 'user-b',
        }),
        update,
      };

      return handler(manager);
    });

    const result = await service.markRead('user-a', 'conversation-1');

    expect(update).toHaveBeenCalledWith(
      Message,
      {
        conversationId: 'conversation-1',
        recipientId: 'user-a',
        read: false,
      },
      { read: true },
    );
    expect(gateway.emitToUser).toHaveBeenCalledWith(
      'user-a',
      'conversation:read',
      { conversationId: 'conversation-1' },
    );
    expect(result).toBeNull();
  });
});
