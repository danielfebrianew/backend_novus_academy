import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Relasi ke account tiktok (biasanya string ID dari API TikTok atau ID internal)
  @Column({ name: 'account_id' })
  @Index()
  accountId: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'end_date', type: 'date' })
  endDate: Date;

  // --- REVENUE SECTION (Decimal presisi tinggi) ---
  
  @Column({ name: 'live_revenue', type: 'decimal', precision: 15, scale: 2, default: 0 })
  liveRevenue: number;

  @Column({ name: 'video_revenue', type: 'decimal', precision: 15, scale: 2, default: 0 })
  videoRevenue: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  revenue: number; // Total Revenue

  @Column({ name: 'base_revenue', type: 'decimal', precision: 15, scale: 2, default: 0 })
  baseRevenue: number;

  @Column({ name: 'est_komisi', type: 'decimal', precision: 15, scale: 2, default: 0 })
  estKomisi: number;

  // --- TRAFFIC SECTION ---

  @Column({ type: 'int', default: 0 })
  sold: number;

  @Column({ type: 'int', default: 0 })
  view: number;

  @Column({ type: 'int', default: 0 })
  click: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}