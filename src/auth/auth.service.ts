// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Register user baru
   */
  async register(registerDto: RegisterDto) {
    // Delegate ke UsersService untuk create user
    const newUser = await this.usersService.create(registerDto);

    // Return UserDto (sudah tanpa password)
    return newUser;
  }

  /**
   * Login dan generate JWT tokens
   */
  async login(loginDto: LoginDto) {
    // findByEmail sudah return full user dengan password (via query builder)
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // Payload untuk JWT
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // Generate access token (15 menit)
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: '15m',
    });

    // Generate refresh token (7 hari)
    const refreshToken = await this.jwtService.signAsync(
      { sub: user.id, type: 'refresh' },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }
    );

    // Simpan hashed refresh token di database
    await this.usersService.saveRefreshToken(user.id, refreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        name: user.name,
        email: user.email,
        credits: user.credits,
      },
    };
  }

  /**
   * Refresh access token menggunakan refresh token
   */
  async refresh(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      // Ambil user dari database (return UserDto)
      const userDto = await this.usersService.findOne(payload.sub);

      if (!userDto) {
        throw new UnauthorizedException('User tidak ditemukan');
      }

      // Verify refresh token masih valid di database
      const isValid = await this.usersService.verifyRefreshToken(userDto.id, refreshToken);

      if (!isValid) {
        throw new UnauthorizedException('Refresh token tidak valid');
      }

      // Generate new access token
      const newPayload = {
        sub: userDto.id,
        email: userDto.email,
        role: userDto.role,
      };

      const accessToken = await this.jwtService.signAsync(newPayload, {
        secret: this.configService.get<string>('JWT_SECRET'),
        expiresIn: '15m',
      });

      return {
        accessToken,
        user: {
          name: userDto.name,
          email: userDto.email,
          credits: userDto.credits,
        },
      };
    } catch (error) {
      throw new UnauthorizedException('Refresh token tidak valid atau expired');
    }
  }

  /**
   * Invalidate refresh token (logout)
   */
  async invalidateRefreshToken(refreshToken: string) {
    await this.usersService.removeRefreshToken(refreshToken);
  }
}