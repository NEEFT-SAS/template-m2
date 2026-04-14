import { DataSource } from 'typeorm';
import { RscCountriesSeeder } from '@/core/database/seeds/seeders/resources/rsc-countries.seeder';

export async function seedCountries(dataSource: DataSource): Promise<void> {
  await new RscCountriesSeeder().run(dataSource);
}
