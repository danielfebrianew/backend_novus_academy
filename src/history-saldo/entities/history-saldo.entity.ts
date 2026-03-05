import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum HistorySaldoType {
  DEPOSIT = 'd',
  KREDIT = 'k',
}

export enum HistorySaldoStatus {
  PENDING = 1,
  APPROVED = 2,
}

@Entity('history_saldo')
export class HistorySaldo {
  @PrimaryGeneratedColumn({ name: 'HISTORY_SALDO_ID' })
  historySaldoId: number;

  @Column({ name: 'USER_ID' })
  userId: number;

  @Column({ name: 'HISTORY_SALDO_VALUE', type: 'decimal', precision: 20, scale: 2 })
  historySaldoValue: number;

  @Column({ name: 'HISTORY_SALDO_KETERANGAN', length: 255 })
  historySaldoKeterangan: string;

  @Column({ name: 'HISTORY_SALDO_TYPE', type: 'char', length: 1 })
  historySaldoType: HistorySaldoType;

  @Column({ name: 'HISTORY_SALDO_REF', type: 'varchar', length: 255, nullable: true })
  historySaldoRef: string | null;

  @Column({ name: 'HISTORY_SALDO_DATE', type: 'date' })
  historySaldoDate: Date;

  @Column({ name: 'HISTORY_SALDO_CREATE_BY' })
  historySaldoCreateBy: number;

  @CreateDateColumn({ name: 'HISTORY_SALDO_CREATE_DATE' })
  historySaldoCreateDate: Date;

  @Column({ name: 'HISTORY_SALDO_UPDATE_BY' })
  historySaldoUpdateBy: number;

  @UpdateDateColumn({ name: 'HISTORY_SALDO_UPDATE_DATE' })
  historySaldoUpdateDate: Date;

  @Column({ name: 'HISTORY_SALDO_STATUS' })
  historySaldoStatus: HistorySaldoStatus;
}
