// src/users/users.service.ts
import { 
  Injectable, 
  NotFoundException, 
  ConflictException, 
  BadRequestException 
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from '../auth/dto/change-password.dto';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  // --- CREATE ---
  async create(createUserDto: CreateUserDto): Promise<UserDto> {
    // 1. Cek duplikasi email
    const existingUser = await this.usersRepository.findOneBy({ email: createUserDto.email });
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // 2. Hash Password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    // 3. Simpan
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
      // Role otomatis masuk dari DTO jika ada, atau default dari Entity
    });

    const savedUser = await this.usersRepository.save(user);
    return this.toResponseDto(savedUser);
  }

  // --- FIND BY EMAIL (KRUSIAL UNTUK AUTH) ---
  async findByEmail(email: string): Promise<User | null> {
    // KARENA @Exclude() DI ENTITY:
    // Kita wajib pakai createQueryBuilder + addSelect('user.password') 
    // agar field password ikut terambil untuk verifikasi login.
    return this.usersRepository.createQueryBuilder('user')
      .addSelect('user.password')
      .addSelect('user.refreshToken') // Tambahkan ini untuk refresh token operations
      .where('user.email = :email', { email })
      .getOne();
  }

  // --- READ ---
  async findAll(): Promise<UserDto[]> {
    const users = await this.usersRepository.find();
    return users.map((user) => this.toResponseDto(user));
  }

  async findOne(id: number): Promise<UserDto> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return this.toResponseDto(user);
  }

  // --- FIND ONE ENTITY (untuk internal use) ---
  private async findOneEntity(id: number): Promise<User> {
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.refreshToken')
      .where('user.id = :id', { id })
      .getOne();
    
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);
    return user;
  }

  // --- UPDATE PROFILE (Tanpa Password) ---
  async update(id: number, updateUserDto: UpdateUserDto): Promise<UserDto> {
    const user = await this.usersRepository.findOneBy({ id });
    if (!user) throw new NotFoundException(`User with ID ${id} not found`);

    // Merge data baru ke user yang lama
    const updatedUser = this.usersRepository.merge(user, updateUserDto);
    const savedUser = await this.usersRepository.save(updatedUser);

    return this.toResponseDto(savedUser);
  }

  // --- CHANGE PASSWORD ---
  async changePassword(id: number, dto: ChangePasswordDto): Promise<void> {
    // Ambil password lama (harus pakai query builder karena hidden)
    const user = await this.usersRepository.createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id })
      .getOne();

    if (!user) throw new NotFoundException('User not found');

    // Validasi password lama
    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Password lama salah');
    }

    // Hash password baru
    const salt = await bcrypt.genSalt();
    user.password = await bcrypt.hash(dto.newPassword, salt);

    await this.usersRepository.save(user);
  }

  // --- DELETE ---
  async remove(id: number): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  // ===== JWT REFRESH TOKEN METHODS =====

  /**
   * Simpan hashed refresh token ke database
   */
  async saveRefreshToken(userId: number, refreshToken: string): Promise<void> {
    // Hash refresh token sebelum disimpan untuk keamanan
    const hashedToken = await bcrypt.hash(refreshToken, 10);

    // Use query builder untuk avoid TypeScript type issues
    await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({ refreshToken: hashedToken })
      .where('id = :id', { id: userId })
      .execute();
  }

  /**
   * Verifikasi apakah refresh token valid untuk user tertentu
   */
  async verifyRefreshToken(userId: number, refreshToken: string): Promise<boolean> {
    const user = await this.findOneEntity(userId);

    if (!user.refreshToken) {
      return false;
    }

    // Compare refresh token dengan yang di database (hashed)
    return await bcrypt.compare(refreshToken, user.refreshToken);
  }

  /**
   * Hapus refresh token dari database (logout)
   */
  async removeRefreshToken(refreshToken: string): Promise<void> {
    // Cari semua user yang punya refresh token
    const users = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.refreshToken')
      .where('user.refreshToken IS NOT NULL')
      .getMany();

    // Cari user yang refresh token-nya match
    for (const user of users) {
      if (user.refreshToken) {
        const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
        if (isMatch) {
          // Use query builder to set NULL properly
          await this.usersRepository
            .createQueryBuilder()
            .update(User)
            .set({ refreshToken: () => 'NULL' })
            .where('id = :id', { id: user.id })
            .execute();
          return;
        }
      }
    }
  }

  /**
   * Alternative: Hapus refresh token berdasarkan user ID
   */
  async removeRefreshTokenByUserId(userId: number): Promise<void> {
    // Use query builder to set NULL properly
    await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({ refreshToken: () => 'NULL' })
      .where('id = :id', { id: userId })
      .execute();
  }

  // ===== CREDIT METHODS =====

  async getCredits(userId: number): Promise<number> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);
    return user.credits;
  }

  async deductCredits(userId: number, amount: number): Promise<number> {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const result = await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({ credits: () => 'credits - :amount' })
      .where('id = :id AND credits >= :amount', { id: userId, amount })
      .execute();

    if (result.affected === 0) {
      throw new BadRequestException('Credit tidak cukup');
    }

    return this.getCredits(userId);
  }

  async addCredits(userId: number, amount: number): Promise<number> {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const result = await this.usersRepository
      .createQueryBuilder()
      .update(User)
      .set({ credits: () => 'credits + :amount' })
      .where('id = :id', { id: userId, amount })
      .execute();

    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.getCredits(userId);
  }

  // --- MAPPER ---
  private toResponseDto(user: User): UserDto {
    return new UserDto({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      credits: user.credits,
      userLevelId: user.userLevelId,
      paketId: user.paketId,
      userWallet: user.userWallet,
      userBonus: user.userBonus,
      userPoint: user.userPoint,
      userStatus: user.userStatus,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  }
}