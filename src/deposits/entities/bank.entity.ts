import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('bank')
export class Bank {
  @PrimaryGeneratedColumn({ name: 'BANK_ID' })
  bankId: number;

  @Column({ name: 'BANK_NAME', length: 255 })
  bankName: string;

  @Column({ name: 'BANK_CODE', length: 10 })
  bankCode: string;
}
