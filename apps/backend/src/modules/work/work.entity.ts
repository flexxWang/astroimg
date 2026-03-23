import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../user/user.entity';
import { WorkType } from './work-type.entity';
import { WorkDevice } from './work-device.entity';

@Entity('works')
export class Work {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'image_url', length: 500, nullable: true })
  imageUrl?: string;

  @Column({ name: 'image_urls', type: 'json', nullable: true })
  imageUrls?: string[];

  @Column({ name: 'video_url', length: 500, nullable: true })
  videoUrl?: string;

  @ManyToOne(() => WorkType, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'type_id' })
  type: WorkType;

  @Column({ name: 'type_id', nullable: true })
  typeId?: string;

  @ManyToOne(() => WorkDevice, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'device_id' })
  device: WorkDevice;

  @Column({ name: 'device_id', nullable: true })
  deviceId?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column({ name: 'author_id' })
  authorId: string;

  @Column({ name: 'like_count', default: 0 })
  likeCount: number;

  @Column({ name: 'comment_count', default: 0 })
  commentCount: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
