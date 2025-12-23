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
    ) { }

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

    // --- MAPPER ---
    private toResponseDto(user: User): UserDto {
        return new UserDto({
            id: user.id,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            referralCode: user.referralCode,
            role: user.role, // Pastikan UserDto punya field role juga
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        });
    }
}