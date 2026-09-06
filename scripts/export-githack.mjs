import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, renameSync, cpSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const api = join(root, "app/api");
const tmp = join(root, ".api-export-tmp");
const catalogSrc = join(root, "data/demo-catalog.json");
const catalogDestDir = join(root, "public/data");

mkdirSync(catalogDestDir, { recursive: true });
cpSync(catalogSrc, join(catalogDestDir, "demo-catalog.json"));

if (existsSync(api)) renameSync(api, tmp);

const env = {
  ...process.env,
  STATIC_CDN: "https://raw.githack.com/AgmAtk03/agmplay/live-demo",
  NEXT_PUBLIC_ASSET_PREFIX: "https://raw.githack.com/AgmAtk03/agmplay/live-demo",
  NEXT_PUBLIC_STATIC_PAGES: "1",
};

try {
  const result = spawnSync("npx", ["next", "build"], {
    stdio: "inherit",
    env,
    cwd: root,
  });
  process.exit(result.status ?? 1);
} finally {
  if (existsSync(tmp)) renameSync(tmp, api);
}
