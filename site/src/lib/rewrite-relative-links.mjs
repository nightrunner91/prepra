import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, posix, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|#)/i;
const ANCHOR = /(<a\b[^>]*?\shref=")([^"]+)(")/gi;

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, acc);
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      acc.push(full);
    }
  }
  return acc;
}

/**
 * Rewrites docs-relative article links into base-prefixed absolute routes.
 *
 * Authors link between articles the way the files sit in the repo, e.g. from
 * `docs/vue/composition-api.md` to `../state-management/pinia.md`. On the built
 * site an article lives at `/{section}/{slug}/`, so those relative paths must be
 * resolved against the section root (`/{section}/`) rather than the page URL.
 * Rehype plugins cannot see the source file in Astro content collections, so the
 * rewrite happens once, on the emitted HTML, where the section is known.
 */
export default function rewriteRelativeLinks({ base = "/" } = {}) {
  const prefix = base.replace(/\/+$/, "");

  return {
    name: "rewrite-relative-links",
    hooks: {
      "astro:build:done": ({ dir }) => {
        const root = fileURLToPath(dir);

        for (const file of walk(root)) {
          const rel = relative(root, file).split(sep).join("/");
          const urlPath = "/" + rel.replace(/index\.html$/, "");
          const [section] = urlPath.split("/").filter(Boolean);
          if (!section) continue;

          const sectionRoot = `/${section}/`;

          const html = readFileSync(file, "utf8");
          const rewritten = html.replace(ANCHOR, (whole, pre, href, post) => {
            if (EXTERNAL.test(href)) return whole;

            const stripped = href.replace(/\.md(?=([?#]|$))/i, "");
            const hashIndex = stripped.search(/[?#]/);
            const pathPart =
              hashIndex >= 0 ? stripped.slice(0, hashIndex) : stripped;
            const suffix = hashIndex >= 0 ? stripped.slice(hashIndex) : "";

            if (!pathPart) return whole;

            const resolved = posix.normalize(posix.join(sectionRoot, pathPart));
            return `${pre}${prefix}${resolved}${suffix}${post}`;
          });

          if (rewritten !== html) writeFileSync(file, rewritten);
        }
      },
    },
  };
}
