import { describe, expect, it } from 'vitest';
import { welcomeResponseByLang } from '@/fixtures';
import { validateChatResponse } from './validators';

describe('validateChatResponse', () => {
  it('accepts welcome fixtures (unknown fields allowed)', () => {
    const result = validateChatResponse(welcomeResponseByLang.es);
    expect(result.ok).toBe(true);
  });

  it('reports missing required fields as violations', () => {
    const result = validateChatResponse({
      jsonClass: 'x',
      uniqueToken: 'a',
      headers: {},
      jsonString: {},
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.length).toBeGreaterThan(0);
    }
  });

  it('flags uniqueToken / kafka_correlationId mismatch', () => {
    const bad = structuredClone(welcomeResponseByLang.en);
    bad.uniqueToken = 'not-the-correlation-id';
    const result = validateChatResponse(bad);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(
        result.violations.some((v) => v.includes('uniqueToken')),
      ).toBe(true);
    }
  });
});
