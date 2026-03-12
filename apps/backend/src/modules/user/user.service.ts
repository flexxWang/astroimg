import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Follow } from '../follow/follow.entity';
import { Post } from '../post/post.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Follow)
    private readonly followRepo: Repository<Follow>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
  ) {}

  async findByIdPublic(id: string) {
    return this.userRepo.findOne({
      where: { id },
      select: [
        'id',
        'username',
        'email',
        'avatarUrl',
        'bio',
        'createdAt',
      ],
    });
  }

  async findProfile(id: string) {
    const user = await this.findByIdPublic(id);
    if (!user) return null;

    const [postsCount, followersCount, followingCount, likesRow] =
      await Promise.all([
        this.postRepo.count({ where: { authorId: id } }),
        this.followRepo.count({ where: { followingId: id } }),
        this.followRepo.count({ where: { followerId: id } }),
        this.postRepo
          .createQueryBuilder('post')
          .select('COALESCE(SUM(post.likeCount), 0)', 'total')
          .where('post.authorId = :id', { id })
          .getRawOne(),
      ]);

    const likesCount = Number(likesRow?.total ?? 0);

    return {
      ...user,
      stats: {
        posts: postsCount,
        followers: followersCount,
        following: followingCount,
        likes: likesCount,
      },
    };
  }

  findByUsernameOrEmail(usernameOrEmail: string, withPassword = false) {
    return this.userRepo.findOne({
      where: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
      select: withPassword
        ? undefined
        : ['id', 'username', 'email', 'avatarUrl', 'bio', 'createdAt'],
    });
  }

  create(data: Partial<User>) {
    const user = this.userRepo.create(data);
    return this.userRepo.save(user);
  }

  search(keyword?: string) {
    if (!keyword) return [];
    return this.userRepo
      .createQueryBuilder('user')
      .select(['user.id', 'user.username', 'user.avatarUrl'])
      .where('user.username LIKE :keyword', { keyword: `%${keyword}%` })
      .limit(10)
      .getMany();
  }
}
