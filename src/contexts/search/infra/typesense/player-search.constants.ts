export const PLAYER_GAME_KEY_FACTOR = 10000;

export const buildPlayerGameKey = (gameId: number, valueId: number): number =>
  gameId * PLAYER_GAME_KEY_FACTOR + valueId;
