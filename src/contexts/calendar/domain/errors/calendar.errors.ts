import { DomainError } from '@/core/errors/domain-error';

export class CalendarForbiddenError extends DomainError {
  constructor(teamId: string) {
    super({
      code: 'CALENDAR_FORBIDDEN',
      message: 'Access denied',
      statusCode: 403,
      fields: { teamId: ['forbidden'] },
      details: { teamId },
    });
  }
}

export class CalendarTeamNotFoundError extends DomainError {
  constructor(teamId: string) {
    super({
      code: 'CALENDAR_TEAM_NOT_FOUND',
      message: 'Team not found',
      statusCode: 404,
      fields: { teamId: ['not_found'] },
      details: { teamId },
    });
  }
}
