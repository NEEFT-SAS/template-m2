import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixRecruitmentTargetEnum20260324000100 implements MigrationInterface {
  name = 'FixRecruitmentTargetEnum20260324000100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE team_recruitments
      MODIFY target enum('OWNER', 'ADMIN', 'MANAGER', 'COACH', 'PLAYER', 'ANALYST', 'STAFF', 'OTHER', 'MEMBER') NOT NULL DEFAULT 'PLAYER'
    `);

    await queryRunner.query(`
      UPDATE team_recruitments
      SET target = 'MEMBER'
      WHERE target <> 'STAFF'
    `);

    await queryRunner.query(`
      ALTER TABLE team_recruitments
      MODIFY target enum('MEMBER', 'STAFF') NOT NULL DEFAULT 'MEMBER'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE team_recruitments
      MODIFY target enum('MEMBER', 'STAFF', 'PLAYER', 'OWNER', 'ADMIN', 'MANAGER', 'COACH', 'ANALYST', 'OTHER') NOT NULL DEFAULT 'MEMBER'
    `);

    await queryRunner.query(`
      UPDATE team_recruitments
      SET target = 'PLAYER'
      WHERE target = 'MEMBER'
    `);

    await queryRunner.query(`
      ALTER TABLE team_recruitments
      MODIFY target enum('OWNER', 'ADMIN', 'MANAGER', 'COACH', 'PLAYER', 'ANALYST', 'STAFF', 'OTHER') NOT NULL DEFAULT 'PLAYER'
    `);
  }
}
