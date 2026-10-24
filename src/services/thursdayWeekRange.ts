export interface ThursdayWeekRange {
  start: string;
  end: string;
}

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the latest Friday–Thursday business week.
 * On Thursday, the range ends today; on every other day, it ends on the most recent Thursday.
 * Uses local calendar dates rather than UTC ISO slicing to avoid date shifts in Yemen (UTC+3).
 */
export function getLatestThursdayWeekRange(referenceDate: Date = new Date()): ThursdayWeekRange {
  const end = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  const daysSinceThursday = (end.getDay() - 4 + 7) % 7;
  end.setDate(end.getDate() - daysSinceThursday);

  const start = new Date(end);
  start.setDate(start.getDate() - 6);

  return { start: formatLocalDate(start), end: formatLocalDate(end) };
}
