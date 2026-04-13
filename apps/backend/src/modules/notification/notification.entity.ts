import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type NotificationType = 'like' | 'comment' | 'follow';

@Index('IDX_notifications_user_created_at', ['userId', 'createdAt'])
@Index('IDX_notifications_user_read_created_at', ['userId', 'read', 'createdAt'])
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
