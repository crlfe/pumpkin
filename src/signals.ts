interface Scope {
  key_: number;
  next_(): void;
  readonly cleanups_: (Effect | (() => void))[];
}

const runInScope = <Args extends unknown[], T>(
  scope: Scope | undefined,
  workFn: (...args: Args) => T,
  ...args: Args
): T => {
  const savedScope = currentScope;
  try {
    currentScope = scope;
    return workFn(...args);
  } finally {
    currentScope = savedScope;
  }
};

let currentScope: Scope | undefined;

export class Signal<T> {
  value_: T;
  observers_: { scope_: Scope; key_: number }[] = [];
  check_ = 0;

  constructor(value: T) {
    this.value_ = value;
  }
  get(): T {
    if (currentScope) {
      const observers = this.observers_;

      // Occasionally clean up obsolete observers.
      if (this.check_ < 16 || this.check_ < observers.length / 2) {
        this.check_++;
      } else {
        let kept = 0;
        for (const item of observers) {
          if (item.scope_.key_ === item.key_) {
            observers[kept++] = item;
          }
        }
        observers.length = kept;
        this.check_ = 0;
      }
      observers.push({ scope_: currentScope, key_: currentScope.key_ });
    }
    return this.value_;
  }
  set(value: T) {
    this.value_ = value;
    const obs = this.observers_;
    if (obs) {
      for (const observer of obs) {
        if (observer.scope_.key_ === observer.key_) {
          observer.scope_.next_();
        }
      }
      obs.length = 0;
    }
  }
  update(updateFn: (value: T) => T): void {
    this.set(updateFn(this.value_));
  }
}

export class Effect {
  readonly workFn_: () => void;
  readonly cleanups_: (() => void)[] = [];
  key_ = 0;

  constructor(workFn: () => void) {
    this.workFn_ = workFn;
    runInScope(this, this.workFn_);
    onCleanup(this.return_.bind(this));
  }

  private runCleanups_(): void {
    const cleanups = this.cleanups_;
    for (const cleanup of cleanups.reverse()) {
      cleanup();
    }
    cleanups.length = 0;
  }

  next_(): void {
    this.key_++;
    queueMicrotask(this.run_.bind(this));
  }

  return_(): void {
    this.key_++;
    this.runCleanups_();
  }

  run_(): void {
    this.runCleanups_();
    runInScope(this, this.workFn_);
  }
}

export const createSignal = <T>(value: T): Signal<T> => new Signal(value);
export const createEffect = (workFn: () => void): Effect => new Effect(workFn);
export const onCleanup = (workFn: () => void): void => {
  currentScope?.cleanups_.push(workFn);
};

export const saveEffectScope = <Args extends unknown[], T>(
  workFn: (...args: Args) => T,
) => {
  const scope = currentScope;
  return (...args: Args) => runInScope(scope, workFn, ...args);
};
