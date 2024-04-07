import { createEffect, onCleanup } from "./effects";

/**
 * Binds an event listener to a DOM element.
 */
export const bindEventListener =
  (name: string, listener: EventListenerOrEventListenerObject) =>
  (elem: Element): void =>
    createEffect(() => {
      elem.addEventListener(name, listener);
      onCleanup(() => elem.removeEventListener(name, listener));
    });

/**
 * Binds a string to the text content of a DOM element.
 */
export const bindTextContent =
  (func: () => string) =>
  (elem: Element): void =>
    createEffect(() => {
      elem.textContent = func();
    });

/**
 * Binds an array of objects to the children of a DOM element, through a
 * mapping function.
 *
 * Nodes will be cached on the identity of the array items. This means
 * that reordering the array will result in a corresponding reordering of
 * actual DOM nodes. However, to modify items you will usually need to
 * replace them rather than changing their fields.
 */
export const bindChildrenMapped =
  <T extends object>(src: () => T[], mapFn: (value: T) => Node) =>
  (elem: Element): void => {
    const cache = new WeakMap<T, Node>();
    createEffect(() => {
      elem.replaceChildren(
        ...src().map((item) => {
          let node = cache.get(item);
          if (node == undefined) {
            cache.set(item, (node = mapFn(item)));
          }
          return node;
        })
      );
    });
  };
