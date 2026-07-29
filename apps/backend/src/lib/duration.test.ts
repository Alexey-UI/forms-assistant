import { describe, expect, it } from 'vitest';
import { parseDurationToMs } from './duration';

describe('parseDurationToMs', () => {
  it('parses minutes', () => {
    expect(parseDurationToMs('15m')).toBe(15 * 60 * 1000);
  });

  it('parses days', () => {
    expect(parseDurationToMs('30d')).toBe(30 * 24 * 60 * 60 * 1000);
  });

  it('parses hours and seconds', () => {
    expect(parseDurationToMs('1h')).toBe(60 * 60 * 1000);
    expect(parseDurationToMs('45s')).toBe(45 * 1000);
  });

  it('throws on an unsupported format', () => {
    expect(() => parseDurationToMs('abc')).toThrow();
    expect(() => parseDurationToMs('10x')).toThrow();
  });
});
