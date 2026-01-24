import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { UserGameEntity } from './user-game.entity';
import { RscPlatformEntity } from '@/contexts/resources/infra/persistence/entities/games/base/rsc-platforms.entity';

@Entity('player_game_platforms')
@Unique('uq_player_game_platforms_game_platform', ['game', 'platform'])
export class UserGamePlatformEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => UserGameEntity, (game) => game.platforms, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_game_id' })
  game!: UserGameEntity;

  @ManyToOne(() => RscPlatformEntity, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rsc_platform_id' })
  platform!: RscPlatformEntity;
}
