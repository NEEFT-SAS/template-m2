import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { UserGameEntity } from './user-game.entity';
import { RscPositionEntity } from '@/contexts/resources/infra/persistence/entities/games/base/rsc-positions.entity';

@Entity('player_game_positions')
@Unique('uq_player_game_positions_game_position', ['game', 'position'])
export class UserGamePositionEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => UserGameEntity, (game) => game.positions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_game_id' })
  game!: UserGameEntity;

  @ManyToOne(() => RscPositionEntity, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rsc_position_id' })
  position!: RscPositionEntity;
}
