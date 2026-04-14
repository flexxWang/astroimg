import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { FollowService } from '../follow/follow.service';
import { PostService } from '../post/post.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly followService: FollowService,
    private readonly postService: PostService,
  ) {}

  async findByIdPublic(id: string) {
    return this.userRepo.findOne({
      where: { id },
      select: ['id', 'username', 'email', 'avatarUrl', 'bio', 'createdAt'],
    });
  }

  async findProfile(id: string) {
    const user = await this.findByIdPublic(id);
    if (!user) return null;

    const [postsCount, followersCount, followingCount, likesCount] =
      await Promise.all([
        this.postService.countByAuthor(id),
        this.followService.countFollowers(id),
        this.followService.countFollowing(id),
        this.postService.sumLikesByAuthor(id),
      ]);

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
