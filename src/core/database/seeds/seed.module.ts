import { RscCharactersSeeder } from './seeders/resources/rsc-characters.seeder';
import { RscCountriesSeeder } from './seeders/resources/rsc-countries.seeder';
import { RscGameCharactersSeeder } from './seeders/resources/rsc-game-characters.seeder';
import { RscGameModesSeeder } from './seeders/resources/rsc-game-modes.seeder';
import { RscGamePlatformsSeeder } from './seeders/resources/rsc-game-platforms.seeder';
import { RscGamePositionsSeeder } from './seeders/resources/rsc-game-positions.seeder';
import { RscGameRanksSeeder } from './seeders/resources/rsc-game-ranks.seeder';
import { RscGameSeasonsSeeder } from './seeders/resources/rsc-game-seasons.seeder';
import { RscGamesSeeder } from './seeders/resources/rsc-games.seeder';
import { RscLanguagesSeeder } from './seeders/resources/rsc-languages.seeder';
import { RscModesSeeder } from './seeders/resources/rsc-modes.seeder';
import { RscPlatformsSeeder } from './seeders/resources/rsc-platforms.seeder';
import { RscPositionsSeeder } from './seeders/resources/rsc-positions.seeder';
import { RscRanksSeeder } from './seeders/resources/rsc-ranks.seeder';
import { RscSeasonsSeeder } from './seeders/resources/rsc-seasons.seeder';
import { RscSocialPlatformsSeeder } from './seeders/resources/rsc-social-platforms.seeder';
import { RscStaffGroupOptionsSeeder } from './seeders/resources/rsc-staff-group-options.seeder';
import { RscStaffOptionGroupsSeeder } from './seeders/resources/rsc-staff-option-groups.seeder';
import { RscStaffOptionsSeeder } from './seeders/resources/rsc-staff-options.seeder';
import { RscStaffRoleOptionLinksSeeder } from './seeders/resources/rsc-staff-role-option-links.seeder';
import { RscStaffRolesSeeder } from './seeders/resources/rsc-staff-roles.seeder';

export const seeders = [
  new RscCountriesSeeder(),
  new RscLanguagesSeeder(),
  new RscSocialPlatformsSeeder(),
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
  new RscStaffRolesSeeder(),
  new RscStaffOptionGroupsSeeder(),
  new RscStaffOptionsSeeder(),
  new RscStaffGroupOptionsSeeder(),
  new RscStaffRoleOptionLinksSeeder(),
];
