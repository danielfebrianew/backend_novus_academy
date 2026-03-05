import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Bank } from './bank.entity';

@Entity('deposits')
export class Deposit {
  @PrimaryGeneratedColumn({ name: 'DEPOSIT_ID' })
  depositId: number;

  @Column({ name: 'USER_ID' })
  userId: number;

  @Column({ name: 'DEPOSIT_VALUE', type: 'decimal', precision: 20, scale: 2 })
  depositValue: number;

  @Column({ name: 'DEPOSIT_UNIK', length: 5 })
  depositUnik: string;

  @Column({ name: 'DEPOSIT_DESCRIPTION', length: 255 })
  depositDescription: string;

  @Column({ name: 'DEPOSIT_BANK_TRANSFER' })
  depositBankTransfer: number;

  @ManyToOne(() => Bank)
  @JoinColumn({ name: 'DEPOSIT_BANK_TRANSFER', referencedColumnName: 'bankId' })
  bank: Bank;

  @Column({ name: 'DEPOSIT_CREATE_BY' })
  depositCreateBy: number;

  @CreateDateColumn({ name: 'DEPOSIT_CREATE_DATE' })
  depositCreateDate: Date;

  @Column({ name: 'DEPOSIT_UPDATE_BY' })
  depositUpdateBy: number;

  @UpdateDateColumn({ name: 'DEPOSIT_UPDATE_DATE' })
  depositUpdateDate: Date;

  @Column({ name: 'DEPOSIT_STATUS' })
  depositStatus: number;

  @Column({ name: 'BUKTI_TRANSFER', length: 500, nullable: true })
  buktiTransfer: string;
}
