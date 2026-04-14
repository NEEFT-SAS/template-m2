import { DataSource } from 'typeorm';
import { RscSocialPlatformsSeeder } from '@/core/database/seeds/seeders/resources/rsc-social-platforms.seeder';

export async function seedNetworks(dataSource: DataSource): Promise<void> {
  await new RscSocialPlatformsSeeder().run(dataSource);
}
