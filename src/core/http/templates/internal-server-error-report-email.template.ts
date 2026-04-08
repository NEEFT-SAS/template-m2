import type { InternalServerErrorEventPayload } from '../events/internal-server-error.event';

type InternalServerErrorReportTemplateInput = {
  payload: InternalServerErrorEventPayload;
};

export const internalServerErrorReportEmailTemplate = ({ payload }: InternalServerErrorReportTemplateInput) => {
  const report = stringifyWithCircularRefs(payload, 2);

  const subject = `[NEEFT][ALERT] ${payload.code} - ${payload.request.method} ${payload.request.path}`;

  const text = [
    'NEEFT - Rapport interne d\'exception HTTP',
    '',
    'Un évènement d\'erreur serveur a été détecté.',
    '',
    report
  ].join('\n');

  const html = `
    <div style="font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f5f7fb; padding:24px; color:#0f172a;">
      <div style="max-width:980px; margin:0 auto; background:#ffffff; border:1px solid #e2e8f0; border-radius:12px; overflow:hidden; box-shadow:0 12px 30px rgba(15,23,42,0.08);">
        <div style="padding:20px 24px; background:linear-gradient(135deg,#0f172a,#1e293b); color:#ffffff;">
          <p style="margin:0; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; opacity:0.85;">Internal Incident Report</p>
          <h1 style="margin:8px 0 0; font-size:20px; line-height:1.3;">${payload.code} · ${payload.request.method} ${payload.request.path}</h1>
          <p style="margin:10px 0 0; font-size:13px; opacity:0.9;">Timestamp UTC: ${payload.timestamp.toUTCString()}</p>
        </div>

        <div style="padding:20px 24px;">
          <p style="margin:0 0 14px; font-size:14px; color:#334155;">Ce message est destiné aux équipes internes NEEFT. Vous trouverez ci-dessous le rapport JSON complet pour investigation.</p>

          <div style="border:1px solid #e2e8f0; border-radius:10px; background:#0b1220; padding:16px; overflow:auto;">
            <pre style="margin:0; white-space:pre-wrap; word-break:break-word; font-size:12px; line-height:1.55; color:#dbeafe; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;">${report
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')}</pre>
          </div>
        </div>
      </div>
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
