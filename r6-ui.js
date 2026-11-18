/* Research-6 UI: distance-to-pass, catalysts, six screens, sector rotation, signal tracker, option grades, holding cards.
   Data: window.R6 (research6.js, built by build_research6.py). Real data only; every figure comes from that file. */
(function () {
  "use strict";
  var R = window.R6;
  var VIEWS = ["distance", "catalysts", "screens", "rotation", "signals", "optgrades"];
  var TITLES = { distance: "Distance to pass", catalysts: "Earnings & catalysts", screens: "Six screens", rotation: "Sector rotation", signals: "Signal tracker", optgrades: "Option idea grades" };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); };
  var money = function (x) { return x == null ? "n/a" : "$" + Number(x).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var pct = function (x, d) { return x == null ? "n/a" : (x > 0 ? "+" : "") + Number(x).toFixed(d == null ? 1 : d) + "%"; };
  var SID = ["S1", "S2", "S3", "S4", "S5", "S6"];
  function css() {
    if (document.getElementById("r6-css")) return;
    var s = document.createElement("style"); s.id = "r6-css";
    s.textContent = ".r6-wrap{max-width:1180px;margin:0 auto;padding:0 4px 40px}.r6-head h2{margin:.2em 0 .1em}.r6-lead{color:var(--muted);margin:.2em 0 .8em;max-width:78ch}.r6-nav{display:flex;flex-wrap:wrap;gap:6px;margin:10px 0 14px}.r6-nav a{padding:6px 11px;border-radius:999px;background:var(--panel);color:var(--text);text-decoration:none;font-size:13px;border:1px solid var(--line)}.r6-nav a.on{background:var(--teal-soft);border-color:var(--teal)}"
      + ".r6-tbl-wrap{overflow:auto;border:1px solid var(--line);border-radius:12px;max-height:72vh}.r6-tbl{border-collapse:collapse;width:100%;font-size:13px}.r6-tbl th{position:sticky;top:0;background:var(--panel-2);text-align:left;padding:7px 9px;white-space:nowrap;border-bottom:1px solid var(--line);z-index:1}.r6-tbl td{padding:6px 9px;border-bottom:1px solid var(--line-soft);vertical-align:top}.r6-tbl tr.hold td{background:var(--teal-soft)}.r6-tbl tr.flash td{outline:2px solid var(--amber)}.r6-tbl td.n,.r6-tbl th.n{text-align:right;font-variant-numeric:tabular-nums}.r6-tbl a{color:var(--blue);text-decoration:none}"
      + ".r6-pass{color:var(--green)}.r6-fail{color:var(--rose)}.r6-dim{color:var(--muted)}.r6-chip{display:inline-block;padding:1px 7px;margin:1px 3px 1px 0;border-radius:999px;font-size:11px;background:var(--panel-2);border:1px solid var(--line);white-space:nowrap}.r6-chip.bad{border-color:var(--rose);color:var(--rose)}.r6-chip.ok{border-color:var(--green);color:var(--green)}.r6-chip.sc{border-color:var(--teal);color:var(--teal)}.r6-chip.warn{border-color:var(--amber);color:var(--amber)}"
      + ".r6-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:8px 0}.r6-bar input,.r6-bar select{background:var(--panel);color:var(--text);border:1px solid var(--line);border-radius:8px;padding:6px 9px;font-size:13px}.r6-card{background:var(--panel);border-radius:16px;padding:14px;margin:12px 0;border:1px solid var(--line-soft)}.r6-card h3{margin:0 0 6px}.r6-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px}.r6-note{font-size:12px;color:var(--muted);margin:6px 0}.r6-box{border:1px solid var(--amber);background:var(--amber-soft);border-radius:12px;padding:9px 12px;margin:10px 0;font-size:13px}"
      + ".r6-hc{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:14px;margin:14px 0}.r6-hc img{width:100%;border-radius:10px;border:1px solid var(--line)}.r6-hc ul{margin:4px 0 8px 18px;padding:0;font-size:13px}.r6-hc li{margin:3px 0}@media(max-width:820px){.r6-hc{grid-template-columns:1fr}}.r6-hl{display:flex;gap:6px;flex-wrap:wrap;margin:6px 0 10px}.r6-hl a{padding:6px 11px;border-radius:10px;background:var(--panel);border:1px solid var(--line);color:var(--text);text-decoration:none;font-size:13px}";
    document.head.appendChild(s);
  }
  function tk(t) { return '<a href="#/stock/' + encodeURIComponent(t) + '"><b>' + esc(t) + "</b></a>"; }
  function dl(t) { return '<a class="r6-dim" href="#/distance/' + encodeURIComponent(t) + '" title="Distance to pass">gates</a>'; }
  function badges(t) {
    if (!R) return "";
    var d = R.distance.filter(function (x) { return x.t === t; })[0], out = "";
    var cs = (d && d.screens) || [];
    var near = (d && d.near) || [];
    cs.forEach(function (s) { out += '<a class="r6-chip sc" href="#/screens/' + s + '" title="Matches screen ' + s + ': ' + esc(R.screens[s].name) + '">' + s + " ✓</a>"; });
    near.forEach(function (s) { out += '<a class="r6-chip warn" href="#/screens/' + s + '" title="One criterion short of screen ' + s + ': ' + esc(R.screens[s].name) + '">' + s + " near</a>"; });
    if (d && d.tilt) out += '<span class="r6-chip ok" title="Sector is among the top 3 in the rotation ranking">sector tilt</span>';
    return out;
  }
  function subnav(view, extra) {
    return '<nav class="r6-nav">' + VIEWS.map(function (v) { return '<a href="#/' + v + '" class="' + (v === view ? "on" : "") + '">' + TITLES[v] + "</a>"; }).join("") + "</nav>";
  }
  function head(view, lead) {
    return '<header class="r6-head"><p class="eyebrow">Research only · data as of ' + esc(R.dataAsOf) + " · built " + esc(R.generatedAt.replace("T", " ").slice(0, 16)) + ' Central</p><h2>' + TITLES[view] + '</h2><p class="r6-lead">' + lead + "</p></header>" + subnav(view);
  }
  /* ---------- distance to pass ---------- */
  var dState = { q: "", f: "all", flash: null };
  function distance() {
    var rows = R.distance.slice();
    var hold = rows.filter(function (x) { return x.holding; });
    var rest = rows.filter(function (x) { return !x.holding; });
    var q = dState.q.trim().toUpperCase();
    function keep(x) {
      if (q && x.t.indexOf(q) < 0 && String(x.name || "").toUpperCase().indexOf(q) < 0) return false;
      if (dState.f === "pass") return !!x.pass_;
      if (dState.f === "near") return !x.noData && !x.pass_ && x.awayPct != null && x.awayPct <= 10 && (x.fails || []).length <= 2;
      if (dState.f === "tilt") return !!x.tilt;
      if (dState.f === "screen") return (x.screens || []).length > 0;
      return true;
    }
    rest.sort(function (a, b) { return (b.pass_ ? 1 : 0) - (a.pass_ ? 1 : 0) || ((a.noData ? 99 : a.fails.length) - (b.noData ? 99 : b.fails.length)) || ((a.awayPct == null ? 999 : a.awayPct) - (b.awayPct == null ? 999 : b.awayPct)); });
    var shown = hold.concat(rest.filter(keep));
    function row(x) {
      if (x.noData) return '<tr class="' + (x.holding ? "hold" : "") + '"><td>' + tk(x.t) + '</td><td colspan="10" class="r6-dim">No price history available for this ticker (see coverage log below).</td></tr>';
      return '<tr id="r6d-' + esc(x.t) + '" class="' + (x.holding ? "hold" : "") + (dState.flash === x.t ? " flash" : "") + '"><td>' + tk(x.t) + (x.holding ? ' <span class="r6-chip sc">' + esc(x.holding.join("+")) + "</span>" : "") + '<div class="r6-dim">' + esc((x.name || "").slice(0, 28)) + "</div></td>"
        + "<td>" + esc(x.sector || "") + "</td><td class=n>" + money(x.close) + "</td><td class=n>" + money(x.needPx) + '<div class="r6-dim">' + esc(x.binder || "") + "</div></td>"
        + '<td class="n ' + (x.awayPct > 0 ? "r6-fail" : "r6-pass") + '">' + (x.awayPct > 0 ? "+" + x.awayPct.toFixed(1) + "%" : "clear") + "</td>"
        + '<td class="n ' + (x.rsiOk ? "" : "r6-fail") + '">' + (x.rsi == null ? "n/a" : x.rsi.toFixed(1)) + ' <span class="r6-dim">/ 70</span></td>'
        + '<td class="n ' + (x.scoreOk ? "" : "r6-fail") + '">' + (x.score == null ? "n/a" : x.score) + ' <span class="r6-dim">/ 70</span></td>'
        + "<td>" + (x.pass_ ? '<span class="r6-chip ok">passes all gates</span>' : x.fails.map(function (f) { return '<span class="r6-chip bad">' + esc(f) + "</span>"; }).join("")) + "</td><td>" + badges(x.t) + "</td></tr>";
    }
    var pass = rows.filter(function (x) { return x.pass_; }).length;
    return head("distance", "For every holding and every scored name: the price it must close above to clear <b>both</b> the 50-day and 200-day averages (the higher of the two), how far away that is, RSI against the 70 cap, the combined score against 70, and which gates fail. Holdings are pinned at the top. The averages move every day, so the needed price drifts.")
      + '<div class="r6-box"><b>' + pass + " of " + rows.length + "</b> names pass every gate today (RSI ≤ 70, above both averages, not a broken chart, score ≥ 70). Gate math uses daily closes through " + esc(R.dataAsOf) + ".</div>"
      + '<div class="r6-bar"><input id="r6-q" placeholder="Search ticker or name" value="' + esc(dState.q) + '"><select id="r6-f"><option value="all">All names</option><option value="pass">Passing all gates</option><option value="near">Within 10% and ≤ 2 gates failing</option><option value="screen">Matching a new screen</option><option value="tilt">In a leading sector</option></select><span class="r6-dim">' + shown.length + " rows</span></div>"
      + '<div class="r6-tbl-wrap"><table class="r6-tbl"><thead><tr><th>Ticker</th><th>Sector</th><th class=n>Close</th><th class=n>Price needed</th><th class=n>Away</th><th class=n>RSI</th><th class=n>Score</th><th>Gates failing</th><th>Screens</th></tr></thead><tbody>' + shown.map(row).join("") + "</tbody></table></div>"
      + '<p class="r6-note">Price needed = max(50-day, 200-day). "Clear" means the close is already above both. A name can still fail on RSI, a broken chart or the score, so check the gate chips. S1–S6 are the six new screens; "near" means one criterion short.</p>'
      + '<div id="r6-cov"></div>';
  }
  /* ---------- catalysts ---------- */
  var cState = { q: "", f: "all" };
  function catalysts() {
    var rows = R.catalysts.filter(function (x) {
      var q = cState.q.trim().toUpperCase(); if (q && x.t.indexOf(q) < 0 && String(x.name || "").toUpperCase().indexOf(q) < 0) return false;
      if (cState.f === "w10") return x.within10; if (cState.f === "hold") return !!x.holding; if (cState.f === "dated") return !!x.next; return true;
    });
    var w10 = R.catalysts.filter(function (x) { return x.within10; });
    function row(x) {
      var l = x.last;
      return '<tr class="' + (x.holding ? "hold" : "") + '"><td>' + tk(x.t) + (x.holding ? ' <span class="r6-chip sc">' + esc(x.holding.join("+")) + "</span>" : "") + '<div class="r6-dim">' + esc((x.name || "").slice(0, 26)) + "</div></td>"
        + "<td>" + (x.next ? esc(x.next) + (x.timing ? '<div class="r6-dim">' + esc(x.timing) + "</div>" : "") + (x.estimate ? '<div class="r6-dim">estimate</div>' : "") : '<span class="r6-dim">n/a</span>') + "</td>"
        + '<td class="n">' + (x.tradingDays == null ? "" : x.tradingDays + " d") + (x.within10 ? ' <span class="r6-chip warn">≤ 10 days</span>' : "") + "</td>"
        + '<td class="n">' + (x.n ? x.beats + "/" + x.n + (x.beatRate != null ? ' <span class="r6-dim">(' + x.beatRate + "%)</span>" : "") : "n/a") + "</td>"
        + '<td class="n">' + (x.avgAbsMove == null ? "n/a" : "±" + x.avgAbsMove + "%") + '<div class="r6-dim">' + (x.avgMove == null ? "" : "mean " + pct(x.avgMove)) + "</div></td>"
        + "<td>" + (l ? esc(l.date) + ": " + (l.move1d == null ? "move n/a" : '<span class="' + (l.move1d >= 0 ? "r6-pass" : "r6-fail") + '">' + pct(l.move1d) + "</span>") + (l.beat == null ? "" : l.beat ? " after a beat" : " after a miss") : '<span class="r6-dim">n/a</span>') + "</td><td>" + badges(x.t) + "</td></tr>";
    }
    var ev = R.events.map(function (e) { return '<div class="r6-card"><b>' + esc(e.date) + " · " + esc(e.title) + "</b><p>" + esc(e.detail) + '</p><p class="r6-note">Affects: ' + e.tickers.map(tk).join(", ") + " · Source: " + esc(e.src) + "</p></div>"; }).join("");
    var big = R.bigEarnings.length ? '<p class="r6-note">Largest names reporting within 10 trading days: ' + R.bigEarnings.map(function (b) { return tk(b.t) + " " + esc(b.date); }).join(" · ") + "</p>" : "";
    return head("catalysts", "Next report date, beat record, average one-day post-earnings move and the last reaction for every holding and every board name, with sector events. Names reporting within 10 trading days are flagged.")
      + '<div class="r6-box"><b>' + w10.length + "</b> names report within 10 trading days: " + (w10.length ? w10.slice(0, 40).map(function (x) { return tk(x.t) + " " + esc((x.next || "").slice(5)); }).join(" · ") : "none") + "</div>" + ev + big
      + '<div class="r6-bar"><input id="r6-cq" placeholder="Search ticker" value="' + esc(cState.q) + '"><select id="r6-cf"><option value="all">All</option><option value="hold">Holdings</option><option value="w10">Reporting within 10 trading days</option><option value="dated">With a known date</option></select><span class="r6-dim">' + rows.length + " names</span></div>"
      + '<div class="r6-tbl-wrap"><table class="r6-tbl"><thead><tr><th>Ticker</th><th>Next report</th><th class=n>Trading days</th><th class=n>Beat record</th><th class=n>Avg 1-day move</th><th>Last reaction</th><th>Screens</th></tr></thead><tbody>' + rows.map(row).join("") + "</tbody></table></div>"
      + '<p class="r6-note">Beat record and moves come from Yahoo earnings dates and daily closes (upgrades.json earnings history; SEZL and PLTR are computed the same way from Yahoo). Names off the board (the investor-preset universe) have no earnings history in the pipeline, so they are not listed.</p>';
  }
  /* ---------- screens ---------- */
  function screens(sub) {
    var sid = SID.indexOf(sub) >= 0 ? sub : "S1";
    var S = R.screens[sid], F = S.finviz || {};
    var nav = '<div class="r6-nav">' + SID.map(function (s) { var x = R.screens[s]; return '<a class="' + (s === sid ? "on" : "") + '" href="#/screens/' + s + '">' + s + " " + esc(x.name) + " (" + x.matchCount + ")</a>"; }).join("") + "</div>";
    function crit(c) { return c.ok === true ? '<span class="r6-pass" title="' + esc(c.label) + '">✓</span>' : c.ok === false ? '<span class="r6-fail" title="' + esc(c.label) + '">✗</span>' : '<span class="r6-dim" title="' + esc(c.label) + '">n/a</span>'; }
    var cols = (S.matches[0] || S.near[0] || { criteria: [] }).criteria;
    function row(x, near) {
      return '<tr class="' + (x.holding ? "hold" : "") + '"><td>' + tk(x.t) + (x.holding ? ' <span class="r6-chip sc">' + esc(x.holding.join("+")) + "</span>" : "") + ' <span class="r6-dim">' + dl(x.t) + '</span><div class="r6-dim">' + esc((x.name || "").slice(0, 26)) + "</div></td><td>" + esc(x.sector || "") + "</td><td class=n>" + money(x.close) + "</td><td class=n>" + (x.rsi == null ? "n/a" : x.rsi) + "</td><td class=n>" + (x.score == null ? '<span class="r6-dim">n/a</span>' : x.score) + "</td><td class=n>" + pct(x.perf3m) + "</td>"
        + x.criteria.map(function (c) { return "<td>" + crit(c) + (c.val ? '<div class="r6-dim">' + esc(c.val) + "</div>" : "") + "</td>"; }).join("")
        + (near ? '<td><span class="r6-chip warn">' + esc(x.missing) + "</span></td>" : "") + "<td>" + (x.finviz ? '<span class="r6-chip ok">Finviz hit</span>' : '<span class="r6-dim">site data</span>') + "</td></tr>";
    }
    function tbl(list, near) {
      if (!list.length) return '<p class="r6-dim">None today.</p>';
      return '<div class="r6-tbl-wrap"><table class="r6-tbl"><thead><tr><th>Ticker</th><th>Sector</th><th class=n>Close</th><th class=n>RSI</th><th class=n>Score</th><th class=n>3m</th>' + cols.map(function (c) { return "<th>" + esc(c.label) + "</th>"; }).join("") + (near ? "<th>Missing</th>" : "") + "<th>Source</th></tr></thead><tbody>" + list.map(function (x) { return row(x, near); }).join("") + "</tbody></table></div>";
    }
    var fv = '<div class="r6-card"><h3>Finviz preset ' + esc(sid) + ' <a href="' + esc(F.url) + '" target="_blank" rel="noopener">open on Finviz →</a></h3><p class="r6-note">' + esc(F.captureCount == null ? "" : F.captureCount + " rows captured" + (F.totalReported && F.totalReported > F.captureCount ? " of " + F.totalReported + " (capture cap 200, sorted by performance)" : "")) + (F.capturedAt ? " · " + esc(F.capturedAt.replace("T", " ").slice(0, 16)) : "") + "</p><p><b>Filters:</b> " + (F.rules || []).map(esc).join(" · ") + '</p><p class="r6-note"><b>Finviz cannot express:</b> ' + (F.cannotExpress || []).map(esc).join("; ") + "</p><p class=\"r6-note\"><b>Post-filter in the pipeline:</b> " + esc(F.postFilter || "") + "</p><p class=\"r6-note\">" + esc(F.presetNote || "") + "</p></div>";
    var extra = "";
    if (sid === "S6") extra = '<div class="r6-card"><h3>Leading sectors</h3>' + R.sectors.filter(function (x) { return x.leading; }).map(function (x) { return '<a class="r6-chip ok" href="' + esc(x.fvUrl) + '" target="_blank" rel="noopener">' + esc(x.sector) + " (" + x.etf + ") Finviz →</a>"; }).join("") + '<p class="r6-note">See the <a href="#/rotation">Sector rotation</a> tab for the full ranking.</p></div>';
    return head("screens", "Six screens built from real daily bars and the Finviz presets, each with the exact criteria. A name matches only when every criterion is ✓; near misses are one or two criteria short. The match counts are post-filtered from the broader Finviz candidate lists.")
      + subnavSc(nav) + '<h3 style="margin:.6em 0 .2em">' + esc(S.name) + ' <span class="nx-count">' + S.matchCount + " match · " + S.nearOne + " one criterion short · " + S.nearCount + " within two · Finviz candidates " + S.finvizCandidates + "</span></h3>"
      + (S.risk ? '<div class="r6-box">' + esc(S.risk) + "</div>" : "") + (window.QUANTUI ? window.QUANTUI.screenTrust(sid) : "") + (S.note ? '<p class="r6-note">' + esc(S.note) + "</p>" : "") + fv + extra
      + "<h4>Matches (" + S.matchCount + ")</h4>" + tbl(S.matches.slice(0, 80), false) + (S.matchCount > 80 ? '<p class="r6-note">Showing the top 80 of ' + S.matchCount + " by the screen's ranking.</p>" : "")
      + "<h4>Near misses: one or two criteria short (" + S.nearCount + (S.nearCount > S.near.length ? ", top " + S.near.length : "") + ")</h4>" + tbl(S.near, true);
  }
  function subnavSc(nav) { return nav; }
  /* ---------- rotation ---------- */
  function rotation() {
    var rows = R.sectors.map(function (x) {
      return "<tr><td class=n>" + x.rank + '</td><td><b>' + esc(x.sector) + '</b> <span class="r6-dim">' + x.etf + "</span>" + (x.leading ? ' <span class="r6-chip ok">leading</span>' : "") + "</td><td class=n>" + pct(x.perf1m) + '</td><td class="n ' + (x.rel1m >= 0 ? "r6-pass" : "r6-fail") + '">' + pct(x.rel1m) + "</td><td class=n>" + pct(x.perf3m) + '</td><td class="n ' + (x.rel3m >= 0 ? "r6-pass" : "r6-fail") + '">' + pct(x.rel3m) + '</td><td class=n title="Chaikin money flow, 20 days: above 0 means closes near the high on volume">' + (x.cmf20 == null ? "n/a" : x.cmf20.toFixed(3)) + "</td><td>" + (x.above50 ? "yes" : "no") + '</td><td><a href="' + esc(x.fvUrl) + '" target="_blank" rel="noopener">Finviz →</a></td></tr>';
    }).join("");
    var tilt = R.distance.filter(function (x) { return x.tilt && !x.noData; }).sort(function (a, b) { return (b.score || 0) - (a.score || 0); }).slice(0, 40);
    return head("rotation", "The 11 SPDR sector ETFs ranked against SPY over 1 and 3 months plus 20-day money flow. The top three are flagged as leading, and screener names in those sectors get a \"sector tilt\" flag.")
      + '<div class="r6-box">Leading now: <b>' + R.leadingSectors.map(esc).join(", ") + "</b>. Rank = sum of the three ranks (relative 1-month, relative 3-month, money flow); lower is better.</div>"
      + '<div class="r6-tbl-wrap"><table class="r6-tbl"><thead><tr><th class=n>Rank</th><th>Sector</th><th class=n>1m</th><th class=n>1m vs SPY</th><th class=n>3m</th><th class=n>3m vs SPY</th><th class=n>Money flow</th><th>Above 50-day</th><th>Names</th></tr></thead><tbody>' + rows + "</tbody></table></div>"
      + '<h3 style="margin-top:18px">Screener names in leading sectors (top 40 by score)</h3><div class="r6-tbl-wrap"><table class="r6-tbl"><thead><tr><th>Ticker</th><th>Sector</th><th class=n>Score</th><th>Gates</th><th>Screens</th></tr></thead><tbody>'
      + tilt.map(function (x) { return "<tr><td>" + tk(x.t) + "</td><td>" + esc(x.sector) + "</td><td class=n>" + x.score + "</td><td>" + (x.pass_ ? '<span class="r6-chip ok">passes</span>' : x.fails.map(function (f) { return '<span class="r6-chip bad">' + esc(f) + "</span>"; }).join("")) + "</td><td>" + badges(x.t) + "</td></tr>"; }).join("") + "</tbody></table></div>";
  }
  /* ---------- signals ---------- */
  function signals() {
    var S = R.signals;
    function cell(h) { return h.matured ? '<span title="' + h.matured + ' matured">' + (h.hit == null ? "n/a" : h.hit + "% hit") + " · avg " + pct(h.avg) + " · vs SPY " + pct(h.avgExcess) + "</span>" : '<span class="r6-dim">0 matured</span>'; }
    var tbl = S.table.map(function (t) { return "<tr><td><b>" + esc(t.rule) + '</b></td><td class=n>' + t.n + "</td><td>" + cell(t["1w"]) + "</td><td>" + cell(t["4w"]) + "</td><td>" + cell(t["12w"]) + "</td></tr>"; }).join("");
    var last = S.rows.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 250);
    function rr(z, k) { var x = z.returns[k]; return x ? '<span class="' + (x.ret >= 0 ? "r6-pass" : "r6-fail") + '">' + pct(x.ret) + '</span> <span class="r6-dim">(SPY ' + pct(x.spy) + ")</span>" : '<span class="r6-dim">pending</span>'; }
    return head("signals", "A persistent log of every gate-pass, add-zone and new-screen signal with the date and price. Each signal's 1-, 4- and 12-week return (5, 20 and 60 trading days) is measured against SPY as the dates arrive.")
      + '<div class="r6-box">' + S.total + " signals logged. " + esc(S.backfill) + " Returns stay <b>pending</b> until the horizon date passes; nothing is estimated.</div>"
      + '<h3>Hit rate and average return by rule</h3><div class="r6-tbl-wrap"><table class="r6-tbl"><thead><tr><th>Rule</th><th class=n>Signals</th><th>1 week</th><th>4 weeks</th><th>12 weeks</th></tr></thead><tbody>' + tbl + "</tbody></table></div>"
      + '<p class="r6-note">Hit = return above 0% at the horizon close. "vs SPY" = average excess return over SPY across the same window. A rule needs a meaningful number of matured signals before the rates mean anything.</p>'
      + '<h3 style="margin-top:16px">Signal log (latest ' + last.length + ' of ' + S.total + ')</h3><div class="r6-tbl-wrap"><table class="r6-tbl"><thead><tr><th>Date</th><th>Ticker</th><th>Rule</th><th class=n>Entry</th><th>Detail</th><th>1 week</th><th>4 weeks</th><th>12 weeks</th><th>Now</th></tr></thead><tbody>'
      + last.map(function (z) { return "<tr><td>" + esc(z.date) + "</td><td>" + tk(z.t) + "</td><td>" + esc(z.rule) + "</td><td class=n>" + money(z.price) + '</td><td class="r6-dim">' + esc(z.detail) + "</td><td>" + rr(z, "1w") + "</td><td>" + rr(z, "4w") + "</td><td>" + rr(z, "12w") + "</td><td>" + (z.last ? pct(z.last.ret) + ' <span class="r6-dim">(' + z.last.days + "d)</span>" : "") + "</td></tr>"; }).join("") + "</tbody></table></div>"
      + '<p class="r6-note">Raw log: <a href="signals-log.json">signals-log.json</a>. Rules: gate-pass, add-zone, screen-S1…S6. A repeat signal for the same name and rule inside 5 trading days is not logged again.</p>';
  }
  /* ---------- option grades ---------- */
  function optgrades() {
    var O = R.optionGrades;
    var tbl = O.table.map(function (t) { return "<tr><td>" + esc(t.kind) + "</td><td><b>" + esc(t.name) + "</b></td><td class=n>" + t.n + "</td><td class=n>" + t.open + "</td><td class=n>" + t.closed + "</td><td class=n>" + (t.winRate == null ? '<span class="r6-dim">n/a</span>' : t.winRate + "%") + "</td><td class=n>" + (t.avgClosed == null ? '<span class="r6-dim">n/a</span>' : pct(t.avgClosed)) + "</td><td class=n>" + (t.avgOpenMark == null ? "n/a" : pct(t.avgOpenMark)) + "</td></tr>"; }).join("");
    var rows = O.ideas.slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : a.t < b.t ? -1 : 1; }).slice(0, 200).map(function (z) {
      var st = z.status === "open" ? '<span class="r6-chip">open</span>' : z.status === "win" ? '<span class="r6-chip ok">win</span>' : '<span class="r6-chip bad">loss</span>';
      var l = z.last || {};
      return "<tr><td>" + esc(z.date) + "</td><td>" + tk(z.t) + ' <span class="r6-dim">' + esc(z.side) + "</span></td><td>" + esc(z.contract) + '<div class="r6-dim">' + esc(z.setupType) + "</div></td><td class=n>" + money(z.entryPremium) + '<div class="r6-dim">cost $' + z.cost + "</div></td><td class=n>" + money(z.entryUnderlying) + "</td><td>" + st + (z.final ? '<div class="r6-dim">' + esc(z.final.why) + " " + esc(z.final.date) + "</div>" : "") + '</td><td class="n ' + ((z.final ? z.final.retPct : l.retPct) >= 0 ? "r6-pass" : "r6-fail") + '">' + pct(z.final ? z.final.retPct : l.retPct) + "</td><td class=n>" + money(l.underlying) + (l.trigger ? '<div class="r6-chip warn">' + esc(l.trigger.kind) + " hit " + esc(l.trigger.date) + "</div>" : "") + "</td></tr>";
    }).join("");
    return head("optgrades", "Every idea shown on the Options tab is logged with its contract, entry premium, setup type and date, then re-marked from real option quotes and underlying closes on each refresh. Outcomes are graded by setup type.")
      + '<div class="r6-box">' + O.total + " ideas logged. Results only exist for refresh dates, so early returns are marks on open ideas, not outcomes.</div>"
      + '<h3>Results by setup type</h3><div class="r6-tbl-wrap"><table class="r6-tbl"><thead><tr><th>Group</th><th>Name</th><th class=n>Ideas</th><th class=n>Open</th><th class=n>Closed</th><th class=n>Win rate</th><th class=n>Avg closed return</th><th class=n>Avg open mark</th></tr></thead><tbody>' + tbl + "</tbody></table></div>"
      + '<h3 style="margin-top:16px">Idea log</h3><div class="r6-tbl-wrap"><table class="r6-tbl"><thead><tr><th>Date</th><th>Ticker</th><th>Contract</th><th class=n>Entry premium</th><th class=n>Underlying at entry</th><th>Status</th><th class=n>Return</th><th class=n>Underlying now</th></tr></thead><tbody>' + rows + "</tbody></table></div>"
      + '<p class="r6-note"><b>Method:</b> ' + esc(O.method) + ' Raw log: <a href="options-grades.json">options-grades.json</a>.</p>';
  }
  /* ---------- holdings extras ---------- */
  function holdingsExtra(only) {
    if (!R) return "";
    css();
    var links = '<div class="r6-hl">' + VIEWS.map(function (v) { return '<a href="#/' + v + '">' + TITLES[v] + "</a>"; }).join("") + "</div>";
    var cards = R.cards.filter(function (c) { var gr = (c.books || [])[0] === "Graduated"; return only === "grad" ? gr : !gr; }).map(function (c) {
      var g = c.gate, z = (c.zones || []).map(function (q) { return esc(q.label) + " $" + q.lo + (q.hi !== q.lo ? "–" + q.hi : ""); }).join(" · ");
      var cur = (c.targets.curated || []).map(function (x) { return esc(x.who) + " (" + esc(x.date) + "): " + esc(x.text); }).join("; ");
      return '<article class="r6-card"><h3>' + tk(c.t) + " · " + esc(c.name) + " " + badges(c.t) + " " + dl(c.t) + '</h3><p class="r6-note">' + esc(c.books.join(" + ")) + " · close " + money(c.close) + " as of " + esc(c.asOf || "") + '</p><div class="r6-hc"><img loading="lazy" src="' + esc(c.img) + '?v=' + esc(R.generatedAt.replace(/\D/g, "")) + '" alt="' + esc(c.t) + ' chart with 50 and 200 day averages, add zones and targets">'
        + '<div><p><b>Gate status:</b> ' + (g.pass_ ? '<span class="r6-pass">passes every gate</span>' : '<span class="r6-fail">fails: ' + esc((g.fails || []).join(", ")) + "</span>") + "</p>"
        + "<p><b>Levels:</b> 50-day " + money(g.sma50) + " · 200-day " + money(g.sma200) + (g.needPx && g.awayPct ? " · needs " + money(g.needPx) + " (+" + g.awayPct.toFixed(0) + "%)" : "") + " · RSI " + (g.rsi == null ? "n/a" : g.rsi) + " · score " + (g.score == null ? "n/a" : g.score) + "</p>"
        + (z ? "<p><b>Add zones:</b> " + z + "</p>" : "") + "<p><b>Earnings:</b> " + (c.earnings.next ? esc(c.earnings.next) + (c.earnings.timing ? " " + esc(c.earnings.timing) : "") + (c.earnings.estimate ? " (estimate)" : "") : "n/a") + "</p>"
        + (cur ? "<p><b>Analyst note:</b> " + cur + "</p>" : "") + '<b class="r6-pass">Bull case</b><ul>' + c.bull.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + '</ul><b class="r6-fail">Bear case</b><ul>' + c.bear.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("") + "</ul></div></div></article>";
    }).join("");
    if (only === "grad") return cards;
    return '<section class="nx-sec"><div class="nx-sec-head"><h3>Research tools</h3></div>' + links + '</section><section class="nx-sec"><div class="nx-sec-head"><h3>Holding cards <span class="nx-count">rebuilt on every refresh</span></h3><p class="nx-dim">Charts use real daily closes; bull and bear points come from today\'s files and cited analyst notes only.</p></div>' + cards + "</section>";
  }
  /* ---------- coverage ---------- */
  function coverage() {
    var el = document.getElementById("r6-cov"); if (!el) return;
    var pc = R.priceCoverage;
    var h = '<div class="r6-card"><h3>Data coverage</h3><p>Price history for <b>' + pc.withBars + " of " + pc.universe + "</b> tickers in the research universe (" + R.scoredSize + " scored names plus holdings and screen candidates). Sources: Yahoo public chart API, then the Nasdaq historical API; local cache reused between refreshes.</p>"
      + (pc.missing.length ? "<p><b>No price history:</b> " + pc.missing.map(function (t) { return esc(t) + ' <span class="r6-dim">(' + esc(pc.missReasons[t] || "no data") + ")</span>"; }).join("; ") + "</p>" : "<p>No missing tickers.</p>") + '<div id="r6-cov2" class="r6-note">Loading baked-chart coverage…</div></div>';
    el.innerHTML = h;
    fetch("charts/_coverage.json?v=" + Date.now()).then(function (r) { return r.ok ? r.json() : null; }).then(function (c) {
      var e2 = document.getElementById("r6-cov2"); if (!e2) return;
      if (!c) { e2.textContent = "Baked-chart coverage file not published yet."; return; }
      e2.innerHTML = "Baked charts: <b>" + c.good + " of " + c.files + "</b> chart files (" + c.coveragePct + "%) across " + c.tickers + " tickers; " + c.tickersFull + " tickers have all six ranges. Updated " + esc(c.updatedAt) + "." + (c.misses.length ? " Misses: " + c.misses.slice(0, 40).map(function (m) { return esc(m.ticker) + " (" + esc(m.missingRanges.join("/")) + ": " + esc(m.reason) + ")"; }).join("; ") : "");
    }).catch(function () { var e2 = document.getElementById("r6-cov2"); if (e2) e2.textContent = "Baked-chart coverage file unavailable."; });
  }
  /* ---------- render ---------- */
  function renderView(view) {
    var panel = document.getElementById("view-r6"); if (!panel) return;
    var on = VIEWS.indexOf(view) >= 0; panel.hidden = !on; if (!on || !R) return;
    css();
    var root = document.getElementById("r6-root"); var parts = (location.hash || "").replace(/^#\/?/, "").split("/"); var sub = parts[1] ? decodeURIComponent(parts[1]).toUpperCase() : "";
    var html = view === "distance" ? distance() : view === "catalysts" ? catalysts() : view === "screens" ? screens(sub) : view === "rotation" ? rotation() : view === "signals" ? signals() : optgrades();
    root.innerHTML = '<div class="r6-wrap">' + html + "</div>";
    if (view === "distance") { coverage();
      var q = document.getElementById("r6-q"), f = document.getElementById("r6-f"); f.value = dState.f;
      q.addEventListener("input", function () { dState.q = q.value; var pos = q.selectionStart; renderView("distance"); var n = document.getElementById("r6-q"); n.focus(); n.setSelectionRange(pos, pos); });
      f.addEventListener("change", function () { dState.f = f.value; renderView("distance"); });
      if (sub) { dState.flash = sub; var el = document.getElementById("r6d-" + sub); if (el) { el.classList.add("flash"); setTimeout(function () { el.scrollIntoView({ block: "center" }); }, 30); } } }
    if (view === "catalysts") { var cq = document.getElementById("r6-cq"), cf = document.getElementById("r6-cf"); cf.value = cState.f;
      cq.addEventListener("input", function () { cState.q = cq.value; var pos = cq.selectionStart; renderView("catalysts"); var n = document.getElementById("r6-cq"); n.focus(); n.setSelectionRange(pos, pos); });
      cf.addEventListener("change", function () { cState.f = cf.value; renderView("catalysts"); }); }
  }
  window.R6UI = { css: css, renderView: renderView, holdingsExtra: holdingsExtra, badges: badges, VIEWS: VIEWS };
})();
