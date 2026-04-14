import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { AppException, ErrorCode } from '@/common/exceptions';

type PostListRow = {
  post_id: string;
  post_title: string;
  post_content: string;
  post_authorId: string;
  post_createdAt: Date;
  post_likeCount: number;
  post_commentCount: number;
  author_id: string | null;
  author_username: string | null;
  author_avatarUrl: string | null;
};

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

  private mapPost(row: PostListRow) {
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

  private applyKeyword(
    qb: ReturnType<PostService['baseQuery']>,
    keyword?: string,
  ) {
    if (!keyword) return qb;
    return qb.andWhere(
      '(post.title LIKE :keyword OR post.content LIKE :keyword)',
      {
        keyword: `%${keyword}%`,
      },
    );
  }

  async findAll(page = 1, pageSize = 20, keyword?: string) {
    const [rows, total] = await Promise.all([
      this.applyKeyword(this.baseQuery(), keyword)
        .orderBy('post.createdAt', 'DESC')
        .offset((page - 1) * pageSize)
        .limit(pageSize)
        .getRawMany<PostListRow>(),
      this.applyKeyword(
        this.postRepo.createQueryBuilder('post'),
        keyword,
      ).getCount(),
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
      .getRawOne<PostListRow>()
      .then((row) => (row ? this.mapPost(row) : null));
  }

  async findByAuthor(authorId: string, page = 1, pageSize = 20) {
    const [rows, total] = await Promise.all([
      this.baseQuery()
        .where('post.authorId = :authorId', { authorId })
        .orderBy('post.createdAt', 'DESC')
        .offset((page - 1) * pageSize)
        .limit(pageSize)
        .getRawMany<PostListRow>(),
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

  countByAuthor(authorId: string) {
    return this.postRepo.count({ where: { authorId } });
  }

  findEntityById(id: string) {
    return this.postRepo.findOne({ where: { id } });
  }

  async sumLikesByAuthor(authorId: string) {
    const row = await this.postRepo
      .createQueryBuilder('post')
      .select('COALESCE(SUM(post.likeCount), 0)', 'total')
      .where('post.authorId = :authorId', { authorId })
      .getRawOne<{ total: string | number | null }>();

    return Number(row?.total ?? 0);
  }

  async incrementCommentCount(postId: string) {
    await this.postRepo.increment({ id: postId }, 'commentCount', 1);
  }

  async incrementLikeCount(postId: string) {
    const post = await this.findEntityById(postId);
    if (!post) {
      throw AppException.notFound(ErrorCode.POST_NOT_FOUND);
    }

    post.likeCount = (post.likeCount || 0) + 1;
    await this.postRepo.save(post);
    return {
      authorId: post.authorId,
      likeCount: post.likeCount,
    };
  }

  async decrementLikeCount(postId: string) {
    const post = await this.findEntityById(postId);
    if (!post) {
      throw AppException.notFound(ErrorCode.POST_NOT_FOUND);
    }

    post.likeCount = Math.max(0, (post.likeCount || 0) - 1);
    await this.postRepo.save(post);
    return {
      authorId: post.authorId,
      likeCount: post.likeCount,
    };
  }
}
