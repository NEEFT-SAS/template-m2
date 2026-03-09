import { Expose, Type } from 'class-transformer';

export class FollowTeamStatusPresenter {
  @Expose()
  teamSlug!: string;
}

export class FollowStatusPresenter {
  @Expose()
  isFollowingAsPlayer!: boolean;

  @Expose()
  isFriend!: boolean;

  @Expose()
  @Type(() => FollowTeamStatusPresenter)
  followingAsTeams!: FollowTeamStatusPresenter[];

  @Expose()
  followersCount!: number;
}
