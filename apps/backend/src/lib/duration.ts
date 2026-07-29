const UNIT_TO_MS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

// Разбирает простые длительности вида "15m", "30d", "1h", используемые в JWT_*_TTL.
export function parseDurationToMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration.trim());
  if (!match) {
    throw new Error(`Unsupported duration format: ${duration}`);
  }
  const [, amount, unit] = match;
  return Number(amount) * UNIT_TO_MS[unit as string]!;
}
