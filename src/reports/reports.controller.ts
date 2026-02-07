import { Controller, Get, Query, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('reports')
@UseInterceptors(ResponseInterceptor)
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // GET /reports/view-tiktok?accountId=4&startDate=2025-12-19&endDate=2025-12-25
  @Get('view-tiktok')
  async viewTiktokData(@Query() query: any) {
    if (!query.accountId || !query.startDate || !query.endDate) {
        throw new BadRequestException('Required: accountId, startDate, endDate');
    }

    // PERBAIKAN DI SINI:
    // Bungkus jadi 1 object, dan biarkan Service yang mengubah string ke Date
    return this.reportsService.getTiktokData({
        accountId: Number(query.accountId), // Pastikan jadi number
        startDate: query.startDate,         // Kirim string "2025-12-19"
        endDate: query.endDate              // Kirim string "2025-12-25"
    });
  }
}