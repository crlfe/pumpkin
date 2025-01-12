# Pumpkin

Pumpkin is a minimalist DOM rendering and signal library for reactive web
apps. That's a lot of buzzwords in a short sentence, so to break it down:

- DOM: Create HTML DOM nodes with 'h' (and similar for SVG/MathML/etc).
- Signals: Automatically re-run bits of code when any observed signals change.
- Reactive: Create bits of code that easily and efficiently update the DOM.

Many similar tools exist, and this one is in extremely early development.
For production use you should look to [SolidJS](https://solidjs.com/) or
[Preact](https://preactjs.com/). I explored many different frameworks,
including the extensive list collected by
[krausest's js-framework-benchmark](https://krausest.github.io/js-framework-benchmark/).
Ultimately the core features that I actually need in a framework are quite
limited, so the best way to satisfy _my_ requirements is building from scratch.
