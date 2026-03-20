import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimit, financialRateLimit, authRateLimit } from '../rate-limit';

describe('rateLimit', () => {
  it('allows requests within the limit', () => {
    const id = `test-${Date.now()}`;
    const result = rateLimit(id, { limit: 3, windowSeconds: 60 });
    expect(result.success).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('blocks requests exceeding the limit', () => {
    const id = `test-block-${Date.now()}`;
    rateLimit(id, { limit: 2, windowSeconds: 60 });
    rateLimit(id, { limit: 2, windowSeconds: 60 });
    const result = rateLimit(id, { limit: 2, windowSeconds: 60 });
    expect(result.success).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('tracks remaining count correctly', () => {
    const id = `test-remaining-${Date.now()}`;
    const r1 = rateLimit(id, { limit: 5, windowSeconds: 60 });
    expect(r1.remaining).toBe(4);
    const r2 = rateLimit(id, { limit: 5, windowSeconds: 60 });
    expect(r2.remaining).toBe(3);
  });

  it('isolates different identifiers', () => {
    const id1 = `user-a-${Date.now()}`;
    const id2 = `user-b-${Date.now()}`;
    rateLimit(id1, { limit: 1, windowSeconds: 60 });
    const result = rateLimit(id2, { limit: 1, windowSeconds: 60 });
    expect(result.success).toBe(true);
  });
});

describe('financialRateLimit', () => {
  it('has a limit of 5 per 60s', () => {
    const id = `fin-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      expect(financialRateLimit(id).success).toBe(true);
    }
    expect(financialRateLimit(id).success).toBe(false);
  });
});

describe('authRateLimit', () => {
  it('has a limit of 10 per 300s', () => {
    const id = `auth-${Date.now()}`;
    for (let i = 0; i < 10; i++) {
      expect(authRateLimit(id).success).toBe(true);
    }
    expect(authRateLimit(id).success).toBe(false);
  });
});
