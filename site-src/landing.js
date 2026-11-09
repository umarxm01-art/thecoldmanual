/* Sales page: fills counts, contents, method and tools from window.OSI_META (titles and counts only; lesson text stays behind the login),
   fills settings from window.OSI_CFG (empty settings stay hidden), and runs the founder video, WhatsApp links and the mobile buy bar. */
(function () {
  var O = window.OSI, M = window.OSI_META, C = window.OSI_CFG || {};
  function $(s) { return document.querySelector(s); }
  function each(sel, fn) { Array.prototype.forEach.call(document.querySelectorAll(sel), fn); }
  var counts = M.counts;
  var pays = (C.payMethods || []).filter(Boolean);
  C.payLine = C.manualPay && String(C.checkoutUrl || "").charAt(0) === "#" ? "Pay by JazzCash or bank transfer. The details are in the price section." : pays.length ? "Pay online with " + (pays.length > 1 ? pays.slice(0, -1).join(", ") + " or " + pays[pays.length - 1] : pays[0]) + "." : "Pay online with the button in the price section.";

  each("[data-count]", function (el) { var k = el.getAttribute("data-count"); if (counts[k] != null) el.textContent = counts[k]; });
  each("[data-cfg]", function (el) {
    var k = el.getAttribute("data-cfg");
    if (k === "applyLine") { if (C.applyUrl) { var a = document.createElement("a"); a.href = C.applyUrl; a.textContent = "Apply here."; el.textContent = ""; el.appendChild(a); } else if (C.whatsapp) { var w = document.createElement("a"); w.className = "wa-link"; w.setAttribute("data-wa-text", "Hi Umar, I'm interested in the done-with-you option for The Cold Manual."); w.href = "#"; w.textContent = "Message Umar on WhatsApp."; el.textContent = ""; el.appendChild(w); } else el.textContent = "Email us at the address in the questions below."; return; }
    var v = C[k] != null ? String(C[k]) : "";
    el.textContent = v;
    if (!v) el.hidden = true; else if (el.hasAttribute("hidden")) el.hidden = false;
  });
  var buy = $("#buy"); if (buy) buy.setAttribute("href", C.checkoutUrl || "#");

  /* manual payment: the buy button opens the account details */
  var pd = $("#pay-details"), mp = C.manualPay;
  if (pd && mp && String(C.checkoutUrl || "").charAt(0) === "#") {
    var rows = [["JazzCash", mp.jazzcash, 1], ["Bank", mp.bank], ["Account name", mp.accountName], ["IBAN", mp.iban, 1]].filter(function (r) { return r[1]; });
    $("#pay-rows").innerHTML = rows.map(function (r) { return "<div><dt>" + O.esc(r[0]) + "</dt><dd><span>" + O.esc(r[1]) + "</span>" + (r[2] ? '<button type="button" class="btn sm" data-copy="' + O.esc(r[1]) + '">Copy</button>' : "") + "</dd></div>"; }).join("");
    var pc = $("#pay-contact");
    if (C.whatsapp) { pc.textContent = "WhatsApp"; pc.href = "https://wa.me/" + String(C.whatsapp).replace(/\D/g, "") + "?text=" + encodeURIComponent("Hi, I paid for The Cold Manual. Here is my screenshot and my email address:"); pc.target = "_blank"; pc.rel = "noopener"; }
    else { pc.textContent = C.supportEmail || ""; pc.href = "mailto:" + (C.supportEmail || ""); }
    buy.addEventListener("click", function (e) { e.preventDefault(); pd.hidden = false; buy.hidden = true; if ($("#pay")) $("#pay").hidden = true; pd.focus({ preventScroll: true }); pd.scrollIntoView({ block: "nearest", behavior: "smooth" }); });
    if (location.hash === "#pay-details") { pd.hidden = false; buy.hidden = true; }
    pd.addEventListener("click", function (e) {
      var b = e.target.closest("[data-copy]"); if (!b) return;
      var v = b.getAttribute("data-copy"), done = function () { b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy"; }, 1500); };
      try { navigator.clipboard.writeText(v).then(done, function () { window.prompt("Copy this:", v); }); } catch (x) { window.prompt("Copy this:", v); }
    });
  }

  /* payment methods */
  if (pays.length && $("#pay")) { $("#pay-list").innerHTML = pays.map(function (p) { return "<li>" + O.esc(p) + "</li>"; }).join(""); $("#pay").hidden = false; }

  /* WhatsApp: every .wa-link opens a chat with a ready message; .wa-line blocks only show when a number is set */
  if (C.whatsapp) {
    var wa = "https://wa.me/" + String(C.whatsapp).replace(/\D/g, "") + (C.whatsappText ? "?text=" + encodeURIComponent(C.whatsappText) : "");
    var waBase = "https://wa.me/" + String(C.whatsapp).replace(/\D/g, "");
    each(".wa-link", function (a) { var t = a.getAttribute("data-wa-text"); a.href = t ? waBase + "?text=" + encodeURIComponent(t) : wa; a.target = "_blank"; a.rel = "noopener"; });
    each(".no-wa", function (s) { s.hidden = true; });
    each(".wa-line", function (s) { s.hidden = false; });
    var wf = $("#wa-float"); if (wf) wf.hidden = false;
  }

  /* founder photo and video */
  if (C.founderPhoto && $("#f-photo")) { var ph = $("#f-photo"); ph.src = C.founderPhoto; ph.hidden = false; }
  var vid = String(C.founderVideo || ""), box = $("#f-video");
  var yt = vid.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  if (box && vid) {
    if (yt) {
      var id = yt[1];
      box.innerHTML = '<button type="button" class="f-play" aria-label="Play the video from Umar"><img src="https://i.ytimg.com/vi/' + id + '/hqdefault.jpg" alt="" loading="lazy" width="480" height="360"><span class="f-play-btn" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M7 5v10l8-5z" fill="currentColor"/></svg></span><span class="f-play-label">Watch: why I built this</span></button>';
      box.querySelector("button").addEventListener("click", function () {
        box.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0" title="Umar on The Cold Manual" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
      });
    } else {
      box.innerHTML = '<video controls preload="none" playsinline' + (C.founderVideoPoster ? ' poster="' + O.esc(C.founderVideoPoster) + '"' : "") + ' src="' + O.esc(vid) + '"></video>';
    }
    box.hidden = false;
    if ($("#f-photo")) $("#f-photo").hidden = true; /* the video takes the photo's place */
    each(".watch", function (w) { w.hidden = false; });
  }
  if (!C.founderPhoto && !vid && $(".founder")) $(".founder").classList.add("text-only");

  /* comparison: on phones the table becomes one short block per row, built from the same table */
  var cmp = $("table.cmp");
  if (cmp) {
    var heads = Array.prototype.map.call(cmp.querySelectorAll("thead th"), function (th) { return th.textContent.trim(); });
    var cards = document.createElement("div"); cards.className = "cmp-cards";
    Array.prototype.forEach.call(cmp.querySelectorAll("tbody tr"), function (tr) {
      var cells = tr.querySelectorAll("td"), us = cells[cells.length - 1], others = [];
      for (var i = 0; i < cells.length - 1; i++) others.push("<li><span>" + O.esc(heads[i + 1]) + "</span>" + O.esc(cells[i].textContent.trim()) + "</li>");
      cards.insertAdjacentHTML("beforeend", "<div><h3>" + O.esc(tr.querySelector("th").textContent.trim()) + '</h3><p class="cc-us"><span>The Cold Manual</span>' + O.esc(us.textContent.trim()) + '</p><ul class="cc-others">' + others.join("") + "</ul></div>");
    });
    $(".cmp-scroll").insertAdjacentElement("afterend", cards);
  }

  /* real results only: hidden until config.js has entries */
  var proof = (C.proof || []).filter(function (x) { return x && x.n && x.label; });
  if (proof.length && $("#proof")) { $("#proof-list").innerHTML = proof.map(function (x) { return "<li><b>" + O.esc(x.n) + "</b><span>" + O.esc(x.label) + "</span></li>"; }).join(""); $("#proof").hidden = false; }
  var voices = (C.testimonials || []).filter(function (x) { return x && x.quote && x.name; });
  if (voices.length && $("#voices")) { $("#voice-list").innerHTML = voices.map(function (x) { return "<figure><blockquote>" + O.esc(x.quote) + "</blockquote><figcaption><b>" + O.esc(x.name) + "</b>" + (x.role ? "<span>" + O.esc(x.role) + "</span>" : "") + "</figcaption></figure>"; }).join(""); $("#voices").hidden = false; }

  /* contents grouped under the four pillars, plus running the business */
  var GROUPS = { "1": "Pillar 1: Offer", "2": "Pillar 2: Outreach", "7": "Pillar 3: Appointment setting", "8": "Pillar 4: Closing", "11": "Run and grow it" };
  var pl = $("#prog-list");
  var ORDER = [1, 14, 15, 2, 3, 4, 5, 6, 16, 7, 8, 9, 10, 11, 12, 13], rank = function (id) { var i = ORDER.indexOf(id); return i < 0 ? 100 + id : i; };
  if (pl) pl.innerHTML = M.programs.slice().sort(function (a, b) { return rank(a.id) - rank(b.id); }).map(function (p) { var g = GROUPS[String(p.id)]; return (g ? '<li class="grp">' + O.esc(g) + "</li>" : "") + '<li class="prog-row" data-m="' + p.id + '"><span class="n">' + p.id + '</span><div class="tt"><h3>' + O.esc(p.title) + "</h3><p>" + O.esc(p.blurb) + '</p></div><span class="ct">' + p.lessons + " lessons</span></li>"; }).join("");
  var ml = $("#method-list");
  /*METHOD*/
  if (ml) ml.innerHTML = METHOD.map(function (m) { return "<div><dt>" + O.esc(m[0]) + "</dt><dd>" + O.esc(m[1]) + "</dd></div>"; }).join("");
  var tl = $("#tool-list");
  if (tl) tl.innerHTML = M.tools.map(function (t) { return "<div><dt>" + O.esc(t.title) + "</dt><dd>" + O.esc(t.desc) + "</dd></div>"; }).join("");

  /* mobile buy bar: shows once the hero is off screen, hides while the price or the closing section is on screen */
  var bar = $("#buybar"), hero = $(".hero"), price = $("#price"), end = $("#start");
  if (bar && hero && "IntersectionObserver" in window) {
    var heroOut = false, priceIn = false, endIn = false, link = bar.querySelector("a");
    var upd = function () { var on = heroOut && !priceIn && !endIn; bar.classList.toggle("on", on); document.body.classList.toggle("bar-on", on); bar.setAttribute("aria-hidden", String(!on)); if (link) link.tabIndex = on ? 0 : -1; };
    new IntersectionObserver(function (e) { heroOut = !e[e.length - 1].isIntersecting; upd(); }).observe(hero);
    if (price) new IntersectionObserver(function (e) { priceIn = e[e.length - 1].isIntersecting; upd(); }).observe(price);
    if (end) new IntersectionObserver(function (e) { endIn = e[e.length - 1].isIntersecting; upd(); }).observe(end);
  }
})();
