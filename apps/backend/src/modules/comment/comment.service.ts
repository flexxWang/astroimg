import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './comment.entity';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Post } from '../post/post.entity';

@Injectable()
export class CommentService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepo: Repository<Comment>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
  ) {}

  create(authorId: string, postId: string, dto: CreateCommentDto) {
    const comment = this.commentRepo.create({
      content: dto.content,
      authorId,
      postId,
    });
    return this.commentRepo.save(comment).then(async (saved) => {
      const post = await this.postRepo.findOne({ where: { id: postId } });
      if (post) {
        post.commentCount = (post.commentCount || 0) + 1;
        await this.postRepo.save(post);
      }
      return saved;
    });
  }

  findByPost(postId: string) {
    return this.commentRepo.find({
      where: { postId },
      order: { createdAt: "DESC" },
    });
  }
}
