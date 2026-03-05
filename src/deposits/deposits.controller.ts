import { Controller, Get, Post, Patch, Param, Body, Req, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DepositsService } from './deposits.service';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@Controller('deposits')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
export class DepositsController {
  constructor(private readonly depositsService: DepositsService) {}

  @Get('banks')
  @ResponseMessage('Daftar bank berhasil diambil')
  findAllBanks() {
    return this.depositsService.findAllBanks();
  }

  @Post()
  @UseInterceptors(FileInterceptor('buktiTransfer'))
  @ResponseMessage('Deposit berhasil dibuat')
  create(
    @Body() dto: CreateDepositDto,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) throw new BadRequestException('Bukti transfer wajib diupload');
    if (!file.mimetype.match(/\/(jpg|jpeg|png|webp|pdf)$/)) {
      throw new BadRequestException('File harus gambar (jpg, png, webp) atau PDF');
    }
    return this.depositsService.create(dto, file, req.user.userId);
  }

  @Get()
  @ResponseMessage('Daftar deposit berhasil diambil')
  findAll(@Req() req: any) {
    return this.depositsService.findAllByUser(req.user.userId);
  }

  @Get(':id')
  @ResponseMessage('Detail deposit berhasil diambil')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.depositsService.findOne(+id, req.user.userId);
  }

  @Patch(':id/status')
  @ResponseMessage('Status deposit berhasil diupdate')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: number,
    @Req() req: any,
  ) {
    return this.depositsService.updateStatus(+id, status, req.user.userId);
  }
}
