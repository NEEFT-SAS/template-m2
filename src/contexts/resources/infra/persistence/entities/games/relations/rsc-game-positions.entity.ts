import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RscGameEntity } from '../rsc-games.entity';
import { RscPositionEntity } from '../base/rsc-positions.entity';

@Entity('rsc_game_positions')
@Index(['gameId', 'rscPositionId'], { unique: true })
export class RscGamePositionEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'game_id', type: 'int' })
  gameId!: number;

  @Column({ name: 'position_id', type: 'int' })
  rscPositionId!: number;

  @Column({ name: 'order_index', type: 'int', default: 0 })
  order!: number;

  @ManyToOne(() => RscGameEntity, (game) => game.positions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'game_id' })
  game!: RscGameEntity;

  @ManyToOne(() => RscPositionEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'position_id' })
  position!: RscPositionEntity;
}
