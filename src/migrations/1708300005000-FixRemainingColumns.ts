import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixRemainingColumns1708300005000 implements MigrationInterface {

  private async colExists(qr: QueryRunner, table: string, col: string): Promise<boolean> {
    const rows = await qr.query(`
      SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?
    `, [table, col]);
    return rows.length > 0;
  }

  private async safeRename(qr: QueryRunner, table: string, oldCol: string, newCol: string, colDef: string): Promise<void> {
    if (await this.colExists(qr, table, newCol)) return;
    if (!(await this.colExists(qr, table, oldCol))) return;
    await qr.query(`ALTER TABLE \`${table}\` CHANGE \`${oldCol}\` \`${newCol}\` ${colDef}`);
  }

  private async dropAllFks(qr: QueryRunner, table: string, refTable: string): Promise<void> {
    const fks = await qr.query(`
      SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME = ?
    `, [table, refTable]);
    for (const fk of fks) {
      await qr.query(`ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${fk.CONSTRAINT_NAME}\``);
    }
  }

  private async fkExists(qr: QueryRunner, table: string, fkName: string): Promise<boolean> {
    const rows = await qr.query(`
      SELECT 1 FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY'
    `, [table, fkName]);
    return rows.length > 0;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ===== histories =====
    await this.dropAllFks(queryRunner, 'histories', 'users');
    await this.safeRename(queryRunner, 'histories', 'id', 'ID', 'varchar(36) NOT NULL');
    if (!(await this.fkExists(queryRunner, 'histories', 'FK_HISTORIES_USERS'))) {
      await queryRunner.query(`ALTER TABLE \`histories\` ADD CONSTRAINT \`FK_HISTORIES_USERS\` FOREIGN KEY (\`USER_ID\`) REFERENCES \`users\`(\`ID\`) ON DELETE CASCADE`);
    }

    // ===== access_tokens =====
    await this.safeRename(queryRunner, 'access_tokens', 'id', 'ID', 'varchar(36) NOT NULL');
    await this.safeRename(queryRunner, 'access_tokens', 'token', 'TOKEN', 'varchar(255) NOT NULL');

    // ===== list_accounts (before scheduled_posts) =====
    await this.safeRename(queryRunner, 'list_accounts', 'id', 'ID', 'int NOT NULL AUTO_INCREMENT');
    await this.safeRename(queryRunner, 'list_accounts', 'user_id', 'USER_ID', 'int NULL');
    await this.safeRename(queryRunner, 'list_accounts', 'username', 'USERNAME', 'varchar(255) NOT NULL');
    await this.safeRename(queryRunner, 'list_accounts', 'email', 'EMAIL', 'varchar(255) NULL');
    await this.safeRename(queryRunner, 'list_accounts', 'password', 'PASSWORD', 'varchar(255) NULL');
    await this.safeRename(queryRunner, 'list_accounts', 'status', 'STATUS', "varchar(255) NOT NULL DEFAULT 'ACTIVE'");
    await this.safeRename(queryRunner, 'list_accounts', 'cookie', 'COOKIE', 'text NULL');
    await this.safeRename(queryRunner, 'list_accounts', 'created_at', 'CREATED_AT', 'datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)');
    await this.safeRename(queryRunner, 'list_accounts', 'updated_at', 'UPDATED_AT', 'datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)');

    // ===== scheduled_posts =====
    await this.dropAllFks(queryRunner, 'scheduled_posts', 'list_accounts');
    await this.safeRename(queryRunner, 'scheduled_posts', 'id', 'ID', 'int NOT NULL AUTO_INCREMENT');
    await this.safeRename(queryRunner, 'scheduled_posts', 'account_id', 'ACCOUNT_ID', 'int NULL');
    await this.safeRename(queryRunner, 'scheduled_posts', 'username', 'USERNAME', 'varchar(255) NOT NULL');
    await this.safeRename(queryRunner, 'scheduled_posts', 'content', 'CONTENT', 'text NOT NULL');
    if (!(await this.fkExists(queryRunner, 'scheduled_posts', 'FK_SCHEDULED_POSTS_LIST_ACCOUNTS'))) {
      await queryRunner.query(`ALTER TABLE \`scheduled_posts\` ADD CONSTRAINT \`FK_SCHEDULED_POSTS_LIST_ACCOUNTS\` FOREIGN KEY (\`ACCOUNT_ID\`) REFERENCES \`list_accounts\`(\`ID\`) ON DELETE CASCADE`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // One-way migration
  }
}
