import { DataSource } from 'typeorm';
import { Seeder } from '../seed.types';
import { loadSeedData, upsertByColumns } from '../seed.utils';
import { RscGameEntity } from '@/contexts/resources/infra/persistence/entities/games/rsc-games.entity';
import { RscGameCharacterEntity } from '@/contexts/resources/infra/persistence/entities/games/relations/rsc-game-characters.entity';
import { RscCharacterEntity } from '@/contexts/resources/infra/persistence/entities/games/base/rsc-characters.entity';

type RscGameCharacterSeed = {
  gameSlug: string;
  rscCharacterSlug: string;
  order?: number;
};

export class RscGameCharactersSeeder implements Seeder {
  name = 'rsc-game-characters';

  async run(dataSource: DataSource): Promise<void> {
    const data = await loadSeedData<RscGameCharacterSeed>('resources/rsc-game-characters.json');
    if (data.length === 0) return;

    const games = await dataSource.getRepository(RscGameEntity).find({ select: ['id', 'slug'] });
    const characters = await dataSource.getRepository(RscCharacterEntity).find({ select: ['id', 'slug'] });
    const gameMap = new Map(games.map((row) => [row.slug.toLowerCase(), row.id]));
    const characterMap = new Map(characters.map((row) => [row.slug.toLowerCase(), row.id]));

    const rows = data.map((item) => {
      const gameId = gameMap.get(item.gameSlug.trim().toLowerCase());
      if (!gameId) throw new Error(`Unknown game slug: ${item.gameSlug}`);
      const characterId = characterMap.get(item.rscCharacterSlug.trim().toLowerCase());
      if (!characterId) throw new Error(`Unknown character slug: ${item.rscCharacterSlug}`);

      return {
        gameId,
        rscCharacterId: characterId,
        order: item.order ?? 0,
      };
    });

    await upsertByColumns(dataSource, RscGameCharacterEntity, rows, ['gameId', 'rscCharacterId']);
  }
}
