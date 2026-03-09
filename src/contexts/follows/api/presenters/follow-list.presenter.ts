import { Expose, Type } from 'class-transformer';
import { FollowEntityType } from '../../domain/types/follow.types';

export class FollowListItemPresenter {
  @Expose()
  id!: string;

  @Expose()
  slug!: string;

  @Expose()
  type!: FollowEntityType;

  @Expose()
  profilePicture?: string | null;

  @Expose()
  logoPicture?: string | null;
}

export class FollowListPresenter {
  @Expose()
  @Type(() => FollowListItemPresenter)
  items!: FollowListItemPresenter[];

  @Expose()
  total!: number;

  @Expose()
  limit!: number;

  @Expose()
  offset!: number;
}
