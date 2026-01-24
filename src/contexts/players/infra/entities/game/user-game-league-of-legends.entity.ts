import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserGameEntity } from './user-game.entity';

@Entity('player_game_league_of_legends')
export class UserGameLeagueOfLegendsEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => UserGameEntity, (game) => game.leagueOfLegendsProfile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_game_id' })
  game!: UserGameEntity;

  @Column({ type: 'varchar', length: 128, nullable: true })
  puuid!: string | null;

  @Column({ type: 'varchar', length: 255 })
  username!: string;

  @Column({ type: 'varchar', length: 32 })
  tagLine!: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  region!: string | null;
}
