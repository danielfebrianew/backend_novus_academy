import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDeposits1708300008000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tables = await queryRunner.query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'deposits'
    `);
    if (tables.length > 0) return;

    await queryRunner.query(`
      CREATE TABLE \`deposits\` (
        \`DEPOSIT_ID\` int NOT NULL AUTO_INCREMENT,
        \`USER_ID\` int NOT NULL,
        \`DEPOSIT_VALUE\` decimal(20,2) NOT NULL,
        \`DEPOSIT_UNIK\` varchar(5) NOT NULL,
        \`DEPOSIT_DESCRIPTION\` varchar(255) NOT NULL,
        \`DEPOSIT_BANK_TRANSFER\` int NOT NULL,
        \`DEPOSIT_CREATE_BY\` int NOT NULL,
        \`DEPOSIT_CREATE_DATE\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`DEPOSIT_UPDATE_BY\` int NOT NULL,
        \`DEPOSIT_UPDATE_DATE\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`DEPOSIT_STATUS\` int NOT NULL,
        \`BUKTI_TRANSFER\` varchar(500) NULL,
        PRIMARY KEY (\`DEPOSIT_ID\`),
        INDEX \`IDX_DEPOSITS_USER_ID\` (\`USER_ID\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`deposits\``);
  }
}
