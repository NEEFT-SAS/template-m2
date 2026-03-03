export const trimToUndefined = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

export const toUpperCaseTrimToUndefined = (value: unknown): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim().toUpperCase();
  return trimmed.length ? trimmed : undefined;
};

export const toDate = (value: unknown): unknown => {
  if (value === null || value === undefined || value === '') return value;
  if (value instanceof Date) return value;

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return value;
};

export const toStringArray = (value: unknown): unknown => {
  if (!Array.isArray(value)) return value;

  return value
    .map((item) => (typeof item === 'string' ? item.trim() : item))
    .filter((item) => !(typeof item === 'string' && item.length === 0));
};
