import {
  bindChildrenMapped,
  bindEventListener,
  bindTextContent,
} from "../../src/reactive";
import { Signal, createSignal, h } from "../../src";
import { adjectives, colours, nouns } from "./words";

type Row = {
  id: number;
  label: Signal<string>;
};
const rows = createSignal<Row[]>([]);

const makeLabel = () =>
  [adjectives, colours, nouns]
    .map((xs) => xs[Math.floor(Math.random() * xs.length)])
    .join(" ");

let nextRowId = 1;
const makeRows = (length: number): Row[] =>
  Array.from({ length }, () => ({
    id: nextRowId++,
    label: createSignal(makeLabel()),
  }));

const menu = [
  [
    "run",
    "Create 1,000 rows",
    () => {
      rows.set(makeRows(1000));
    },
  ],
  [
    "runlots",
    "Create 10,000 rows",
    () => {
      rows.set(makeRows(10000));
    },
  ],
  [
    "add",
    "Append 1,000 rows",
    () => {
      rows.set((rows) => rows.concat(makeRows(1000)));
    },
  ],
  [
    "clear",
    "Clear",
    () => {
      rows.set([]);
    },
  ],
  [
    "update",
    "Update every 10th row",
    () => {
      rows.get().forEach((row, i) => {
        if (i % 10 === 0) {
          row.label.set((x) => x + " !!!");
        }
      });
    },
  ],
  [
    "swaprows",
    "Swap Rows",
    () => {
      rows.set((rows) => {
        const next = rows.slice();
        if (next.length > 998) {
          const t = next[1];
          next[1] = next[998];
          next[998] = t;
        }
        return next;
      });
    },
  ],
] satisfies [string, string, EventListener][];

document.getElementById("main")!.replaceChildren(
  h("div", { class: "container" }, [
    h("div", { class: "jumbotron" }, [
      h("div", { class: "row" }, [
        h("div", { class: "col-md-6" }, [h("h1", {}, ["Pumpkin"])]),
        h("div", { class: "col-md-6" }, [
          h(
            "div",
            { class: "row" },
            menu.map(([id, label, handler]) =>
              h("div", { class: "col-sm-6 smallpad" }, [
                h("button", { class: "btn btn-primary btn-block", id }, [
                  bindEventListener("click", handler),
                  label,
                ]),
              ])
            )
          ),
        ]),
      ]),
    ]),
    h("table", { class: "table table-hover table-striped test-data" }, [
      bindChildrenMapped(rows.get, (row) =>
        h("tr", {}, [
          h("td", {}, [row.id.toString()]),
          h("td", {}, [bindTextContent(row.label.get)]),
          h("td", {}, ["X"]),
        ])
      ),
    ]),
  ])
);
