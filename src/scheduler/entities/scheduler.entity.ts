import { Account } from 'src/accounts/entities/account.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';

export enum PostStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  DONE = 'DONE',
  FAILED = 'FAILED',
}

@Entity('scheduled_posts')
export class Scheduler {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'ACCOUNT_ID', nullable: true })
  accountId: number;

  @ManyToOne(() => Account, (account) => account.schedulers, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ACCOUNT_ID' })
  account: Account;

  @Index()
  @Column({ name: 'SCHEDULED_TIME', type: 'timestamp' })
  scheduledTime: Date;

  @Column({ name: 'USERNAME' })
  username: string;

  @Column({ name: 'VIDEO_URL' })
  videoUrl: string;

  @Column({ name: 'CONTENT', type: 'text' })
  content: string;

  @Column({ name: 'PRODUCT_ID', nullable: true })
  productId: string;

  @Column({
    name: 'STATUS_POST',
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.PENDING,
  })
  statusPost: PostStatus;

  @CreateDateColumn({ name: 'CREATED_AT' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'UPDATED_AT' })
  updatedAt: Date;
}
