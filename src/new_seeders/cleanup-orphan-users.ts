import 'tsconfig-paths/register';
import { Brackets } from 'typeorm';
import { UserCredentialsEntity } from '@/contexts/auth/infra/persistence/entities/user-credentials.entity';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { withSeederDataSource } from './helpers/data-source';
import { parseBoolean, parsePositiveInt } from './helpers/seeder-utils';

const DEFAULT_BATCH_SIZE = 200;

type OrphanCredentialRow = {
  id: string;
  email: string;
  createdAt: Date | string | null;
};

async function cleanupOrphanUsers(): Promise<void> {
  const dryRun = parseBoolean(process.env.ORPHAN_USERS_DRY_RUN);
  const verbose = parseBoolean(process.env.ORPHAN_USERS_VERBOSE);
  const batchSize = parsePositiveInt(
    process.env.ORPHAN_USERS_BATCH_SIZE,
    DEFAULT_BATCH_SIZE,
  );

  await withSeederDataSource(async (dataSource) => {
    const credentialsRepo = dataSource.getRepository(UserCredentialsEntity);

    const totalRow = await dataSource
      .createQueryBuilder()
      .select('COUNT(1)', 'count')
      .from(UserCredentialsEntity, 'credentials')
      .leftJoin(
        UserProfileEntity,
        'profile',
        'profile.user_credential_id = credentials.id',
      )
      .where('profile.id IS NULL')
      .getRawOne<{ count?: string | number }>();

    const totalOrphans = Number(totalRow?.count ?? 0);
    console.log(
      `[new_seeders] Cleaning orphan credentials (total: ${totalOrphans}, batch: ${batchSize}, dryRun: ${dryRun}).`,
    );

    let processed = 0;
    let deleted = 0;
    let lastCreatedAt: Date | string | null = null;
    let lastId: string | null = null;
    let hasCursor = false;

    while (processed < totalOrphans) {
      const remaining = totalOrphans - processed;
      const qb = dataSource
        .createQueryBuilder()
        .select('credentials.id', 'id')
        .addSelect('credentials.email', 'email')
        .addSelect('credentials.createdAt', 'createdAt')
        .from(UserCredentialsEntity, 'credentials')
        .leftJoin(
          UserProfileEntity,
          'profile',
          'profile.user_credential_id = credentials.id',
        )
        .where('profile.id IS NULL')
        .orderBy('credentials.createdAt', 'ASC')
        .addOrderBy('credentials.id', 'ASC')
        .limit(Math.min(batchSize, remaining));

      if (hasCursor && lastId) {
        qb.andWhere(
          new Brackets((where) => {
            if (lastCreatedAt) {
              where
                .where('credentials.createdAt > :lastCreatedAt', {
                  lastCreatedAt,
                })
                .orWhere(
                  'credentials.createdAt = :lastCreatedAt AND credentials.id > :lastId',
                  { lastCreatedAt, lastId },
                );
            } else {
              where
                .where('credentials.createdAt IS NOT NULL')
                .orWhere('credentials.createdAt IS NULL AND credentials.id > :lastId', {
                  lastId,
                });
            }
          }),
        );
      }

      const batch = await qb.getRawMany<OrphanCredentialRow>();
      if (batch.length === 0) {
        break;
      }

      const ids = batch.map((row) => row.id);

      if (verbose) {
        for (const row of batch) {
          console.log(`[orphan] ${row.id} ${row.email ?? ''}`.trim());
        }
      }

      if (!dryRun) {
        await credentialsRepo.delete(ids);
        deleted += batch.length;
      }

      processed += batch.length;
      console.log(`[new_seeders] Orphan credentials processed: ${processed}/${totalOrphans}`);

      const lastRow = batch[batch.length - 1];
      lastCreatedAt = lastRow?.createdAt ?? lastCreatedAt;
      lastId = lastRow?.id ?? lastId;
      hasCursor = true;
    }

    if (dryRun) {
      console.log(`[new_seeders] Dry-run complete. Orphan credentials found: ${processed}.`);
    } else {
      console.log(`[new_seeders] Done. Orphan credentials deleted: ${deleted}.`);
    }
  });
}

cleanupOrphanUsers().catch((error) => {
  console.error('[new_seeders] Orphan credentials cleanup failed:', error);
  process.exit(1);
});
