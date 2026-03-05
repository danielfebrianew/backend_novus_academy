import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum NotificationType {
  VIDEO_SUCCESS = 'video_success',
  VIDEO_FAILED = 'video_failed',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Index()
  @Column({ name: 'USER_ID' })
  userId: number;

  @Column({ name: 'TYPE', type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ name: 'TITLE', length: 255 })
  title: string;

  @Column({ name: 'MESSAGE', type: 'text' })
  message: string;

  @Column({ name: 'JOB_ID', type: 'varchar', length: 100, nullable: true })
  jobId: string | null;

  @Column({ name: 'IS_READ', default: false })
  isRead: boolean;

  @CreateDateColumn({ name: 'CREATED_AT' })
  createdAt: Date;
}
