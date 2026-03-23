import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Work } from './work.entity';
import { WorkType } from './work-type.entity';
import { WorkDevice } from './work-device.entity';
import { CreateWorkDto } from './dto/create-work.dto';

const DEFAULT_TYPES = [
  { code: 'nebula', name: '星云' },
  { code: 'galaxy', name: '星系' },
  { code: 'planet', name: '行星' },
  { code: 'moon', name: '月面' },
  { code: 'comet', name: '彗星' },
  { code: 'solar', name: '太阳' },
  { code: 'deep-sky', name: '深空' },
  { code: 'wide-field', name: '广域' },
];

const DEFAULT_DEVICES = [
  { code: 'telescope', name: '天文望远镜' },
  { code: 'dslr', name: '单反/微单' },
  { code: 'astro-camera', name: '天文相机' },
  { code: 'planetary-camera', name: '行星相机' },
  { code: 'binoculars', name: '双筒望远镜' },
  { code: 'mobile', name: '手机' },
];

@Injectable()
export class WorkService implements OnModuleInit {
  constructor(
    @InjectRepository(Work)
    private readonly workRepo: Repository<Work>,
    @InjectRepository(WorkType)
    private readonly typeRepo: Repository<WorkType>,
    @InjectRepository(WorkDevice)
    private readonly deviceRepo: Repository<WorkDevice>,
  ) {}

  async onModuleInit() {
    const typeCount = await this.typeRepo.count();
    if (typeCount === 0) {
      await this.typeRepo.save(
        DEFAULT_TYPES.map((item) => this.typeRepo.create(item)),
      );
    }
    const deviceCount = await this.deviceRepo.count();
    if (deviceCount === 0) {
      await this.deviceRepo.save(
        DEFAULT_DEVICES.map((item) => this.deviceRepo.create(item)),
      );
    }
  }

  private baseQuery() {
    return this.workRepo
      .createQueryBuilder('work')
      .leftJoin('work.author', 'author')
      .leftJoin('work.type', 'type')
      .leftJoin('work.device', 'device')
      .select('work.id', 'work_id')
      .addSelect('work.title', 'work_title')
      .addSelect('work.description', 'work_description')
      .addSelect('work.imageUrl', 'work_imageUrl')
      .addSelect('work.imageUrls', 'work_imageUrls')
      .addSelect('work.videoUrl', 'work_videoUrl')
      .addSelect('work.authorId', 'work_authorId')
      .addSelect('work.createdAt', 'work_createdAt')
      .addSelect('work.likeCount', 'work_likeCount')
      .addSelect('work.commentCount', 'work_commentCount')
      .addSelect('type.id', 'type_id')
      .addSelect('type.name', 'type_name')
      .addSelect('device.id', 'device_id')
      .addSelect('device.name', 'device_name')
      .addSelect('author.id', 'author_id')
      .addSelect('author.username', 'author_username')
      .addSelect('author.avatarUrl', 'author_avatarUrl');
  }

  private mapWork(row: any) {
    let parsedImages: string[] = [];
    if (row.work_image_urls && Array.isArray(row.work_image_urls)) {
      parsedImages = row.work_image_urls;
    } else if (row.work_imageUrls && Array.isArray(row.work_imageUrls)) {
      parsedImages = row.work_imageUrls;
    } else if (typeof row.work_imageUrls === "string") {
      try {
        const value = JSON.parse(row.work_imageUrls);
        if (Array.isArray(value)) parsedImages = value;
      } catch {
        parsedImages = [];
      }
    } else if (typeof row.work_image_urls === "string") {
      try {
        const value = JSON.parse(row.work_image_urls);
        if (Array.isArray(value)) parsedImages = value;
      } catch {
        parsedImages = [];
      }
    }
    const imageUrls =
      parsedImages.length > 0
        ? parsedImages
        : row.work_imageUrl
          ? [row.work_imageUrl]
          : [];
    return {
      id: row.work_id,
      title: row.work_title,
      description: row.work_description,
      imageUrl: row.work_imageUrl,
      imageUrls,
      videoUrl: row.work_videoUrl,
      createdAt: row.work_createdAt,
      authorId: row.work_authorId,
      likeCount: row.work_likeCount,
      commentCount: row.work_commentCount,
      author: row.author_id
        ? {
            id: row.author_id,
            username: row.author_username,
            avatarUrl: row.author_avatarUrl,
          }
        : undefined,
      type: row.type_id ? { id: row.type_id, name: row.type_name } : undefined,
      device: row.device_id
        ? { id: row.device_id, name: row.device_name }
        : undefined,
    };
  }

  async list(page = 1, pageSize = 20) {
    const [rows, total] = await Promise.all([
      this.baseQuery()
        .orderBy('work.createdAt', 'DESC')
        .offset((page - 1) * pageSize)
        .limit(pageSize)
        .getRawMany(),
      this.workRepo.count(),
    ]);
    const items = rows.map((row) => this.mapWork(row));
    return {
      items,
      page,
      pageSize,
      total,
      hasMore: page * pageSize < total,
    };
  }

  async listByAuthor(authorId: string, page = 1, pageSize = 20) {
    const [rows, total] = await Promise.all([
      this.baseQuery()
        .where('work.authorId = :authorId', { authorId })
        .orderBy('work.createdAt', 'DESC')
        .offset((page - 1) * pageSize)
        .limit(pageSize)
        .getRawMany(),
      this.workRepo.count({ where: { authorId } }),
    ]);
    const items = rows.map((row) => this.mapWork(row));
    return {
      items,
      page,
      pageSize,
      total,
      hasMore: page * pageSize < total,
    };
  }

  async create(authorId: string, dto: CreateWorkDto) {
    const typeId = dto.typeId;
    const deviceId = dto.deviceId;

    if (typeId) {
      const exists = await this.typeRepo.findOne({ where: { id: typeId } });
      if (!exists) {
        throw new BadRequestException('无效的作品类型');
      }
    }

    if (deviceId) {
      const exists = await this.deviceRepo.findOne({ where: { id: deviceId } });
      if (!exists) {
        throw new BadRequestException('无效的设备类型');
      }
    }

    if (dto.mediaType === 'image') {
      if (!dto.imageUrls?.length) {
        throw new BadRequestException('作品图片不能为空');
      }
      if (dto.videoUrl) {
        throw new BadRequestException('图片作品不能包含视频');
      }
    }
    if (dto.mediaType === 'video') {
      if (!dto.videoUrl) {
        throw new BadRequestException('作品视频不能为空');
      }
      if (dto.imageUrls?.length) {
        throw new BadRequestException('视频作品不能包含图片');
      }
    }

    const work = this.workRepo.create({
      title: dto.title,
      description: dto.description,
      imageUrl: dto.imageUrls?.[0],
      imageUrls: dto.imageUrls,
      videoUrl: dto.videoUrl,
      authorId,
      typeId,
      deviceId,
    });
    return this.workRepo.save(work);
  }

  async findById(id: string) {
    const row = await this.baseQuery()
      .where('work.id = :id', { id })
      .getRawOne();
    return row ? this.mapWork(row) : null;
  }

  listTypes() {
    return this.typeRepo.find({ order: { name: 'ASC' } });
  }

  listDevices() {
    return this.deviceRepo.find({ order: { name: 'ASC' } });
  }
}
