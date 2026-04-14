import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from './follow.entity';
import { NotificationService } from '../notification/notification.service';
import { User } from '../user/user.entity';
import { AppException, ErrorCode } from '@/common/exceptions';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepo: Repository<Follow>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly notificationService: NotificationService,
  ) {}

  async toggle(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw AppException.badRequest(ErrorCode.FOLLOW_SELF_FORBIDDEN);
    }

    const existing = await this.followRepo.findOne({
      where: { followerId, followingId },
    });

    if (existing) {
      await this.followRepo.remove(existing);
      return { following: false };
    }

    const follow = this.followRepo.create({ followerId, followingId });
    await this.followRepo.save(follow);
    const actor = await this.userRepo.findOne({ where: { id: followerId } });
    await this.notificationService.create({
      userId: followingId,
      actorId: followerId,
      actorName: actor?.username || '用户',
      type: 'follow',
    });
    return { following: true };
  }

  async status(followerId: string, followingId: string) {
    const existing = await this.followRepo.findOne({
      where: { followerId, followingId },
    });
    return { following: Boolean(existing) };
  }

  countFollowers(userId: string) {
    return this.followRepo.count({ where: { followingId: userId } });
  }

  countFollowing(userId: string) {
    return this.followRepo.count({ where: { followerId: userId } });
  }
}
