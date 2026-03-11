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

  create(authorId: string, dto: CreatePostDto) {
    const post = this.postRepo.create({
      title: dto.title,
      content: dto.content,
      authorId,
    });
    return this.postRepo.save(post);
  }

  findAll(page = 1, pageSize = 20) {
    return this.postRepo
      .createQueryBuilder('post')
      .leftJoin('post.author', 'author')
      .select([
        'post.id',
        'post.title',
        'post.content',
        'post.authorId',
        'post.createdAt',
        'post.likeCount',
        'post.commentCount',
        'author.id',
        'author.username',
        'author.avatarUrl',
      ])
      .orderBy('post.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();
  }

  findById(id: string) {
    return this.postRepo
      .createQueryBuilder('post')
      .leftJoin('post.author', 'author')
      .select([
        'post.id',
        'post.title',
        'post.content',
        'post.authorId',
        'post.createdAt',
        'post.likeCount',
        'post.commentCount',
        'author.id',
        'author.username',
        'author.avatarUrl',
      ])
      .where('post.id = :id', { id })
      .getOne();
  }

  findByAuthor(authorId: string, page = 1, pageSize = 20) {
    return this.postRepo
      .createQueryBuilder('post')
      .leftJoin('post.author', 'author')
      .select([
        'post.id',
        'post.title',
        'post.content',
        'post.authorId',
        'post.createdAt',
        'post.likeCount',
        'post.commentCount',
        'author.id',
        'author.username',
        'author.avatarUrl',
      ])
      .where('post.authorId = :authorId', { authorId })
      .orderBy('post.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getMany();
  }
}
