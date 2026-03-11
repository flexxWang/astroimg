import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity('likes')
@Unique(['userId', 'postId'])
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'post_id' })
  postId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
