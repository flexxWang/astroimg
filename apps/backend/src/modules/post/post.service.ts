import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './post.entity';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
  ) {}

  private baseQuery() {
    return this.postRepo
      .createQueryBuilder('post')
      .leftJoin('post.author', 'author')
      .select('post.id', 'post_id')
      .addSelect('post.title', 'post_title')
      .addSelect('post.content', 'post_content')
      .addSelect('post.authorId', 'post_authorId')
      .addSelect('post.createdAt', 'post_createdAt')
      .addSelect('post.likeCount', 'post_likeCount')
      .addSelect('post.commentCount', 'post_commentCount')
      .addSelect('author.id', 'author_id')
      .addSelect('author.username', 'author_username')
      .addSelect('author.avatarUrl', 'author_avatarUrl');
  }

  private mapPost(row: any) {
    return {
      id: row.post_id,
      title: row.post_title,
      content: row.post_content,
      authorId: row.post_authorId,
      createdAt: row.post_createdAt,
      likeCount: row.post_likeCount,
      commentCount: row.post_commentCount,
      author: row.author_id
        ? {
            id: row.author_id,
            username: row.author_username,
            avatarUrl: row.author_avatarUrl,
          }
        : undefined,
    };
  }

  create(authorId: string, dto: CreatePostDto) {
    const post = this.postRepo.create({
      title: dto.title,
      content: dto.content,
      authorId,
    });
    return this.postRepo.save(post);
  }

  async findAll(page = 1, pageSize = 20) {
    const [rows, total] = await Promise.all([
      this.baseQuery()
        .orderBy('post.createdAt', 'DESC')
        .offset((page - 1) * pageSize)
        .limit(pageSize)
        .getRawMany(),
      this.postRepo.count(),
    ]);
    const items = rows.map((row) => this.mapPost(row));
    return {
      items,
      page,
      pageSize,
      total,
      hasMore: page * pageSize < total,
    };
  }

  findById(id: string) {
    return this.baseQuery()
      .where('post.id = :id', { id })
      .getRawOne()
      .then((row) => (row ? this.mapPost(row) : null));
  }

  async findByAuthor(authorId: string, page = 1, pageSize = 20) {
    const [rows, total] = await Promise.all([
      this.baseQuery()
        .where('post.authorId = :authorId', { authorId })
        .orderBy('post.createdAt', 'DESC')
        .offset((page - 1) * pageSize)
        .limit(pageSize)
        .getRawMany(),
      this.postRepo.count({ where: { authorId } }),
    ]);
    const items = rows.map((row) => this.mapPost(row));
    return {
      items,
      page,
      pageSize,
      total,
      hasMore: page * pageSize < total,
    };
  }
}
