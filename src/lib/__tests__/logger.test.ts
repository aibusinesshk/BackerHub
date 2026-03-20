import { describe, it, expect, vi, beforeEach } from 'vitest';
import { logger } from '../logger';

describe('logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('logs info messages as structured JSON', () => {
    logger.info('test message', { userId: '123', action: 'test' });
    expect(console.log).toHaveBeenCalledOnce();
    const logged = JSON.parse((console.log as any).mock.calls[0][0]);
    expect(logged.level).toBe('info');
    expect(logged.message).toBe('test message');
    expect(logged.userId).toBe('123');
    expect(logged.timestamp).toBeDefined();
  });

  it('logs warnings', () => {
    logger.warn('something odd', { route: '/api/test' });
    expect(console.warn).toHaveBeenCalledOnce();
    const logged = JSON.parse((console.warn as any).mock.calls[0][0]);
    expect(logged.level).toBe('warn');
  });

  it('logs errors with Error object details', () => {
    const err = new Error('test failure');
    logger.error('operation failed', err, { route: '/api/test' });
    expect(console.error).toHaveBeenCalledOnce();
    const logged = JSON.parse((console.error as any).mock.calls[0][0]);
    expect(logged.level).toBe('error');
    expect(logged.errorName).toBe('Error');
    expect(logged.errorMessage).toBe('test failure');
    expect(logged.stack).toBeDefined();
  });

  it('logs errors with non-Error values', () => {
    logger.error('operation failed', 'string error');
    const logged = JSON.parse((console.error as any).mock.calls[0][0]);
    expect(logged.errorRaw).toBe('string error');
  });

  it('apiRequest logs with method and route', () => {
    logger.apiRequest('/api/listings', 'GET', 'user-123');
    const logged = JSON.parse((console.log as any).mock.calls[0][0]);
    expect(logged.message).toBe('GET /api/listings');
    expect(logged.route).toBe('/api/listings');
    expect(logged.userId).toBe('user-123');
  });

  it('apiError logs error with request context', () => {
    logger.apiError('/api/contact', 'POST', new Error('db down'), 'user-456');
    const logged = JSON.parse((console.error as any).mock.calls[0][0]);
    expect(logged.message).toBe('POST /api/contact failed');
    expect(logged.userId).toBe('user-456');
    expect(logged.errorMessage).toBe('db down');
  });
});
