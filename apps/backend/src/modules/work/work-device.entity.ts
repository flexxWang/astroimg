import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('work_devices')
export class WorkDevice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, length: 64 })
  code: string;

  @Column({ length: 64 })
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
