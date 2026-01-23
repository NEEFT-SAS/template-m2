import { DomainError } from "@/core/errors/domain-error";

export class PlayerAvailabilityDuplicateError extends DomainError {
  constructor(slug: string, duplicates: { weekday: string; slot: string }[]) {
    super({
      code: 'PLAYER_AVAILABILITY_DUPLICATE',
      message: 'Duplicate availability entries found',
      statusCode: 400,
      fields: { availabilities: ['duplicate_entry'] },
      details: { slug, duplicates },
    });
  }
}
