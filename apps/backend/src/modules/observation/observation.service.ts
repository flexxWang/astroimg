import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObservationPoint } from './observation.entity';
import { CreateObservationDto } from './dto/create-observation.dto';

@Injectable()
export class ObservationService {
  constructor(
    @InjectRepository(ObservationPoint)
    private readonly obsRepo: Repository<ObservationPoint>,
  ) {}

  list() {
    return this.obsRepo.find({ order: { createdAt: 'DESC' } });
  }

  create(authorId: string, dto: CreateObservationDto) {
    const point = this.obsRepo.create({
      ...dto,
      authorId,
    });
    return this.obsRepo.save(point);
  }
}
