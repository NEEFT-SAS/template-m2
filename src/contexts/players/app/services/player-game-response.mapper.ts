import type {
  RscGameCharacterPresenter,
  RscGameModePresenter,
  RscGamePlatformPresenter,
  RscGamePositionPresenter,
  RscGamePresenter,
  RscGameRankPresenter,
} from '@neeft-sas/shared';
import { plainToInstance } from 'class-transformer';
import { UserGameEntity } from '../../infra/entities/game/user-game.entity';
import { PlayerGameResponse } from '../../api/presenters/player-game.response';

const toPositiveInt = (value: number | null | undefined): number | null => {
  if (!Number.isInteger(value) || !value || value < 1) return null;
  return value;
};

const mapAccount = (entity: UserGameEntity): PlayerGameResponse['account'] => {
  const slug = entity.rscGame?.slug?.toLowerCase();
  if (!slug) return null;

  switch (slug) {
    case 'league-of-legends': {
      const profile = entity.leagueOfLegendsProfile;
      if (!profile?.username || !profile.tagLine) return null;
      return {
        username: profile.username,
        tagLine: profile.tagLine,
        ...(profile.region ? { region: profile.region } : {}),
      };
    }
    case 'rocket-league': {
      const profile = entity.rocketLeagueProfile;
      return profile?.username ? { username: profile.username } : null;
    }
    case 'valorant': {
      const profile = entity.valorantProfile;
      if (!profile?.username || !profile.tagLine) return null;
      return {
        username: profile.username,
        tagLine: profile.tagLine,
      };
    }
    case 'brawl-stars': {
      const profile = entity.brawlStarsProfile;
      return profile?.username ? { username: profile.username } : null;
    }
    case 'fortnite': {
      const profile = entity.fortniteProfile;
      return profile?.username ? { username: profile.username } : null;
    }
    case 'counter-strike-2': {
      const profile = entity.counterStrike2Profile;
      return profile?.username ? { username: profile.username } : null;
    }
    case 'rainbow-six-siege': {
      const profile = entity.rainbowSixSiegeProfile;
      return profile?.username ? { username: profile.username } : null;
    }
    default:
      return null;
  }
};

const mapGamePositions = (
  entity: UserGameEntity,
  game: RscGamePresenter | null,
): RscGamePositionPresenter[] => {
  const selectedIds = new Set(
    (entity.positions ?? [])
      .map((relation) => toPositiveInt(relation.position?.id))
      .filter((id): id is number => id !== null),
  );

  if (game) {
    return game.rscGamePositions.filter((item) => selectedIds.has(item.id));
  }

  return (entity.positions ?? []).flatMap((relation) =>
    relation.position
      ? [
          {
            id: relation.position.id,
            name: relation.position.name,
            slug: relation.position.slug,
            icon: relation.position.icon,
            order: relation.position.order ?? 0,
          },
        ]
      : [],
  );
};

const mapGamePlatforms = (
  entity: UserGameEntity,
  game: RscGamePresenter | null,
): RscGamePlatformPresenter[] => {
  const selectedIds = new Set(
    (entity.platforms ?? [])
      .map((relation) => toPositiveInt(relation.platform?.id))
      .filter((id): id is number => id !== null),
  );

  if (game) {
    return game.rscGamePlatforms.filter((item) => selectedIds.has(item.id));
  }

  return (entity.platforms ?? []).flatMap((relation) =>
    relation.platform
      ? [
          {
            id: relation.platform.id,
            name: relation.platform.name,
            slug: relation.platform.slug,
            icon: relation.platform.icon,
          },
        ]
      : [],
  );
};

const mapGameCharacters = (
  entity: UserGameEntity,
  game: RscGamePresenter | null,
): RscGameCharacterPresenter[] => {
  const selectedIds = new Set(
    (entity.characters ?? [])
      .map((relation) => toPositiveInt(relation.character?.id))
      .filter((id): id is number => id !== null),
  );

  if (game) {
    return game.rscGameCharacters.filter((item) => selectedIds.has(item.id));
  }

  return (entity.characters ?? []).flatMap((relation) =>
    relation.character
      ? [
          {
            id: relation.character.id,
            name: relation.character.name,
            slug: relation.character.slug,
            icon: relation.character.icon,
          },
        ]
      : [],
  );
};

const toFallbackMode = (
  entity: UserGameEntity['modeRanks'] extends Array<infer T> ? T : never,
): RscGameModePresenter | null => {
  const mode = entity.mode?.mode;
  if (!mode) return null;

  return {
    id: mode.id,
    name: mode.name,
    slug: mode.slug,
    description: mode.description,
    isRanked: mode.isRanked,
    order: entity.mode.order ?? mode.order ?? 0,
  };
};

const toFallbackRank = (
  entity: UserGameEntity['modeRanks'] extends Array<infer T> ? T : never,
): RscGameRankPresenter | null => {
  const rank = entity.rank?.rank;
  if (!rank) return null;

  return {
    id: rank.id,
    name: rank.name,
    slug: rank.slug,
    order: entity.rank.order ?? rank.order ?? 0,
    division: rank.division,
    tier: rank.tier,
    icon: rank.icon,
  };
};

const mapModeRanks = (
  entity: UserGameEntity,
  game: RscGamePresenter | null,
): PlayerGameResponse['modeRanks'] => {
  const modesById = new Map(
    game?.rscGameModes.map((item) => [item.id, item]) ?? [],
  );
  const ranksById = new Map(
    game?.rscGameRanks.map((item) => [item.id, item]) ?? [],
  );

  return (entity.modeRanks ?? []).flatMap((relation) => {
    const modeId = toPositiveInt(relation.mode?.rscModeId);
    const rankId = toPositiveInt(relation.rank?.rscRankId);

    const rscGameMode =
      (modeId ? modesById.get(modeId) : null) ?? toFallbackMode(relation);
    const rscGameRank =
      (rankId ? ranksById.get(rankId) : null) ?? toFallbackRank(relation);

    if (!rscGameMode || !rscGameRank) return [];

    return [
      {
        rscGameMode,
        rscGameRank,
        elo: relation.elo ?? null,
      },
    ];
  });
};

export const toPlayerGameResponse = (
  entity: UserGameEntity,
  game: RscGamePresenter | null = null,
): PlayerGameResponse =>
  plainToInstance(
    PlayerGameResponse,
    {
      id: entity.id,
      gameId: entity.rscGame?.id ?? 0,
      isRecruitable: entity.isRecruitable,
      isFavoriteGame: entity.isFavoriteGame,
      trackerUrl: entity.trackerUrl ?? null,
      rscGamePositions: mapGamePositions(entity, game),
      rscGamePlatforms: mapGamePlatforms(entity, game),
      rscGameCharacters: mapGameCharacters(entity, game),
      modeRanks: mapModeRanks(entity, game),
      account: mapAccount(entity),
    },
    {
      excludeExtraneousValues: true,
    },
  );
