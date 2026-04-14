import { RscPlatformEntity } from '@/contexts/resources/infra/persistence/entities/games/base/rsc-platforms.entity';
import { logSection, seedIfNotExists } from '@/new_seeders/helpers/seeder-utils';
import { DataSource } from 'typeorm';

export async function seedPlatforms(dataSource: DataSource) {
  const repo = dataSource.getRepository(RscPlatformEntity);
  logSection('PLATFORMS');

  const platforms: Partial<RscPlatformEntity>[] = [
    { name: 'PC', slug: 'pc', icon: 'mdi:windows', },
    { name: 'PlayStation 5', slug: 'ps5', icon: 'mdi:sony-playstation' },
    { name: 'PlayStation 4', slug: 'ps4', icon: 'mdi:sony-playstation' },
    { name: 'Xbox Series X/S', slug: 'xbox-series', icon: 'mdi:microsoft-xbox' },
    { name: 'Xbox One', slug: 'xbox-one', icon: 'mdi:microsoft-xbox' },
    { name: 'Nintendo Switch', slug: 'nintendo-switch', icon: 'mdi:nintendo-switch' },
    { name: 'Mobile', slug: 'mobile', icon: 'mdi:cellphone-iphone' },
  ];

  for (const platform of platforms) {
    await seedIfNotExists(repo, { slug: platform.slug }, platform);
  }

  console.log('✅ Platforms seeded successfully!');
}
