import { readdir, stat } from "node:fs/promises";

const directory = new URL("../.next/static/chunks/", import.meta.url);
const assets = [];
async function walk(url) { for (const name of await readdir(url)) { const child = new URL(name, url); const info = await stat(child); if (info.isDirectory()) await walk(new URL(`${name}/`, url)); else if (name.endsWith(".js")) assets.push({ name, bytes: info.size }); } }
await walk(directory);
const total = assets.reduce((sum, asset) => sum + asset.bytes, 0);
const largest = assets.sort((a, b) => b.bytes - a.bytes)[0];
const budget = 1_500_000;
console.log(`Client JavaScript: ${(total / 1024).toFixed(1)} KiB across ${assets.length} chunks; largest ${(largest.bytes / 1024).toFixed(1)} KiB (${largest.name}).`);
if (total > budget) { console.error(`Bundle budget exceeded: ${total} > ${budget} bytes.`); process.exit(1); }
