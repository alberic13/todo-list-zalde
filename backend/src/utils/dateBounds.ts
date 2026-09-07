export interface JakartaDateBounds {
  startOfJakartaDay: Date;
  endOfJakartaDay: Date;
  endOfH3JakartaDay: Date;
  year: number;
  month: number;
  day: number;
  jakartaDateStr: string;
  dateFormatted: string;
}

/**
 * Calculate start, end, and 3-days-ahead (H-3) UTC timestamps corresponding to Asia/Jakarta (WIB = UTC+7)
 */
export function getJakartaDateBounds(referenceDate = new Date()): JakartaDateBounds {
  const jakartaDateStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(referenceDate);

  const [year, month, day] = jakartaDateStr.split("-").map(Number);

  // Asia/Jakarta is strictly UTC+7 without DST (UTC = WIB - 7 hours)
  const startOfJakartaDay = new Date(
    Date.UTC(year, month - 1, day, 0, 0, 0, 0) - 7 * 60 * 60 * 1000
  );
  const endOfJakartaDay = new Date(
    Date.UTC(year, month - 1, day, 23, 59, 59, 999) - 7 * 60 * 60 * 1000
  );
  const endOfH3JakartaDay = new Date(
    Date.UTC(year, month - 1, day + 3, 23, 59, 59, 999) - 7 * 60 * 60 * 1000
  );

  const dateFormatted = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(referenceDate);

  return {
    startOfJakartaDay,
    endOfJakartaDay,
    endOfH3JakartaDay,
    year,
    month,
    day,
    jakartaDateStr,
    dateFormatted,
  };
}
