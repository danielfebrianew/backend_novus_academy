import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Import ini
import { SchedulerService } from './scheduler.service';
import { SchedulerController } from './scheduler.controller';
import { Scheduler } from './entities/scheduler.entity'; // Import Entity

@Module({
  imports: [TypeOrmModule.forFeature([Scheduler])], // <--- WAJIB
  controllers: [SchedulerController],
  providers: [SchedulerService],
})
export class SchedulerModule {}