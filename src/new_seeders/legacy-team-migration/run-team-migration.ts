import 'tsconfig-paths/register';

async function run(): Promise<void> {
  throw new Error(
    'Legacy team migration script was archived with the old schema and has not been auto-mapped to v4 entities. Rebuild this migration against `contexts/teams`, `contexts/auth` and `contexts/resources` persistence models before running it.',
  );
}

run().catch((error) => {
  console.error('[new_seeders] Legacy team migration failed:', error);
  process.exit(1);
});
