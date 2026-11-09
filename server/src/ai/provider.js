"use strict";
/* Calls the AI service. The key stays on the server. "sample" returns fixed answers, for the preview and for testing with no key. */
const TIMEOUT_MS = 30000;

async function post(fetchImpl, url, headers, body) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  try {
    const r = await fetchImpl(url, { method: "POST", headers: Object.assign({ "Content-Type": "application/json" }, headers), body: JSON.stringify(body), signal: ctl.signal });
    if (!r.ok) throw new Error("AI service returned " + r.status);
    return await r.json();
  } finally { clearTimeout(t); }
}

async function ask(ai, { system, prompt, maxTokens }, fetchImpl) {
  const f = fetchImpl || globalThis.fetch;
  if (ai.provider === "anthropic") {
    const j = await post(f, "https://api.anthropic.com/v1/messages", { "x-api-key": ai.apiKey, "anthropic-version": "2023-06-01" }, { model: ai.model, max_tokens: maxTokens, system, messages: [{ role: "user", content: prompt }] });
    return (j.content || []).filter((c) => c.type === "text").map((c) => c.text).join("");
  }
  if (ai.provider === "openai") {
    const j = await post(f, "https://api.openai.com/v1/chat/completions", { Authorization: "Bearer " + ai.apiKey }, { model: ai.model, max_completion_tokens: maxTokens, response_format: { type: "json_object" }, messages: [{ role: "system", content: system }, { role: "user", content: prompt }] });
    return j.choices && j.choices[0] && j.choices[0].message ? j.choices[0].message.content || "" : "";
  }
  throw new Error("Unknown AI provider");
}

/* tolerates a code fence or stray text around the object */
function parseJson(text) {
  const s = String(text || ""), a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a < 0 || b <= a) throw new Error("No JSON in the AI answer");
  const o = JSON.parse(s.slice(a, b + 1));
  if (!o || typeof o !== "object" || Array.isArray(o)) throw new Error("AI answer is not an object");
  return o;
}

/* fixed answers: they show how each screen works and never pretend to have read anything closely */
function sample(mode, b) {
  const first = (t) => String(t || "").split(/\n|(?<=[.!?])\s/).map((x) => x.trim()).filter(Boolean)[0] || "";
  if (mode === "review") return { summary: "Sample answer: this is where the AI says what is weakest and what works.", specific: "generic", specificNote: "Sample answer: the AI checks whether the detail fits only this prospect.", fixes: first(b.text) ? [{ quote: first(b.text), problem: "Sample answer: the problem with this line goes here.", fix: "Sample answer: better wording goes here." }] : [], rewrite: b.kind === "call" ? "" : "Hi [name],\n\n[One true detail about them.] [Their likely problem in one line.]\n\nHow do you handle that today?\n\n[Your name]" };
  if (mode === "roleplay") { const n = (b.transcript || []).filter((m) => m.role === "rep").length; return n > 4 ? { reply: "Look, I've got to run. Send me something short.", ended: true } : { reply: ["Who is this, and what's this about?", "We get a lot of these calls. Why would this be different?", "Maybe. What would you need from me?", "How much time would that take?"][Math.min(3, n - 1)] || "Go on.", ended: false }; }
  if (mode === "roleplay-score") { const mine = (b.transcript || []).filter((m) => m.role === "rep")[0]; return { score: 60, summary: "Sample answer: the real score reads your side of the conversation against the goal.", didWell: ["Sample answer: what went well."], fixes: mine ? [{ quote: first(mine.text), better: "Sample answer: what to say instead." }] : [], tip: "Sample answer: the one thing to try next." }; }
  if (mode === "score") { const scores = {}, notes = {}; (b.criteria || []).forEach((c, i) => { scores[c.k] = i % 3; notes[c.k] = "Sample answer: the reason for this score goes here."; }); return { scores, notes, summary: "Sample answer: these scores are fixed and do not reflect your text." }; }
  if (mode === "offer") return { weakest: "sure", verdict: "Sample answer: the AI says where a careful buyer would hesitate.", challenges: [{ field: "proof", problem: "Sample answer: why a buyer may not believe this.", question: "What can you show before they pay?" }], lines: ["Sample line: we help [who] get [result] within [time]."] };
  if (mode === "ask") return { answer: "Sample answer: the AI's short answer to this question goes here, based on the most related lessons. It is labelled as AI, and you can approve or edit it in Admin > Questions.", lessons: [], offTopic: false };
  if (mode === "fit") return { verdict: "maybe", reasons: ["Sample answer: the reason for the verdict goes here."], details: first(b.text) ? [{ line: "Sample line built from the detail you pasted.", source: first(b.text) }] : [] };
  if (mode === "reply") return { type: "unclear", meaning: "Sample answer: what the reply probably means goes here.", draft: "Thanks for replying, [name]. Sample answer: the draft goes here. [One question]?", ask: "Sample answer: the question to ask.", nextStage: "Replied", nextAction: "Answer their reply", dueDays: 0 };
  return {};
}

module.exports = { ask, parseJson, sample };
