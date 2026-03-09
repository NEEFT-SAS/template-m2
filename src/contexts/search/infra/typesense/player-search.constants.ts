export const PLAYER_GAME_KEY_FACTOR = 10000;
export const PLAYER_GAME_ELO_KEY_FACTOR = 1000000;

export const buildPlayerGameKey = (gameId: number, valueId: number): number =>
  gameId * PLAYER_GAME_KEY_FACTOR + valueId;

export const buildPlayerGameEloKey = (gameId: number, elo: number): number =>
  gameId * PLAYER_GAME_ELO_KEY_FACTOR + elo;
