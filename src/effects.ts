import { isFunction } from "./util";

export type Getter<T> = () => T;
export type Setter<T> = (valueOrUpdate: ValueOrUpdate<T>) => void;

type ValueOrUpdate<T> = T extends (value: T) => T
  ? (value: T) => T
  : ((value: T) => T) | T;

export type Signal<T> = {
  get: Getter<T>;
  set: Setter<T>;
};

const enum EffectState {
  IDLE = 0,
  RECURSE = 1,
  EXECUTE = 2,
  DISPOSED = 3,
}

type Effect = {
  task_: () => void;
  state_: EffectState;
  parent_: Effect | null;
  children_: Effect[];
  cleanups_: (() => void)[];
};

let globalEffect: Effect | null = null;

export const createSignal = <T>(value: T): Signal<T> => {
  const equals = Object.is;
  const observers: Effect[] = [];
  return {
    get() {
      const effect = globalEffect;
      if (effect && effect !== observers.at(-1)) {
        observers.push(effect);
        // TODO: Periodically cull disposed observers to avoid leaking memory.
      }
      return value;
    },
    set(valueOrUpdate) {
      const newValue = isFunction(valueOrUpdate)
        ? valueOrUpdate(value)
        : valueOrUpdate;
      if (!equals(value, newValue)) {
        value = newValue;
        observers.forEach((effect) => scheduleEffect(effect));
        observers.length = 0;
      }
    },
  };
};

export const createEffect = (task: () => void): void => {
  const savedEffect = globalEffect;
  try {
    const effect: Effect = {
      task_: task,
      state_: EffectState.IDLE,
      parent_: savedEffect,
      children_: [],
      cleanups_: [],
    };
    savedEffect?.children_.push(effect);
    globalEffect = effect;
    task();
  } finally {
    globalEffect = savedEffect;
  }
};

const scheduleEffect = (effect: Effect): void => {
  if (effect.state_ <= EffectState.RECURSE) {
    effect.state_ = EffectState.EXECUTE;

    let root = effect;
    while (root.parent_) {
      if (root.parent_.state_ >= EffectState.RECURSE) {
        return; // Already scheduled.
      }
      root.parent_.state_ = EffectState.RECURSE;
      root = root.parent_;
    }
    queueMicrotask(bindRunEffect(root));
  }
};

const bindRunEffect = (effect: Effect) => () => walkEffect(effect);

const walkEffect = (effect: Effect) => {
  if (effect.state_ === EffectState.RECURSE) {
    effect.state_ = EffectState.IDLE;
    effect.children_.forEach((child) => walkEffect(child));
  } else if (effect.state_ === EffectState.EXECUTE) {
    const savedEffect = globalEffect;
    try {
      effect.state_ = EffectState.IDLE;
      cleanupImpl(effect);
      globalEffect = effect;
      effect.task_();
    } finally {
      globalEffect = savedEffect;
    }
  }
};

export const onCleanup = (task: () => void): void => {
  globalEffect?.cleanups_.push(task);
};

const disposeEffects = (children: Effect[]): void => {
  children.forEach((effect) => {
    if (effect.state_ < EffectState.DISPOSED) {
      const savedEffect = globalEffect;
      try {
        effect.state_ = EffectState.DISPOSED;
        cleanupImpl(effect);
      } finally {
        globalEffect = savedEffect;
      }
    }
  });
};

const cleanupImpl = (effect: Effect) => {
  const { children_: children, cleanups_: cleanups } = effect;
  effect.children_ = [];
  effect.cleanups_ = [];
  disposeEffects(children);
  cleanups.forEach((task) => task());
};
