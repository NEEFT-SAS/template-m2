import { RscModeEntity } from '@/contexts/resources/infra/persistence/entities/games/base/rsc-modes.entity';
import { logSection, seedIfNotExists } from '@/new_seeders/helpers/seeder-utils';
import { DataSource } from 'typeorm';

export async function seedModes(dataSource: DataSource) {
  const repo = dataSource.getRepository(RscModeEntity);
  logSection('MODES');

 const baseModes: Partial<RscModeEntity>[] = [
    // 🧠 League of Legends
    { name: 'Solo/Duo', slug: 'lol-solo-duo', order: 0, description: 'Mode compétitif individuel ou en duo.', isRanked: true },
    { name: 'Flex', slug: 'lol-flex', order: 1, description: 'Mode compétitif en équipe flexible.', isRanked: true },

    // 🎯 Valorant
    { name: 'ranked', slug: 'val-ranked', order: 0, description: 'Mode classé avec progression de rangs d’Iron à Radiant.', isRanked: true },
    { name: 'premier', slug: 'val-premier', order: 1, description: 'Mode compétitif principal avec matchmaking.', isRanked: true },

    // ⚽ Rocket League
    { name: '1v1', slug: 'rl-1v1', order: 0, description: 'Affrontement en tête-à-tête, basé sur le skill pur.', isRanked: true },
    { name: '2v2', slug: 'rl-2v2', order: 1, description: 'Mode classé en duo.', isRanked: true },
    { name: '3v3', slug: 'rl-3v3', order: 2, description: 'Format officiel classé de Rocket League.', isRanked: true },

    // 🔫 Counter-Strike 2
    { name: 'Premier', slug: 'cs2-premier', order: 0, description: 'Mode compétitif principal avec MMR global.', isRanked: true },
    { name: 'Competitive', slug: 'cs2-competitive', order: 1, description: 'Mode classé classique avec matchmaking.', isRanked: true },
    { name: 'Wingman', slug: 'cs2-wingman', order: 2, description: 'Mode 2v2 compétitif sur cartes réduites.', isRanked: true },

    // 💥 Fortnite
    { name: 'Battle Royale Solo', slug: 'ftn-solo', order: 0, description: 'Mode solo classé.', isRanked: true },
    { name: 'Battle Royale Duo', slug: 'ftn-duo', order: 1, description: 'Mode duo classé.', isRanked: true },
    { name: 'Battle Royale Trio', slug: 'ftn-trio', order: 2, description: 'Mode trio classé.', isRanked: true },
    { name: 'Battle Royale Squad', slug: 'ftn-squad', order: 3, description: 'Mode escouade classé.', isRanked: true },
    { name: 'Zero Build Solo', slug: 'ftn-zero-build-solo', order: 4, description: 'Battle Royale sans construction, en mode compétitif.', isRanked: true },
    { name: 'Zero Build Duo', slug: 'ftn-zero-build-duo', order: 5, description: 'Battle Royale sans construction en duo, en mode compétitif.', isRanked: true },
    { name: 'Zero Build Trio', slug: 'ftn-zero-build-trio', order: 6, description: 'Battle Royale sans construction en trio, en mode compétitif.', isRanked: true },
    { name: 'Zero Build Squad', slug: 'ftn-zero-build-squad', order: 7, description: 'Battle Royale sans construction en escouade, en mode compétitif.', isRanked: true },

    // 🧱 The Finals
    { name: 'Tournament', slug: 'finals-tournament', order: 0, description: 'Mode compétitif principal en plusieurs manches.', isRanked: true },

    // 🛠️ Apex Legends
    { name: 'Ranked', slug: 'apex-ranked', order: 0, description: 'Mode classé basé sur éliminations et placement.', isRanked: true },

    // 📱 Brawl Stars
    { name: 'Ranked', slug: 'brawl-ranked', order: 0, description: 'Mode compétitif principal de Brawl Stars.', isRanked: true },
  ];


  for (const mode of baseModes) {
    await seedIfNotExists(repo, { slug: mode.slug }, mode);
  }

  console.log('✅ Modes seeded successfully!');
}
