import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RscSocialPlatformEntity } from '../persistence/entities/rsc-socials-platforms.entity';
import {
  ResourcesPresenter,
  RscCharacterPresenter,
  RscCountryPresenter,
  RscGamePresenter,
  RscLanguagePresenter,
  RscModePresenter,
  RscPlatformPresenter,
  RscPositionPresenter,
  RscProfileBadgePresenter,
  RscRankPresenter,
  RscSeasonPresenter,
  RscSocialPlatformPresenter,
} from '@neeft-sas/shared';
import { plainToInstance } from 'class-transformer';
import { RscProfileBadgeEntity } from '../persistence/entities/rsc-profile-badges.entity';
import { RscCountryEntity } from '../persistence/entities/rsc-countries.entity';
import { RscLanguageEntity } from '../persistence/entities/rsc-languages.entity';
import { RscCharacterEntity } from '../persistence/entities/games/base/rsc-characters.entity';
import { RscModeEntity } from '../persistence/entities/games/base/rsc-modes.entity';
import { RscPlatformEntity } from '../persistence/entities/games/base/rsc-platforms.entity';
import { RscPositionEntity } from '../persistence/entities/games/base/rsc-positions.entity';
import { RscRankEntity } from '../persistence/entities/games/base/rsc-ranks.entity';
import { RscSeasonEntity } from '../persistence/entities/games/base/rsc-seasons.entity';
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
    rscCharacters: [],
    rscModes: [],
    rscPlatforms: [],
    rscPositions: [],
    rscRanks: [],
    rscSeasons: [],
    rscGames: [],
  };

  constructor(
    @InjectRepository(RscSocialPlatformEntity) private readonly socialRepo: Repository<RscSocialPlatformEntity>,
    @InjectRepository(RscProfileBadgeEntity) private readonly badgeRepo: Repository<RscProfileBadgeEntity>,
    @InjectRepository(RscCountryEntity) private readonly countryRepo: Repository<RscCountryEntity>,
    @InjectRepository(RscLanguageEntity) private readonly languageRepo: Repository<RscLanguageEntity>,
    @InjectRepository(RscCharacterEntity) private readonly characterRepo: Repository<RscCharacterEntity>,
    @InjectRepository(RscModeEntity) private readonly modeRepo: Repository<RscModeEntity>,
    @InjectRepository(RscPlatformEntity) private readonly platformRepo: Repository<RscPlatformEntity>,
    @InjectRepository(RscPositionEntity) private readonly positionRepo: Repository<RscPositionEntity>,
    @InjectRepository(RscRankEntity) private readonly rankRepo: Repository<RscRankEntity>,
    @InjectRepository(RscSeasonEntity) private readonly seasonRepo: Repository<RscSeasonEntity>,
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

    const characters = await this.characterRepo.find({
      order: { name: 'ASC' },
    });

    const modes = await this.modeRepo.find({
      order: { order: 'ASC', name: 'ASC' },
    });

    const platforms = await this.platformRepo.find({
      order: { name: 'ASC' },
    });

    const positions = await this.positionRepo.find({
      order: { order: 'ASC', name: 'ASC' },
    });

    const ranks = await this.rankRepo.find({
      order: { order: 'ASC', name: 'ASC' },
    });

    const seasons = await this.seasonRepo.find({
      order: { code: 'ASC' },
    });

    const games = await this.gameRepo.find({
      order: { name: 'ASC' },
    });

    const gamePlatforms = await this.gamePlatformRepo.find({
      order: { order: 'ASC', id: 'ASC' },
    });

    const gameModes = await this.gameModeRepo.find({
      order: { order: 'ASC', id: 'ASC' },
    });

    const gamePositions = await this.gamePositionRepo.find({
      order: { order: 'ASC', id: 'ASC' },
    });

    const gameRanks = await this.gameRankRepo.find({
      order: { order: 'ASC', id: 'ASC' },
    });

    const gameSeasons = await this.gameSeasonRepo.find({
      order: { order: 'ASC', id: 'ASC' },
    });

    const gameCharacters = await this.gameCharacterRepo.find({
      order: { order: 'ASC', id: 'ASC' },
    });

    const rscCharacterPresenters = plainToInstance(RscCharacterPresenter, characters, { excludeExtraneousValues: true });
    const rscModePresenters = plainToInstance(RscModePresenter, modes, { excludeExtraneousValues: true });
    const rscPlatformPresenters = plainToInstance(RscPlatformPresenter, platforms, { excludeExtraneousValues: true });
    const rscPositionPresenters = plainToInstance(RscPositionPresenter, positions, { excludeExtraneousValues: true });
    const rscRankPresenters = plainToInstance(RscRankPresenter, ranks, { excludeExtraneousValues: true });
    const rscSeasonPresenters = plainToInstance(RscSeasonPresenter, seasons, { excludeExtraneousValues: true });

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
      platforms: (gamePlatformsByGameId.get(game.id) ?? []).map((row) => ({
        order: row.order,
        rscPlatformId: row.rscPlatformId,
      })),
      modes: (gameModesByGameId.get(game.id) ?? []).map((row) => ({
        order: row.order,
        rscModeId: row.rscModeId,
      })),
      positions: (gamePositionsByGameId.get(game.id) ?? []).map((row) => ({
        order: row.order,
        rscPositionId: row.rscPositionId,
      })),
      ranks: (gameRanksByGameId.get(game.id) ?? []).map((row) => ({
        order: row.order,
        rscRankId: row.rscRankId,
      })),
      seasons: (gameSeasonsByGameId.get(game.id) ?? []).map((row) => ({
        order: row.order,
        rscSeasonId: row.rscSeasonId,
      })),
      characters: (gameCharactersByGameId.get(game.id) ?? []).map((row) => ({
        order: row.order,
        rscCharacterId: row.rscCharacterId,
      })),
    }));

    this.snapshot = {
      version: new Date().toISOString(),
      rscSocialPlatforms: plainToInstance(RscSocialPlatformPresenter, socials, { excludeExtraneousValues: true }),
      rscProfileBadges: plainToInstance(RscProfileBadgePresenter, badges, { excludeExtraneousValues: true }),
      rscCountries: plainToInstance(RscCountryPresenter, countries, { excludeExtraneousValues: true }),
      rscLanguages: plainToInstance(RscLanguagePresenter, languages, { excludeExtraneousValues: true }),
      rscCharacters: rscCharacterPresenters,
      rscModes: rscModePresenters,
      rscPlatforms: rscPlatformPresenters,
      rscPositions: rscPositionPresenters,
      rscRanks: rscRankPresenters,
      rscSeasons: rscSeasonPresenters,
      rscGames: plainToInstance(RscGamePresenter, gamesWithRelations, { excludeExtraneousValues: true }),
    };

    console.log('ResourcesStore reloaded:', this.snapshot);
    this.logger.log(`Resources loaded: rscSocialPlatforms=${this.snapshot.rscSocialPlatforms.length}`);
  }
}
