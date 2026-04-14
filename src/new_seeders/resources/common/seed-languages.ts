import { DataSource } from 'typeorm';
import { RscLanguagesSeeder } from '@/core/database/seeds/seeders/resources/rsc-languages.seeder';

export async function seedLanguages(dataSource: DataSource): Promise<void> {
  await new RscLanguagesSeeder().run(dataSource);
}
