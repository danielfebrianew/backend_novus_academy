import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

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

  @Index() // Biar query bot cepet
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