import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { AccessToken } from './entities/generate-token.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class GenerateTokenService {
  constructor(
    @InjectRepository(AccessToken)
    private readonly tokenRepo: Repository<AccessToken>,
  ) {}

  /**
   * Generate token baru (dipanggil admin)
   * Token = 32 karakter hex random
   * Expired = 20 menit dari sekarang
   */
  async generateToken(): Promise<{ token: string; expiresAt: Date }> {
    const token = randomBytes(16).toString('hex');
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000);

    const accessToken = this.tokenRepo.create({
      token,
      expiresAt,
      isUsed: false,
    });

    await this.tokenRepo.save(accessToken);

    return { token, expiresAt };
  }

  /**
   * Validasi token (dipanggil frontend saat login)
   * - Token harus ada di DB
   * - Belum pernah dipakai (isUsed = false)
   * - Belum expired
   * Setelah validasi sukses, token ditandai isUsed = true (sekali pakai)
   */
  async validateToken(token: string): Promise<boolean> {
    const found = await this.tokenRepo.findOne({
      where: {
        token,
        isUsed: false,
        expiresAt: MoreThan(new Date()),
      },
    });

    if (!found) {
      throw new UnauthorizedException('Token tidak valid atau sudah expired.');
    }

    found.isUsed = true;
    await this.tokenRepo.save(found);

    return true;
  }

  /**
   * Bersihkan token expired dari DB
   * Bisa dipanggil via cron job
   */
  async cleanupExpiredTokens(): Promise<number> {
    const result = await this.tokenRepo
      .createQueryBuilder()
      .delete()
      .where('expiresAt < :now', { now: new Date() })
      .orWhere('isUsed = :used', { used: true })
      .execute();

    return result.affected || 0;
  }
}
