import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
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
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
  ) {}

  async toggle(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw AppException.badRequest(ErrorCode.FOLLOW_SELF_FORBIDDEN);
    }

    const result = await this.dataSource.transaction(async (manager) => {
      const followRepo = manager.getRepository(Follow);
      const existing = await followRepo.findOne({
        where: { followerId, followingId },
      });

      if (existing) {
        await followRepo.delete({ id: existing.id });
        return { following: false };
      }

      try {
        await followRepo.save(followRepo.create({ followerId, followingId }));
      } catch (error) {
        if (
          error instanceof QueryFailedError &&
          this.isDuplicateFollowError(error)
        ) {
          return { following: true };
        }
        throw error;
      }

      return { following: true };
    });

    if (!result.following) {
      return result;
    }

    const actor = await this.userRepo.findOne({ where: { id: followerId } });
    await this.notificationService.create({
      userId: followingId,
      actorId: followerId,
      actorName: actor?.username || '用户',
      type: 'follow',
    });
    return result;
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

  private isDuplicateFollowError(error: unknown) {
    const driverError = (
      error as { driverError?: { code?: string; errno?: number } }
    ).driverError;
    return driverError?.code === 'ER_DUP_ENTRY' || driverError?.errno === 1062;
  }
}
