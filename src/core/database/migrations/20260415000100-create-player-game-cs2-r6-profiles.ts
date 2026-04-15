import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlayerGameCs2R6Profiles20260415000100
  implements MigrationInterface
{
  name = 'CreatePlayerGameCs2R6Profiles20260415000100';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE player_game_counter_strike_2 (
        id int NOT NULL AUTO_INCREMENT,
        player_game_id int NOT NULL,
        username varchar(255) NOT NULL,
        UNIQUE INDEX uq_player_game_counter_strike_2_player_game_id (player_game_id),
        PRIMARY KEY (id),
        CONSTRAINT fk_player_game_counter_strike_2_player_game_id FOREIGN KEY (player_game_id) REFERENCES player_games(id) ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE TABLE player_game_rainbow_six_siege (
        id int NOT NULL AUTO_INCREMENT,
        player_game_id int NOT NULL,
        username varchar(255) NOT NULL,
        UNIQUE INDEX uq_player_game_rainbow_six_siege_player_game_id (player_game_id),
        PRIMARY KEY (id),
        CONSTRAINT fk_player_game_rainbow_six_siege_player_game_id FOREIGN KEY (player_game_id) REFERENCES player_games(id) ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE player_game_rainbow_six_siege`);
    await queryRunner.query(`DROP TABLE player_game_counter_strike_2`);
  }
}
