import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { fal } from '@fal-ai/client';

interface ComposeResult {
  videoUrl: string;
  thumbnailUrl: string;
}

@Injectable()
export class FalComposeService {
  private readonly logger = new Logger(FalComposeService.name);

  constructor(private configService: ConfigService) {
    const falKey = this.configService.get<string>('FAL_KEY');
    if (falKey) {
      fal.config({ credentials: falKey });
    }
  }

  async composeVideo(clipUrls: string[], audioUrl: string): Promise<ComposeResult> {
    const CLIP_DURATION_MS = 5000;

    const videoKeyframes = clipUrls.map((url, idx) => ({
      url,
      timestamp: idx * CLIP_DURATION_MS,
      duration: CLIP_DURATION_MS,
    }));

    const tracks = [
      {
        id: 'video-track',
        type: 'video',
        keyframes: videoKeyframes,
      },
      {
        id: 'audio-track',
        type: 'audio',
        keyframes: [
          {
            url: audioUrl,
            timestamp: 0,
            duration: clipUrls.length * CLIP_DURATION_MS,
          },
        ],
      },
    ];

    this.logger.log(`Composing video with ${clipUrls.length} clips + audio`);

    const result = await fal.subscribe('fal-ai/ffmpeg-api/compose', {
      input: { tracks },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          update.logs?.map((log) => log.message).forEach((msg) => {
            this.logger.debug(`[fal.ai] ${msg}`);
          });
        }
      },
    });

    const data = result.data as { video_url: string; thumbnail_url: string };

    this.logger.log(`Compose complete: ${data.video_url}`);

    return {
      videoUrl: data.video_url,
      thumbnailUrl: data.thumbnail_url,
    };
  }
}
