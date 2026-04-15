import { PlayerGameInvalidPayloadError } from '@/contexts/players/domain/errors/player-game.errors';
import { PlayerGameAccountInput } from '../ports/player.repository.port';

const toNonEmptyString = (value: unknown) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const collectDuplicates = (ids: number[]) => {
  const seen = new Set<number>();
  const duplicates = new Set<number>();
  for (const id of ids) {
    if (seen.has(id)) {
      duplicates.add(id);
    } else {
      seen.add(id);
    }
  }
  return [...duplicates];
};

export const buildAccountInput = (
  slug: string,
  payload?: Record<string, unknown> | null,
): PlayerGameAccountInput | null => {
  if (payload === undefined || payload === null) return null;
  if (typeof payload !== 'object') {
    throw new PlayerGameInvalidPayloadError(slug, 'payload_not_object');
  }

  const data = payload as Record<string, unknown>;

  switch (slug) {
    case 'league-of-legends': {
      const username = toNonEmptyString(data.username);
      const tagLine = toNonEmptyString(data.tagLine);
      const region = toNonEmptyString(data.region);
      const puuid = toNonEmptyString(data.puuid);
      if (!username || !tagLine) {
        throw new PlayerGameInvalidPayloadError(slug, 'missing_required_fields', {
          required: ['username', 'tagLine'],
        });
      }
      return {
        type: 'league-of-legends',
        username,
        tagLine,
        region: region ?? undefined,
        puuid: puuid ?? undefined,
      };
    }
    case 'rocket-league': {
      const username = toNonEmptyString(data.username);
      if (!username) {
        throw new PlayerGameInvalidPayloadError(slug, 'missing_required_fields', {
          required: ['username'],
        });
      }
      return { type: 'rocket-league', username };
    }
    case 'valorant': {
      const username = toNonEmptyString(data.username);
      const tagLine = toNonEmptyString(data.tagLine);
      if (!username || !tagLine) {
        throw new PlayerGameInvalidPayloadError(slug, 'missing_required_fields', {
          required: ['username', 'tagLine'],
        });
      }
      return { type: 'valorant', username, tagLine };
    }
    case 'brawl-stars': {
      const username = toNonEmptyString(data.username);
      if (!username) {
        throw new PlayerGameInvalidPayloadError(slug, 'missing_required_fields', {
          required: ['username'],
        });
      }
      return { type: 'brawl-stars', username };
    }
    case 'fortnite': {
      const username = toNonEmptyString(data.username);
      if (!username) {
        throw new PlayerGameInvalidPayloadError(slug, 'missing_required_fields', {
          required: ['username'],
        });
      }
      return { type: 'fortnite', username };
    }
    case 'counter-strike-2': {
      const username = toNonEmptyString(data.username);
      if (!username) {
        throw new PlayerGameInvalidPayloadError(slug, 'missing_required_fields', {
          required: ['username'],
        });
      }
      return { type: 'counter-strike-2', username };
    }
    case 'rainbow-six-siege': {
      const username = toNonEmptyString(data.username);
      if (!username) {
        throw new PlayerGameInvalidPayloadError(slug, 'missing_required_fields', {
          required: ['username'],
        });
      }
      return { type: 'rainbow-six-siege', username };
    }
    default:
      throw new PlayerGameInvalidPayloadError(slug, 'unsupported_game');
  }
};
