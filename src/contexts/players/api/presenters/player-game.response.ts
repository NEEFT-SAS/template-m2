import {
  RscGameCharacterResponsePresenter,
  RscGameModeResponsePresenter,
  RscGamePlatformResponsePresenter,
  RscGamePositionResponsePresenter,
  RscGameRankResponsePresenter,
} from '@/contexts/resources/app/presenters/resources.response';
import { Expose, Type } from 'class-transformer';

export class PlayerGameAccountResponse {
  @Expose()
  username!: string;

  @Expose()
  tagLine?: string;

  @Expose()
  region?: string;
}

export class PlayerGameModeRankResponse {
  @Expose()
  @Type(() => RscGameModeResponsePresenter)
  rscGameMode!: RscGameModeResponsePresenter;

  @Expose()
  @Type(() => RscGameRankResponsePresenter)
  rscGameRank!: RscGameRankResponsePresenter;

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
  @Type(() => RscGamePositionResponsePresenter)
  rscGamePositions!: RscGamePositionResponsePresenter[];

  @Expose()
  @Type(() => RscGamePlatformResponsePresenter)
  rscGamePlatforms!: RscGamePlatformResponsePresenter[];

  @Expose()
  @Type(() => RscGameCharacterResponsePresenter)
  rscGameCharacters!: RscGameCharacterResponsePresenter[];

  @Expose()
  @Type(() => PlayerGameModeRankResponse)
  modeRanks!: PlayerGameModeRankResponse[];

  @Expose()
  @Type(() => PlayerGameAccountResponse)
  account!: PlayerGameAccountResponse | null;
}
