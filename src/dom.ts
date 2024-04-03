type Child =
  | string
  | Node
  | ((elem: Element) => void | string | Node | (string | Node)[]);

export const h = (
  name: string,
  attrs: Record<string, string>,
  children: Child[]
) => prepare(document.createElement(name), attrs, children);

export const svg = (
  name: string,
  attrs: Record<string, string>,
  children: Child[]
) =>
  prepare(
    document.createElementNS("http://www.w3.org/2000/svg", name),
    attrs,
    children
  );

const prepare = <T extends Element>(
  elem: T,
  attrs: Record<string, string>,
  children: Child[]
) => {
  Object.entries(attrs).forEach(([k, v]) => updateAttribute(elem, k, v));
  elem.replaceChildren(
    ...children.flatMap((child) =>
      typeof child === "function" ? asArray(child(elem)) : child
    )
  );
  return elem;
};

const asArray = (
  value: void | string | Node | (string | Node)[]
): (string | Node)[] => {
  if (value == null) {
    return [];
  } else if (Array.isArray(value)) {
    return value;
  } else {
    return [value];
  }
};

const updateAttribute = (elem: Element, name: string, value: unknown): void => {
  if (value == null || value === false) {
    elem.removeAttribute(name);
  } else {
    elem.setAttribute(
      name,
      typeof value === "object"
        ? (Array.isArray(value)
            ? value
            : Object.entries(value).flatMap(([k, v]) => (v ? [k] : []))
          ).join(" ")
        : value === true
        ? ""
        : String(value)
    );
  }
};
