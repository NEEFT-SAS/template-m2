import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RscGameEntity } from '../rsc-games.entity';
import { RscSeasonEntity } from '../base/rsc-seasons.entity';

@Entity('rsc_game_seasons')
@Index(['gameId', 'rscSeasonId'], { unique: true })
export class RscGameSeasonEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'game_id', type: 'int' })
  gameId!: number;

  @Column({ name: 'season_id', type: 'int' })
  rscSeasonId!: number;

  @Column({ name: 'order_index', type: 'int', default: 0 })
  order!: number;

  @ManyToOne(() => RscGameEntity, (game) => game.seasons, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'game_id' })
  game!: RscGameEntity;

  @ManyToOne(() => RscSeasonEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'season_id' })
  season!: RscSeasonEntity;
}
