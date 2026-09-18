export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_]{3,29}$/;

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export const USERNAME_REQUIREMENT = 'Use 4-30 lowercase letters, numbers, or underscores.';
