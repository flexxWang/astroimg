import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Follow } from './follow.entity';

@Injectable()
export class FollowService {
  constructor(
    @InjectRepository(Follow)
    private readonly followRepo: Repository<Follow>,
  ) {}

  async toggle(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    const existing = await this.followRepo.findOne({
      where: { followerId, followingId },
    });

    if (existing) {
      await this.followRepo.remove(existing);
      return { following: false };
    }

    const follow = this.followRepo.create({ followerId, followingId });
    await this.followRepo.save(follow);
    return { following: true };
  }

  async status(followerId: string, followingId: string) {
    const existing = await this.followRepo.findOne({
      where: { followerId, followingId },
    });
    return { following: Boolean(existing) };
  }
}
