import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum ActionType {
  UPLOAD = 'UPLOAD_IMAGES',
  GEN_TEXT = 'GENERATE_TEXT',
  GEN_VIDEO = 'GENERATE_VIDEO',
}

@Entity('histories')
export class History {
  @PrimaryGeneratedColumn('uuid', { name: 'ID' })
  id: string;

  @Column({
    name: 'ACTION_TYPE',
    type: 'enum',
    enum: ActionType,
  })
  actionType: ActionType;

  @Column({ name: 'INPUT_PAYLOAD', type: 'json', nullable: true })
  inputPayload: any;

  @Column({ name: 'OUTPUT_RESULT', type: 'json', nullable: true })
  outputResult: any;

  @CreateDateColumn({ name: 'CREATED_AT' })
  createdAt: Date;

  @ManyToOne(() => User, (user) => user.histories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'USER_ID' })
  user: User;

  @Column({ name: 'USER_ID' })
  userId: number;
}
