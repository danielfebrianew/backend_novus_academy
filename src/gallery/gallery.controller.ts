import { Controller, Get, Delete, Param, Query, UseGuards, Req, UseInterceptors } from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { AuthenticatedGuard } from 'src/auth/guards/authenticated.guard';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@Controller('gallery')
@UseGuards(AuthenticatedGuard)
@UseInterceptors(ResponseInterceptor)
export class GalleryController {
    constructor(private readonly galleryService: GalleryService) { }

    @Get('jobs')
    async getJobs(
        @Query('page') page: number = 1,
        @Query('limit') limit: number = 30,
        @Req() req: any
    ) {
        return this.galleryService.findAllJobs(req.session.user.id, +page, +limit);
    }

    @Get('jobs/:jobId')
    async getJobDetail(@Param('jobId') jobId: string, @Req() req: any) {
        return this.galleryService.findJobDetail(jobId, req.session.user.id);
    }

    @Delete('jobs/:jobId')
    @ResponseMessage('Job and all videos deleted')
    async deleteJob(@Param('jobId') jobId: string, @Req() req: any) {
        return this.galleryService.deleteJob(jobId, req.session.user.id);
    }

    @Delete('videos/:videoId')
    @ResponseMessage('Video deleted successfully')
    async deleteVideo(@Param('videoId') videoId: string) {
        return this.galleryService.deleteSingleVideo(videoId);
    }
}