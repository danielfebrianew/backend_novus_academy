import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, Index } from 'typeorm';
import { VideoResult } from './video-result.entity';

export enum VideoJobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
}

@Entity('video_jobs')
export class VideoJob {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Index()
  @Column({ name: 'USER_ID' })
  userId: number;

  @Index({ unique: true })
  @Column({ name: 'JOB_ID', length: 50 })
  jobId: string;

  @Column({ name: 'PRODUCT_NAME' })
  productName: string;

  @Column({ name: 'SCRIPT', type: 'text' })
  script: string;

  @Column({ name: 'VOICE_GENDER', length: 10, default: '-' })
  voiceGender: string;

  @Column({ name: 'PROMPT_COUNT' })
  promptCount: number;

  @Column({ name: 'TARGET_COUNT' })
  targetCount: number;

  @Column({ name: 'PROMPTS', type: 'json' })
  prompts: string[];

  @Column({ name: 'INPUT_IMAGES', type: 'json' })
  inputImages: string[];

  @Column({ name: 'THUMBNAIL_URL', length: 500, nullable: true })
  thumbnailUrl: string;

  @Column({
    name: 'STATUS',
    type: 'enum',
    enum: VideoJobStatus,
    default: VideoJobStatus.PENDING,
  })
  status: VideoJobStatus;

  @Column({ name: 'IS_PRO', default: false })
  isPro: boolean;

  @Column({ name: 'AUDIO_URL', length: 500, nullable: true })
  audioUrl: string;

  @Column({ name: 'FAIL_MSG', type: 'text', nullable: true })
  failMsg: string | null;

  @CreateDateColumn({ name: 'CREATED_AT' })
  createdAt: Date;

  @OneToMany(() => VideoResult, (result) => result.videoJob, { cascade: true })
  videos: VideoResult[];
}
