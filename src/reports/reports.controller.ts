import { Controller, Get, Post, Body, Query, UseGuards, UseInterceptors } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { FilterReportDto } from './dto/filter-report.dto';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';

@Controller('reports')
@UseInterceptors(ResponseInterceptor)
@UseGuards(AuthenticatedGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  create(@Body() createReportDto: CreateReportDto) {
    return this.reportsService.create(createReportDto);
  }

  // API untuk Table History
  // GET /reports?startDate=2024-01-01&endDate=2024-01-31
  @Get()
  findAll(@Query() filter: FilterReportDto) {
    return this.reportsService.findAll(filter);
  }

  // API untuk Scorecard / Chart Summary
  // GET /reports/summary?startDate=2024-01-01&endDate=2024-01-31
  @Get('summary')
  getSummary(@Query() filter: FilterReportDto) {
    return this.reportsService.getSummary(filter);
  }
}