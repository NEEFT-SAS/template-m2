import { RscCharactersSeeder } from './seeders/resources/rsc-characters.seeder';
import { RscGameCharactersSeeder } from './seeders/resources/rsc-game-characters.seeder';
import { RscGameModesSeeder } from './seeders/resources/rsc-game-modes.seeder';
import { RscGamePlatformsSeeder } from './seeders/resources/rsc-game-platforms.seeder';
import { RscGamePositionsSeeder } from './seeders/resources/rsc-game-positions.seeder';
import { RscGameRanksSeeder } from './seeders/resources/rsc-game-ranks.seeder';
import { RscGameSeasonsSeeder } from './seeders/resources/rsc-game-seasons.seeder';
import { RscGamesSeeder } from './seeders/resources/rsc-games.seeder';
import { RscModesSeeder } from './seeders/resources/rsc-modes.seeder';
import { RscPlatformsSeeder } from './seeders/resources/rsc-platforms.seeder';
import { RscPositionsSeeder } from './seeders/resources/rsc-positions.seeder';
import { RscRanksSeeder } from './seeders/resources/rsc-ranks.seeder';
import { RscSeasonsSeeder } from './seeders/resources/rsc-seasons.seeder';

export const seeders = [
  new RscCharactersSeeder(),
  new RscModesSeeder(),
  new RscPlatformsSeeder(),
  new RscPositionsSeeder(),
  new RscRanksSeeder(),
  new RscSeasonsSeeder(),
  new RscGamesSeeder(),
  new RscGamePlatformsSeeder(),
  new RscGameModesSeeder(),
  new RscGamePositionsSeeder(),
  new RscGameRanksSeeder(),
  new RscGameSeasonsSeeder(),
  new RscGameCharactersSeeder(),
];
