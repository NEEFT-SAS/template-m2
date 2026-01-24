import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { UserGameEntity } from './user-game.entity';
import { RscCharacterEntity } from '@/contexts/resources/infra/persistence/entities/games/base/rsc-characters.entity';

@Entity('player_game_characters')
@Unique('uq_player_game_characters_game_character', ['game', 'character'])
export class UserGameCharacterEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => UserGameEntity, (game) => game.characters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_game_id' })
  game!: UserGameEntity;

  @ManyToOne(() => RscCharacterEntity, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rsc_character_id' })
  character!: RscCharacterEntity;
}
