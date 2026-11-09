/* The Cold Manual: namespace, storage, helpers, mini-markdown */
(function () {
  var OSI = window.OSI = window.OSI || {};
  OSI.P = []; OSI.L = []; OSI.M = []; OSI.PB = []; OSI.OBJ = []; OSI.CAD = []; OSI.SCR = []; OSI.TOOLS = []; OSI.SC = [];
  OSI.cfg = window.OSI_CFG || {};

  /* ---- storage (all keys prefixed, all calls guarded) ---- */
  var PRE = "osi_";
  OSI.store = {
    get: function (k, d) { try { var v = localStorage.getItem(PRE + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(PRE + k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del: function (k) { try { localStorage.removeItem(PRE + k); } catch (e) {} },
    all: function () {
      var o = {};
      try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf(PRE) === 0) o[k.slice(PRE.length)] = JSON.parse(localStorage.getItem(k)); } } catch (e) {}
      return o;
    },
    load: function (o) { Object.keys(o || {}).forEach(function (k) { OSI.store.set(k, o[k]); }); }
  };

  OSI.esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  };
  OSI.slug = function (s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); };

  /* inline: **bold**, *italic*, [text](#/route) or (https://...) */
  function inline(s) {
    s = OSI.esc(s);
    s = s.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
    s = s.replace(/(^|[^*])\*([^*]+)\*/g, "$1<i>$2</i>");
    s = s.replace(/\[([^\]]+)\]\((#[^)\s]+|https?:\/\/[^)\s]+)\)/g, function (m, t, u) {
      return '<a href="' + u + '"' + (u.charAt(0) === "#" ? "" : ' target="_blank" rel="noopener"') + ">" + t + "</a>";
    });
    return s;
  }
  OSI.inline = inline;

  /* block mini-markdown. ## heading, - bullets, 1. list, > note, !> warning, | tables, blank line = paragraph */
  OSI.md = function (src) {
    var lines = String(src).replace(/\r/g, "").split("\n"), out = [], i = 0, outline = [];
    function para(buf) { if (buf.length) out.push("<p>" + inline(buf.join(" ")) + "</p>"); }
    var buf = [];
    while (i < lines.length) {
      var ln = lines[i];
      if (/^\s*$/.test(ln)) { para(buf); buf = []; i++; continue; }
      var m;
      if ((m = ln.match(/^##\s+(.*)$/))) { para(buf); buf = []; var id = OSI.slug(m[1]); outline.push({ id: id, t: m[1] }); out.push('<h3 id="' + id + '">' + inline(m[1]) + "</h3>"); i++; continue; }
      if (/^[-*]\s+/.test(ln)) { para(buf); buf = []; var li = []; while (i < lines.length && /^[-*]\s+/.test(lines[i])) { li.push("<li>" + inline(lines[i].replace(/^[-*]\s+/, "")) + "</li>"); i++; } out.push("<ul>" + li.join("") + "</ul>"); continue; }
      if (/^\d+\.\s+/.test(ln)) { para(buf); buf = []; var ol = []; while (i < lines.length && /^\d+\.\s+/.test(lines[i])) { ol.push("<li>" + inline(lines[i].replace(/^\d+\.\s+/, "")) + "</li>"); i++; } out.push("<ol>" + ol.join("") + "</ol>"); continue; }
      if (/^!?>\s?/.test(ln)) {
        para(buf); buf = []; var warn = ln.charAt(0) === "!", nb = [];
        while (i < lines.length && /^!?>\s?/.test(lines[i])) { nb.push(lines[i].replace(/^!?>\s?/, "")); i++; }
        var head = nb.shift() || ""; out.push('<div class="callout' + (warn ? " warn" : "") + '"><b>' + inline(head) + "</b>" + (nb.length ? "<p>" + inline(nb.join(" ")) + "</p>" : "") + "</div>"); continue;
      }
      if (/^\|/.test(ln)) {
        para(buf); buf = []; var rows = [];
        while (i < lines.length && /^\|/.test(lines[i])) { rows.push(lines[i].replace(/^\||\|\s*$/g, "").split("|").map(function (c) { return c.trim(); })); i++; }
        var h = rows.shift(); if (rows.length && /^[-: ]+$/.test(rows[0].join(""))) rows.shift();
        out.push('<div class="tbl-wrap"><table class="tbl"><thead><tr>' + h.map(function (c) { return "<th>" + inline(c) + "</th>"; }).join("") + "</tr></thead><tbody>" +
          rows.map(function (r) { return "<tr>" + r.map(function (c) { return "<td>" + inline(c) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>"); continue;
      }
      buf.push(ln.trim()); i++;
    }
    para(buf);
    return { html: out.join("\n"), outline: outline };
  };

  /* annotated call: turns = [who, text, tag?, why?]; who "R" rep, "P" prospect */
  OSI.callHtml = function (c, names) {
    names = names || { R: "Rep", P: "Prospect" };
    var h = '<div class="call"><div class="call-head"><b>' + OSI.esc(c.title) + "</b><span>" + OSI.esc(c.meta || "") + "</span></div>";
    c.turns.forEach(function (t) {
      var who = t[0], why = t[2] ? '<div class="why"><span class="tag">' + OSI.esc(t[2]) + "</span><p>" + inline(t[3] || "") + "</p></div>" : "";
      h += '<div class="turn' + (who === "P" ? " them" : "") + '"><div class="line"><span class="who">' + OSI.esc(c.names ? c.names[who] : names[who]) + '</span><p class="say">' + inline(t[1]) + "</p></div>" + why + "</div>";
    });
    return h + "</div>";
  };

  /* data helpers used by data files */
  /* the order modules are studied in: the three offer modules first, then outreach to delivery */
  OSI.MOD_ORDER = [1, 14, 15, 2, 3, 4, 5, 6, 16, 7, 8, 9, 10, 11, 12, 13];
  OSI.modRank = function (p) { var i = OSI.MOD_ORDER.indexOf(p); return i < 0 ? 100 + p : i; };
  OSI.lessonSort = function (a, b) { return OSI.modRank(a.p) - OSI.modRank(b.p) || a.n - b.n; };
  OSI.prog = function (id, title, sub, blurb) { OSI.P.push({ id: id, title: title, sub: sub, blurb: blurb }); };
  OSI.lesson = function (o) { o.id = o.p + "." + o.n; OSI.L.push(o); };
  OSI.byId = function (id) { return OSI.L.filter(function (l) { return l.id === id; })[0]; };
})();
