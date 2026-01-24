import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const user = req.user as { roles?: string[] } | undefined;
    const roles = Array.isArray(user?.roles) ? user.roles : [];

    if (!roles.includes('admin')) {
      throw new ForbiddenException({ code: 'AUTH_FORBIDDEN', message: 'Access denied' });
    }

    return true;
  }
}
