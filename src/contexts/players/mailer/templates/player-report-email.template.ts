export type PlayerReportEmailInput = {
  reportId: string;
  reporterSlug: string;
  targetSlug: string;
  reason: string;
  details: string;
  createdAt: Date;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDate = (value: Date) => {
  if (!value) return 'unknown';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? 'unknown' : date.toISOString();
};

export const playerReportEmailTemplate = (input: PlayerReportEmailInput) => {
  const createdAt = formatDate(input.createdAt);
  const details = escapeHtml(input.details ?? '');

  const subject = 'Nouveau report joueur - NEEFT';

  const text = `Nouveau report joueur

Report ID: ${input.reportId}
Reporter: ${input.reporterSlug}
Target: ${input.targetSlug}
Reason: ${input.reason}
Date: ${createdAt}

Details:
${input.details ?? ''}`.trim();

  const html = `
  <div style="font-family: Arial, sans-serif; line-height: 1.5;">
    <h2 style="margin:0 0 12px 0;">Nouveau report joueur</h2>
    <p style="margin:0 0 6px 0;"><b>Report ID:</b> ${escapeHtml(input.reportId)}</p>
    <p style="margin:0 0 6px 0;"><b>Reporter:</b> ${escapeHtml(input.reporterSlug)}</p>
    <p style="margin:0 0 6px 0;"><b>Target:</b> ${escapeHtml(input.targetSlug)}</p>
    <p style="margin:0 0 6px 0;"><b>Reason:</b> ${escapeHtml(input.reason)}</p>
    <p style="margin:0 0 12px 0;"><b>Date:</b> ${escapeHtml(createdAt)}</p>
    <p style="margin:0 0 6px 0;"><b>Details:</b></p>
    <pre style="margin:0;padding:10px;background:#f6f6f6;border-radius:6px;white-space:pre-wrap;">${details}</pre>
  </div>
  `;

  return { subject, text, html };
};
