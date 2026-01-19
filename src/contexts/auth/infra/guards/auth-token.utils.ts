export const extractBearerToken = (req: any): string | null => {
  const header = req?.headers?.authorization;
  if (!header || typeof header !== 'string') return null;

  const [type, token] = header.split(' ');
  if (type !== 'Bearer') return null;
  if (!token) return null;

  return token;
};