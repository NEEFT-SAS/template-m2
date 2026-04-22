import type { InternalServerErrorEventPayload } from '../events/internal-server-error.event';

type InternalServerErrorReportTemplateInput = {
  payload: InternalServerErrorEventPayload;
};

export const internalServerErrorReportEmailTemplate = ({ payload }: InternalServerErrorReportTemplateInput) => {
  const report = stringifyWithCircularRefs(payload, 2);

  const subject = ` ${payload.code} - ${payload.request.method} ${payload.request.path}`;

  const text = [
    'Rapport interne d\'exception HTTP',
    '',
    'Un évènement d\'erreur serveur a été détecté.',
    '',
    report
  ].join('\n');

  const html = `
    <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f5f7fb; padding:24px; color:#0f172a;">
    </div>
  `;

  return {
    subject,
    text,
    html
  };
};

const stringifyWithCircularRefs = (value: unknown, spaces = 2) => {
  const seen = new WeakSet<object>();

  return JSON.stringify(
    value,
    (_key, currentValue) => {
      if (currentValue && typeof currentValue === 'object') {
        if (seen.has(currentValue)) {
          return '[Circular]';
        }

        seen.add(currentValue);
      }

      return currentValue;
    },
    spaces
  );
};
