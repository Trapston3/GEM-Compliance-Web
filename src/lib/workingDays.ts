export function isWorkingDay(date: Date): boolean {
  const day = date.getDay(); // 0 = Sunday, 6 = Saturday
  if (day === 0) return false;
  if (day === 6) {
    const occurrence = Math.ceil(date.getDate() / 7); // 1st..5th Saturday of month
    if (occurrence === 2 || occurrence === 4) return false;
  }
  return true;
}

export function addWorkingDays(start: Date, n: number): Date {
  const result = new Date(start);
  let counted = 0;
  while (counted < n) {
    result.setDate(result.getDate() + 1);
    if (isWorkingDay(result)) counted++;
  }
  return result;
}

export function formatDDMMMYYYY(date: Date): string {
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const dd = String(date.getDate()).padStart(2, "0");
  return `${dd}${months[date.getMonth()]}${date.getFullYear()}`;
}

export function getReplyDueDate(from: Date = new Date()): string {
  return formatDDMMMYYYY(addWorkingDays(from, 3));
}
