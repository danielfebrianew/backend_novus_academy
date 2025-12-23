import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { History, ActionType } from './entities/history.entity';

@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(History)
    private historyRepository: Repository<History>,
  ) {}

  async logActivity(userId: number, actionType: ActionType, input: any, output: any) {
    const history = this.historyRepository.create({
      userId,
      actionType,
      inputPayload: input,
      outputResult: output,
    });
    return this.historyRepository.save(history);
  }

  async getUserHistory(userId: number) {
    return this.historyRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' }, // Urutkan dari yang terbaru
    });
  }
}