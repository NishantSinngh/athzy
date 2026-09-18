export function formatMoney(minor: number, currency = 'INR') {
  return new Intl.NumberFormat(currency === 'INR' ? 'en-IN' : 'en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format((minor || 0) / 100);
}

export function formatDateTime(value: string | Date, timeZone?: string) {
  return new Date(value).toLocaleString('en-IN', {
    ...(timeZone ? { timeZone } : {}),
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatTime(value: string | Date, timeZone?: string) {
  return new Date(value).toLocaleTimeString('en-IN', { ...(timeZone ? { timeZone } : {}), hour: '2-digit', minute: '2-digit' });
}

export function formatLocalDate(value: string, options: Intl.DateTimeFormatOptions = {}) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-IN', { timeZone: 'UTC', ...options });
}

/** "Good morning" / "Good afternoon" / "Good evening" for the home greeting. */
export function greetingFor(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/** Compact day chip: "SAT, 24 JUN". */
export function formatDayBadge(value: string | Date, timeZone?: string) {
  return new Date(value)
    .toLocaleDateString('en-IN', {
      ...(timeZone ? { timeZone } : {}),
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })
    .toUpperCase();
}

/**
 * Human countdown to an event: "Starts in 2h", "Tomorrow", "In 3 days".
 * Returns null once the event is more than a week out, where a date is clearer.
 */
export function formatCountdown(value: string | Date) {
  const target = new Date(value).getTime();
  const diff = target - Date.now();
  if (diff <= 0) return null;

  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `Starts in ${Math.max(1, minutes)}m`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Starts in ${hours}h`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'Tomorrow';
  if (days <= 7) return `In ${days} days`;
  return null;
}

/** True while an event is underway — within `windowMinutes` after it began. */
/**
 * Whether something is happening right now.
 *
 * Prefers real data over guessing, in this order:
 *   1. `endsAt` from the API — the actual scheduled window.
 *   2. A 3h fallback window, only when the organiser left `endsAt` empty.
 *
 * Call `isListingLive` instead when you have a whole event/tournament object:
 * a tournament's own status beats any date arithmetic.
 */
export function isLiveNow(startsAt: string | Date, endsAt?: string | Date | null, fallbackWindowMinutes = 180) {
  const start = new Date(startsAt).getTime();
  if (Number.isNaN(start)) return false;

  const now = Date.now();
  if (now < start) return false;

  const end = endsAt ? new Date(endsAt).getTime() : NaN;
  return Number.isNaN(end) ? now <= start + fallbackWindowMinutes * 60000 : now <= end;
}

/**
 * Live check for an event, tournament or booking object.
 *
 * A tournament carries an authoritative `status` set by the organiser, so
 * IN_PROGRESS means live and COMPLETED/CANCELLED mean it is not, whatever the
 * clock says. Everything else falls through to the scheduled window.
 */
export function isListingLive(item: any): boolean {
  if (!item) return false;

  const status = item.tournament?.status ?? (item.kind === 'TOURNAMENT' ? item.event?.tournament?.status : undefined);
  if (status === 'IN_PROGRESS') return true;
  if (status === 'COMPLETED' || status === 'CANCELLED') return false;

  const entryStatus = String(item.status ?? '').toUpperCase();
  if (entryStatus === 'CANCELLED' || entryStatus === 'WITHDRAWN') return false;

  const startsAt = item.startsAt ?? item.event?.startsAt;
  if (!startsAt) return false;

  return isLiveNow(startsAt, item.endsAt ?? item.event?.endsAt);
}

/** Relative timestamp for feeds and notifications: "4h ago", "2d ago". */
export function formatRelative(value: string | Date) {
  const elapsed = Date.now() - new Date(value).getTime();
  if (elapsed < 60000) return 'Just now';

  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/**
 * Client-side mirrors of the server's Zod rules.
 *
 * The API is the authority, but re-checking here means the user is told about a
 * malformed email while the field is still in front of them, rather than after
 * they have filled a whole form and pressed Confirm on the summary screen.
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmail(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}

/** Server requires 7–30 characters; digits, spaces and +()- are all accepted. */
export function isValidPhone(value: string) {
  const trimmed = value.trim();
  return trimmed.length >= 7 && trimmed.length <= 30 && /\d/.test(trimmed);
}
