import { RscModeEntity } from '@/contexts/resources/infra/persistence/entities/games/base/rsc-modes.entity';
import { logSection, seedIfNotExists } from '@/new_seeders/helpers/seeder-utils';
import { DataSource } from 'typeorm';

export async function seedModes(dataSource: DataSource) {
  const repo = dataSource.getRepository(RscModeEntity);
  logSection('MODES');

  const baseModes: Partial<RscModeEntity>[] = [
    { name: 'Solo/Duo', slug: 'lol-solo-duo', order: 0, description: 'Mode competitif individuel ou duo.', isRanked: true },
    { name: 'Flex', slug: 'lol-flex', order: 1, description: 'Mode competitif en equipe flexible.', isRanked: true },

    { name: 'Ranked', slug: 'val-ranked', order: 0, description: 'Mode classe principal de Valorant.', isRanked: true },
    { name: 'Premier', slug: 'val-premier', order: 1, description: 'Mode equipe de Valorant Premier.', isRanked: true },

    { name: '1v1', slug: 'rl-1v1', order: 0, description: 'Affrontement en un contre un.', isRanked: true },
    { name: '2v2', slug: 'rl-2v2', order: 1, description: 'Mode classe en duo.', isRanked: true },
    { name: '3v3', slug: 'rl-3v3', order: 2, description: 'Mode classe standard de Rocket League.', isRanked: true },

    { name: 'Premier', slug: 'cs2-premier', order: 0, description: 'Mode principal avec elo global.', isRanked: true },
    // { name: 'Competitive', slug: 'cs2-competitive', order: 1, description: 'Mode competitif classique par map.', isRanked: true },
    // { name: 'Wingman', slug: 'cs2-wingman', order: 2, description: 'Mode 2v2 competitif.', isRanked: true },

    { name: 'Ranked', slug: 'r6-ranked', order: 0, description: 'Mode classe principal de Rainbow Six Siege.', isRanked: true },
    // { name: 'Standard', slug: 'r6-standard', order: 1, description: 'Mode standard sans elo.', isRanked: false },
    // { name: 'Quick Match', slug: 'r6-quick-match', order: 2, description: 'Mode rapide avec regles simplifiees.', isRanked: false },

    { name: 'Battle Royale Solo', slug: 'ftn-solo', order: 0, description: 'Mode solo classe.', isRanked: true },
    { name: 'Battle Royale Duo', slug: 'ftn-duo', order: 1, description: 'Mode duo classe.', isRanked: true },
    { name: 'Battle Royale Trio', slug: 'ftn-trio', order: 2, description: 'Mode trio classe.', isRanked: true },
    { name: 'Battle Royale Squad', slug: 'ftn-squad', order: 3, description: 'Mode squad classe.', isRanked: true },
    { name: 'Zero Build Solo', slug: 'ftn-zero-build-solo', order: 4, description: 'Mode solo sans construction.', isRanked: true },
    { name: 'Zero Build Duo', slug: 'ftn-zero-build-duo', order: 5, description: 'Mode duo sans construction.', isRanked: true },
    { name: 'Zero Build Trio', slug: 'ftn-zero-build-trio', order: 6, description: 'Mode trio sans construction.', isRanked: true },
    { name: 'Zero Build Squad', slug: 'ftn-zero-build-squad', order: 7, description: 'Mode squad sans construction.', isRanked: true },

    { name: 'Tournament', slug: 'finals-tournament', order: 0, description: 'Mode competitif principal de The Finals.', isRanked: true },

    { name: 'Ranked', slug: 'apex-ranked', order: 0, description: 'Mode classe base sur placement et eliminations.', isRanked: true },

    { name: 'Ranked', slug: 'brawl-ranked', order: 0, description: 'Mode competitif principal de Brawl Stars.', isRanked: true },
  ];

  for (const mode of baseModes) {
    await seedIfNotExists(repo, { slug: mode.slug }, mode);
  }

  console.log('✅ Modes seeded successfully!');
}
