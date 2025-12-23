import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
// HAPUS import JwtService

@Injectable()
export class AuthService {

    constructor(
        private usersService: UsersService,
    ) { }

    async register(registerDto: RegisterDto) {
        return this.usersService.create(registerDto);
    }

    async login(loginDto: LoginDto) {
        const user = await this.usersService.findByEmail(loginDto.email);

        if (!user) {
            throw new UnauthorizedException('Email atau password salah');
        }

        const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Email atau password salah');
        }

        return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        };
    }
}