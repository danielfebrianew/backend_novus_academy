import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Scheduler } from '../../scheduler/entities/scheduler.entity';

@Entity('list_accounts') // Nama tabel di database
export class Account {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id', nullable: true }) // ID user pemilik dashboard (relasi ke Users table kamu)
  userId: number;

  @Column({ unique: true })
  username: string;

  @Column({ nullable: true })
  email: string;

  // Select: false agar password & cookie tidak ikut terkirim saat GET (Security)
  @Column({ select: false, nullable: true })
  password: string;

  @Column({ default: 'ACTIVE' }) // ACTIVE, SUSPENDED, EXPIRED
  status: string;

  @Column({ type: 'text', select: false, nullable: true })
  cookie: string;

  @OneToMany(() => Scheduler, (scheduler) => scheduler.account)
  schedulers: Scheduler[];

  @CreateDateColumn({ name: 'create_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'update_at' })
  updatedAt: Date;
}