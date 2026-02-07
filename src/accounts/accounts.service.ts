import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from './entities/account.entity';

@Injectable()
export class AccountsService {
  constructor(
    @InjectRepository(Account)
    private repo: Repository<Account>,
  ) {}

  // Create Account Baru
  async create(data: Partial<Account>, userId: number) {
    // 1. Cek Duplikat
    const existing = await this.repo.findOne({ where: { username: data.username } });
    if (existing) {
      throw new ConflictException(`Username '${data.username}' sudah terdaftar`);
    }

    // 2. Gabungkan data akun dengan userId saat create
    const account = this.repo.create({
      ...data,
      userId: userId, // Pastikan di Entity nama kolomnya 'userId'
    });
    return await this.repo.save(account);
  }

  // Get All Accounts (Dropdown List) - HANYA MILIK USER SENDIRI
  async findAll(userId: number) {
    return await this.repo.find({
      where: { userId },
      order: { username: 'ASC' }
    });
  }

  // Get One - DENGAN VALIDASI OWNERSHIP
  async findOne(id: number, userId: number) {
    const account = await this.repo.findOne({ where: { id } });
    if (!account) throw new NotFoundException('Akun tidak ditemukan');

    // Validasi ownership
    if (account.userId !== userId) {
      throw new ForbiddenException('Anda tidak memiliki akses ke akun ini');
    }

    return account;
  }

  // Update (Misal update cookie baru) - DENGAN VALIDASI OWNERSHIP
  async update(id: number, attrs: Partial<Account>, userId: number) {
    const account = await this.findOne(id, userId);
    Object.assign(account, attrs);
    return await this.repo.save(account);
  }

  // Delete - DENGAN VALIDASI OWNERSHIP
  async remove(id: number, userId: number) {
    const account = await this.findOne(id, userId);
    return await this.repo.remove(account);
  }
}