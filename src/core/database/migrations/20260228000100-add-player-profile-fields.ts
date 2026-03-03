import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlayerProfileFields20260228000100 implements MigrationInterface {
  name = 'AddPlayerProfileFields20260228000100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE user_profiles
      ADD COLUMN phone VARCHAR(32) NULL,
      ADD COLUMN work_sector VARCHAR(255) NULL,
      ADD COLUMN contract_type VARCHAR(255) NULL,
      ADD COLUMN is_disabled_player TINYINT(1) NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE user_profiles
      DROP COLUMN is_disabled_player,
      DROP COLUMN contract_type,
      DROP COLUMN work_sector,
      DROP COLUMN phone
    `);
  }
}
