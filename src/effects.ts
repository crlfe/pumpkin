export type Getter<T> = () => T;
export type Setter<T> = (valueOrUpdate: ValueOrUpdate<T>) => void;

type ValueOrUpdate<T> = T extends (value: T) => T
  ? (value: T) => T
  : ((value: T) => T) | T;

export type Signal<T> = {
  get: Getter<T>;
  set: Setter<T>;
};

export type EffectHooks = {
  onCleanup: (func: () => void) => void;
};

const enum EffectState {
  IDLE = 0,
  RECURSE = 1,
  EXECUTE = 2,
  DISPOSED = 3,
}

type Effect = {
  task: (context: EffectHooks) => void;
  state: EffectState;
  parent: Effect | null;
  children: Effect[];
  cleanups: (() => void)[];
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
      }
      return value;
    },
    set(valueOrUpdate) {
      const newValue =
        typeof valueOrUpdate === "function"
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

export const createEffect = <T>(task: (hooks: EffectHooks) => T): T => {
  const savedEffect = globalEffect;
  try {
    const effect: Effect = {
      task,
      state: EffectState.IDLE,
      parent: savedEffect,
      children: [],
      cleanups: [],
    };
    globalEffect = effect;
    return task(createEffectHooks(effect));
  } finally {
    globalEffect = savedEffect;
  }
};

const scheduleEffect = (effect: Effect): void => {
  if (effect.state <= EffectState.RECURSE) {
    effect.state = EffectState.EXECUTE;
    for (let curr = effect; curr.parent; curr = curr.parent) {
      if (curr.parent.state >= EffectState.RECURSE) {
        return; // Already scheduled.
      }
      curr.parent.state = EffectState.RECURSE;
    }
    queueMicrotask(bindRunEffect(effect));
  }
};

const bindRunEffect = (effect: Effect) => () => walkEffect(effect);

const walkEffect = (effect: Effect) => {
  if (effect.state === EffectState.RECURSE) {
    effect.state = EffectState.IDLE;
    effect.children.forEach((child) => walkEffect(child));
  } else if (effect.state === EffectState.EXECUTE) {
    const savedEffect = globalEffect;
    try {
      effect.state = EffectState.IDLE;
      cleanupImpl(effect);
      globalEffect = effect;
      effect.task(createEffectHooks(effect));
    } finally {
      globalEffect = savedEffect;
    }
  }
};

const createEffectHooks = (effect: Effect): EffectHooks => {
  return {
    onCleanup(task) {
      effect.cleanups.push(task);
    },
  };
};

const disposeEffects = (children: Effect[]): void => {
  children.forEach((effect) => {
    if (effect.state < EffectState.DISPOSED) {
      const savedEffect = globalEffect;
      try {
        effect.state = EffectState.DISPOSED;
        cleanupImpl(effect);
      } finally {
        globalEffect = savedEffect;
      }
    }
  });
};

const cleanupImpl = (effect: Effect) => {
  const { children, cleanups } = effect;
  effect.children = [];
  effect.cleanups = [];
  disposeEffects(children);
  cleanups.forEach((task) => task());
};
