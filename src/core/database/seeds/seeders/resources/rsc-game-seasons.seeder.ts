import { DataSource } from 'typeorm';
import { Seeder } from '../seed.types';
import { loadSeedData, upsertByColumns } from '../seed.utils';
import { RscGameEntity } from '@/contexts/resources/infra/persistence/entities/games/rsc-games.entity';
import { RscGameSeasonEntity } from '@/contexts/resources/infra/persistence/entities/games/relations/rsc-game-seasons.entity';
import { RscSeasonEntity } from '@/contexts/resources/infra/persistence/entities/games/base/rsc-seasons.entity';

type RscGameSeasonSeed = {
  gameSlug: string;
  rscSeasonCode: string;
  order?: number;
};

export class RscGameSeasonsSeeder implements Seeder {
  name = 'rsc-game-seasons';

  async run(dataSource: DataSource): Promise<void> {
    const data = await loadSeedData<RscGameSeasonSeed>('resources/rsc-game-seasons.json');
    if (data.length === 0) return;

    const games = await dataSource.getRepository(RscGameEntity).find({ select: ['id', 'slug'] });
    const seasons = await dataSource.getRepository(RscSeasonEntity).find({ select: ['id', 'code'] });
    const gameMap = new Map(games.map((row) => [row.slug.toLowerCase(), row.id]));
    const seasonMap = new Map(seasons.map((row) => [row.code.toLowerCase(), row.id]));

    const rows = data.map((item) => {
      const gameId = gameMap.get(item.gameSlug.trim().toLowerCase());
      if (!gameId) throw new Error(`Unknown game slug: ${item.gameSlug}`);
      const seasonId = seasonMap.get(item.rscSeasonCode.trim().toLowerCase());
      if (!seasonId) throw new Error(`Unknown season code: ${item.rscSeasonCode}`);

      return {
        gameId,
        rscSeasonId: seasonId,
        order: item.order ?? 0,
      };
    });

    await upsertByColumns(dataSource, RscGameSeasonEntity, rows, ['gameId', 'rscSeasonId']);
  }
}
