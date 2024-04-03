import { describe, test, expect, vi } from "vitest";
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
});
