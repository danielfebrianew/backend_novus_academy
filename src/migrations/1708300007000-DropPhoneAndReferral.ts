import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropPhoneAndReferral1708300007000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const cols = await queryRunner.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME IN ('PHONE_NUMBER', 'REFERRAL_CODE')
    `);
    for (const col of cols) {
      await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`${col.COLUMN_NAME}\``);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`users\` ADD COLUMN \`PHONE_NUMBER\` varchar(255) NULL`);
    await queryRunner.query(`ALTER TABLE \`users\` ADD COLUMN \`REFERRAL_CODE\` varchar(255) NULL`);
  }
}
