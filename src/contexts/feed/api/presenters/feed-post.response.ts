import { Expose, Type } from 'class-transformer';

export class FeedPostMediaPresenter {
  @Expose() id!: string;
  @Expose() type!: string;
  @Expose() url!: string;
  @Expose() displayOrder!: number;
  @Expose() width?: number | null;
  @Expose() height?: number | null;
  @Expose() createdAt!: Date;
}

export class FeedPostAuthorPlayerPresenter {
  @Expose() id!: string;
  @Expose() slug!: string;
  @Expose() username!: string;
  @Expose() profilePicture?: string | null;
}

export class FeedPostAuthorTeamPresenter {
  @Expose() id!: string;
  @Expose() slug!: string;
  @Expose() name!: string;
  @Expose() acronym!: string;
  @Expose() logoPicture?: string | null;
}

export class FeedPostPresenter {
  @Expose() id!: string;
  @Expose() content!: string;
  @Expose() status!: string;
  @Expose() isFeatured!: boolean;
  @Expose() likesCount!: number;
  @Expose() commentsCount!: number;
  @Expose() viewsCount!: number;
  @Expose() engagementScore!: number;
  @Expose() isLikedByUser?: boolean;
  @Expose() gameId?: number | null;
  @Expose() publishedAt?: Date | null;
  @Expose() createdAt!: Date;
  @Expose() updatedAt!: Date;

  @Expose()
  @Type(() => FeedPostAuthorPlayerPresenter)
  authorPlayer?: FeedPostAuthorPlayerPresenter | null;

  @Expose()
  @Type(() => FeedPostAuthorTeamPresenter)
  authorTeam?: FeedPostAuthorTeamPresenter | null;

  @Expose()
  @Type(() => FeedPostMediaPresenter)
  medias!: FeedPostMediaPresenter[];
}
