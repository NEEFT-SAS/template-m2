import type { BaseCollectionCreateSchema } from 'typesense/lib/Typesense/Collections';
import type { CollectionFieldSchema } from 'typesense/lib/Typesense/Collection';

type PlayerSearchSchema = BaseCollectionCreateSchema & { fields: CollectionFieldSchema[] };

export const PLAYER_SEARCH_COLLECTION = 'player_search';

export const playerSearchSchema: PlayerSearchSchema = {
  name: PLAYER_SEARCH_COLLECTION,
  fields: [
    { name: 'id', type: 'string' },
    { name: 'username', type: 'string' },
    { name: 'slug', type: 'string' },
    { name: 'profilePicture', type: 'string', optional: true },
    { name: 'bannerPicture', type: 'string', optional: true },
    { name: 'description', type: 'string', optional: true },
    { name: 'citation', type: 'string', optional: true },
    { name: 'nationalityId', type: 'string', optional: true },
    { name: 'languageIds', type: 'string[]', optional: true },
    { name: 'badgeIds', type: 'int32[]', optional: true },
    { name: 'hasProfilePicture', type: 'bool' },
    { name: 'hasBannerPicture', type: 'bool' },
    { name: 'experienceCount', type: 'int32' },
    { name: 'educationCount', type: 'int32' },
    { name: 'professionalExperienceCount', type: 'int32' },
    { name: 'socialLinksCount', type: 'int32' },
    { name: 'badgesCount', type: 'int32' },
    { name: 'profileScore', type: 'int32' },
    { name: 'createdAt', type: 'int64' },
  ],
  default_sorting_field: 'profileScore',
};
