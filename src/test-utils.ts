import { expect, vi } from "vitest";

declare module "vitest" {
  interface Assertion<T> {
    toEqualAcrossTimers(before: T, after: T): Promise<void>;
  }
}

expect.extend({
  async toEqualAcrossTimers<T>(
    this: { equals(a: T, b: T): boolean },
    received: T,
    before: T,
    after: T,
  ): Promise<{ pass: boolean; message: () => string; expected: T; actual: T }> {
    if (!this.equals(received, before)) {
      return {
        pass: false,
        message: () => "Unexpect value before timers",
        expected: before,
        actual: received,
      };
    }
    await vi.runAllTimersAsync();
    if (!this.equals(received, after)) {
      return {
        pass: false,
        message: () => "Unexpect value after timers",
        expected: after,
        actual: received,
      };
    }

    return {
      pass: true,
      message: () => "Unexpected value",
      expected: received,
      actual: after,
    };
  },
});
