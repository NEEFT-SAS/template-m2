export const CALENDAR_ACTIVITY_TYPES = ['SCRIM', 'TRAINING', 'REVIEW', 'MATCH', 'OTHER'] as const;
export type CalendarActivityType = (typeof CALENDAR_ACTIVITY_TYPES)[number];

export const CALENDAR_ACTIVITY_CATEGORIES = ['EVENT', 'NON_EVENT'] as const;
export type CalendarActivityCategory = (typeof CALENDAR_ACTIVITY_CATEGORIES)[number];

export const CALENDAR_ACTIVITY_VISIBILITIES = ['PUBLIC', 'PRIVATE'] as const;
export type CalendarActivityVisibility = (typeof CALENDAR_ACTIVITY_VISIBILITIES)[number];

export const CALENDAR_ACTIVITY_STATUSES = ['DRAFT', 'PROPOSED', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const;
export type CalendarActivityStatus = (typeof CALENDAR_ACTIVITY_STATUSES)[number];

export const CALENDAR_ASSIGNMENT_STATUSES = ['PENDING', 'ACCEPTED', 'DECLINED'] as const;
export type CalendarAssignmentStatus = (typeof CALENDAR_ASSIGNMENT_STATUSES)[number];

export const CALENDAR_ASSIGNMENT_TARGET_TYPES = ['PLAYER', 'TEAM'] as const;
export type CalendarAssignmentTargetType = (typeof CALENDAR_ASSIGNMENT_TARGET_TYPES)[number];

