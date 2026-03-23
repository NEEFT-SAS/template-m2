import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCalendarAssignmentsPlayerScrimmer20260309000300 implements MigrationInterface {
  name = 'UpdateCalendarAssignmentsPlayerScrimmer20260309000300';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE calendar_activity_assignments
      MODIFY target_type enum('USER', 'PLAYER', 'TEAM') NOT NULL DEFAULT 'USER'
    `);

    await queryRunner.query(`
      UPDATE calendar_activity_assignments
      SET target_type = 'PLAYER'
      WHERE target_type = 'USER'
    `);

    await queryRunner.query(`
      ALTER TABLE calendar_activity_assignments
      MODIFY target_type enum('PLAYER', 'TEAM') NOT NULL DEFAULT 'PLAYER'
    `);

    await queryRunner.query(`
      ALTER TABLE calendar_activity_assignments
      ADD COLUMN selected_scrimmer_profile_id char(36) NULL AFTER target_team_name
    `);

    await queryRunner.query(`
      ALTER TABLE calendar_activity_assignments
      ADD CONSTRAINT FK_calendar_activity_assignments_selected_scrimmer_profile_id
      FOREIGN KEY (selected_scrimmer_profile_id) REFERENCES user_profiles(id) ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE INDEX IDX_calendar_activity_assignments_selected_scrimmer_profile_id
      ON calendar_activity_assignments (selected_scrimmer_profile_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP INDEX IDX_calendar_activity_assignments_selected_scrimmer_profile_id
      ON calendar_activity_assignments
    `);

    await queryRunner.query(`
      ALTER TABLE calendar_activity_assignments
      DROP FOREIGN KEY FK_calendar_activity_assignments_selected_scrimmer_profile_id
    `);

    await queryRunner.query(`
      ALTER TABLE calendar_activity_assignments
      DROP COLUMN selected_scrimmer_profile_id
    `);

    await queryRunner.query(`
      ALTER TABLE calendar_activity_assignments
      MODIFY target_type enum('USER', 'TEAM') NOT NULL DEFAULT 'USER'
    `);

    await queryRunner.query(`
      UPDATE calendar_activity_assignments
      SET target_type = 'USER'
      WHERE target_type = 'PLAYER'
    `);
  }
}
