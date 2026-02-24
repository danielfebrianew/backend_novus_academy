import { Controller, Post, Body, UseGuards, HttpCode } from '@nestjs/common';
import { GenerateTokenService } from './generate_token.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('generate-token')
export class GenerateTokenController {
  constructor(private readonly generateTokenService: GenerateTokenService) {}

  /**
   * POST /generate-token/generate
   * ADMIN ONLY — Generate token baru
   * Protected by JwtAuthGuard
   */
  @Post('generate')
  @UseGuards(JwtAuthGuard)
  async generate() {
    const result = await this.generateTokenService.generateToken();
    return {
      message: 'Token berhasil dibuat',
      data: {
        token: result.token,
        expiresAt: result.expiresAt,
        expiresIn: '20 menit',
      },
    };
  }

  /**
   * POST /generate-token/validate
   * PUBLIC — User input token untuk masuk
   */
  @Post('validate')
  @HttpCode(200)
  async validate(@Body() body: { token: string }) {
    await this.generateTokenService.validateToken(body.token);
    return {
      status: 'success',
      message: 'Token valid. Selamat datang!',
    };
  }
}
