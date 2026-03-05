import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateHistorySaldo1708300009000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tables = await queryRunner.query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'history_saldo'
    `);
    if (tables.length > 0) return;

    await queryRunner.query(`
      CREATE TABLE \`history_saldo\` (
        \`HISTORY_SALDO_ID\` int NOT NULL AUTO_INCREMENT,
        \`USER_ID\` int NOT NULL,
        \`HISTORY_SALDO_VALUE\` decimal(20,2) NOT NULL,
        \`HISTORY_SALDO_KETERANGAN\` varchar(255) NOT NULL,
        \`HISTORY_SALDO_TYPE\` char(1) NOT NULL,
        \`HISTORY_SALDO_REF\` varchar(255) NULL,
        \`HISTORY_SALDO_DATE\` date NOT NULL,
        \`HISTORY_SALDO_CREATE_BY\` int NOT NULL,
        \`HISTORY_SALDO_CREATE_DATE\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`HISTORY_SALDO_UPDATE_BY\` int NOT NULL,
        \`HISTORY_SALDO_UPDATE_DATE\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`HISTORY_SALDO_STATUS\` int NOT NULL,
        PRIMARY KEY (\`HISTORY_SALDO_ID\`),
        INDEX \`IDX_HISTORY_SALDO_USER_ID\` (\`USER_ID\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS \`history_saldo\``);
  }
}
