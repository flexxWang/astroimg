import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  findByIdPublic(id: string) {
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
