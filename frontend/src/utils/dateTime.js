/**
 * datetime-local values are in the user's local timezone.
 * Convert to ISO UTC for the API (avoids server UTC mis-parsing "2026-09-24T19:00").
 */
export function datetimeLocalToIso(value) {
  if (!value) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date and time');
  }
  return date.toISOString();
}

export function formatAppDateTime(isoOrDate) {
  const date = isoOrDate instanceof Date ? isoOrDate : new Date(isoOrDate);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZoneName: 'short',
  });
}

/** Default value for <input type="datetime-local" /> — now, rounded up 5 minutes. */
export function defaultDatetimeLocalValue(fromDate = new Date()) {
  const d = new Date(fromDate);
  d.setSeconds(0, 0);
  const minutes = d.getMinutes();
  d.setMinutes(minutes + (5 - (minutes % 5 || 5)));
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
