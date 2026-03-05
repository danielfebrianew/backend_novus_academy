import { MigrationInterface, QueryRunner } from 'typeorm';

export class ForceUpperCaseColumns1708300006000 implements MigrationInterface {

  private async safeChange(qr: QueryRunner, table: string, oldCol: string, newCol: string, colDef: string): Promise<void> {
    // Check if old column exists (case-insensitive on Windows MySQL)
    const rows = await qr.query(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
    `, [table, oldCol]);
    if (rows.length === 0) return;
    await qr.query(`ALTER TABLE \`${table}\` CHANGE \`${rows[0].COLUMN_NAME}\` \`${newCol}\` ${colDef}`);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ===== histories =====
    await this.safeChange(queryRunner, 'histories', 'id', 'ID', 'varchar(36) NOT NULL');

    // ===== access_tokens =====
    await this.safeChange(queryRunner, 'access_tokens', 'id', 'ID', 'varchar(36) NOT NULL');
    await this.safeChange(queryRunner, 'access_tokens', 'token', 'TOKEN', 'varchar(255) NOT NULL');

    // ===== list_accounts =====
    await this.safeChange(queryRunner, 'list_accounts', 'id', 'ID', 'int NOT NULL AUTO_INCREMENT');
    await this.safeChange(queryRunner, 'list_accounts', 'user_id', 'USER_ID', 'int NULL');
    await this.safeChange(queryRunner, 'list_accounts', 'username', 'USERNAME', 'varchar(255) NOT NULL');
    await this.safeChange(queryRunner, 'list_accounts', 'email', 'EMAIL', 'varchar(255) NULL');
    await this.safeChange(queryRunner, 'list_accounts', 'password', 'PASSWORD', 'varchar(255) NULL');
    await this.safeChange(queryRunner, 'list_accounts', 'status', 'STATUS', "varchar(255) NOT NULL DEFAULT 'ACTIVE'");
    await this.safeChange(queryRunner, 'list_accounts', 'cookie', 'COOKIE', 'text NULL');
    await this.safeChange(queryRunner, 'list_accounts', 'created_at', 'CREATED_AT', 'datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)');
    await this.safeChange(queryRunner, 'list_accounts', 'updated_at', 'UPDATED_AT', 'datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)');

    // ===== scheduled_posts =====
    await this.safeChange(queryRunner, 'scheduled_posts', 'id', 'ID', 'int NOT NULL AUTO_INCREMENT');
    await this.safeChange(queryRunner, 'scheduled_posts', 'account_id', 'ACCOUNT_ID', 'int NULL');
    await this.safeChange(queryRunner, 'scheduled_posts', 'username', 'USERNAME', 'varchar(255) NOT NULL');
    await this.safeChange(queryRunner, 'scheduled_posts', 'content', 'CONTENT', 'text NOT NULL');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // One-way migration
  }
}
