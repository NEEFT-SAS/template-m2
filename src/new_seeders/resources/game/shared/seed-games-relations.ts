import { DataSource } from 'typeorm';
import { logSection } from '@/new_seeders/helpers/seeder-utils';
import { RscPlatformEntity } from '@/contexts/resources/infra/persistence/entities/games/base/rsc-platforms.entity';
import { RscPositionEntity } from '@/contexts/resources/infra/persistence/entities/games/base/rsc-positions.entity';
import { RscRankEntity } from '@/contexts/resources/infra/persistence/entities/games/base/rsc-ranks.entity';
import { RscCharacterEntity } from '@/contexts/resources/infra/persistence/entities/games/base/rsc-characters.entity';
import { RscModeEntity } from '@/contexts/resources/infra/persistence/entities/games/base/rsc-modes.entity';
import { RscGameEntity } from '@/contexts/resources/infra/persistence/entities/games/rsc-games.entity';
import { RscGamePlatformEntity } from '@/contexts/resources/infra/persistence/entities/games/relations/rsc-game-platforms.entity';
import { RscGamePositionEntity } from '@/contexts/resources/infra/persistence/entities/games/relations/rsc-game-positions.entity';
import { RscGameRankEntity } from '@/contexts/resources/infra/persistence/entities/games/relations/rsc-game-ranks.entity';
import { RscGameCharacterEntity } from '@/contexts/resources/infra/persistence/entities/games/relations/rsc-game-characters.entity';
import { RscGameModeEntity } from '@/contexts/resources/infra/persistence/entities/games/relations/rsc-game-modes.entity';

