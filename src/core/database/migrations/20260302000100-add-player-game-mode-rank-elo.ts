import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPlayerGameModeRankElo20260302000100 implements MigrationInterface {
  name = 'AddPlayerGameModeRankElo20260302000100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE player_game_mode_ranks
      ADD COLUMN elo INT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE player_game_mode_ranks
      DROP COLUMN elo
    `);
  }
}
