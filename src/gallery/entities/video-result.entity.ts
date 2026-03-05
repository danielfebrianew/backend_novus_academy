import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { VideoJob } from './video-job.entity';

@Entity('video_results')
export class VideoResult {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Index()
  @Column({ name: 'VIDEO_JOB_ID' })
  videoJobId: string;

  @ManyToOne(() => VideoJob, (job) => job.videos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'VIDEO_JOB_ID' })
  videoJob: VideoJob;

  @Column({ name: 'VARIATION_NUMBER' })
  variationNumber: number;

  @Column({ name: 'VIDEO_URL', length: 500 })
  videoUrl: string;

  @Column({ name: 'FILE_NAME' })
  fileName: string;

  @Column({ name: 'IS_SCHEDULED', default: false })
  isScheduled: boolean;

  @Column({ name: 'SCHEDULED_AT', type: 'timestamp', nullable: true })
  scheduledAt: Date;

  @CreateDateColumn({ name: 'CREATED_AT' })
  createdAt: Date;
}
