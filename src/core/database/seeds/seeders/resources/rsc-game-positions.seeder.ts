import { DataSource } from 'typeorm';
import { Seeder } from '../seed.types';
import { loadSeedData, upsertByColumns } from '../seed.utils';
import { RscGameEntity } from '@/contexts/resources/infra/persistence/entities/games/rsc-games.entity';
import { RscGamePositionEntity } from '@/contexts/resources/infra/persistence/entities/games/relations/rsc-game-positions.entity';
import { RscPositionEntity } from '@/contexts/resources/infra/persistence/entities/games/base/rsc-positions.entity';

type RscGamePositionSeed = {
  gameSlug: string;
  rscPositionSlug: string;
  order?: number;
};

export class RscGamePositionsSeeder implements Seeder {
  name = 'rsc-game-positions';

  async run(dataSource: DataSource): Promise<void> {
    const data = await loadSeedData<RscGamePositionSeed>('resources/rsc-game-positions.json');
    if (data.length === 0) return;

    const games = await dataSource.getRepository(RscGameEntity).find({ select: ['id', 'slug'] });
    const positions = await dataSource.getRepository(RscPositionEntity).find({ select: ['id', 'slug'] });
    const gameMap = new Map(games.map((row) => [row.slug.toLowerCase(), row.id]));
    const positionMap = new Map(positions.map((row) => [row.slug.toLowerCase(), row.id]));

    const rows = data.map((item) => {
      const gameId = gameMap.get(item.gameSlug.trim().toLowerCase());
      if (!gameId) throw new Error(`Unknown game slug: ${item.gameSlug}`);
      const positionId = positionMap.get(item.rscPositionSlug.trim().toLowerCase());
      if (!positionId) throw new Error(`Unknown position slug: ${item.rscPositionSlug}`);

      return {
        gameId,
        rscPositionId: positionId,
        order: item.order ?? 0,
      };
    });

    await upsertByColumns(dataSource, RscGamePositionEntity, rows, ['gameId', 'rscPositionId']);
  }
}
