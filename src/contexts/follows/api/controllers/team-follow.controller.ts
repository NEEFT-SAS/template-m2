import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ConnectedGuard } from '@/contexts/auth/infra/guards/connected.guard';
import { OptionalAuthGuard } from '@/contexts/auth/infra/guards/optional-auth.guard';
import { FollowActionDto } from '../dtos/follow-action.dto';
import { FollowListQueryDto } from '../dtos/follow-list.query.dto';
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

@Controller('teams')
export class TeamFollowController {
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
  followTeam(@Req() req: RequestWithUser, @Param('slug') slug: string, @Body() body: FollowActionDto) {
    const requesterProfileId = req.user?.pid ?? '';
    const requesterSlug = req.user?.slug;
    return this.followEntityUseCase.execute(requesterProfileId, requesterSlug, 'TEAM', slug, body);
  }

  @Delete(':slug/follow')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard)
  unfollowTeam(@Req() req: RequestWithUser, @Param('slug') slug: string, @Body() body: FollowActionDto) {
    const requesterProfileId = req.user?.pid ?? '';
    const requesterSlug = req.user?.slug;
    return this.unfollowEntityUseCase.execute(requesterProfileId, requesterSlug, 'TEAM', slug, body);
  }

  @Get(':slug/following')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalAuthGuard)
  getTeamFollowing(
    @Param('slug') slug: string,
    @Query() query: FollowListQueryDto,
    @Req() req: RequestWithUser,
  ) {
    return this.getFollowingUseCase.execute('TEAM', slug, req.user?.pid, query);
  }

  @Get(':slug/followers')
  @HttpCode(HttpStatus.OK)
  @UseGuards(OptionalAuthGuard)
  getTeamFollowers(
    @Param('slug') slug: string,
    @Query() query: FollowListQueryDto,
    @Req() req: RequestWithUser,
  ) {
    return this.getFollowersUseCase.execute('TEAM', slug, req.user?.pid, query);
  }

  @Get(':slug/follow-status')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ConnectedGuard)
  getTeamFollowStatus(@Req() req: RequestWithUser, @Param('slug') slug: string) {
    const requesterProfileId = req.user?.pid ?? '';
    return this.getFollowStatusUseCase.execute('TEAM', slug, requesterProfileId);
  }
}
