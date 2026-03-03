import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RscSocialPlatformEntity } from '../persistence/entities/rsc-socials-platforms.entity';
import { ResourcesPresenter, RscCountryPresenter, RscGamePresenter, RscLanguagePresenter, RscProfileBadgePresenter, RscSocialPlatformPresenter } from '@neeft-sas/shared';
import { plainToInstance } from 'class-transformer';
import { RscProfileBadgeEntity } from '../persistence/entities/rsc-profile-badges.entity';
import { RscCountryEntity } from '../persistence/entities/rsc-countries.entity';
import { RscLanguageEntity } from '../persistence/entities/rsc-languages.entity';
import { RscGameEntity } from '../persistence/entities/games/rsc-games.entity';
import { RscGamePlatformEntity } from '../persistence/entities/games/relations/rsc-game-platforms.entity';
import { RscGameModeEntity } from '../persistence/entities/games/relations/rsc-game-modes.entity';
import { RscGamePositionEntity } from '../persistence/entities/games/relations/rsc-game-positions.entity';
import { RscGameRankEntity } from '../persistence/entities/games/relations/rsc-game-ranks.entity';
import { RscGameSeasonEntity } from '../persistence/entities/games/relations/rsc-game-seasons.entity';
import { RscGameCharacterEntity } from '../persistence/entities/games/relations/rsc-game-characters.entity';

@Injectable()
export class ResourcesStore implements OnModuleInit {
  private readonly logger = new Logger(ResourcesStore.name);

  private snapshot: ResourcesPresenter = {
    version: new Date().toISOString(),
    rscCountries: [],
    rscLanguages: [],
    rscSocialPlatforms: [],
    rscProfileBadges: [],
    rscGames: [],
  };

  constructor(
    @InjectRepository(RscSocialPlatformEntity) private readonly socialRepo: Repository<RscSocialPlatformEntity>,
    @InjectRepository(RscProfileBadgeEntity) private readonly badgeRepo: Repository<RscProfileBadgeEntity>,
    @InjectRepository(RscCountryEntity) private readonly countryRepo: Repository<RscCountryEntity>,
    @InjectRepository(RscLanguageEntity) private readonly languageRepo: Repository<RscLanguageEntity>,
    @InjectRepository(RscGameEntity) private readonly gameRepo: Repository<RscGameEntity>,
    @InjectRepository(RscGamePlatformEntity) private readonly gamePlatformRepo: Repository<RscGamePlatformEntity>,
    @InjectRepository(RscGameModeEntity) private readonly gameModeRepo: Repository<RscGameModeEntity>,
    @InjectRepository(RscGamePositionEntity) private readonly gamePositionRepo: Repository<RscGamePositionEntity>,
    @InjectRepository(RscGameRankEntity) private readonly gameRankRepo: Repository<RscGameRankEntity>,
    @InjectRepository(RscGameSeasonEntity) private readonly gameSeasonRepo: Repository<RscGameSeasonEntity>,
    @InjectRepository(RscGameCharacterEntity) private readonly gameCharacterRepo: Repository<RscGameCharacterEntity>,
  ) {}

  async onModuleInit() {
    await this.reload();
  }

  getSnapshot(): ResourcesPresenter {
    return this.snapshot;
  }

