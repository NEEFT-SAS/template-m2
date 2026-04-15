import { DataSource } from 'typeorm';
import { logSection, seedIfNotExists } from '@/new_seeders/helpers/seeder-utils';
import { RscGameEntity } from '@/contexts/resources/infra/persistence/entities/games/rsc-games.entity';

export async function seedGames(dataSource: DataSource) {
  const repo = dataSource.getRepository(RscGameEntity);
  logSection('GAMES');

  const games: Partial<RscGameEntity>[] = [
    {
      name: 'League of Legends',
      shortName: 'LoL',
      slug: 'league-of-legends',
      genre: 'MOBA',
      developer: 'Riot Games',
      releaseDate: new Date('2009-10-27'),
      edition: 'Free-to-play',
      officialLink: 'https://www.leagueoflegends.com',
      apiLink: 'https://ddragon.leagueoflegends.com',
      icon: 'https://firebasestorage.googleapis.com/v0/b/gamerlink-1d7db.firebasestorage.app/o/images%2Fgames%2Fleague-of-legends%2Flogo.png?alt=media&token=cb5629c0-6f53-4793-9583-be18aa0aaaea',
      banner: 'https://firebasestorage.googleapis.com/v0/b/gamerlink-1d7db.firebasestorage.app/o/images%2Fgames%2Fleague-of-legends%2Fbanner.avif?alt=media&token=26634b52-57e9-44da-b08a-36446a500341',
      description: 'MOBA competitif de Riot Games opposant deux equipes de cinq champions.',
    },
    {
      name: 'Valorant',
      shortName: 'VAL',
      slug: 'valorant',
      genre: 'FPS Tactique',
      developer: 'Riot Games',
      releaseDate: new Date('2020-06-02'),
      edition: 'Free-to-play',
      officialLink: 'https://playvalorant.com',
      apiLink: 'https://valorant-api.com',
      icon: 'https://firebasestorage.googleapis.com/v0/b/gamerlink-1d7db.firebasestorage.app/o/images%2Fgames%2Fvalorant%2Flogo.png?alt=media&token=db568def-ef41-40ed-97e3-0e5644e4cb08',
      banner: 'https://firebasestorage.googleapis.com/v0/b/gamerlink-1d7db.firebasestorage.app/o/images%2Fgames%2Fvalorant%2Fbanner.webp?alt=media&token=4077bcbe-4bbc-43cc-a810-9cd69a49b638',
      description: 'FPS tactique competitif alliant precision et competences des agents.',
    },
    {
      name: 'Rocket League',
      shortName: 'RL',
      slug: 'rocket-league',
      genre: 'Sport automobile / Arcade',
      developer: 'Psyonix / Epic Games',
      releaseDate: new Date('2015-07-07'),
      edition: 'Free-to-play',
      officialLink: 'https://www.rocketleague.com',
      apiLink: 'https://api.tracker.gg/api/v2/rocket-league',
      icon: 'https://firebasestorage.googleapis.com/v0/b/gamerlink-1d7db.firebasestorage.app/o/images%2Fgames%2Frocket-league%2F74472a30df20297d663f7b0d4304b112.png?alt=media&token=83c5ddfe-f4e1-4a18-8046-d475c7a69680',
      banner: 'https://firebasestorage.googleapis.com/v0/b/gamerlink-1d7db.firebasestorage.app/o/images%2Fgames%2Frocket-league%2Fbanner.jpg?alt=media&token=13a9aed0-aad3-489a-b114-82a6863aa5b4',
      description: 'Jeu hybride entre football et conduite acrobatique.',
    },
    {
      name: 'Brawl Stars',
      shortName: 'Brawl',
      slug: 'brawl-stars',
      genre: 'Action / MOBA mobile',
      developer: 'Supercell',
      releaseDate: new Date('2018-12-12'),
      edition: 'Free-to-play',
      officialLink: 'https://supercell.com/en/games/brawlstars/',
      apiLink: 'https://api.brawlstars.com',
      icon: 'https://firebasestorage.googleapis.com/v0/b/gamerlink-1d7db.firebasestorage.app/o/images%2Fgames%2Fbrawl-stars%2Flogo.png?alt=media&token=84dd2d0c-ec6a-4dc9-ae61-7516bc3291f7',
      banner: 'https://firebasestorage.googleapis.com/v0/b/gamerlink-1d7db.firebasestorage.app/o/images%2Fgames%2Fbrawl-stars%2Fbanner.jpg?alt=media&token=60a5ac9b-67e5-433f-afc1-72a624eb7a85',
      description: 'Jeu d action multijoueur en ligne avec plusieurs modes competitifs.',
    },
    {
      name: 'Fortnite',
      shortName: 'FTN',
      slug: 'fortnite',
      genre: 'Battle Royale',
      developer: 'Epic Games',
      releaseDate: new Date('2017-07-25'),
      edition: 'Free-to-play',
      officialLink: 'https://www.fortnite.com',
      apiLink: null,
      icon: 'https://firebasestorage.googleapis.com/v0/b/gamerlink-1d7db.firebasestorage.app/o/images%2Fgames%2Ffortnite%2Flogo.png?alt=media&token=eab53e92-3fcc-4048-aac2-c5043b8985cc',
      banner: 'https://firebasestorage.googleapis.com/v0/b/gamerlink-1d7db.firebasestorage.app/o/images%2Fgames%2Ffortnite%2Fbanner.jpeg?alt=media&token=f88ea458-2c49-4271-8ad6-87941a55cd8d',
      description: 'Battle Royale competitif avec construction et mode zero build.',
    },
    {
      name: 'Counter-Strike 2',
      shortName: 'CS2',
      slug: 'counter-strike-2',
      genre: 'FPS Competitif',
      developer: 'Valve Corporation',
      releaseDate: new Date('2023-09-27'),
      edition: 'Free-to-play',
      officialLink: 'https://www.counter-strike.net/cs2',
      apiLink: 'https://api.steampowered.com',
      icon: 'https://static.wikia.nocookie.net/logopedia/images/4/46/Counter-Strike_2.svg/revision/latest/scale-to-width-down/350?cb=20230323120159',
      banner: 'https://mir-s3-cdn-cf.behance.net/project_modules/max_1200_webp/08ce9a65126337.5b4c8ac9c4b3b.jpg',
      description: 'FPS competitif moderne base sur Source 2.',
    },
    {
      name: 'Tom Clancy\'s Rainbow Six Siege',
      shortName: 'R6',
      slug: 'rainbow-six-siege',
      genre: 'FPS Tactique',
      developer: 'Ubisoft Montreal',
      releaseDate: new Date('2015-12-01'),
      edition: 'Pay-to-play',
      officialLink: 'https://www.ubisoft.com/game/rainbow-six/siege',
      apiLink: null,
      icon: 'https://upload.wikimedia.org/wikipedia/en/e/eb/Rainbow_Six_Siege_cover_art.jpg',
      banner: 'https://images.ctfassets.net/g2ltkzdwq9rn/6bcNjAi8IU93fPm7s6EEDW/8ebaf8edf704ec327894f945e86f90f0/R6SX_Y10S1_KeyArt_3840x2160.jpg',
      description: 'FPS tactique 5v5 axe sur attaque, defense et destruction des environnements.',
    },
  ];

  for (const g of games) {
    await seedIfNotExists(repo, { slug: g.slug }, g);
  }

  console.log('✅ Games seeded successfully!');
}
