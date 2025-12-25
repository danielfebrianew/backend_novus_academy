import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Report } from './entities/report.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { FilterReportDto } from './dto/filter-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
  ) {}

  // 1. Simpan Data Laporan Baru
  async create(createReportDto: CreateReportDto) {
    const report = this.reportRepository.create({
      accountId: createReportDto.account_id,
      startDate: createReportDto.start_date,
      endDate: createReportDto.end_date,
      liveRevenue: createReportDto.live_revenue,
      videoRevenue: createReportDto.video_revenue,
      revenue: createReportDto.revenue,
      baseRevenue: createReportDto.base_revenue,
      estKomisi: createReportDto.est_komisi,
      sold: createReportDto.sold,
      view: createReportDto.view,
      click: createReportDto.click,
    });
    return this.reportRepository.save(report);
  }

  // 2. Ambil Semua Laporan (List View) dengan Filter
  async findAll(filter: FilterReportDto) {
    const where: any = {};

    if (filter.accountId) {
      where.accountId = filter.accountId;
    }

    if (filter.startDate && filter.endDate) {
      where.startDate = Between(filter.startDate, filter.endDate);
    }

    return this.reportRepository.find({
      where,
      order: { startDate: 'DESC' }, // Urutkan dari yang terbaru
    });
  }

  // 3. Ambil Summary/Total (Untuk Dashboard Scorecard)
  async getSummary(filter: FilterReportDto) {
    const query = this.reportRepository.createQueryBuilder('report');

    if (filter.accountId) {
      query.andWhere('report.accountId = :accountId', { accountId: filter.accountId });
    }

    if (filter.startDate && filter.endDate) {
      query.andWhere('report.startDate >= :startDate AND report.endDate <= :endDate', {
        startDate: filter.startDate,
        endDate: filter.endDate,
      });
    }

    // Hitung SUM semua kolom penting
    const result = await query.select([
      'SUM(report.revenue) as total_revenue',
      'SUM(report.estKomisi) as total_commission',
      'SUM(report.liveRevenue) as total_live_revenue',
      'SUM(report.videoRevenue) as total_video_revenue',
      'SUM(report.view) as total_views',
      'SUM(report.click) as total_clicks',
      'SUM(report.sold) as total_sold',
    ]).getRawOne();

    // Konversi string (dari DB decimal) ke number/float
    return {
      totalRevenue: parseFloat(result.total_revenue || '0'),
      totalCommission: parseFloat(result.total_commission || '0'),
      totalLiveRevenue: parseFloat(result.total_live_revenue || '0'),
      totalVideoRevenue: parseFloat(result.total_video_revenue || '0'),
      totalViews: parseInt(result.total_views || '0'),
      totalClicks: parseInt(result.total_clicks || '0'),
      totalSold: parseInt(result.total_sold || '0'),
    };
  }
}