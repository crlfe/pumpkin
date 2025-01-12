const LocalPromise = Promise;

export { LocalPromise as Promise };

export const promiseWithResolvers = <T>() => {
  let resolve: (value: T) => void, reject: (reason?: unknown) => void;
  const promise = new LocalPromise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  // Promise executes its callback synchronously, so resolve and reject must be set now.
  /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
  return [promise, resolve!, reject!] as const;
};
