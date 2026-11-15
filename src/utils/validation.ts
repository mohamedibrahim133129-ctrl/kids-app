import { AgeGroupId, Language } from '../types/nonoland';

export const POLICY_VERSION = '2026.1';

const COMPROMISED_PASSWORDS = new Set([
  '123456789012',
  '1234567890123',
  'password1234',
  'password123456',
  'qwertyuiop12',
  'admin1234567',
  'letmein12345',
  'welcome12345',
  'nonoland1234',
  'nonoland2026',
  '000000000000',
  '111111111111',
  'abcdefghijkl',
]);

// eslint-disable-next-line no-control-regex
const CONTROL_CHAR_REGEX = /[\u0000-\u001F\u007F]/;

export function normalizeEmail(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw.trim().toLowerCase();
}

export function validateEmail(raw: unknown): { ok: boolean; normalized: string; error?: string } {
  const normalized = normalizeEmail(raw);
  if (!normalized) {
    return { ok: false, normalized: '', error: 'Email is required' };
  }
  if (normalized.length > 254) {
    return { ok: false, normalized, error: 'Email must be 254 characters or fewer' };
  }
  if (CONTROL_CHAR_REGEX.test(normalized) || /\s/.test(normalized)) {
    return { ok: false, normalized, error: 'Email contains invalid characters or spaces' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(normalized)) {
    return { ok: false, normalized, error: 'Invalid email address format' };
  }
  return { ok: true, normalized };
}

export function validateParentName(raw: unknown): { ok: boolean; clean: string; error?: string } {
  if (typeof raw !== 'string') {
    return { ok: false, clean: '', error: 'Parent name is required' };
  }
  const clean = raw.trim().replace(/\s+/g, ' ');
  if (clean.length < 2) {
    return { ok: false, clean, error: 'Parent name must be at least 2 characters' };
  }
  if (clean.length > 80) {
    return { ok: false, clean, error: 'Parent name must be 80 characters or fewer' };
  }
  if (CONTROL_CHAR_REGEX.test(clean)) {
    return { ok: false, clean, error: 'Parent name contains invalid control characters' };
  }
  // Allow Arabic/Latin letters, combining marks, spaces, hyphens/dashes, apostrophes, dots
  const validNameRegex = /^[\p{L}\p{M}\s.'\p{Pd}]+$/u;
  if (!validNameRegex.test(clean)) {
    return { ok: false, clean, error: 'Parent name contains unsupported characters' };
  }
  return { ok: true, clean };
}

export function validatePassword(
  raw: unknown,
  email?: string,
  displayName?: string,
): {
  ok: boolean;
  strength: 'weak' | 'fair' | 'strong' | 'excellent';
  score: number;
  error?: string;
} {
  if (typeof raw !== 'string' || !raw) {
    return { ok: false, strength: 'weak', score: 0, error: 'Password is required' };
  }
  if (raw.length < 12) {
    return {
      ok: false,
      strength: 'weak',
      score: 1,
      error: 'Password must be at least 12 characters long',
    };
  }
  if (raw.length > 128) {
    return {
      ok: false,
      strength: 'weak',
      score: 1,
      error: 'Password must be 128 characters or fewer',
    };
  }
  const lower = raw.trim().toLowerCase();
  if (COMPROMISED_PASSWORDS.has(lower) || /^(.)\1+$/.test(raw)) {
    return {
      ok: false,
      strength: 'weak',
      score: 1,
      error: 'This password is too common or predictable. Choose a longer passphrase.',
    };
  }

  if (email) {
    const localPart = email.trim().toLowerCase().split('@')[0];
    if (localPart && localPart.length >= 3 && lower.includes(localPart)) {
      return {
        ok: false,
        strength: 'weak',
        score: 1,
        error: 'Password must not contain your email address.',
      };
    }
  }
  if (displayName) {
    const cleanName = displayName.trim().toLowerCase();
    if (cleanName && cleanName.length >= 3 && lower.includes(cleanName)) {
      return {
        ok: false,
        strength: 'weak',
        score: 1,
        error: 'Password must not contain your display name.',
      };
    }
  }

  let score = 2;
  if (raw.length >= 16) score += 1;
  if (/[a-z]/.test(raw) && /[A-Z]/.test(raw)) score += 1;
  if (/\d/.test(raw) || /[^A-Za-z0-9]/.test(raw) || /\s/.test(raw)) score += 1;

  const strength =
    score >= 5 ? 'excellent' : score >= 4 ? 'strong' : score >= 3 ? 'fair' : 'weak';

  return { ok: true, strength, score };
}

export function validateChildProfileInput(input: {
  displayName?: unknown;
  ageGroup?: unknown;
  language?: unknown;
  birthYear?: unknown;
  birthMonth?: unknown;
}): {
  ok: boolean;
  clean?: {
    displayName: string;
    ageGroup: AgeGroupId;
    language: Language;
    birthYear: number;
    birthMonth: number;
  };
  error?: string;
} {
  if (typeof input.displayName !== 'string') {
    return { ok: false, error: 'Child display name is required' };
  }
  const displayName = input.displayName.trim().replace(/\s+/g, ' ');
  if (displayName.length < 1 || displayName.length > 50) {
    return { ok: false, error: 'Child name must be between 1 and 50 characters' };
  }
  if (CONTROL_CHAR_REGEX.test(displayName) || /[<>]/.test(displayName)) {
    return { ok: false, error: 'Child name contains invalid characters' };
  }

  const validAges: AgeGroupId[] = ['3-4', '5-6', '7', '8'];
  if (!validAges.includes(input.ageGroup as AgeGroupId)) {
    return { ok: false, error: 'Invalid age group selection' };
  }

  const lang: Language = input.language === 'en' ? 'en' : 'ar';

  const nowYear = new Date().getFullYear();
  const birthYear = Number(input.birthYear ?? nowYear - 4);
  const birthMonth = Number(input.birthMonth ?? 1);
  if (
    !Number.isInteger(birthYear) ||
    birthYear < nowYear - 10 ||
    birthYear > nowYear - 2
  ) {
    return { ok: false, error: 'Invalid birth year for child ages 3–8' };
  }
  if (!Number.isInteger(birthMonth) || birthMonth < 1 || birthMonth > 12) {
    return { ok: false, error: 'Invalid birth month (1–12)' };
  }

  return {
    ok: true,
    clean: {
      displayName,
      ageGroup: input.ageGroup as AgeGroupId,
      language: lang,
      birthYear,
      birthMonth,
    },
  };
}

export function sanitizeShortText(raw: unknown, maxLen = 200): string {
  if (typeof raw !== 'string') return '';
  return raw.replace(CONTROL_CHAR_REGEX, '').trim().slice(0, maxLen);
}

export function isValidSafeUrl(raw: unknown): boolean {
  if (!raw) return true;
  if (typeof raw !== 'string') return false;
  try {
    const u = new URL(raw);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}
