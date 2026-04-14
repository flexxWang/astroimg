import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkLike } from './work-like.entity';
import { WorkService } from '../work/work.service';

@Injectable()
export class WorkLikeService {
  constructor(
    @InjectRepository(WorkLike)
    private readonly likeRepo: Repository<WorkLike>,
    private readonly workService: WorkService,
  ) {}

  async toggle(workId: string, userId: string) {
    const existing = await this.likeRepo.findOne({
      where: { workId, userId },
    });

    if (existing) {
      await this.likeRepo.delete({ id: existing.id });
      const likeCount = await this.workService.decrementLikeCount(workId);
      return { liked: false, likeCount };
    }

    await this.likeRepo.save({ workId, userId });
    const likeCount = await this.workService.incrementLikeCount(workId);
    return { liked: true, likeCount };
  }

  async isLiked(workId: string, userId: string) {
    const existing = await this.likeRepo.findOne({
      where: { workId, userId },
    });
    return { liked: Boolean(existing) };
  }
}
