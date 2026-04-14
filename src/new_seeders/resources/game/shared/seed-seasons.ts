import { DataSource } from 'typeorm';
import { RscSeasonsSeeder } from '@/core/database/seeds/seeders/resources/rsc-seasons.seeder';

export async function seedSeasons(dataSource: DataSource): Promise<void> {
  await new RscSeasonsSeeder().run(dataSource);
}
