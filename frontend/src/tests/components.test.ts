import { describe, expect, it } from 'vitest';
import { formatVnd as money } from '../utils/currency';

describe('money formatter', () => {
  it('formats integer VND without decimals', () => {
    expect(money(1_000_000)).toMatch(/1[.\s]000[.\s]000/);
  });
});
