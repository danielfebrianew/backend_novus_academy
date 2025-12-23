import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
  UseInterceptors,
  InternalServerErrorException
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthenticatedGuard } from './guards/authenticated.guard';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';

@Controller('auth')
@UseInterceptors(ResponseInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Get('profile')
  getProfile(@Req() req: any) {
    return req.session.user;
  }

  @Throttle({ auth: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const user = await this.authService.login(loginDto);
    (req.session as any).user = user;

    return {
      message: 'Login berhasil',
      user: user
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

  @Post('logout')
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response
  ) {
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          reject(new InternalServerErrorException('Gagal logout'));
        } else {
          resolve();
        }
      });
    });

    res.clearCookie('connect.sid');

    return {
      message: 'Logout berhasil'
    };
  }
}