  async reload(): Promise<void> {
    
    const socials = await this.socialRepo.find({
      where: { isActive: true },
      order: { label: 'ASC' },
    });

    const badges = await this.badgeRepo.find({
      where: { isActive: true },
      order: { priority: 'ASC', label: 'ASC' },
    });

    const countries = await this.countryRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });

    const languages = await this.languageRepo.find({
      where: { isActive: true },
      order: { label: 'ASC' },
    });

    const games = await this.gameRepo.find({
      order: { name: 'ASC' },
    });

    const gamePlatforms = await this.gamePlatformRepo.find({
      relations: { platform: true },
      order: { order: 'ASC', id: 'ASC' },
    });

    const gameModes = await this.gameModeRepo.find({
      relations: { mode: true },
      order: { order: 'ASC', id: 'ASC' },
    });

    const gamePositions = await this.gamePositionRepo.find({
      relations: { position: true },
      order: { order: 'ASC', id: 'ASC' },
    });

    const gameRanks = await this.gameRankRepo.find({
      relations: { rank: true },
      order: { order: 'ASC', id: 'ASC' },
    });

    const gameSeasons = await this.gameSeasonRepo.find({
      relations: { season: true },
      order: { order: 'ASC', id: 'ASC' },
    });

    const gameCharacters = await this.gameCharacterRepo.find({
      relations: { character: true },
      order: { order: 'ASC', id: 'ASC' },
    });

    const groupByGameId = <T extends { gameId: number }>(rows: T[]) => {
      const map = new Map<number, T[]>();
      for (const row of rows) {
        const bucket = map.get(row.gameId);
        if (bucket) bucket.push(row);
        else map.set(row.gameId, [row]);
      }
      return map;
    };

    const gamePlatformsByGameId = groupByGameId(gamePlatforms);
    const gameModesByGameId = groupByGameId(gameModes);
    const gamePositionsByGameId = groupByGameId(gamePositions);
    const gameRanksByGameId = groupByGameId(gameRanks);
    const gameSeasonsByGameId = groupByGameId(gameSeasons);
    const gameCharactersByGameId = groupByGameId(gameCharacters);

    const gamesWithRelations = games.map((game) => ({
      ...game,
      rscGamePlatforms: (gamePlatformsByGameId.get(game.id) ?? [])
        .flatMap((row) => (row.platform ? [{
          id: row.platform.id,
          name: row.platform.name,
          slug: row.platform.slug,
          icon: row.platform.icon,
        }] : [])),
      rscGameModes: (gameModesByGameId.get(game.id) ?? [])
        .flatMap((row) => (row.mode ? [{
          id: row.mode.id,
          name: row.mode.name,
          slug: row.mode.slug,
          description: row.mode.description,
          isRanked: row.mode.isRanked,
          order: row.order,
        }] : [])),
      rscGamePositions: (gamePositionsByGameId.get(game.id) ?? [])
        .flatMap((row) => (row.position ? [{
          id: row.position.id,
          name: row.position.name,
          slug: row.position.slug,
          icon: row.position.icon,
          order: row.order,
        }] : [])),
      rscGameRanks: (gameRanksByGameId.get(game.id) ?? [])
        .flatMap((row) => (row.rank ? [{
          id: row.rank.id,
          name: row.rank.name,
          slug: row.rank.slug,
          order: row.order,
          division: row.rank.division,
          tier: row.rank.tier,
          icon: row.rank.icon,
        }] : [])),
      rscGameSeasons: (gameSeasonsByGameId.get(game.id) ?? [])
        .flatMap((row) => (row.season ? [{
          id: row.season.id,
          code: row.season.code,
          name: row.season.name,
          startDate: row.season.startDate,
          endDate: row.season.endDate,
        }] : [])),
      rscGameCharacters: (gameCharactersByGameId.get(game.id) ?? [])
        .flatMap((row) => (row.character ? [{
          id: row.character.id,
          name: row.character.name,
          slug: row.character.slug,
          icon: row.character.icon,
        }] : [])),
    }));

    this.snapshot = {
      version: new Date().toISOString(),
      rscSocialPlatforms: plainToInstance(RscSocialPlatformPresenter, socials, { excludeExtraneousValues: true }),
      rscProfileBadges: plainToInstance(RscProfileBadgePresenter, badges, { excludeExtraneousValues: true }),
      rscCountries: plainToInstance(RscCountryPresenter, countries, { excludeExtraneousValues: true }),
      rscLanguages: plainToInstance(RscLanguagePresenter, languages, { excludeExtraneousValues: true }),
      rscGames: plainToInstance(RscGamePresenter, gamesWithRelations, { excludeExtraneousValues: true }),
    };

    console.log('ResourcesStore reloaded:', this.snapshot);
    this.logger.log(`Resources loaded: rscSocialPlatforms=${this.snapshot.rscSocialPlatforms.length}`);
  }
}
