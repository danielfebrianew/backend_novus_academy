import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStatusToVideoJobs1708300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const cols = await queryRunner.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'video_jobs' AND COLUMN_NAME IN ('status', 'fail_msg')
    `);
    const existing = cols.map((c: any) => c.COLUMN_NAME);

    if (!existing.includes('status')) {
      await queryRunner.query(`
        ALTER TABLE video_jobs
        ADD COLUMN status ENUM('pending', 'processing', 'success', 'failed') NOT NULL DEFAULT 'pending'
      `);
    }

    if (!existing.includes('fail_msg')) {
      await queryRunner.query(`
        ALTER TABLE video_jobs
        ADD COLUMN fail_msg TEXT NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE video_jobs DROP COLUMN fail_msg`);
    await queryRunner.query(`ALTER TABLE video_jobs DROP COLUMN status`);
  }
}
