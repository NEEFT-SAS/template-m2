import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from './infra/entities/post.entity';
import { PostLikeEntity } from './infra/entities/post-like.entity';
import { PostCommentEntity } from './infra/entities/post-comment.entity';
import { PostMediaEntity } from './infra/entities/post-media.entity';
import { UserProfileEntity } from '@/contexts/auth/infra/persistence/entities/user-profile.entity';
import { TeamEntity } from '@/contexts/teams/infra/entities/team.entity';
import { FollowEntity } from '@/contexts/follows/infra/entities/follow.entity';
import { FeedController } from './api/feed.controller';
import { FeedRepositoryTypeorm } from './infra/persistence/repositories/feed.repository';
import { FEED_REPOSITORY } from './app/ports/feed.repository.port';
import { GetFeedUseCase } from './app/usecases/get-feed.usecase';
import { CreatePostUseCase, GetPostUseCase, UpdatePostUseCase, DeletePostUseCase } from './app/usecases/create-post.usecases';
import { TogglePostLikeUseCase, GetLikeStatusUseCase, CreateCommentUseCase, GetPostCommentsUseCase, DeleteCommentUseCase } from './app/usecases/post-interactions.usecases';
import { GetAuthorPostsUseCase } from './app/usecases/get-author-posts.usecase';
import { AuthModule } from '../auth/auth.module';
import { PlayerModule } from '../players/player.module';
import { TeamsModule } from '../teams/teams.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PostEntity,
      PostLikeEntity,
      PostCommentEntity,
      PostMediaEntity,
      UserProfileEntity,
      TeamEntity,
      FollowEntity,
    ]),
    AuthModule,
    PlayerModule,
    TeamsModule
  ],
  controllers: [FeedController],
  providers: [
    GetFeedUseCase,
    CreatePostUseCase,
    GetPostUseCase,
    UpdatePostUseCase,
    DeletePostUseCase,
    TogglePostLikeUseCase,
    GetLikeStatusUseCase,
    CreateCommentUseCase,
    GetPostCommentsUseCase,
    DeleteCommentUseCase,
    GetAuthorPostsUseCase,
    { provide: FEED_REPOSITORY, useClass: FeedRepositoryTypeorm },
  ],
  exports: [FEED_REPOSITORY],
})
export class FeedModule {}
