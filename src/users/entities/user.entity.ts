// src/users/entities/user.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import { History } from '../../history/entities/history.entity';

export enum UserRole {
  ADMIN = 'ROLE_ADMIN',
  USER = 'ROLE_USER',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ name: 'ID' })
  id: number;

  @Column({ name: 'NAME' })
  name: string;

  @Column({ name: 'EMAIL', unique: true })
  email: string;

  @Exclude()
  @Column({ name: 'PASSWORD' })
  password: string;

  @Column({
    name: 'ROLE',
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Exclude()
  @Column({ name: 'REFRESH_TOKEN', nullable: true, type: 'text' })
  refreshToken?: string;

  @Column({ name: 'CREDITS', type: 'int', default: 500 })
  credits: number;

  // --- Field dari PHP ---
  @Column({ name: 'USER_LEVEL_ID', nullable: true })
  userLevelId: number;

  @Column({ name: 'AKTIVASI_ID', length: 25, nullable: true })
  aktivasiId: string;

  @Column({ name: 'AKTIVASI_VALUE', type: 'decimal', precision: 20, scale: 2, nullable: true })
  aktivasiValue: number;

  @Column({ name: 'AKTIVASI_STATUS', type: 'tinyint', nullable: true })
  aktivasiStatus: number;

  @Column({ name: 'PAKET_ID', nullable: true })
  paketId: number;

  @Column({ name: 'USER_WALLET', type: 'decimal', precision: 20, scale: 2, nullable: true })
  userWallet: number;

  @Column({ name: 'USER_BONUS', type: 'decimal', precision: 20, scale: 2, nullable: true })
  userBonus: number;

  @Column({ name: 'USER_UPLINE', nullable: true })
  userUpline: number;

  @Column({ name: 'USER_SPONSOR', nullable: true })
  userSponsor: number;

  @Column({ name: 'USER_POSITION', nullable: true })
  userPosition: number;

  @Column({ name: 'USER_LEFT', nullable: true })
  userLeft: number;

  @Column({ name: 'USER_RIGHT', nullable: true })
  userRight: number;

  @Column({ name: 'USER_POINT', nullable: true })
  userPoint: number;

  @Column({ name: 'USER_IMPORT', nullable: true })
  userImport: number;

  @Column({ name: 'USER_PERINGKAT', length: 255, nullable: true })
  userPeringkat: string;

  @Column({ name: 'USER_LAST_ORDER', type: 'date', nullable: true })
  userLastOrder: Date;

  @Column({ name: 'USER_CRONJOB_RUN', default: 0 })
  userCronjobRun: number;

  @Column({ name: 'USER_CREATE_BY', nullable: true })
  userCreateBy: number;

  @Column({ name: 'USER_PIN_TRANSFER', length: 6, nullable: true })
  userPinTransfer: string;

  @Column({ name: 'USER_UPDATE_BY', nullable: true })
  userUpdateBy: number;

  @Column({ name: 'USER_STATUS', nullable: true })
  userStatus: number;

  @CreateDateColumn({ name: 'CREATED_AT' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'UPDATED_AT' })
  updatedAt: Date;

  @OneToMany(() => History, (history) => history.user)
  histories: History[];
}
