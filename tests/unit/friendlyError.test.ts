import { afterEach, describe, expect, it, vi } from 'vitest';
import { friendlyError } from '../../src/services/api';

afterEach(() => vi.unstubAllGlobals());

describe('friendlyError', () => {
  it('reports a cancelled request', () => {
    const error = new Error('x'); error.name = 'AbortError';
    expect(friendlyError(error)).toBe('Yêu cầu đã được hủy.');
  });

  it('reports a slow service for a timeout', () => {
    const error = new Error('x'); error.name = 'TimeoutError';
    expect(friendlyError(error)).toContain('phản hồi chậm');
  });

  it('passes through a specific app-raised message', () => {
    expect(friendlyError(new Error('Tọa độ không hợp lệ.'))).toBe('Tọa độ không hợp lệ.');
  });

  it('blames the connection only when the device is actually offline', () => {
    vi.stubGlobal('navigator', { onLine: false });
    expect(friendlyError(new TypeError('Failed to fetch'))).toContain('Không có kết nối mạng');
  });

  it('blames the map service, not the connection, when the device is online', () => {
    vi.stubGlobal('navigator', { onLine: true });
    const message = friendlyError(new TypeError('Failed to fetch'));
    expect(message).toContain('vẫn có mạng');
    expect(message).not.toContain('Không có kết nối mạng');
  });
});
