"use strict";
const { HttpError, KV_KEY } = require("../util/misc");

async function all(ctx) { return { body: { data: await ctx.db.kvAll(ctx.user.id) } }; }
async function put(ctx) {
  const key = ctx.params.key; if (!KV_KEY.test(key)) throw new HttpError(400, "Invalid key.");
  if (key.startsWith("adm_")) throw new HttpError(403, "That entry is managed by the team.");
  const b = ctx.body || {}; if (!("value" in b)) throw new HttpError(400, "Send a value.");
  const json = JSON.stringify(b.value);
  if (json === undefined || Buffer.byteLength(json) > ctx.cfg.maxKvBytes) throw new HttpError(413, "That entry is too large.");
  if (!(await ctx.db.kvHas(ctx.user.id, key)) && (await ctx.db.kvCount(ctx.user.id)) >= ctx.cfg.maxKvKeys) throw new HttpError(409, "Too many saved entries.");
  await ctx.db.kvSet(ctx.user.id, key, b.value);
  return { body: { ok: true } };
}
async function del(ctx) { if (!KV_KEY.test(ctx.params.key)) throw new HttpError(400, "Invalid key."); if (ctx.params.key.startsWith("adm_")) throw new HttpError(403, "That entry is managed by the team."); await ctx.db.kvDel(ctx.user.id, ctx.params.key); return { body: { ok: true } }; }
async function reset(ctx) {
  if (!ctx.body || ctx.body.confirm !== "RESET") throw new HttpError(400, "Send confirm: RESET to erase your progress.");
  const keep = {}, all = await ctx.db.kvAll(ctx.user.id); Object.keys(all).forEach((k) => { if (k.startsWith("adm_")) keep[k] = all[k]; });
  await ctx.db.kvDelAll(ctx.user.id); for (const k of Object.keys(keep)) await ctx.db.kvSet(ctx.user.id, k, keep[k]);
  return { body: { ok: true } };
}
module.exports = { all, put, del, reset };
