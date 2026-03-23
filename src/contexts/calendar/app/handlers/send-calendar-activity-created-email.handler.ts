import { MAILER, MailerPort } from '@/core/mailer/mailer.port';
import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CALENDAR_ACTIVITY_CREATED_EVENT, CalendarActivityCreatedPayload } from '../../domain/events/calendar-activity-created.event';
import { calendarActivityCreatedEmailTemplate } from '../../mailer/templates/calendar-activity-created-email.template';

@Injectable()
export class SendCalendarActivityCreatedEmailHandler {
  constructor(
    @Inject(MAILER) private readonly mailer: MailerPort,
  ) {}

  @OnEvent(CALENDAR_ACTIVITY_CREATED_EVENT)
  async handle(payload: CalendarActivityCreatedPayload): Promise<void> {
    if (!payload.recipientEmails.length) return;

    const tpl = calendarActivityCreatedEmailTemplate({
      title: payload.title,
      type: payload.type,
      visibility: payload.visibility,
      startsAt: payload.startsAt,
      endsAt: payload.endsAt,
    });

    await Promise.allSettled(
      payload.recipientEmails.map((email) =>
        this.mailer.send({
          to: email,
          subject: tpl.subject,
          text: tpl.text,
          html: tpl.html,
        }),
      ),
    );
  }
}
