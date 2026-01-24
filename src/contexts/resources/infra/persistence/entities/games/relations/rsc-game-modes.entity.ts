import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RscGameEntity } from '../rsc-games.entity';
import { RscModeEntity } from '../base/rsc-modes.entity';

@Entity('rsc_game_modes')
@Index(['gameId', 'rscModeId'], { unique: true })
export class RscGameModeEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'game_id', type: 'int' })
  gameId!: number;

  @Column({ name: 'mode_id', type: 'int' })
  rscModeId!: number;

  @Column({ name: 'order_index', type: 'int', default: 0 })
  order!: number;

  @ManyToOne(() => RscGameEntity, (game) => game.modes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'game_id' })
  game!: RscGameEntity;

  @ManyToOne(() => RscModeEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mode_id' })
  mode!: RscModeEntity;
}
