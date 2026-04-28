import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { Like } from './like.entity';
import { NotificationService } from '../notification/notification.service';
import { Post } from '../post/post.entity';
import { UserService } from '../user/user.service';
import { AppException, ErrorCode } from '@/common/exceptions';

@Injectable()
export class LikeService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepo: Repository<Like>,
    private readonly dataSource: DataSource,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
  ) {}

  async toggle(userId: string, postId: string) {
    const updated = await this.dataSource.transaction(async (manager) => {
      const post = await manager
        .getRepository(Post)
        .createQueryBuilder('post')
        .setLock('pessimistic_write')
        .where('post.id = :postId', { postId })
        .select(['post.id', 'post.authorId', 'post.likeCount'])
        .getRawOne<{
          post_id: string;
          post_authorId: string;
          post_likeCount: number;
        }>();

      if (!post) {
        throw AppException.notFound(ErrorCode.POST_NOT_FOUND);
      }

      const likeRepo = manager.getRepository(Like);
      const existing = await likeRepo.findOne({
        where: { userId, postId },
      });

      if (existing) {
        await likeRepo.remove(existing);
        await manager
          .getRepository(Post)
          .createQueryBuilder()
          .update(Post)
          .set({
            likeCount: () => 'GREATEST(like_count - 1, 0)',
          })
          .where('id = :id', { id: postId })
          .execute();

        return {
          liked: false,
          authorId: post.post_authorId,
          likeCount: Math.max(0, Number(post.post_likeCount ?? 0) - 1),
        };
      }

      try {
        await likeRepo.save(likeRepo.create({ userId, postId }));
      } catch (error) {
        if (
          error instanceof QueryFailedError &&
          this.isDuplicateLikeError(error)
        ) {
          return {
            liked: true,
            authorId: post.post_authorId,
            likeCount: Number(post.post_likeCount ?? 0),
          };
        }
        throw error;
      }

      await manager
        .getRepository(Post)
        .increment({ id: postId }, 'likeCount', 1);
      return {
        liked: true,
        authorId: post.post_authorId,
        likeCount: Number(post.post_likeCount ?? 0) + 1,
      };
    });

    if (!updated.liked) {
      return { liked: false, likeCount: updated.likeCount };
    }

    const actor = await this.userService.findByIdPublic(userId);
    await this.notificationService.create({
      userId: updated.authorId,
      actorId: userId,
      actorName: actor?.username || '用户',
      type: 'like',
      postId,
    });
    return { liked: true, likeCount: updated.likeCount };
  }

  async status(userId: string, postId: string) {
    const existing = await this.likeRepo.findOne({
      where: { userId, postId },
    });
    return { liked: Boolean(existing) };
  }

  private isDuplicateLikeError(error: unknown) {
    const driverError = (
      error as { driverError?: { code?: string; errno?: number } }
    ).driverError;
    return driverError?.code === 'ER_DUP_ENTRY' || driverError?.errno === 1062;
  }
}
