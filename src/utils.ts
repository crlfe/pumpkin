export type Nullish = null | undefined;

export const isFunction = (
  value: unknown,
): value is (...args: unknown[]) => unknown => typeof value === "function";

export const isArray = (value: unknown): value is unknown[] =>
  Array.isArray(value);

export const isSet = (value: unknown): value is Set<unknown> =>
  value instanceof Set;

export type TinySet<T> = null | undefined | T | T[] | Set<T>;

export const tinySetAdd = <T>(store: TinySet<T>, value: T): TinySet<T> => {
  if (store == null) {
    return [value];
  } else if (isArray(store)) {
    if (store.lastIndexOf(value) < 0) {
      store.push(value);
      if (store.length > 32) {
        return new Set(store);
      }
    }
    return store;
  } else if (isSet(store)) {
    return store.add(value);
  } else if (store !== value) {
    return [store, value];
  } else {
    return store;
  }
};

export const tinySetDelete = <T>(store: TinySet<T>, value: T): TinySet<T> => {
  if (store == null) {
    // Set is empty.
  } else if (isArray(store)) {
    const i = store.lastIndexOf(value);
    if (i >= 0) {
      store.splice(i, 1);
      if (store.length < 2) {
        return store[0];
      }
    }
  } else if (isSet(store)) {
    store.delete(value);
  } else if (store === value) {
    return null;
  }
  return store;
};

export const tinySetIterable = <T>(store: TinySet<T>) => {
  if (store == null) {
    return [];
  } else if (isArray(store) || isSet(store)) {
    return store;
  } else {
    return [store];
  }
};
