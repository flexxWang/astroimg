import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from './like.entity';
import { NotificationService } from '../notification/notification.service';
import { PostService } from '../post/post.service';
import { UserService } from '../user/user.service';
import { AppException, ErrorCode } from '@/common/exceptions';

@Injectable()
export class LikeService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepo: Repository<Like>,
    private readonly postService: PostService,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
  ) {}

  async toggle(userId: string, postId: string) {
    const post = await this.postService.findEntityById(postId);
    if (!post) {
      throw AppException.notFound(ErrorCode.POST_NOT_FOUND);
    }

    const existing = await this.likeRepo.findOne({
      where: { userId, postId },
    });

    if (existing) {
      await this.likeRepo.remove(existing);
      const updated = await this.postService.decrementLikeCount(postId);
      return { liked: false, likeCount: updated.likeCount };
    }

    const like = this.likeRepo.create({ userId, postId });
    await this.likeRepo.save(like);
    const updated = await this.postService.incrementLikeCount(postId);
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
}
