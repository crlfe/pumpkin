import { createEffect, createSignal } from "@crlfe.ca/pumpkin";

const length = 100000;

const signals = Array.from({ length }, (_, i) => {
  const signal = createSignal(i);
  createEffect(() => {
    signal.get();
  });
  return signal;
});

const button = document.createElement("button");
button.addEventListener("click", () => {
  signals.forEach((s) => s.set(2));
});
button.innerText = "Increment";

document.body.append(button);
