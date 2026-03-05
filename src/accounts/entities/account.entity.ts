import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Scheduler } from '../../scheduler/entities/scheduler.entity';

@Entity('list_accounts')
export class Account {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'USER_ID', nullable: true })
  userId: number;

  @Column({ name: 'USERNAME', unique: true })
  username: string;

  @Column({ name: 'EMAIL', nullable: true })
  email: string;

  @Column({ name: 'PASSWORD', select: false, nullable: true })
  password: string;

  @Column({ name: 'STATUS', default: 'ACTIVE' })
  status: string;

  @Column({ name: 'COOKIE', type: 'text', select: false, nullable: true })
  cookie: string;

  @OneToMany(() => Scheduler, (scheduler) => scheduler.account)
  schedulers: Scheduler[];

  @CreateDateColumn({ name: 'CREATED_AT' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'UPDATED_AT' })
  updatedAt: Date;
}
