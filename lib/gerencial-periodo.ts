const PERIODO_REGEX = /^\d{4}-\d{2}$/;

export function toPeriodoYYYYMM(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function currentMonthPeriodo(): string {
  return toPeriodoYYYYMM(new Date());
}

export function normalizePeriodoInput(value: string): string {
  if (PERIODO_REGEX.test(value)) {
    return value;
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return toPeriodoYYYYMM(parsed);
  }

  return value;
}

export function isValidPeriodo(value: string): boolean {
  if (!PERIODO_REGEX.test(value)) {
    return false;
  }

  const [, month] = value.split("-");
  const monthNumber = Number(month);
  return monthNumber >= 1 && monthNumber <= 12;
}
