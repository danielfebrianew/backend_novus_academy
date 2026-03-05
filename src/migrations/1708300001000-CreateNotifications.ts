import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotifications1708300001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tables = await queryRunner.query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications'
    `);
    if (tables.length > 0) return;

    await queryRunner.query(`
      CREATE TABLE notifications (
        id CHAR(36) NOT NULL DEFAULT (UUID()),
        user_id INT NOT NULL,
        type ENUM('video_success', 'video_failed') NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        job_id VARCHAR(100) NULL,
        is_read TINYINT(1) NOT NULL DEFAULT 0,
        created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (id),
        INDEX idx_notifications_user_id (user_id),
        INDEX idx_notifications_user_unread (user_id, is_read)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS notifications`);
  }
}
