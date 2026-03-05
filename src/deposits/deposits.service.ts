import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Deposit } from './entities/deposit.entity';
import { Bank } from './entities/bank.entity';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { UploadAwsService } from 'src/upload-aws/upload-aws.service';

@Injectable()
export class DepositsService {
  constructor(
    @InjectRepository(Deposit)
    private repo: Repository<Deposit>,
    @InjectRepository(Bank)
    private bankRepo: Repository<Bank>,
    private readonly uploadAwsService: UploadAwsService,
  ) {}

  async findAllBanks() {
    return this.bankRepo.find({ order: { bankId: 'ASC' } });
  }

  async create(dto: CreateDepositDto, file: Express.Multer.File, userId: number) {
    if (!file) throw new BadRequestException('Bukti transfer wajib diupload');

    const bank = await this.bankRepo.findOne({ where: { bankCode: dto.bankCode } });
    if (!bank) throw new BadRequestException(`Bank dengan kode '${dto.bankCode}' tidak ditemukan`);

    const uploaded = await this.uploadAwsService.uploadFile(file);
    const unik = String(Math.floor(Math.random() * 900) + 100);

    const deposit = this.repo.create({
      userId,
      depositValue: dto.depositValue,
      depositUnik: unik,
      depositDescription: dto.depositDescription,
      depositBankTransfer: bank.bankId,
      depositCreateBy: userId,
      depositUpdateBy: userId,
      depositStatus: 0,
      buktiTransfer: uploaded.url,
    });

    return this.repo.save(deposit);
  }

  async findAllByUser(userId: number) {
    return this.repo.find({
      where: { userId },
      relations: ['bank'],
      order: { depositCreateDate: 'DESC' },
    });
  }

  async findOne(depositId: number, userId: number) {
    const deposit = await this.repo.findOne({
      where: { depositId },
      relations: ['bank'],
    });
    if (!deposit) throw new NotFoundException('Deposit tidak ditemukan');
    if (deposit.userId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke deposit ini');
    }
    return deposit;
  }

  async updateStatus(depositId: number, status: number, updatedBy: number) {
    const deposit = await this.repo.findOne({ where: { depositId } });
    if (!deposit) throw new NotFoundException('Deposit tidak ditemukan');

    deposit.depositStatus = status;
    deposit.depositUpdateBy = updatedBy;

    return this.repo.save(deposit);
  }
}
