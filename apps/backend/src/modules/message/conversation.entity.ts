import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

@Unique('UQ_conversations_user_pair', ['userAId', 'userBId'])
@Index('IDX_conversations_user_a_updated_at', ['userAId', 'updatedAt'])
@Index('IDX_conversations_user_b_updated_at', ['userBId', 'updatedAt'])
@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_a_id' })
  userAId: string;

  @Column({ name: 'user_b_id' })
  userBId: string;

  @Column({ name: 'last_message', type: 'text', nullable: true })
  lastMessage?: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
