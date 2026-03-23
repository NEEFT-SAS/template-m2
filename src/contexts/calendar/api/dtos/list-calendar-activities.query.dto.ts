import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional } from 'class-validator';

const CALENDAR_VISIBILITY_QUERY = ['PUBLIC', 'ALL'] as const;
type CalendarVisibilityQuery = (typeof CALENDAR_VISIBILITY_QUERY)[number];

export class ListCalendarActivitiesQueryDTO {
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;

  @IsOptional()
  @IsEnum(CALENDAR_VISIBILITY_QUERY)
  visibility?: CalendarVisibilityQuery;
}
