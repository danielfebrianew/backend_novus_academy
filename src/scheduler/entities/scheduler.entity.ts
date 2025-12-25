import { Account } from 'src/accounts/entities/account.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';

export enum PostStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING', // Sedang diambil bot
  DONE = 'DONE',             // Sukses dipost
  FAILED = 'FAILED',
}

@Entity('scheduled_posts')
export class Scheduler {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'account_id', nullable: true })
  accountId: number;

  @ManyToOne(() => Account, (account) => account.schedulers, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Index()
  @Column({ type: 'timestamp' })
  scheduledTime: Date;

  @Column()
  username: string;

  @Column()
  videoUrl: string;

  @Column('text')
  content: string; // Caption + Hashtags

  @Column({ nullable: true })
  productId: string;

  @Column({
    type: 'enum',
    enum: PostStatus,
    default: PostStatus.PENDING,
  })
  statusPost: PostStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}