/* Quant UI: factor model, backtests + walk-forward, regime, portfolio/MC/correlation, PEAD, alt-data. Data: window.QUANT (quant.js, built by build_quant.py). Real data only. */
(function () {
  "use strict";
  var Q = window.QUANT;
  var VIEWS = ["qfactors", "qbacktest", "qregime", "qportfolio", "qpead", "qalt"];
  var TITLES = { qfactors: "Factors & risk rank", qbacktest: "Backtests & walk-forward", qregime: "Market regime", qportfolio: "Portfolio, MC & correlation", qpead: "Earnings drift (PEAD)", qalt: "Alt-data confirmation" };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var pc = function (x, d) { return x == null ? "n/a" : (x > 0 ? "+" : "") + Number(x).toFixed(d == null ? 1 : d) + "%"; };
  var num = function (x, d) { return x == null ? "n/a" : Number(x).toFixed(d == null ? 1 : d); };
  var usd = function (x) { return "$" + Math.round(x).toLocaleString("en-US"); };
  var cls = function (x) { return x == null ? "" : x >= 0 ? "r6-pass" : "r6-fail"; };
  var RULE_ORDER = ["gate", "S1", "S3", "S4", "S5", "S6", "MOM", "LOWVOL", "COMBO"];
  var st = { fq: "", fs: "all", aq: "", af: "all" };
  function css() {
    if (document.getElementById("q-css")) return;
    var s = document.createElement("style"); s.id = "q-css";
    s.textContent = ".q-heat{text-align:right;font-variant-numeric:tabular-nums}.q-strip{display:flex;height:22px;border-radius:6px;overflow:hidden;border:1px solid var(--line)}.q-strip i{flex:1}.q-kpi{display:flex;gap:10px;flex-wrap:wrap;margin:8px 0}.q-kpi div{background:var(--panel-2);border:1px solid var(--line);border-radius:10px;padding:7px 12px;font-size:12px;color:var(--muted)}.q-kpi b{display:block;font-size:17px;color:var(--text)}.q-big{font-size:22px;font-weight:700}.q-legend span{display:inline-block;margin-right:12px;font-size:12px}.q-legend i{display:inline-block;width:12px;height:3px;margin-right:4px;vertical-align:middle}.q-sub td,.q-sub th{font-size:12px}details.q-d{margin:6px 0}details.q-d summary{cursor:pointer;color:var(--teal)}";
    document.head.appendChild(s);
  }
  function tk(t) { return '<a href="#/stock/' + encodeURIComponent(t) + '"><b>' + esc(t) + "</b></a>"; }
  function chip(t, k) { return '<span class="r6-chip ' + (k || "") + '">' + esc(t) + "</span>"; }
  function nav(view) { return '<nav class="r6-nav">' + VIEWS.map(function (v) { return '<a href="#/' + v + '" class="' + (v === view ? "on" : "") + '">' + TITLES[v] + "</a>"; }).join("") + "</nav>"; }
  function head(view, lead) {
    return nav(view) + '<header class="r6-head"><p class="eyebrow">Research only · no trades · data as of ' + esc(Q.dataAsOf) + " · built " + esc(Q.generatedAt.replace("T", " ").slice(0, 16)) + ' Central</p><h2>' + TITLES[view] + '</h2><p class="r6-lead">' + lead + "</p></header>";
  }
  function heat(v) { if (v == null) return '<td class="q-heat r6-dim">–</td>'; var a = Math.abs(v - 50) / 50 * 0.45; var c = v >= 50 ? "46,160,110" : "220,80,90"; return '<td class="q-heat" style="background:rgba(' + c + "," + a.toFixed(2) + ')">' + v + "</td>"; }
  function limits() { return '<details class="q-d"><summary>Limitations (read before trusting any number here)</summary><ul class="r6-note">' + Q.limitations.map(function (l) { return "<li>" + esc(l) + "</li>"; }).join("") + "</ul></details>"; }
  function line(series, opts) {
    var W = 900, H = 300, pl = 46, pr = 8, pt = 8, pb = 22; var all = []; series.forEach(function (s) { s.pts.forEach(function (p) { all.push(p[1]); }); });
    var lo = Math.log(Math.min.apply(null, all)), hi = Math.log(Math.max.apply(null, all)); if (hi - lo < 1e-6) hi = lo + 1;
    var d0 = Date.parse(series[0].pts[0][0]), d1 = Date.parse(series[0].pts[series[0].pts.length - 1][0]);
    series.forEach(function (s) { var a = Date.parse(s.pts[0][0]), b = Date.parse(s.pts[s.pts.length - 1][0]); if (a < d0) d0 = a; if (b > d1) d1 = b; });
    var X = function (d) { return pl + (Date.parse(d) - d0) / (d1 - d0) * (W - pl - pr); }, Y = function (v) { return pt + (1 - (Math.log(v) - lo) / (hi - lo)) * (H - pt - pb); };
    var g = ""; for (var k = 0; k <= 4; k++) { var lv = Math.exp(lo + (hi - lo) * k / 4); g += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + Y(lv) + '" y2="' + Y(lv) + '" stroke="currentColor" opacity=".12"/><text x="2" y="' + (Y(lv) + 4) + '" font-size="10" fill="currentColor" opacity=".6">' + lv.toFixed(lv < 10 ? 1 : 0) + "x</text>"; }
    for (var y = new Date(d0).getFullYear() + 1; y <= new Date(d1).getFullYear(); y += 2) { var xx = X(y + "-01-01"); g += '<text x="' + xx + '" y="' + (H - 6) + '" font-size="10" fill="currentColor" opacity=".6" text-anchor="middle">' + y + "</text>"; }
    var paths = series.map(function (s) { return '<polyline fill="none" stroke="' + s.color + '" stroke-width="' + (s.w || 1.6) + '"' + (s.dash ? ' stroke-dasharray="5 3"' : "") + ' points="' + s.pts.map(function (p) { return X(p[0]).toFixed(1) + "," + Y(p[1]).toFixed(1); }).join(" ") + '"/>'; }).join("");
    return '<svg viewBox="0 0 ' + W + " " + H + '" style="width:100%;max-width:960px;color:var(--text)" role="img" aria-label="' + esc(opts.label) + '">' + g + paths + '</svg><div class="q-legend">' + series.map(function (s) { return '<span><i style="background:' + s.color + '"></i>' + esc(s.name) + "</span>"; }).join("") + "</div>";
  }
  function rule(k) { return Q.rules.filter(function (r) { return r.key === k; })[0]; }
  /* ---------- factors + risk rank ---------- */
  function factors() {
    var q = st.fq.trim().toUpperCase();
    var rows = Q.factors.filter(function (x) { if (q) return x.t.indexOf(q) >= 0 || String(x.name || "").toUpperCase().indexOf(q) >= 0; if (st.fs === "gate") return x.gate; return x.rank <= 40 || x.holding; });
    var rk = Q.riskRank.filter(function (x) { if (q) return x.t.indexOf(q) >= 0 || String(x.name || "").toUpperCase().indexOf(q) >= 0; if (st.fs === "gate") return x.gate; return x.rank <= 40 || x.holding; });
    var ft = rows.map(function (x) {
      return "<tr" + (x.holding ? ' class="hold"' : "") + "><td class=n>" + x.rank + "</td><td>" + tk(x.t) + (x.holding ? " " + chip("holding", "sc") : "") + '<div class="r6-dim">' + esc((x.name || "").slice(0, 28)) + "</div></td><td><b>" + num(x.composite) + "</b></td>" + heat(x.f.momentum) + heat(x.f.revisions) + heat(x.f.quality) + heat(x.f.value) + heat(x.f.lowvol)
        + "<td class=n>" + (x.score == null ? "n/a" : x.score) + "</td><td>" + (x.gate ? chip("passes gate", "ok") : '<span class="r6-dim">no</span>') + '</td><td class="r6-dim">' + x.coverage + "/5</td></tr>";
    }).join("");
    var rt = rk.map(function (x) {
      return "<tr" + (x.holding ? ' class="hold"' : "") + "><td class=n>" + x.rank + "</td><td>" + tk(x.t) + (x.holding ? " " + chip("holding", "sc") : "") + '<div class="r6-dim">' + esc((x.name || "").slice(0, 28)) + '</div></td><td class="n ' + cls(x.ret12) + '">' + pc(x.ret12) + "</td><td class=n>" + num(x.vol) + '%</td><td class="n r6-fail">' + pc(x.mdd) + "</td><td class=n>" + num(x.sharpe, 2) + "</td><td class=n>" + num(x.calmar, 2) + "</td><td class=n>" + (x.score == null ? "n/a" : x.score) + "</td><td>" + (x.gate ? chip("passes gate", "ok") : '<span class="r6-dim">no</span>') + "</td></tr>";
    }).join("");
    return head("qfactors", "Two views beside the combined score. <b>Factor model:</b> every name gets a 0–100 percentile on momentum 12-1, earnings revisions, quality, value and low volatility, plus an equal-weight composite. <b>Risk-adjusted rank:</b> trailing 12-month return per unit of volatility and per unit of max drawdown (trailing facts, not forecasts).")
      + '<div class="r6-bar"><input id="q-fq" placeholder="Filter ticker or name" value="' + esc(st.fq) + '"><select id="q-fs"><option value="top">Top 40 + holdings</option><option value="gate">Passes main gate</option></select></div>'
      + '<h3>Factor model (' + Q.universe + " names)</h3><p class=r6-note>" + esc(Q.factorMethod) + '</p><div class="r6-tbl-wrap"><table class="r6-tbl"><thead><tr><th class=n>#</th><th>Ticker</th><th>Composite</th><th>Mom 12-1</th><th>Revisions</th><th>Quality</th><th>Value</th><th>Low vol</th><th class=n>Score</th><th>Gate</th><th>Factors</th></tr></thead><tbody>' + ft + "</tbody></table></div>"
      + '<h3 style="margin-top:20px">Risk-adjusted ranking (trailing 12 months, 0% risk-free)</h3><p class=r6-note>Rank = average of the percentile on return/volatility and return/|max drawdown|. A high score with a poor risk rank means the return came with a deep or choppy ride.</p><div class="r6-tbl-wrap"><table class="r6-tbl"><thead><tr><th class=n>Risk rank</th><th>Ticker</th><th class=n>12m return</th><th class=n>Vol</th><th class=n>Max DD</th><th class=n>Ret/vol</th><th class=n>Ret/DD</th><th class=n>Score</th><th>Gate</th></tr></thead><tbody>' + rt + "</tbody></table></div>" + limits();
  }
  /* ---------- backtests ---------- */
  function bt() {
    var ew = rule("UNIVERSE_EW"), sp = rule("SPY");
    function cell(m, k) { return "<td class=n>" + (m && m[k] != null ? num(m[k], k === "sharpe" ? 2 : 1) : "n/a") + "</td>"; }
    var rows = RULE_ORDER.map(function (k) {
      var r = rule(k), a = r.inSample, o = r.oos, cs = r.costSens || {}; var ex = (o && ew.oos) ? o.cagr - ew.oos.cagr : null;
      return '<tr><td style="min-width:250px;max-width:320px;white-space:normal"><b>' + esc(r.label) + '</b><div class="r6-dim" style="font-size:11px">' + esc(r.note) + "</div></td>" + cell(a, "cagr") + cell(a, "sharpe") + cell(a, "mdd") + cell(a, "hit") + cell(a, "beatSpy")
        + '<td class="n" style="border-left:2px solid var(--line)">' + (o ? num(o.cagr) : "n/a") + "</td>" + cell(o, "sharpe") + cell(o, "mdd") + cell(o, "hit") + cell(o, "beatSpy")
        + '<td class="n ' + cls(ex) + '">' + pc(ex) + "</td><td class=n>" + num(cs["0"]) + " → " + num(cs["10"]) + " → " + num(cs["25"]) + '</td><td class=n>' + num(r.annualTurnover, 0) + "x</td><td class=n>" + num(a.avgNames) + " (" + a.pctInvested + "%)</td></tr>";
    }).join("");
    function ref(r, label) { var a = r.inSample, o = r.oos || {}; return "<tr><td><b>" + esc(label) + "</b></td>" + cell(a, "cagr") + cell(a, "sharpe") + cell(a, "mdd") + cell(a, "hit") + cell(a, "beatSpy") + '<td class=n style="border-left:2px solid var(--line)">' + (o.cagr != null ? num(o.cagr) : (r.key === "SPY" && Q.rules.length ? num(rule("gate").oosSpy.cagr) : "n/a")) + "</td>" + cell(o.sharpe != null ? o : (r.key === "SPY" ? rule("gate").oosSpy : null), "sharpe") + cell(o.sharpe != null ? o : (r.key === "SPY" ? rule("gate").oosSpy : null), "mdd") + cell(o.sharpe != null ? o : (r.key === "SPY" ? rule("gate").oosSpy : null), "hit") + "<td></td><td></td><td></td><td></td><td></td></tr>"; }
    var cv = Q.curves, C = { SPY: "#9aa4b2", UNIVERSE_EW: "#d4a017", gate: "#3aa6ff", S1: "#e0707f", S3: "#2eb87a", S4: "#a98bff", S6: "#ff9f43", MOM: "#19c3c3", COMBO: "#c0c0ff" };
    var isSeries = ["SPY", "UNIVERSE_EW", "gate", "S3", "S6", "MOM", "COMBO", "S1"].map(function (k) { return { name: k === "UNIVERSE_EW" ? "Equal-weight universe (survivors)" : k === "SPY" ? "SPY" : rule(k).label.split(" (")[0], color: C[k], pts: cv[k], w: k === "SPY" ? 2.2 : 1.5, dash: k === "UNIVERSE_EW" }; });
    var oosSeries = [{ name: "SPY", color: C.SPY, pts: cv.SPY, w: 2.2 }].concat(["gate", "S3", "S6", "MOM", "COMBO"].map(function (k) { return { name: k + " out-of-sample", color: C[k], pts: cv[k + "_oos"] }; }));
    var folds = RULE_ORDER.map(function (k) { var r = rule(k); return '<details class="q-d"><summary>' + esc(r.label.split(" (")[0]) + ": parameters chosen on each rolling 3-year window</summary><table class=\"r6-tbl q-sub\"><thead><tr><th>Train window</th><th>Applied to (unseen)</th><th>Chosen parameters</th><th class=n>Train Sharpe</th></tr></thead><tbody>" + r.folds.map(function (f) { return "<tr><td>" + esc(f.train) + "</td><td>" + esc(f.test) + "</td><td>" + esc(JSON.stringify(f.params).replace(/[{}"]/g, "").replace(/,/g, ", ")) + "</td><td class=n>" + num(f.trainSharpe, 2) + "</td></tr>"; }).join("") + "</tbody></table></details>"; }).join("");
    var best = RULE_ORDER.map(function (k) { return { k: k, ex: rule(k).oos.cagr - ew.oos.cagr, r: rule(k) }; }).sort(function (a, b) { return b.ex - a.ex; });
    var summary = "Out-of-sample, the survivor-universe benchmark itself returned " + pc(ew.oos.cagr) + " a year versus SPY " + pc(rule("gate").oosSpy.cagr) + ", so most apparent edge is the universe, not the rule. Rules that beat the equal-weight universe out-of-sample: "
      + (best.filter(function (b) { return b.ex > 0; }).map(function (b) { return b.k + " (" + pc(b.ex) + " a year)"; }).join(", ") || "none") + ". Rules that did not: " + (best.filter(function (b) { return b.ex <= 0; }).map(function (b) { return b.k; }).join(", ") || "none") + ".";
    return head("qbacktest", "Weekly rebalance, signal at the close, trade at the next close, " + Q.costBps + " bps per side, equal weight, cash when a rule has no signals. History " + esc(Q.history.backtestFrom) + " to " + esc(Q.history.backtestTo) + " (" + Q.history.weeks + " weeks, free Yahoo daily data). <b>In-sample</b> uses the fixed thresholds the site uses today; <b>out-of-sample</b> tunes parameters on rolling 3-year windows and reports only the next unseen year, stitched (" + Q.folds.count + " folds).")
      + '<div class="r6-box">' + esc(summary) + " Survivorship bias is large: the universe is today's winners and survivors, so every line is flattered.</div>"
      + '<div class="r6-tbl-wrap"><table class="r6-tbl"><thead><tr><th rowspan=2>Rule</th><th colspan=5>In-sample (fixed site thresholds, net of costs)</th><th colspan=6 style="border-left:2px solid var(--line)">Out-of-sample (walk-forward, net of costs)</th><th rowspan=2 class=n>CAGR at 0→10→25 bps</th><th rowspan=2 class=n>Turnover / yr</th><th rowspan=2 class=n>Avg names (invested)</th></tr><tr><th class=n>CAGR %</th><th class=n>Sharpe</th><th class=n>Max DD %</th><th class=n>Hit % wks</th><th class=n>Beat SPY % wks</th><th class=n style="border-left:2px solid var(--line)">CAGR %</th><th class=n>Sharpe</th><th class=n>Max DD %</th><th class=n>Hit %</th><th class=n>Beat SPY %</th><th class=n>vs universe (CAGR)</th></tr></thead><tbody>'
      + rows + ref(sp, "SPY buy and hold (price only)") + ref(ew, "Equal-weight survivor universe (no costs)") + "</tbody></table></div>"
      + '<p class="r6-note">Hit = % of invested weeks with a positive return. Beat SPY = % of weeks the rule beat SPY. Sharpe uses 0% risk-free and weekly returns × √52. Max drawdown is on weekly closes. Out-of-sample SPY/universe rows cover only the unseen years.</p>'
      + '<h3>In-sample growth of $1 (log scale)</h3>' + line(isSeries, { label: "In-sample growth" }) + '<h3>Out-of-sample growth of $1 (unseen years only)</h3>' + line(oosSeries, { label: "Out-of-sample growth" })
      + "<h3>Walk-forward detail</h3>" + folds + limits();
  }
  /* ---------- regime ---------- */
  function regime() {
    var R = Q.regime, c = R.current, col = c.label === "risk-on" ? "ok" : c.label === "risk-off" ? "bad" : "warn";
    var strip = '<div class="q-strip" title="Last ~10 years, monthly samples">' + R.history.map(function (h) { return '<i style="background:' + (h.l === "risk-on" ? "#2eb87a" : h.l === "risk-off" ? "#e0707f" : "#d4a017") + '" title="' + h.d + " " + h.l + " (" + h.t + '/8)"></i>'; }).join("") + "</div>";
    var tr = ["gate", "S1", "S3", "S4", "S5", "S6", "MOM", "LOWVOL", "COMBO"].map(function (k) {
      var p = R.perRule[k]; var cells = ["risk-on", "neutral", "risk-off"].map(function (l) { var x = p[l]; if (!x || x.annExcess == null) return '<td class="r6-dim">n/a</td>'; return '<td><span class="r6-chip ' + (x.trusted === "trusted" ? "ok" : x.trusted === "weak sample" ? "warn" : "bad") + '">' + x.trusted + '</span><div class="r6-dim">' + pc(x.annExcess) + " vs universe · " + pc(x.annExcessSpy) + " vs SPY · " + x.weeks + " wks</div></td>"; }).join("");
      return "<tr" + (R.perRule[k][c.label] && R.perRule[k][c.label].trusted === "trusted" ? ' class="hold"' : "") + "><td><b>" + esc(rule(k).label.split(" (")[0]) + "</b></td>" + cells + "</tr>";
    }).join("");
    var inp = [["SPY trend", c.pts.trend + "/2", "SPY " + num(c.spy, 2) + " vs 200-day " + num(c.spy200, 2) + ", 50-day " + num(c.spy50, 2)], ["VIX", c.pts.vix + "/2", "VIX " + num(c.vix, 2) + " (below 18 = 2, below 25 = 1)"], ["Credit (HYG/LQD)", c.pts.credit + "/2", "ratio " + num(c.hygLqd, 4) + " vs 50-day " + num(c.hygLqd50, 4) + (c.fredOas ? " · FRED high-yield OAS " + num(c.fredOas.oas, 2) + "% on " + esc(c.fredOas.date) : "")], ["Breadth", c.pts.breadth + "/2", num(c.breadth50, 0) + "% of universe above 50-day, " + num(c.breadth200, 0) + "% above 200-day"]];
    return head("qregime", "A four-input regime score (trend, volatility, credit, breadth) labels each week risk-on, neutral or risk-off. The table marks which rules were historically trusted in each regime, so you can see which screens fit the current one.")
      + '<div class="r6-card"><div class="q-big">Current regime: ' + chip(c.label.toUpperCase(), col) + " " + c.total + '/8</div><div class="q-kpi">' + inp.map(function (i) { return "<div>" + esc(i[0]) + "<b>" + i[1] + '</b><span style="font-size:11px">' + esc(i[2]) + "</span></div>"; }).join("") + "</div>"
      + '<p class="r6-note">Rules trusted in the current regime (' + esc(c.label) + "): <b>" + (RULE_ORDER.filter(function (k) { return Q.trustNow[k] === "trusted"; }).map(function (k) { return esc(rule(k).label.split(" (")[0]); }).join(", ") || "none") + "</b>. Weeks in each regime over the backtest: risk-on " + R.weeksByRegime["risk-on"] + ", neutral " + R.weeksByRegime.neutral + ", risk-off " + R.weeksByRegime["risk-off"] + ".</p>" + strip + '<p class="r6-note">Monthly regime history (green risk-on, amber neutral, red risk-off), oldest at left.</p></div>'
      + '<h3>Which rules were trusted in which regime</h3><div class="r6-tbl-wrap"><table class="r6-tbl"><thead><tr><th>Rule</th><th>Risk-on</th><th>Neutral</th><th>Risk-off</th></tr></thead><tbody>' + tr + "</tbody></table></div><p class=r6-note>" + esc(R.method) + "</p>" + limits();
  }
  /* ---------- portfolio ---------- */
  function mcRow(label, m, start) {
    function v(x) { return start ? usd(x * start) + ' <span class="r6-dim">' + num(x, 2) + "x</span>" : num(x, 2) + "x"; }
    return "<tr><td>" + esc(label) + "</td><td class=n>" + v(m.p5) + "</td><td class=n>" + v(m.p25) + "</td><td class=n>" + v(m.p50) + "</td><td class=n>" + v(m.p75) + "</td><td class=n>" + v(m.p95) + "</td><td class=n>" + m.probLoss + "%</td><td class=n>" + m.probLoss20 + "%</td><td class=n>" + m.probDD30 + "%</td><td class=n>" + pc(m.medMaxDD) + "</td></tr>";
  }
  function corrTbl(m, tk_) {
    return '<table class="r6-tbl q-sub"><thead><tr><th></th>' + tk_.map(function (t) { return "<th class=n>" + t + "</th>"; }).join("") + "</tr></thead><tbody>" + tk_.map(function (a) { return "<tr><th>" + a + "</th>" + tk_.map(function (b) { var v = m[a][b]; var bg = a === b ? "" : v >= 0.7 ? "background:rgba(220,80,90,.45)" : v >= 0.5 ? "background:rgba(212,160,23,.35)" : ""; return '<td class=n style="' + bg + '">' + (a === b ? "–" : v.toFixed(2)) + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table>";
  }
  function portfolio() {
    var P = Q.portfolio, books = Object.keys(P).map(function (b) {
      var p = P[b], s = p.stats, start = b === "Book 2" ? p.mcRaw.startValue : null;
      var wt = p.tickers.map(function (t) { return t + " " + Math.round(p.weights[t] * 100) + "%"; }).join(" · ");
      var asset = p.tickers.map(function (t) { var a = p.perAsset[t]; return "<tr><td><b>" + t + "</b></td><td class=n>" + pc(a.annRet, 0) + "</td><td class=n>" + num(a.vol, 0) + "%</td><td class=n>" + pc(a.maxDD, 0) + "</td><td class=n>" + num(a.beta, 2) + "</td></tr>"; }).join("");
      return '<div class="r6-card"><h3>' + b + ": " + esc(p.tickers.join(" + ")) + '</h3><p class="r6-note">Weights: ' + esc(wt) + ". " + esc(p.basis) + " Window " + esc(s.window) + " (" + s.days + " trading days).</p>"
        + '<div class="q-kpi"><div>Trailing annual return<b>' + pc(s.annRet, 0) + "</b></div><div>Volatility<b>" + num(s.vol, 0) + "%</b></div><div>Max drawdown<b>" + pc(s.maxDD, 0) + "</b></div><div>Beta vs SPY<b>" + num(s.beta, 2) + "</b></div><div>Return/vol<b>" + num(s.sharpe, 2) + "</b></div><div>Last 12 months<b>" + pc(s.last12m, 0) + '</b></div></div><p class="r6-note">SPY over the same 3 years: ' + pc(Q.spyRef.annRet, 0) + " a year, vol " + num(Q.spyRef.vol, 0) + "%, max drawdown " + pc(Q.spyRef.maxDD, 0) + ". Trailing, not a forecast; the return figure is far above anything sustainable.</p>"
        + '<table class="r6-tbl q-sub"><thead><tr><th>Asset</th><th class=n>Ann. return</th><th class=n>Vol</th><th class=n>Max DD</th><th class=n>Beta</th></tr></thead><tbody>' + asset + "</tbody></table>"
        + "<h4>12-month bootstrap Monte Carlo (10,000 paths, resampled real daily returns, buy and hold, start = 1.00x" + (start ? " = " + usd(start) : "") + ')</h4><div class="r6-tbl-wrap"><table class="r6-tbl q-sub"><thead><tr><th>Scenario</th><th class=n>5th pct</th><th class=n>25th</th><th class=n>Median</th><th class=n>75th</th><th class=n>95th</th><th class=n>P(loss)</th><th class=n>P(−20%)</th><th class=n>P(DD &gt; 30%)</th><th class=n>Median max DD</th></tr></thead><tbody>'
        + mcRow("Raw: trailing 3-year drift (optimistic)", p.mcRaw, start) + mcRow("Half drift (trailing mean × 0.5)", p.mcHalfDrift, start) + mcRow("Zero drift (conservative: volatility only)", p.mcZeroDrift, start) + "</tbody></table></div></div>";
    }).join("");
    var C = Q.corr, fl = C.flags.map(function (f) { return "<tr><td><b>" + f.pair.join(" / ") + "</b></td><td class=n>" + f.y1.toFixed(2) + "</td><td class=n>" + f.m3.toFixed(2) + "</td><td class=n>" + f.y3.toFixed(2) + "</td><td>" + chip(f.level, f.level === "high" ? "bad" : f.level === "moderate" ? "warn" : "ok") + " " + esc(f.note) + "</td></tr>"; }).join("");
    var hi = C.flags.filter(function (f) { return f.level !== "low"; });
    return head("qportfolio", "Trailing statistics and a bootstrap Monte Carlo for Book 1 (SEZL, MU, CRDO) and Book 2 (PLTR, MU, CRDO), plus the correlation matrix of everything held. All from real daily returns; none of it is a forecast.")
      + '<div class="r6-box">Correlation flags (≥ 0.70 high, ≥ 0.50 moderate, worst of 3-month / 1-year / 3-year): ' + (hi.length ? hi.map(function (f) { return "<b>" + f.pair.join("/") + "</b> " + f.level + " (3m " + f.m3.toFixed(2) + ", 1y " + f.y1.toFixed(2) + ")"; }).join("; ") : "none") + ".</div>" + books
      + '<div class="r6-card"><h3>Holdings correlation (daily returns)</h3><div class="r6-grid"><div><h4>3 months</h4>' + corrTbl(C.m3, Object.keys(C.m3)) + "</div><div><h4>1 year</h4>" + corrTbl(C.y1, Object.keys(C.y1)) + "</div><div><h4>3 years</h4>" + corrTbl(C.y3, Object.keys(C.y3)) + '</div></div><table class="r6-tbl q-sub" style="margin-top:8px"><thead><tr><th>Pair</th><th class=n>1y</th><th class=n>3m</th><th class=n>3y</th><th>Flag</th></tr></thead><tbody>' + fl + "</tbody></table></div>" + limits();
  }
  /* ---------- PEAD ---------- */
  function pead() {
    var P = Q.pead;
    var bt_ = P.buckets.map(function (b) { return "<tr><td>" + esc(b.name) + "</td><td class=n>" + b.n + "</td><td class=\"n " + cls(b.d20) + "\">" + pc(b.d20, 2) + "</td><td class=n>" + (b.d20pos == null ? "n/a" : b.d20pos + "%") + "</td><td class=n>" + num(b.t20, 2) + '</td><td class="n ' + cls(b.d60) + '">' + pc(b.d60, 2) + "</td><td class=n>" + (b.d60pos == null ? "n/a" : b.d60pos + "%") + "</td></tr>"; }).join("");
    var sx = P.setups.map(function (s) { return "<tr" + (s.holding ? ' class="hold"' : "") + "><td>" + tk(s.t) + '<div class="r6-dim">' + esc((s.name || "").slice(0, 26)) + "</div></td><td>" + chip(s.kind, s.kind === "beat-and-raise" ? "ok" : "warn") + "</td><td>" + s.date + " (" + s.ageDays + 'd)</td><td class="n r6-pass">' + pc(s.surprise) + '</td><td class="n ' + cls(s.reaction) + '">' + pc(s.reaction) + '</td><td class="n ' + cls(s.sinceReaction) + '">' + pc(s.sinceReaction) + "</td><td class=n>" + (s.revisions == null ? "n/a" : pc(s.revisions, 1)) + "</td><td class=n>" + (s.score == null ? "n/a" : s.score) + "</td></tr>"; }).join("");
    return head("qpead", "Post-earnings-announcement drift: do stocks keep moving in the direction of an earnings surprise? Historical check on " + P.events + " reports across " + P.names + " names (" + esc(P.span) + "), then today's setups: recent beat of 5% or more, positive first-day reaction and upward estimate revisions.")
      + '<h3>Historical drift after the report (excess over SPY)</h3><div class="r6-tbl-wrap"><table class="r6-tbl"><thead><tr><th>Bucket</th><th class=n>Events</th><th class=n>Avg 20-day drift</th><th class=n>% positive</th><th class=n>t-stat</th><th class=n>Avg 60-day drift</th><th class=n>% positive</th></tr></thead><tbody>' + bt_ + "</tbody></table></div><p class=r6-note>" + esc(P.method) + " Read: a t-stat below about 2 means the drift is not distinguishable from noise.</p>"
      + "<h3>Today's setups (" + P.setups.length + ' shown; reports in the last 45 days)</h3><div class="r6-tbl-wrap"><table class="r6-tbl"><thead><tr><th>Ticker</th><th>Setup</th><th>Reported</th><th class=n>Surprise</th><th class=n>Day-1 reaction</th><th class=n>Since</th><th class=n>EPS est. revision 30d</th><th class=n>Score</th></tr></thead><tbody>' + sx + "</tbody></table></div>" + limits();
  }
  /* ---------- alt data ---------- */
  function altBadges(a, full) { return a.badges.map(function (b) { return chip(b, "ok"); }).join("") + a.warn.map(function (b) { return chip(b, "warn"); }).join(""); }
  function altDetail(a) {
    var d = a.detail, out = [];
    if (d.insider) out.push("Insider (Form 4, 90d): " + d.insider.buys + " open-market buys by " + d.insider.buyers + " people" + (d.insider.value ? ", $" + Math.round(d.insider.value).toLocaleString() : "") + (d.insider.last ? ", last " + d.insider.last : ""));
    if (d.short) out.push("Short interest: " + (d.short.siPct == null ? "n/a" : d.short.siPct + "% of float") + ", " + pc(d.short.chg) + " vs prior report");
    if (d.f13) out.push("13F adds: " + d.f13.map(function (f) { return f.fund + " (" + (f.status === "new" ? "new" : "+" + (f.chgPct == null ? "?" : f.chgPct) + "%") + ")"; }).join(", "));
    if (d.flow) out.push("Options (CBOE, expiries 2–60d): calls " + d.flow.callVol.toLocaleString() + " / puts " + d.flow.putVol.toLocaleString() + " traded vs open interest " + (d.flow.callOI + d.flow.putOI).toLocaleString() + (d.flow.hot.length ? "; hottest: " + d.flow.hot.slice(0, 2).map(function (h) { return h.side + " $" + h.strike + " " + h.exp.slice(5) + " vol " + h.vol.toLocaleString() + " vs OI " + h.oi.toLocaleString(); }).join(", ") : ""));
    return out.join("<br>") || '<span class="r6-dim">no data</span>';
  }
  function altv() {
    var q = st.aq.trim().toUpperCase();
    var rows = Q.alt.filter(function (a) { if (q && a.t.indexOf(q) < 0) return false; if (st.af === "hold") return a.holding; if (st.af === "cluster") return a.badges.some(function (b) { return /insider cluster/.test(b); }); if (st.af === "call") return a.badges.some(function (b) { return /call flow/.test(b); }); if (st.af === "multi") return a.n >= 2; return true; });
    var tb = rows.slice(0, 150).map(function (a) { return "<tr" + (a.holding ? ' class="hold"' : "") + "><td>" + tk(a.t) + (a.holding ? " " + chip("holding", "sc") : "") + '<div class="r6-dim">' + esc((a.name || "").slice(0, 26)) + "</div></td><td>" + altBadges(a) + '</td><td class="r6-note">' + altDetail(a) + "</td></tr>"; }).join("");
    var S = Q.altSummary;
    return head("qalt", "Confirmation signals layered on the screener: insider buying clusters (SEC Form 4), unusual options flow (CBOE volume vs open interest), short-interest changes and 13F adds by tracked funds. They add or remove confidence; they never override the gates.")
      + '<div class="r6-box">Coverage: ' + S.universeCovered + " board names plus holdings for insider, short-interest and 13F data; options flow scanned for " + S.flowScanned + " names (holdings, gate passers, screen matches). " + S.withBadge + " names carry at least one confirming badge. Green = confirming, amber = caution.</div>"
      + '<div class="r6-bar"><input id="q-aq" placeholder="Filter ticker" value="' + esc(st.aq) + '"><select id="q-af"><option value="all">All with badges</option><option value="hold">My holdings</option><option value="multi">Two or more badges</option><option value="cluster">Insider clusters</option><option value="call">Unusual call flow</option></select></div>'
      + '<div class="r6-tbl-wrap"><table class="r6-tbl"><thead><tr><th>Ticker</th><th>Badges</th><th>Detail</th></tr></thead><tbody>' + tb + "</tbody></table></div>" + (rows.length > 150 ? '<p class="r6-note">Showing 150 of ' + rows.length + ".</p>" : "") + limits();
  }
  /* ---------- hooks ---------- */
  function badges(t) {
    if (!Q) return "";
    var a = Q.alt.filter(function (x) { return x.t === t; })[0]; if (!a) return "";
    return '<a href="#/qalt" style="text-decoration:none">' + a.badges.map(function (b) { return chip(b, "ok"); }).join("") + a.warn.map(function (b) { return chip(b, "warn"); }).join("") + "</a>";
  }
  function screenTrust(sid) {
    if (!Q) return "";
    var k = sid === "S2" ? null : sid; var c = Q.regime.current;
    var tail = ' <a href="#/qregime">Market regime tab</a>';
    if (!k) return '<p class="r6-note">Regime now: <b>' + esc(c.label) + "</b>. S2 is fundamentals-based and cannot be backtested point-in-time; see the " + '<a href="#/qpead">Earnings drift tab</a> for the evidence on post-earnings drift.</p>';
    var x = Q.regime.perRule[k] && Q.regime.perRule[k][c.label]; var r = rule(k);
    if (!x || x.annExcess == null) return "";
    var t = x.trusted, kc = t === "trusted" ? "ok" : t === "weak sample" ? "warn" : "bad";
    return '<p class="r6-note">Regime now: <b>' + esc(c.label) + "</b> · historical trust for " + esc(sid) + " in this regime: " + chip(t, kc) + " (" + pc(x.annExcess) + " a year vs the equal-weight universe, " + pc(x.annExcessSpy) + " vs SPY, " + x.weeks + " weeks; price-only backtest, out-of-sample " + (r.oos ? "CAGR " + pc(r.oos.cagr) + ", Sharpe " + num(r.oos.sharpe, 2) : "n/a") + ")." + tail + "</p>";
  }
  function holdingsExtra() {
    if (!Q) return "";
    var c = Q.regime.current, kc = c.label === "risk-on" ? "ok" : c.label === "risk-off" ? "bad" : "warn";
    var hold = ["SEZL", "MU", "CRDO", "PLTR"].map(function (t) { var a = Q.alt.filter(function (x) { return x.t === t; })[0]; return a && (a.badges.length || a.warn.length) ? "<div style=\"margin:3px 0\"><b>" + t + "</b> " + altBadges(a) + "</div>" : ""; }).join("");
    var flags = Q.corr.flags.filter(function (f) { return f.level !== "low"; }).map(function (f) { return f.pair.join("/") + " " + f.level + " (3m " + f.m3.toFixed(2) + ")"; }).join("; ");
    return '<div class="r6-card"><h3>Quant snapshot</h3><p>Regime: ' + chip(c.label.toUpperCase() + " " + c.total + "/8", kc) + ' <a href="#/qregime">details</a> · Correlation flags: ' + esc(flags || "none") + ' · <a href="#/qportfolio">portfolio &amp; Monte Carlo</a></p>' + hold + "</div>";
  }
  function renderView(view) {
    var panel = document.getElementById("view-quant"); if (!panel) return;
    var on = VIEWS.indexOf(view) >= 0; panel.hidden = !on; if (!on) return;
    var root = document.getElementById("quant-root");
    if (!Q) { root.innerHTML = '<div class="r6-wrap"><p>Quant data (quant.js) has not been published yet.</p></div>'; return; }
    css(); if (window.R6UI && window.R6UI.css) window.R6UI.css();
    var html = view === "qfactors" ? factors() : view === "qbacktest" ? bt() : view === "qregime" ? regime() : view === "qportfolio" ? portfolio() : view === "qpead" ? pead() : altv();
    root.innerHTML = '<div class="r6-wrap">' + html + "</div>";
    var fq = document.getElementById("q-fq"), fs = document.getElementById("q-fs");
    if (fq) { fs.value = st.fs; fq.addEventListener("input", function () { st.fq = fq.value; var p = fq.selectionStart; renderView("qfactors"); var n = document.getElementById("q-fq"); n.focus(); n.setSelectionRange(p, p); }); fs.addEventListener("change", function () { st.fs = fs.value; renderView("qfactors"); }); }
    var aq = document.getElementById("q-aq"), af = document.getElementById("q-af");
    if (aq) { af.value = st.af; aq.addEventListener("input", function () { st.aq = aq.value; var p = aq.selectionStart; renderView("qalt"); var n = document.getElementById("q-aq"); n.focus(); n.setSelectionRange(p, p); }); af.addEventListener("change", function () { st.af = af.value; renderView("qalt"); }); }
  }
  window.QUANTUI = { renderView: renderView, badges: badges, screenTrust: screenTrust, holdingsExtra: holdingsExtra, VIEWS: VIEWS };
})();
