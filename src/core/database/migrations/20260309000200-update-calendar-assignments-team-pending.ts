import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCalendarAssignmentsTeamPending20260309000200 implements MigrationInterface {
  name = 'UpdateCalendarAssignmentsTeamPending20260309000200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE calendar_activity_assignments
      DROP INDEX UQ_calendar_activity_assignments_activity_profile
    `);

    await queryRunner.query(`
      ALTER TABLE calendar_activity_assignments
      MODIFY profile_id char(36) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE calendar_activity_assignments
      ADD COLUMN target_type enum('USER', 'TEAM') NOT NULL DEFAULT 'USER' AFTER activity_id,
      ADD COLUMN target_team_id char(36) NULL AFTER profile_id,
      ADD COLUMN target_team_name varchar(255) NULL AFTER target_team_id
    `);

    await queryRunner.query(`
      ALTER TABLE calendar_activity_assignments
      MODIFY assignment_status enum('PENDING', 'ACCEPTED', 'DECLINED') NOT NULL DEFAULT 'PENDING'
    `);

    await queryRunner.query(`
      ALTER TABLE calendar_activity_assignments
      ADD CONSTRAINT FK_calendar_activity_assignments_target_team_id
      FOREIGN KEY (target_team_id) REFERENCES teams(id) ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_calendar_activity_assignments_target_team_id
      ON calendar_activity_assignments (target_team_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IDX_calendar_activity_assignments_target_team_id ON calendar_activity_assignments
    `);

    await queryRunner.query(`
      ALTER TABLE calendar_activity_assignments
      DROP FOREIGN KEY FK_calendar_activity_assignments_target_team_id
    `);

    await queryRunner.query(`
      ALTER TABLE calendar_activity_assignments
      MODIFY assignment_status enum('ACCEPTED', 'DECLINED') NOT NULL DEFAULT 'ACCEPTED'
    `);

    await queryRunner.query(`
      ALTER TABLE calendar_activity_assignments
      DROP COLUMN target_team_name,
      DROP COLUMN target_team_id,
      DROP COLUMN target_type
    `);

    await queryRunner.query(`
      ALTER TABLE calendar_activity_assignments
      MODIFY profile_id char(36) NOT NULL
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX UQ_calendar_activity_assignments_activity_profile
      ON calendar_activity_assignments (activity_id, profile_id)
    `);
  }
}
