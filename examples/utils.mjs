import NodeFsPromises from "node:fs/promises";
import NodePath from "node:path";

/**
 * @returns {Promise<string[]>}
 */
export async function getExamples() {
  const root = import.meta.dirname;
  const examples = [];
  for await (const entry of await NodeFsPromises.opendir(root, {
    recursive: true,
  })) {
    const path = NodePath.join(entry.parentPath, entry.name);
    if (
      entry.isDirectory() &&
      (await canRead(NodePath.join(path, "app.ts"))) &&
      (await canRead(NodePath.join(path, "index.html")))
    ) {
      examples.push(NodePath.relative(root, path));
    }
  }
  return examples;
}

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
