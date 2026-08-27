import { readFile, readdir, stat } from "node:fs/promises";

const outputDirectory = new URL("../.next/", import.meta.url);
const appDirectory = new URL("server/app/", outputDirectory);
const defaultRouteBudget = 1_500_000;
const routeBudgets = new Map([
  // The isolated Pascal/Three runtime is intentionally loaded only by this route.
  ["/architecture", 5_250_000],
]);
const pages = [];

async function findHtmlPages(url) {
  for (const name of await readdir(url)) {
    const child = new URL(name, url);
    const info = await stat(child);
    if (info.isDirectory()) await findHtmlPages(new URL(`${name}/`, url));
    else if (name.endsWith(".html")) pages.push(child);
  }
}

function routeFromPage(page) {
  const relative = decodeURIComponent(page.pathname.slice(appDirectory.pathname.length));
  const withoutExtension = relative.replace(/\.html$/, "").replace(/\/index$/, "");
  return withoutExtension === "index" ? "/" : `/${withoutExtension}`;
}

await findHtmlPages(appDirectory);

let failed = false;
for (const page of pages.sort((a, b) => a.pathname.localeCompare(b.pathname))) {
  const html = await readFile(page, "utf8");
  const chunkPaths = [...new Set(html.match(/static\/chunks\/[^" ]+\.js/g) ?? [])];
  let bytes = 0;
  for (const chunkPath of chunkPaths) bytes += (await stat(new URL(chunkPath, outputDirectory))).size;

  const route = routeFromPage(page);
  const budget = routeBudgets.get(route) ?? defaultRouteBudget;
  console.log(`${route}: ${(bytes / 1024).toFixed(1)} KiB across ${chunkPaths.length} initial chunks (budget ${(budget / 1024).toFixed(1)} KiB).`);
  if (bytes > budget) {
    console.error(`Route bundle budget exceeded for ${route}: ${bytes} > ${budget} bytes.`);
    failed = true;
  }
}

if (failed) process.exit(1);
