import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserGameEntity } from './user-game.entity';

@Entity('player_game_rocket_league')
export class UserGameRocketLeagueEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => UserGameEntity, (game) => game.rocketLeagueProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_game_id' })
  game!: UserGameEntity;

  @Column({ type: 'varchar', length: 255 })
  username!: string;
}
