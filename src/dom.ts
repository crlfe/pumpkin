import { asArray, isArray, isFunction, isObject } from "./util";

type Child =
  | string
  | Node
  | ((elem: Element) => void | string | Node | (string | Node)[]);

/**
 * Create a new HTML Element with attributes and children.
 */
export const h = (
  name: string,
  attrs: Record<string, string>,
  children: Child[] = []
) => prepare(document.createElement(name), attrs, children);

/**
 * Create a new SVG Element with attributes and children.
 */
export const svg = (
  name: string,
  attrs: Record<string, string>,
  children: Child[] = []
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
  const rendered = children.flatMap((child) =>
    isFunction(child) ? asArray(child(elem)) : child
  );
  if (rendered.length) elem.replaceChildren(...rendered);
  return elem;
};

/**
 * Set or remove an attribute.
 *
 * Removes the attribute if the value is false, null or undefined.
 * Otherwise, the value will be converted to a string:
 * an object becomes a space-separated list of its properties with truthy values,
 * an array becomes sets a space-separated list of its elements, and
 * others as normal string coercion.
 */
export const updateAttribute = (
  elem: Element,
  name: string,
  value: unknown
): void => {
  if (value == null || value === false) {
    elem.removeAttribute(name);
  } else {
    elem.setAttribute(
      name,
      isObject(value)
        ? (isArray(value)
            ? value
            : Object.entries(value).flatMap(([k, v]) => (v ? [k] : []))
          ).join(" ")
        : value === true
        ? ""
        : String(value)
    );
  }
};
