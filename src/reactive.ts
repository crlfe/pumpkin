import { createEffect } from "./effects";

export const bindEventListener =
  (name: string, listener: EventListenerOrEventListenerObject) =>
  (elem: Element): void =>
    createEffect(({ onCleanup: cleanup }) => {
      elem.addEventListener(name, listener);
      cleanup(() => elem.removeEventListener(name, listener));
    });

export const bindTextContent =
  (func: () => string) =>
  (elem: Element): string =>
    createEffect(() => (elem.textContent = func()));
