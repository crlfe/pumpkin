export const asArray = <T>(value: void | null | undefined | T | T[]): T[] => {
  if (value == null) {
    return [];
  } else if (isArray(value)) {
    return value;
  } else {
    return [value];
  }
};

export const isArray = (input: unknown): input is Array<unknown> =>
  Array.isArray(input);

/* eslint-disable-next-line @typescript-eslint/ban-types */
export const isFunction = (input: unknown): input is Function =>
  typeof input === "function";

export const isObject = (input: unknown): input is object =>
  typeof input === "object";
