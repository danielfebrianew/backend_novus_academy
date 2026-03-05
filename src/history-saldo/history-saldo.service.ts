import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HistorySaldo, HistorySaldoType, HistorySaldoStatus } from './entities/history-saldo.entity';
import { HistorySaldoResponseDto } from './dto/history-saldo-response.dto';

@Injectable()
export class HistorySaldoService {
  constructor(
    @InjectRepository(HistorySaldo)
    private repo: Repository<HistorySaldo>,
  ) { }

  async create(data: {
    userId: number;
    value: number;
    keterangan: string;
    type: HistorySaldoType;
    ref?: string;
    createdBy: number;
  }) {
    const record = this.repo.create({
      userId: data.userId,
      historySaldoValue: data.value,
      historySaldoKeterangan: data.keterangan,
      historySaldoType: data.type,
      historySaldoRef: data.ref || null,
      historySaldoDate: new Date(),
      historySaldoCreateBy: data.createdBy,
      historySaldoUpdateBy: data.createdBy,
      historySaldoStatus: HistorySaldoStatus.PENDING,
    });

    return this.repo.save(record);
  }

  async findAllByUser(userId: number): Promise<HistorySaldoResponseDto[]> {
    const records = await this.repo.find({
      where: { userId },
      order: { historySaldoCreateDate: 'DESC' },
    });

    return records.map(record => this.toResponseDto(record));
  }

  async findOne(id: number, userId: number): Promise<HistorySaldoResponseDto> {
    const record = await this.repo.findOne({ where: { historySaldoId: id } });
    if (!record) throw new NotFoundException('History saldo tidak ditemukan');
    if (record.userId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses');
    }
    return this.toResponseDto(record);
  }

  async updateStatus(id: number, status: HistorySaldoStatus, updatedBy: number) {
    const record = await this.repo.findOne({ where: { historySaldoId: id } });
    if (!record) throw new NotFoundException('History saldo tidak ditemukan');

    record.historySaldoStatus = status;
    record.historySaldoUpdateBy = updatedBy;

    return this.repo.save(record);
  }

  private toResponseDto(record: HistorySaldo): HistorySaldoResponseDto {
    return new HistorySaldoResponseDto({
      historySaldoId: record.historySaldoId,
      userId: record.userId,
      historySaldoValue: record.historySaldoValue,
      historySaldoKeterangan: record.historySaldoKeterangan,
      historySaldoType: record.historySaldoType,
      historySaldoRef: record.historySaldoRef,
      historySaldoDate: record.historySaldoDate,
    });
  }
}
