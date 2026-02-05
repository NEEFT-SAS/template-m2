export type PlayerRecommendationReceivedEmailInput = {
  recipientUsername: string;
  recipientSlug: string;
  authorDisplayName: string;
  authorSlug: string;
  content: string;
  createdAt: Date;
  profileUrl?: string;
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatDate = (value: Date) => {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? 'unknown' : date.toISOString();
};

const truncate = (value: string, max = 200) => {
  if (!value) return '';
  if (value.length <= max) return value;
  return `${value.slice(0, Math.max(0, max - 1)).trim()}…`;
};

export const playerRecommendationReceivedEmailTemplate = (
  input: PlayerRecommendationReceivedEmailInput
) => {
  const createdAt = formatDate(input.createdAt);
  const contentTruncated = escapeHtml(truncate(input.content ?? '', 220));
  const recipientUsername = escapeHtml(input.recipientUsername);
  const authorDisplayName = escapeHtml(input.authorDisplayName);
  const authorSlug = escapeHtml(input.authorSlug);
  const profileUrl = input.profileUrl ? escapeHtml(input.profileUrl) : undefined;

  const appBaseUrl = input.profileUrl
    ? input.profileUrl.split('/players/')[0]
    : 'https://neeft.fr';

  const logoUrl = `${appBaseUrl.replace(/\/$/, '')}/assets/logo-neeft.png`;

  const subject = 'Nouvelle recommandation recue sur NEEFT';

  const text = `Bonjour ${input.recipientUsername},

Vous avez recu une nouvelle recommandation.

Auteur: ${input.authorDisplayName} (@${input.authorSlug})

Message:
${truncate(input.content ?? '', 220)}

Date: ${createdAt}
${input.profileUrl ? `Voir le profil: ${input.profileUrl}` : 'Voir le profil: https://neeft.fr'}`.trim();

  const html = `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;700&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
    </style>
  </head>
  <body bgcolor="#070709" style="margin:0;padding:0;background:#070709 !important;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           bgcolor="#070709" style="background:#070709;">
      <tr>
        <td align="center" bgcolor="#070709" style="background:#070709;padding:32px 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                 bgcolor="#141527"
                 style="max-width:680px;background:#141527;border:1px solid #262539;border-radius:20px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.45);">
            <tr>
              <td bgcolor="#0f101e" style="padding:22px 24px;background:#0f101e;border-bottom:1px solid #262539;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="vertical-align:middle;">
                      <img src="${escapeHtml(logoUrl)}" alt="NEEFT" height="28" style="display:block;border:0;outline:none;text-decoration:none;">
                    </td>
                    <td style="vertical-align:middle;text-align:right;color:#a3a3bf;font-size:11px;letter-spacing:.28em;text-transform:uppercase;font-family:'Lexend','Plus Jakarta Sans',Arial,sans-serif;">
                      Recommendation
                    </td>
                  </tr>
                </table>
                <h1 style="margin:16px 0 6px 0;font-size:24px;line-height:1.3;color:#f6f6fb;font-family:'Lexend','Plus Jakarta Sans',Arial,sans-serif;">
                  Nouvelle recommandation recue
                </h1>
                <p style="margin:0;color:#a3a3bf;font-size:14px;font-family:'Plus Jakarta Sans','Lexend',Arial,sans-serif;">
                  Bonjour <span style="color:#f6f6fb;font-weight:600;">${recipientUsername}</span>, tu as recu un nouveau feedback.
                </p>
              </td>
            </tr>

            <tr>
              <td bgcolor="#141527" style="padding:20px 24px 6px 24px;">
                <div style="border:1px solid #262539;background:#0f101e;border-radius:14px;padding:16px;">
                  <div style="margin-bottom:6px;font-family:'Lexend','Plus Jakarta Sans',Arial,sans-serif;color:#f6f6fb;font-size:15px;font-weight:700;">
                    ${authorDisplayName}
                    <span style="display:inline-block;margin-left:6px;padding:2px 8px;border-radius:999px;background:#262539;color:#a3a3bf;font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;">
                      @${authorSlug}
                    </span>
                  </div>
                  <div style="color:#8685af;font-size:12px;font-family:'Plus Jakarta Sans','Lexend',Arial,sans-serif;">
                    ${escapeHtml(createdAt)}
                  </div>
                </div>
              </td>
            </tr>

            <tr>
              <td bgcolor="#141527" style="padding:10px 24px 0 24px;">
                <div style="color:#a3a3bf;font-size:11px;letter-spacing:.28em;text-transform:uppercase;font-family:'Lexend','Plus Jakarta Sans',Arial,sans-serif;margin-bottom:8px;">
                  Message
                </div>
                <div style="background:#141527;border:1px dashed #262539;border-radius:14px;padding:16px;color:#f6f6fb;font-size:14px;font-family:'Plus Jakarta Sans','Lexend',Arial,sans-serif;white-space:pre-wrap;">
                  ${contentTruncated}
                </div>
                <div style="margin-top:8px;color:#8685af;font-size:12px;font-family:'Plus Jakarta Sans','Lexend',Arial,sans-serif;">
                  Message tronque. Consulte la recommandation complete sur NEEFT.
                </div>
              </td>
            </tr>

            <tr>
              <td bgcolor="#141527" style="padding:18px 24px 24px 24px;">
                <a href="${profileUrl ?? 'https://neeft.fr'}"
                   style="display:inline-block;background:#f43f6b;background-image:linear-gradient(265deg,#FF8A00 5%,#D92645 50%,#93006C 95%);color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:12px;font-size:14px;font-weight:700;letter-spacing:.06em;font-family:'Lexend','Plus Jakarta Sans',Arial,sans-serif;">
                  Voir sur NEEFT
                </a>
              </td>
            </tr>
          </table>

          <div style="margin-top:14px;color:#8685af;font-size:12px;font-family:'Plus Jakarta Sans','Lexend',Arial,sans-serif;text-align:center;">
            Cet email a ete envoye automatiquement par NEEFT.
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();

  return { subject, text, html };
};
