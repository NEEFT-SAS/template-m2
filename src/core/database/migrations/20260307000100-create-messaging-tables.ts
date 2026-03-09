import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateMessagingTables20260307000100 implements MigrationInterface {
  name = 'CreateMessagingTables20260307000100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasConversations = await this.hasTable(queryRunner, 'messaging_conversations');
    const hasMessages = await this.hasTable(queryRunner, 'messaging_messages');
    const hasReads = await this.hasTable(queryRunner, 'messaging_message_reads');

    if (!hasConversations) {
      await queryRunner.query(`
        CREATE TABLE messaging_conversations (
          id CHAR(36) NOT NULL PRIMARY KEY,
          conversation_key VARCHAR(255) NOT NULL,
          participant_a_type ENUM('PLAYER', 'TEAM') NOT NULL,
          participant_a_player_id CHAR(36) NULL,
          participant_a_team_id CHAR(36) NULL,
          participant_b_type ENUM('PLAYER', 'TEAM') NOT NULL,
          participant_b_player_id CHAR(36) NULL,
          participant_b_team_id CHAR(36) NULL,
          last_message_preview VARCHAR(500) NULL,
          last_message_sender_profile_id CHAR(36) NULL,
          last_message_at DATETIME(6) NULL,
          created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
          UNIQUE KEY uq_messaging_conversations_key (conversation_key),
          KEY idx_messaging_conversations_a_player_last (participant_a_player_id, last_message_at),
          KEY idx_messaging_conversations_a_team_last (participant_a_team_id, last_message_at),
          KEY idx_messaging_conversations_b_player_last (participant_b_player_id, last_message_at),
          KEY idx_messaging_conversations_b_team_last (participant_b_team_id, last_message_at),
          KEY idx_messaging_conversations_last_message_at (last_message_at),
          CONSTRAINT fk_messaging_conversations_a_player FOREIGN KEY (participant_a_player_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
          CONSTRAINT fk_messaging_conversations_a_team FOREIGN KEY (participant_a_team_id) REFERENCES teams(id) ON DELETE CASCADE,
          CONSTRAINT fk_messaging_conversations_b_player FOREIGN KEY (participant_b_player_id) REFERENCES user_profiles(id) ON DELETE CASCADE,
          CONSTRAINT fk_messaging_conversations_b_team FOREIGN KEY (participant_b_team_id) REFERENCES teams(id) ON DELETE CASCADE,
          CONSTRAINT fk_messaging_conversations_last_sender FOREIGN KEY (last_message_sender_profile_id) REFERENCES user_profiles(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }

    if (!hasMessages) {
      await queryRunner.query(`
        CREATE TABLE messaging_messages (
          id CHAR(36) NOT NULL PRIMARY KEY,
          conversation_id CHAR(36) NOT NULL,
          sender_profile_id CHAR(36) NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          KEY idx_messaging_messages_conversation_created (conversation_id, created_at),
          KEY idx_messaging_messages_sender_created (sender_profile_id, created_at),
          CONSTRAINT fk_messaging_messages_conversation FOREIGN KEY (conversation_id) REFERENCES messaging_conversations(id) ON DELETE CASCADE,
          CONSTRAINT fk_messaging_messages_sender FOREIGN KEY (sender_profile_id) REFERENCES user_profiles(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }

    if (!hasReads) {
      await queryRunner.query(`
        CREATE TABLE messaging_message_reads (
          id CHAR(36) NOT NULL PRIMARY KEY,
          message_id CHAR(36) NOT NULL,
          reader_profile_id CHAR(36) NOT NULL,
          read_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
          UNIQUE KEY uq_messaging_message_reads_message_reader (message_id, reader_profile_id),
          KEY idx_messaging_message_reads_reader_read_at (reader_profile_id, read_at),
          CONSTRAINT fk_messaging_message_reads_message FOREIGN KEY (message_id) REFERENCES messaging_messages(id) ON DELETE CASCADE,
          CONSTRAINT fk_messaging_message_reads_reader FOREIGN KEY (reader_profile_id) REFERENCES user_profiles(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasReads = await this.hasTable(queryRunner, 'messaging_message_reads');
    const hasMessages = await this.hasTable(queryRunner, 'messaging_messages');
    const hasConversations = await this.hasTable(queryRunner, 'messaging_conversations');

    if (hasReads) {
      await queryRunner.query('DROP TABLE messaging_message_reads');
    }

    if (hasMessages) {
      await queryRunner.query('DROP TABLE messaging_messages');
    }

    if (hasConversations) {
      await queryRunner.query('DROP TABLE messaging_conversations');
    }
  }

  private async hasTable(queryRunner: QueryRunner, tableName: string): Promise<boolean> {
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
