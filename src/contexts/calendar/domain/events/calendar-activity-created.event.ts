import { CalendarActivityType, CalendarActivityVisibility } from '../types/calendar.types';

export const CALENDAR_ACTIVITY_CREATED_EVENT = 'calendar.activity.created';

export type CalendarActivityCreatedPayload = {
  activityId: string;
  teamId: string;
  title: string;
  type: CalendarActivityType;
  visibility: CalendarActivityVisibility;
  startsAt: Date;
  endsAt: Date;
  recipientEmails: string[];
};

export class CalendarActivityCreatedEvent {
  static eventName = CALENDAR_ACTIVITY_CREATED_EVENT;

  static create(payload: CalendarActivityCreatedPayload) {
    return {
      name: CalendarActivityCreatedEvent.eventName,
      payload,
    };
  }
}
