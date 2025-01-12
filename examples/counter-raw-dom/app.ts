import { createEffect, createSignal } from "@crlfe.ca/pumpkin";

const counter = createSignal(0);

const div = document.createElement("div");
createEffect(() => {
  // This effect will re-run whenever the counter changes.
  div.textContent = String(counter.get());
});

const button = document.createElement("button");
button.addEventListener("click", () => {
  // This event handler will increment the counter.
  counter.set(counter.get() + 1);
});
button.innerText = "Increment";

document.body.append(div, button);
