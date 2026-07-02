export function decimalHorasToNumber(value: string | number): number {
  const decimal = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(decimal) ? decimal : 0;
}

export function decimalHorasToHHmm(value: string | number): string {
  const decimal = decimalHorasToNumber(value);
  const totalMinutes = Math.round(decimal * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}
