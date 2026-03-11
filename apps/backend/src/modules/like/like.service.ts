import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Like } from './like.entity';
import { Post } from '../post/post.entity';

@Injectable()
export class LikeService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepo: Repository<Like>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
  ) {}

  async toggle(userId: string, postId: string) {
    const post = await this.postRepo.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existing = await this.likeRepo.findOne({
      where: { userId, postId },
    });

    if (existing) {
      await this.likeRepo.remove(existing);
      post.likeCount = Math.max(0, (post.likeCount || 0) - 1);
      await this.postRepo.save(post);
      return { liked: false, likeCount: post.likeCount };
    }

    const like = this.likeRepo.create({ userId, postId });
    await this.likeRepo.save(like);
    post.likeCount = (post.likeCount || 0) + 1;
    await this.postRepo.save(post);
    return { liked: true, likeCount: post.likeCount };
  }

  async status(userId: string, postId: string) {
    const existing = await this.likeRepo.findOne({
      where: { userId, postId },
    });
    return { liked: Boolean(existing) };
  }
}
