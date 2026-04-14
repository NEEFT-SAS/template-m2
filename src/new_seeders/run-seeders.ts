import 'tsconfig-paths/register';
import { withSeederDataSource } from './helpers/data-source';
import { seedResources } from './resources';

async function runSeeders(): Promise<void> {
  const startedAt = Date.now();

  await withSeederDataSource(async (dataSource) => {
    console.log('[new_seeders] Connected to DB.');
    await seedResources(dataSource);
  });

  console.log(`[new_seeders] Seeding finished in ${Date.now() - startedAt}ms.`);
}

runSeeders().catch((error) => {
  console.error('[new_seeders] Seeding failed:', error);
  process.exit(1);
});
