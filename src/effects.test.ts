import { describe, expect, test, vi } from "vitest";
import { createEffect, createSignal } from "./effects";

describe("effects", () => {
  test("smoke", async () => {
    vi.useFakeTimers();

    const name = createSignal<string>("Alice");

    const names: string[] = [];
    createEffect(() => {
      names.push(name.get());
      if (name.get() === "Alice") {
        name.set("Bob");
      }
    });

    // The first execution is sync.
    expect(names).toEqual(["Alice"]);

    // Self-triggering is async.
    await vi.runAllTimersAsync();
    expect(names).toEqual(["Alice", "Bob"]);

    name.set("Charlie");

    // External triggering is also async.
    expect(names).toEqual(["Alice", "Bob"]);
    await vi.runAllTimersAsync();
    expect(names).toEqual(["Alice", "Bob", "Charlie"]);
  });

  test("nested", async () => {
    vi.useFakeTimers();

    const a = createSignal("A");
    const b = createSignal("B");
    const c = createSignal("C");
    const outer = createSignal([a, b, c]);

    const events: string[] = [];
    createEffect(() => {
      const v = outer.get();
      events.push(v.length.toString());
      v.forEach((s) => {
        createEffect(() => {
          events.push(s.get());
        });
      });
    });

    expect(events).toEqual(["3", "A", "B", "C"]);
    await vi.runAllTimersAsync();
    expect(events).toEqual(["3", "A", "B", "C"]);

    b.set((s) => s + "2");

    await vi.runAllTimersAsync();
    expect(events).toEqual(["3", "A", "B", "C", "B2"]);
  });
});
