import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateProfileReports20260228000200 implements MigrationInterface {
  name = 'CreateProfileReports20260228000200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE profile_reports (
        id char(36) NOT NULL,
        target_type enum('user', 'team') NOT NULL,
        reason enum('cheating', 'harassment', 'hate_speech', 'toxic_behavior', 'impersonation', 'scam', 'spam', 'inappropriate_content', 'other') NOT NULL,
        message text NULL,
        status enum('PENDING', 'IN_REVIEW', 'RESOLVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
        reporter_profile_id char(36) NOT NULL,
        reported_user_profile_id char(36) NULL,
        reported_team_id char(36) NULL,
        created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX IDX_profile_reports_reporter_profile_id (reporter_profile_id),
        INDEX IDX_profile_reports_reported_user_profile_id (reported_user_profile_id),
        INDEX IDX_profile_reports_reported_team_id (reported_team_id),
        PRIMARY KEY (id),
        CONSTRAINT FK_profile_reports_reporter_profile_id FOREIGN KEY (reporter_profile_id) REFERENCES user_profiles(id) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT FK_profile_reports_reported_user_profile_id FOREIGN KEY (reported_user_profile_id) REFERENCES user_profiles(id) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT FK_profile_reports_reported_team_id FOREIGN KEY (reported_team_id) REFERENCES teams(id) ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE profile_reports`);
  }
}
