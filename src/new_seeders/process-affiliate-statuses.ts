import 'tsconfig-paths/register';
import { withSeederDataSource } from './helpers/data-source';
import { tableExists } from './helpers/seeder-utils';

async function processAffiliateStatuses(): Promise<void> {
  await withSeederDataSource(async (dataSource) => {
    const hasLegacyTable = await tableExists(dataSource, 'stripe_transfers');

    if (!hasLegacyTable) {
      console.log(
        '[new_seeders] No legacy `stripe_transfers` table detected. Nothing to process.',
      );
      return;
    }

    throw new Error(
      'Legacy affiliate transfer processing is no longer wired in Billing v4 (Stripe transfer entity/service removed). Implement a dedicated Billing use case before running this migration.',
    );
  });
}

processAffiliateStatuses().catch((error) => {
  console.error('[new_seeders] Affiliate status processing failed:', error);
  process.exit(1);
});
