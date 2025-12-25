import { Controller, Get, Post, Body, Patch, Param, UseInterceptors, UseGuards, Query } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';
import { PostStatus } from './entities/scheduler.entity';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';
import { AuthenticatedGuard } from '../auth/guards/authenticated.guard';

@Controller('scheduler')
@UseInterceptors(ResponseInterceptor)
@UseGuards(AuthenticatedGuard) // Hanya user login
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Get('ready') 
  @ResponseMessage('Berhasil mengambil data semua postingan siap posting')
  getReadyToPost() {
    return this.schedulerService.findReadyToPost();
  }

  @Get('pending')
  @ResponseMessage('Berhasil mengambil data semua postingan pending')
  getAllPending(@Query('accountId') accountId?: string) {
    const id = accountId ? +accountId : undefined;
    return this.schedulerService.findAllPending(id);
  }

  @Get('done')
  @ResponseMessage('Berhasil mengambil history')
  findAllCompleted(@Query('accountId') accountId?: string) {
    const id = accountId ? +accountId : undefined;
    return this.schedulerService.findAllDone(id);
  }

  @Get(':id')
  @ResponseMessage('Berhasil mengambil data postingan')
  getOne(@Param('id') id: string) {
    return this.schedulerService.findOne(+id);
  }

  @Post()
  @ResponseMessage('Berhasil membuat jadwal postingan')
  create(@Body() body: any) {
    return this.schedulerService.createSchedule(body);
  }

  @Patch(':id/status')
  @ResponseMessage('Berhasil mengubah status postingan')
  updateStatus(@Param('id') id: string, @Body('status') status: PostStatus) {
    return this.schedulerService.updateStatus(+id, status);
  }
}