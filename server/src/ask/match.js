"use strict";
/* Finds the closest written answer to a member's question. No AI: plain word matching with weights, so it is free and predictable.
   Words are cleaned, Roman Urdu and everyday wording map onto the same words, and rare words count for more.
   A word the bank has never seen counts against the match, which is what keeps off-topic questions out. */

const STOP = new Set(("a an the is am are was were be been do does did i me my we our you your he she it they them their this that these those to of in on at for from with and or but if so as by " +
  "what how why when where which who whom can could should would will shall may might must have has had get got give want need please tell help know let make sure just really very any some about there here then than " +
  "go goes going went didnt didn't doesnt wont won't cant can't client clients prospect prospects customer owner owners lead leads person someone business businesses say says said saying told ask asks asked answer respond reply replies what's whats how's i'm im it's its don't dont doesn't " +
  /* Roman Urdu */
  "kya kia kaise kese kaisay kaise kyun kyu kyon mein main mai me ko ka ki ke ne se hai hain hay ho hun hoon tha thi the aur ya par pe per to bhi yeh ye wo woh is us un ap aap apna apni apne mujhe muje mera meri mere hum hamara agar toh kar karo karna karun karein krna kre kru koi kuch kitna kitni kitne bata batao btao raha rahi rahe wala wali").split(/\s+/));

/* every spelling on the left counts as the word on the right */
const SAME = {};
const add = (to, words) => words.split(/\s+/).forEach((w) => { SAME[w] = to; });
add("expensive", "mehnga mehenga mahanga mehngi costly pricey overpriced");
add("price", "pricing prices cost costs qeemat keemat kimat rate rates fee fees charge charges charging paisa paise pese");
add("send", "bhejna bhejun bhej bhejo bhejain emailing sending");
add("info", "information details detail tafseel maloomat brochure");
add("interested", "interest dilchaspi");
add("busy", "slammed masroof");
add("later", "baad afterwards");
add("think", "sochna sochun sochenge soch");
add("partner", "wife husband spouse cofounder");
add("email", "emails mail mails gmail inbox");
add("spam", "junk");
add("message", "dm dms messages msg pm paigham");
add("call", "calls calling dial dials dialing phone fone telephone");
add("voicemail", "vm");
add("meeting", "meetings appointment appointments booking book booked mulaqat");
add("first", "pehla pehli pehle");
add("offer", "offers package packages");
add("niche", "niches market markets industry industries");
add("list", "lists");
add("find", "dhundna dhundun dhoond talash searching search source");
add("sell", "selling bechna bechun bech sales sale pitch pitching");
add("nervous", "dar scared afraid fear ghabrahat anxious shy confidence confident");
add("english", "angrezi accent");
add("time", "waqt timing");
add("reject", "rejection rejected");
add("follow", "followup followups chasing chase");
add("ghost", "ghosted disappeared silent quiet vanish vanished");
add("noshow", "noshows");
add("objection", "objections");
add("write", "likhna likhun likho writing");
add("start", "shuru begin beginning starting begin");
add("proof", "testimonial testimonials reviews casestudy casestudies");
add("legal", "law laws illegal allowed rules rule compliance kanoon");
add("contract", "agreement agreements");
add("referral", "referrals introduction introductions intro");
add("video", "loom videos");
add("linkedin", "linked");
add("instagram", "insta ig");
add("facebook", "fb");
add("discount", "cheaper sasta sasti");
add("dental", "dentist dentists orthodontist orthodontists");
add("hvac", "plumber plumbers plumbing electrician electricians");
add("roofing", "roofer roofers roof");
add("realestate", "realtor realtors");
add("lawyer", "attorney attorneys lawyers");
add("salon", "salons barber barbers barbershop");
add("gym", "gyms");
add("mechanic", "mechanics");
add("vet", "vets veterinary veterinarian");
add("accountant", "accountants accounting");
add("msp", "msps");
add("ai", "chatgpt claude gemini");
add("usa", "america american americans");
add("chiropractor", "chiropractors chiropractic");

function stem(w) {
  if (w.length > 5 && w.endsWith("ing") && !/(thing|bring|string|spring)$/.test(w)) return w.slice(0, -3);
  if (w.length > 4 && w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.length > 4 && w.endsWith("ed")) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss")) return w.slice(0, -1);
  return w;
}
function tokens(text) {
  const norm = String(text || "").toLowerCase().replace(/case stud(y|ies)/g, "casestudy").replace(/follow[- ]ups?/g, "followup").replace(/no[- ]shows?|did ?n[o']?t show( up)?|did not show( up)?/g, "noshow").replace(/no repl(y|ies)|nobody (is )?repl\w+|not repl\w+|koi reply nahi|no responses?/g, "noreply").replace(/\bus (clients?|business\w*|owners?|numbers?|time|hours|market)\b/g, "usa $1").replace(/real estate/g, "realestate").replace(/cold[- ]calling/g, "call").replace(/[’']/g, "'");
  const out = [];
  norm.split(/[^a-z0-9'+]+/).forEach((raw) => {
    const w = raw.replace(/^'+|'+$/g, ""); if (!w || STOP.has(w)) return;
    const t = SAME[w] || stem(w.replace(/'s$/, "")); if (!t || STOP.has(t)) return;
    out.push(SAME[t] || t);
  });
  return [...new Set(out)];
}

/* entries: [{ id, q, alts: [] , k: "extra words" }] */
function buildIndex(entries) {
  const df = new Map();
  const docs = entries.map((e) => {
    const variants = [e.q].concat(e.alts || []).map((v) => new Set(tokens(v + " " + (e.k || "")).filter(Boolean)));
    const all = new Set(); variants.forEach((v) => v.forEach((t) => all.add(t)));
    all.forEach((t) => df.set(t, (df.get(t) || 0) + 1));
    return { e, variants };
  });
  const N = Math.max(1, entries.length), unseen = Math.log(1 + N) + 2.5;
  const idf = (t) => (df.has(t) ? Math.log(1 + N / df.get(t)) : unseen);
  return { docs, idf };
}

function scoreVariant(q, v, idf) {
  let hit = 0, all = 0, doc = 0;
  q.forEach((t) => { const w = idf(t); all += w; if (v.has(t)) hit += w; });
  v.forEach((t) => { doc += idf(t); });
  if (!all || !doc || !hit) return 0;
  return (hit / all) * (0.65 + 0.35 * (hit / doc));
}

const CLEAR = 0.6, PARTIAL = 0.34, GAP = 0.06;

/* returns { status: clear|partial|none, top: [{ e, score }] } */
function search(index, question, limit) {
  const q = tokens(question);
  if (!q.length) return { status: "none", top: [], words: 0 };
  const scored = index.docs.map((d) => ({ e: d.e, score: Math.max(...d.variants.map((v) => scoreVariant(q, v, index.idf) + (d.e.src === "added" && v.size === q.length && q.every((t) => v.has(t)) ? 0.1 : 0))) })).filter((x) => x.score > 0) /* an answer you added for this exact question beats older ones */.sort((a, b) => b.score - a.score);
  const best = scored[0];
  if (!best || best.score < PARTIAL) return { status: "none", top: [], words: q.length };
  const top = scored.filter((x) => x.score >= PARTIAL).slice(0, limit || 3);
  const clear = best.score >= CLEAR && (!scored[1] || best.score - scored[1].score >= GAP);
  return { status: clear ? "clear" : "partial", top, words: q.length };
}

module.exports = { tokens, buildIndex, search };
