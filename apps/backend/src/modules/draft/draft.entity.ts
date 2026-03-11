import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('drafts')
export class Draft {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'author_id' })
  authorId: string;

  @Column({ length: 200, default: '' })
  title: string;

  @Column({ type: 'longtext', nullable: true })
  content: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
