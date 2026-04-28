import { QueryFailedError, type DataSource } from 'typeorm';
import type { Repository } from 'typeorm';
import { MessageService } from './message.service';
import { Message } from './message.entity';
import { Conversation } from './conversation.entity';
import { User } from '../user/user.entity';
import { MessageGateway } from './message.gateway';
import { PresenceService } from './presence.service';
import { AppLogger } from '@/common/logging/app-logger.service';

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
    const messageRepo = {
      createQueryBuilder: jest.fn(),
    } as unknown as Repository<Message>;
    const conversationRepo = {
      find: jest.fn(),
    } as unknown as Repository<Conversation>;
    const userRepo = {
      findBy: jest.fn(),
    } as unknown as Repository<User>;
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
    const logger = {
      error: jest.fn(),
    } as unknown as AppLogger;

    const service = new MessageService(
      messageRepo,
      conversationRepo,
      userRepo,
      gateway as unknown as MessageGateway,
      presenceService,
      dataSource as unknown as DataSource,
      logger,
    );

    return {
      service,
      messageRepo,
      conversationRepo,
      userRepo,
      presenceService,
      gateway,
      dataSource,
      logger,
    };
  };

  it('returns an empty array when the user has no conversations', async () => {
    const { service, conversationRepo, userRepo, presenceService } =
      createService();
    const mockUserRepo = userRepo as unknown as { findBy: jest.Mock };
    const mockPresenceService = presenceService as unknown as {
      isOnline: jest.Mock;
    };
    (conversationRepo.find as jest.Mock).mockResolvedValue([]);

    const result = await service.listConversations('user-a');

    expect(result).toEqual([]);
    expect(mockUserRepo.findBy).not.toHaveBeenCalled();
    expect(mockPresenceService.isOnline).not.toHaveBeenCalled();
  });

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
      read: false,
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

  it('marks self-sent messages as read immediately', async () => {
    const { service, dataSource } = createService();

    dataSource.transaction.mockImplementation(async (handler) => {
      const manager = {
        findOne: jest.fn().mockResolvedValue({
          id: 'conversation-1',
          userAId: 'user-a',
          userBId: 'user-a',
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

    const result = await service.sendMessage(
      'user-a',
      'user-a',
      'note to self',
    );

    expect(result).toEqual(
      expect.objectContaining({
        senderId: 'user-a',
        recipientId: 'user-a',
        read: true,
      }),
    );
  });

  it('degrades auxiliary failures when listing conversations', async () => {
    const {
      service,
      conversationRepo,
      userRepo,
      presenceService,
      messageRepo,
    } = createService();
    const qb = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      groupBy: jest.fn().mockReturnThis(),
      getRawMany: jest
        .fn()
        .mockRejectedValue(new Error('messages unavailable')),
    };

    (conversationRepo.find as jest.Mock).mockResolvedValue([
      {
        id: 'conversation-1',
        userAId: 'user-a',
        userBId: 'user-b',
        lastMessage: 'hello',
        updatedAt: new Date('2026-04-24T10:00:00.000Z'),
      },
    ]);
    (userRepo.findBy as jest.Mock).mockRejectedValue(
      new Error('users unavailable'),
    );
    (presenceService.isOnline as jest.Mock).mockRejectedValue(
      new Error('presence unavailable'),
    );
    (messageRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

    const result = await service.listConversations('user-a');

    expect(result).toEqual([
      expect.objectContaining({
        id: 'conversation-1',
        otherUserId: 'user-b',
        otherUsername: '用户',
        unreadCount: 0,
        online: false,
      }),
    ]);
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
