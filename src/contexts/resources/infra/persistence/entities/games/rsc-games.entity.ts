import { Column, CreateDateColumn, Entity, Index, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RscGameCharacterEntity } from './relations/rsc-game-characters.entity';
import { RscGameModeEntity } from './relations/rsc-game-modes.entity';
import { RscGamePlatformEntity } from './relations/rsc-game-platforms.entity';
import { RscGamePositionEntity } from './relations/rsc-game-positions.entity';
import { RscGameRankEntity } from './relations/rsc-game-ranks.entity';
import { RscGameSeasonEntity } from './relations/rsc-game-seasons.entity';

@Entity('rsc_games')
export class RscGameEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 120 })
  name!: string;

  @Column({ name: 'short_name', type: 'varchar', length: 40, nullable: true })
  shortName!: string | null;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 120 })
  slug!: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  genre!: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  developer!: string | null;

  @Column({ name: 'release_date', type: 'date', nullable: true })
  releaseDate!: Date | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  edition!: string | null;

  @Column({ name: 'official_link', type: 'varchar', length: 255, nullable: true })
  officialLink!: string | null;

  @Column({ name: 'api_link', type: 'varchar', length: 255, nullable: true })
  apiLink!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  icon!: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  banner!: string | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @OneToMany(() => RscGamePlatformEntity, (rel) => rel.game)
  platforms!: RscGamePlatformEntity[];

  @OneToMany(() => RscGameModeEntity, (rel) => rel.game)
  modes!: RscGameModeEntity[];

  @OneToMany(() => RscGamePositionEntity, (rel) => rel.game)
  positions!: RscGamePositionEntity[];

  @OneToMany(() => RscGameRankEntity, (rel) => rel.game)
  ranks!: RscGameRankEntity[];

  @OneToMany(() => RscGameSeasonEntity, (rel) => rel.game)
  seasons!: RscGameSeasonEntity[];

  @OneToMany(() => RscGameCharacterEntity, (rel) => rel.game)
  characters!: RscGameCharacterEntity[];
}
