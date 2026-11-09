/* WhatsApp and email help links, from window.OSI_CFG (written at build time from site-src/config.js) */
export function cfg() { return window.OSI_CFG || {}; }
export function waLink(text) {
  const n = String(cfg().whatsapp || "").replace(/\D/g, "");
  return n ? "https://wa.me/" + n + (text ? "?text=" + encodeURIComponent(text) : "") : "";
}
export function mailLink(subject, body) {
  const e = cfg().supportEmail || "";
  return e ? "mailto:" + e + "?subject=" + encodeURIComponent(subject || "") + (body ? "&body=" + encodeURIComponent(body) : "") : "";
}
