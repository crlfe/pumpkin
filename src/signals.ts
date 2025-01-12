import { Promise, promiseWithResolvers } from "./utils.ts";

type Bit = 0 | 1;

interface Scope {
  observes_: Set<Promise<Bit>>;
  disposes_: (() => void)[];
}

let currentScope: Scope | undefined;

export const createSignal = <T>(value: T) => {
  let [changed, resolveChanged] = promiseWithResolvers<Bit>();
  let curr = value;
  return {
    get: () => {
      currentScope?.observes_.add(changed);
      return curr;
    },
    set: (value: T) => {
      curr = value;
      resolveChanged(0);
      [changed, resolveChanged] = promiseWithResolvers<Bit>();
    },
  };
};

export const createEffect = (workFn: () => void): void => {
  const [closed, resolveClosed] = promiseWithResolvers<1>();
  const self: Scope = {
    observes_: new Set([closed]),
    disposes_: [],
  };

  const runDisposes = (): void => {
    self.disposes_.reverse().forEach((f) => f());
    self.disposes_.length = 0;
  };

  const run = (): void => {
    const savedScope = currentScope;
    try {
      currentScope = self;
      workFn();
    } finally {
      currentScope = savedScope;
    }

    Promise.race(self.observes_).then((done) => {
      if (!done) {
        runDisposes();
        run();
      }
    });
    self.observes_.clear();
    self.observes_.add(closed);
  };

  onDispose(() => {
    runDisposes();
    resolveClosed(1);
  });

  run();
};

export const onDispose = (disposeFn: () => void) => {
  currentScope?.disposes_.push(disposeFn);
};
