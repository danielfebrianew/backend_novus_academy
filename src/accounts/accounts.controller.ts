import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, UnauthorizedException } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';

@Controller('/accounts')
// @UseGuards(AuthenticatedGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  create(@Body() body: any, @Req() req: any) {
    // 1. Coba ambil dari req.user (standard passport)
    let userId = req.user?.id;

    // 2. JIKA KOSONG, ambil dari req.session.user (sesuai log debug kamu)
    if (!userId && req.session && req.session.user) {
      userId = req.session.user.id;
    }

    // 3. Validasi akhir
    if (!userId) {
      // Print log lagi biar tau kalau masih gagal
      console.error('Gagal mendapatkan User ID. Session:', req.session);
      throw new UnauthorizedException('User session not found');
    }

    // 4. Eksekusi
    return this.accountsService.create(body, userId);
  }

  @Get()
  findAll() {
    return this.accountsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: any) {
    return this.accountsService.update(+id, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accountsService.remove(+id);
  }
}