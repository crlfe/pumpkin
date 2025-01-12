import { describe, expect, test, vi } from "vitest";
import { createEffect, onDispose, createSignal } from ".";
import "./test-utils.ts";

describe("basic", () => {
  test("single signal", async () => {
    vi.useFakeTimers();

    const counter = createSignal(0);

    const events: number[] = [];
    createEffect(() => {
      events.push(counter.get());
    });

    expect(events).toEqual([0]);
    await vi.runAllTimersAsync();
    expect(events).toEqual([0]);

    counter.set(1);

    await expect(events).toEqualAcrossTimers([0], [0, 1]);

    counter.set(2);

    await expect(events).toEqualAcrossTimers([0, 1], [0, 1, 2]);
  });

  test("repeated set", async () => {
    vi.useFakeTimers();

    const counter = createSignal(0);

    const events: number[] = [];
    createEffect(() => {
      events.push(counter.get());
    });

    await expect(events).toEqualAcrossTimers([0], [0]);

    counter.set(1);
    counter.set(2);

    await expect(events).toEqualAcrossTimers([0], [0, 2]);
  });

  test("concurrent set", async () => {
    vi.useFakeTimers();

    const letter = createSignal("A");
    const number = createSignal("1");

    const events: string[] = [];
    createEffect(() => {
      events.push(letter.get() + number.get());
    });

    await expect(events).toEqualAcrossTimers(["A1"], ["A1"]);

    letter.set("B");
    number.set("2");

    await expect(events).toEqualAcrossTimers(["A1"], ["A1", "B2"]);
  });

  test("nested effects", async () => {
    vi.useFakeTimers();

    const a = createSignal("A");
    const b = createSignal("B");
    const c = createSignal("C");

    const events: string[] = [];
    createEffect(() => {
      const av = a.get();
      events.push(av);
      onDispose(() => events.push(`-${av}`));

      createEffect(() => {
        const bv = b.get();
        events.push(bv);
        onDispose(() => events.push(`-${bv}`));

        createEffect(() => {
          const cv = c.get();
          events.push(cv);
          onDispose(() => events.push(`-${cv}`));
        });
      });
    });

    await expect(events).toEqualAcrossTimers(["A", "B", "C"], ["A", "B", "C"]);

    b.set("B2");

    await expect(events).toEqualAcrossTimers(
      ["A", "B", "C"],
      ["A", "B", "C", "-C", "-B", "B2", "C"],
    );
  });
});
