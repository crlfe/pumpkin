import {
  createEffect,
  createSignal,
  Effect,
  onCleanup,
  saveEffectScope,
  Signal,
} from "@crlfe.ca/pumpkin";

import { adjectives, colours, nouns } from "./words";

interface Row {
  id: number;
  label: Signal<string>;
}

const rows = createSignal<Row[]>([]);
const selectedRow = createSignal<number>(-1);
const rowSelected = new Map<number, Signal<boolean>>();

let lastSelectedRow = -1;
createEffect(() => {
  const nextSelectedRow = selectedRow.get();
  if (lastSelectedRow !== nextSelectedRow) {
    rowSelected.get(lastSelectedRow)?.set(false);
    rowSelected.get(nextSelectedRow)?.set(true);
    lastSelectedRow = nextSelectedRow;
  }
});

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

const selectRow = (id: number) => {
  selectedRow.set(id);
};

const deleteRow = (id: number) => {
  rows.set(rows.get().filter((curr) => curr.id !== id));
};

const appTemplate = document.createElement("template");
appTemplate.innerHTML = [
  `<div class="container">`,
  `<div class="jumbotron">`,
  `<div class="row">`,
  `<div class="col-md-6"><h1>Pumpkin</h1></div>`,
  `<div class="col-md-6" id="menu"></div>`,
  `</div>`,
  `</div>`,
  `<table class="table table-hover table-striped test-data">`,
  `<tbody id="tbody"></tbody>`,
  `</table>`,
  `</div>`,
].join("");
document.body.append(appTemplate.content);

const menu: Record<string, [string, EventListener]> = {
  run: [
    "Create 1,000 rows",
    () => {
      rows.set(makeRows(1000));
    },
  ],
  runlots: [
    "Create 10,000 rows",
    () => {
      rows.set(makeRows(10000));
    },
  ],
  add: [
    "Append 1,000 rows",
    () => {
      rows.set(rows.get().concat(makeRows(1000)));
    },
  ],
  clear: [
    "Clear",
    () => {
      rows.set([]);
    },
  ],
  update: [
    "Update every 10th row",
    () => {
      rows.get().forEach((row, i) => {
        if (i % 10 === 0) {
          row.label.update((t) => t + " !!!");
        }
      });
    },
  ],
  swaprows: [
    "Swap Rows",
    () => {
      const next = rows.get().slice();
      if (next.length > 998) {
        const t = next[1]!;
        next[1] = next[998]!;
        next[998] = t;
      }
      rows.set(next);
    },
  ],
};

const menuTemplate = document.createElement("template");
menuTemplate.innerHTML = [
  `<div class="row">`,
  `<div class="col-sm-6 smallpad">`,
  `<button class="btn btn-primary btn-block"></button>`,
  `</div>`,
  `</div>`,
].join("");

document.getElementById("menu")?.replaceChildren(
  ...Object.entries(menu).map(([id, [name, callback]]) => {
    const nodes = menuTemplate.content.cloneNode(true) as DocumentFragment;
    const button =
      nodes.firstElementChild!.firstElementChild!.firstElementChild!;
    button.setAttribute("id", id);
    button.addEventListener("click", callback);
    button.textContent = name;
    return nodes;
  }),
);

const rowTemplate = document.createElement("template");
rowTemplate.innerHTML = [
  `<tr>`,
  `<td class="col-md-1"></td>`,
  `<td class="col-md-4"><a></a></td>`,
  `<td class="col-md-1">`,
  `<a><span class="glyphicon glyphicon-remove" aria-hidden="true"></span></a>`,
  `</td>`,
  `<td class="col-md-6"></td>`,
  `</tr>`,
].join("");

const tbody = document.getElementById("tbody");
if (tbody) {
  const mapFn = saveEffectScope((row: Row) => {
    let tr: Element;
    const effect = createEffect(() => {
      const { id, label } = row;

      tr = (rowTemplate.content.cloneNode(true) as DocumentFragment)
        .firstElementChild!;
      const td0 = tr.firstElementChild!;
      const td1 = td0.nextElementSibling!;
      const td2 = td1.nextElementSibling!;
      const a1 = td1.firstElementChild!;
      const a2 = td2.firstElementChild!;

      td0.textContent = String(id);

      const thisRowSelected = createSignal(false);
      rowSelected.set(id, thisRowSelected);
      onCleanup(rowSelected.delete.bind(rowSelected, id));

      createEffect(() => {
        if (thisRowSelected.get()) {
          tr.setAttribute("class", "danger");
        } else {
          tr.removeAttribute("class");
        }
      });

      createEffect(() => {
        a1.textContent = label.get();
      });

      const a1Listener = selectRow.bind(selectRow, id);
      const a2Listener = deleteRow.bind(deleteRow, id);
      a1.addEventListener("click", a1Listener);
      a2.addEventListener("click", a2Listener);

      onCleanup(() => {
        a1.removeEventListener("click", a1Listener);
        a2.removeEventListener("click", a2Listener);
      });
    });
    return [tr!, effect] as const;
  });

  let lastItems: Row[] = [];
  let lastNodes: (readonly [Node, Effect])[] = [];
  createEffect(() => {
    const nextItems = rows.get();
    const nextNodes = new Array<readonly [Node, Effect]>(nextItems.length);

    const moved = new Array<boolean>(lastNodes.length);

    const nextEnd = nextItems.length;
    const lastEnd = lastItems.length;

    let next = 0;
    let last = 0;

    let stateByItem: Map<Row, [Node, Effect, number]> | undefined;
    const getStateByItem = (row: Row): [Node, Effect, number] | undefined => {
      stateByItem ??= new Map(
        lastItems.map((row, i) => [row, [...lastNodes[i]!, i]]),
      );
      return stateByItem.get(row);
    };

    // TODO: Optimize, generalize, extract to library.

    const removed = new Set<number>();

    while (next < nextEnd && last < lastEnd) {
      if (moved[last]) {
        last++;
      } else if (nextItems[next] === lastItems[last]) {
        nextNodes[next] = lastNodes[last]!;
        next++;
        last++;
      } else {
        const state = getStateByItem(nextItems[next]!);
        if (state) {
          if (state[2] === last + 1) {
            tbody.removeChild(lastNodes[last]![0]);
            removed.add(last);
            last++;
          } else {
            moved[state[2]] = true;
            removed.delete(state[2]);
            tbody.insertBefore(state[0], lastNodes[last]![0]);
            nextNodes[next] = [state[0], state[1]];
            next++;
          }
        } else {
          const row = nextItems[next]!;
          const node = mapFn(row);
          tbody.insertBefore(node![0], lastNodes[last]![0]);
          nextNodes[next] = node!;
          next++;
        }
      }
    }

    removed.forEach((i) => {
      lastNodes[i]![1].return_();
    });

    if (next < nextEnd) {
      tbody.append(
        ...nextItems.slice(next).map((row, i) => {
          const node = mapFn(row);
          nextNodes[next + i] = node;
          return node[0];
        }),
      );
    }
    if (last < lastEnd) {
      while (last < lastEnd) {
        const node = lastNodes[last++]!;
        node[1].return_();
        tbody.removeChild(node[0]);
      }
    }

    lastItems = nextItems;
    lastNodes = nextNodes;
  });
}
