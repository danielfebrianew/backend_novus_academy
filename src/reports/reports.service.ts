import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Account } from '../accounts/entities/account.entity';
import { GetTiktokReportDto } from './dto/get-tiktok-report.dto'; // Asumsi DTO dipakai di Controller

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private readonly httpService: HttpService,
  ) {}

  async getTiktokData(dto: GetTiktokReportDto) {
    const { accountId, startDate, endDate } = dto;
    
    // Konversi string ke Date Object (jika belum)
    const startObj = new Date(startDate);
    const endObj = new Date(endDate);

    this.logger.log(`Fetching Daily TikTok Data for Account ID: ${accountId}`);

    // --- 1. VALIDASI RANGE MAKSIMAL 7 HARI ---
    const diffTime = Math.abs(endObj.getTime() - startObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    if (diffDays > 7) {
        throw new BadRequestException("Maksimal hanya 7 hari.");
    }

    // --- 2. AMBIL AKUN ---
    const account = await this.accountRepository.findOne({
      where: { id: accountId },
      select: { id: true, cookie: true }
    });

    if (!account || !account.cookie) {
      throw new BadRequestException(`Account ID ${accountId} invalid or no cookie`);
    }

    // --- 3. GENERATE LIST TANGGAL (HARI PER HARI) ---
    const datesToFetch: Date[] = [];
    let currentDate = new Date(startObj);
    
    while (currentDate <= endObj) {
        datesToFetch.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // --- 4. FUNGSI FETCH 1 HARI (Helper) ---
    const fetchOneDay = async (targetDate: Date) => {
        const dateStr = targetDate.toISOString().split('T')[0];
        const todayStr = new Date().toISOString().split('T')[0];
        const isToday = dateStr === todayStr;

        // Setup Timestamp Harian (Start 00:00 - End 00:00 Besoknya)
        const startLocal = new Date(targetDate);
        startLocal.setHours(0, 0, 0, 0);
        
        const endLocal = new Date(targetDate);
        endLocal.setDate(endLocal.getDate() + 1);
        endLocal.setHours(0, 0, 0, 0);

        const startTs = Math.floor(startLocal.getTime() / 1000);
        const endTs = Math.floor(endLocal.getTime() / 1000);
        const tzOffset = '25200'; // WIB

        const statsTypes = [100, 101, 121, 11, 21, 130, 301, 302, 353, 351];
        let bodyReq: any = {};

        // Logic Body (Realtime vs History)
        if (isToday) {
            bodyReq = { 
                request: { params: [{ time_selector: { period: 10, granularity: 11 }, stats_types: statsTypes }] }, 
                version: '2' 
            };
        } else {
            bodyReq = { 
                request: { params: [
                    { time_selector: { period: 2, granularity: 1, start_timestamp: startTs, end_timestamp: endTs, timezone_offset: tzOffset }, stats_types: statsTypes }
                ] }, 
                version: '2' 
            };
        }

        try {
            const url = `https://shop.tiktok.com/api/v2/insights/creator/live/stats?aid=253642`;
            const { data } = await firstValueFrom(
                this.httpService.post(url, bodyReq, {
                    headers: { 'Cookie': account.cookie, 'User-Agent': 'Mozilla/5.0', 'Content-Type': 'application/json' },
                }),
            );

            // Parsing Data
            const segments = data?.data?.segments || [];
            let statsFound: any = null;

            for (const seg of segments) {
                const timedStats = seg?.timed_stats || [];
                if (timedStats.length > 0 && timedStats[0]?.stats) {
                    statsFound = timedStats[0].stats;
                    break;
                }
            }

            if (statsFound) {
                const getVal = (key: string): string => statsFound[key]?.amount || '0';
                const getInt = (key: string): number => statsFound[key] ? parseInt(statsFound[key]) : 0;

                return {
                    date: dateStr, // Key untuk Sumbu X grafik
                    liveRevenue: parseFloat(getVal('live_revenue')),
                    videoRevenue: parseFloat(getVal('video_revenue')),
                    revenue: parseFloat(getVal('revenue')), // Key untuk Sumbu Y grafik
                    view: getInt('product_show_cnt'),
                    click: getInt('product_click_cnt')
                };
            }
        } catch (error) {
            this.logger.error(`Error fetching date ${dateStr}`);
        }

        // Return Data Nol jika gagal/kosong (Supaya grafik tidak bolong)
        return {
            date: dateStr,
            liveRevenue: 0,
            videoRevenue: 0,
            revenue: 0,
            view: 0,
            click: 0
        };
    };

    // --- 5. EKSEKUSI PARALLEL ---
    // Promise.all menjalankan semua request tanggal secara bersamaan
    const results = await Promise.all(datesToFetch.map(date => fetchOneDay(date)));

    return results;
  }
}