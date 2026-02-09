import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

@Injectable()
export class VideoUtilsHelper {
  private readonly logger = new Logger(VideoUtilsHelper.name);
  private tempDir = './temp';

  generateUniqueShuffles(length: number, limit: number): number[][] {
    const results = new Set<string>();
    const output: number[][] = [];
    const baseIndices = Array.from({ length }, (_, i) => i);
    let attempts = 0;

    while (output.length < limit && attempts < limit * 50) {
      attempts++;
      const shuffled = [...baseIndices].sort(() => Math.random() - 0.5);
      const key = shuffled.join(',');

      if (!results.has(key)) {
        results.add(key);
        output.push(shuffled);
      }
    }

    if (output.length < limit) {
      this.logger.warn(`Hanya berhasil generate ${output.length} variasi dari target ${limit}`);
    }
    return output;
  }

  async downloadFile(url: string, outputPath: string): Promise<void> {
    try {
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
      });

      const writer = fs.createWriteStream(outputPath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    } catch (error) {
      this.logger.error(`Download Error: ${error.message}`);
      throw error;
    }
  }

  // Audio Helpers
  createWavHeader(dataLength: number, options: any): Buffer {
    const { numChannels, sampleRate, bitsPerSample } = options;
    const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const buffer = Buffer.alloc(44);

    buffer.write('RIFF', 0);
    buffer.writeUInt32LE(36 + dataLength, 4);
    buffer.write('WAVE', 8);
    buffer.write('fmt ', 12);
    buffer.writeUInt32LE(16, 16);
    buffer.writeUInt16LE(1, 20);
    buffer.writeUInt16LE(numChannels, 22);
    buffer.writeUInt32LE(sampleRate, 24);
    buffer.writeUInt32LE(byteRate, 28);
    buffer.writeUInt16LE(blockAlign, 32);
    buffer.writeUInt16LE(bitsPerSample, 34);
    buffer.write('data', 36);
    buffer.writeUInt32LE(dataLength, 40);
    return buffer;
  }

  parseMimeType(mimeType: string) {
    const [fileType, ...params] = mimeType.split(';').map(s => s.trim());
    const [_, format] = fileType.split('/');
    const options = { numChannels: 1, sampleRate: 24000, bitsPerSample: 16 };
    if (format && format.startsWith('L')) {
      const bits = parseInt(format.slice(1), 10);
      if (!isNaN(bits)) options.bitsPerSample = bits;
    }
    for (const param of params) {
      const [key, value] = param.split('=').map(s => s.trim());
      if (key === 'rate') options.sampleRate = parseInt(value, 10);
    }
    return options;
  }

  convertToWav(base64Data: string, mimeType: string): Buffer {
    const options = this.parseMimeType(mimeType);
    const buffer = Buffer.from(base64Data, 'base64');
    const wavHeader = this.createWavHeader(buffer.length, options);
    return Buffer.concat([wavHeader, buffer]);
  }

  async downloadImageToBuffer(url: string, prefix: string): Promise<string> {
    try {
      this.logger.log(`Downloading image for analysis: ${url}`);
      
      // 1. Download Gambar dari URL via Axios
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'arraybuffer' // Get buffer directly
      });

      const buffer = Buffer.from(response.data);

      // 2. Setup Path Output
      const filename = `${prefix}_${Date.now()}.jpg`;
      const outputPath = path.join(this.tempDir, filename);

      // 3. Save Buffer to File (RAW - NO CROPPING)
      fs.writeFileSync(outputPath, buffer);

      this.logger.log(`✅ Image downloaded: ${filename}`);
      return outputPath; 

    } catch (error) {
      this.logger.error(`Failed to download image: ${url}`, error);
      throw error; 
    }
  }
}