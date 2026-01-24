import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RscGameEntity } from '../rsc-games.entity';
import { RscRankEntity } from '../base/rsc-ranks.entity';

@Entity('rsc_game_ranks')
@Index(['gameId', 'rscRankId'], { unique: true })
export class RscGameRankEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'game_id', type: 'int' })
  gameId!: number;

  @Column({ name: 'rank_id', type: 'int' })
  rscRankId!: number;

  @Column({ name: 'order_index', type: 'int', default: 0 })
  order!: number;

  @ManyToOne(() => RscGameEntity, (game) => game.ranks, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'game_id' })
  game!: RscGameEntity;

  @ManyToOne(() => RscRankEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rank_id' })
  rank!: RscRankEntity;
}
