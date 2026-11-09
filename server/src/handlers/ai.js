"use strict";
/* POST /api/ai: one route for every AI feature. Usage is counted in "adm_ai", which only the server can write and which survives a progress reset. */
const { HttpError } = require("../util/misc");
const { RULES, MODES } = require("../ai/prompts");
const { ask, parseJson, sample } = require("../ai/provider");

const on = (cfg) => !!(cfg.ai && cfg.ai.enabled);
const stamp = (t) => { const d = new Date(t).toISOString(); return { day: d.slice(0, 10), month: d.slice(0, 7) }; };
async function usage(ctx) {
  const u = (await ctx.db.kvAll(ctx.user.id)).adm_ai || {}, s = stamp(ctx.now());
  return { day: s.day, month: s.month, d: u.day === s.day ? +u.d || 0 : 0, m: u.month === s.month ? +u.m || 0 : 0 };
}
const left = (cfg, u) => Math.max(0, Math.floor(Math.min(cfg.ai.dailyLimit - u.d, cfg.ai.monthlyLimit - u.m)));
const save = (ctx, u) => ctx.db.kvSet(ctx.user.id, "adm_ai", { day: u.day, d: u.d, month: u.month, m: u.m });

async function status(ctx) {
  if (!on(ctx.cfg)) return { body: { enabled: false } };
  return { body: { enabled: true, sample: ctx.cfg.ai.provider === "sample", left: left(ctx.cfg, await usage(ctx)) } };
}

const busy = new Set();
async function run(ctx) {
  const cfg = ctx.cfg;
  if (!on(cfg)) throw new HttpError(404, "AI help is not switched on.");
  const b = ctx.body || {}, mode = MODES[b.mode];
  if (!mode || !Object.prototype.hasOwnProperty.call(MODES, b.mode)) throw new HttpError(400, "Unknown AI request.");
  const built = mode.build(ctx, b), isSample = cfg.ai.provider === "sample";
  if (built.local) return { body: Object.assign({}, built.local, { local: true, left: left(cfg, await usage(ctx)) }) }; /* answered by a fixed rule, so it costs nothing */
  if (busy.has(ctx.user.id)) throw new HttpError(429, "Still working on your last request. Try again in a moment.");
  busy.add(ctx.user.id);
  try {
    const u = await usage(ctx);
    if (Math.min(cfg.ai.dailyLimit - u.d, cfg.ai.monthlyLimit - u.m) < (mode.weight || 1)) throw new HttpError(429, u.m >= cfg.ai.monthlyLimit ? "You've used this month's AI checks. They reset next month." : "You've used today's AI checks. They reset tomorrow.");
    let result;
    try {
      const raw = isSample ? sample(b.mode, b) : parseJson(await ask(cfg.ai, { system: RULES, prompt: built.prompt, maxTokens: mode.maxTokens }, cfg.ai.fetch));
      result = mode.check(raw, built.input);
    } catch (e) {
      console.error("[ai] " + b.mode + ": " + (e && e.message));
      throw new HttpError(503, "The AI service didn't answer properly. Nothing was counted. Try again.");
    }
    const weight = mode.weight || 1; u.d = +(u.d + weight).toFixed(2); u.m = +(u.m + weight).toFixed(2); await save(ctx, u);
    if (mode.after) await mode.after(ctx, built, result, isSample);
    return { body: Object.assign(result, { sample: isSample, left: left(cfg, u) }) };
  } finally { busy.delete(ctx.user.id); }
}

module.exports = { status, run };
