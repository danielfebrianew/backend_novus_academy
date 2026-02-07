import { Controller, Get, UseGuards, Req, UseInterceptors } from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ResponseInterceptor } from '../common/interceptors/response.interceptor';
import { ResponseMessage } from '../common/decorators/response-message.decorator';

@Controller('history')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  @ResponseMessage('Berhasil mengambil data riwayat')
  async getMyHistory(@Req() req: any) {
    const userId = req.user.userId;
    return this.historyService.getUserHistory(userId);
  }
}