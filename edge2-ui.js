/* Edge UI 2 (t585u): scenario engine, crowd-positioning radar, analyst accuracy, hidden demand signals, SEC filing language changes, twin-stock analogs, 0-7 DTE SPY intraday dashboard.
   Data: window.SCEN, CROWD, ANALYST, DEMAND, FILINGS, ANALOGS, INTRA. Real data only; anything missing reads "insufficient data" / "not available free". */
(function () {
  "use strict";
  window.EDGE2UI_INIT = function () {
    var X = window.EDGEUI, h = X.h, esc = h.esc, nn = h.nn, pc = h.pc, pp = h.pp, cls = h.cls, tk = h.tk, chip = h.chip, tbl = h.tbl, lims = h.lims, head = h.head, ID = h.ID;
    var HOLD = ["SEZL", "MU", "CRDO", "PLTR"];
    function ord(names) { return names.slice().sort(function (a, b) { var A = HOLD.indexOf(a) >= 0 ? 0 : 1, B = HOLD.indexOf(b) >= 0 ? 0 : 1; return A - B; }); }
    function hb(t) { return HOLD.indexOf(t) >= 0 ? " " + chip("holding", "sc") : ""; }
    function dim(s) { return '<div class="r6-dim">' + s + "</div>"; }
    function box(t, c) { return '<div class="r6-box"' + (c ? ' style="border-color:' + c + '"' : "") + ">" + t + "</div>"; }
    function f0(x, d) { return x == null || x !== x ? ID : Number(x).toFixed(d == null ? 0 : d); }
    function usd(x) { return x == null ? ID : "$" + Math.round(x).toLocaleString(); }
    function spark(a, w, hh, col) {
      if (!a || a.length < 2) return ""; w = w || 110; hh = hh || 26; var mn = Math.min.apply(null, a), mx = Math.max.apply(null, a); if (mx === mn) mx = mn + 1;
      return '<svg width="' + w + '" height="' + hh + '" viewBox="0 0 ' + w + " " + hh + '" style="vertical-align:middle"><polyline fill="none" stroke="' + (col || "#5a8ce6") + '" stroke-width="1.5" points="' + a.map(function (v, i) { return (i / (a.length - 1) * (w - 2) + 1).toFixed(1) + "," + (hh - 2 - (v - mn) / (mx - mn) * (hh - 4)).toFixed(1); }).join(" ") + '"/></svg>';
    }
    /* ================= 1. scenario engine ================= */
    var S2 = { preset: "nvda", spy: "", vix: "", src: "NVDA", srcPct: "-10", fed: "", h: 1, lvl: 80, imp: true, fedHold: false };
    function applyPreset(id) {
      var P = window.SCEN.presets.filter(function (p) { return p.id === id; })[0]; if (!P) return; S2.preset = id;
      S2.spy = P.spy == null ? "" : String(P.spy); S2.vix = P.vix == null ? "" : String(P.vix); var k = Object.keys(P.src || {}); S2.src = k[0] || "NVDA"; S2.srcPct = k[0] ? String(P.src[k[0]]) : ""; S2.fed = P.fomc || "";
    }
    function calc() {
      var C = window.SCEN, z = S2.lvl === 95 ? 1.96 : 1.2816, s = S2.spy === "" ? null : parseFloat(S2.spy), L = S2.vix === "" ? null : parseFloat(S2.vix), x = S2.srcPct === "" ? null : parseFloat(S2.srcPct), hw = S2.h;
      var vb = C.vixOnSpy.b, impliedSpy = false, dlv;
      if (L != null && L > 0) { dlv = Math.log(L / C.vix0); if (s == null) { if (S2.imp) { s = C.spyOnVix.a * 0 + C.spyOnVix.b * dlv; impliedSpy = true; } else s = 0; } }
      else { if (s == null) s = 0; dlv = vb * s; }
      var vres = dlv - vb * s, vixImplied = C.vix0 * Math.exp(dlv), rows = [];
      C.focus.forEach(function (t) {
        var n = C.names[t]; if (!n || n.status !== "ok") { rows.push({ t: t, bad: n ? n.why : "no model" }); return; }
        var mk = n.spy.b * s, vx = n.vix.b * vres, sr = 0, srcv = 0, srcRow = null, ev = null;
        if (x != null && S2.src && n.src[S2.src]) {
          var sc = n.src[S2.src], res = x - sc.sBeta * s; sr = sc.b * res; srcv = Math.pow(sc.se * res, 2); srcRow = sc;
          if (sc.event && sc.event.b != null) ev = { v: sc.event.b * x, sd: sc.event.resSd, n: sc.event.n, corr: sc.event.corr };
        }
        var fd = null; if (S2.fed && n.fomc && n.fomc[S2.fed] && n.fomc[S2.fed].meanAdj != null) fd = { m: n.fomc[S2.fed].meanAdj, sd: n.fomc[S2.fed].sd, n: n.fomc[S2.fed].n };
        var fdBad = S2.fed && !fd;
        var tot = mk + vx + sr + (fd ? fd.m : 0);
        var v = n.resSd * n.resSd * hw + Math.pow(n.spy.se * s, 2) + Math.pow(n.vix.se * vres, 2) + srcv + (fd ? fd.sd * fd.sd : 0), sd = Math.sqrt(v);
        rows.push({ t: t, n: n, mk: mk, vx: vx, sr: sr, fd: fd, fdBad: fdBad, tot: tot, sd: sd, lo: tot - z * sd, hi: tot + z * sd, ev: ev, srcRow: srcRow });
      });
      return { s: s, impliedSpy: impliedSpy, dlv: dlv, vres: vres, vixImplied: vixImplied, rows: rows, z: z, x: x, L: L };
    }
    function scenOut() {
      var C = window.SCEN, R = calc(), SC = window.SCOUT && window.SCOUT.sources.holdings_drift.concentration, out = "";
      out += '<div class="e-kpi"><div><span class="r6-dim">SPY move applied</span><b class="' + cls(R.s) + '">' + pc(R.s, 1) + '</b>' + (R.impliedSpy ? dim("implied by the VIX change") : "") + '</div><div><span class="r6-dim">VIX</span><b>' + nn(C.vix0, 1) + " → " + nn(R.vixImplied, 1) + "</b>" + dim("residual beyond SPY: " + (R.vres >= 0 ? "+" : "") + nn(R.vres * 100, 0) + "% log") + '</div><div><span class="r6-dim">Horizon / range</span><b>' + S2.h + " wk · " + S2.lvl + "%</b></div></div>";
      var okr = R.rows.filter(function (r) { return r.n; });
      out += tbl(["Name", "Scenario impact", S2.lvl + "% range", "Market (SPY beta)", "Vol (VIX)", "Source shock", "Fed day", "Earnings-reaction model", "Model quality"], R.rows.map(function (r) {
        if (!r.n) return "<tr><td>" + tk(r.t) + hb(r.t) + "</td><td colspan=8 class=r6-dim>" + ID + ": " + esc(r.bad || "") + "</td></tr>";
        return "<tr" + (HOLD.indexOf(r.t) >= 0 ? ' class="hold"' : "") + "><td>" + tk(r.t) + hb(r.t) + dim("β " + nn(r.n.spy.b, 2) + " ± " + nn(r.n.spy.se, 2)) + '</td><td class="n ' + cls(r.tot) + '"><b>' + pc(r.tot, 1) + '</b></td><td class=n>' + pc(r.lo, 0) + " to " + pc(r.hi, 0) + "</td><td class=n>" + pc(r.mk, 1) + '</td><td class=n>' + pc(r.vx, 1) + "</td><td class=n>" + (r.srcRow ? pc(r.sr, 1) + dim("β " + nn(r.srcRow.b, 2) + " ± " + nn(r.srcRow.se, 2) + " (resid.)") : (R.x != null && S2.src ? '<span class=r6-dim>no link to ' + esc(S2.src) + "</span>" : "–")) + "</td><td class=n>" + (r.fd ? pc(r.fd.m, 1) + dim("n=" + r.fd.n + ", sd " + nn(r.fd.sd, 1)) : r.fdBad ? '<span class=r6-dim>' + ID + "</span>" : "–") + "</td><td class=n>" + (r.ev ? pc(r.ev.v, 1) + dim("n=" + r.ev.n + ", corr " + nn(r.ev.corr, 2) + ", ±" + nn(r.ev.sd * (R.z), 1)) : (r.srcRow ? '<span class=r6-dim>' + ID + "</span>" : "–")) + "</td><td class=n>R² " + nn(r.n.r2, 2) + dim(r.n.n + " weeks" + (r.n.lowN ? ", low n" : "") + (r.n.oos ? ", OOS cover " + r.n.oos.coverage80 + "%" : "")) + "</td></tr>";
      }));
      // empirical comparator
      if (Math.abs(R.s) >= 3) {
        var key = R.s <= -3 ? "spyDown3" : "spyUp3";
        out += '<p class="r6-note"><b>Empirical check (weeks with SPY ' + (R.s <= -3 ? "≤ −3%" : "≥ +3%") + ", last 5 years):</b> " + okr.map(function (r) { var e = r.n.empirical[key]; return tk(r.t) + " " + (e.mean != null ? pc(e.mean, 1) + " avg (n=" + e.n + (e.p10 != null ? ", 10th–90th " + pc(e.p10, 0) + " to " + pc(e.p90, 0) : "") + ")" : ID + " (n=" + e.n + ")"); }).join(" · ") + ".</p>";
      }
      // known-dollar portfolio
      if (SC && SC.marked_to_latest_close) {
        var held = ["PLTR", "MU", "CRDO"], by = SC.marked_to_latest_close.by_ticker, cm = SC.corr_60d_daily_returns, tot = 0, w = [], sds = [], ok = true;
        held.forEach(function (t) { var r = R.rows.filter(function (x) { return x.t === t; })[0]; if (!r || !r.n) { ok = false; return; } var u = by[t].usd; tot += u * r.tot / 100; w.push(u); sds.push(r.sd / 100); });
        if (ok) {
          var v = 0; for (var i = 0; i < 3; i++) for (var j = 0; j < 3; j++) v += w[i] * w[j] * sds[i] * sds[j] * (i === j ? 1 : cm[held[i]][held[j]]);
          var sdp = Math.sqrt(v), tv = SC.marked_to_latest_close.total_known_usd;
          out += box("<b>Known-dollar positions (PLTR, MU, CRDO; " + usd(tv) + " marked to the latest close):</b> scenario P&L " + '<b class="' + cls(tot) + '">' + (tot >= 0 ? "+" : "−") + usd(Math.abs(tot)) + " (" + pc(tot / tv * 100, 1) + ")</b>, " + S2.lvl + "% range " + usd(tot - R.z * sdp) .replace("$-", "−$") + " to " + (tot + R.z * sdp >= 0 ? "+" : "") + usd(tot + R.z * sdp) + " using the 60-day correlations from Scout. SEZL's size is " + ID + " and excluded; sizes are the figures given on Nov 11, assuming unchanged share counts.");
        }
      }
      // supply chain knock-on
      if (R.x != null && S2.src) {
        var ed = (window.EVENTS ? window.EVENTS.supply.edges : []).filter(function (e) { return e.src === S2.src; });
        out += "<h4>Supply-chain map: " + esc(S2.src) + " shock " + pc(R.x, 1) + "</h4>" + (ed.length ? tbl(["Linked name", "Relationship", "Measured on past report days", "Why linked"], ed.map(function (e) { var m = e.measured || {}; return "<tr><td>" + tk(e.dst) + hb(e.dst) + "</td><td>" + esc(e.rel) + "</td><td>" + (m.n ? chip(e.verdict || ID, e.verdict === "confirmed" ? "ok" : "") + dim("n=" + m.n + ", corr " + nn(m.corr, 2) + ", linked/baseline move " + nn(m.ratio, 2) + "x") : ID) + '</td><td class="r6-note">' + esc(e.why) + "</td></tr>"; })) : '<p class="r6-note">' + esc(S2.src) + " has no edges on the supply-chain map (" + ID + "); only SPY/VIX effects apply.</p>");
      }
      return out;
    }
    function scen() {
      var C = window.SCEN, srcs = Object.keys(C.sources || {}).sort();
      var ctl = '<div class="e-card"><div style="display:flex;flex-wrap:wrap;gap:10px;align-items:flex-end">'
        + '<label>Preset<br><select id="sc-pre">' + C.presets.map(function (p) { return '<option value="' + p.id + '"' + (p.id === S2.preset ? " selected" : "") + ">" + esc(p.label) + "</option>"; }).join("") + '<option value="custom"' + (S2.preset === "custom" ? " selected" : "") + '>Custom…</option></select></label>'
        + '<label>SPY move %<br><input id="sc-spy" type="number" step="0.5" style="width:80px" value="' + esc(S2.spy) + '" placeholder="auto"></label>'
        + '<label>VIX level<br><input id="sc-vix" type="number" step="1" style="width:80px" value="' + esc(S2.vix) + '" placeholder="now ' + nn(C.vix0, 1) + '"></label>'
        + '<label>Company shock<br><select id="sc-src">' + srcs.map(function (s) { return '<option' + (s === S2.src ? " selected" : "") + ">" + s + "</option>"; }).join("") + '</select> <input id="sc-sp" type="number" step="1" style="width:70px" value="' + esc(S2.srcPct) + '" placeholder="% move"></label>'
        + '<label>Fed decision (Dec 9)<br><select id="sc-fed"><option value="">none</option><option value="cut"' + (S2.fed === "cut" ? " selected" : "") + '>cuts</option><option value="hold"' + (S2.fed === "hold" ? " selected" : "") + '>holds</option><option value="hike"' + (S2.fed === "hike" ? " selected" : "") + ">hikes</option></select></label>"
        + '<label>Horizon<br><select id="sc-h"><option value="1"' + (S2.h === 1 ? " selected" : "") + '>1 week</option><option value="2"' + (S2.h === 2 ? " selected" : "") + '>2 weeks</option><option value="4"' + (S2.h === 4 ? " selected" : "") + '>4 weeks</option></select></label>'
        + '<label>Range<br><select id="sc-l"><option value="80"' + (S2.lvl === 80 ? " selected" : "") + '>80%</option><option value="95"' + (S2.lvl === 95 ? " selected" : "") + '>95%</option></select></label>'
        + '<label><input id="sc-imp" type="checkbox"' + (S2.imp ? " checked" : "") + '> VIX spike implies a SPY move</label></div>'
        + '<p class="r6-note" style="margin-bottom:0">The company shock is the stock-price reaction you expect (e.g. NVDA −10% on a guide-down; its historical average post-earnings move is about ' + nn((C.names.MU.src.NVDA && C.names.MU.src.NVDA.event ? C.names.MU.src.NVDA.event.srcMeanAbs : null), 1) + "%). Leave a field empty to leave it out.</p></div>";
      var oo = C.oos;
      return head("scen", "Pick or enter a scenario and see the estimated impact on each holding and top setup, from each name's historical betas to SPY, to VIX, and to the shocked company, plus the Fed-day record. Ranges come from each name's residual volatility and coefficient errors, not from a guess.", C)
        + box("<b>How good is the model?</b> Fit on the first two-thirds of each name's weekly history and scored on the last third, the " + C.oos.coverage80 + "% (of 80%) ranges held on average, but the median out-of-sample R² is only " + nn(C.oos.medianR2, 2) + ": market and VIX moves explain little of a single stock's week, so the ranges are wide on purpose. Treat the point estimate as a sensitivity, not a forecast.", "#c8a24a")
        + ctl + '<div id="sc-out">' + scenOut() + "</div>"
        + "<h4>Fed-day record (announcement-day return, market-adjusted, by actual decision)</h4>" + tbl(["Name", "Cuts", "Holds", "Hikes"], ord(C.focus).filter(function (t) { return C.names[t].status === "ok"; }).map(function (t) { var f = C.names[t].fomc; function c(k) { var o = f[k]; return o && o.meanAdj != null ? '<span class="' + cls(o.meanAdj) + '">' + pc(o.meanAdj, 2) + "</span>" + dim("n=" + o.n + ", " + o.hit + "% up days") : '<span class=r6-dim>' + ID + (o ? " (n=" + o.n + ")" : "") + "</span>"; } return "<tr><td>" + tk(t) + hb(t) + "</td><td>" + c("cut") + "</td><td>" + c("hold") + "</td><td>" + c("hike") + "</td></tr>"; }))
        + '<p class="r6-note">FOMC decisions since 2021: ' + C.fomc.all.cut + " cuts, " + C.fomc.all.hold + " holds, " + C.fomc.all.hike + " hikes (FRED target rate; federalreserve.gov dates). Next meeting " + esc(C.fomc.next[0]) + ". SPY's average announcement-day move: cuts " + pc(C.fomc.spy.cut.mean, 2) + ", holds " + pc(C.fomc.spy.hold.mean, 2) + ", hikes " + pc(C.fomc.spy.hike.mean, 2) + ".</p>"
        + '<details class="e-d"><summary>Method</summary><ul class="r6-note">' + C.method.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("") + "</ul></details>" + lims(C.limitations);
    }
    function scenAfter() {
      var ids = ["sc-pre", "sc-spy", "sc-vix", "sc-src", "sc-sp", "sc-fed", "sc-h", "sc-l", "sc-imp"];
      function upd() { var o = document.getElementById("sc-out"); if (o) o.innerHTML = scenOut(); }
      ids.forEach(function (id) {
        var el = document.getElementById(id); if (!el) return;
        el.addEventListener(id === "sc-spy" || id === "sc-vix" || id === "sc-sp" ? "input" : "change", function () {
          if (id === "sc-pre") { if (el.value !== "custom") applyPreset(el.value); else S2.preset = "custom"; X.renderView("scen"); return; }
          if (id === "sc-spy") S2.spy = el.value; if (id === "sc-vix") S2.vix = el.value; if (id === "sc-src") { S2.src = el.value; } if (id === "sc-sp") S2.srcPct = el.value;
          if (id === "sc-fed") S2.fed = el.value; if (id === "sc-h") S2.h = parseInt(el.value, 10); if (id === "sc-l") S2.lvl = parseInt(el.value, 10); if (id === "sc-imp") S2.imp = el.checked;
          if (["sc-spy", "sc-vix", "sc-src", "sc-sp", "sc-fed"].indexOf(id) >= 0) { S2.preset = "custom"; var p = document.getElementById("sc-pre"); if (p) p.value = "custom"; }
          upd();
        });
      });
    }
    /* ================= 2. crowd radar ================= */
    function crowd() {
      var C = window.CROWD, names = ord(C.focus);
      var kind = function (v) { return v.kind === "crowded long" ? "warn" : v.kind.indexOf("crowded short") === 0 ? "bad" : v.kind === "mixed" ? "sc" : v.kind === "no crowding flag" ? "ok" : ""; };
      var rows = names.map(function (t) {
        var r = C.names[t], o = r.options, s = r.short, f = r.f13, x = r.x;
        return "<tr" + (r.holding ? ' class="hold"' : "") + "><td>" + tk(t) + hb(t) + "</td><td>" + chip(r.verdict.kind, kind(r.verdict), r.verdict.why) + dim(esc(r.coverage)) + "</td>"
          + "<td>" + (o.status === "ok" ? "P/C OI " + (o.pcOI != null ? nn(o.pcOI, 2) + dim((o.pcOIpct != null ? o.pcOIpct + "th pct" : ID)) : ID) + dim("skew " + (o.skew ? nn(o.skew.rr * 100, 1) + " pts (" + (o.skewPct != null ? o.skewPct + "th pct" : ID) + ")" : ID)) : '<span class=r6-dim>' + ID + "</span>") + "</td>"
          + "<td>" + (s.status === "ok" ? nn(s.pctFloat, 1) + "% float" + dim((s.changePct != null ? pc(s.changePct, 0) + " vs prior period" : (s.changeDataError ? "change: data error, excluded" : ID)) + (s.daysToCover ? " · " + nn(s.daysToCover, 1) + " days to cover" : "") + (s.asOf ? " · FINRA print " + esc(s.asOf) : "")) : '<span class=r6-dim>' + ID + "</span>") + "</td>"
          + "<td>" + (f.status === "ok" ? "net " + pc(f.net, 1) + dim(f.adders + " adding / " + f.trimmers + " trimming of top " + f.topN + (f.excludedExtreme ? " · " + f.excludedExtreme + " extreme change(s) excluded as data errors" : "")) + dim("inst. " + (f.instPct != null ? nn(f.instPct, 0) + "%" : ID) + " · as of " + esc(f.reported)) : '<span class=r6-dim>' + ID + "</span>") + "</td>"
          + "<td>" + (x.status === "ok" ? spark(x.counts, 80, 22) + dim(x.last + " posts last day, " + (x.ratio != null ? nn(x.ratio, 1) + "x baseline" : "baseline " + ID) + (x.lowVolume ? " · low volume" : "")) : '<span class=r6-dim>' + ID + "</span>") + "</td></tr>";
      }).join("");
      var det = names.map(function (t) { var r = C.names[t]; if (!r.signals.length) return ""; return "<li>" + tk(t) + ": " + r.signals.map(function (s) { return chip(s.k, s.dir === "long" ? "warn" : s.dir === "short" ? "bad" : "sc") + " " + esc(s.txt); }).join(" · ") + "</li>"; }).join("");
      var tops = HOLD.map(function (t) { var f = C.names[t].f13; if (f.status !== "ok") return ""; return "<details class=e-d><summary>" + esc(t) + " top institutional holders (13F, " + esc(f.reported) + ")</summary>" + tbl(["Holder", "% of shares", "Change vs prior quarter"], f.top.map(function (x) { return "<tr><td>" + esc(x.holder) + "</td><td class=n>" + nn(x.pct, 2) + "%</td><td class=n>" + pc(x.chg, 1) + "</td></tr>"; })) + (f.excludedNames && f.excludedNames.length ? '<p class="r6-note">Excluded from the net as an extreme share-count change (treated as a data error): ' + f.excludedNames.map(esc).join(", ") + ".</p>" : "") + "</details>"; }).join("");
      return head("crowd", "Where positioning looks one-sided: options put/call and skew (percentile among optionable names), short interest and its change, 13F institutional changes and X retail chatter volume. A one-sided flag needs two or more same-direction signals and none opposing.", C)
        + box("<b>Descriptive only.</b> These crowding flags are not backtested and carry no demonstrated edge; extreme share-count changes in the free feeds are treated as data errors and excluded. X chatter is a snapshot pulled " + esc((C.xFetchedAt || "").slice(0, 16).replace("T", " ")) + " Central with the public X read tool (the refresh script cannot call it).", "#c8a24a")
        + tbl(["Name", "Verdict", "Options (0–45 DTE)", "Short interest", "13F institutions", "X post volume (6 days)"], [rows]).replace("<tbody><tr", "<tbody><tr")
        + "<h4>Signals that fired</h4><ul class=r6-note>" + (det || "<li>none</li>") + "</ul>" + tops + '<details class="e-d"><summary>Method</summary><ul class="r6-note">' + C.method.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("") + "</ul></details>" + lims(C.limitations);
    }
    /* ================= 3. analyst accuracy ================= */
    function analyst() {
      var A = window.ANALYST, P = A.persistence, B = A.base;
      var gradeChip = function (g) { return chip(g, g === "A" ? "ok" : g === "B" ? "ok" : g === "D" ? "bad" : g === "C" ? "sc" : "", g === "insufficient data" ? "fewer than 12 gradable events" : ""); };
      var cards = ord(A.focus).map(function (t) {
        var c = A.current[t]; if (!c) return "";
        if (c.status !== "ok") return '<div class="e-card"><h3 style="margin-top:0">' + tk(t) + hb(t) + " " + chip(ID, "warn") + '</h3><p class="r6-note">' + esc(c.why || "") + "</p></div>";
        var up = function (v) { return pc((v / c.price - 1) * 100, 0); };
        var rows = c.items.map(function (x) { return "<tr><td>" + esc(x.firm) + "</td><td class=n>" + usd(x.pt) + dim(up(x.pt) + " vs " + usd(c.price)) + "</td><td>" + esc(x.rating) + dim(esc(x.date) + (x.prior ? " · from " + usd(x.prior) : "")) + "</td><td>" + gradeChip(x.grade) + (x.score != null ? dim("score " + nn(x.score, 2)) : "") + "</td><td class=n>" + (x.hit != null ? nn(x.hit * 100, 0) + "%" + dim("n=" + x.n1) : ID) + "</td><td class=n>" + (x.skill != null ? pc(x.skill * 100, 0) + dim("n=" + x.n2) : ID) + "</td><td class=n>" + (x.ownHit != null ? nn(x.ownHit * 100, 0) + "%" + dim("n=" + x.ownN + " on this stock") : '<span class=r6-dim>' + ID + dim("n=" + x.ownN) + "</span>") + "</td><td class=n>" + nn(x.w, 2) + "</td></tr>"; }).join("");
        return '<div class="e-card"><h3 style="margin-top:0">' + tk(t) + hb(t) + " " + dim("price " + usd(c.price) + " · " + c.n + " targets in the last 150 days · low " + usd(c.low) + " · high " + usd(c.high)) + "</h3>"
          + '<div class="e-kpi"><div><span class="r6-dim">Simple mean</span><b>' + usd(c.mean) + "</b>" + dim(up(c.mean)) + '</div><div><span class="r6-dim">Median</span><b>' + usd(c.median) + "</b>" + dim(up(c.median)) + '</div><div><span class="r6-dim">Grade-weighted mean</span><b>' + usd(c.wMean) + "</b>" + dim(up(c.wMean)) + '</div><div><span class="r6-dim">Grade-weighted median</span><b>' + usd(c.wMedian) + "</b>" + dim(up(c.wMedian)) + '</div><div><span class="r6-dim">A/B-graded only</span><b>' + (c.abMean ? usd(c.abMean) : ID) + "</b>" + dim("n=" + c.abN) + "</div></div>"
          + tbl(["Firm", "Price target", "Rating", "Reliability grade", "Rating-call hit (63d vs SPY)", "Target skill vs naive +10%", "Firm on this stock", "Weight"], [rows]) + "</div>";
      }).join("");
      var per = P ? box("<b>Do the grades persist?</b> Firms graded only on pre-2023 calls: " + P.firms + " firms, correlation between grade score and their 2023–2026 rating-call hit rate " + '<b>' + nn(P.corr, 2) + "</b>; top-tercile firms hit " + nn(P.topHit * 100, 1) + "% (n=" + P.topN + ") versus " + nn(P.botHit * 100, 1) + "% for bottom-tercile (n=" + P.botN + "). " + (P.corr < 0.15 ? "<b>Grades did not predict later accuracy</b>, so weighting by grade is a display choice, not an edge." : "Some persistence."), P.corr < 0.15 ? "#c55" : "#2a6") : "";
      return head("analyst", "Which analysts' past rating changes and price targets proved accurate, and what the current targets look like once weighted by that record. Free Yahoo data, " + A.universeN + " universe names, " + A.eventN.toLocaleString() + " dated calls since 2012.", A)
        + box("<b>Field-wide record:</b> rating changes beat the direction call " + nn(B.ratingHit * 100, 1) + "% of the time over 63 days (n=" + B.ratingN.toLocaleString() + "; 50% is a coin flip). 12-month price targets missed the realised return by " + nn(B.ptMAE * 100, 0) + " points on average versus " + nn(B.ptNaiveMAE * 100, 0) + " for a naive +10% forecast (skill " + pc(B.ptSkill * 100, 0) + "); " + nn(B.ptReach * 100, 0) + "% of bullish targets were touched within a year.", "#c8a24a") + per
        + "<h3>Current price targets, weighted by firm reliability</h3>" + cards
        + "<h3>Grade distribution</h3><p class=r6-note>" + Object.keys(A.gradeDist).map(function (k) { return esc(k) + ": " + A.gradeDist[k]; }).join(" · ") + ". Most firms have too few gradable calls in this universe ('insufficient data'); they carry weight 0.5 and are flagged.</p>"
        + '<details class="e-d"><summary>Method</summary><ul class="r6-note">' + A.method.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("") + "</ul></details>" + lims(A.limitations);
    }
    /* ================= 4. demand ================= */
    function demand() {
      var D = window.DEMAND, NA = function (r) { return '<span class="r6-dim">' + (r.status === "not available free" ? chip("not available free", "warn", r.why) : ID + (r.why ? " · " + esc(r.why) : "")) + "</span>"; };
      var rows = ord(D.focus).map(function (t) {
        var r = D.names[t], j = r.jobs, tr = r.traffic, w = r.wiki, a = r.app;
        return "<tr" + (r.holding ? ' class="hold"' : "") + "><td>" + tk(t) + hb(t) + dim(esc(r.name)) + dim(esc(r.coverage)) + "</td>"
          + "<td>" + (j.status === "ok" ? "<b>" + j.open + "</b> open" + dim(j.new30 + " new in 30d vs " + j.prior30 + " before · eng " + j.eng + " · sales/mktg " + j.sales + dim(esc(j.ats) + (j.logChange ? " · vs " + j.logChange.from_ + ": " + j.logChange.was : " · change log starts today"))) : NA(j)) + "</td>"
          + "<td>" + (tr.status === "ok" ? "rank " + nn(tr.last7, 0) + dim(esc(tr.domain) + " · " + pc(tr.chg, 0) + " over " + tr.days + "d" + (tr.end ? " · series through " + esc(tr.end) : "")) + spark(tr.series.map(function (v) { return -v; }), 90, 20) : NA(tr)) + "</td>"
          + "<td>" + (w.status === "ok" ? nn(w.ratio, 2) + "x" + dim(nn(w.last28, 0) + "/day vs " + nn(w.prior, 0)) + spark(w.series, 90, 20, "#8a6") : NA(w)) + "</td>"
          + "<td>" + (a.status === "ok" ? esc(a.name) + dim("Finance #" + (a.financeRank || "unranked (outside top " + a.chartDepth + ")") + " · overall #" + (a.overallRank || "–") + " · " + nn(a.rating, 1) + "★ · " + (a.ratings || 0).toLocaleString() + " ratings" + (a.logChange ? " (" + (a.logChange.ratings != null ? "was " + a.logChange.ratings.toLocaleString() : "") + ")" : " · change log starts today")) : NA(a)) + "</td>"
          + "<td>" + (r.signals.length ? r.signals.map(function (s) { return chip(s.dir === "up" ? "up" : "down", s.dir === "up" ? "ok" : "bad") + " " + esc(s.txt); }).join("<br>") : '<span class=r6-dim>no signal</span>') + "</td></tr>";
      }).join("");
      return head("demand", "Free hiring, web-traffic, attention and app-ranking signals for holdings and top setups. These are proxies, not measured demand; every source that is not free is flagged rather than guessed.", D)
        + box("<b>Not available free (flagged on every name):</b> real web visits and visitors (Similarweb, Semrush), app downloads and revenue estimates (Sensor Tower, data.ai), card-spend panels, and paid job aggregators (LinkUp, Thinknum). Job counts come from public ATS APIs; companies on Workday or private ATS platforms (Micron, Credo, Glaukos and most others) show 'not available free'.", "#c8a24a")
        + tbl(["Name", "Job postings (public ATS)", "Web traffic rank (Tranco, 30d)", "Wikipedia attention", "App (US App Store)", "Signals"], [rows])
        + '<details class="e-d"><summary>Method</summary><ul class="r6-note">' + D.method.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("") + "</ul></details>" + lims(D.limitations);
    }
    /* ================= 5. filings ================= */
    function filings() {
      var F = window.FILINGS;
      var cards = ord(F.focus).map(function (t) {
        var r = F.names[t]; if (!r) return "";
        if (r.status !== "ok") return '<div class="e-card"><h3 style="margin-top:0">' + tk(t) + hb(t) + " " + chip(ID, "warn") + '</h3><p class="r6-note">' + esc(r.why || "") + "</p></div>";
        var body = r.comps.map(function (c) {
          if (c.status !== "ok") return "<h4>" + esc(c.form) + ' vs prior</h4><p class="r6-note">' + ID + ": " + esc(c.why || "") + "</p>";
          var rk = c.risk, md = c.mdna, o = "<h4>" + esc(c.form) + " " + esc(c.new.date) + " vs " + esc(c.old.date) + ' <a class="r6-dim" href="' + esc(c.new.url) + '" target="_blank" rel="noopener">new</a> · <a class="r6-dim" href="' + esc(c.old.url) + '" target="_blank" rel="noopener">old</a></h4>';
          o += "<p>" + (c.flags.length ? c.flags.map(function (f) { return chip(f.k, "bad") + " " + esc(f.txt); }).join("<br>") : chip("no flag", "ok")) + "</p>";
          o += "<ul class=r6-note><li><b>Risk factors:</b> " + (rk.status === "ok" ? rk.newN + " vs " + rk.oldN + " paragraphs; " + rk.new + " new, " + rk.removed + " removed (" + nn(rk.changedShare * 100, 0) + "% of text changed)" : ID + " · " + esc(rk.why || "")) + "</li>";
          o += "<li><b>MD&A / guidance wording:</b> " + (md.status === "ok" ? md.guideNew + " forward-looking sentences vs " + md.guideOld + "; " + md.addedN + " added, " + md.removedN + " removed" : ID + " · " + esc(md.why || "")) + "</li>";
          o += "<li><b>Keyword shifts:</b> " + (c.keywords.length ? c.keywords.map(function (k) { return chip(k.cat + " " + k.old + "→" + k.new, k.dir === "up" ? "warn" : "") ; }).join(" ") : "none beyond noise") + "</li></ul>";
          var ex = function (arr, lab) { return arr && arr.length ? "<details class=e-d><summary>" + lab + " (" + arr.length + " shown)</summary><ul class=r6-note>" + arr.map(function (x) { return "<li>" + (x.cats && x.cats.length ? x.cats.map(function (k) { return chip(k); }).join(" ") + " " : "") + esc(x.txt) + (x.txt.length >= 320 ? "…" : "") + dim("similarity to prior " + x.sim) + "</li>"; }).join("") + "</ul></details>" : ""; };
          return o + (rk.status === "ok" ? ex(rk.newItems, "New risk-factor language") + ex(rk.removedItems, "Removed risk-factor language") : "") + (md.status === "ok" ? ex(md.added, "Guidance / outlook wording added") + ex(md.removed, "Guidance / outlook wording removed") : "");
        }).join("");
        return '<div class="e-card"><h3 style="margin-top:0">' + tk(t) + hb(t) + "</h3>" + body + "</div>";
      }).join("");
      return head("filings", "Wording changes between consecutive 10-Q and 10-K filings from SEC EDGAR: new and removed risk-factor language, changes in guidance wording and jumps in cautionary keywords, for holdings and top setups.", F)
        + box("<b>A flag is a prompt to read, not a signal.</b> Most changes are boilerplate rewrites or new numbers; none of this is backtested. 10-Qs often just say 'no material changes' (shown as insufficient data); the 10-K comparison is the reliable risk-factor diff.", "#c8a24a") + cards
        + '<details class="e-d"><summary>Method</summary><ul class="r6-note">' + F.method.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("") + "</ul></details>" + lims(F.limitations);
    }
    /* ================= 6. analogs ================= */
    function analogs() {
      var A = window.ANALOGS, O = A.oos, F = A.features;
      var cards = ord(A.focus).map(function (t) {
        var r = A.names[t]; if (!r) return "";
        if (r.status !== "ok") return '<div class="e-card"><h3 style="margin-top:0">' + tk(t) + hb(t) + " " + chip(ID, "warn") + '</h3><p class="r6-note">' + esc(r.why || "") + "</p></div>";
        var ex = function (k) { return Object.keys(F).map(function (f) { var v = r.now[f]; return esc(F[f]) + " " + (f === "rsi" ? nn(v, 0) : f === "vol" ? nn(v * 100, 0) + "%" : pc(v * 100, 0)); }).join(" · "); };
        var hr = ["3m", "6m", "12m"].map(function (k) { var x = r.h[k]; return "<tr><td><b>" + k + "</b></td><td class=n>" + pc(x.mean, 0) + dim("90% CI " + pc(x.ci[0], 0) + " to " + pc(x.ci[1], 0)) + '</td><td class=n>' + pc(x.median, 0) + "</td><td class=n>" + pc(x.p10, 0) + " to " + pc(x.p90, 0) + dim("quartiles " + pc(x.p25, 0) + " / " + pc(x.p75, 0)) + "</td><td class=n>" + nn(x.pos, 0) + "%</td><td class=n>" + pc(x.exMean, 0) + dim(nn(x.exPos, 0) + "% beat SPY") + '</td><td class=n>' + pc(x.baseMean, 0) + dim("median " + pc(x.baseMedian, 0)) + '</td><td class="n ' + cls(x.vsBase) + '">' + pc(x.vsBase, 0) + "</td></tr>"; }).join("");
        var tp = r.top.map(function (x) { return "<tr><td>" + tk(x.t) + "</td><td>" + esc(x.d) + "</td><td class=n>" + nn(x.dist, 2) + "</td><td class=n>" + pc(x.r6, 0) + "</td><td class=n>" + pc(x.dd, 0) + "</td><td class=n>" + nn(x.rsi, 0) + "</td><td class=n>" + pc(x.f3, 0) + "</td><td class=n>" + pc(x.f6, 0) + "</td><td class=n>" + pc(x.f12, 0) + "</td></tr>"; }).join("");
        return '<div class="e-card"><h3 style="margin-top:0">' + tk(t) + hb(t) + " " + dim("today: " + ex()) + "</h3>"
          + '<p class="r6-note">' + r.k + " nearest analogs from " + r.distinctTickers + " different stocks across " + r.distinctQuarters + " calendar quarters (effective sample is the smaller numbers, not 40). Mean distance " + nn(r.meanDist, 2) + " vs " + nn(r.baselineDist, 2) + " for a typical random pair.</p>"
          + tbl(["Horizon after", "Analog mean", "Median", "10th to 90th", "% positive", "Excess vs SPY", "Pool baseline mean", "Analog − baseline"], [hr])
          + "<details class=e-d><summary>Ten closest analogs</summary>" + tbl(["Stock", "Week", "Distance", "6m return then", "Drawdown then", "RSI then", "+3m", "+6m", "+12m"], [tp]) + "</details></div>";
      }).join("");
      return head("analog", "The historical (stock, week) setups closest to today's price path, drawdown, RSI, momentum and volatility, and what followed over 3, 6 and 12 months, with sample size, a baseline and a survivorship warning.", A)
        + box("<b>Survivorship caveat:</b> the " + A.poolTickers + "-stock pool is today's scored names, so every forward return (and the baseline) is biased upward by the winners and survivors. Read the 'analog − baseline' and 'excess vs SPY' columns, not the raw level. Growth is not a matching feature: free point-in-time revenue growth does not exist for 16 years.", "#c55")
        + box("<b>Does the method predict anything out of sample?</b> " + O.n + " random test weeks since 2019, analogs drawn only from outcomes that had already matured: rank IC " + nn(O.ic, 3) + "; the top-quintile of predictions earned " + pc(O.topQuintile, 1) + " excess over the next 6 months versus " + pc(O.botQuintile, 1) + " for the bottom quintile (all tests " + pc(O.allMean, 1) + "). The spread is large but this test shares the survivor bias, and the predictor mostly sorts high-volatility, high-momentum names; treat it as descriptive.", "#c8a24a") + cards
        + '<details class="e-d"><summary>Method</summary><ul class="r6-note">' + A.method.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("") + "</ul></details>" + lims(A.limitations);
    }
    /* ================= 7. intraday ================= */
    function intra() {
      var I = window.INTRA, ld = I.sessionLast, L = I.sessions[ld], o = I.options, b = I.breadth, W = I.warning;
      var warn = box("<b>Warning from our own backtest:</b> " + esc(W.text) + dim("Modeled 0–7 DTE SPY setups: " + W.rows.map(function (x) { return x.setup + " at " + x.ivMult + "x IV: win " + nn(x.winA, 0) + "%, avg " + pc(x.avgA, 0) + " per trade (n=" + x.n + ")"; }).join(" · ")), "#c33");
      var sess = Object.keys(I.sessions).sort().reverse().map(function (d) { var v = I.sessions[d]; return "<tr><td>" + esc(d) + "</td><td class=n>" + pc(v.dayPct, 2) + "</td><td class=n>" + pc(v.gapPct, 2) + "</td><td class=n>" + pc(v.vsVwapPct, 2) + dim(nn(v.timeAboveVwap, 0) + "% of bars above") + "</td><td>" + esc(v.orbStatus) + "</td><td class=n>" + nn(v.rangePct, 2) + "%</td><td class=n>" + nn(v.er, 2) + dim(v.vwapCrosses + " VWAP crosses") + "</td><td>" + chip(v.regime, v.regime.indexOf("trend") === 0 ? "ok" : "sc") + "</td></tr>"; }).join("");
      var opt = o.status === "ok" ? tbl(["Expiry", "DTE", "Call vol", "Put vol", "P/C vol", "Vol / OI", "Call premium", "Put premium", "ATM straddle", "Implied move"], o.byExp.map(function (x) { return "<tr><td>" + esc(x.exp) + "</td><td class=n>" + x.dte + "</td><td class=n>" + x.callVol.toLocaleString() + "</td><td class=n>" + x.putVol.toLocaleString() + "</td><td class=n>" + nn(x.pcVol, 2) + "</td><td class=n>" + nn(x.volOI, 2) + "</td><td class=n>$" + nn(x.callPrem, 0) + "M</td><td class=n>$" + nn(x.putPrem, 0) + "M</td><td class=n>" + (x.straddle != null ? "$" + nn(x.straddle, 2) : ID) + "</td><td class=n>" + (x.impliedMovePct != null ? "±" + nn(x.impliedMovePct, 2) + "%" : ID) + "</td></tr>"; })) + "<h4>Most active strikes (0–7 DTE)</h4>" + tbl(["Contract", "Volume", "Open interest", "Premium traded"], o.top.map(function (x) { return "<tr><td>" + esc(x.exp) + " " + nn(x.k, 0) + (x.cp === "C" ? " call" : " put") + " (" + x.dte + "d)</td><td class=n>" + x.vol.toLocaleString() + "</td><td class=n>" + x.oi.toLocaleString() + "</td><td class=n>$" + nn(x.prem, 1) + "M</td></tr>"; })) : '<p class="r6-note">' + ID + ": " + esc(o.why || "") + "</p>";
      var sect = tbl(["Group", "Day change", "vs own VWAP"], b.sectors.map(function (x) { return "<tr><td>" + esc(x.name) + " " + dim(esc(x.t)) + '</td><td class="n ' + cls(x.chg) + '">' + pc(x.chg, 2) + '</td><td class="n ' + cls(x.vsVwap) + '">' + pc(x.vsVwap, 2) + "</td></tr>"; }));
      return head("intra", "A market-state read for 0–7 DTE SPY: VWAP and opening-range behavior, the intraday regime, breadth, SPY option volume and premium by expiry. Rebuilt on every refresh (a client-side live feed is not possible with free sources: Yahoo and CBOE block browser reads).", I)
        + warn
        + '<div class="e-kpi"><div><span class="r6-dim">Session</span><b>' + esc(ld) + "</b>" + dim(I.marketOpenNow ? "market open at build time" : "market closed at build time") + '</div><div><span class="r6-dim">SPY</span><b class="' + cls(L.dayPct) + '">' + pc(L.dayPct, 2) + "</b>" + dim("close " + nn(L.close, 2) + " · VWAP " + nn(L.vwap, 2)) + '</div><div><span class="r6-dim">Regime</span><b>' + esc(L.regime) + "</b>" + dim(esc(L.regimeWhy)) + '</div><div><span class="r6-dim">VIX</span><b>' + nn(I.vix.last, 1) + "</b>" + dim(pc(I.vix.chg1, 1) + " day · " + nn(I.vix.pct1y, 0) + "th pct of 1y") + '</div><div><span class="r6-dim">Breadth</span><b>' + b.advancers + "/" + b.n + "</b>" + dim("mega caps up · " + b.aboveVwap + " above VWAP") + "</div></div>"
        + "<ul class=r6-note>" + I.lines.map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") + "</ul>"
        + "<h4>Last five sessions</h4>" + tbl(["Session", "Day", "Gap", "Close vs VWAP", "Opening range (first 30 min)", "Range", "Efficiency", "Regime"], [sess])
        + "<h4>SPY options, 0–7 DTE " + dim("(CBOE delayed " + esc(o.asOf || "") + ")") + "</h4>" + opt + "<h4>Breadth: sectors and benchmarks</h4>" + sect
        + '<details class="e-d"><summary>Method</summary><ul class="r6-note">' + I.method.map(function (m) { return "<li>" + esc(m) + "</li>"; }).join("") + "</ul></details>" + lims(I.limitations);
    }
    /* ================= game plan extension ================= */
    function gameplanExtra() {
      var out = "";
      try {
        var C = window.CROWD, A = window.ANALYST, F = window.FILINGS, G = window.ANALOGS;
        if (C) out += "<li><b>Crowding:</b> " + HOLD.map(function (t) { var r = C.names[t]; return tk(t) + " " + esc(r.verdict.kind) + (r.signals.length ? " (" + r.signals.map(function (s) { return esc(s.k); }).join(", ") + ")" : ""); }).join(" · ") + ' <a class="r6-dim" href="#/crowd">radar</a></li>';
        if (A) out += "<li><b>Analyst targets, grade-weighted vs simple mean:</b> " + HOLD.map(function (t) { var c = A.current[t]; return c && c.status === "ok" ? tk(t) + " " + usd(c.wMean) + " vs " + usd(c.mean) + " (price " + usd(c.price) + ")" : tk(t) + " " + ID; }).join(" · ") + ' <a class="r6-dim" href="#/analyst">detail</a></li>';
        if (F) out += "<li><b>Filing language:</b> " + HOLD.map(function (t) { var r = F.names[t]; if (!r || r.status !== "ok") return tk(t) + " " + ID; var n = 0; r.comps.forEach(function (c) { n += (c.flags || []).length; }); return tk(t) + " " + (n ? n + " flag(s)" : "no flags"); }).join(" · ") + ' <a class="r6-dim" href="#/filings">detail</a></li>';
        if (G) out += "<li><b>Twin-stock analogs, 6-month mean excess vs SPY (survivor-biased pool):</b> " + HOLD.map(function (t) { var r = G.names[t]; return r && r.status === "ok" ? tk(t) + " " + pc(r.h["6m"].exMean, 0) + " (vs baseline " + pc(r.h["6m"].vsBase, 0) + ")" : tk(t) + " " + ID; }).join(" · ") + ' <a class="r6-dim" href="#/analog">detail</a></li>';
      } catch (e) { return ""; }
      return out;
    }
    window.EDGE2UI = { gameplanExtra: gameplanExtra };
    var need = function (k) { return function () { return !!window[k]; }; };
    if (window.SCEN) applyPreset("nvda");
    X.register("scen", "Scenario engine", scen, need("SCEN"), scenAfter);
    X.register("crowd", "Crowd radar", crowd, need("CROWD"));
    X.register("analyst", "Analyst accuracy", analyst, need("ANALYST"));
    X.register("demand", "Hidden demand", demand, need("DEMAND"));
    X.register("filings", "Filing changes", filings, need("FILINGS"));
    X.register("analog", "Twin-stock analogs", analogs, need("ANALOGS"));
    X.register("intra", "SPY 0-7 DTE dashboard", intra, need("INTRA"));
  };
  if (window.EDGEUI) window.EDGE2UI_INIT();
})();
