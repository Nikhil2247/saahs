/**
 * scripts/copy-standalone-assets.mjs
 *
 * `next build` with `output: "standalone"` intentionally does NOT copy
 * `public/` or `.next/static/` into `.next/standalone/` — see
 * https://nextjs.org/docs/app/api-reference/config/next-config-js/output
 *
 * Without this step, `.next/standalone/server.js` serves pages fine but every
 * request for a CSS/JS chunk, font, or file under `public/` 404s, because
 * those directories simply aren't next to server.js. Runs automatically as
 * the `postbuild` script (see package.json) after every `next build`.
 */

import { cpSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const standalone = join(root, ".next", "standalone");

if (!existsSync(standalone)) {
  console.error(
    "[copy-standalone-assets] .next/standalone not found — did `next build` run with output: 'standalone'?"
  );
  process.exit(1);
}

const copies = [
  [join(root, "public"), join(standalone, "public")],
  [join(root, ".next", "static"), join(standalone, ".next", "static")],
];

for (const [src, dest] of copies) {
  if (!existsSync(src)) {
    console.warn(`[copy-standalone-assets] skipping missing source: ${src}`);
    continue;
  }
  cpSync(src, dest, { recursive: true });
  console.log(`[copy-standalone-assets] copied ${src} -> ${dest}`);
}
