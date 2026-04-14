import 'tsconfig-paths/register';

async function run(): Promise<void> {
  throw new Error(
    'Legacy player migration script was archived with the old schema and has not been auto-mapped to v4 entities. Rebuild this migration against `contexts/auth`, `contexts/players` and `contexts/resources` persistence models before running it.',
  );
}

run().catch((error) => {
  console.error('[new_seeders] Legacy player migration failed:', error);
  process.exit(1);
});
