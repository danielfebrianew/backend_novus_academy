import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStatusToVideoJobs1708300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE video_jobs
      ADD COLUMN status ENUM('pending', 'processing', 'success', 'failed') NOT NULL DEFAULT 'pending'
    `);

    await queryRunner.query(`
      ALTER TABLE video_jobs
      ADD COLUMN fail_msg TEXT NULL
    `);

    // Set existing jobs yang sudah punya video results ke 'success'
    await queryRunner.query(`
      UPDATE video_jobs j
      INNER JOIN video_results r ON r.video_job_id = j.id
      SET j.status = 'success'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE video_jobs DROP COLUMN fail_msg`);
    await queryRunner.query(`ALTER TABLE video_jobs DROP COLUMN status`);
  }
}
