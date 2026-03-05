import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBuktiTransferToDeposits1708300010000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const cols = await queryRunner.query(`
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'deposits' AND COLUMN_NAME = 'BUKTI_TRANSFER'
    `);
    if (cols.length > 0) return;

    await queryRunner.query(`ALTER TABLE \`deposits\` ADD COLUMN \`BUKTI_TRANSFER\` varchar(500) NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`deposits\` DROP COLUMN \`BUKTI_TRANSFER\``);
  }
}
