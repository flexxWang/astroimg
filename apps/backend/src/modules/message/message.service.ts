import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  In,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';
import { User } from '../user/user.entity';
import { MessageGateway } from './message.gateway';
import { PresenceService } from './presence.service';
import { AppException, ErrorCode } from '@/common/exceptions';

type UnreadCountRow = {
  conversationId: string;
  count: string | number;
};

@Injectable()
export class MessageService {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepo: Repository<Message>,
    @InjectRepository(Conversation)
    private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly gateway: MessageGateway,
    private readonly presenceService: PresenceService,
    private readonly dataSource: DataSource,
  ) {}

  private ensureConversationAccess(
    conversation: Conversation | null,
    userId: string,
  ) {
    if (
      !conversation ||
      (conversation.userAId !== userId && conversation.userBId !== userId)
    ) {
      throw AppException.notFound(ErrorCode.CONVERSATION_NOT_FOUND);
    }
  }

  async listConversations(userId: string) {
    const conversations = await this.conversationRepo.find({
      where: [{ userAId: userId }, { userBId: userId }],
      order: { updatedAt: 'DESC' },
    });

    const userIds = new Set<string>();
    conversations.forEach((c) => {
      userIds.add(c.userAId);
      userIds.add(c.userBId);
    });

    const users = await this.userRepo.findBy({ id: In(Array.from(userIds)) });
    const userMap = new Map(users.map((u) => [u.id, u.username]));

    const unreadMap = new Map<string, number>();
    if (conversations.length > 0) {
      const ids = conversations.map((c) => c.id);
      const unread = await this.messageRepo
        .createQueryBuilder('m')
        .select('m.conversation_id', 'conversationId')
        .addSelect('COUNT(*)', 'count')
        .where('m.conversation_id IN (:...ids)', { ids })
        .andWhere('m.recipient_id = :userId', { userId })
        .andWhere('m.read = false')
        .groupBy('m.conversation_id')
        .getRawMany<UnreadCountRow>();
      unread.forEach((row) => {
        unreadMap.set(row.conversationId, Number(row.count));
      });
    }

    return Promise.all(
      conversations.map(async (c) => {
        const otherId = c.userAId === userId ? c.userBId : c.userAId;
        return {
          id: c.id,
          otherUserId: otherId,
          otherUsername: userMap.get(otherId) || '用户',
          lastMessage: c.lastMessage || '',
          updatedAt: c.updatedAt,
          unreadCount: unreadMap.get(c.id) || 0,
          online: await this.presenceService.isOnline(otherId),
        };
      }),
    );
  }

  async listMessages(userId: string, conversationId: string, cursor?: string) {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
    });
    this.ensureConversationAccess(conversation, userId);

    const qb = this.messageRepo
      .createQueryBuilder('m')
      .where('m.conversationId = :conversationId', { conversationId });
    if (cursor) {
      qb.andWhere('m.createdAt < :cursor', { cursor: new Date(cursor) });
    }
    const list = await qb.orderBy('m.createdAt', 'DESC').limit(20).getMany();
    return list.reverse();
  }

  async searchMessages(
    userId: string,
    conversationId: string,
    keyword?: string,
  ) {
    if (!keyword) return [];
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
    });
    this.ensureConversationAccess(conversation, userId);

    return this.messageRepo
      .createQueryBuilder('m')
      .where('m.conversationId = :conversationId', { conversationId })
      .andWhere('m.content LIKE :keyword', { keyword: `%${keyword}%` })
      .orderBy('m.createdAt', 'DESC')
      .limit(20)
      .getMany();
  }

  async sendMessage(senderId: string, recipientId: string, content: string) {
    const saved = await this.dataSource.transaction(async (manager) => {
      const [userA, userB] = [senderId, recipientId].sort();
      const conversation = await this.findOrCreateConversation(
        manager,
        userA,
        userB,
        content,
      );

      const message = manager.create(Message, {
        conversationId: conversation.id,
        senderId,
        recipientId,
        content,
      });

      return manager.save(Message, message);
    });

    this.gateway.emitToUser(recipientId, 'message:new', saved);
    this.gateway.emitToUser(senderId, 'message:new', saved);
    return saved;
  }

  async markRead(userId: string, conversationId: string) {
    await this.dataSource.transaction(async (manager) => {
      const conversation = await manager.findOne(Conversation, {
        where: { id: conversationId },
      });
      this.ensureConversationAccess(conversation, userId);

      await manager.update(
        Message,
        { conversationId, recipientId: userId, read: false },
        { read: true },
      );
    });

    this.gateway.emitToUser(userId, 'conversation:read', { conversationId });
    return null;
  }

  private async findOrCreateConversation(
    manager: EntityManager,
    userA: string,
    userB: string,
    lastMessage: string,
  ) {
    const existing = await manager.findOne(Conversation, {
      where: { userAId: userA, userBId: userB },
    });

    if (existing) {
      existing.lastMessage = lastMessage;
      return manager.save(Conversation, existing);
    }

    try {
      const created = manager.create(Conversation, {
        userAId: userA,
        userBId: userB,
        lastMessage,
      });
      return await manager.save(Conversation, created);
    } catch (error) {
      if (this.isDuplicateConversationError(error)) {
        const duplicated = await manager.findOne(Conversation, {
          where: { userAId: userA, userBId: userB },
        });
        if (duplicated) {
          duplicated.lastMessage = lastMessage;
          return manager.save(Conversation, duplicated);
        }
      }

      throw error;
    }
  }

  private isDuplicateConversationError(error: unknown) {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError as { code?: string } | undefined;
    return driverError?.code === 'ER_DUP_ENTRY';
  }
}
