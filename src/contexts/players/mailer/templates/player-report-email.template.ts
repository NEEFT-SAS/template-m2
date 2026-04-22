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

  </div>
  `;

  return { subject, text, html };
};
