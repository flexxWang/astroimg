import { QueryFailedError } from 'typeorm';
import { MessageService } from './message.service';
import { Message } from './message.entity';

describe('MessageService', () => {
  const createService = () => {
    const messageRepo = {
      createQueryBuilder: jest.fn(),
    } as any;
    const conversationRepo = {
      findOne: jest.fn(),
    } as any;
    const userRepo = {
      findBy: jest.fn(),
    } as any;
    const gateway = {
      emitToUser: jest.fn(),
    } as any;
    const presenceService = {
      isOnline: jest.fn(),
    } as any;
    const dataSource = {
      transaction: jest.fn(),
    } as any;

    const service = new MessageService(
      messageRepo,
      conversationRepo,
      userRepo,
      gateway,
      presenceService,
      dataSource,
    );

    return {
      service,
      messageRepo,
      conversationRepo,
      userRepo,
      gateway,
      presenceService,
      dataSource,
    };
  };

  it('sends a message inside a transaction and emits to both participants', async () => {
    const { service, gateway, dataSource } = createService();
    dataSource.transaction.mockImplementation(async (handler: any) => {
      const manager = {
        findOne: jest.fn().mockResolvedValue({
          id: 'conversation-1',
          userAId: 'user-a',
          userBId: 'user-b',
          lastMessage: 'previous',
        }),
        save: jest
          .fn()
          .mockImplementation(async (_entity: unknown, value: unknown) => value),
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

    dataSource.transaction.mockImplementation(async (handler: any) => {
      const duplicateError = new QueryFailedError(
        'INSERT INTO conversations ...',
        [],
        { code: 'ER_DUP_ENTRY' },
      );

      const manager = {
        findOne: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({
            id: 'conversation-1',
            userAId: 'user-a',
            userBId: 'user-b',
            lastMessage: 'hello',
          }),
        save: jest
          .fn()
          .mockRejectedValueOnce(duplicateError)
          .mockImplementation(async (_entity: unknown, value: unknown) => value),
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

    dataSource.transaction.mockImplementation(async (handler: any) => {
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
