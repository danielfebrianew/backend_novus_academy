import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Scheduler, PostStatus } from './entities/scheduler.entity';

@Injectable()
export class SchedulerService {
  constructor(
    @InjectRepository(Scheduler)
    private repo: Repository<Scheduler>,
  ) {}

  // 1. Create
  async createSchedule(data: Partial<Scheduler>) {
    const schedule = this.repo.create(data);
    return await this.repo.save(schedule);
  }

  // 2. GET ALL PENDING
  async findAllPending() {
    return await this.repo.find({
      where: { statusPost: PostStatus.PENDING },
      order: { scheduledTime: 'ASC' } // Yang mau tayang duluan di atas
    });
  }

  // --- [BARU] 2.5 GET ALL COMPLETED (HISTORY) ---
  async findAllDone() {
    return await this.repo.find({
      where: { statusPost: PostStatus.DONE },
      order: { scheduledTime: 'DESC' } // Yang baru selesai tayang paling atas
    });
  }

  // 3. GET BY ID
  async findOne(id: number) {
    const post = await this.repo.findOne({ where: { id } });
    
    if (!post) {
        throw new NotFoundException(`Schedule dengan ID ${id} tidak ditemukan`);
    }

    return post;
  }

  // 4. GET READY (Logic 5 Menit)
  async findReadyToPost() {
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);

    const posts = await this.repo.find({
      where: {
        statusPost: PostStatus.PENDING,
        scheduledTime: LessThanOrEqual(fiveMinutesFromNow),
      },
      order: { scheduledTime: 'ASC' },
      take: 5,
    });

    if (posts.length > 0) {
        await this.repo.update(
            posts.map(p => p.id), 
            { statusPost: PostStatus.PROCESSING }
        );
    }

    return posts; 
  }

  // 5. Update Status
  async updateStatus(id: number, status: PostStatus) {
    const result = await this.repo.update(id, { statusPost: status });
    
    if (result.affected === 0) {
        throw new NotFoundException(`Jadwal ID ${id} tidak ditemukan.`);
    }
    
    return { id, newStatus: status }; 
  }
}