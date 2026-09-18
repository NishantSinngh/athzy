import { Platform } from 'react-native';
import * as Calendar from 'expo-calendar';

interface CalendarEventInput {
  title: string;
  startsAt: string | Date;
  /** Falls back to a two-hour block when the organiser left the end open. */
  endsAt?: string | Date | null;
  location?: string | null;
  notes?: string | null;
  timeZone?: string | null;
}

export type AddToCalendarResult =
  | { ok: true; calendarName?: string }
  | { ok: false; reason: 'denied' | 'no-calendar' | 'failed'; message: string };

/** A writable calendar to save into, preferring the device's default. */
async function findWritableCalendar() {
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable = calendars.filter((calendar) => calendar.allowsModifications);
  if (!writable.length) return null;

  if (Platform.OS === 'ios') {
    const preferred = await Calendar.getDefaultCalendarAsync().catch(() => null);
    const match = preferred && writable.find((calendar) => calendar.id === preferred.id);
    if (match) return match;
  }

  return (
    writable.find((calendar) => calendar.isPrimary) ??
    writable.find((calendar) => calendar.source?.name === 'Default') ??
    writable[0]
  );
}

/**
 * Saves a booking to the device calendar.
 *
 * Returns a discriminated result rather than throwing, so the caller can show
 * the right message for a denied permission versus a genuine failure — those
 * need different copy, and a permission refusal is not an error.
 */
export async function addBookingToCalendar(input: CalendarEventInput): Promise<AddToCalendarResult> {
  try {
    const permission = await Calendar.requestCalendarPermissionsAsync();
    if (permission.status !== 'granted') {
      return { ok: false, reason: 'denied', message: 'Calendar access is off. You can enable it in Settings.' };
    }

    const calendar = await findWritableCalendar();
    if (!calendar) {
      return { ok: false, reason: 'no-calendar', message: 'No writable calendar was found on this device.' };
    }

    const startDate = new Date(input.startsAt);
    const endDate = input.endsAt ? new Date(input.endsAt) : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    await Calendar.createEventAsync(calendar.id, {
      title: input.title,
      startDate,
      endDate,
      location: input.location ?? undefined,
      notes: input.notes ?? undefined,
      timeZone: input.timeZone ?? undefined,
      // A day-before nudge is what people expect from a booked event.
      alarms: [{ relativeOffset: -60 }, { relativeOffset: -60 * 24 }],
    });

    return { ok: true, calendarName: calendar.title };
  } catch (error: any) {
    return { ok: false, reason: 'failed', message: error?.message || 'Could not add this to your calendar.' };
  }
}
