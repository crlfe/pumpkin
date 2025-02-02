import {
  isFunction,
  Nullish,
  TinySet,
  tinySetAdd,
  tinySetDelete,
  tinySetIterable,
} from "./utils";

export class Signal<T> {
  _value: T;
  _observers: TinySet<Effect>;

  constructor(value: T) {
    this._value = value;
  }

  get(): T {
    if (_effectCurrent && _effectCurrent._state & EffectState.RUNNING) {
      this._observers = tinySetAdd(this._observers, _effectCurrent);
      _effectCurrent._observing = tinySetAdd(_effectCurrent._observing, this);
    }
    return this._value;
  }

  set(value: T): void {
    this._value = value;

    for (const observer of tinySetIterable(this._observers)) {
      observer.update();
    }
    this._observers = null;
  }

  update(fn: (value: T) => T): void {
    this.set(fn(this._value));
  }
}

const enum EffectState {
  ZERO = 0,
  PENDING = 1,
  RUNNING = 2,
  DISPOSED = 4,
}

let _effectCurrent: Effect | Nullish;
let _effectQueue: Effect[] | Nullish;

export class Effect {
  static onCleanup(fn: () => void): void {
    if (_effectCurrent) {
      if (_effectCurrent._cleanups) {
        _effectCurrent._cleanups.push(fn);
      } else {
        _effectCurrent._cleanups = [fn];
      }
    }
  }

  static wrap<A extends unknown[], R>(fn: (...args: A) => R) {
    return (_runInEffect<A, R>).bind(null, _effectCurrent, fn);
  }

  _state: EffectState;
  _fn?: () => void;
  _observing: TinySet<Signal<unknown>>;
  _cleanups?: (Effect | (() => void))[];

  constructor(fn: () => void) {
    this._state = EffectState.PENDING;
    this._fn = fn;

    _effectCurrent?._cleanups?.push(this);
    _runEffectSync(this);
  }

  update() {
    if (!(this._state & (EffectState.PENDING | EffectState.DISPOSED))) {
      this._state |= EffectState.PENDING;
      const queue = _effectQueue;
      if (queue) {
        queue.push(this);
      } else {
        _effectQueue = [this];
        queueMicrotask(_runEffectQueue);
      }
    }
  }

  dispose() {
    this._state = EffectState.DISPOSED;
    _runEffectCleanups(this);
  }
}

const _runInEffect = <A extends unknown[], R>(
  effect: Effect | Nullish,
  fn: (...args: A) => R,
  ...args: A
): R => {
  const pushedEffect = _effectCurrent;
  try {
    _effectCurrent = effect;
    return fn(...args);
  } finally {
    _effectCurrent = pushedEffect;
  }
};

const _runEffectQueue = (): void => {
  const queue = _effectQueue;
  if (queue) {
    _effectQueue = null;
    for (const effect of queue) {
      if (
        effect._state & EffectState.PENDING &&
        !(effect._state & EffectState.DISPOSED)
      ) {
        try {
          _runEffectCleanups(effect);
          _runEffectSync(effect);
        } catch (err) {
          console.error(err);
        }
      }
    }
    _effectCurrent = null;
  }
};

const _runEffectSync = (effect: Effect): void => {
  const fn = effect._fn;
  const pushedEffect = _effectCurrent;
  if (fn) {
    try {
      _effectCurrent = effect;
      effect._state =
        (effect._state & ~EffectState.PENDING) | EffectState.RUNNING;
      fn();
    } finally {
      effect._state &= ~EffectState.RUNNING;
      _effectCurrent = pushedEffect;
    }
  }
};

const _runEffectCleanups = (effect: Effect): void => {
  for (const signal of tinySetIterable(effect._observing)) {
    tinySetDelete(signal._observers, effect);
  }
  effect._observing = null;

  const cleanups = effect._cleanups;
  if (cleanups) {
    for (let i = cleanups.length - 1; i >= 0; i--) {
      const cleanup = cleanups[i] as Effect | (() => void);
      if (isFunction(cleanup)) {
        cleanup();
      } else {
        cleanup.dispose();
      }
    }
    cleanups.length = 0;
  }
};
