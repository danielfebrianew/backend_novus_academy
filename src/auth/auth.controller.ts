import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  InternalServerErrorException,
  UnauthorizedException
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
@UseInterceptors(ResponseInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: any) {
    return req.user;
  }

  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const { accessToken, refreshToken, user } = await this.authService.login(loginDto);

    // Set refresh token di httpOnly cookie untuk web
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 hari
    });

    // Return access token di response body
    return {
      message: 'Login berhasil',
      accessToken, // Client simpan ini di memory
      refreshToken, // Electron simpan ini di electron-store
      user,
      expiresIn: 900, // 15 menit dalam detik
    };
  }

  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    const newUser = await this.authService.register(registerDto);

    return {
      message: 'Registrasi berhasil',
      user: newUser,
    };
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Body('refreshToken') bodyRefreshToken?: string // Untuk Electron
  ) {
    // Ambil dari cookie (web) atau body (Electron)
    const refreshToken = req.cookies?.['refresh_token'] || bodyRefreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token tidak ditemukan');
    }

    const { accessToken, user } = await this.authService.refresh(refreshToken);

    return {
      message: 'Token berhasil diperbarui',
      accessToken,
      user,
      expiresIn: 900,
    };
  }

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body('refreshToken') bodyRefreshToken?: string
  ) {
    const refreshToken = req.cookies?.['refresh_token'] || bodyRefreshToken;

    if (refreshToken) {
      try {
        await this.authService.invalidateRefreshToken(refreshToken);
      } catch (error) {
        // Log error tapi tetap lanjutkan logout
        console.error('Error invalidating refresh token:', error);
      }
    }

    res.clearCookie('refresh_token');

    return {
      message: 'Logout berhasil',
    };
  }
}