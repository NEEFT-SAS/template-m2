/***************************
 *
 * Guard: player owner or admin
 *
 ***************************/

import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { PlayerIsNotOwnerError } from '../../domain/errors/player-profile.errors';
import { toLowerCase } from '@neeft-sas/shared';

@Injectable()
export class PlayerOwnerOrAdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user as { slug: string; roles?: string[] } | undefined;
    
    if (!user) {
      throw new ForbiddenException({ code: 'AUTH_FORBIDDEN', message: 'Access denied' });
    }

    const roles = Array.isArray(user.roles) ? user.roles : [];
    if (roles.includes('admin')) return true;

    const targetProfileSlug = req?.params?.slug;
    if (!targetProfileSlug) {
      throw new ForbiddenException({ code: 'AUTH_FORBIDDEN', message: 'Access denied' });
    }

    const isOwner = toLowerCase(user.slug) === toLowerCase(targetProfileSlug);
    if (!isOwner) {
      throw new PlayerIsNotOwnerError();
    }

    return true;
  }
}
