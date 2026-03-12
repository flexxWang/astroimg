import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type NotificationType = 'like' | 'comment' | 'follow';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'actor_id' })
  actorId: string;

  @Column({ name: 'actor_name', length: 64, nullable: true })
  actorName?: string;

  @Column({ type: 'varchar', length: 20 })
  type: NotificationType;

  @Column({ name: 'post_id', nullable: true })
  postId?: string;

  @Column({ type: 'boolean', default: false })
  read: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
