const LocalPromise = Promise;

export { LocalPromise as Promise };

export const promiseAndResolve = <T>() => {
  let resolve: (value: T) => void;
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  // Promise executes its callback synchronously, so resolve must be set now.
  /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
  return { promise_: promise, resolve_: resolve! };
};
