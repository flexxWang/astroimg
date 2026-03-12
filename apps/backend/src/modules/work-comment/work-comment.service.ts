import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkComment } from './work-comment.entity';
import { Work } from '../work/work.entity';
import { CreateWorkCommentDto } from './dto/create-work-comment.dto';

@Injectable()
export class WorkCommentService {
  constructor(
    @InjectRepository(WorkComment)
    private readonly commentRepo: Repository<WorkComment>,
    @InjectRepository(Work)
    private readonly workRepo: Repository<Work>,
  ) {}

  async listByWork(workId: string) {
    return this.commentRepo
      .createQueryBuilder('comment')
      .leftJoin('comment.author', 'author')
      .select('comment.id', 'comment_id')
      .addSelect('comment.content', 'comment_content')
      .addSelect('comment.createdAt', 'comment_createdAt')
      .addSelect('comment.authorId', 'comment_authorId')
      .addSelect('author.id', 'author_id')
      .addSelect('author.username', 'author_username')
      .addSelect('author.avatarUrl', 'author_avatarUrl')
      .where('comment.workId = :workId', { workId })
      .orderBy('comment.createdAt', 'DESC')
      .getRawMany()
      .then((rows) =>
        rows.map((row) => ({
          id: row.comment_id,
          content: row.comment_content,
          createdAt: row.comment_createdAt,
          authorId: row.comment_authorId,
          author: row.author_id
            ? {
                id: row.author_id,
                username: row.author_username,
                avatarUrl: row.author_avatarUrl,
              }
            : undefined,
        })),
      );
  }

  async create(workId: string, authorId: string, dto: CreateWorkCommentDto) {
    const comment = this.commentRepo.create({
      content: dto.content,
      workId,
      authorId,
    });
    const saved = await this.commentRepo.save(comment);
    await this.workRepo.increment({ id: workId }, 'commentCount', 1);
    return saved;
  }
}
