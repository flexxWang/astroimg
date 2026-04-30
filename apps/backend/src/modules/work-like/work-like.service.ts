import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { WorkLike } from './work-like.entity';
import { Work } from '../work/work.entity';
import { AppException, ErrorCode } from '@/common/exceptions';

@Injectable()
export class WorkLikeService {
  constructor(
    @InjectRepository(WorkLike)
    private readonly likeRepo: Repository<WorkLike>,
    private readonly dataSource: DataSource,
  ) {}

  async toggle(workId: string, userId: string) {
    const updated = await this.dataSource.transaction(async (manager) => {
      const work = await manager
        .getRepository(Work)
        .createQueryBuilder('work')
        .setLock('pessimistic_write')
        .where('work.id = :workId', { workId })
        .select(['work.id', 'work.likeCount'])
        .getRawOne<{ work_id: string; work_likeCount: number }>();

      if (!work) {
        throw AppException.notFound(ErrorCode.NOT_FOUND);
      }

      const likeRepo = manager.getRepository(WorkLike);
      const existing = await likeRepo.findOne({
        where: { workId, userId },
      });

      if (existing) {
        await likeRepo.delete({ id: existing.id });
        await manager
          .getRepository(Work)
          .createQueryBuilder()
          .update(Work)
          .set({
            likeCount: () => 'GREATEST(like_count - 1, 0)',
          })
          .where('id = :id', { id: workId })
          .execute();

        return {
          liked: false,
          likeCount: Math.max(0, Number(work.work_likeCount ?? 0) - 1),
        };
      }

      try {
        await likeRepo.save(likeRepo.create({ workId, userId }));
      } catch (error) {
        if (
          error instanceof QueryFailedError &&
          this.isDuplicateLikeError(error)
        ) {
          return {
            liked: true,
            likeCount: Number(work.work_likeCount ?? 0),
          };
        }
        throw error;
      }

      await manager
        .getRepository(Work)
        .increment({ id: workId }, 'likeCount', 1);
      return {
        liked: true,
        likeCount: Number(work.work_likeCount ?? 0) + 1,
      };
    });

    return updated;
  }

  async isLiked(workId: string, userId: string) {
    const existing = await this.likeRepo.findOne({
      where: { workId, userId },
    });
    return { liked: Boolean(existing) };
  }

  private isDuplicateLikeError(error: unknown) {
    const driverError = (
      error as { driverError?: { code?: string; errno?: number } }
    ).driverError;
    return driverError?.code === 'ER_DUP_ENTRY' || driverError?.errno === 1062;
  }
}
