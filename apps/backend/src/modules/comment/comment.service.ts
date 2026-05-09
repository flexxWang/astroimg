import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { NotificationService } from '../notification/notification.service';
import { PostService } from '../post/post.service';
import { UserService } from '../user/user.service';

type CommentRow = {
  comment_id: string;
  comment_authorId: string;
  comment_content: string;
  comment_createdAt: Date;
  author_id: string | null;
  author_username: string | null;
  author_avatarUrl: string | null;
};

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    private readonly postService: PostService,
    private readonly userService: UserService,
    private readonly notificationService: NotificationService,
  ) {}

  private baseQuery() {
    return this.commentRepo
      .createQueryBuilder('comment')
      .leftJoin('comment.author', 'author')
      .select('comment.id', 'comment_id')
      .addSelect('comment.authorId', 'comment_authorId')
      .addSelect('comment.content', 'comment_content')
      .addSelect('comment.createdAt', 'comment_createdAt')
      .addSelect('author.id', 'author_id')
      .addSelect('author.username', 'author_username')
      .addSelect('author.avatarUrl', 'author_avatarUrl');
  }

  private mapComment(row: CommentRow) {
    return {
      id: row.comment_id,
      authorId: row.comment_authorId,
      content: row.comment_content,
      createdAt: row.comment_createdAt,
      author: row.author_id
        ? {
            id: row.author_id,
            username: row.author_username,
            avatarUrl: row.author_avatarUrl,
          }
        : undefined,
    };
  }

  async create(authorId: string, postId: string, dto: CreateCommentDto) {
    const comment = this.commentRepo.create({
      content: dto.content,
      authorId,
      postId,
    });
    const saved = await this.commentRepo.save(comment);
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

    const row = await this.baseQuery()
      .where('comment.id = :id', { id: saved.id })
      .getRawOne<CommentRow>();

    return row ? this.mapComment(row) : saved;
  }

  findByPost(postId: string) {
    return this.baseQuery()
      .where('comment.postId = :postId', { postId })
      .orderBy('comment.createdAt', 'DESC')
      .getRawMany<CommentRow>()
      .then((rows) => rows.map((row) => this.mapComment(row)));
  }
}
