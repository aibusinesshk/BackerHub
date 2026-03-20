import { describe, it, expect } from 'vitest';
import {
  getIdempotentResponse,
  setIdempotentResponse,
  acquireInFlight,
  releaseInFlight,
} from '../idempotency';

describe('idempotency', () => {
  it('returns null for unknown keys', () => {
    const result = getIdempotentResponse(`unknown-${Date.now()}`);
    expect(result).toBeNull();
  });

  it('stores and retrieves cached responses', () => {
    const key = `test-cache-${Date.now()}`;
    setIdempotentResponse(key, { status: 201, body: { id: '123' } });
    const cached = getIdempotentResponse(key);
    expect(cached).not.toBeNull();
    expect(cached!.status).toBe(201);
    expect(cached!.body).toEqual({ id: '123' });
  });

  it('acquires and releases in-flight locks', () => {
    const key = `flight-${Date.now()}`;
    expect(acquireInFlight(key)).toBe(true);
    expect(acquireInFlight(key)).toBe(false); // already in-flight
    releaseInFlight(key);
    expect(acquireInFlight(key)).toBe(true); // released, can acquire again
  });
});
