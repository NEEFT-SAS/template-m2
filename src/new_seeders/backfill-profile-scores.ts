import 'tsconfig-paths/register';
import { ConfigService } from '@nestjs/config';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { PlayerScoreService } from '@/contexts/search/app/services/player-score.service';
import { PlayerSearchIndexer } from '@/contexts/search/infra/typesense/player-search.indexer';
import { TypesenseService } from '@/contexts/search/infra/typesense/typesense.service';
import { TeamScoreService } from '@/contexts/teams/app/services/team-score.service';
import { TeamEntity } from '@/contexts/teams/infra/entities/team.entity';
import { TeamMemberEntity } from '@/contexts/teams/infra/entities/team-member.entity';
import { withSeederDataSource } from './helpers/data-source';
import { parseBoolean } from './helpers/seeder-utils';

async function backfillScores(): Promise<void> {
  const includeTeamScores = !parseBoolean(process.env.BACKFILL_SKIP_TEAMS);
  const includePlayerSearchSync = parseBoolean(
    process.env.BACKFILL_PLAYER_SEARCH,
  );

  if (!includeTeamScores && !includePlayerSearchSync) {
    console.log('[new_seeders] Nothing to do: both score backfills are skipped.');
    return;
  }

  await withSeederDataSource(async (dataSource) => {
    if (includeTeamScores) {
      const teamScoreService = new TeamScoreService(
        dataSource.getRepository(TeamEntity),
        dataSource.getRepository(TeamMemberEntity),
        dataSource,
      );

      const updated = await teamScoreService.recomputeAllTeams();
      console.log(`[new_seeders] Team scores recomputed: ${updated}.`);
    }

    if (includePlayerSearchSync) {
      const configService = new ConfigService(process.env);
      const playerSearchIndexer = new PlayerSearchIndexer(
        new TypesenseService(configService),
        new PlayerScoreService(),
        dataSource,
        dataSource.getRepository(UserProfileEntity),
      );

      const result = await playerSearchIndexer.syncAll();
      console.log(
        `[new_seeders] Player search docs synchronized: ${result.indexed}.`,
      );
    } else {
      console.log(
        '[new_seeders] Player scores are now computed during search indexing. Set BACKFILL_PLAYER_SEARCH=true to force a full Typesense sync.',
      );
    }
  });
}

backfillScores().catch((error) => {
  console.error('[new_seeders] Backfill failed:', error);
  process.exit(1);
});
