const DATE_ICT_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * BR-TLM-08 & D-GB: Single canonical ICT (UTC+7) date boundary function.
 * Given a Date or ISO timestamp string, returns YYYY-MM-DD in UTC+7 timezone.
 */
export function getDateIct(input?: Date | string | number | null): string {
  const date = input ? new Date(input) : new Date();
  if (Number.isNaN(date.getTime())) {
    throw new Error(`Invalid date input for getDateIct: ${String(input)}`);
  }

  // Format in Asia/Ho_Chi_Minh (UTC+7)
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Ho_Chi_Minh",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(date);
}

/**
 * Returns Date object for 00:00:00 ICT on a given date_ict string (YYYY-MM-DD).
 */
export function parseDateIct(dateIct: string): Date {
  const match = DATE_ICT_REGEX.exec(dateIct);
  if (!match) {
    throw new Error(`Invalid date_ict format: ${dateIct}, expected YYYY-MM-DD`);
  }

  const isoStr = `${dateIct}T00:00:00.000+07:00`;
  return new Date(isoStr);
}
