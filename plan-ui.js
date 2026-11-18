/* Plan UI: morning game plan card (top of site), graduated list, options strategy backtest (modeled), valuation sanity check.
   Data: window.PLAN (plan.js), window.OPTBT (optbt.js), window.R6.graduation / R6.optionGrades. Real data only. */
(function () {
  "use strict";
  var P = window.PLAN, O = window.OPTBT, R = window.R6, Q = window.QUANT;
  var VIEWS = ["graduated", "optbt", "valuation"];
  var TITLES = { graduated: "Graduated list", optbt: "Options strategy backtest", valuation: "Valuation check" };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var money = function (x) { return x == null ? "insufficient data" : "$" + Number(x).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var pc = function (x, d) { return x == null ? "insufficient data" : (x > 0 ? "+" : "") + Number(x).toFixed(d == null ? 1 : d) + "%"; };
  var nn = function (x, d) { return x == null ? "insufficient data" : Number(x).toFixed(d == null ? 1 : d); };
  var cls = function (x) { return x == null ? "" : x >= 0 ? "r6-pass" : "r6-fail"; };
  function chip(t, k, title) { return '<span class="r6-chip ' + (k || "") + '"' + (title ? ' title="' + esc(title) + '"' : "") + ">" + esc(t) + "</span>"; }
  function tk(t) { return '<a href="#/stock/' + encodeURIComponent(t) + '"><b>' + esc(t) + "</b></a>"; }
  function css() {
    if (window.R6UI && window.R6UI.css) window.R6UI.css();
    if (document.getElementById("p-css")) return;
    var s = document.createElement("style"); s.id = "p-css";
    s.textContent = "#gameplan-root{max-width:1180px;margin:10px auto 0;padding:0 4px}details.gp{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:12px 14px}details.gp>summary{cursor:pointer;font-weight:700;list-style:none;display:flex;flex-wrap:wrap;gap:8px;align-items:center}details.gp>summary::-webkit-details-marker{display:none}"
      + ".gp h4{margin:12px 0 4px;font-size:13px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}.gp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:10px}.gp-card{background:var(--panel-2);border:1px solid var(--line);border-radius:12px;padding:10px 12px;font-size:13px}.gp-card ul{margin:4px 0 6px 16px;padding:0}.gp-tbl{width:100%;border-collapse:collapse;font-size:13px}.gp-tbl td,.gp-tbl th{padding:5px 8px;border-bottom:1px solid var(--line-soft);text-align:left;vertical-align:top}.gp-tbl th{color:var(--muted);font-weight:600;font-size:12px}.gp-tbl td.n{text-align:right;font-variant-numeric:tabular-nums}.gp-links a{margin-right:12px}"
      + ".p-grp td{background:var(--panel-2);font-weight:700}.p-sub td,.p-sub th{font-size:12px}";
    document.head.appendChild(s);
  }
  /* ---------- game plan ---------- */
  function zoneChip(z) { var k = z.level === "in" ? "ok" : z.level === "near" ? "warn" : z.level === "avoid" ? "bad" : ""; var t = z.level === "in" ? "IN ZONE" : z.level === "near" ? "NEAR ZONE" : z.level === "avoid" ? "AVOID" : z.level === "none" ? "NO ZONE" : "WATCH"; return chip(t, k); }
  function valChip(f) { var k = f === "big premium" ? "bad" : f === "rich on one measure" ? "warn" : f === "discount to peers" ? "ok" : ""; return chip(f || "insufficient data", k); }
  function trustChip(m) { var k = m.trust === "trusted" ? "ok" : (m.trust === "not trusted" ? "bad" : "warn"); return chip(m.id + (m.trust === "trusted" ? " ✓ trusted now" : m.trust === "not trusted" ? " · low trust now" : " · " + m.trust), k, "Historical trust in the current regime (see Quant: regime tab)"); }
  function gameplan() {
    if (!P) return "";
    var rg = P.regime, rk = rg.label === "risk-on" ? "ok" : rg.label === "risk-off" ? "bad" : "warn";
    var hold = P.holdings.map(function (h) {
      var g = h.gate, e = h.earnings;
      return "<tr><td>" + tk(h.t) + '<div class="r6-dim">' + esc((h.books || []).join(" + ")) + "</div></td><td class=n>" + money(h.close) + "</td><td>" + (g.pass_ ? chip("passes gate", "ok") : (g.fails || []).map(function (f) { return chip(f, "bad"); }).join("")) + '<div class="r6-dim">' + (g.pass_ ? "score " + g.score + " · RSI " + nn(g.rsi, 0) : (g.needPx ? "needs " + money(g.needPx) + " (+" + nn(g.awayPct, 0) + "% to clear the " + esc(g.binder || "") + ")" : "")) + "</div></td>"
        + "<td>" + zoneChip(h.zone) + '<div class="r6-dim">' + esc(h.zone.text) + "</div></td><td>" + (e.next ? esc(e.next) + (e.days != null ? " (" + e.days + " trading days)" : "") + (e.within10 ? " " + chip("within 10 days", "warn") : "") : "insufficient data") + "</td><td>" + valChip(h.valuation && h.valuation.flag) + (h.alt.length ? '<div class="r6-dim">' + h.alt.map(esc).join(" · ") + "</div>" : "") + "</td></tr>";
    }).join("");
    var soon = P.earningsSoon.length ? P.earningsSoon.map(function (e) { return tk(e.t) + " " + esc(e.next) + " (" + e.days + " trading day" + (e.days === 1 ? "" : "s") + (e.timing ? ", " + esc(e.timing) : "") + (e.avgAbsMove ? ", avg move " + nn(e.avgAbsMove, 0) + "%" : "") + ")" + (e.holding ? " " + chip("holding", "sc") : "") + (e.estimate ? " " + chip("estimate", "") : ""); }).join(" · ") : "None for holdings, graduated names or the top setups.";
    var top = P.top3.map(function (s, i) {
      return '<div class="gp-card"><b>#' + (i + 1) + " " + tk(s.t) + "</b> " + chip("tier " + s.tier, s.tier === "A" ? "ok" : "sc") + (s.holding ? " " + chip("holding", "sc") : "") + (s.extended ? " " + chip("extended RSI", "warn") : "") + '<div class="r6-dim">' + esc((s.name || "").slice(0, 36)) + " · " + esc(s.sector || "") + " · " + money(s.close) + "</div><ul>" + s.why.map(function (w) { return "<li>" + esc(w) + "</li>"; }).join("") + "</ul>"
        + "<div>" + s.marks.filter(function (m) { return m.on; }).map(trustChip).join("") + "</div>"
        + '<div class="r6-dim" style="margin-top:4px">Levels: 20-day ' + money(s.sma20) + " · 50-day " + money(s.sma50) + " · 200-day " + money(s.sma200) + " · RSI " + nn(s.rsi, 0) + " · score " + s.score + " · 12m risk rank #" + (s.riskRank || "insufficient data") + "</div>"
        + '<div style="margin-top:4px">' + valChip(s.valFlag) + (s.earnings.next ? " " + chip("earnings " + s.earnings.next + (s.earnings.days != null ? " (" + s.earnings.days + "d)" : ""), s.nearEarnings ? "bad" : "") : "") + s.alt.map(function (b) { return chip(b, "ok"); }).join("") + s.altWarn.map(function (b) { return chip(b, "warn"); }).join("") + "</div></div>";
    }).join("");
    return '<details class="gp" id="gp-details" open><summary>Morning game plan <span class="r6-dim" style="font-weight:400">· data as of ' + esc(P.dataAsOfLabel || P.dataAsOf) + "</span> " + chip(rg.label.toUpperCase() + " " + rg.total + "/8", rk) + ' <span class="r6-dim" style="font-weight:400">VIX ' + nn(rg.vix, 1) + " · SPY " + nn(rg.spy, 0) + " vs 200-day " + nn(rg.spy200, 0) + "</span></summary>"
      + '<p class="r6-note">' + esc(rg.text) + " " + esc(P.backtestBasis) + "</p>"
      + "<h4>Holdings: gate, add zones, earnings, valuation</h4><div class=r6-tbl-wrap><table class=gp-tbl><thead><tr><th>Holding</th><th>Price</th><th>Full gate</th><th>Add zone</th><th>Next earnings</th><th>Valuation vs peers</th></tr></thead><tbody>" + hold + "</tbody></table></div>"
      + "<h4>Earnings within 10 trading days</h4><div>" + soon + "</div>"
      + (window.EDGEUI && window.EDGEUI.gameplanExtra ? window.EDGEUI.gameplanExtra() : "")
      + "<h4>Today's top 3 setups (prioritized by S3 RS leaders and 12-1 momentum, the rules that backtested best)</h4><div class=gp-grid>" + (top || '<p class="r6-dim">No names meet the S3 / momentum criteria today.</p>') + "</div>"
      + '<p class="r6-note">Tier A = S3 leader and momentum ≥ 80th percentile; tier B = S3 leader or momentum ≥ 90th. Names reporting within 5 trading days sort last. "Low trust now" = that rule did not beat the equal-weight universe in the current regime historically. Not a recommendation or an order.</p>'
      + '<p class="gp-links r6-note"><a href="#/graduated">Graduated list (' + P.graduation.graduated + " graduated, " + P.graduation.building + ' building)</a><a href="#/optbt">Options backtest</a><a href="#/valuation">Valuation check</a><a href="#/qregime">Regime</a><a href="#/distance">Distance to pass</a></p><p class="r6-note">' + esc(P.optLine) + "</p></details>";
  }
  function renderTop() {
    var el = document.getElementById("gameplan-root"); if (!el) return;
    css(); el.innerHTML = P ? gameplan() : "";
    var d = document.getElementById("gp-details");
    if (d) {
      var pref = null; try { pref = localStorage.getItem("gp-open"); } catch (e) {}
      var home = !location.hash || /^#\/?(holdings)?$/.test(location.hash);
      if (pref === "0" || (pref === null && !home)) d.removeAttribute("open");
      d.addEventListener("toggle", function () { try { localStorage.setItem("gp-open", d.open ? "1" : "0"); } catch (e) {} });
    }
  }
  /* ---------- shared ---------- */
  function nav(view) { return '<nav class="r6-nav">' + VIEWS.map(function (v) { return '<a href="#/' + v + '" class="' + (v === view ? "on" : "") + '">' + TITLES[v] + "</a>"; }).join("") + "</nav>"; }
  function head(view, lead, asof, gen) { return nav(view) + '<header class="r6-head"><p class="eyebrow">Research only · data as of ' + esc(asof) + " · built " + esc((gen || "").replace("T", " ").slice(0, 16)) + ' Central</p><h2>' + TITLES[view] + '</h2><p class="r6-lead">' + lead + "</p></header>"; }
  /* ---------- graduation ---------- */
  function graduated() {
    var G = R.graduation, grad = G.graduated.map(function (x) { return "<tr><td>" + tk(x.t) + '<div class="r6-dim">' + esc((x.name || "").slice(0, 30)) + "</div></td><td>" + esc(x.sector || "") + "</td><td class=n>" + money(x.close) + "</td><td class=n>" + x.score + "</td><td class=n>" + nn(x.rsi, 0) + "</td><td>" + esc(x.since) + "</td><td class=n>" + x.streak + "</td></tr>"; }).join("");
    var cand = G.candidates.slice(0, 60).map(function (x) { return "<tr><td>" + tk(x.t) + '<div class="r6-dim">' + esc((x.name || "").slice(0, 30)) + "</div></td><td>" + esc(x.sector || "") + "</td><td class=n>" + money(x.close) + "</td><td class=n>" + x.score + "</td><td class=n>" + nn(x.rsi, 0) + "</td><td class=n><b>" + x.streak + "</b> of " + G.n + "</td><td>" + (x.needs ? x.needs + " more refresh day" + (x.needs === 1 ? "" : "s") : "ready") + "</td></tr>"; }).join("");
    var dem = G.demotions.map(function (x) { return "<tr><td>" + tk(x.t) + "</td><td>" + esc(x.date) + "</td><td>" + esc(x.since) + "</td><td class=n>" + x.streakWas + "</td><td>" + ((x.fails || []).map(function (f) { return chip(f, "bad"); }).join("") || '<span class="r6-dim">insufficient data</span>') + "</td></tr>"; }).join("");
    var rs = (G.resets || []).map(function (x) { return tk(x.t) + " (was " + x.prevStreak + ", now failing: " + esc((x.fails || []).join(", ") || "insufficient data") + ")"; }).join(" · ");
    var cards = window.R6UI ? window.R6UI.holdingsExtra("grad") : "";
    return head("graduated", "A name <b>graduates</b> after passing the <b>full gate</b> (score ≥ 70, RSI ≤ 70, above the 50- and 200-day, not broken) on " + G.n + " consecutive recorded <b>completed-close</b> days" + (G.lastCompleteClose ? " (last complete close " + esc(G.lastCompleteClose) + ")" : "") + ". Live/intraday prints update the pass list on this page but do not add or remove a graduation-streak day. Graduated names get the same bull / bear / levels / chart card as holdings, and are demoted the first close-day refresh they fail.", (R.dataAsOfLabel || R.dataAsOf), R.generatedAt)
      + '<div class="r6-box">' + esc(G.note) + " Refresh days recorded so far: <b>" + G.refreshDays + "</b> (" + esc(G.dates.join(", ")) + "). Passing the gate today: <b>" + G.passToday + "</b> names. Graduated: <b>" + G.graduated.length + "</b>. Building a streak: <b>" + G.candidates.length + "</b>.</div>"
      + "<h3>Graduated (" + G.graduated.length + ")</h3>" + (G.graduated.length ? '<div class="r6-tbl-wrap"><table class="r6-tbl"><thead><tr><th>Ticker</th><th>Sector</th><th class=n>Close</th><th class=n>Score</th><th class=n>RSI</th><th>Graduated on</th><th class=n>Streak</th></tr></thead><tbody>' + grad + "</tbody></table></div>" : '<p class="r6-dim">None yet. The first names can graduate once ' + G.n + " refresh days have been recorded (tracking began " + esc(G.started) + ").</p>")
      + "<h3>Demotions (" + G.demotions.length + ")</h3>" + (G.demotions.length ? '<div class="r6-tbl-wrap"><table class="r6-tbl"><thead><tr><th>Ticker</th><th>Demoted on</th><th>Graduated on</th><th class=n>Streak when lost</th><th>Failed</th></tr></thead><tbody>' + dem + "</tbody></table></div>" : '<p class="r6-dim">No demotions yet (nothing has graduated).</p>')
      + "<h3>Lost a streak on the latest refresh</h3><p>" + (rs || '<span class="r6-dim">None.</span>') + "</p>"
      + "<h3>Building a streak (" + G.candidates.length + ")</h3>" + (G.candidates.length ? '<div class="r6-tbl-wrap"><table class="r6-tbl"><thead><tr><th>Ticker</th><th>Sector</th><th class=n>Close</th><th class=n>Score</th><th class=n>RSI</th><th class=n>Streak</th><th>To graduate</th></tr></thead><tbody>' + cand + "</tbody></table></div>" : '<p class="r6-dim">None.</p>')
      + (G.graduated.length ? "<h3>Graduated cards</h3>" + cards : "");
  }
  /* ---------- options backtest ---------- */
  function mcell(m, k, d, suf) { return "<td class=n>" + (m && m[k] != null ? nn(m[k], d) + (suf || "") : "insufficient data") + "</td>"; }
  function rowOpt(r) {
    var a = r.m, b = r.m2; if (!a.n) return "";
    var ind = r.label.charAt(0) === " ";
    return "<tr><td style=\"min-width:300px;white-space:normal;" + (ind ? "padding-left:22px" : "") + "\"><b>" + esc(r.label.trim()) + "</b>" + (r.note ? '<div class="r6-dim" style="font-size:11px;max-width:430px;white-space:normal">' + esc(r.note) + "</div>" : "") + "</td><td class=n>" + a.n + "</td>"
      + mcell(a, "win", 0, "%") + '<td class="n ' + cls(a.avg) + '">' + pc(a.avg) + "</td>" + mcell(a, "tstat", 1) + '<td class="n r6-fail">$' + Math.abs(a.maxDD).toLocaleString() + '</td><td class="n ' + cls(a.totalPnl) + '">' + (a.totalPnl < 0 ? "−" : "") + "$" + Math.abs(a.totalPnl).toLocaleString() + "</td><td>" + chip(r.verdict, r.verdictClass) + "</td>"
      + '<td class=n style="border-left:2px solid var(--line)">' + (b.win != null ? nn(b.win, 0) + "%" : "insufficient data") + '</td><td class="n ' + cls(b.avg) + '">' + pc(b.avg) + "</td>" + mcell(b, "tstat", 1) + '<td class="n r6-fail">$' + Math.abs(b.maxDD).toLocaleString() + "</td><td>" + chip(r.verdict2, r.verdictClass2) + "</td>"
      + '<td class=n>' + (a.affordable != null ? a.affordable + "%" : "insufficient data") + "</td></tr>";
  }
  function ivRangeTable() {
    var ms = O.ivMults || [0.8, 1, 1.3];
    function f(x) { return x == null ? "insufficient data" : (x > 0 ? "+" : "") + Number(x).toFixed(0) + "%"; }
    function robust(x, s) { var ok = ms.every(function (m) { var v = x[String(m)]; return v && v["avg" + s] > 0 && (v["tstat" + s] == null ? false : v["tstat" + s] >= 2); }); var any = ms.some(function (m) { var v = x[String(m)]; return v && v["avg" + s] > 0; }); return ok ? chip("pays at every IV level", "ok") : any ? chip("pays only at some IV levels", "warn") : chip("loses at every IV level", "bad"); }
    var rows = O.results.filter(function (r) { return r.ivRange && !r.key.match(/^(orb|vwap)_/); }).map(function (r) {
      var x = r.ivRange, a = ms.map(function (m) { return x[String(m)] ? f(x[String(m)].avg) : "insufficient data"; }).join(" / "), b = ms.map(function (m) { return x[String(m)] ? f(x[String(m)].avg2) : "insufficient data"; }).join(" / ");
      var w = ms.map(function (m) { var v = x[String(m)]; return v && v.win != null ? Math.round(v.win) + "%" : "insufficient data"; }).join(" / ");
      var tOnly = ms.some(function (m) { return x[String(m)] && x[String(m)].windowOnly; });
      var baseline = /^(random|spy_base)/.test(r.key);
      return "<tr><td style=\"min-width:260px;white-space:normal\"><b>" + esc(r.label.trim()) + "</b>" + (tOnly ? '<div class="r6-dim" style="font-size:11px">current ~60-day window only</div>' : "") + "</td><td class=n>" + a + "</td><td class=n>" + w + "</td><td class=n>" + b + "</td><td>" + (baseline ? '<span class="r6-dim">baseline</span>' : robust(x, "") + " " + '<span class="r6-dim">(A)</span>') + "</td><td>" + (baseline ? "" : robust(x, "2") + ' <span class="r6-dim">(B)</span>') + "</td></tr>";
    }).join("");
    return "<h3>IV-sensitivity range (the numbers to read)</h3><p class=r6-note>Every option price here is modeled from a volatility proxy, so a single number overstates precision. Each setup is rerun with the volatility used for pricing scaled to " + ms.map(function (m) { return m + "×"; }).join(" / ") + " (stocks: 1.1× realized vol; SPY: VIX; intraday: VIX/VXN). Lower IV makes calls cheaper; higher IV makes them dearer. Values are listed in that order. \"Pays\" needs a positive average and t-stat ≥ 2 at <b>every</b> level.</p>"
      + '<div class="r6-tbl-wrap"><table class="r6-tbl p-sub"><thead><tr><th>Setup</th><th class=n>Style A avg return / trade</th><th class=n>Win rate (A)</th><th class=n>Style B avg return / trade</th><th>Robust, style A</th><th>Robust, style B</th></tr></thead><tbody>' + rows + "</tbody></table></div>";
  }
  function optbt() {
    var groups = {}, order = []; O.results.forEach(function (r) { if (!groups[r.group]) { groups[r.group] = []; order.push(r.group); } groups[r.group].push(r); });
    var rows = order.map(function (g) { return '<tr class="p-grp"><td colspan=15>' + esc(g) + "</td></tr>" + groups[g].map(rowOpt).join(""); }).join("");
    var vr = O.results.filter(function (r) { return r.variants.length; }).map(function (r) {
      return "<h4>" + esc(r.label.split(" →")[0]) + ": other expiries / strikes</h4><table class=\"r6-tbl p-sub\"><thead><tr><th>Variant</th><th class=n>Trades</th><th class=n>Win A</th><th class=n>Avg A</th><th class=n>Win B</th><th class=n>Avg B</th></tr></thead><tbody>"
        + r.variants.map(function (v) { return "<tr><td>" + v.dte + " DTE, " + (v.otm ? Math.round(v.otm * 100) + "% OTM" : "ATM") + ", max " + v.maxh + " days</td><td class=n>" + v.n + "</td>" + mcell(v, "win", 0, "%") + '<td class="n ' + cls(v.avg) + '">' + pc(v.avg) + "</td>" + mcell(v.m2, "win", 0, "%") + '<td class="n ' + cls(v.m2.avg) + '">' + pc(v.m2.avg) + "</td></tr>"; }).join("") + "</tbody></table>";
    }).join("");
    var sens = '<table class="r6-tbl p-sub"><thead><tr><th>Setup</th><th class=n>IV assumed (× VIX/VXN)</th><th class=n>Trades</th><th class=n>Win A</th><th class=n>Avg A</th><th class=n>Win B</th><th class=n>Avg B</th></tr></thead><tbody>' + O.intradaySensitivity.map(function (s) { return "<tr><td>" + esc(s.setup.toUpperCase()) + "</td><td class=n>" + s.ivMult + "</td><td class=n>" + s.n + "</td><td class=n>" + s.winA + '%</td><td class="n ' + cls(s.avgA) + '">' + pc(s.avgA) + "</td><td class=n>" + s.winB + '%</td><td class="n ' + cls(s.avgB) + '">' + pc(s.avgB) + "</td></tr>"; }).join("") + "</tbody></table>";
    var rg = O.realGraded, rt = rg.table.map(function (t) { return "<tr><td>" + esc(t.kind) + "</td><td>" + esc(t.name) + "</td><td class=n>" + t.n + "</td><td class=n>" + t.open + "</td><td class=n>" + t.closed + "</td><td class=n>" + (t.winRate == null ? '<span class="r6-dim">pending</span>' : t.winRate + "%") + "</td><td class=n>" + (t.avgClosed == null && t.avgReturn == null ? '<span class="r6-dim">pending</span>' : pc(t.avgClosed != null ? t.avgClosed : t.avgReturn)) + "</td></tr>"; }).join("");
    var best = O.results.filter(function (r) { return r.verdict === "pays in the model" || r.verdict2 === "pays in the model"; });
    return head("optbt", "Atlas's option setups replayed on real underlying history, with every option price <b>modeled</b> (Black-Scholes plus a volatility proxy), because free historical option chains do not exist. Each trade stakes about $" + O.stake + " of premium. <b>Style A</b> exits at +100% / −50% of premium or the time limit; <b>style B</b> has no stop or target, only the time limit.", (O.dataAsOfLabel || O.dataAsOf), O.generatedAt)
      + '<div class="r6-box"><b>Modeled, not observed.</b> ' + (best.length ? "Setups that pay in the model: <b>" + best.map(function (r) { return esc(r.label.split(" →")[0]) + " (" + (r.verdict === "pays in the model" ? "style A" : "style B") + ")"; }).join(", ") + "</b>. " : "No setup pays in the model. ") + "A setup only counts as paying when its average return is positive, the t-stat is at least 2, and it beats the random-entry baseline. Every 0–7 DTE SPY/QQQ setup loses money here.</div>"
      + ivRangeTable()
      + '<h3>Detail at 1.0× IV</h3><div class="r6-tbl-wrap"><table class="r6-tbl"><thead><tr><th rowspan=2>Setup</th><th colspan=7>Style A: stop −50% / target +100%</th><th colspan=5 style="border-left:2px solid var(--line)">Style B: time exit only</th><th rowspan=2 class=n>1 contract ≤ $400 ATM</th></tr><tr><th class=n>Trades</th><th class=n>Win rate</th><th class=n>Avg return</th><th class=n>t-stat</th><th class=n>Max drawdown</th><th class=n>Total P&amp;L</th><th>Verdict</th><th class=n style="border-left:2px solid var(--line)">Win rate</th><th class=n>Avg return</th><th class=n>t-stat</th><th class=n>Max drawdown</th><th>Verdict</th></tr></thead><tbody>' + rows + "</tbody></table></div>"
      + '<p class="r6-note">Avg return is per trade on premium paid; P&amp;L and drawdown assume one $' + O.stake + " stake per trade in exit order. Baselines are random entries run through the same model; a setup must beat its baseline.</p>"
      + "<h3>Real graded results (options-grades.json)</h3><div class=r6-box>" + rg.total + " ideas logged from the Options tab: " + rg.open + " open, " + rg.closed + " closed. Real outcomes only appear as ideas mature, so none of the modeled results above are confirmed by them yet.</div>"
      + '<div class="r6-tbl-wrap"><table class="r6-tbl"><thead><tr><th>Group</th><th>Name</th><th class=n>Ideas</th><th class=n>Open</th><th class=n>Closed</th><th class=n>Win rate</th><th class=n>Avg closed return</th></tr></thead><tbody>' + rt + '</tbody></table></div><p class="r6-note"><a href="#/optgrades">Full idea log</a></p>'
      + "<h3>Sensitivity: other expiries and strikes</h3>" + vr + "<h3>Sensitivity: 0-DTE implied volatility assumption</h3><p class=r6-note>If same-day implied vol were well below VIX/VXN, the intraday setups would lose less, but still lose in this sample:</p>" + sens
      + "<h3>Model and limitations</h3><ul class=r6-note><li><b>Pricing:</b> " + esc(O.model.pricing) + "</li><li><b>Volatility proxy:</b> " + esc(O.model.iv) + "</li><li><b>Costs:</b> " + esc(O.model.costs) + "</li><li><b>Exits and entries:</b> " + esc(O.model.exits) + "</li><li><b>Sizing:</b> " + esc(O.model.sizing) + "</li><li><b>Drawdown:</b> " + esc(O.model.drawdown) + "</li>" + O.limitations.map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") + "</ul>";
  }
  /* ---------- valuation ---------- */
  var vq = "";
  function premCell(p) { if (p == null) return '<span class="r6-dim">insufficient data</span>'; if (typeof p === "string") return chip(p, "bad"); return '<span class="' + (p >= 50 ? "r6-fail" : p <= -15 ? "r6-pass" : "") + '">' + (p > 0 ? "+" : "") + p + "%</span>"; }
  function valuation() {
    var V = P.valuation, q = vq.trim().toUpperCase();
    var list = q ? V.all.filter(function (v) { return v.t.indexOf(q) >= 0 || String(v.name || "").toUpperCase().indexOf(q) >= 0; }).slice(0, 40).map(function (v) { return Object.assign({ tag: "search" }, v); }) : V.rows;
    var rows = list.map(function (v) {
      return "<tr><td>" + tk(v.t) + '<div class="r6-dim">' + esc((v.name || "").slice(0, 28)) + "</div></td><td>" + chip(v.tag || "", v.tag === "holding" ? "sc" : "") + "</td><td>" + valChip(v.flag) + (v.cyclicalPeak ? " " + chip("cyclical peak? (Lynch)", "warn") : "") + '<div class="r6-dim">' + esc(v.peerGroup ? "vs " + v.peerGroup[1] + " peers in " + (v.peerGroup[0] === "industry" ? (v.industry || "industry") : v.peerGroup[0]) : "") + "</div></td>"
        + "<td class=n>" + nn(v.peg, 2) + "<div>" + premCell(v.premium && v.premium.peg) + "</div></td><td class=n>" + nn(v.evs, 1) + 'x<div class="r6-dim">' + (v.revg == null ? "growth insufficient data" : "growth " + pc(v.revg, 0)) + "</div></td><td class=n>" + nn(v.evg, 3) + "<div>" + premCell(v.premium && v.premium.evg) + "</div></td><td class=n>" + (v.fcfy == null ? "insufficient data" : nn(v.fcfy, 1) + "%") + "<div>" + premCell(v.premium && v.premium.fcfy) + '</div></td><td class="r6-note" style="max-width:260px;white-space:normal">' + esc((v.notes || []).join("; ")) + "</td></tr>";
    }).join("");
    var big = V.rows.filter(function (v) { return v.flag === "big premium"; }).map(function (v) { return tk(v.t) + " (" + esc(v.tag) + ")"; }).join(", ");
    return head("valuation", "Growth-adjusted valuation (PEG, EV/Sales per point of growth, FCF yield) for holdings, graduated names and the top setups, each compared with peers in the scored universe. Premium = percent above the peer median (for FCF yield, how much lower the yield is).", (P.dataAsOfLabel || P.dataAsOf), P.generatedAt)
      + '<div class="r6-box">Flagged <b>big premium</b> (50%+ above peers on two or more measures): ' + (big || "none") + ".</div>"
      + '<div class="r6-bar"><input id="p-vq" placeholder="Look up any scored ticker" value="' + esc(vq) + '"></div>'
      + '<div class="r6-tbl-wrap"><table class="r6-tbl"><thead><tr><th>Ticker</th><th>Why shown</th><th>Verdict</th><th class=n>PEG<div class="r6-dim">premium</div></th><th class=n>EV/Sales</th><th class=n>EV/Sales per growth pt<div class="r6-dim">premium</div></th><th class=n>FCF yield<div class="r6-dim">premium</div></th><th>Notes</th></tr></thead><tbody>' + rows + "</tbody></table></div>"
      + '<p class="r6-note"><b>Method:</b> ' + esc(V.method) + '</p><p class="r6-note"><b>Limitations:</b> ' + esc(V.limitations) + "</p>";
  }
  function renderView(view) {
    var panel = document.getElementById("view-plan"); if (!panel) return;
    var on = VIEWS.indexOf(view) >= 0; panel.hidden = !on; if (!on) return;
    css(); var root = document.getElementById("plan-root");
    var need = view === "optbt" ? O : view === "valuation" ? P : (R && R.graduation);
    if (!need) { root.innerHTML = '<div class="r6-wrap"><p>Data for this tab has not been published yet.</p></div>'; return; }
    root.innerHTML = '<div class="r6-wrap">' + (view === "graduated" ? graduated() : view === "optbt" ? optbt() : valuation()) + "</div>";
    var q = document.getElementById("p-vq"); if (q) q.addEventListener("input", function () { vq = q.value; var p = q.selectionStart; renderView("valuation"); var n = document.getElementById("p-vq"); n.focus(); n.setSelectionRange(p, p); });
  }
  function boot() { renderTop(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  window.PLANUI = { renderView: renderView, renderTop: renderTop, VIEWS: VIEWS };
})();
