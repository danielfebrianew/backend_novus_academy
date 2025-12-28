import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
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

  // Get All Accounts (Dropdown List)
  async findAll() {
    // Karena di entity password & cookie select: false, aman langsung return
    return await this.repo.find({
      order: { username: 'ASC' }
    });
  }

  // Get One
  async findOne(id: number) {
    const account = await this.repo.findOne({ where: { id } });
    if (!account) throw new NotFoundException('Akun tidak ditemukan');
    return account;
  }

  // Update (Misal update cookie baru)
  async update(id: number, attrs: Partial<Account>) {
    const account = await this.findOne(id);
    Object.assign(account, attrs);
    return await this.repo.save(account);
  }

  // Delete
  async remove(id: number) {
    const account = await this.findOne(id);
    return await this.repo.remove(account);
  }
}