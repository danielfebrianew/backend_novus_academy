import { Controller, Get, Param, Req, UseGuards, UseInterceptors } from '@nestjs/common';
import { HistorySaldoService } from './history-saldo.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@Controller('history-saldo')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
export class HistorySaldoController {
  constructor(private readonly historySaldoService: HistorySaldoService) {}

  @Get()
  @ResponseMessage('History saldo berhasil diambil')
  findAll(@Req() req: any) {
    return this.historySaldoService.findAllByUser(req.user.userId);
  }

  @Get(':id')
  @ResponseMessage('Detail history saldo berhasil diambil')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.historySaldoService.findOne(+id, req.user.userId);
  }
}
