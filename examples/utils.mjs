import NodeFsPromises from "node:fs/promises";

/**
 * @param {string} path
 */
export function canRead(path) {
  return NodeFsPromises.access(path, NodeFsPromises.constants.R_OK).then(
    () => true,
    () => false,
  );
}

/**
 * @param {{head?: string[];body?: string[]}} [options]
 */
export function generateHtml(options) {
  return [
    "<!DOCTYPE html>",
    "<html>",
    "<head>",
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width, initial-scale=1">`,
    ...(options?.head ?? []),
    "</head>",
    "<body>",
    ...(options?.body ?? []),
    "</body>",
    "</html>",
  ].join("");
}
