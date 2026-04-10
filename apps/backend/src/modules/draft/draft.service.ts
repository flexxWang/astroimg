import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Draft } from './draft.entity';
import { CreateDraftDto } from './dto/create-draft.dto';
import { UpdateDraftDto } from './dto/update-draft.dto';
import { Post } from '../post/post.entity';
import { AppException, ErrorCode } from '@/common/exceptions';

@Injectable()
export class DraftService {
  constructor(
    @InjectRepository(Draft)
    private readonly draftRepo: Repository<Draft>,
    @InjectRepository(Post)
    private readonly postRepo: Repository<Post>,
  ) {}

  list(authorId: string) {
    return this.draftRepo.find({
      where: { authorId },
      order: { updatedAt: 'DESC' },
    });
  }

  async findById(authorId: string, id: string) {
    const draft = await this.draftRepo.findOne({ where: { id, authorId } });
    if (!draft) {
      throw AppException.notFound(ErrorCode.DRAFT_NOT_FOUND);
    }
    return draft;
  }

  create(authorId: string, dto: CreateDraftDto) {
    const draft = this.draftRepo.create({
      authorId,
      title: dto.title || '',
      content: dto.content || '',
    });
    return this.draftRepo.save(draft);
  }

  async update(authorId: string, id: string, dto: UpdateDraftDto) {
    const draft = await this.findById(authorId, id);
    if (dto.title !== undefined) draft.title = dto.title;
    if (dto.content !== undefined) draft.content = dto.content;
    return this.draftRepo.save(draft);
  }

  async publish(authorId: string, id: string) {
    const draft = await this.findById(authorId, id);
    const post = this.postRepo.create({
      title: draft.title || '未命名',
      content: draft.content || '',
      authorId: draft.authorId,
    });
    const saved = await this.postRepo.save(post);
    await this.draftRepo.remove(draft);
    return saved;
  }
}
