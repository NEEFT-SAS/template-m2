import 'tsconfig-paths/register';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { TeamEntity } from '@/contexts/teams/infra/entities/team.entity';
import { withSeederDataSource } from './helpers/data-source';
import { parseBoolean, parsePositiveInt } from './helpers/seeder-utils';

const DEFAULT_BATCH_SIZE = 200;
const PROFILE_SLUG_MAX_LENGTH = 25;
const TEAM_SLUG_MAX_LENGTH = 255;
const MAX_UNIQUE_ATTEMPTS = 10_000;

type SlugRow = {
  id: string;
  slug: string | null;
};

const toKey = (value: string) => value.toLowerCase();

const normalizeSlug = (value: string): string => {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const clampSlug = (value: string, maxLength: number): string => {
  if (value.length <= maxLength) {
    return value;
  }

  return value.slice(0, maxLength).replace(/-+$/g, '');
};

const buildUniqueSlug = (
  base: string,
  used: Set<string>,
  otherUsed: Set<string>,
  fallback: string,
  maxLength: number,
): string => {
  const normalizedBase = normalizeSlug(base);
  const safeBase = clampSlug(
    normalizedBase.length > 0 ? normalizedBase : fallback,
    maxLength,
  );

  let candidate = safeBase;
  let counter = 1;

  while (used.has(toKey(candidate)) || otherUsed.has(toKey(candidate))) {
    const suffix = `-${counter}`;
    const allowedBaseLength = Math.max(1, maxLength - suffix.length);
    candidate = `${safeBase.slice(0, allowedBaseLength)}${suffix}`;
    counter += 1;

    if (counter > MAX_UNIQUE_ATTEMPTS) {
      throw new Error(`Unable to generate unique slug for base "${safeBase}".`);
    }
  }

  return candidate;
};

async function normalizeSlugs(): Promise<void> {
  const dryRun = parseBoolean(process.env.SLUG_DRY_RUN);
  const verbose = parseBoolean(process.env.SLUG_VERBOSE);
  const batchSize = parsePositiveInt(process.env.SLUG_BATCH_SIZE, DEFAULT_BATCH_SIZE);

  await withSeederDataSource(async (dataSource) => {
    const profileRepo = dataSource.getRepository(UserProfileEntity);
    const teamRepo = dataSource.getRepository(TeamEntity);

    const profileSlugs = new Set(
      (await profileRepo.find({ select: ['slug'] }))
        .map((profile) => profile.slug)
        .filter((slug): slug is string => Boolean(slug))
        .map(toKey),
    );

    const teamSlugs = new Set(
      (await teamRepo.find({ select: ['slug'] }))
        .map((team) => team.slug)
        .filter((slug): slug is string => Boolean(slug))
        .map(toKey),
    );

    const totalProfiles = await profileRepo.count();
    const totalTeams = await teamRepo.count();

    console.log(
      `[new_seeders] Normalizing slugs (profiles: ${totalProfiles}, teams: ${totalTeams}, batch: ${batchSize}, dryRun: ${dryRun}).`,
    );

    let processedProfiles = 0;
    let updatedProfiles = 0;

    while (processedProfiles < totalProfiles) {
      const remaining = totalProfiles - processedProfiles;
      const batch = await profileRepo
        .createQueryBuilder('profile')
        .select('profile.id', 'id')
        .addSelect('profile.slug', 'slug')
        .orderBy('profile.id', 'ASC')
        .offset(processedProfiles)
        .limit(Math.min(batchSize, remaining))
        .getRawMany<SlugRow>();

      if (!batch.length) {
        break;
      }

      for (const profile of batch) {
        const currentSlug = String(profile.slug ?? '').trim();
        const normalized = clampSlug(
          normalizeSlug(currentSlug),
          PROFILE_SLUG_MAX_LENGTH,
        );

        if (!normalized || normalized === currentSlug) {
          continue;
        }

        const nextSlug = buildUniqueSlug(
          normalized,
          profileSlugs,
          teamSlugs,
          'user',
          PROFILE_SLUG_MAX_LENGTH,
        );

        if (nextSlug === currentSlug) {
          continue;
        }

        if (!dryRun) {
          await profileRepo.update(profile.id, { slug: nextSlug });
        }

        if (currentSlug) {
          profileSlugs.delete(toKey(currentSlug));
        }
        profileSlugs.add(toKey(nextSlug));
        updatedProfiles += 1;

        if (verbose) {
          console.log(`[profile] ${currentSlug} -> ${nextSlug}`);
        }
      }

      processedProfiles += batch.length;
      console.log(`[new_seeders] Profiles processed: ${processedProfiles}/${totalProfiles}`);
    }

    let processedTeams = 0;
    let updatedTeams = 0;

    while (processedTeams < totalTeams) {
      const remaining = totalTeams - processedTeams;
      const batch = await teamRepo
        .createQueryBuilder('team')
        .select('team.id', 'id')
        .addSelect('team.slug', 'slug')
        .orderBy('team.id', 'ASC')
        .offset(processedTeams)
        .limit(Math.min(batchSize, remaining))
        .getRawMany<SlugRow>();

      if (!batch.length) {
        break;
      }

      for (const team of batch) {
        const currentSlug = String(team.slug ?? '').trim();
        const normalized = clampSlug(normalizeSlug(currentSlug), TEAM_SLUG_MAX_LENGTH);

        if (!normalized || normalized === currentSlug) {
          continue;
        }

        const nextSlug = buildUniqueSlug(
          normalized,
          teamSlugs,
          profileSlugs,
          'team',
          TEAM_SLUG_MAX_LENGTH,
        );

        if (nextSlug === currentSlug) {
          continue;
        }

        if (!dryRun) {
          await teamRepo.update(team.id, { slug: nextSlug });
        }

        if (currentSlug) {
          teamSlugs.delete(toKey(currentSlug));
        }
        teamSlugs.add(toKey(nextSlug));
        updatedTeams += 1;

        if (verbose) {
          console.log(`[team] ${currentSlug} -> ${nextSlug}`);
        }
      }

      processedTeams += batch.length;
      console.log(`[new_seeders] Teams processed: ${processedTeams}/${totalTeams}`);
    }

    console.log(
      `[new_seeders] Done. Profiles updated: ${updatedProfiles}, Teams updated: ${updatedTeams}.`,
    );
  });
}

normalizeSlugs().catch((error) => {
  console.error('[new_seeders] Slug normalization failed:', error);
  process.exit(1);
});
