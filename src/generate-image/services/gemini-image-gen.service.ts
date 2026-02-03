import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

// Interface tetap sama — generate-image.service tidak perlu berubah
export interface GeminiGenerationParams {
  prompt: string;
  modelBase64: string;       // base64 gambar model (wajah/orang)
  productBase64: string;     // base64 gambar produk
  negativePrompt?: string;
  aspectRatio?: string;      // misal '3:4' — belum di-support gemini-3-pro-image-preview, disimpan untuk forward-compat
}

@Injectable()
export class GeminiImageGenService {
  private readonly logger = new Logger(GeminiImageGenService.name);
  private readonly ai: GoogleGenAI;
  private readonly model = 'gemini-3-pro-image-preview';

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      throw new InternalServerErrorException('GEMINI_API_KEY is not configured');
    }

    // Inisalisasi SDK sekali di constructor — reuse per request
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Kirim request ke Gemini via official SDK.
   * Return: Buffer gambar hasil generate, siap di-upload ke S3.
   */
  async generateImage(params: GeminiGenerationParams): Promise<Buffer> {
    try {
      this.logger.log(`Sending image generation request (prompt: "${params.prompt.substring(0, 60)}...")`);

      // ─── Bangun contents ──────────────────────────────────────────
      // Urutan penting: reference image (model + produk) dulu, baru prompt text.
      // Gemini baca context dari atas ke bawah.
      const contents = [
        {
          role: 'user' as const,
          parts: [
            // 1. Gambar model (wajah/orang) — jadi reference "siapa yang pakai"
            {
              inlineData: {
                data: params.modelBase64,
                mimeType: 'image/png',
              },
            },
            // 2. Gambar produk — jadi reference "apa yang dipakai/digunakan"
            {
              inlineData: {
                data: params.productBase64,
                mimeType: 'image/png',
              },
            },
            // 3. Prompt teks — instruksi generate
            {
              text: this.buildFullPrompt(params),
            },
          ],
        },
      ];

      // ─── Config generation ────────────────────────────────────────
      const config = {
        responseModalities: ['IMAGE', 'TEXT'],
        imageConfig: {
          aspectRatio: '9:16',
          imageSize: '1K', // resolusi yang didukung gemini-3-pro-image-preview
        },
      };

      // ─── Streaming call ───────────────────────────────────────────
      const response = await this.ai.models.generateContentStream({
        model: this.model,
        config,
        contents,
      });

      // ─── Kumpulkan image data dari stream ─────────────────────────
      // Response bisa multi-chunk; image data bisa datang di chunk mana saja.
      // Ambil yang pertama — kita hanya butuh 1 gambar per call.
      const imageBuffer = await this.extractImageFromStream(response);

      if (!imageBuffer) {
        throw new Error('Gemini did not return any image in the streamed response.');
      }

      this.logger.log('Image generation successful');
      return imageBuffer;

    } catch (error) {
      this.handleError(error);
      throw error; // re-throw agar ditangkap di generate-image.service (per-variant try/catch)
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  /**
   * Loop stream, cari chunk pertama yang punya inlineData (the actual image).
   * Return Buffer atau null kalau tidak ditemukan.
   */
  private async extractImageFromStream(
    stream: AsyncIterable<any>,
  ): Promise<Buffer | null> {
    for await (const chunk of stream) {
      const parts = chunk.candidates?.[0]?.content?.parts;

      if (!parts) continue;

      for (const part of parts) {
        if (part.inlineData?.data) {
          // Dafault mimeType fallback ke image/png
          this.logger.log(`Got image chunk — mimeType: ${part.inlineData.mimeType || 'image/png'}`);
          return Buffer.from(part.inlineData.data, 'base64');
        }
      }
    }

    return null; // stream habis, tidak ada image part
  }

  /**
   * Gabungkan prompt dari caller + negative prompt menjadi satu instruksi lengkap.
   * Gemini-3-pro tidak punya field terpisah untuk negativePrompt,
   * jadi negative instruction ditaruh di dalam text prompt.
   */
  private buildFullPrompt(params: GeminiGenerationParams): string {
    const negativePrompt =
      params.negativePrompt ||
      'cartoon, low quality, blurry, distorted face, bad hands, missing fingers, extra limbs';

    return `${params.prompt}

NEGATIVE (DO NOT include these in the generated image):
${negativePrompt}`;
  }

  /**
   * Centralized error logging — tetap sama logikanya seperti sebelumnya.
   */
  private handleError(error: any) {
    if (error.response) {
      this.logger.error(
        `Gemini API Error: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
      );
    } else if (error.request) {
      this.logger.error(`Gemini Network Error: ${error.message}`);
    } else {
      this.logger.error(`Gemini Error: ${error.message}`);
    }
  }
}