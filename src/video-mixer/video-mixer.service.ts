import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { v4 as uuidv4 } from 'uuid'; 
import { VideoUtilsHelper } from './helpers/video-utils.helper'; 

@Injectable()
export class VideoMixerService {
  private readonly tempDir = path.resolve('./temp'); 

  constructor(private readonly videoUtilsHelper: VideoUtilsHelper) {
    if (!fs.existsSync(this.tempDir)) fs.mkdirSync(this.tempDir);
  }

  async generateStitchedVideos(
    clipPaths: string[], 
    audioPath: string, 
    targetVariations: number = 1,
    customOutputDir: string
  ) {
    const PROCESS_ID = uuidv4().split('-')[0]; 
    
    // 1. List file yang WAJIB dihapus di akhir (Input Uploads + Temp Files)
    // Masukkan file upload user (yang ada di folder uploads) ke daftar hapus
    const filesToDelete: string[] = [...clipPaths, audioPath];
    
    const finalOutputDir = path.resolve(customOutputDir);

    if (!fs.existsSync(finalOutputDir)) {
        try {
            fs.mkdirSync(finalOutputDir, { recursive: true });
        } catch (e) {
            console.error("Gagal membuat folder output:", e);
            throw new InternalServerErrorException(`Gagal membuat folder output di: ${customOutputDir}`);
        }
    }

    try {
      this.logProgress(PROCESS_ID, 'Mengenerate urutan unik...', 10);
      
      const uniqueOrders = this.videoUtilsHelper.generateUniqueShuffles(
        clipPaths.length, 
        targetVariations
      );

      this.logProgress(PROCESS_ID, `Memulai Stitching ${uniqueOrders.length} variasi...`, 20);

      const resultPaths: string[] = [];

      for (let i = 0; i < uniqueOrders.length; i++) {
        const order = uniqueOrders[i];
        const orderedPaths = order.map((index) => clipPaths[index]);

        const tempVisualPath = path.join(this.tempDir, `vis_${PROCESS_ID}_${i}.mp4`);
        
        // Masukkan file intermediate (temp visual) ke daftar hapus juga
        filesToDelete.push(tempVisualPath);

        await this.videoUtilsHelper.mergeVideoFiles(orderedPaths, tempVisualPath);

        const finalFileName = `VARIATION_${PROCESS_ID}_${i + 1}.mp4`;
        const finalVarPath = path.join(finalOutputDir, finalFileName); 

        await new Promise((resolve, reject) => {
          ffmpeg()
            .input(tempVisualPath)
            .input(audioPath)
            .outputOptions(['-c:v copy', '-c:a aac', '-map 0:v:0', '-map 1:a:0'])
            .save(finalVarPath)
            .on('end', () => {
              resultPaths.push(finalVarPath);
              resolve(true);
            })
            .on('error', (err) => {
              console.error('FFmpeg Error:', err);
              reject(err);
            });
        });
        
        this.logProgress(PROCESS_ID, `Variasi ${i + 1} selesai.`, 80);
      }

      return {
        success: true,
        processId: PROCESS_ID,
        files: resultPaths
      };

    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Gagal memproses video');
    } finally {
        // --- CLEANUP EKSEKUTOR ---
        // Ini akan menghapus file di 'uploads/' DAN file di 'temp/'
        console.log(`[${PROCESS_ID}] Membersihkan ${filesToDelete.length} file temporary & uploads...`);
        
        filesToDelete.forEach(filePath => {
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                } catch (err) {
                    console.error(`Gagal menghapus file: ${filePath}`, err);
                }
            }
        });
    }
  }

  private logProgress(id: string, message: string, percent: number) {
    console.log(`[${id}] ${percent}% - ${message}`);
  }
}