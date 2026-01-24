import { DataSource } from 'typeorm';
import { Seeder } from '../seed.types';
import { loadSeedData, upsertByColumns } from '../seed.utils';
import { RscGameEntity } from '@/contexts/resources/infra/persistence/entities/games/rsc-games.entity';
import { RscGameRankEntity } from '@/contexts/resources/infra/persistence/entities/games/relations/rsc-game-ranks.entity';
import { RscRankEntity } from '@/contexts/resources/infra/persistence/entities/games/base/rsc-ranks.entity';

type RscGameRankSeed = {
  gameSlug: string;
  rscRankSlug: string;
  order?: number;
};

export class RscGameRanksSeeder implements Seeder {
  name = 'rsc-game-ranks';

  async run(dataSource: DataSource): Promise<void> {
    const data = await loadSeedData<RscGameRankSeed>('resources/rsc-game-ranks.json');
    if (data.length === 0) return;

    const games = await dataSource.getRepository(RscGameEntity).find({ select: ['id', 'slug'] });
    const ranks = await dataSource.getRepository(RscRankEntity).find({ select: ['id', 'slug'] });
    const gameMap = new Map(games.map((row) => [row.slug.toLowerCase(), row.id]));
    const rankMap = new Map(ranks.map((row) => [row.slug.toLowerCase(), row.id]));

    const rows = data.map((item) => {
      const gameId = gameMap.get(item.gameSlug.trim().toLowerCase());
      if (!gameId) throw new Error(`Unknown game slug: ${item.gameSlug}`);
      const rankId = rankMap.get(item.rscRankSlug.trim().toLowerCase());
      if (!rankId) throw new Error(`Unknown rank slug: ${item.rscRankSlug}`);

      return {
        gameId,
        rscRankId: rankId,
        order: item.order ?? 0,
      };
    });

    await upsertByColumns(dataSource, RscGameRankEntity, rows, ['gameId', 'rscRankId']);
  }
}
