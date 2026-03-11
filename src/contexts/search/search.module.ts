import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { UserGameEntity } from '@/contexts/players/infra/entities/game/user-game.entity';
import { SearchController } from './api/search.controller';
import { SearchPlayersQuery } from './app/queries/search-players.query';
import { SearchTeamsQuery } from './app/queries/search-teams.query';
import { PlayerSearchIndexer } from './infra/typesense/player-search.indexer';
import { TypesenseService } from './infra/typesense/typesense.service';
import { AuthModule } from '../auth/auth.module';
import { ResourcesModule } from '../resources/resources.module';
import { SyncPlayerSearchOnRegisterHandler } from './app/handlers/sync-player-search-on-register.handler';
import { SyncPlayerSearchOnUpdateHandler } from './app/handlers/sync-player-search-on-update.handler';
import { TeamEntity } from '../teams/infra/entities/team.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserProfileEntity, UserGameEntity, TeamEntity]),
    AuthModule,
    ResourcesModule,
  ],
  controllers: [SearchController],
  providers: [
    TypesenseService,
    PlayerSearchIndexer,
    SearchPlayersQuery,
    SearchTeamsQuery,
    SyncPlayerSearchOnRegisterHandler,
    SyncPlayerSearchOnUpdateHandler,
  ],
})
export class SearchModule {}
