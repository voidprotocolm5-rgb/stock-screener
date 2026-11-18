/* Edge UI (t582u): beat-SPY probabilities + calibration, walk-forward ML verdict, earnings-move forecaster, news/call tone, supply-chain map, self-grading scoreboard,
   Thesis Scout analytics, point-in-time validation block. Data: window.EDGE, EVENTS, SENT, SCORE, PIT, SCOUT. Real data only; missing data reads "insufficient data". */
(function () {
  "use strict";
  var E = window.EDGE, EV = window.EVENTS, SE = window.SENT, SB = window.SCORE, PT = window.PIT, SO = window.SCOUT;
  var VIEWS = ["beat", "mlens", "earnfc", "tone", "supply", "score", "scout"];
  var TITLES = { beat: "Beat-SPY probability", mlens: "ML ensemble (walk-forward)", earnfc: "Earnings move forecaster", tone: "News & call tone", supply: "Supply-chain map", score: "Scoreboard (self-grading)", scout: "Scout analytics" };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var ID = "insufficient data";
  var nn = function (x, d) { return x == null || x !== x ? ID : Number(x).toFixed(d == null ? 1 : d); };
  var pc = function (x, d) { return x == null || x !== x ? ID : (x > 0 ? "+" : "") + Number(x).toFixed(d == null ? 1 : d) + "%"; };
  var pp = function (x, d) { return x == null ? ID : (x * 100).toFixed(d == null ? 0 : d) + "%"; };
  var cls = function (x) { return x == null ? "" : x >= 0 ? "r6-pass" : "r6-fail"; };
  var st = { bq: "", bs: "focus", sq: "", sf: "all" };
  function css() {
    if (document.getElementById("e-css")) return;
    var s = document.createElement("style"); s.id = "e-css";
    s.textContent = ".e-pb{position:relative;display:inline-block;width:130px;height:14px;vertical-align:middle;background:var(--panel-2);border:1px solid var(--line);border-radius:7px}.e-pb i{position:absolute;top:3px;height:6px;background:rgba(90,140,230,.45);border-radius:3px}.e-pb b{position:absolute;top:1px;width:3px;height:10px;background:var(--text);border-radius:1px}.e-pb u{position:absolute;top:0;width:1px;height:12px;background:rgba(150,150,150,.8)}.e-kpi{display:flex;gap:10px;flex-wrap:wrap;margin:8px 0}.e-kpi div{background:var(--panel-2);border:1px solid var(--line);border-radius:8px;padding:8px 12px;min-width:120px}.e-kpi b{display:block;font-size:18px}.e-card{border:1px solid var(--line);border-radius:10px;padding:10px 14px;margin:10px 0;background:var(--panel-2)}.e-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(340px,1fr));gap:12px}.e-leg span{margin-right:12px;font-size:12px}.e-leg i{display:inline-block;width:10px;height:10px;margin-right:4px;border-radius:2px}.e-d summary{cursor:pointer;font-weight:600;margin:10px 0}.e-hist{display:flex;gap:3px;align-items:flex-end;height:48px}.e-hist i{display:block;width:14px;background:rgba(90,140,230,.6)}";
    document.head.appendChild(s);
  }
  function tk(t) { return '<a href="#/stock/' + encodeURIComponent(t) + '"><b>' + esc(t) + "</b></a>"; }
  function chip(t, k, title) { return '<span class="r6-chip ' + (k || "") + '"' + (title ? ' title="' + esc(title) + '"' : "") + ">" + esc(t) + "</span>"; }
  function nav(view) { return '<nav class="r6-nav">' + VIEWS.map(function (v) { return '<a href="#/' + v + '" class="' + (v === view ? "on" : "") + '">' + TITLES[v] + "</a>"; }).join("") + "</nav>"; }
  function asof(v) { return (window[v] && window[v].dataAsOf) || (window[v] && window[v].generatedAt && window[v].generatedAt.slice(0, 10)) || ""; }
  function head(view, lead, d) {
    var g = (d && d.generatedAt) || "";
    return nav(view) + '<header class="r6-head"><p class="eyebrow">Research only · no trades · data as of ' + esc((d && (d.dataAsOf || (d.generatedAt || "").slice(0, 10))) || "") + " · built " + esc(g.replace("T", " ").slice(0, 16)) + ' Central</p><h2>' + TITLES[view] + '</h2><p class="r6-lead">' + lead + "</p></header>";
  }
  function lims(arr, title) { return '<details class="e-d"><summary>' + (title || "Limitations (read before trusting any number here)") + '</summary><ul class="r6-note">' + (arr || []).map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") + "</ul></details>"; }
  function probBar(p, lo, hi) {
    if (p == null) return ID;
    return '<span class="e-pb" title="' + pp(lo) + " to " + pp(hi) + ', point ' + pp(p, 1) + '"><i style="left:' + (lo * 100).toFixed(1) + "%;width:" + Math.max(1, (hi - lo) * 100).toFixed(1) + '%"></i><u style="left:50%"></u><b style="left:calc(' + (p * 100).toFixed(1) + '% - 1px)"></b></span>';
  }
  function line(series, label) {
    var W = 900, H = 280, pl = 46, pr = 8, pt = 8, pb = 22, all = [];
    series.forEach(function (s) { s.pts.forEach(function (p) { all.push(p[1]); }); }); if (!all.length) return "";
    var lo = Math.log(Math.min.apply(null, all)), hi = Math.log(Math.max.apply(null, all)); if (hi - lo < 1e-6) hi = lo + 1;
    var d0 = Infinity, d1 = -Infinity; series.forEach(function (s) { d0 = Math.min(d0, Date.parse(s.pts[0][0])); d1 = Math.max(d1, Date.parse(s.pts[s.pts.length - 1][0])); });
    var X = function (d) { return pl + (Date.parse(d) - d0) / (d1 - d0) * (W - pl - pr); }, Y = function (v) { return pt + (1 - (Math.log(v) - lo) / (hi - lo)) * (H - pt - pb); };
    var g = ""; for (var k = 0; k <= 4; k++) { var lv = Math.exp(lo + (hi - lo) * k / 4); g += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(lv) + '" y2="' + Y(lv) + '" stroke="currentColor" opacity=".12"/><text x="2" y="' + (Y(lv) + 4) + '" font-size="10" fill="currentColor" opacity=".6">' + lv.toFixed(lv < 10 ? 1 : 0) + "x</text>"; }
    for (var y = new Date(d0).getFullYear() + 1; y <= new Date(d1).getFullYear(); y += 2) g += '<text x="' + X(y + "-01-01") + '" y="' + (H - 6) + '" font-size="10" fill="currentColor" opacity=".6" text-anchor="middle">' + y + "</text>";
    var paths = series.map(function (s) { return '<polyline fill="none" stroke="' + s.color + '" stroke-width="' + (s.w || 1.6) + '" points="' + s.pts.map(function (p) { return X(p[0]).toFixed(1) + "," + Y(p[1]).toFixed(1); }).join(" ") + '"/>'; }).join("");
    return '<svg viewBox="0 0 ' + W + " " + H + '" style="width:100%;max-width:960px;color:var(--text)" role="img" aria-label="' + esc(label) + '">' + g + paths + '</svg><div class="e-leg">' + series.map(function (s) { return '<span><i style="background:' + s.color + '"></i>' + esc(s.name) + "</span>"; }).join("") + "</div>";
  }
  function calChart(A, title) {
    var W = 420, H = 360, m = 44, bins = A.bins, lo = 1, hi = 0;
    bins.forEach(function (b) { lo = Math.min(lo, b.pred, b.lo); hi = Math.max(hi, b.pred, b.hi); }); lo = Math.max(0, Math.floor((lo - 0.02) * 20) / 20); hi = Math.min(1, Math.ceil((hi + 0.02) * 20) / 20);
    var X = function (v) { return m + (v - lo) / (hi - lo) * (W - m - 12); }, Y = function (v) { return H - m + 0 - (v - lo) / (hi - lo) * (H - m - 12); };
    var g = ""; for (var k = 0; k <= 4; k++) { var v = lo + (hi - lo) * k / 4; g += '<line x1="' + m + '" x2="' + (W - 12) + '" y1="' + Y(v) + '" y2="' + Y(v) + '" stroke="currentColor" opacity=".12"/><text x="4" y="' + (Y(v) + 4) + '" font-size="10" fill="currentColor" opacity=".7">' + (v * 100).toFixed(0) + '%</text><text x="' + X(v) + '" y="' + (H - m + 16) + '" font-size="10" fill="currentColor" opacity=".7" text-anchor="middle">' + (v * 100).toFixed(0) + "%</text>"; }
    g += '<line x1="' + X(lo) + '" y1="' + Y(lo) + '" x2="' + X(hi) + '" y2="' + Y(hi) + '" stroke="#2a6" stroke-dasharray="5 3" opacity=".8"/>';
    bins.forEach(function (b) { g += '<line x1="' + X(b.pred) + '" x2="' + X(b.pred) + '" y1="' + Y(b.lo) + '" y2="' + Y(b.hi) + '" stroke="#5a8ce6" stroke-width="2"/><circle cx="' + X(b.pred) + '" cy="' + Y(b.obs) + '" r="4" fill="#5a8ce6"><title>predicted ' + pp(b.pred, 1) + ", observed " + pp(b.obs, 1) + " (" + pp(b.lo, 1) + "–" + pp(b.hi, 1) + "), n=" + b.n + "</title></circle>"; });
    g += '<text x="' + (W / 2) + '" y="' + (H - 6) + '" font-size="11" fill="currentColor" text-anchor="middle">predicted probability</text><text x="10" y="14" font-size="11" fill="currentColor">observed beat-SPY rate (90% block-bootstrap interval)</text>';
    return '<svg viewBox="0 0 ' + W + " " + H + '" style="width:100%;max-width:440px;color:var(--text)" role="img" aria-label="' + esc(title) + '">' + g + "</svg>";
  }
  /* ---------- 1. beat-SPY probability ---------- */
  function beat() {
    var B = E.beat, A21 = B.horizons["21"], A63 = B.horizons["63"], F = B.forward, fw = Math.min(F["21"].maturedWeeks, F["63"].maturedWeeks);
    var q = st.bq.trim().toUpperCase(), P = window.PLAN || {}, focus = {};
    ["SEZL", "MU", "CRDO", "PLTR"].forEach(function (t) { focus[t] = "holding"; }); (P.setups || []).forEach(function (s) { focus[s.t] = focus[s.t] || "top setup"; });
    var names = Object.keys(B.current);
    var list = names.filter(function (t) { if (q) return t.indexOf(q) >= 0; return st.bs === "all" || focus[t]; });
    list.sort(function (a, b) { var fa = focus[a] === "holding" ? 0 : focus[a] ? 1 : 2, fb = focus[b] === "holding" ? 0 : focus[b] ? 1 : 2; return fa - fb || B.current[b]["63"][3] - B.current[a]["63"][3]; });
    var rows = list.slice(0, 120).map(function (t) {
      var c = B.current[t], a = c["21"], b = c["63"];
      return "<tr" + (focus[t] === "holding" ? ' class="hold"' : "") + "><td>" + tk(t) + (focus[t] ? " " + chip(focus[t], focus[t] === "holding" ? "sc" : "") : "") + "</td>"
        + "<td>" + probBar(a[0], a[1], a[2]) + '<div class="r6-dim">' + pp(a[0], 1) + " (" + pp(a[1]) + "–" + pp(a[2]) + ")</div></td><td>" + probBar(a[3], a[4], a[5]) + '<div class="r6-dim">' + pp(a[3]) + " (" + pp(a[4]) + "–" + pp(a[5]) + ")</div></td>"
        + "<td>" + probBar(b[0], b[1], b[2]) + '<div class="r6-dim">' + pp(b[0], 1) + " (" + pp(b[1]) + "–" + pp(b[2]) + ")</div></td><td>" + probBar(b[3], b[4], b[5]) + '<div class="r6-dim">' + pp(b[3]) + " (" + pp(b[4]) + "–" + pp(b[5]) + ")</div></td>"
        + '<td class="n ' + cls(c.mu) + '">' + pc(c.mu * 100, 0) + '</td><td class=n>' + nn(c.te * 100, 0) + "%</td></tr>";
    }).join("");
    function sk(A) { return "skill " + pc(A.skill * 100, 2) + " (90% interval " + pc(A.skillCI[0] * 100, 2) + " to " + pc(A.skillCI[1] * 100, 2) + "), AUC " + nn(A.auc, 3) + ", calibration error " + nn(A.ece * 100, 1) + " pts"; }
    function fwdT(h) { var f = F[h]; return "<tr><td>" + (h === "21" ? "1 month" : "3 months") + "</td><td class=n>" + f.maturedWeeks + " / " + B.needWeeks + "</td><td class=n>" + f.pendingWeeks + "</td><td class=n>" + f.nGraded + "</td><td>" + (f.nGraded ? "Brier " + nn(f.brier, 4) + " vs base " + nn(f.baseBrier, 4) : ID) + "</td></tr>"; }
    return head("beat", "Probability each name beats SPY over the next 1 and 3 months, from trailing excess return and volatility, calibrated on 15 years of walk-forward history. <b>" + chip(B.label === "tracking" ? "tracking" : "model estimate", "warn") + "</b> until 12 weeks of forward data exist (" + fw + " matured so far).", E)
      + '<div class="r6-box"><b>Honest read.</b> The calibrated model has no demonstrated skill out-of-sample: 1 month: ' + esc(sk(A21)) + "; 3 months: " + esc(sk(A63)) + ". A skill below zero means a flat base-rate guess did at least as well, so the calibrated probabilities sit near 50% and the interval that matters is the <b>outcome</b> uncertainty, not the point estimate. The 'naive' column is the raw persistence probability (assumes past excess drift continues): it looks decisive, but history shows it overstates (Brier " + nn(A63.brierRaw, 4) + " vs " + nn(A63.brierBase, 4) + " for a coin-flip at 3 months). Use it as a descriptive stat, not a forecast.</div>"
      + '<div class="e-grid"><div><h3>Calibration, 1 month</h3>' + calChart(A21, "Calibration 1 month") + '<p class="r6-note">Out-of-sample ' + esc(A21.testFrom) + " to " + esc(A21.testTo) + ", " + A21.obsOOS.toLocaleString() + " name-weeks in deciles; dashed = perfect calibration; bars = 90% block-bootstrap interval (" + A21.blockWeeks + "-week blocks).</p></div>"
      + "<div><h3>Calibration, 3 months</h3>" + calChart(A63, "Calibration 3 months") + '<p class="r6-note">Out-of-sample ' + esc(A63.testFrom) + " to " + esc(A63.testTo) + ", " + A63.obsOOS.toLocaleString() + " name-weeks; " + A63.blockWeeks + "-week blocks.</p></div></div>"
      + "<h3>Forward check (fills in weekly)</h3><div class=r6-tbl-wrap><table class=r6-tbl><thead><tr><th>Horizon</th><th class=n>Matured weeks</th><th class=n>Pending weeks</th><th class=n>Graded predictions</th><th>Forward Brier</th></tr></thead><tbody>" + fwdT("21") + fwdT("63") + "</tbody></table></div>"
      + '<p class="r6-note">Every refresh logs this week\'s probabilities to forecast-log.json and grades matured ones against real outcomes. The label changes from "model estimate" only when both horizons have ' + B.needWeeks + " matured weeks.</p>"
      + '<h3>Probabilities by name</h3><div class="r6-bar"><input id="e-bq" placeholder="Filter ticker (searches all ' + names.length + ')" value="' + esc(st.bq) + '"><select id="e-bs"><option value="focus">Holdings and top setups</option><option value="all">All names (top 120 by naive 3-month probability)</option></select></div>'
      + '<div class=r6-tbl-wrap><table class=r6-tbl><thead><tr><th>Ticker</th><th>1m calibrated<div class=r6-dim>point (range)</div></th><th>1m naive</th><th>3m calibrated</th><th>3m naive</th><th class=n>Excess drift / yr (2y)</th><th class=n>Tracking error</th></tr></thead><tbody>' + (rows || '<tr><td colspan=7 class=r6-dim>No match.</td></tr>') + "</tbody></table></div>"
      + '<p class="r6-note">Bar = 5th–95th percentile range, tick at 50%, marker = point estimate. Calibrated range = block bootstrap of the name\'s own 2-year history (21-day blocks) widened by the out-of-sample calibration uncertainty of its probability bin. Names with under 1 year of history are not shown (' + insuffCount() + ' of the scored universe: ' + ID + ").</p>"
      + '<details class="e-d"><summary>Method</summary><p class="r6-note">' + esc(B.method) + "</p></details>" + lims(E.limitations);
  }
  function insuffCount() { try { return (E.universe - Object.keys(E.beat.current).length); } catch (e) { return "some"; } }
  /* ---------- 2. ML ensemble ---------- */
  function mlens() {
    var M = E.ml, rows = M.rows.map(function (r) {
      var k = r.kind === "ml" ? "hold" : "";
      return "<tr class=\"" + k + "\"><td style=\"min-width:260px;white-space:normal\"><b>" + esc(r.label) + "</b></td><td class=n>" + nn(r.cagr) + "%</td><td class=n>" + nn(r.sharpe, 2) + "</td><td class=n>" + nn(r.vol) + "%</td><td class=n>" + nn(r.mdd) + "%</td><td class=n>" + (r.beatSpyWeeks != null ? nn(r.beatSpyWeeks) + "%" : ID) + "</td><td class=n>" + (r.dsr != null ? nn(r.dsr, 2) : "n/a (not a searched variant)") + "</td></tr>";
    }).join("");
    var dec = M.diagnostics.deciles.map(function (v, i) { var h = Math.max(2, Math.min(60, Math.abs(v) * 8)); return '<i title="decile ' + (i + 1) + ": " + v + '%" style="height:' + h + "px;background:" + (v >= 0 ? "rgba(46,160,110,.7)" : "rgba(220,80,90,.7)") + '"></i>'; }).join("");
    var C = M.curves, cols = ["#5a8ce6", "#e6a23c", "#888", "#2aa876"], keys = Object.keys(C);
    return head("mlens", "A walk-forward gradient-boosting + logistic ensemble on price, momentum / relative-strength, regime and point-in-time earnings-surprise features. It stays on the site only if it beats the simple rules out-of-sample after costs.", E)
      + '<div class="r6-box" style="border-color:' + (M.survived ? "#2a6" : "#c55") + '"><b>' + (M.survived ? "Kept" : "Retired") + ".</b> " + esc(M.verdict) + "</div>"
      + '<div class="e-kpi"><div><b>' + M.variantsTried + "</b>variants tried (" + M.models + " models × 2 portfolio sizes)</div><div><b>" + nn(M.dsr.headline, 2) + "</b>deflated Sharpe, pre-registered ensemble</div><div><b>" + nn(M.dsr.best, 2) + "</b>deflated Sharpe, best variant in hindsight</div><div><b>" + nn(M.dsr.benchmarkSharpeSR0, 2) + "</b>Sharpe the best of " + M.variantsTried + " random variants would show</div><div><b>" + nn(M.sharpeDiffP, 2) + "</b>P(ensemble Sharpe ≤ best rule) by bootstrap</div></div>"
      + '<p class="r6-note">' + esc(M.dsr.note) + " Note: a high deflated Sharpe only says the ensemble's own Sharpe is positive beyond search luck; it does not make it better than the simple rules, which is what the keep/retire test checks.</p>"
      + "<h3>Out-of-sample results, " + esc(M.oos.start) + " to " + esc(M.oos.end) + " (" + M.oos.weeks + " weeks, net of " + M.grid.costBpsPerSide + " bps per side)</h3><div class=r6-tbl-wrap><table class=r6-tbl><thead><tr><th>Strategy</th><th class=n>CAGR</th><th class=n>Sharpe</th><th class=n>Vol</th><th class=n>Max DD</th><th class=n>Beat SPY weeks</th><th class=n>Deflated Sharpe</th></tr></thead><tbody>" + rows + "</tbody></table></div>"
      + '<p class="r6-note">Rules shown use their fixed site thresholds on the same weeks and the same survivor universe, so the comparison is like for like. The survivor universe flatters every row, including the equal-weight line.</p>'
      + "<h3>Growth of $1, out-of-sample</h3>" + line(keys.map(function (k, i) { return { name: k, color: cols[i % cols.length], pts: C[k], w: i === 0 ? 2.4 : 1.5 }; }), "ML ensemble out-of-sample growth")
      + "<h3>Diagnostics (pre-registered ensemble)</h3><div class=e-kpi><div><b>" + nn(M.diagnostics.rankIC, 3) + "</b>mean rank IC (t≈" + nn(M.diagnostics.icT, 1) + ")</div><div><b>" + nn(M.diagnostics.auc, 3) + "</b>AUC, beats SPY next month</div><div><b>" + nn(M.costSensitivity["0"], 2) + " → " + nn(M.costSensitivity["10"], 2) + " → " + nn(M.costSensitivity["25"], 2) + " → " + nn(M.costSensitivity["50"], 2) + "</b>Sharpe at 0 / 10 / 25 / 50 bps</div></div>"
      + '<p class="r6-note">Mean next-month excess return by score decile, worst → best (%):</p><div class="e-hist">' + dec + '</div><p class="r6-note">' + esc(M.diagnostics.note) + " The worst deciles are not the worst performers: the mean is dominated by a few huge winners in speculative names, a survivor-universe artefact.</p>"
      + (M.survived ? "<h3>Latest ensemble scores</h3><p>" + M.picks.map(function (p) { return tk(p.t) + " " + nn(p.score, 3); }).join(" · ") + "</p>" : '<p class="r6-note">No live ML picks are published because the ensemble was retired.</p>')
      + '<details class="e-d"><summary>Design, features and folds</summary><p class="r6-note"><b>Pre-registered:</b> ' + esc(M.preregistered) + ". <b>Grid:</b> HGB " + M.grid.hgb.map(esc).join("; ") + "; logistic " + M.grid.logistic.map(esc).join(", ") + "; " + M.grid.ensembles + " ensembles; portfolios " + esc(M.grid.portfolios) + ". <b>Walk-forward:</b> " + esc(M.oos.refit) + ", minimum " + M.oos.minTrainWeeks + " weeks of training, " + M.oos.purgeWeeks + "-week purge before each test year; " + M.oos.folds.length + " folds. <b>Features (" + M.features.length + "):</b> " + M.features.map(esc).join(", ") + ". <b>Not usable:</b> " + esc(M.excluded) + "</p></details>" + lims(E.limitations);
  }
  /* ---------- 3. earnings forecaster ---------- */
  function flagChip(f) { return chip(f || ID, f === "underpriced" ? "ok" : f === "overpriced" ? "bad" : f === "fair" ? "sc" : "warn"); }
  function earncard(r) {
    if (!r) return "";
    var h = r.hist, im = r.implied, bars = (h.recent || []).slice().reverse().map(function (x) { return '<i title="' + x.date + ": " + x.move + '%" style="height:' + Math.max(2, Math.min(60, Math.abs(x.move) * 3)) + "px;background:" + (x.move >= 0 ? "rgba(46,160,110,.7)" : "rgba(220,80,90,.7)") + '"></i>'; }).join("");
    return '<div class="e-card"><h3 style="margin-top:0">' + tk(r.t) + " · " + esc(r.name || "") + " " + flagChip(r.flag) + (r.holding ? " " + chip("holding", "sc") : "") + '</h3><p class="r6-note">Reports ' + esc(r.date) + " " + esc(r.timing) + (r.dateEstimated ? " (date estimated)" : "") + "</p>"
      + (im ? '<div class="e-kpi"><div><b>±' + nn(im.usedPct, 1) + "%</b>options-implied move (event-isolated)</div><div><b>±" + nn(h.meanAbs, 1) + "%</b>historical average abs move (" + h.n + " quarters)</div><div><b>" + nn(r.ratio, 2) + "x</b>implied ÷ historical" + (r.relRatio ? " (" + nn(r.relRatio, 2) + "x vs list median)" : "") + "</div><div><b>" + nn(r.histExceedImplied, 0) + "%</b>of past quarters moved more than implied</div></div>" : "")
      + '<p style="margin:4px 0"><b>' + esc(r.flagWhy || "") + '</b></p><p class="r6-note">History: median ±' + nn(h.medianAbs, 1) + "%, 75th percentile ±" + nn(h.p75, 1) + "%, max ±" + nn(h.max, 1) + "%, last 8 average ±" + nn(h.last8MeanAbs, 1) + "%, up " + nn(h.upShare, 0) + "% of the time."
      + (im ? " Straddle: " + esc(im.expiry) + " $" + nn(im.strike, 2) + " strike costs $" + nn(im.straddle, 2) + " on a $" + nn(im.spot, 2) + " stock (raw " + nn(im.rawPct, 1) + "%, " + esc(im.quote) + " quotes); basis: " + esc(im.basis) + "; IV after " + nn(im.ivAfter, 0) + "%" + (im.ivBefore != null ? ", pre-event " + nn(im.ivBefore, 0) + "%" : "") + (im.rv60 != null ? ", 60-day realized " + nn(im.rv60, 0) + "%" : "") + (im.eventPctRealizedBase != null ? ", event move vs realized baseline ±" + nn(im.eventPctRealizedBase, 1) + "%" : "") + "." : "") + '</p><div class="e-hist" title="last 8 reaction-day moves, oldest to newest">' + bars + "</div></div>";
  }
  function earnfc() {
    var by = {}; EV.earnings.forEach(function (r) { by[r.t] = r; });
    var rows = EV.earnings.map(function (r) {
      var im = r.implied, h = r.hist;
      return "<tr" + (r.holding ? ' class="hold"' : "") + "><td>" + tk(r.t) + (r.holding ? " " + chip("holding", "sc") : "") + '<div class="r6-dim">' + esc((r.name || "").slice(0, 26)) + "</div></td><td>" + esc(r.date) + '<div class="r6-dim">' + esc(r.timing || "") + "</div></td><td class=n>" + (im && im.usedPct != null ? "±" + nn(im.usedPct, 1) + "%" : ID) + "</td><td class=n>" + (h ? "±" + nn(h.meanAbs, 1) + "%" : ID) + '<div class="r6-dim">median ' + (h ? nn(h.medianAbs, 1) : ID) + " · n=" + (h ? h.n : ID) + "</div></td><td class=n>" + (r.ratio != null ? nn(r.ratio, 2) + "x" : ID) + "</td><td class=n>" + (r.relRatio != null ? nn(r.relRatio, 2) + "x" : ID) + "</td><td>" + flagChip(r.flag) + '</td><td class="r6-note" style="max-width:340px;white-space:normal">' + esc(r.flagWhy || "") + "</td></tr>";
    }).join("");
    return head("earnfc", "Options-implied earnings move (at-the-money straddle from CBOE delayed chains) against what each stock actually did on its past earnings reactions. Flags: <b>underpriced</b> = implied below 0.85x the historical average, <b>overpriced</b> = above 1.15x.", EV)
      + '<div class="r6-box">' + esc(EV.medianNote || "") + " A flag against the whole list can be a regime effect; the relative column (vs the list median) is the like-for-like read.</div>"
      + earncard(by.CRDO) + earncard(by.MU)
      + "<h3>All reporters in the next ~45 days that we cover (" + EV.earnings.length + ")</h3><div class=r6-tbl-wrap><table class=r6-tbl><thead><tr><th>Name</th><th>Reports</th><th class=n>Implied move</th><th class=n>Historical avg</th><th class=n>Implied ÷ hist</th><th class=n>vs list median</th><th>Flag</th><th>Why</th></tr></thead><tbody>" + rows + "</tbody></table></div>"
      + lims(EV.earnLimitations);
  }
  /* ---------- 4. news & call tone ---------- */
  function toneChip(f) { return chip(f || ID, f === "tone up" ? "ok" : f === "tone down" ? "bad" : f === "steady" ? "sc" : "warn"); }
  function qline(qs) { if (!qs || !qs.length) return ID; return qs.slice(0, 5).map(function (q) { var tip = (q.label || q.date) + ": net tone " + q.pol.toFixed(2) + ", negative words " + q.negPct.toFixed(2) + "% of text"; return '<span title="' + esc(tip) + '">' + esc(q.label || q.date.slice(0, 7)) + " " + (q.pol >= 0 ? "+" : "") + q.pol.toFixed(2) + "</span>"; }).join(" ← "); }
  function tone() {
    var rows = SE.names.map(function (r) {
      var n = r.news, rl = r.release, cl = r.call;
      return "<tr" + (r.holding ? ' class="hold"' : "") + "><td>" + tk(r.t) + (r.holding ? " " + chip("holding", "sc") : "") + '<div class="r6-dim">' + esc((r.name || "").slice(0, 24)) + "</div></td>"
        + "<td>" + (n ? (n.lmMean == null ? ID : '<span class="' + cls(n.lmMean) + '">' + (n.lmMean >= 0 ? "+" : "") + n.lmMean.toFixed(2) + "</span>") + '<div class="r6-dim">' + n.n + " items" + (n.thin ? " (thin)" : "") + " · +" + n.pos + " / −" + n.neg + " · VADER " + nn(n.vaderMean, 2) + "</div>" : ID) + "</td>"
        + "<td>" + toneChip(rl.shift.flag) + '<div class="r6-dim">' + qline(rl.quarters) + '</div><div class="r6-dim">' + esc(rl.shift.why || "") + "</div></td>"
        + "<td>" + toneChip(cl.shift.flag) + '<div class="r6-dim">' + qline(cl.quarters) + '</div><div class="r6-dim">' + esc(cl.shift.why || "") + "</div></td><td>" + toneChip(r.overall) + "</td></tr>";
    }).join("");
    var heads = SE.names.filter(function (r) { return r.holding && r.news; }).map(function (r) {
      return "<h4>" + tk(r.t) + " recent headlines</h4><ul class=r6-note>" + r.news.items.slice(0, 5).map(function (it) { return "<li>" + (it.url ? '<a href="' + esc(it.url) + '" target="_blank" rel="noopener">' + esc(it.title) + "</a>" : esc(it.title)) + " <span class=r6-dim>(" + esc(it.provider || "") + ", " + esc(it.date) + ") LM " + nn(it.lm, 2) + " · VADER " + nn(it.vader, 2) + "</span></li>"; }).join("") + "</ul>";
    }).join("");
    return head("tone", "Finance-dictionary tone (Loughran-McDonald) of recent news, earnings press releases and call transcripts, and the quarter-over-quarter tone shift, for holdings and today's top setups. Free sources only; gaps are listed, never filled.", SE)
      + '<div class="r6-box"><b>Gaps in free sources:</b><ul class="r6-note">' + (SE.gaps.length ? SE.gaps.map(function (g) { return "<li>" + esc(g) + "</li>"; }).join("") : "<li>none</li>") + "<li>Call transcripts are collected for the four holdings only; setups use earnings-release tone and news.</li></ul></div>"
      + '<div class=r6-tbl-wrap><table class=r6-tbl><thead><tr><th>Name</th><th>News tone (LM, recent)</th><th>Earnings release tone, newest ← oldest</th><th>Call transcript tone, newest ← oldest</th><th>Overall shift</th></tr></thead><tbody>' + rows + "</tbody></table></div>"
      + '<p class="r6-note">Net tone ranges −1 to +1; management text is almost always positive, so the <b>change</b> versus prior quarters is what counts. Hover a quarter for negative-word share.</p>' + heads
      + '<details class="e-d"><summary>Method</summary><p class="r6-note">' + esc(SE.method) + "</p></details>" + lims(SE.limitations);
  }
  /* ---------- 5. supply chain ---------- */
  function mchip(e) { return chip(e.verdict || ID, e.verdict === "confirmed" ? "ok" : e.verdict === "weak" ? "warn" : ""); }
  function supply() {
    var S = EV.supply, fl = S.flags.map(function (f) {
      var m = f.measured || {};
      return "<tr" + (f.holding ? ' class="hold"' : "") + "><td>" + (f.kind === "reported" ? chip("reported", "warn") : chip("upcoming", "sc")) + "</td><td>" + tk(f.src) + (f.kind === "reported" ? " reported " + esc(f.date) + " " + esc(f.timing) + (f.surprise != null ? " (EPS surprise " + pc(f.surprise) + ")" : "") : (f.days === 0 ? " reports today " + esc(f.timing || "") : " reports " + esc(f.date) + " (" + f.days + " days)")) + "</td><td>" + tk(f.dst) + (f.holding ? " " + chip("holding", "sc") : "") + '</td><td>' + ("reaction expected " + esc(f.reactionDay || f.date)) + "</td><td>" + (m.n ? "on " + m.n + " past reports it moved " + nn(m.meanAbsLinked, 1) + "% vs " + nn(m.baselineAbs, 1) + "% normal (" + nn(m.ratio, 1) + "x), same direction " + nn(m.sameDir, 0) + "%" : ID) + "</td><td>" + mchip(f) + "</td></tr>";
    }).join("");
    var q = st.sq.trim().toUpperCase();
    var ed = S.edges.filter(function (e) { if (q && e.src.indexOf(q) < 0 && e.dst.indexOf(q) < 0) return false; if (st.sf === "confirmed") return e.verdict === "confirmed"; if (st.sf === "weak") return e.verdict === "weak"; if (st.sf === "hold") return ["SEZL", "MU", "CRDO", "PLTR"].indexOf(e.dst) >= 0; return true; });
    var er = ed.map(function (e) {
      var m = e.measured || {};
      return "<tr><td>" + tk(e.src) + " → " + tk(e.dst) + "</td><td>" + esc(e.rel) + '</td><td class="r6-note" style="max-width:320px;white-space:normal">' + esc(e.why) + "</td><td class=n>" + (m.n != null ? m.n : ID) + "</td><td class=n>" + (m.ratio != null ? nn(m.ratio, 2) + "x" : ID) + "</td><td class=n>" + (m.sameDir != null ? nn(m.sameDir, 0) + "%" : ID) + "</td><td class=n>" + (m.corr != null ? nn(m.corr, 2) : ID) + "</td><td>" + mchip(e) + (e.note ? '<div class="r6-dim">' + esc(e.note) + "</div>" : "") + "</td></tr>";
    }).join("");
    var nconf = S.edges.filter(function (e) { return e.verdict === "confirmed"; }).length;
    return head("supply", "Who moves whom. When a big supplier, customer or hyperscaler reports, the linked names are flagged. Each link is tested: how much did the linked stock really move on the source's past earnings days?", EV)
      + "<h3>Knock-on flags right now</h3>" + (fl ? '<div class=r6-tbl-wrap><table class=r6-tbl><thead><tr><th>Status</th><th>Source</th><th>Linked name</th><th>When</th><th>Measured reaction history</th><th>Link</th></tr></thead><tbody>' + fl + "</tbody></table></div>" : '<p class="r6-dim">No mapped source reports within the last 3 or next 10 days.</p>')
      + '<div class="r6-box">' + nconf + " of " + S.edges.length + " mapped links are confirmed by data (reaction ≥1.3x normal with correlation ≥0.3, or same-direction share significant); the rest stay on the map as 'weak'. " + esc(S.method) + "</div>"
      + '<h3>Link map</h3><div class="r6-bar"><input id="e-sq" placeholder="Filter by ticker" value="' + esc(st.sq) + '"><select id="e-sf"><option value="all">All links</option><option value="confirmed">Confirmed</option><option value="weak">Weak</option><option value="hold">Into my holdings</option></select></div>'
      + '<div class=r6-tbl-wrap><table class=r6-tbl><thead><tr><th>Link</th><th>Type</th><th>Why (curated)</th><th class=n>Reports tested</th><th class=n>Reaction ÷ normal</th><th class=n>Same direction</th><th class=n>Correlation</th><th>Data check</th></tr></thead><tbody>' + er + "</tbody></table></div>" + lims(["The relationship map is analyst-curated from publicly known supplier/customer/capex/peer links and is not exhaustive; it is not auto-extracted from filings.", "Reaction measures use the linked stock's excess return vs SPY on the source's earnings reaction day; other news on the same day contaminates some observations, and 12–16 reports is a small sample.", "A flag says a linked name may move; it does not say in which direction. Direction depends on the source's surprise, and the data check shows how often they moved the same way."]);
  }
  /* ---------- 6. scoreboard ---------- */
  function sres(r) {
    if (!r) return ID;
    if (r.meanExcess == null && r.hit == null) return '<span class="r6-dim">' + esc(r.status || ID) + "</span>";
    return "<span class=\"" + cls(r.meanExcess) + '">' + (r.meanExcess != null ? pc(r.meanExcess, 2) : "") + "</span>" + (r.ci ? '<div class="r6-dim">' + pc(r.ci[0], 1) + " to " + pc(r.ci[1], 1) + "</div>" : "") + '<div class="r6-dim">hit ' + (r.hit != null ? nn(r.hit, 0) + "%" : ID) + " · " + r.cohorts + " cohorts · " + r.positions + " pos</div>";
  }
  function wchip(w, status) { return chip("×" + Number(w).toFixed(2) + (status && status !== "working" && status !== "inconclusive" ? " · " + status : ""), w < 1 ? "bad" : status === "working" ? "ok" : "sc"); }
  function score() {
    var rows = SB.families.map(function (f) {
      var r5 = f.results["5"], r20 = f.results["20"], ev = f.results.event, main = r20 || ev || r5 || {}, status = (r20 && r20.status !== "no matured outcomes yet") ? r20.status : (r5 && r5.status) || (ev && ev.status);
      if (ev && !r5) return "<tr><td><b>" + esc(f.label) + '</b><div class="r6-dim">' + esc(f.source) + '</div></td><td colspan=2 class="r6-note">' + esc(ev.reason || "") + (ev.hit != null ? " · hit " + nn(ev.hit, 0) + "%" : "") + "</td><td>" + chip(ev.status || ID, ev.status === "retired" ? "bad" : "warn") + "</td><td>" + wchip(f.weight, ev.status) + "</td></tr>";
      return "<tr><td><b>" + esc(f.label) + '</b><div class="r6-dim">' + esc(f.source) + "</div></td><td>" + sres(r5) + "</td><td>" + sres(r20) + "</td><td>" + chip(status || ID, status === "failing" || status === "underperforming" ? "bad" : status === "working" ? "ok" : "warn") + '<div class="r6-dim" style="max-width:260px;white-space:normal">' + esc(main.reason || "") + "</div></td><td>" + wchip(f.weight, status) + "</td></tr>";
    }).join("");
    var rw = SB.ruleWeights || {}, ic = SB.scoreIC || {};
    return head("score", "Every signal and forecast family is graded against what actually happened, using Thesis Scout's ground-truth data (pack cohorts, daily score files, gate history) plus our own forward logs. A family that fails on enough independent evidence is automatically downweighted.", SB)
      + '<div class="e-kpi"><div><b>' + SB.families.length + "</b>families tracked</div><div><b>" + SB.downweighted.length + "</b>downweighted now" + (SB.downweighted.length ? ": " + esc(SB.downweighted.join(", ")) : "") + "</div><div><b>×" + Number(rw.S3 == null ? 1 : rw.S3).toFixed(2) + " / ×" + Number(rw.MOM == null ? 1 : rw.MOM).toFixed(2) + "</b>weights on S3 / 12-1 momentum in the top-3 ordering</div></div>"
      + '<div class="r6-box"><b>The rule.</b> ' + esc(SB.rule) + " <b>Today almost every family reads '" + ID + "'</b> because outcomes need time (and overlap): that is the system working as designed, not a pass. Weights apply to the Game plan ordering (S3 / momentum tiers); the other families inform trust chips.</div>"
      + "<h3>Families</h3><div class=r6-tbl-wrap><table class=r6-tbl><thead><tr><th>Family</th><th>5 trading days: mean excess vs SPY</th><th>20 trading days: mean excess vs SPY</th><th>Status</th><th>Weight</th></tr></thead><tbody>" + rows + "</tbody></table></div>"
      + '<p class="r6-note">Mean excess is the position-weighted average of cohort returns minus SPY; the range under it is a 90% block bootstrap over cohorts. Rank IC of the combined score vs forward excess return: 5d ' + (ic["5"] && ic["5"].mean != null ? nn(ic["5"].mean, 3) + " over " + ic["5"].days + " days" : ID) + ", 20d " + (ic["20"] && ic["20"].mean != null ? nn(ic["20"].mean, 3) + " over " + ic["20"].days + " days" : ID) + ".</p>"
      + '<p class="r6-note">' + esc(SB.labels) + "</p>" + lims(SB.limitations);
  }
  /* ---------- 7. Scout analytics ---------- */
  function tbl(heads, rows) { return '<div class=r6-tbl-wrap><table class=r6-tbl><thead><tr>' + heads.map(function (h) { return "<th>" + h + "</th>"; }).join("") + "</tr></thead><tbody>" + rows.join("") + "</tbody></table></div>"; }
  function sm(o) { return o && o.n != null ? '<span class="' + cls(o.mean_excess_pct) + '">' + pc(o.mean_excess_pct, 2) + "</span> <span class=r6-dim>n=" + o.n + (o.small_sample ? " small" : "") + "</span>" : ID; }
  function waiting(s, label) { return '<div class="e-card"><h3 style="margin-top:0">' + esc(label) + " " + chip("waiting for Thesis Scout", "warn") + '</h3><p class="r6-note">No output file yet. Expected: <code>' + esc(s.expect || "") + "</code>" + (s.script ? " (script " + esc(s.script) + ")" : "") + ". This tab picks it up automatically on the next build.</p></div>"; }
  function genericBlock(s) {
    var out = '<div class="e-card"><h3 style="margin-top:0">' + esc(s.label) + " " + chip("live", "ok") + '</h3><p class="r6-note">' + esc(s.file || "") + (s.generated ? " · generated " + esc(s.generated) : "") + "</p>";
    var sc = s.scalars || {}; var ks = Object.keys(sc).slice(0, 12); if (ks.length) out += "<ul class=r6-note>" + ks.map(function (k) { return "<li><b>" + esc(k) + ":</b> " + esc(typeof sc[k] === "object" ? JSON.stringify(sc[k]) : sc[k]) + "</li>"; }).join("") + "</ul>";
    Object.keys(s.tables || {}).slice(0, 4).forEach(function (k) { var t = s.tables[k]; var cols = Object.keys(t[0] || {}).filter(function (c) { return typeof t[0][c] !== "object"; }).slice(0, 9); out += "<h4>" + esc(k) + "</h4>" + tbl(cols.map(esc), t.slice(0, 40).map(function (r) { return "<tr>" + cols.map(function (c) { return "<td>" + esc(r[c] == null ? ID : (typeof r[c] === "number" ? Number(r[c].toFixed ? r[c].toFixed(2) : r[c]) : r[c])) + "</td>"; }).join("") + "</tr>"; })); });
    return out + "</div>";
  }
  function sd(c) { return c && c.status === "ok" ? '<span class="' + cls(c.mdm) + '">' + pc(c.mdm, 1) + '</span> <span class=r6-dim>±' + nn(c.se, 1) + " · " + c.dates + " dates · n=" + c.n + "</span>" : '<span class=r6-dim>' + ID + "</span>"; }
  function decay(D) {
    var H = ["1d", "5d", "10d", "15d", "20d", "30d", "40d", "60d"];
    var rows = ["pooled", "rs", "mom"].map(function (k) { return "<tr><td><b>" + ({ pooled: "All pack members (pooled)", rs: "RS leaders (top decile 6-month return)", mom: "12-1 momentum (top decile)" })[k] + "</b></td>" + H.map(function (h) { return "<td>" + sd(D[k][h]) + "</td>"; }).join("") + "</tr>"; });
    rows.push("<tr><td>Rest of captured names (RS / momentum)</td>" + H.map(function (h) { return "<td>" + sd(D.restRs[h]) + '<div class="r6-dim">' + (D.restMom[h].status === "ok" ? pc(D.restMom[h].mdm, 1) : ID) + "</div></td>"; }).join("") + "</tr>");
    var pk = tbl(["Screen / pack", "5d vs SPY", "10d", "20d", "20d vs captured universe", "Obs at 20d"], D.packs.map(function (r) { var f = function (x) { return typeof x === "number" ? '<span class="' + cls(x) + '">' + pc(x, 2) + "</span>" : '<span class=r6-dim>' + ID + "</span>"; }; return "<tr><td>" + esc(r.pack) + "</td><td>" + f(r.d5) + "</td><td>" + f(r.d10) + "</td><td>" + f(r.d20) + "</td><td>" + f(r.rel20) + "</td><td class=n>" + (r.n20 != null ? r.n20 : ID) + "</td></tr>"; }));
    var lq = Object.keys(D.liquidity).map(function (k) { var v = D.liquidity[k]; return "<tr><td>" + esc(k) + "</td><td>" + sd(v["5d"]) + "</td><td>" + sd(v["20d"]) + "</td></tr>"; }).join("");
    return '<div class="e-card"><h3 style="margin-top:0">Per-screen edge decay and capacity ' + chip("live", "ok") + '</h3><p class="r6-note">Scout edge_decay.json · generated ' + esc(D.generated) + ". " + esc(D.availability || "") + "</p>"
      + "<h4>Mean excess return vs SPY by holding horizon (mean of date means ± standard error across dates)</h4>" + tbl(["Cohort"].concat(H), rows)
      + '<p class="r6-note"><b>Live point-in-time result:</b> RS leaders ' + sd(D.rs["20d"]) + " and 12-1 momentum " + sd(D.mom["20d"]) + " at 20 trading days: this is the survivorship-free read of the same rules that look excellent in the 15-year survivor backtest (see Backtests tab).</p>"
      + "<h4>By screen (mean of date means, excess vs SPY)</h4>" + pk + "<h4>By liquidity tercile (all packs)</h4>" + tbl(["Tercile", "5d", "20d"], [lq]).replace("<tbody><tr>", "<tbody><tr>") 
      + '<ul class=r6-note>' + (D.caveats || []).map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul></div>";
  }
  function dilution(D) {
    var cnt = Object.keys(D.categories || {}).map(function (k) { return esc(k) + ": " + D.categories[k]; }).join(" · ");
    function row(r) {
      var y = r.yoyStatus === "ok" ? '<span class="' + (r.yoy >= 10 ? "r6-fail" : "") + '">' + pc(r.yoy, 1) + "</span>" : '<span class=r6-dim>' + esc(r.yoyStatus.indexOf("data error") === 0 ? "data error, excluded" : r.yoyStatus) + "</span>";
      var f = typeof r.flag === "string" ? chip("none in 90d", "ok") : (r.flag || []).map(function (x) { return chip(x, "bad"); }).join("");
      var fl = (r.filings || []).map(function (x) { return '<div class="r6-dim"><a href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.form) + " " + esc(x.date) + "</a> " + esc(x.basis || "") + (x.txt && x.txt.length ? " · text: " + x.txt.map(esc).join(", ") : "") + "</div>"; }).join("");
      return "<tr" + (r.holding ? ' class="hold"' : "") + "><td>" + tk(r.t) + (r.holding ? " " + chip("holding", "sc") : "") + '<div class="r6-dim">' + esc(r.entity || "") + "</div></td><td>" + f + fl + "</td><td class=n>" + y + '</td><td class=n>' + (r.tv != null ? pc(r.tv, 1) : ID) + "</td></tr>";
    }
    var H = ["Ticker", "Offering / debt filings, last 90 days", "Shares YoY (Yahoo)", "TradingView share change"];
    return '<div class="e-card"><h3 style="margin-top:0">Dilution / corporate-action tape ' + chip("live", "ok") + '</h3><p class="r6-note">Scout dilution_tape.json · generated ' + esc(D.generated) + " · " + D.checked + " tickers checked, " + D.anyFlag + " with a flag in the last 90 days · holdings flagged: " + ((D.holdingsFlagged || []).length ? D.holdingsFlagged.join(", ") : "none") + "</p>"
      + '<p class="r6-note">' + cnt + "</p><h4>Holdings and top setups</h4>" + tbl(H, D.focus.map(row))
      + "<details class=e-d><summary>Other flagged names (top " + D.flagged.length + " of " + D.flaggedTotal + ")</summary>" + tbl(H, D.flagged.map(row)) + "</details>"
      + '<p class="r6-note"><b>Share-count data errors:</b> ' + D.dataErrorN + " tickers showed a one-year share-count change above +100% or below -50% in the free feed (splits or unit changes) and are excluded from any dilution reading. Largest plausible increases (10-100%): " + (D.dilutiveShares || []).map(function (x) { return esc(x[0]) + " " + pc(x[1], 0); }).join(", ") + ".</p>"
      + '<ul class=r6-note>' + (D.caveats || []).map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul></div>";
  }
  function scout() {
    var S = SO.sources, hd = S.holdings_drift, pt = S.pack_turnover, rb = S.replacement_bar, out = "";
    if (hd.present) {
      out += '<div class="e-card"><h3 style="margin-top:0">Holdings drift monitor ' + chip("live", "ok") + '</h3><p class="r6-note">Scout ' + esc(hd.file) + " · generated " + esc(hd.generated) + " · prices through " + esc(hd.asOf) + "</p>"
        + tbl(["Holding", "Close", "SMA50 / SMA200", "RSI", "Score", "Hysteresis", "Hard gates failed", "Pack rules failed", "Cyclical (Lynch)"], hd.rows.map(function (r) { return "<tr><td>" + tk(r.t) + '<div class="r6-dim">' + esc(r.industry || "") + "</div></td><td class=n>" + nn(r.close, 2) + "</td><td class=n>" + nn(r.sma50, 0) + " / " + nn(r.sma200, 0) + "</td><td class=n>" + nn(r.rsi, 0) + "</td><td class=n>" + nn(r.score, 0) + "</td><td>" + esc(r.status || ID) + (r.pointsAboveExit != null ? '<div class="r6-dim">' + nn(r.pointsAboveExit, 0) + " pts above exit</div>" : "") + "</td><td>" + ((r.gatesFailed || []).map(function (x) { return chip(x, "bad"); }).join("") || chip("none", "ok")) + ((r.gatesInsufficient || []).length ? '<div class="r6-dim">' + ID + ": " + r.gatesInsufficient.map(esc).join(", ") + "</div>" : "") + "</td><td>" + ((r.packFailed || []).map(function (x) { return chip(x, "warn"); }).join("") || chip("none", "ok")) + "</td><td>" + (r.cyclical ? chip("cyclical peak?", "warn", r.cyclical) + '<div class="r6-dim">' + esc(r.cyclicalBasis || "") + "</div>" : '<span class="r6-dim">no</span>') + "</td></tr>"; }))
        + '<h4>Swap-line check</h4><ul class=r6-note>' + Object.keys(hd.swapLine).map(function (t) { var v = hd.swapLine[t]; return "<li><b>" + esc(t) + "</b> (given " + esc(v.given) + "): " + esc(v.verdict) + (v.flag ? " " + chip("disagrees", "bad") : "") + "</li>"; }).join("") + "</ul>"
        + (hd.concentration && hd.concentration.marked_to_latest_close ? '<p class="r6-note"><b>Concentration (marked to latest close, ' + (hd.concentration.sezl_excluded ? "SEZL size " + ID + ", excluded" : "") + "):</b> semiconductors " + nn(hd.concentration.marked_to_latest_close.semiconductors_pct_of_known, 1) + "% of known holdings.</p>" : "")
        + '<ul class=r6-note>' + (hd.caveats || []).map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul></div>";
    } else out += waiting(hd, "Holdings drift monitor");
    if (pt.present) {
      out += '<div class="e-card"><h3 style="margin-top:0">Exit-reason analysis and pack turnover ' + chip("live", "ok") + '</h3><p class="r6-note">Scout pack_turnover.json · generated ' + esc(pt.generated) + " · " + pt.totals.pack_pairs + " pack-date pairs, " + pt.totals.exit_observations + " exits, " + pt.totals.exits_reason_insufficient_data + " exits with " + ID + " on the reason.</p>"
        + "<h4>Exited names vs stayers (excess return vs SPY)</h4>" + tbl(["Window", "Exited", "Stayed", "Exited − stayed (same pack, same date)"], ["5d", "20d"].map(function (w) { var o = (pt.overall || {})[w] || {}; return "<tr><td>" + w + "</td><td>" + sm(o.exited) + "</td><td>" + sm(o.stayed) + "</td><td>" + sm(o.exited_minus_stayed_same_pack_date_pct) + "</td></tr>"; }))
        + "<h4>By primary exit reason</h4>" + tbl(["Reason", "Exits", "5d vs SPY", "5d vs stayers", "20d vs SPY", "20d vs stayers"], pt.byReason.map(function (r) { return "<tr><td>" + esc(r.reason) + "</td><td class=n>" + r.n + "</td><td>" + sm(r.s5) + "</td><td>" + sm(r.st5) + "</td><td>" + sm(r.s20) + "</td><td>" + sm(r.st20) + "</td></tr>"; }))
        + "<h4>By pack</h4>" + tbl(["Pack", "Pairs", "Avg turnover", "5d exited − stayed", "20d exited − stayed"], pt.byPack.map(function (r) { return "<tr><td>" + esc(r.pack) + "</td><td class=n>" + r.pairs + "</td><td class=n>" + nn(r.turnover, 0) + "%</td><td>" + sm(r.diff5) + "</td><td>" + sm(r.diff20) + "</td></tr>"; }))
        + '<ul class=r6-note>' + (pt.caveats || []).map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul></div>";
    } else out += waiting(pt, "Pack turnover");
    if (rb.present) {
      out += '<div class="e-card"><h3 style="margin-top:0">2x replacement-bar scorer ' + chip("live", "ok") + '</h3><p class="r6-note">' + esc(rb.rule || "") + " · generated " + esc(rb.generated) + "</p>"
        + tbl(["Holding", "Fwd revenue growth", "Fwd EPS growth", "Q (ROIC×FCF margin)", "2x bar (rev / Q)", "Strict verdict", "Relaxed (revenue only)", "Nearest misses"], rb.holdings.map(function (h) { var m = h.metrics || {}, b = h.bar || {}; return "<tr><td>" + tk(h.t) + '<div class="r6-dim">composite ' + nn(h.composite, 0) + "</div></td><td class=n>" + nn(m.fwd_rev_growth_pct, 0) + "%</td><td class=n>" + (m.fwd_eps_growth_pct != null ? nn(m.fwd_eps_growth_pct, 0) + "%" : ID) + "</td><td class=n>" + nn(m.Q_geomean, 1) + "</td><td class=n>" + nn(b.fwd_rev_growth_2x_threshold_pct, 0) + "% / " + nn(b.Q_2x_threshold, 0) + "</td><td>" + chip(h.strict || ID, /none/.test(h.strict || "") ? "sc" : "ok") + "</td><td>" + chip(h.relaxed || ID, /none/.test(h.relaxed || "") ? "sc" : "ok") + '</td><td class="r6-note">' + (h.near || []).slice(0, 3).map(function (n) { return esc(n.ticker) + " (" + esc((n.ratios_vs_holding || {}).fwd_rev_growth_x) + "x growth, " + esc((n.ratios_vs_holding || {}).Q_x) + "x Q)"; }).join(" · ") + "</td></tr>"; }))
        + '<p class="r6-note">Inputs missing (' + ID + ", never imputed): " + Object.keys(rb.missing || {}).map(function (k) { return esc(k) + " " + rb.missing[k]; }).join(", ") + '.</p><ul class=r6-note>' + (rb.caveats || []).map(function (c) { return "<li>" + esc(c) + "</li>"; }).join("") + "</ul></div>";
    } else out += waiting(rb, "2x replacement-bar scorer");
    out += S.dilution_tape.present ? dilution(S.dilution_tape) : waiting(S.dilution_tape, S.dilution_tape.label);
    out += S.edge_decay.present ? decay(S.edge_decay) : waiting(S.edge_decay, S.edge_decay.label);
    return head("scout", "Thesis Scout's analytics scripts, summarised here read-only. All five scripts are live: exit-reason analysis and pack turnover, holdings drift, 2x replacement bar, dilution tape and per-screen decay.", SO) + out;
  }
  /* ---------- point-in-time validation (appended to Quant > Backtests) ---------- */
  function pitSection() {
    if (!PT) return "";
    var R = PT.results, order = ["5", "20"];
    function cell(o) { return o && o.mean != null ? '<span class="' + cls(o.mean) + '">' + pc(o.mean, 2) + '</span><div class="r6-dim">' + pc(o.ci[0], 1) + " to " + pc(o.ci[1], 1) + " · " + o.dates + " dates · " + o.signals + " signals</div>" : '<span class="r6-dim">' + ID + (o && o.dates != null ? " (" + o.dates + " dates)" : "") + "</span>"; }
    var rows = ["S3", "MOM"].map(function (r) {
      return order.map(function (h) { var x = R[h]; return "<tr><td><b>" + (r === "S3" ? "S3 RS leaders" : "12-1 momentum, top quintile") + "</b></td><td>" + h + " trading days</td><td>" + cell(x.pit.exSpy[r]) + "</td><td>" + cell((x.pitInSurvivor.exSpy || {})[r]) + "</td><td>" + cell(x.survivor.exSpy[r]) + "</td><td>" + cell(x.pit.exUniv[r]) + "</td></tr>"; }).join("");
    }).join("");
    var lr = PT.longRunSurvivor || {}, lrr = ["S3", "MOM", "UNIVERSE_EW", "SPY"].filter(function (k) { return lr[k]; }).map(function (k) { var a = lr[k].inSample || {}, o = lr[k].oos || {}; return "<tr><td>" + esc((lr[k].label || k).split(" (")[0]) + "</td><td class=n>" + nn(a.cagr) + "%</td><td class=n>" + nn(a.sharpe, 2) + "</td><td class=n>" + (o.cagr != null ? nn(o.cagr) + "%" : ID) + "</td><td class=n>" + (o.sharpe != null ? nn(o.sharpe, 2) : ID) + "</td></tr>"; }).join("");
    var c = PT.captures, lv = window.SCOUT && window.SCOUT.livePit;
    var liveBox = lv && lv.present ? '<div class="r6-box"><b>Live point-in-time deciles (Thesis Scout, edge_decay.json):</b> within names that actually appeared in Finviz captures, the top decile of 6-month return (RS leaders) returned ' + sd(lv.rs["20d"]) + " versus SPY over 20 trading days, and the top decile of 12-1 momentum returned " + sd(lv.mom["20d"]) + " (5 days: RS " + sd(lv.rs["5d"]) + ", momentum " + sd(lv.mom["5d"]) + "). Compare with the 15-year survivor backtest above (S3 CAGR 40%, 12-1 momentum 30%): the survivorship-free live read is the opposite sign so far, over a window of about 7 weeks with heavily overlapping cohorts.</div>" : "";
    return "<h3>Point-in-time validation (S3 and 12-1 momentum)</h3>" + liveBox
      + '<div class="r6-box" style="border-color:#c55"><b>Survivorship bias, labelled.</b> The 15-year backtests above rank today\'s 298 scored names, which are survivors and winners. The table below applies the same two rules inside the universe of names that were actually in the Finviz captures on each date since ' + esc(c.first) + " (" + c.count + " capture dates, " + c.tickersUnion + " tickers, " + c.missingTradingDays.length + " trading days with no capture: " + esc(c.missingTradingDays.join(", ")) + "). It is point-in-time for membership, but only about two months long, so read it as a sanity check on the bias, not as proof.</div>"
      + "<div class=r6-tbl-wrap><table class=r6-tbl><thead><tr><th>Rule</th><th>Forward window</th><th>Point-in-time Finviz universe<div class=r6-dim>mean excess vs SPY, 90% interval</div></th><th>Point-in-time ∩ today's survivors</th><th>Survivor universe (same dates)</th><th>Point-in-time vs its own universe</th></tr></thead><tbody>" + rows + "</tbody></table></div>"
      + '<p class="r6-note">Matured outcomes: 5-day windows for ' + PT.matured["5"].dates + " capture dates (to " + esc(PT.matured["5"].last) + "), 20-day for " + PT.matured["20"].dates + " (to " + esc(PT.matured["20"].last) + "). Consecutive dates overlap heavily, so intervals are block-bootstrapped and still understate the uncertainty.</p>"
      + "<h4>Same rules, long-run survivor backtest (from the table above)</h4><div class=r6-tbl-wrap><table class=r6-tbl><thead><tr><th>Rule</th><th class=n>In-sample CAGR</th><th class=n>Sharpe</th><th class=n>Out-of-sample CAGR</th><th class=n>Sharpe</th></tr></thead><tbody>" + lrr + "</tbody></table></div>"
      + '<details class="e-d"><summary>Method and limits of the point-in-time test</summary><p class="r6-note">' + esc(PT.method) + "</p><ul class=r6-note>" + PT.limitations.map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") + "</ul></details>";
  }
  /* ---------- game plan block ---------- */
  function concLine() {
    try {
      var c = window.SCOUT.sources.holdings_drift.concentration, a = c.as_of_nov11, m = c.marked_to_latest_close;
      return "<li><b>Semiconductor concentration:</b> " + chip(nn(a.semiconductors_pct_of_known, 1) + "% of known dollars", "warn") + " (MU + CRDO, $" + Math.round(a.semiconductors_usd / 1000) + "k of $" + Math.round(a.total_known_usd / 1000) + "k known as of Nov 11; " + nn(m.semiconductors_pct_of_known, 1) + "% marked to the latest close). SEZL size is " + ID + " and excluded; PLTR trades in the same AI-capex theme (60-day correlation with MU " + nn(c.corr_60d_daily_returns.MU.PLTR, 2) + ", CRDO " + nn(c.corr_60d_daily_returns.CRDO.PLTR, 2) + "). Source: Thesis Scout holdings drift.</li>";
    } catch (e) { return ""; }
  }
  function gameplanExtra() {
    try {
      if (!EV || !E) return "";
      var out = "", hold = ["SEZL", "MU", "CRDO", "PLTR"];
      var er = EV.earnings.filter(function (r) { return hold.indexOf(r.t) >= 0 && r.implied; }).map(function (r) { return tk(r.t) + " " + esc(r.date) + ": implied ±" + nn(r.implied.usedPct, 1) + "% vs ±" + nn(r.hist.meanAbs, 1) + "% historical " + flagChip(r.flag); }).join(" · ");
      var kn = EV.supply.flags.filter(function (f) { return f.holding; }).slice(0, 6).map(function (f) { return tk(f.src) + (f.kind === "reported" ? " reported " + esc(f.date) : (f.days === 0 ? " reports today " + esc(f.timing || "") : " reports " + esc(f.date))) + " → " + tk(f.dst) + " " + chip(f.verdict || ID, f.verdict === "confirmed" ? "ok" : "warn"); }).join(" · ");
      var bp = hold.filter(function (t) { return E.beat.current[t]; }).map(function (t) { var b = E.beat.current[t]["63"]; return tk(t) + " " + pp(b[0], 1) + " (" + pp(b[1]) + "–" + pp(b[2]) + ")"; }).join(" · ");
      var sbd = window.PLAN && window.PLAN.scoreboard;
      out += "<h4>Edge signals <a class=\"r6-dim\" href=\"#/earnfc\" style=\"font-weight:400;font-size:12px\">earnings forecaster</a> · <a class=\"r6-dim\" href=\"#/supply\" style=\"font-weight:400;font-size:12px\">supply chain</a> · <a class=\"r6-dim\" href=\"#/beat\" style=\"font-weight:400;font-size:12px\">beat-SPY</a> · <a class=\"r6-dim\" href=\"#/score\" style=\"font-weight:400;font-size:12px\">scoreboard</a></h4><ul class=\"r6-note\" style=\"margin-top:0\">"
        + concLine() + (er ? "<li><b>Earnings, holdings:</b> " + er + "</li>" : "") + (kn ? "<li><b>Knock-on:</b> " + kn + "</li>" : "<li><b>Knock-on:</b> no mapped source reports near today.</li>")
        + "<li><b>Beat-SPY, 3 months</b> " + chip("model estimate", "warn") + " (no demonstrated skill out-of-sample): " + bp + "</li>"
        + "<li><b>ML ensemble:</b> " + (E.ml.survived ? "kept" : "retired") + " (" + E.ml.variantsTried + " variants tried). <b>Scoreboard:</b> " + (sbd ? (sbd.downweighted.length ? sbd.downweighted.length + " family(ies) downweighted" : "no family downweighted yet") + ", " + sbd.insufficient + " of " + sbd.families + " still " + ID : ID) + ".</li></ul>";
      return out;
    } catch (e) { return ""; }
  }
  /* ---------- router ---------- */
  function renderView(view) {
    var panel = document.getElementById("view-edge"); if (!panel) return;
    var on = VIEWS.indexOf(view) >= 0; panel.hidden = !on; if (!on) return;
    var root = document.getElementById("edge-root"); css(); if (window.R6UI && window.R6UI.css) window.R6UI.css();
    var need = { beat: E, mlens: E, earnfc: EV, tone: SE, supply: EV, score: SB && E && EV && SE, scout: SO }[view];
    if (!need) { root.innerHTML = '<div class="r6-wrap"><p>Data for this tab has not been published yet.</p></div>'; return; }
    var html = view === "beat" ? beat() : view === "mlens" ? mlens() : view === "earnfc" ? earnfc() : view === "tone" ? tone() : view === "supply" ? supply() : view === "score" ? score() : scout();
    root.innerHTML = '<div class="r6-wrap">' + html + "</div>";
    var bq = document.getElementById("e-bq"), bs = document.getElementById("e-bs");
    if (bq) { bs.value = st.bs; bq.addEventListener("input", function () { st.bq = bq.value; var p = bq.selectionStart; renderView("beat"); var n = document.getElementById("e-bq"); n.focus(); n.setSelectionRange(p, p); }); bs.addEventListener("change", function () { st.bs = bs.value; renderView("beat"); }); }
    var sq = document.getElementById("e-sq"), sf = document.getElementById("e-sf");
    if (sq) { sf.value = st.sf; sq.addEventListener("input", function () { st.sq = sq.value; var p = sq.selectionStart; renderView("supply"); var n = document.getElementById("e-sq"); n.focus(); n.setSelectionRange(p, p); }); sf.addEventListener("change", function () { st.sf = sf.value; renderView("supply"); }); }
  }
  window.EDGEUI = { renderView: renderView, pitSection: pitSection, gameplanExtra: gameplanExtra, VIEWS: VIEWS };
})();
