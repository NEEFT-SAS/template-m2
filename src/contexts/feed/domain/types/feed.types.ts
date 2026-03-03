// Types pour le suivi des entités (joueur ou équipe)
export const FEED_ENTITY_TYPES = ['PLAYER', 'TEAM'] as const;
export type FeedEntityType = (typeof FEED_ENTITY_TYPES)[number];

// Types de feed disponibles
export const FEED_TYPES = ['FOLLOWING', 'DISCOVER', 'PERSONALIZED'] as const;
export type FeedType = (typeof FEED_TYPES)[number];
