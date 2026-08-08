import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { artifacts, loadTokens, pathFor } from "./yvl-artifacts.mjs";

for (const [path, content] of Object.entries(artifacts(await loadTokens()))) {
  const output = pathFor(path);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, content, "utf8");
  console.log(`Generated ${path}`);
}
