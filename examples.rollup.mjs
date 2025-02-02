import rollupPluginAlias from "@rollup/plugin-alias";
import rollupPluginNodeResolve from "@rollup/plugin-node-resolve";
import rollupPluginSwc from "@rollup/plugin-swc";
import rollupPluginTerser from "@rollup/plugin-terser";
import NodeFsPromise from "node:fs/promises";
import NodePath from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import NodeUtil from "node:util";
import NodeZlib from "node:zlib";
import * as Rollup from "rollup";

const projectDir = NodePath.resolve(import.meta.dirname);

const brotliCompress = NodeUtil.promisify(NodeZlib.brotliCompress);
const gzip = NodeUtil.promisify(NodeZlib.gzip);

/** @type {Rollup.RollupOptions} */
const defaultOptions = {
  plugins: [
    rollupPluginAlias({
      entries: {
        "@crlfe.ca/pumpkin": NodePath.join(projectDir, "src/index.ts"),
      },
    }),
    rollupPluginNodeResolve({
      extensions: [".ts"],
    }),
    rollupPluginSwc(),
    rollupPluginTerser({
      compress: {
        passes: 2,
      },
      mangle: {
        properties: {
          regex: "^_",
        },
      },
    }),
    reportBundleSize(),
  ],
};

export default Rollup.defineConfig(async () => {
  const builds = await findExampleBuilds();

  /** @type {Rollup.RollupOptions[]} */
  const configs = [];
  for (const [dist, input] of builds) {
    configs.push({
      ...defaultOptions,
      input,
      output: {
        dir: dist,
      },
    });
  }
  return configs;
});

/**
 * @returns {Promise<Map<string, Record<string,string>>>}
 */
async function findExampleBuilds() {
  const result = new Map();

  for await (const entry of await NodeFsPromise.opendir(
    NodePath.resolve(projectDir, "examples"),
    { recursive: true },
  )) {
    if (entry.isFile() && entry.name.endsWith(".html")) {
      const htmlPath = NodePath.resolve(entry.parentPath, entry.name);
      const htmlUrl = pathToFileURL(htmlPath);
      if (htmlUrl.pathname.includes("/dist/")) {
        continue; // This HTML is actually a compiled output.
      }

      const html = await NodeFsPromise.readFile(htmlPath, {
        encoding: "utf-8",
      });
      for (const m of html.matchAll(/(?<=<script\s[^>]*src=")[^">]+(?=")/g)) {
        const scriptUrl = new URL(m[0], htmlUrl);
        const distPos = scriptUrl.href.indexOf("/dist/");
        if (distPos < 0) {
          continue; // The script is not compiled.
        }

        // Chop out the "/dist/" and remove an assumed ".js" suffix.
        const sourcePrefix = fileURLToPath(
          scriptUrl.href.slice(0, distPos) +
            "/" +
            scriptUrl.href.slice(distPos + 6).replace(/\.js$/, "."),
        );

        const sourcePrefixDir = NodePath.dirname(sourcePrefix);
        const sourceCandidates = (await NodeFsPromise.readdir(sourcePrefixDir))
          .map((name) => NodePath.resolve(sourcePrefixDir, name))
          .filter(
            (name) =>
              name.startsWith(sourcePrefix) && name.match(/\.[cm]?[jt]sx?$/),
          );

        const friendlyScriptPath = () =>
          NodePath.relative(projectDir, fileURLToPath(scriptUrl));
        const sourcePath = sourceCandidates[0];
        if (!sourcePath) {
          throw new Error(
            `Unable to find a source file for ${JSON.stringify(friendlyScriptPath())}`,
          );
        }
        if (sourceCandidates.length > 1) {
          throw new Error(
            `Found ambiguous source files for ${JSON.stringify(friendlyScriptPath())}`,
          );
        }

        const distDir = fileURLToPath(scriptUrl.href.slice(0, distPos + 6));
        const scriptPath = fileURLToPath(scriptUrl);
        let rollupInput = result.get(distDir);
        if (!rollupInput) {
          rollupInput = {};
          result.set(distDir, rollupInput);
        }
        rollupInput[
          NodePath.relative(distDir, scriptPath).replace(/\.js$/, "")
        ] = sourcePath;
      }
    }
  }

  return result;
}

/**
 * @returns {Rollup.Plugin}
 */
function reportBundleSize() {
  return {
    name: "report-bundle-size",
    async writeBundle(_options, bundle) {
      let totalSize = 0;
      let gzipSize = 0;
      let brSize = 0;
      for (const item of Object.values(bundle)) {
        if (item.type === "chunk") {
          const data = Buffer.from(item.code);

          totalSize += data.length;
          gzipSize += (await gzip(data, { level: 9 })).length;
          brSize += (await brotliCompress(data)).length;
        }
      }
      console.log(
        `Total ${formatSize(totalSize)}`,
        `| gzip: ${formatSize(gzipSize)}`,
        `| br: ${formatSize(brSize)}`,
      );
      console.log();
    },
  };
}

/**
 * @param {number} sizeInBytes
 */
function formatSize(sizeInBytes) {
  if (sizeInBytes > 5e3) {
    return (sizeInBytes / 1e3).toFixed(2) + " KiB";
  } else {
    return sizeInBytes + " B";
  }
}
