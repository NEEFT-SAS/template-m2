import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ConnectedGuard } from '@/contexts/auth/infra/guards/connected.guard';
import { OptionalAuthGuard } from '@/contexts/auth/infra/guards/optional-auth.guard';
import { FollowActionDto, FollowListQueryDto } from '@neeft-sas/shared';
import { FollowEntityUseCase } from '../../app/usecases/follow-entity.usecase';
import { UnfollowEntityUseCase } from '../../app/usecases/unfollow-entity.usecase';
import { GetFollowingUseCase } from '../../app/usecases/get-following.usecase';
import { GetFollowersUseCase } from '../../app/usecases/get-followers.usecase';
import { GetFollowStatusUseCase } from '../../app/usecases/get-follow-status.usecase';

type JwtUser = {
  pid?: string;
  slug?: string;
  roles?: string[];
};

type RequestWithUser = Request & { user?: JwtUser };

@Controller('players')
export class PlayerFollowController {
  constructor(
    private readonly followEntityUseCase: FollowEntityUseCase,
    private readonly unfollowEntityUseCase: UnfollowEntityUseCase,
    private readonly getFollowingUseCase: GetFollowingUseCase,
    private readonly getFollowersUseCase: GetFollowersUseCase,
    private readonly getFollowStatusUseCase: GetFollowStatusUseCase,
  ) {}

  @Post(':slug/follow')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ConnectedGuard)
  followPlayer(@Req() req: RequestWithUser, @Param('slug') slug: string, @Body() body: FollowActionDto) {
    const requesterProfileId = req.user?.pid ?? '';
    const requesterSlug = req.user?.slug;
    return this.followEntityUseCase.execute(requesterProfileId, requesterSlug, 'PLAYER', slug, body);
  }

  @Delete(':slug/follow')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard)
  unfollowPlayer(@Req() req: RequestWithUser, @Param('slug') slug: string, @Body() body: FollowActionDto) {
    const requesterProfileId = req.user?.pid ?? '';
    const requesterSlug = req.user?.slug;
    return this.unfollowEntityUseCase.execute(requesterProfileId, requesterSlug, 'PLAYER', slug, body);
  }

  @Get(':slug/following')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalAuthGuard)
  getPlayerFollowing(
    @Param('slug') slug: string,
    @Query() query: FollowListQueryDto,
    @Req() req: RequestWithUser,
  ) {
    return this.getFollowingUseCase.execute('PLAYER', slug, req.user?.pid, query);
  }

  @Get(':slug/followers')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalAuthGuard)
  getPlayerFollowers(
    @Param('slug') slug: string,
    @Query() query: FollowListQueryDto,
    @Req() req: RequestWithUser,
  ) {
    return this.getFollowersUseCase.execute('PLAYER', slug, req.user?.pid, query);
  }

  @Get(':slug/follow-status')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard)
  getPlayerFollowStatus(@Req() req: RequestWithUser, @Param('slug') slug: string) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.getFollowStatusUseCase.execute('PLAYER', slug, requesterProfileId);
  }
}
