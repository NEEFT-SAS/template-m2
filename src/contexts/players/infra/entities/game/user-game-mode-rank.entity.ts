import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { UserGameEntity } from './user-game.entity';
import { RscGameModeEntity } from '@/contexts/resources/infra/persistence/entities/games/relations/rsc-game-modes.entity';
import { RscGameRankEntity } from '@/contexts/resources/infra/persistence/entities/games/relations/rsc-game-ranks.entity';

@Entity('player_game_mode_ranks')
@Unique('uq_player_game_mode_ranks_game_mode', ['game', 'mode'])
export class UserGameModeRankEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', nullable: true })
  elo!: number | null;

  @ManyToOne(() => UserGameEntity, (game) => game.modeRanks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_game_id' })
  game!: UserGameEntity;

  @ManyToOne(() => RscGameModeEntity, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rsc_game_mode_id' })
  mode!: RscGameModeEntity;

  @ManyToOne(() => RscGameRankEntity, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rsc_game_rank_id' })
  rank!: RscGameRankEntity;
}
