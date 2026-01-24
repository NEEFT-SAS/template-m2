import { DataSource } from 'typeorm';
import { Seeder } from '../seed.types';
import { loadSeedData, upsertByColumns } from '../seed.utils';
import { RscGameEntity } from '@/contexts/resources/infra/persistence/entities/games/rsc-games.entity';
import { RscGamePlatformEntity } from '@/contexts/resources/infra/persistence/entities/games/relations/rsc-game-platforms.entity';
import { RscPlatformEntity } from '@/contexts/resources/infra/persistence/entities/games/base/rsc-platforms.entity';

type RscGamePlatformSeed = {
  gameSlug: string;
  rscPlatformSlug: string;
  order?: number;
};

export class RscGamePlatformsSeeder implements Seeder {
  name = 'rsc-game-platforms';

  async run(dataSource: DataSource): Promise<void> {
    const data = await loadSeedData<RscGamePlatformSeed>('resources/rsc-game-platforms.json');
    if (data.length === 0) return;

    const games = await dataSource.getRepository(RscGameEntity).find({ select: ['id', 'slug'] });
    const platforms = await dataSource.getRepository(RscPlatformEntity).find({ select: ['id', 'slug'] });
    const gameMap = new Map(games.map((row) => [row.slug.toLowerCase(), row.id]));
    const platformMap = new Map(platforms.map((row) => [row.slug.toLowerCase(), row.id]));

    const rows = data.map((item) => {
      const gameId = gameMap.get(item.gameSlug.trim().toLowerCase());
      if (!gameId) throw new Error(`Unknown game slug: ${item.gameSlug}`);
      const platformId = platformMap.get(item.rscPlatformSlug.trim().toLowerCase());
      if (!platformId) throw new Error(`Unknown platform slug: ${item.rscPlatformSlug}`);

      return {
        gameId,
        rscPlatformId: platformId,
        order: item.order ?? 0,
      };
    });

    await upsertByColumns(dataSource, RscGamePlatformEntity, rows, ['gameId', 'rscPlatformId']);
  }
}
