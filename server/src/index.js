"use strict";
const path = require("path");
const { buildConfig, loadEnvFile } = require("./config");
loadEnvFile(path.join(__dirname, "..", ".env"));
const cfg = buildConfig();
const { loadContent } = require("./content");

async function main() {
  const content = loadContent(cfg.contentPath);
  let db;
  if (process.argv.includes("--memory")) {
    db = require("./db/memory").createMemoryDb();
    await require("./scripts/seed").seed(db, cfg, console.log);
    console.log("Running with the in-memory database. Data is lost when the server stops.");
  } else db = await require("./db/mongo").createMongoDb(cfg.mongoUri);
  const { createApp } = require("./app");
  const server = createApp({ db, cfg, content }).listen(cfg.port, () => console.log("The Cold Manual listening on http://localhost:" + cfg.port));
  const stop = () => server.close(() => db.close().then(() => process.exit(0)));
  process.on("SIGTERM", stop); process.on("SIGINT", stop);
}
main().catch((e) => { console.error(e.message || e); process.exit(1); });
