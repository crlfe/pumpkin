import { expect, test, vi } from "vitest";
import { Effect, Signal } from ".";
import "./test-utils";

test("single signal", async () => {
  vi.useFakeTimers();

  const counter = new Signal(0);

  const events: number[] = [];
  new Effect(() => {
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

  const counter = new Signal(0);

  const events: number[] = [];
  new Effect(() => {
    events.push(counter.get());
  });

  await expect(events).toEqualAcrossTimers([0], [0]);

  counter.set(1);
  counter.set(2);

  await expect(events).toEqualAcrossTimers([0], [0, 2]);
});

test("concurrent set", async () => {
  vi.useFakeTimers();

  const letter = new Signal("A");
  const number = new Signal("1");

  const events: string[] = [];
  new Effect(() => {
    events.push(letter.get() + number.get());
  });

  await expect(events).toEqualAcrossTimers(["A1"], ["A1"]);

  letter.set("B");
  number.set("2");

  await expect(events).toEqualAcrossTimers(["A1"], ["A1", "B2"]);
});

test("nested effects", async () => {
  vi.useFakeTimers();

  const a = new Signal("A");
  const b = new Signal("B");
  const c = new Signal("C");

  const events: string[] = [];
  new Effect(() => {
    const av = a.get();
    events.push(av);
    Effect.onCleanup(() => events.push(`-${av}`));

    new Effect(() => {
      const bv = b.get();
      events.push(bv);
      Effect.onCleanup(() => events.push(`-${bv}`));

      new Effect(() => {
        const cv = c.get();
        events.push(cv);
        Effect.onCleanup(() => events.push(`-${cv}`));
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

test("memory size", async () => {
  vi.useFakeTimers();

  const ns = [1e3, 1e4, 5e4, 1e5];
  const gs = [1, 8, 32, 64];
  const base = await runMemoryUsage(ns[0], ns[0], gs[0]);

  let signalsAvg = 0;
  let effectsAvg = 0;
  let readersAvg = 0;
  for (let i = 1; i < ns.length; i++) {
    signalsAvg += await runMemoryPerItem(ns[i], ns[0], gs[0], base);
    effectsAvg += await runMemoryPerItem(ns[0], ns[i], gs[0], base);
    readersAvg += await runMemoryPerItem(ns[0], ns[0], gs[i], base);
  }

  signalsAvg /= ns.length - 1;
  effectsAvg /= ns.length - 1;
  readersAvg /= ns.length - 1;

  console.log("memory per signal:", signalsAvg.toFixed(1));
  console.log("memory per effect:", effectsAvg.toFixed(1));
  console.log("memory per reader:", readersAvg.toFixed(1));
});

async function runMemoryPerItem(
  numSignals: number,
  numEffects: number,
  numGets: number,
  base: number,
): Promise<number> {
  const used = await runMemoryUsage(numSignals, numEffects, numGets);
  return (used - base) / (numSignals + numEffects * (1 + numGets));
}

async function runMemoryUsage(
  numSignals: number,
  numEffects: number,
  numGets: number,
): Promise<number> {
  gc!();

  const signals = new Array<Signal<number>>(numSignals);
  for (let i = 0; i < numSignals; i++) {
    signals[i] = new Signal(i);
  }

  const effects = new Array<Effect>(numEffects);
  for (let i = 0; i < numEffects; i++) {
    effects[i] = new Effect(() => {
      for (let j = 0; j < numGets; j++) {
        signals[(i + j) % numSignals].get();
      }
    });
  }

  await vi.runAllTimersAsync();

  for (let i = 0; i < numSignals; i++) {
    signals[i].update((v) => v + 1);
  }

  await vi.runAllTimersAsync();

  gc!();
  return process.memoryUsage().heapUsed;
}
