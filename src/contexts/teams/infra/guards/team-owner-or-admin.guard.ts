/***************************
 *
 * Guard: team owner or admin
 *
 ***************************/

import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { TEAM_REPOSITORY, TeamRepositoryPort } from '../../app/ports/team.repository.port';
import { TeamForbiddenError, TeamNotFoundError } from '../../domain/errors/team.errors';

@Injectable()
export class TeamOwnerOrAdminGuard implements CanActivate {
  constructor(
    @Inject(TEAM_REPOSITORY) private readonly repo: TeamRepositoryPort,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user as { pid?: string; roles?: string[] } | undefined;

    if (!user) {
      throw new ForbiddenException({ code: 'AUTH_FORBIDDEN', message: 'Access denied' });
    }

    const roles = Array.isArray(user.roles) ? user.roles : [];
    if (roles.includes('admin')) return true;

    const teamId = req?.params?.teamId;
    if (!teamId) {
      throw new ForbiddenException({ code: 'AUTH_FORBIDDEN', message: 'Access denied' });
    }

    const team = await this.repo.findTeamById(teamId);
    if (!team) {
      throw new TeamNotFoundError(teamId);
    }

    const isOwner = user.pid && team.owner?.id === user.pid;
    if (!isOwner) {
      throw new TeamForbiddenError(teamId);
    }

    return true;
  }
}
