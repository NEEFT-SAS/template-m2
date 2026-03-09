export const FOLLOW_ENTITY_TYPES = ['PLAYER', 'TEAM'] as const;
export type FollowEntityType = (typeof FOLLOW_ENTITY_TYPES)[number];
