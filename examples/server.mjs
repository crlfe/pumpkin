import serveStatic from "serve-static";
import NodeFsPromises from "node:fs/promises";
import NodeHttp from "node:http";
import NodePath from "node:path";
import { canRead, generateHtml } from "./utils.mjs";

const staticHandler = serveStatic(import.meta.dirname);

/**
 * @typedef {NodeHttp.IncomingMessage} Request
 * @typedef {NodeHttp.ServerResponse<Request>&{req:Request}} Response
 */
const server = NodeHttp.createServer(async (req, res) => {
  if (req.url === "/") {
    writeHtml(res, await getExamplesIndex());
  } else {
    staticHandler(req, res, (err) => {
      writeError(res, err?.status ?? 404);
    });
  }
});

async function getExamplesIndex() {
  const examples = [];
  for await (const entry of await NodeFsPromises.opendir(import.meta.dirname)) {
    const path = NodePath.join(entry.parentPath, entry.name);
    if (entry.isDirectory() && (await canRead(NodePath.join(path, "app.ts")))) {
      examples.push(entry.name);
    }
  }
  examples.sort();

  return generateHtml({
    body: [
      "<ul>",
      ...examples.map((name) => `<li><a href="${name}">${name}</a></li>`),
      "</ul>",
    ],
  });
}

/**
 * @param {Response} res
 * @param {string} html
 */
function writeHtml(res, html) {
  res
    .writeHead(200, {
      "Content-Type": "text/html",
      "Content-Length": html.length,
    })
    .end(html);
}

/**
 * @param {Response} res
 * @param {number} status
 */
function writeError(res, status) {
  res
    .writeHead(status, { "Content-Type": "text/plain" })
    .end(NodeHttp.STATUS_CODES[status]);
}

server.on("listening", () => {
  let address = server.address();
  if (typeof address === "object" && address !== null) {
    address = `http://${address.address}:${address.port}/`;
  }
  console.log("Listening at", address);
});
server.listen(8080, "localhost");
