"use strict";
const C = require("../util/crypto");

/* Creates the first admin and an optional preview code. Safe to run again. */
async function seed(db, cfg, log) {
  log = log || console.log;
  if (cfg.adminEmail && cfg.adminPassword) {
    const ex = await db.getUserByEmail(cfg.adminEmail);
    if (!ex) { await db.createUser({ email: cfg.adminEmail, name: "Admin", passHash: await C.hashPassword(cfg.adminPassword), role: "admin" }); log("Created admin " + cfg.adminEmail); }
    else if (ex.role !== "admin") { await db.updateUser(ex.id, { role: "admin" }); log("Promoted " + cfg.adminEmail + " to admin"); }
    else log("Admin " + cfg.adminEmail + " already exists");
  } else log("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env to create the first admin.");
  if (cfg.previewCode) {
    const code = cfg.previewCode.toUpperCase();
    if (!(await db.getCodeByCode(code))) { await db.createCode({ code, maxUses: 100000, note: "Preview code. Disable before launch." }); log("Created preview code " + code); }
  }
}
if (require.main === module) {
  const path = require("path"), { buildConfig, loadEnvFile } = require("../config");
  loadEnvFile(path.join(__dirname, "..", "..", ".env"));
  const cfg = buildConfig();
  require("../db/mongo").createMongoDb(cfg.mongoUri).then((db) => seed(db, cfg).then(() => db.close())).catch((e) => { console.error(e.message || e); process.exit(1); });
}
module.exports = { seed };
