import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity('ai_plan_sessions')
export class AiPlanSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'input_json', type: 'json' })
  inputJson: Record<string, any>;

  @Column({ name: 'output_json', type: 'json' })
  outputJson: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
