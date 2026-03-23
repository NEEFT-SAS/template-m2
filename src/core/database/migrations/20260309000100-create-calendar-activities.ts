import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCalendarActivities20260309000100 implements MigrationInterface {
  name = 'CreateCalendarActivities20260309000100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE calendar_activities (
        id char(36) NOT NULL,
        team_id char(36) NOT NULL,
        title varchar(140) NOT NULL,
        description text NULL,
        activity_type enum('SCRIM', 'TRAINING', 'REVIEW', 'MATCH', 'OTHER') NOT NULL,
        activity_category enum('EVENT', 'NON_EVENT') NOT NULL DEFAULT 'EVENT',
        visibility enum('PUBLIC', 'PRIVATE') NOT NULL DEFAULT 'PUBLIC',
        status enum('DRAFT', 'PROPOSED', 'CONFIRMED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
        starts_at datetime NOT NULL,
        ends_at datetime NOT NULL,
        created_by_profile_id char(36) NOT NULL,
        created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX IDX_calendar_activities_team_id (team_id),
        INDEX IDX_calendar_activities_starts_at (starts_at),
        INDEX IDX_calendar_activities_visibility (visibility),
        PRIMARY KEY (id),
        CONSTRAINT FK_calendar_activities_team_id FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT FK_calendar_activities_created_by_profile_id FOREIGN KEY (created_by_profile_id) REFERENCES user_profiles(id) ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE calendar_activity_assignments (
        id char(36) NOT NULL,
        activity_id char(36) NOT NULL,
        profile_id char(36) NOT NULL,
        team_member_id char(36) NULL,
        assignment_status enum('ACCEPTED', 'DECLINED') NOT NULL DEFAULT 'ACCEPTED',
        created_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        updated_at datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        INDEX IDX_calendar_activity_assignments_activity_id (activity_id),
        INDEX IDX_calendar_activity_assignments_profile_id (profile_id),
        UNIQUE INDEX UQ_calendar_activity_assignments_activity_profile (activity_id, profile_id),
        PRIMARY KEY (id),
        CONSTRAINT FK_calendar_activity_assignments_activity_id FOREIGN KEY (activity_id) REFERENCES calendar_activities(id) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT FK_calendar_activity_assignments_profile_id FOREIGN KEY (profile_id) REFERENCES user_profiles(id) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT FK_calendar_activity_assignments_team_member_id FOREIGN KEY (team_member_id) REFERENCES team_members(id) ON DELETE SET NULL ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE calendar_activity_assignments`);
    await queryRunner.query(`DROP TABLE calendar_activities`);
  }
}
