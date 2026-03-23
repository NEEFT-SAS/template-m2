import { CalendarActivityType, CalendarActivityVisibility } from '../../domain/types/calendar.types';

export const calendarActivityCreatedEmailTemplate = (input: {
  title: string;
  type: CalendarActivityType;
  visibility: CalendarActivityVisibility;
  startsAt: Date;
  endsAt: Date;
}) => {
  const subject = `New team activity: ${input.title}`;
  const start = input.startsAt.toISOString();
  const end = input.endsAt.toISOString();
  const text = `A new ${input.type.toLowerCase()} activity has been created.\n\nTitle: ${input.title}\nVisibility: ${input.visibility}\nStart: ${start}\nEnd: ${end}\n`;
  const html = `
    <h2>New team activity</h2>
    <p><strong>Title:</strong> ${input.title}</p>
    <p><strong>Type:</strong> ${input.type}</p>
    <p><strong>Visibility:</strong> ${input.visibility}</p>
    <p><strong>Start:</strong> ${start}</p>
    <p><strong>End:</strong> ${end}</p>
  `;

  return { subject, text, html };
};
