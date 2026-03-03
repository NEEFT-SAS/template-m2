import { Expose, Type } from 'class-transformer';

export class FeedPostCommentAuthorPresenter {
  @Expose() id!: string;
  @Expose() slug!: string;
  @Expose() username!: string;
  @Expose() profilePicture?: string | null;
}

export class FeedPostCommentPresenter {
  @Expose() id!: string;
  @Expose() content!: string;
  @Expose() likesCount!: number;
  @Expose() createdAt!: Date;
  @Expose() updatedAt!: Date;

  @Expose()
  @Type(() => FeedPostCommentAuthorPresenter)
  author!: FeedPostCommentAuthorPresenter;
}
