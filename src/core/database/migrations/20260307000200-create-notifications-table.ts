import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateNotificationsTable20260307000200 implements MigrationInterface {
  name = 'CreateNotificationsTable20260307000200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasNotifications = await this.hasTable(queryRunner, 'notifications');

    if (!hasNotifications) {
      await queryRunner.query(`
        CREATE TABLE notifications (
          id CHAR(36) NOT NULL PRIMARY KEY,
          recipient_profile_id CHAR(36) NOT NULL,
          actor_profile_id CHAR(36) NULL,
          type VARCHAR(80) NOT NULL,
          title VARCHAR(255) NULL,
          body VARCHAR(500) NULL,
          payload JSON NULL,
          context_conversation_id CHAR(36) NULL,
          context_message_id CHAR(36) NULL,
          read_at DATETIME(6) NULL,
          created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          KEY idx_notifications_recipient_created (recipient_profile_id, created_at),
          KEY idx_notifications_recipient_read (recipient_profile_id, read_at),
          KEY idx_notifications_context_conversation (context_conversation_id),
          KEY idx_notifications_context_message (context_message_id),
          UNIQUE KEY uq_notifications_message_recipient (recipient_profile_id, type, context_message_id),
          CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_profile_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
          CONSTRAINT fk_notifications_actor FOREIGN KEY (actor_profile_id) REFERENCES user_profiles(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasNotifications = await this.hasTable(queryRunner, 'notifications');

    if (hasNotifications) {
      await queryRunner.query('DROP TABLE notifications');
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
}
