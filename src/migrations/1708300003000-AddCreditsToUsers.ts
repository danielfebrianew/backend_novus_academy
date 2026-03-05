import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCreditsToUsers1708300003000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const columns = await queryRunner.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'credits'
    `);
    if (columns.length === 0) {
      await queryRunner.query(`ALTER TABLE users ADD COLUMN credits INT NOT NULL DEFAULT 500`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE users DROP COLUMN credits`);
  }
}
