export const registeredUserEmailTemplate = (input: { username: string }) => {
  const subject = 'Confirme ton email';

  const text = `Salut ${input.username},

Confirme ton email ici:
`;

  const html = `
  <div style="font-family: Arial, sans-serif; line-height: 1.5;">
    
  </div>
  `;

  return { subject, text, html };
};
