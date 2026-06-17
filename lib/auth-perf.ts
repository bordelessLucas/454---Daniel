type AuthPerfStep = {
  step: string;
  durationMs: number;
};

const steps: AuthPerfStep[] = [];

function roundMs(value: number): number {
  return Math.round(value);
}

export function resetAuthPerf(): void {
  steps.length = 0;
}

export function recordAuthPerf(step: string, durationMs: number): void {
  if (!import.meta.env.DEV) {
    return;
  }

  const entry = { step, durationMs: roundMs(durationMs) };
  steps.push(entry);
  console.info(`[auth-perf] ${entry.step}: ${entry.durationMs}ms`);
}

export function finishAuthPerf(label: string): void {
  if (!import.meta.env.DEV || steps.length === 0) {
    return;
  }

  const totalMs = steps.reduce((sum, item) => sum + item.durationMs, 0);
  console.info(`[auth-perf] ${label} total: ${totalMs}ms`, [...steps]);
  steps.length = 0;
}

export async function measureAuthStep<T>(
  step: string,
  action: () => Promise<T>,
): Promise<T> {
  const startedAt = performance.now();
  try {
    return await action();
  } finally {
    recordAuthPerf(step, performance.now() - startedAt);
  }
}