export async function seedGameRelations(dataSource: DataSource) {
  logSection('GAME RELATIONS');

  const gameRepo = dataSource.getRepository(RscGameEntity);
  const platformRepo = dataSource.getRepository(RscPlatformEntity);
  const positionRepo = dataSource.getRepository(RscPositionEntity);
  const rankRepo = dataSource.getRepository(RscRankEntity);
  const characterRepo = dataSource.getRepository(RscCharacterEntity);
  const modeRepo = dataSource.getRepository(RscModeEntity);

  const gamePlatformRepo = dataSource.getRepository(RscGamePlatformEntity);
  const gamePositionRepo = dataSource.getRepository(RscGamePositionEntity);
  const gameRankRepo = dataSource.getRepository(RscGameRankEntity);
  const gameCharacterRepo = dataSource.getRepository(RscGameCharacterEntity);
  const gameModeRepo = dataSource.getRepository(RscGameModeEntity);

  const games = await gameRepo.find();
  const platforms = await platformRepo.find();
  const positions = await positionRepo.find();
  const ranks = await rankRepo.find();
  const characters = await characterRepo.find();
  const modes = await modeRepo.find();

  for (const game of games) {
    console.log('🎮 Linking relations for ' + game.name);

    /* -------------------------------------------------------------------------- */
    /* 🔹 PLATFORMS                                                              */
    /* -------------------------------------------------------------------------- */
    const linkedPlatforms = platforms.filter((p) => {
      if (game.slug === 'brawl-stars') return p.slug === 'mobile';
      if (game.slug === 'league-of-legends') return p.slug === 'pc';
      if (game.slug === 'counter-strike-2') return p.slug === 'pc';

      // Valorant: PC + PS5 + Xbox Series
      if (game.slug === 'valorant') return ['pc', 'ps5', 'xbox-series'].includes(p.slug);
      // Apex: PC + PS4/PS5 + Xbox One/Series + Switch
      if (game.slug === 'apex-legends') return ['pc', 'ps4', 'ps5', 'xbox-one', 'xbox-series', 'nintendo-switch'].includes(p.slug);
      // Rocket League: PC + PS4/PS5 + Xbox One/Series + Switch
      if (game.slug === 'rocket-league') return ['pc', 'ps4', 'ps5', 'xbox-one', 'xbox-series', 'nintendo-switch'].includes(p.slug);
      // Fortnite: PC + PS4/PS5 + Xbox One/Series + Switch + Mobile
      if (game.slug === 'fortnite') return ['pc', 'ps4', 'ps5', 'xbox-one', 'xbox-series', 'nintendo-switch', 'mobile'].includes(p.slug);
      // The Finals: PC + PS4/PS5 + Xbox Series (pas Xbox One)
      if (game.slug === 'the-finals') return ['pc', 'ps4', 'ps5', 'xbox-series'].includes(p.slug);

      return false;
    });

    for (const [index, platform] of linkedPlatforms.entries()) {
      const desiredOrder = index + 1;
      const exists = await gamePlatformRepo.findOne({ where: { game: { id: game.id }, platform: { id: platform.id } } });
      if (!exists) {
        await gamePlatformRepo.save({ game, platform, order: desiredOrder });
        continue;
      }
      if (exists.order !== desiredOrder) {
        await gamePlatformRepo.save({ ...exists, order: desiredOrder });
      }
    }

    /* -------------------------------------------------------------------------- */
    /* 🔹 POSITIONS                                                              */
    /* -------------------------------------------------------------------------- */
    const linkedPositions = positions.filter((p) => {
      if (game.slug === 'league-of-legends') return p.slug.startsWith('lol-');
      if (game.slug === 'valorant') return p.slug.startsWith('val-');
      if (game.slug === 'apex-legends') return p.slug.startsWith('apex-');
      if (game.slug === 'brawl-stars') return p.slug.startsWith('brawl-');
      if (game.slug === 'rocket-league') return p.slug.startsWith('rl-');
      if (game.slug === 'counter-strike-2') return p.slug.startsWith('cs2-');
      if (game.slug === 'the-finals') return p.slug.startsWith('finals-');
      if (game.slug === 'fortnite') return p.slug.startsWith('ftn-');
      return false;
    });

    for (const [index, position] of linkedPositions.entries()) {
      const desiredOrder = index + 1;
      const exists = await gamePositionRepo.findOne({ where: { game: { id: game.id }, position: { id: position.id } } });
      if (!exists) {
        await gamePositionRepo.save({ game, position, order: desiredOrder });
        continue;
      }
      if (exists.order !== desiredOrder) {
        await gamePositionRepo.save({ ...exists, order: desiredOrder });
      }
    }

    /* -------------------------------------------------------------------------- */
    /* 🔹 RANKS                                                                  */
    /* -------------------------------------------------------------------------- */
    const linkedRanks = ranks
      .filter((r) => {
        if (game.slug === 'league-of-legends') return r.slug.startsWith('lol-');
        if (game.slug === 'valorant') return r.slug.startsWith('val-');
        if (game.slug === 'rocket-league') return r.slug.startsWith('rl-');
        if (game.slug === 'counter-strike-2') return r.slug.startsWith('cs2-');
        if (game.slug === 'fortnite') return r.slug.startsWith('ftn-');
        if (game.slug === 'brawl-stars') return r.slug.startsWith('brawl-');
        return false;
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    for (const [index, rank] of linkedRanks.entries()) {
      const desiredOrder = rank.order ?? index + 1;
      const exists = await gameRankRepo.findOne({ where: { game: { id: game.id }, rank: { id: rank.id } } });
      if (!exists) {
        await gameRankRepo.save({ game, rank, order: desiredOrder });
        continue;
      }
      if (exists.order !== desiredOrder) {
        await gameRankRepo.save({ ...exists, order: desiredOrder });
      }
    }

    /* -------------------------------------------------------------------------- */
    /* 🔹 MODES                                                                  */
    /* -------------------------------------------------------------------------- */
    const linkedModes = modes
      .filter((mode) => {
        if (game.slug === 'league-of-legends') return mode.slug.startsWith('lol-');
        if (game.slug === 'valorant') return mode.slug.startsWith('val-');
        if (game.slug === 'apex-legends') return mode.slug.startsWith('apex-');
        if (game.slug === 'rocket-league') return mode.slug.startsWith('rl-');
        if (game.slug === 'counter-strike-2') return mode.slug.startsWith('cs2-');
        if (game.slug === 'the-finals') return mode.slug.startsWith('the-finals');
        if (game.slug === 'fortnite') return mode.slug.startsWith('ftn-');
        if (game.slug === 'brawl-stars') return mode.slug.startsWith('brawl-');
        return false;
      })
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    for (const [index, mode] of linkedModes.entries()) {
      const desiredOrder = mode.order ?? index + 1;
      const exists = await gameModeRepo.findOne({ where: { game: { id: game.id }, mode: { id: mode.id } } });
      if (!exists) {
        await gameModeRepo.save(gameModeRepo.create({ game, mode, order: desiredOrder }));
        continue;
      }
      if (exists.order !== desiredOrder) {
        await gameModeRepo.save({ ...exists, order: desiredOrder });
      }
    }

    /* -------------------------------------------------------------------------- */
    /* 🔹 CHARACTERS                                                             */
    /* -------------------------------------------------------------------------- */
    const linkedCharacters = characters.filter((c) => {
      if (game.slug === 'league-of-legends') return c.slug.startsWith('lol-');
      if (game.slug === 'valorant') return c.slug.startsWith('val-');
      if (game.slug === 'apex-legends') return c.slug.startsWith('apex-');
      if (game.slug === 'brawl-stars') return c.slug.startsWith('brawl-');
      return false;
    });

    for (const character of linkedCharacters) {
      const exists = await gameCharacterRepo.findOne({ where: { game: { id: game.id }, character: { id: character.id } } });
      if (!exists) await gameCharacterRepo.save({ game, character });
    }
  }

  console.log('✅ Game relations seeded successfully!');
}
