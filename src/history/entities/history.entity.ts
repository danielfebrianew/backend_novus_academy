import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ActionType {
  UPLOAD = 'UPLOAD_IMAGES',
  GEN_TEXT = 'GENERATE_TEXT',
  GEN_VIDEO = 'GENERATE_VIDEO',
}

@Entity('histories')
export class History {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ActionType,
  })
  actionType: ActionType;

  // Menyimpan Input (Body Request)
  @Column({ type: 'json', nullable: true })
  inputPayload: any;

  // Menyimpan Output (Response Data)
  @Column({ type: 'json', nullable: true })
  outputResult: any;

  @CreateDateColumn()
  createdAt: Date;

  // Relasi ke User
  @ManyToOne(() => User, (user) => user.histories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: number; // Atau string jika user ID mu UUID
}