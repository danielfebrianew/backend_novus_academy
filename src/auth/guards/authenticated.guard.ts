import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthenticatedGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Cek apakah session user ada
    // Kita set ini manual di AuthController kemarin: (req.session as any).user = user;
    if (request.session && request.session.user) {
      return true; // Lolos
    }

    throw new UnauthorizedException('Anda harus login terlebih dahulu');
  }
}