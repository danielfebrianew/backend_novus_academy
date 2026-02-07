// src/gallery/gallery.controller.ts

import { Controller, Get, Delete, Param, Query, UseGuards, Req, UseInterceptors } from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ResponseInterceptor } from 'src/common/interceptors/response.interceptor';
import { ResponseMessage } from 'src/common/decorators/response-message.decorator';

@Controller('gallery')
@UseGuards(JwtAuthGuard)
@UseInterceptors(ResponseInterceptor)
export class GalleryController {
    constructor(private readonly galleryService: GalleryService) { }

    @Get('jobs')
    async getJobs(
        @Query('page') page: string,
        @Query('limit') limit: string,
        @Req() req: any
    ) {
        return this.galleryService.findAllJobs(
            req.user.id,
            Number(page) || 1,
            Number(limit) || 30,
        );
    }

    @Get('jobs/:jobId')
    async getJobDetail(@Param('jobId') jobId: string, @Req() req: any) {
        return this.galleryService.findJobDetail(jobId, req.user.id);
    }

    @Delete('jobs/:jobId')
    @ResponseMessage('Job and all videos deleted')
    async deleteJob(@Param('jobId') jobId: string, @Req() req: any) {
        return this.galleryService.deleteJob(jobId, req.user.id);
    }

    @Delete('videos/:videoId')
    @ResponseMessage('Video deleted successfully')
    async deleteVideo(@Param('videoId') videoId: string) {
        return this.galleryService.deleteSingleVideo(videoId);
    }
}