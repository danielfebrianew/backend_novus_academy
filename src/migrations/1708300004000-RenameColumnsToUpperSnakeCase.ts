import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameColumnsToUpperSnakeCase1708300004000 implements MigrationInterface {

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

  private async safeAddCol(qr: QueryRunner, table: string, col: string, colDef: string): Promise<void> {
    if (await this.colExists(qr, table, col)) return;
    await qr.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${col}\` ${colDef}`);
  }

  private async safeDropCol(qr: QueryRunner, table: string, col: string): Promise<void> {
    if (!(await this.colExists(qr, table, col))) return;
    await qr.query(`ALTER TABLE \`${table}\` DROP COLUMN \`${col}\``);
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
    // ===== users: rename existing columns =====
    await this.safeRename(queryRunner, 'users', 'id', 'ID', 'int NOT NULL AUTO_INCREMENT');
    await this.safeRename(queryRunner, 'users', 'name', 'NAME', 'varchar(255) NOT NULL');
    await this.safeRename(queryRunner, 'users', 'email', 'EMAIL', 'varchar(255) NOT NULL');
    await this.safeRename(queryRunner, 'users', 'password', 'PASSWORD', 'varchar(255) NOT NULL');
    await this.safeRename(queryRunner, 'users', 'phoneNumber', 'PHONE_NUMBER', 'varchar(255) NULL');
    await this.safeRename(queryRunner, 'users', 'referralCode', 'REFERRAL_CODE', 'varchar(255) NULL');
    await this.safeRename(queryRunner, 'users', 'role', 'ROLE', "enum('ROLE_ADMIN','ROLE_USER') NOT NULL DEFAULT 'ROLE_USER'");
    await this.safeRename(queryRunner, 'users', 'refreshToken', 'REFRESH_TOKEN', 'text NULL');
    await this.safeRename(queryRunner, 'users', 'credits', 'CREDITS', 'int NOT NULL DEFAULT 500');
    await this.safeRename(queryRunner, 'users', 'createdAt', 'CREATED_AT', 'datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)');
    await this.safeRename(queryRunner, 'users', 'updatedAt', 'UPDATED_AT', 'datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)');

    // Remove duplicate camelCase PHP columns (from old synchronize: true)
    await this.safeDropCol(queryRunner, 'users', 'userLevelId');
    await this.safeDropCol(queryRunner, 'users', 'aktivasiId');
    await this.safeDropCol(queryRunner, 'users', 'aktivasiValue');
    await this.safeDropCol(queryRunner, 'users', 'aktivasiStatus');
    await this.safeDropCol(queryRunner, 'users', 'paketId');
    await this.safeDropCol(queryRunner, 'users', 'userWallet');
    await this.safeDropCol(queryRunner, 'users', 'userBonus');
    await this.safeDropCol(queryRunner, 'users', 'userUpline');
    await this.safeDropCol(queryRunner, 'users', 'userSponsor');
    await this.safeDropCol(queryRunner, 'users', 'userPosition');
    await this.safeDropCol(queryRunner, 'users', 'userLeft');
    await this.safeDropCol(queryRunner, 'users', 'userRight');
    await this.safeDropCol(queryRunner, 'users', 'userPoint');
    await this.safeDropCol(queryRunner, 'users', 'userImport');
    await this.safeDropCol(queryRunner, 'users', 'userPeringkat');
    await this.safeDropCol(queryRunner, 'users', 'userLastOrder');
    await this.safeDropCol(queryRunner, 'users', 'userCronjobRun');
    await this.safeDropCol(queryRunner, 'users', 'userCreateBy');
    await this.safeDropCol(queryRunner, 'users', 'userPinTransfer');
    await this.safeDropCol(queryRunner, 'users', 'userUpdateBy');
    await this.safeDropCol(queryRunner, 'users', 'userStatus');

    // Add UPPER_SNAKE_CASE PHP columns
    await this.safeAddCol(queryRunner, 'users', 'USER_LEVEL_ID', 'int NULL');
    await this.safeAddCol(queryRunner, 'users', 'AKTIVASI_ID', 'varchar(25) NULL');
    await this.safeAddCol(queryRunner, 'users', 'AKTIVASI_VALUE', 'decimal(20,2) NULL');
    await this.safeAddCol(queryRunner, 'users', 'AKTIVASI_STATUS', 'tinyint NULL');
    await this.safeAddCol(queryRunner, 'users', 'PAKET_ID', 'int NULL');
    await this.safeAddCol(queryRunner, 'users', 'USER_WALLET', 'decimal(20,2) NULL');
    await this.safeAddCol(queryRunner, 'users', 'USER_BONUS', 'decimal(20,2) NULL');
    await this.safeAddCol(queryRunner, 'users', 'USER_UPLINE', 'int NULL');
    await this.safeAddCol(queryRunner, 'users', 'USER_SPONSOR', 'int NULL');
    await this.safeAddCol(queryRunner, 'users', 'USER_POSITION', 'int NULL');
    await this.safeAddCol(queryRunner, 'users', 'USER_LEFT', 'int NULL');
    await this.safeAddCol(queryRunner, 'users', 'USER_RIGHT', 'int NULL');
    await this.safeAddCol(queryRunner, 'users', 'USER_POINT', 'int NULL');
    await this.safeAddCol(queryRunner, 'users', 'USER_IMPORT', 'int NULL');
    await this.safeAddCol(queryRunner, 'users', 'USER_PERINGKAT', 'varchar(255) NULL');
    await this.safeAddCol(queryRunner, 'users', 'USER_LAST_ORDER', 'date NULL');
    await this.safeAddCol(queryRunner, 'users', 'USER_CRONJOB_RUN', 'int NOT NULL DEFAULT 0');
    await this.safeAddCol(queryRunner, 'users', 'USER_CREATE_BY', 'int NULL');
    await this.safeAddCol(queryRunner, 'users', 'USER_PIN_TRANSFER', 'varchar(6) NULL');
    await this.safeAddCol(queryRunner, 'users', 'USER_UPDATE_BY', 'int NULL');
    await this.safeAddCol(queryRunner, 'users', 'USER_STATUS', 'int NULL');

    // ===== list_accounts (before scheduled_posts because FK depends on it) =====
    await this.safeRename(queryRunner, 'list_accounts', 'id', 'ID', 'int NOT NULL AUTO_INCREMENT');
    await this.safeRename(queryRunner, 'list_accounts', 'user_id', 'USER_ID', 'int NULL');
    await this.safeRename(queryRunner, 'list_accounts', 'username', 'USERNAME', 'varchar(255) NOT NULL');
    await this.safeRename(queryRunner, 'list_accounts', 'email', 'EMAIL', 'varchar(255) NULL');
    await this.safeRename(queryRunner, 'list_accounts', 'password', 'PASSWORD', 'varchar(255) NULL');
    await this.safeRename(queryRunner, 'list_accounts', 'status', 'STATUS', "varchar(255) NOT NULL DEFAULT 'ACTIVE'");
    await this.safeRename(queryRunner, 'list_accounts', 'cookie', 'COOKIE', 'text NULL');
    await this.safeRename(queryRunner, 'list_accounts', 'created_at', 'CREATED_AT', 'datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)');
    await this.safeRename(queryRunner, 'list_accounts', 'updated_at', 'UPDATED_AT', 'datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)');

    // ===== video_jobs (already renamed from partial run, safeRename handles it) =====
    await this.safeRename(queryRunner, 'video_jobs', 'id', 'ID', 'varchar(36) NOT NULL');
    await this.safeRename(queryRunner, 'video_jobs', 'user_id', 'USER_ID', 'int NOT NULL');
    await this.safeRename(queryRunner, 'video_jobs', 'job_id', 'JOB_ID', 'varchar(50) NOT NULL');
    await this.safeRename(queryRunner, 'video_jobs', 'product_name', 'PRODUCT_NAME', 'varchar(255) NOT NULL');
    await this.safeRename(queryRunner, 'video_jobs', 'script', 'SCRIPT', 'text NOT NULL');
    await this.safeRename(queryRunner, 'video_jobs', 'voice_gender', 'VOICE_GENDER', "varchar(10) NOT NULL DEFAULT '-'");
    await this.safeRename(queryRunner, 'video_jobs', 'prompt_count', 'PROMPT_COUNT', 'int NOT NULL');
    await this.safeRename(queryRunner, 'video_jobs', 'target_count', 'TARGET_COUNT', 'int NOT NULL');
    await this.safeRename(queryRunner, 'video_jobs', 'prompts', 'PROMPTS', 'json NOT NULL');
    await this.safeRename(queryRunner, 'video_jobs', 'input_images', 'INPUT_IMAGES', 'json NOT NULL');
    await this.safeRename(queryRunner, 'video_jobs', 'thumbnail_url', 'THUMBNAIL_URL', 'varchar(500) NULL');
    await this.safeRename(queryRunner, 'video_jobs', 'status', 'STATUS', "enum('pending','processing','success','failed') NOT NULL DEFAULT 'pending'");
    await this.safeRename(queryRunner, 'video_jobs', 'is_pro', 'IS_PRO', 'tinyint NOT NULL DEFAULT 0');
    await this.safeRename(queryRunner, 'video_jobs', 'audio_url', 'AUDIO_URL', 'varchar(500) NULL');
    await this.safeRename(queryRunner, 'video_jobs', 'fail_msg', 'FAIL_MSG', 'text NULL');
    await this.safeRename(queryRunner, 'video_jobs', 'created_at', 'CREATED_AT', 'datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)');

    // ===== video_results (corrupted by failed synchronize - drop and recreate) =====
    await queryRunner.query(`DROP TABLE IF EXISTS \`video_results\``);
    await queryRunner.query(`
      CREATE TABLE \`video_results\` (
        \`ID\` varchar(36) NOT NULL,
        \`VIDEO_JOB_ID\` varchar(36) NOT NULL,
        \`VARIATION_NUMBER\` int NOT NULL,
        \`VIDEO_URL\` varchar(500) NOT NULL,
        \`FILE_NAME\` varchar(255) NOT NULL,
        \`IS_SCHEDULED\` tinyint NOT NULL DEFAULT 0,
        \`SCHEDULED_AT\` timestamp NULL,
        \`CREATED_AT\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`ID\`),
        INDEX \`IDX_VIDEO_RESULTS_JOB_ID\` (\`VIDEO_JOB_ID\`),
        CONSTRAINT \`FK_VIDEO_RESULTS_VIDEO_JOBS\` FOREIGN KEY (\`VIDEO_JOB_ID\`) REFERENCES \`video_jobs\`(\`ID\`) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
    `);

    // ===== histories =====
    await this.dropAllFks(queryRunner, 'histories', 'users');

    await this.safeRename(queryRunner, 'histories', 'id', 'ID', 'varchar(36) NOT NULL');
    await this.safeRename(queryRunner, 'histories', 'actionType', 'ACTION_TYPE', "enum('UPLOAD_IMAGES','GENERATE_TEXT','GENERATE_VIDEO') NOT NULL");
    await this.safeRename(queryRunner, 'histories', 'inputPayload', 'INPUT_PAYLOAD', 'json NULL');
    await this.safeRename(queryRunner, 'histories', 'outputResult', 'OUTPUT_RESULT', 'json NULL');
    await this.safeRename(queryRunner, 'histories', 'createdAt', 'CREATED_AT', 'datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)');
    await this.safeRename(queryRunner, 'histories', 'userId', 'USER_ID', 'int NOT NULL');

    if (!(await this.fkExists(queryRunner, 'histories', 'FK_HISTORIES_USERS'))) {
      await queryRunner.query(`ALTER TABLE \`histories\` ADD CONSTRAINT \`FK_HISTORIES_USERS\` FOREIGN KEY (\`USER_ID\`) REFERENCES \`users\`(\`ID\`) ON DELETE CASCADE`);
    }

    // ===== notifications (recreate if empty from migration 001) =====
    await this.safeRename(queryRunner, 'notifications', 'id', 'ID', 'varchar(36) NOT NULL');
    await this.safeRename(queryRunner, 'notifications', 'user_id', 'USER_ID', 'int NOT NULL');
    await this.safeRename(queryRunner, 'notifications', 'type', 'TYPE', "enum('video_success','video_failed') NOT NULL");
    await this.safeRename(queryRunner, 'notifications', 'title', 'TITLE', 'varchar(255) NOT NULL');
    await this.safeRename(queryRunner, 'notifications', 'message', 'MESSAGE', 'text NOT NULL');
    await this.safeRename(queryRunner, 'notifications', 'job_id', 'JOB_ID', 'varchar(100) NULL');
    await this.safeRename(queryRunner, 'notifications', 'is_read', 'IS_READ', 'tinyint NOT NULL DEFAULT 0');
    await this.safeRename(queryRunner, 'notifications', 'created_at', 'CREATED_AT', 'datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)');

    // ===== access_tokens =====
    await this.safeRename(queryRunner, 'access_tokens', 'id', 'ID', 'varchar(36) NOT NULL');
    await this.safeRename(queryRunner, 'access_tokens', 'token', 'TOKEN', 'varchar(255) NOT NULL');
    await this.safeRename(queryRunner, 'access_tokens', 'isUsed', 'IS_USED', 'tinyint NOT NULL DEFAULT 0');
    await this.safeRename(queryRunner, 'access_tokens', 'expiresAt', 'EXPIRES_AT', 'timestamp NOT NULL');
    await this.safeRename(queryRunner, 'access_tokens', 'createdAt', 'CREATED_AT', 'datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)');

    // ===== scheduled_posts =====
    await this.dropAllFks(queryRunner, 'scheduled_posts', 'list_accounts');

    await this.safeRename(queryRunner, 'scheduled_posts', 'id', 'ID', 'int NOT NULL AUTO_INCREMENT');
    await this.safeRename(queryRunner, 'scheduled_posts', 'account_id', 'ACCOUNT_ID', 'int NULL');
    await this.safeRename(queryRunner, 'scheduled_posts', 'scheduledTime', 'SCHEDULED_TIME', 'timestamp NOT NULL');
    await this.safeRename(queryRunner, 'scheduled_posts', 'username', 'USERNAME', 'varchar(255) NOT NULL');
    await this.safeRename(queryRunner, 'scheduled_posts', 'videoUrl', 'VIDEO_URL', 'varchar(255) NOT NULL');
    await this.safeRename(queryRunner, 'scheduled_posts', 'content', 'CONTENT', 'text NOT NULL');
    await this.safeRename(queryRunner, 'scheduled_posts', 'productId', 'PRODUCT_ID', 'varchar(255) NULL');
    await this.safeRename(queryRunner, 'scheduled_posts', 'statusPost', 'STATUS_POST', "enum('PENDING','PROCESSING','DONE','FAILED') NOT NULL DEFAULT 'PENDING'");
    await this.safeRename(queryRunner, 'scheduled_posts', 'createdAt', 'CREATED_AT', 'datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)');
    await this.safeRename(queryRunner, 'scheduled_posts', 'updatedAt', 'UPDATED_AT', 'datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)');

    if (!(await this.fkExists(queryRunner, 'scheduled_posts', 'FK_SCHEDULED_POSTS_LIST_ACCOUNTS'))) {
      await queryRunner.query(`ALTER TABLE \`scheduled_posts\` ADD CONSTRAINT \`FK_SCHEDULED_POSTS_LIST_ACCOUNTS\` FOREIGN KEY (\`ACCOUNT_ID\`) REFERENCES \`list_accounts\`(\`ID\`) ON DELETE CASCADE`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // One-way migration
  }
}
