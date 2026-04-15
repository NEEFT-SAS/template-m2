import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { RscGameEntity } from '@/contexts/resources/infra/persistence/entities/games/rsc-games.entity';
import { UserGamePositionEntity } from './user-game-position.entity';
import { UserGamePlatformEntity } from './user-game-platform.entity';
import { UserGameCharacterEntity } from './user-game-character.entity';
import { UserGameLeagueOfLegendsEntity } from './user-game-league-of-legends.entity';
import { UserGameRocketLeagueEntity } from './user-game-rocket-league.entity';
import { UserGameValorantEntity } from './user-game-valorant.entity';
import { UserGameBrawlStarsEntity } from './user-game-brawl-stars.entity';
import { UserGameFortniteEntity } from './user-game-fortnite.entity';
import { UserGameCounterStrike2Entity } from './user-game-counter-strike-2.entity';
import { UserGameRainbowSixSiegeEntity } from './user-game-rainbow-six-siege.entity';
import { UserGameModeRankEntity } from './user-game-mode-rank.entity';

@Entity('player_games')
@Index(['profile', 'rscGame'], { unique: true })
export class UserGameEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => UserProfileEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'profile_id' })
  profile!: UserProfileEntity;

  @ManyToOne(() => RscGameEntity, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rsc_game_id' })
  rscGame!: RscGameEntity;

  @Column({ type: 'boolean', default: false })
  isRecruitable!: boolean;

  @Column({ type: 'boolean', default: false })
  isFavoriteGame!: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  trackerUrl!: string | null;

  @OneToMany(() => UserGamePositionEntity, (position) => position.game, {
    cascade: true,
    eager: true,
    orphanedRowAction: 'delete',
  })
  positions?: UserGamePositionEntity[];

  @OneToMany(() => UserGamePlatformEntity, (platform) => platform.game, {
    cascade: true,
    eager: true,
    orphanedRowAction: 'delete',
  })
  platforms?: UserGamePlatformEntity[];

  @OneToMany(() => UserGameCharacterEntity, (character) => character.game, {
    cascade: true,
    eager: true,
    orphanedRowAction: 'delete',
  })
  characters?: UserGameCharacterEntity[];

  @OneToOne(() => UserGameLeagueOfLegendsEntity, (profile) => profile.game, {
    cascade: true,
    eager: true,
    nullable: true,
  })
  leagueOfLegendsProfile?: UserGameLeagueOfLegendsEntity | null;

  @OneToOne(() => UserGameRocketLeagueEntity, (profile) => profile.game, {
    cascade: true,
    eager: true,
    nullable: true,
  })
  rocketLeagueProfile?: UserGameRocketLeagueEntity | null;

  @OneToOne(() => UserGameValorantEntity, (profile) => profile.game, {
    cascade: true,
    eager: true,
    nullable: true,
  })
  valorantProfile?: UserGameValorantEntity | null;

  @OneToOne(() => UserGameBrawlStarsEntity, (profile) => profile.game, {
    cascade: true,
    eager: true,
    nullable: true,
  })
  brawlStarsProfile?: UserGameBrawlStarsEntity | null;

  @OneToOne(() => UserGameFortniteEntity, (profile) => profile.game, {
    cascade: true,
    eager: true,
    nullable: true,
  })
  fortniteProfile?: UserGameFortniteEntity | null;

  @OneToOne(() => UserGameCounterStrike2Entity, (profile) => profile.game, {
    cascade: true,
    eager: true,
    nullable: true,
  })
  counterStrike2Profile?: UserGameCounterStrike2Entity | null;

  @OneToOne(() => UserGameRainbowSixSiegeEntity, (profile) => profile.game, {
    cascade: true,
    eager: true,
    nullable: true,
  })
  rainbowSixSiegeProfile?: UserGameRainbowSixSiegeEntity | null;

  @OneToMany(() => UserGameModeRankEntity, (modeRank) => modeRank.game, {
    cascade: true,
    eager: true,
    orphanedRowAction: 'delete',
  })
  modeRanks?: UserGameModeRankEntity[];

  @CreateDateColumn({ name: 'created_at', select: false })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', select: false })
  updatedAt!: Date;
}
