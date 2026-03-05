import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HistorySaldo } from './entities/history-saldo.entity';
import { HistorySaldoService } from './history-saldo.service';
import { HistorySaldoController } from './history-saldo.controller';

@Module({
  imports: [TypeOrmModule.forFeature([HistorySaldo])],
  controllers: [HistorySaldoController],
  providers: [HistorySaldoService],
  exports: [HistorySaldoService],
})
export class HistorySaldoModule {}
