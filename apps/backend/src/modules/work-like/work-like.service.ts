import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkLike } from './work-like.entity';
import { Work } from '../work/work.entity';

@Injectable()
export class WorkLikeService {
  constructor(
    @InjectRepository(WorkLike)
    private readonly likeRepo: Repository<WorkLike>,
    @InjectRepository(Work)
    private readonly workRepo: Repository<Work>,
  ) {}

  async toggle(workId: string, userId: string) {
    const existing = await this.likeRepo.findOne({
      where: { workId, userId },
    });

    if (existing) {
      await this.likeRepo.delete({ id: existing.id });
      await this.workRepo.decrement({ id: workId }, 'likeCount', 1);
      const updated = await this.workRepo.findOne({ where: { id: workId } });
      return { liked: false, likeCount: updated?.likeCount ?? 0 };
    }

    await this.likeRepo.save({ workId, userId });
    await this.workRepo.increment({ id: workId }, 'likeCount', 1);
    const updated = await this.workRepo.findOne({ where: { id: workId } });
    return { liked: true, likeCount: updated?.likeCount ?? 0 };
  }

  async isLiked(workId: string, userId: string) {
    const existing = await this.likeRepo.findOne({
      where: { workId, userId },
    });
    return { liked: Boolean(existing) };
  }
}
