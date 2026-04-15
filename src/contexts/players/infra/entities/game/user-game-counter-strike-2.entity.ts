import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserGameEntity } from './user-game.entity';

@Entity('player_game_counter_strike_2')
export class UserGameCounterStrike2Entity {
  @PrimaryGeneratedColumn()
  id!: number;

  @OneToOne(() => UserGameEntity, (game) => game.counterStrike2Profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'player_game_id' })
  game!: UserGameEntity;

  @Column({ type: 'varchar', length: 255 })
  username!: string;
}
