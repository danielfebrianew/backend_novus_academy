import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsProToVideoJobs1708300002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const cols = await queryRunner.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'video_jobs' AND COLUMN_NAME = 'is_pro'
    `);
    if (cols.length > 0) return;

    await queryRunner.query(`
      ALTER TABLE video_jobs
      ADD COLUMN is_pro TINYINT(1) NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE video_jobs DROP COLUMN is_pro`);
  }
}
