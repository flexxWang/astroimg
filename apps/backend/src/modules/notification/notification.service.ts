import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {}

  list(userId: string) {
    return this.notificationRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  unreadCount(userId: string) {
    return this.notificationRepo.count({ where: { userId, read: false } });
  }

  create(params: {
    userId: string;
    actorId: string;
    actorName: string;
    type: NotificationType;
    postId?: string;
  }) {
    if (params.userId === params.actorId) return null;
    const notification = this.notificationRepo.create({
      userId: params.userId,
      actorId: params.actorId,
      actorName: params.actorName,
      type: params.type,
      postId: params.postId,
    });
    return this.notificationRepo.save(notification);
  }

  async markRead(userId: string, id: string) {
    const notification = await this.notificationRepo.findOne({
      where: { id, userId },
    });
    if (!notification) return null;
    notification.read = true;
    return this.notificationRepo.save(notification);
  }

  async markAllRead(userId: string) {
    await this.notificationRepo.update({ userId, read: false }, { read: true });
    return { success: true };
  }
}
