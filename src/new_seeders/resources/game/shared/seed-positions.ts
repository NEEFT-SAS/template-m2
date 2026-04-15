import { RscPositionEntity } from '@/contexts/resources/infra/persistence/entities/games/base/rsc-positions.entity';
import { logSection, seedIfNotExists } from '@/new_seeders/helpers/seeder-utils';
import { DataSource } from 'typeorm';

export async function seedPositions(dataSource: DataSource) {
  const repo = dataSource.getRepository(RscPositionEntity);
  logSection('POSITIONS');

  const positions: Array<Partial<RscPositionEntity> & { description?: string }> = [
    { name: 'Toplane', slug: 'lol-top', icon: '@games:league-of-legends:toplane', description: 'Ligne du haut, souvent jouee par des tanks ou bruisers.' },
    { name: 'Jungle', slug: 'lol-jungle', icon: '@games:league-of-legends:jungle', description: 'Role mobile qui controle la carte et les objectifs.' },
    { name: 'Midlane', slug: 'lol-mid', icon: '@games:league-of-legends:midlane', description: 'Ligne centrale jouee par des mages ou assassins.' },
    { name: 'Botlane (ADC)', slug: 'lol-adc', icon: '@games:league-of-legends:adc', description: 'Carry a distance, principale source de degats physiques.' },
    { name: 'Support', slug: 'lol-support', icon: '@games:league-of-legends:support', description: 'Apporte vision, utilitaire et protection a l equipe.' },

    { name: 'Duelist', slug: 'val-duelist', icon: '@games:valorant:duelist', description: 'Agent offensif qui cherche les premiers duels.' },
    { name: 'Initiator', slug: 'val-initiator', icon: '@games:valorant:initiator', description: 'Prepare l entree sur site et la prise d informations.' },
    { name: 'Sentinel', slug: 'val-sentinel', icon: '@games:valorant:sentinel', description: 'Defend les zones et protege ses allies.' },
    { name: 'Controller', slug: 'val-controller', icon: '@games:valorant:controller', description: 'Controle la vision avec smokes et utilitaires.' },

    { name: 'Assault', slug: 'apex-assault', icon: '@games:apex-legends:assault', description: 'Role agressif de front line.' },
    { name: 'Skirmisher', slug: 'apex-skirmisher', icon: '@games:apex-legends:skirmisher', description: 'Mobilite elevee et repositionnement rapide.' },
    { name: 'Support (Apex)', slug: 'apex-support', icon: '@games:apex-legends:support', description: 'Soutien et capacites de survie d equipe.' },
    { name: 'Recon', slug: 'apex-recon', icon: '@games:apex-legends:recon', description: 'Scan et collecte d information sur la zone.' },
    { name: 'Controller (Apex)', slug: 'apex-controller', icon: '@games:apex-legends:controller', description: 'Controle de zone et defense.' },

    { name: 'Offensif', slug: 'rl-offensive', icon: 'mdi:soccer', description: 'Joueur axe sur l attaque et la pression adverse.' },
    { name: 'Defensif', slug: 'rl-defensive', icon: 'mdi:shield-car', description: 'Joueur axe sur la defense et les saves.' },
    { name: 'Polyvalent', slug: 'rl-all-rounder', icon: 'mdi:infinity', description: 'Alterne entre attaque et defense.' },

    { name: 'Entry Fragger', slug: 'cs2-entry-fragger', icon: 'mdi:crosshairs', description: 'Premier a entrer sur un site et prendre les duels.' },
    { name: 'AWPer', slug: 'cs2-awper', icon: 'mdi:crosshairs-gps', description: 'Specialiste sniper et controle de lignes.' },
    { name: 'In-Game Leader', slug: 'cs2-igl', icon: 'mdi:account-tie', description: 'Dirige le plan de jeu et les timings.' },
    { name: 'Lurker', slug: 'cs2-lurker', icon: 'mdi:foot-print', description: 'Joue a l ecart pour prendre de l info et flanquer.' },
    { name: 'Support (CS2)', slug: 'cs2-support', icon: 'mdi:account-heart', description: 'Apporte utilitaires et setup aux coequipiers.' },
    { name: 'Anchor', slug: 'cs2-anchor', icon: 'mdi:map-marker', description: 'Tient un site en defense sur les executes.' },

    { name: 'Entry', slug: 'r6-entry', icon: 'mdi:run-fast', description: 'Ouvre les lignes de vue et prend les premiers duels.' },
    { name: 'Support', slug: 'r6-support', icon: 'mdi:shield-account', description: 'Apporte utilitaires critiques et couverture d equipe.' },
    { name: 'Hard Breach', slug: 'r6-hard-breach', icon: 'mdi:wall', description: 'Ouvre les surfaces renforcees pour creer les entrees.' },
    { name: 'Flex', slug: 'r6-flex', icon: 'mdi:swap-horizontal', description: 'S adapte a la composition et au rythme du round.' },
    { name: 'Roamer', slug: 'r6-roamer', icon: 'mdi:radar', description: 'Joue en mouvement pour ralentir et informer en defense.' },
    { name: 'Anchor (R6)', slug: 'r6-anchor', icon: 'mdi:home-floor-0', description: 'Reste sur site pour tenir la defense finale.' },

    { name: 'Light Build', slug: 'finals-light-build', icon: 'mdi:feather', description: 'Build leger, tres mobile.' },
    { name: 'Medium Build', slug: 'finals-medium-build', icon: 'mdi:arm-flex', description: 'Build equilibre entre mobilite et puissance.' },
    { name: 'Heavy Build', slug: 'finals-heavy-build', icon: 'mdi:shield', description: 'Build tank pour defense et pushes lourds.' },

    { name: 'Attaquant', slug: 'brawl-attacker', icon: 'mdi:sword', description: 'Pousse les lignes et elimine les ennemis.' },
    { name: 'Soutien', slug: 'brawl-support', icon: 'mdi:medical-bag', description: 'Soin, utilitaire et controle pour l equipe.' },
    { name: 'Tank', slug: 'brawl-tank', icon: 'mdi:shield-account', description: 'Absorbe les degats et ouvre les engages.' },
    { name: 'Sniper', slug: 'brawl-sniper', icon: 'mdi:target-account', description: 'Pression a longue portee avec precision.' },
  ];

  for (const position of positions) {
    const { description: _description, ...positionData } = position;
    await seedIfNotExists(repo, { slug: position.slug }, positionData);
  }

  console.log('✅ Positions seeded successfully!');
}
