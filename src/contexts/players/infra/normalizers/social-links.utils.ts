import { RscSocialPlatformTypeEnum } from "@neeft-sas/shared";

export type SocialPlatformForNormalize = {
  type: RscSocialPlatformTypeEnum;
  baseUrl?: string | null;
};

export type NormalizedSocialValue = {
  username: string;
  url: string;
};

export function normalizeSocialValue(platform: SocialPlatformForNormalize, raw: string): NormalizedSocialValue | null {
  const input = (raw ?? '').trim();
  if (!input) return null;

  const looksLikeUrl = input.startsWith('http://') || input.startsWith('https://');

  // 1) User pasted a URL
  if (looksLikeUrl) {
    const safe = safeUrl(input);
    if (!safe) return null;

    const username = extractUsernameFromUrl(safe) ?? extractHostname(safe) ?? 'link';

    // If platform expects URL -> keep it as-is
    if (platform.type === RscSocialPlatformTypeEnum.URL) {
      return { username, url: safe };
    }

    // If platform expects username -> rebuild clean URL
    if (!platform.baseUrl) {
      return { username, url: safe };
    }

    return { username, url: `${platform.baseUrl}${encodeURIComponent(username)}` };
  }

  // 2) User pasted a username (or @handle)
  const username = cleanUsername(input);
  if (!username) return null;

  // If platform expects username/handle -> build url with baseUrl
  if (platform.type === RscSocialPlatformTypeEnum.USERNAME || platform.type === RscSocialPlatformTypeEnum.HANDLE) {
    if (!platform.baseUrl) {
      return { username, url: username };
    }

    return { username, url: `${platform.baseUrl}${encodeURIComponent(username)}` };
  }

  // 3) Platform expects URL but user typed username -> best effort
  if (platform.baseUrl) {
    return { username, url: `${platform.baseUrl}${encodeURIComponent(username)}` };
  }

  // fallback: make it a valid clickable url
  return { username, url: `https://${encodeURIComponent(username)}` };
}

function cleanUsername(value: string): string | null {
  let v = (value ?? '').trim();
  if (!v) return null;

  v = v.replace(/^@/, '').trim();
  if (!v) return null;

  return v;
}

function safeUrl(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl);
    if (!u.hostname) return null;
    return u.toString();
  } catch {
    return null;
  }
}

function extractUsernameFromUrl(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl);

    const parts = u.pathname.split('/').filter(Boolean);
    const last = parts.at(-1) ?? '';

    const cleaned = last.replace(/^@/, '').trim();
    return cleaned || null;
  } catch {
    return null;
  }
}

function extractHostname(rawUrl: string): string | null {
  try {
    const u = new URL(rawUrl);
    return u.hostname.replace(/^www\./, '') || null;
  } catch {
    return null;
  }
}
