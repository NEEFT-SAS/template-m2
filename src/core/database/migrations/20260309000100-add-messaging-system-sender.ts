import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMessagingSystemSender20260309000100
  implements MigrationInterface
{
  name = 'AddMessagingSystemSender20260309000100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasMessages = await this.hasTable(queryRunner, 'messaging_messages');
    const hasConversations = await this.hasTable(
      queryRunner,
      'messaging_conversations',
    );

    if (hasMessages) {
      const hasSenderType = await this.hasColumn(
        queryRunner,
        'messaging_messages',
        'sender_type',
      );
      if (!hasSenderType) {
        await queryRunner.query(`
          ALTER TABLE messaging_messages
          ADD COLUMN sender_type ENUM('PROFILE', 'SYSTEM') NOT NULL DEFAULT 'PROFILE' AFTER conversation_id
        `);
      }

      await queryRunner.query(`
        ALTER TABLE messaging_messages
        MODIFY COLUMN sender_profile_id CHAR(36) NULL
      `);

      const hasSenderSystemKey = await this.hasColumn(
        queryRunner,
        'messaging_messages',
        'sender_system_key',
      );
      if (!hasSenderSystemKey) {
        await queryRunner.query(`
          ALTER TABLE messaging_messages
          ADD COLUMN sender_system_key VARCHAR(64) NULL AFTER sender_profile_id
        `);
      }

      const hasSenderTypeIndex = await this.hasIndex(
        queryRunner,
        'messaging_messages',
        'idx_messaging_messages_sender_type_system_created',
      );
      if (!hasSenderTypeIndex) {
        await queryRunner.query(`
          CREATE INDEX idx_messaging_messages_sender_type_system_created
          ON messaging_messages(sender_type, sender_system_key, created_at)
        `);
      }
    }

    if (hasConversations) {
      const hasLastSenderType = await this.hasColumn(
        queryRunner,
        'messaging_conversations',
        'last_message_sender_type',
      );
      if (!hasLastSenderType) {
        await queryRunner.query(`
          ALTER TABLE messaging_conversations
          ADD COLUMN last_message_sender_type ENUM('PROFILE', 'SYSTEM') NULL AFTER last_message_preview
        `);
      }

      const hasLastSenderSystemKey = await this.hasColumn(
        queryRunner,
        'messaging_conversations',
        'last_message_sender_system_key',
      );
      if (!hasLastSenderSystemKey) {
        await queryRunner.query(`
          ALTER TABLE messaging_conversations
          ADD COLUMN last_message_sender_system_key VARCHAR(64) NULL AFTER last_message_sender_profile_id
        `);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasMessages = await this.hasTable(queryRunner, 'messaging_messages');
    const hasConversations = await this.hasTable(
      queryRunner,
      'messaging_conversations',
    );

    if (hasConversations) {
      const hasLastSenderSystemKey = await this.hasColumn(
        queryRunner,
        'messaging_conversations',
        'last_message_sender_system_key',
      );
      if (hasLastSenderSystemKey) {
        await queryRunner.query(`
          ALTER TABLE messaging_conversations
          DROP COLUMN last_message_sender_system_key
        `);
      }

      const hasLastSenderType = await this.hasColumn(
        queryRunner,
        'messaging_conversations',
        'last_message_sender_type',
      );
      if (hasLastSenderType) {
        await queryRunner.query(`
          ALTER TABLE messaging_conversations
          DROP COLUMN last_message_sender_type
        `);
      }
    }

    if (hasMessages) {
      const hasSenderTypeIndex = await this.hasIndex(
        queryRunner,
        'messaging_messages',
        'idx_messaging_messages_sender_type_system_created',
      );
      if (hasSenderTypeIndex) {
        await queryRunner.query(`
          DROP INDEX idx_messaging_messages_sender_type_system_created
          ON messaging_messages
        `);
      }

      const hasSenderSystemKey = await this.hasColumn(
        queryRunner,
        'messaging_messages',
        'sender_system_key',
      );
      if (hasSenderSystemKey) {
        await queryRunner.query(`
          ALTER TABLE messaging_messages
          DROP COLUMN sender_system_key
        `);
      }

      const hasSenderType = await this.hasColumn(
        queryRunner,
        'messaging_messages',
        'sender_type',
      );
      if (hasSenderType) {
        await queryRunner.query(`
          ALTER TABLE messaging_messages
          DROP COLUMN sender_type
        `);
      }

      await queryRunner.query(`
        ALTER TABLE messaging_messages
        MODIFY COLUMN sender_profile_id CHAR(36) NOT NULL
      `);
    }
  }

  private async hasTable(
    queryRunner: QueryRunner,
    tableName: string,
  ): Promise<boolean> {
    const rows = await queryRunner.query(
      `
        SELECT COUNT(*) AS count
        FROM information_schema.TABLES
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
      `,
      [tableName],
    );

    return Number(rows?.[0]?.count ?? 0) > 0;
  }

  private async hasColumn(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
  ): Promise<boolean> {
    const rows = await queryRunner.query(
      `
        SELECT COUNT(*) AS count
        FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND COLUMN_NAME = ?
      `,
      [tableName, columnName],
    );

    return Number(rows?.[0]?.count ?? 0) > 0;
  }

  private async hasIndex(
    queryRunner: QueryRunner,
    tableName: string,
    indexName: string,
  ): Promise<boolean> {
    const rows = await queryRunner.query(
      `
        SELECT COUNT(*) AS count
        FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = ?
          AND INDEX_NAME = ?
      `,
      [tableName, indexName],
    );

    return Number(rows?.[0]?.count ?? 0) > 0;
  }
}
