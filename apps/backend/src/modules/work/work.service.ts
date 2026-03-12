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
      await this.typeRepo.save(DEFAULT_TYPES.map((item) => this.typeRepo.create(item)));
    }
    const deviceCount = await this.deviceRepo.count();
    if (deviceCount === 0) {
      await this.deviceRepo.save(DEFAULT_DEVICES.map((item) => this.deviceRepo.create(item)));
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
      .addSelect('work.authorId', 'work_authorId')
      .addSelect('work.createdAt', 'work_createdAt')
      .addSelect('type.id', 'type_id')
      .addSelect('type.name', 'type_name')
      .addSelect('device.id', 'device_id')
      .addSelect('device.name', 'device_name')
      .addSelect('author.id', 'author_id')
      .addSelect('author.username', 'author_username')
      .addSelect('author.avatarUrl', 'author_avatarUrl');
  }

  private mapWork(row: any) {
    return {
      id: row.work_id,
      title: row.work_title,
      description: row.work_description,
      imageUrl: row.work_imageUrl,
      createdAt: row.work_createdAt,
      authorId: row.work_authorId,
      author: row.author_id
        ? {
            id: row.author_id,
            username: row.author_username,
            avatarUrl: row.author_avatarUrl,
          }
        : undefined,
      type: row.type_id ? { id: row.type_id, name: row.type_name } : undefined,
      device: row.device_id ? { id: row.device_id, name: row.device_name } : undefined,
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

  async create(authorId: string, dto: CreateWorkDto) {
    let typeId = dto.typeId;
    let deviceId = dto.deviceId;

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

    const work = this.workRepo.create({
      title: dto.title,
      description: dto.description,
      imageUrl: dto.imageUrl,
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
