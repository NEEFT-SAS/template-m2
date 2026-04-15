import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTeamRecruitmentPlatforms20260415000200 implements MigrationInterface {
  name = 'CreateTeamRecruitmentPlatforms20260415000200';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE team_recruitment_platforms (
        recruitment_id char(36) NOT NULL,
        game_platform_id int NOT NULL,
        PRIMARY KEY (recruitment_id, game_platform_id),
        INDEX idx_team_recruitment_platforms_recruitment_id (recruitment_id),
        INDEX idx_team_recruitment_platforms_game_platform_id (game_platform_id),
        CONSTRAINT fk_team_recruitment_platforms_recruitment_id FOREIGN KEY (recruitment_id) REFERENCES team_recruitments(id) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT fk_team_recruitment_platforms_game_platform_id FOREIGN KEY (game_platform_id) REFERENCES rsc_game_platforms(id) ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE team_recruitment_platforms`);
  }
}
