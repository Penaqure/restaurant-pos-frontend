// `from`/`to` are "YYYY-MM-DD" values straight out of <input type="date">
// (empty string = unbounded on that side). `to` is inclusive of the whole
// day, not just midnight, since a user picking "today" as the end date
// expects today's records to show up.
export function isWithinDateRange(iso: string, from: string, to: string): boolean {
  const t = new Date(iso).getTime();
  if (from && t < new Date(`${from}T00:00:00`).getTime()) return false;
  if (to && t > new Date(`${to}T23:59:59.999`).getTime()) return false;
  return true;
}
