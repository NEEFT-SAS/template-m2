import { RscPositionEntity } from '@/contexts/resources/infra/persistence/entities/games/base/rsc-positions.entity';
import { logSection, seedIfNotExists } from '@/new_seeders/helpers/seeder-utils';
import { DataSource } from 'typeorm';

export async function seedPositions(dataSource: DataSource) {
  const repo = dataSource.getRepository(RscPositionEntity);
  logSection('POSITIONS');

  const positions: Array<Partial<RscPositionEntity> & { description?: string }> = [
    // 🧠 League of Legends
    { name: 'Toplane', slug: 'lol-top', icon: '@games:league-of-legends:toplane', description: 'Ligne du haut, souvent jouée par des tanks ou bruisers.' },
    { name: 'Jungle', slug: 'lol-jungle', icon: '@games:league-of-legends:jungle', description: 'Rôle mobile contrôlant la carte et les objectifs neutres.' },
    { name: 'Midlane', slug: 'lol-mid', icon: '@games:league-of-legends:midlane', description: 'Ligne centrale, jouée par des mages ou assassins.' },
    { name: 'Botlane (ADC)', slug: 'lol-adc', icon: '@games:league-of-legends:adc', description: 'Carry à distance, principal dealer de dégâts physiques.' },
    { name: 'Support', slug: 'lol-support', icon: '@games:league-of-legends:support', description: 'Assiste son équipe, apporte vision et soins.' },

    // 🎯 Valorant
    { name: 'Duelist', slug: 'val-duelist', icon: '@games:valorant:duelist', description: 'Agent offensif cherchant les premiers kills.' },
    { name: 'Initiator', slug: 'val-initiator', icon: '@games:valorant:initiator', description: 'Ouvre les combats et aide à l’entrée sur site.' },
    { name: 'Sentinel', slug: 'val-sentinel', icon: '@games:valorant:sentinel', description: 'Défend les zones et protège ses alliés.' },
    { name: 'Controller', slug: 'val-controller', icon: '@games:valorant:controller', description: 'Contrôle la vision avec ses fumigènes et utilitaires.' },

    // 🛠️ Apex Legends
    { name: 'Assault', slug: 'apex-assault', icon: '@games:apex-legends:assault', description: 'Ligne de front, expert en dégâts et en push.' },
    { name: 'Skirmisher', slug: 'apex-skirmisher', icon: '@games:apex-legends:skirmisher', description: 'Capable de mobilité extrême et de repositionnement.' },
    { name: 'Support (Apex)', slug: 'apex-support', icon: '@games:apex-legends:support', description: 'Peut réanimer et soutenir l’équipe.' },
    { name: 'Recon', slug: 'apex-recon', icon: '@games:apex-legends:recon', description: 'Scanne les ennemis et collecte les infos sur la zone.' },
    { name: 'Controller (Apex)', slug: 'apex-controller', icon: '@games:apex-legends:controller', description: 'Contrôle le terrain via la défense et le zoning.' },
    
    // ⚽ Rocket League
    { name: 'Offensif', slug: 'rl-offensive', icon: 'mdi:soccer', description: 'Joueur axé sur l’attaque et la pression adverse.' },
    { name: 'Défensif', slug: 'rl-defensive', icon: 'mdi:shield-car', description: 'Joueur orienté sur la défense et les saves.' },
    { name: 'Polyvalent', slug: 'rl-all-rounder', icon: 'mdi:infinity', description: 'Peut alterner entre attaque et défense.' },

    // 🔫 Counter-Strike 2
    { name: 'Entry Fragger', slug: 'cs2-entry-fragger', icon: 'mdi:crosshairs', description: 'Premier à entrer sur un site, prend les duels.' },
    { name: 'AWPer', slug: 'cs2-awper', icon: 'mdi:crosshairs-gps', description: 'Spécialiste du sniper et du positionnement longue portée.' },
    { name: 'In-Game Leader', slug: 'cs2-igl', icon: 'mdi:account-tie', description: 'Dirige l’équipe et prend les décisions stratégiques.' },
    { name: 'Lurker', slug: 'cs2-lurker', icon: 'mdi:foot-print', description: 'Joue à l’écart, surprend et flanque les ennemis.' },
    { name: 'Support (CS2)', slug: 'cs2-support', icon: 'mdi:account-heart', description: 'Fournit grenades et soutien tactique à l’équipe.' },
    { name: 'Anchor', slug: 'cs2-anchor', icon: 'mdi:map-marker', description: 'Joueur qui tient seul un site en défense.' },

    // 🧱 The Finals
    { name: 'Light Build', slug: 'finals-light-build', icon: 'mdi:feather', description: 'Rapide et agile, idéal pour les captures et l’esquive.' },
    { name: 'Medium Build', slug: 'finals-medium-build', icon: 'mdi:arm-flex', description: 'Équilibré entre mobilité, puissance et résistance.' },
    { name: 'Heavy Build', slug: 'finals-heavy-build', icon: 'mdi:shield', description: 'Tank résistant, excelle dans la défense et les assauts lourds.' },

    // 💥 Fortnite
    // { name: 'Builder', slug: 'ftn-builder', icon: 'mdi:hammer', description: 'Joueur orienté sur la construction rapide et défensive.' },
    // { name: 'Fragger', slug: 'ftn-fragger', icon: 'mdi:target', description: 'Joueur agressif axé sur les kills.' },
    // { name: 'Support', slug: 'ftn-support', icon: 'mdi:hand-heart', description: 'Fournit soins et couverture en duo ou squad.' },

    // 📱 Brawl Stars
    { name: 'Attaquant', slug: 'brawl-attacker', icon: 'mdi:sword', description: 'Se charge d’éliminer les ennemis et de pousser la ligne.' },
    { name: 'Soutien', slug: 'brawl-support', icon: 'mdi:medical-bag', description: 'Aide son équipe via le soin ou le contrôle.' },
    { name: 'Tank', slug: 'brawl-tank', icon: 'mdi:shield-account', description: 'Encaisse les dégâts et mène les assauts.' },
    { name: 'Sniper', slug: 'brawl-sniper', icon: 'mdi:target-account', description: 'Frappe à longue portée avec précision.' },
  ];

  for (const position of positions) {
    const { description: _description, ...positionData } = position;
    await seedIfNotExists(repo, { slug: position.slug }, positionData);
  }

  console.log('✅ Positions seeded successfully!');
}
