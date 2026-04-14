import { DataSource } from 'typeorm';
import { seedLanguages } from './common/seed-languages';
import { seedCountries } from './common/seed-countries';
import { seedNetworks } from './common/seed-networks';
import { seedStaffResources } from './common/seed-staff-resources';
import { seedPlatforms } from './game/shared/seed-platforms';
import { seedPositions } from './game/shared/seed-positions';
import { seedRanks } from './game/shared/seed-ranks';
import { seedCharacters } from './game/shared/seed-characters';
import { seedModes } from './game/shared/seed-modes';
import { seedSeasons } from './game/shared/seed-seasons';
import { seedGames } from './game/shared/seed-games';
import { seedGameRelations } from './game/shared/seed-games-relations';

export async function seedResources(dataSource: DataSource): Promise<void> {
  console.log('[new_seeders] Starting resources seeding...');

  await seedLanguages(dataSource);
  await seedCountries(dataSource);
  await seedNetworks(dataSource);

  await seedPlatforms(dataSource);
  await seedPositions(dataSource);
  await seedRanks(dataSource);
  await seedCharacters(dataSource);
  await seedModes(dataSource);
  await seedSeasons(dataSource);

  await seedGames(dataSource);
  await seedGameRelations(dataSource);

  await seedStaffResources(dataSource);

  console.log('[new_seeders] Resources seeding completed.');
}
