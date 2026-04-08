import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Conversation } from './conversation.entity';
import { Message } from './message.entity';
import { User } from '../user/user.entity';
import { MessageGateway } from './message.gateway';
import { AppException } from '../../common/exceptions/app.exception';
import { ErrorCode } from '../../common/exceptions/error-codes';

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
  ) {}

  private ensureConversationAccess(
    conversation: Conversation | null,
    userId: string,
  ) {
    if (
      !conversation ||
      (conversation.userAId !== userId && conversation.userBId !== userId)
    ) {
      throw AppException.notFound(
        ErrorCode.CONVERSATION_NOT_FOUND,
        'Conversation not found',
      );
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
        .getRawMany();
      unread.forEach((row) => {
        unreadMap.set(row.conversationId, Number(row.count));
      });
    }

    return conversations.map((c) => {
      const otherId = c.userAId === userId ? c.userBId : c.userAId;
      return {
        id: c.id,
        otherUserId: otherId,
        otherUsername: userMap.get(otherId) || '用户',
        lastMessage: c.lastMessage || '',
        updatedAt: c.updatedAt,
        unreadCount: unreadMap.get(c.id) || 0,
        online: this.gateway.isOnline(otherId),
      };
    });
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
    const [userA, userB] = [senderId, recipientId].sort();
    let conversation = await this.conversationRepo.findOne({
      where: { userAId: userA, userBId: userB },
    });

    if (!conversation) {
      conversation = this.conversationRepo.create({
        userAId: userA,
        userBId: userB,
        lastMessage: content,
      });
      conversation = await this.conversationRepo.save(conversation);
    } else {
      conversation.lastMessage = content;
      conversation = await this.conversationRepo.save(conversation);
    }

    const message = this.messageRepo.create({
      conversationId: conversation.id,
      senderId,
      recipientId,
      content,
    });

    const saved = await this.messageRepo.save(message);
    this.gateway.emitToUser(recipientId, 'message:new', saved);
    this.gateway.emitToUser(senderId, 'message:new', saved);
    return saved;
  }

  async markRead(userId: string, conversationId: string) {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId },
    });
    this.ensureConversationAccess(conversation, userId);

    await this.messageRepo.update(
      { conversationId, recipientId: userId, read: false },
      { read: true },
    );
    this.gateway.emitToUser(userId, 'conversation:read', { conversationId });
    return null;
  }
}
