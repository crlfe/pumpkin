import { bindTextContent, bindEventListener, createSignal, h } from "../../src";

const counter = createSignal<number>(0);

document
  .getElementById("app")
  ?.replaceChildren(
    h("div", {}, [bindTextContent(() => counter.get().toString())]),
    h("button", {}, [
      bindEventListener("click", () => counter.set((n) => n + 1)),
      "Increment",
    ])
  );
