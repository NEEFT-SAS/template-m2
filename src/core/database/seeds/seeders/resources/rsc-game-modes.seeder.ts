import { DataSource } from 'typeorm';
import { Seeder } from '../seed.types';
import { loadSeedData, upsertByColumns } from '../seed.utils';
import { RscGameEntity } from '@/contexts/resources/infra/persistence/entities/games/rsc-games.entity';
import { RscGameModeEntity } from '@/contexts/resources/infra/persistence/entities/games/relations/rsc-game-modes.entity';
import { RscModeEntity } from '@/contexts/resources/infra/persistence/entities/games/base/rsc-modes.entity';

type RscGameModeSeed = {
  gameSlug: string;
  rscModeSlug: string;
  order?: number;
};

export class RscGameModesSeeder implements Seeder {
  name = 'rsc-game-modes';

  async run(dataSource: DataSource): Promise<void> {
    const data = await loadSeedData<RscGameModeSeed>('resources/rsc-game-modes.json');
    if (data.length === 0) return;

    const games = await dataSource.getRepository(RscGameEntity).find({ select: ['id', 'slug'] });
    const modes = await dataSource.getRepository(RscModeEntity).find({ select: ['id', 'slug'] });
    const gameMap = new Map(games.map((row) => [row.slug.toLowerCase(), row.id]));
    const modeMap = new Map(modes.map((row) => [row.slug.toLowerCase(), row.id]));

    const rows = data.map((item) => {
      const gameId = gameMap.get(item.gameSlug.trim().toLowerCase());
      if (!gameId) throw new Error(`Unknown game slug: ${item.gameSlug}`);
      const modeId = modeMap.get(item.rscModeSlug.trim().toLowerCase());
      if (!modeId) throw new Error(`Unknown mode slug: ${item.rscModeSlug}`);

      return {
        gameId,
        rscModeId: modeId,
        order: item.order ?? 0,
      };
    });

    await upsertByColumns(dataSource, RscGameModeEntity, rows, ['gameId', 'rscModeId']);
  }
}
