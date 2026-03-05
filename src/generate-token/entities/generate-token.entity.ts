import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('access_tokens')
export class AccessToken {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column({ name: 'TOKEN', unique: true })
  token: string;

  @Column({ name: 'IS_USED', default: false })
  isUsed: boolean;

  @Column({ name: 'EXPIRES_AT', type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn({ name: 'CREATED_AT' })
  createdAt: Date;
}
