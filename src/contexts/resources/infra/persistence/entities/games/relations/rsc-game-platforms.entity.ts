import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RscGameEntity } from '../rsc-games.entity';
import { RscPlatformEntity } from '../base/rsc-platforms.entity';

@Entity('rsc_game_platforms')
@Index(['gameId', 'rscPlatformId'], { unique: true })
export class RscGamePlatformEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'game_id', type: 'int' })
  gameId!: number;

  @Column({ name: 'platform_id', type: 'int' })
  rscPlatformId!: number;

  @Column({ name: 'order_index', type: 'int', default: 0 })
  order!: number;

  @ManyToOne(() => RscGameEntity, (game) => game.platforms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'game_id' })
  game!: RscGameEntity;

  @ManyToOne(() => RscPlatformEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'platform_id' })
  platform!: RscPlatformEntity;
}
