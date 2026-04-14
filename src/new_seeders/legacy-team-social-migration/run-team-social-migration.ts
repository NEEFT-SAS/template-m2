import 'tsconfig-paths/register';

async function run(): Promise<void> {
  throw new Error(
    'Legacy team social migration script was archived with the old schema and has not been auto-mapped to v4 entities. Rebuild this migration against current team network tables before running it.',
  );
}

run().catch((error) => {
  console.error('[new_seeders] Legacy team social migration failed:', error);
  process.exit(1);
});
