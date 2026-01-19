export const registeredUserEmailTemplate = (input: { username: string }) => {
  const subject = 'Confirme ton email - NEEFT';

  const text = `Salut ${input.username},

Confirme ton email ici:

NEEFT`;

  const html = `
  <div style="font-family: Arial, sans-serif; line-height: 1.5;">
    <h2 style="margin:0 0 12px 0;">Confirme ton email</h2>

    <p style="margin:0 0 12px 0;">
      Salut <b>${input.username}</b>,
    </p>

    <p style="margin:0 0 16px 0;">
      Clique sur le bouton pour confirmer l'email :
    </p>

    <p style="margin:0 0 18px 0;">
      <a href="" style="display:inline-block;padding:10px 14px;background:#000;color:#fff;text-decoration:none;border-radius:8px;">
        Confirmer mon email
      </a>
    </p>

    <p style="margin:0;color:#666;font-size:12px;">
      Si ce compte n'a pas été créé, ignorer ce message.
    </p>
  </div>
  `;

  return { subject, text, html };
};
