import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RscGameEntity } from '../rsc-games.entity';
import { RscCharacterEntity } from '../base/rsc-characters.entity';

@Entity('rsc_game_characters')
@Index(['gameId', 'rscCharacterId'], { unique: true })
export class RscGameCharacterEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'game_id', type: 'int' })
  gameId!: number;

  @Column({ name: 'character_id', type: 'int' })
  rscCharacterId!: number;

  @Column({ name: 'order_index', type: 'int', default: 0 })
  order!: number;

  @ManyToOne(() => RscGameEntity, (game) => game.characters, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'game_id' })
  game!: RscGameEntity;

  @ManyToOne(() => RscCharacterEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'character_id' })
  character!: RscCharacterEntity;
}
