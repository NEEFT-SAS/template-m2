export const extractBearerToken = (req: any): string | null => {
  const header = req?.headers?.authorization;
  if (!header || typeof header !== 'string') return null;

  const [type, ...chunks] = header.trim().split(' ');
  if (!type || !/^bearer$/i.test(type)) return null;

  const token = chunks.join(' ').trim();
  if (!token) return null;

  return token;
};
