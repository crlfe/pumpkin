import rollupPluginAlias from "@rollup/plugin-alias";
import rollupPluginSwc from "@rollup/plugin-swc";
import rollupPluginTerser from "@rollup/plugin-terser";
import NodeFsPromises from "node:fs/promises";
import NodePath from "node:path";
import NodeUtil from "node:util";
import NodeZlib from "node:zlib";
import * as Rollup from "rollup";

const brotliCompress = NodeUtil.promisify(NodeZlib.brotliCompress);
const gzip = NodeUtil.promisify(NodeZlib.gzip);

export default Rollup.defineConfig(async () => {
  const examples: string[] = [];
  for await (const entry of await NodeFsPromises.opendir(import.meta.dirname)) {
    const path = NodePath.join(entry.parentPath, entry.name);
    if (entry.isDirectory() && (await canRead(NodePath.join(path, "app.ts")))) {
      examples.push(path);
    }
  }

  return examples.map((root) => ({
    plugins: [
      rollupPluginAlias({
        entries: {
          "@crlfe.ca/pumpkin": NodePath.resolve(
            import.meta.dirname,
            "../dist/index.mjs",
          ),
        },
      }),
      rollupPluginSwc(),
      rollupPluginTerser({
        compress: {
          passes: 2,
        },
        mangle: {
          properties: {
            regex: "_$",
          },
        },
      }),
      reportBundleSize(),
    ],
    input: NodePath.join(root, "app.ts"),
    output: {
      dir: NodePath.join(root, "dist"),
    },
  }));
});

function canRead(path: string): Promise<boolean> {
  return NodeFsPromises.access(path, NodeFsPromises.constants.R_OK).then(
    () => true,
    () => false,
  );
}

function reportBundleSize(): Rollup.Plugin {
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

function formatSize(sizeInBytes: number) {
  if (sizeInBytes > 5000) {
    return (sizeInBytes / 1000).toFixed(2) + " kB";
  } else {
    return sizeInBytes + " B";
  }
}
