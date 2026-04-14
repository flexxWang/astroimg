import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { NotificationService } from '../notification/notification.service';
import { PostService } from '../post/post.service';
import { UserService } from '../user/user.service';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    private readonly postService: PostService,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
  ) {}

  create(authorId: string, postId: string, dto: CreateCommentDto) {
    const comment = this.commentRepo.create({
      content: dto.content,
      authorId,
      postId,
    });
    return this.commentRepo.save(comment).then(async (saved) => {
      const post = await this.postService.findEntityById(postId);
      if (post) {
        await this.postService.incrementCommentCount(postId);
        const actor = await this.userService.findByIdPublic(authorId);
        await this.notificationService.create({
          userId: post.authorId,
          actorId: authorId,
          actorName: actor?.username || '用户',
          type: 'comment',
          postId,
        });
      }
      return saved;
    });
  }

  findByPost(postId: string) {
    return this.commentRepo.find({
      where: { postId },
      order: { createdAt: 'DESC' },
    });
  }
}
