import { context } from "esbuild";
import { cp, mkdir, rm } from "node:fs/promises";

const watch = process.argv.includes("--watch");
const outdir = "dist";

const builds = [
  {
    entryPoints: ["src/service-worker/index.ts"],
    outfile: `${outdir}/service-worker/index.js`,
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "chrome116",
    sourcemap: true,
  },
  {
    entryPoints: ["src/content/index.ts"],
    outfile: `${outdir}/content/index.js`,
    bundle: true,
    format: "iife",
    platform: "browser",
    target: "chrome116",
    sourcemap: true,
  },
  {
    entryPoints: ["src/popup/index.tsx"],
    outfile: `${outdir}/popup/popup.js`,
    bundle: true,
    format: "iife",
    platform: "browser",
    target: "chrome116",
    jsx: "automatic",
    minify: !watch,
    define: {
      "process.env.NODE_ENV": watch ? '"development"' : '"production"',
    },
    sourcemap: true,
  },
];

async function copyStaticFiles() {
  await Promise.all([
    cp("src/manifest.json", `${outdir}/manifest.json`),
    cp("src/icons", `${outdir}/icons`, { recursive: true }),
    cp("src/popup/index.html", `${outdir}/popup/index.html`),
    cp("src/popup/popup.css", `${outdir}/popup/popup.css`),
  ]);
}

async function main() {
  await rm(outdir, { recursive: true, force: true });
  await mkdir(`${outdir}/popup`, { recursive: true });
  await copyStaticFiles();

  const contexts = await Promise.all(builds.map((options) => context(options)));

  if (watch) {
    await Promise.all(contexts.map((buildContext) => buildContext.watch()));
    console.log("Watching extension sources. Reload the extension after changes.");
    return;
  }

  try {
    await Promise.all(contexts.map((buildContext) => buildContext.rebuild()));
  } finally {
    await Promise.all(contexts.map((buildContext) => buildContext.dispose()));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
