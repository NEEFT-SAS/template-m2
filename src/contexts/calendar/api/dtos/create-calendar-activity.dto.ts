import { Type } from 'class-transformer';
import { ArrayMaxSize, ArrayUnique, IsArray, IsDate, IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength, ValidateNested } from 'class-validator';
import {
  CALENDAR_ASSIGNMENT_STATUSES,
  CALENDAR_ACTIVITY_CATEGORIES,
  CALENDAR_ACTIVITY_TYPES,
  CALENDAR_ACTIVITY_VISIBILITIES,
  CalendarAssignmentStatus,
  CalendarActivityCategory,
  CalendarActivityType,
  CalendarActivityVisibility,
} from '../../domain/types/calendar.types';

export class CreateCalendarTeamAssignmentDTO {
  @IsOptional()
  @IsUUID('4')
  teamId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  teamName?: string;

  @IsOptional()
  @IsEnum(CALENDAR_ASSIGNMENT_STATUSES)
  status?: CalendarAssignmentStatus;

  @IsOptional()
  @IsUUID('4')
  selectedScrimmerProfileId?: string;
}

export class CreateCalendarActivityDTO {
  @IsString()
  @MinLength(3)
  @MaxLength(140)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsEnum(CALENDAR_ACTIVITY_TYPES)
  type!: CalendarActivityType;

  @IsOptional()
  @IsEnum(CALENDAR_ACTIVITY_CATEGORIES)
  category?: CalendarActivityCategory;

  @IsOptional()
  @IsEnum(CALENDAR_ACTIVITY_VISIBILITIES)
  visibility?: CalendarActivityVisibility;

  @Type(() => Date)
  @IsDate()
  startsAt!: Date;

  @Type(() => Date)
  @IsDate()
  endsAt!: Date;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(200)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  assignedProfileIds?: string[];

  @IsOptional()
  @IsEnum(CALENDAR_ASSIGNMENT_STATUSES)
  assignedProfilesStatus?: CalendarAssignmentStatus;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CreateCalendarTeamAssignmentDTO)
  assignedTeams?: CreateCalendarTeamAssignmentDTO[];
}
