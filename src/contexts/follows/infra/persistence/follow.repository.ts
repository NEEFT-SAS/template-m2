import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { FollowEntity } from '../entities/follow.entity';
import {
  FollowGraphNode,
  FollowPageResult,
  FollowRepositoryPort,
} from '../../app/ports/follow.repository.port';
import { FollowEntityType } from '../../domain/types/follow.types';

@Injectable()
export class FollowRepositoryTypeorm implements FollowRepositoryPort {
  constructor(
    @InjectRepository(FollowEntity)
    private readonly followRepo: Repository<FollowEntity>,
  ) {}

  async createFollow(
    followerType: FollowEntityType,
    followerId: string,
    followedType: FollowEntityType,
    followedId: string,
  ): Promise<void> {
    const follow = this.followRepo.create({
      ...(followerType === 'PLAYER'
        ? { followerPlayer: { id: followerId } }
        : { followerTeam: { id: followerId } }),
      ...(followedType === 'PLAYER'
        ? { followedPlayer: { id: followedId } }
        : { followedTeam: { id: followedId } }),
    });

    await this.followRepo.save(follow);
  }

  async deleteFollow(
    followerType: FollowEntityType,
    followerId: string,
    followedType: FollowEntityType,
    followedId: string,
  ): Promise<boolean> {
    const follow = await this.followRepo.findOne({
      where: this.whereClause(followerType, followerId, followedType, followedId),
    });

    if (!follow) return false;

    await this.followRepo.remove(follow);
    return true;
  }

  async existsFollow(
    followerType: FollowEntityType,
    followerId: string,
    followedType: FollowEntityType,
    followedId: string,
  ): Promise<boolean> {
    const follow = await this.followRepo.findOne({
      where: this.whereClause(followerType, followerId, followedType, followedId),
      select: ['id'],
    });

    return !!follow;
  }

  async listFollowing(
    followerType: FollowEntityType,
    followerId: string,
    limit: number,
    offset: number,
  ): Promise<FollowPageResult> {
    const [follows, total] = await this.followRepo.findAndCount({
      where:
        followerType === 'PLAYER'
          ? { followerPlayer: { id: followerId } }
          : { followerTeam: { id: followerId } },
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
      relations: { followedPlayer: true, followedTeam: true },
    });

    return {
      items: follows
        .map((follow) => this.toFollowedNode(follow))
        .filter((item): item is FollowGraphNode => item !== null),
      total,
    };
  }

  async listFollowers(
    targetType: FollowEntityType,
    targetId: string,
    limit: number,
    offset: number,
  ): Promise<FollowPageResult> {
    const [follows, total] = await this.followRepo.findAndCount({
      where:
        targetType === 'PLAYER'
          ? { followedPlayer: { id: targetId } }
          : { followedTeam: { id: targetId } },
      take: limit,
      skip: offset,
      order: { createdAt: 'DESC' },
      relations: { followerPlayer: true, followerTeam: true },
    });

    return {
      items: follows
        .map((follow) => this.toFollowerNode(follow))
        .filter((item): item is FollowGraphNode => item !== null),
      total,
    };
  }

  async listTeamFollowerIdsFollowingTarget(
    teamIds: string[],
    targetType: FollowEntityType,
    targetId: string,
  ): Promise<string[]> {
    if (!teamIds.length) return [];

    const follows = await this.followRepo.find({
      where: {
        followerTeam: { id: In(teamIds) },
        ...(targetType === 'PLAYER'
          ? { followedPlayer: { id: targetId } }
          : { followedTeam: { id: targetId } }),
      },
      relations: { followerTeam: true },
    });

    return Array.from(new Set(follows.map((follow) => follow.followerTeam?.id).filter((id): id is string => Boolean(id))));
  }

  async countFollowers(targetType: FollowEntityType, targetId: string): Promise<number> {
    return this.followRepo.count({
      where:
        targetType === 'PLAYER'
          ? { followedPlayer: { id: targetId } }
          : { followedTeam: { id: targetId } },
    });
  }

  private whereClause(
    followerType: FollowEntityType,
    followerId: string,
    followedType: FollowEntityType,
    followedId: string,
  ) {
    return {
      ...(followerType === 'PLAYER'
        ? { followerPlayer: { id: followerId } }
        : { followerTeam: { id: followerId } }),
      ...(followedType === 'PLAYER'
        ? { followedPlayer: { id: followedId } }
        : { followedTeam: { id: followedId } }),
    };
  }

  private toFollowedNode(follow: FollowEntity): FollowGraphNode | null {
    if (follow.followedPlayer) {
      return {
        id: follow.followedPlayer.id,
        slug: follow.followedPlayer.slug,
        profilePicture: follow.followedPlayer.profilePicture ?? null,
        type: 'PLAYER',
      };
    }

    if (follow.followedTeam) {
      return {
        id: follow.followedTeam.id,
        slug: follow.followedTeam.slug,
        logoPicture: follow.followedTeam.logoPicture ?? null,
        type: 'TEAM',
      };
    }

    return null;
  }

  private toFollowerNode(follow: FollowEntity): FollowGraphNode | null {
    if (follow.followerPlayer) {
      return {
        id: follow.followerPlayer.id,
        slug: follow.followerPlayer.slug,
        profilePicture: follow.followerPlayer.profilePicture ?? null,
        type: 'PLAYER',
      };
    }

    if (follow.followerTeam) {
      return {
        id: follow.followerTeam.id,
        slug: follow.followerTeam.slug,
        logoPicture: follow.followerTeam.logoPicture ?? null,
        type: 'TEAM',
      };
    }

    return null;
  }
}
