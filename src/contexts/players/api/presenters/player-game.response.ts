import {
  PlayerGameAccountPresenter,
  RscGameCharacterPresenter,
  RscGameModePresenter,
  RscGamePlatformPresenter,
  RscGamePositionPresenter,
  RscGameRankPresenter,
} from '@neeft-sas/shared';
import { Expose, Type } from 'class-transformer';

export class PlayerGameModeRankResponse {
  @Expose()
  @Type(() => RscGameModePresenter)
  rscGameMode!: RscGameModePresenter;

  @Expose()
  @Type(() => RscGameRankPresenter)
  rscGameRank!: RscGameRankPresenter;

  @Expose()
  elo!: number | null;
}

export class PlayerGameResponse {
  @Expose()
  id!: number;

  @Expose()
  gameId!: number;

  @Expose()
  isRecruitable!: boolean;

  @Expose()
  isFavoriteGame!: boolean;

  @Expose()
  trackerUrl!: string | null;

  @Expose()
  @Type(() => RscGamePositionPresenter)
  rscGamePositions!: RscGamePositionPresenter[];

  @Expose()
  @Type(() => RscGamePlatformPresenter)
  rscGamePlatforms!: RscGamePlatformPresenter[];

  @Expose()
  @Type(() => RscGameCharacterPresenter)
  rscGameCharacters!: RscGameCharacterPresenter[];

  @Expose()
  @Type(() => PlayerGameModeRankResponse)
  modeRanks!: PlayerGameModeRankResponse[];

  @Expose()
  @Type(() => PlayerGameAccountPresenter)
  account!: PlayerGameAccountPresenter | null;
}
