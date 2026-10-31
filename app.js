/* UPG-BEGIN — v32 upgrades: pack record, catalysts, books score, sectors, options, patterns, RS, table/compare, overlap, insider. Research only. */
(function () {
  "use strict";
  const U = () => window.UPGRADES || null;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const na = '<span class="upg-na">n/a</span>';
  const pct = (x, d = 2) => (x == null || isNaN(x) ? na : `<span class="${x > 0 ? "upg-pos" : x < 0 ? "upg-neg" : ""}">${x > 0 ? "+" : ""}${Number(x).toFixed(d)}%</span>`);
  const T = (t) => (U() && U().tickers && U().tickers[t]) || null;
  const pname = (p) => (U() && U().packNames && U().packNames[p]) || p;
  const fmtTs = (s) => { if (!s) return "n/a"; try { return new Date(s).toLocaleString("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) + " CT"; } catch (_) { return s; } };
  const wl = () => (window.WATCHLIST && window.WATCHLIST.stocks) || [];
  const comb = (t) => { const c = window.SCORES && window.SCORES.combined && window.SCORES.combined.scores; return c ? c[t] : null; };
  const open = (t) => { if (window.__openChart) window.__openChart(t); };

  function rowChips(t) {
    const x = T(t); if (!x) return "";
    const out = [];
    if (x.overlap >= 2) out.push(`<span class="upg-chip upg-ov" title="In ${x.overlap} packs: ${esc(x.packs.map(pname).join(", "))}">×${x.overlap}</span>`);
    const e = x.earnings, pm = x.premarket, n = (x.news || []).length;
    let cat = "";
    if (e) cat += `E ${e.date.slice(5)}`;
    if (pm && pm.gapPct != null) cat += `${cat ? " · " : ""}PM ${pm.gapPct > 0 ? "+" : ""}${pm.gapPct}%`;
    if (n) cat += `${cat ? " · " : ""}${n}📰`;
    if (cat) out.push(`<span class="upg-chip upg-cat${e && e.within7 ? " is-hot" : ""}" title="Catalysts — earnings ${e ? esc(e.date) + (e.within7 ? " (within 7 days)" : "") : "n/a"}; pre-market ${pm && pm.gapPct != null ? pm.gapPct + "%" : "n/a"}; ${n} headline(s). Open chart for details.">${esc(cat)}</span>`);
    if (x.books && x.books.score != null) out.push(`<span class="upg-chip upg-bk" title="Books score: ${x.books.passes} pass / ${x.books.fails} fail / ${x.books.na} n/a of ${x.books.of} cited rules">B${x.books.score}</span>`);
    if (x.rsScore != null) out.push(`<span class="upg-chip upg-rs" title="Composite relative strength vs SPY (1/3/6/12m percentile, 0–100)">RS${x.rsScore}</span>`);
    if (x.options && x.options.unusual) out.push(`<span class="upg-chip upg-opt" title="Unusual option volume: ${esc((x.options.unusualWhy || []).join("; "))}">OPT⚡</span>`);
    (x.patterns || []).filter((p) => /breakout|pullback/.test(p.id)).forEach((p) => out.push(`<span class="upg-chip upg-pat" title="${esc(p.why || p.label)}">${esc(p.label)}</span>`));
    if (x.insider && x.insider.flag) out.push(`<span class="upg-chip upg-ins" title="SEC Form 4 open-market buys (code P), last ${x.insider.windowDays}d: ${x.insider.buys} by ${x.insider.buyers} insider(s)">INS↑</span>`);
    return out.length ? `<span class="upg-chips">${out.join("")}</span>` : "";
  }

  function detail(t) {
    let el = document.getElementById("chart-upg");
    if (!el) return;
    const x = T(t);
    if (!x) { el.innerHTML = `<p class="upg-note">No upgrade data for ${esc(t)} (not on today's board).</p>`; el.hidden = false; return; }
    const e = x.earnings, pm = x.premarket, o = x.options, b = x.books, ins = x.insider, rs = x.rs || {};
    const rules = (U().booksRules && U().booksRules.rules) || [];
    const news = (x.news || []).map((n) => `<li><a href="${esc(n.link)}" target="_blank" rel="noopener">${esc(n.title)}</a> <span class="upg-dim">${esc(fmtTs(n.ts))}</span></li>`).join("");
    el.innerHTML = `
      <div class="upg-grid">
        <div><h4>Catalysts</h4>
          <p>Next earnings: ${e ? `<b class="${e.within7 ? "upg-hot" : ""}">${esc(e.date)}</b> (${e.days}d${e.within7 ? " · within 7 days" : ""}${e.estimate ? " · range/estimate" : ""})` : na}</p>
          <p>Pre-market gap: ${pm && pm.gapPct != null ? pct(pm.gapPct) + ` <span class="upg-dim">as of ${esc(fmtTs(pm.asOf))}</span>` : `${na} <span class="upg-dim">${esc((pm && pm.note) || "")}</span>`}</p>
          ${news ? `<ul class="upg-news">${news}</ul>` : `<p>Headlines: ${na}</p>`}</div>
        <div><h4>Relative strength vs SPY</h4>
          <p>1m ${pct(rs.m1)} · 3m ${pct(rs.m3)} · 6m ${pct(rs.m6)} · 12m ${pct(rs.m12)}</p><p>Composite RS: <b>${x.rsScore != null ? x.rsScore : na}</b>/100</p>
          <h4>Patterns (${esc(U().lastBar)})</h4>
          <p>${(x.patterns || []).length ? x.patterns.map((p) => `<span class="upg-chip upg-pat" title="${esc(p.why || "")}">${esc(p.label)}</span>`).join(" ") : "none"}</p>
          <p class="upg-dim">${esc(U().notes.candles)}</p></div>
        <div><h4>Options</h4>
          ${o ? `<p>ATM IV ${o.atmIV != null ? o.atmIV + "%" : na} (${esc(o.atmExpiry)}) · ${esc(o.ivLabel)}</p><p>Volume ${o.volume.toLocaleString()} · OI ${o.openInterest.toLocaleString()} (${esc(o.expiries.join(", "))})</p><p>${o.unusual ? `<b class="upg-hot">Unusual: ${esc(o.unusualWhy.join("; "))}</b>` : "No unusual-volume flag"}${o.avgNote ? ` <span class="upg-dim">(${esc(o.avgNote)})</span>` : ""}</p>` : `<p>${na} (no listed options in yfinance)</p>`}
          <p class="upg-dim">${esc(U().notes.options)}</p>
          <h4>Insider buying (SEC Form 4)</h4>
          ${ins && ins.status === "ok" ? `<p>${ins.flag ? `<b class="upg-pos">${ins.buys} open-market buy(s)</b> by ${ins.buyers} insider(s), last ${esc(ins.last || "n/a")}${ins.value ? ` · ~$${Math.round(ins.value).toLocaleString()}` : ""}` : `No open-market purchases in ${ins.form4s} Form 4 filing(s), last ${ins.windowDays}d`}</p>${(ins.detail || []).map((d) => `<p class="upg-dim">${esc(d.owner)}${d.title ? " (" + esc(d.title) + ")" : ""} · ${esc(d.date)} · ${d.shares != null ? d.shares.toLocaleString() : "n/a"} sh @ ${d.price != null ? "$" + d.price : "n/a"} · <a href="${esc(d.url)}" target="_blank" rel="noopener">filing</a></p>`).join("")}` : `<p>${na} <span class="upg-dim">${esc((ins && ins.note) || "")}</span></p>`}</div>
        <div><h4>Books score ${b && b.score != null ? `<b>${b.score}</b>/100` : na}</h4>
          ${b ? `<p class="upg-dim">${b.passes} pass · ${b.fails} fail · ${b.na} n/a of ${b.of} rules (n/a excluded)</p><ul class="upg-rules">${rules.map((r) => `<li class="is-${b.rules[r.id] === "n/a" ? "na" : b.rules[r.id]}" title="${esc(r.quote)}"><span>${b.rules[r.id] === "pass" ? "✓" : b.rules[r.id] === "fail" ? "✗" : "–"}</span> ${esc(r.rule)} <span class="upg-dim">— ${esc(r.book)}, ${esc(r.cite)}</span></li>`).join("")}</ul>` : ""}</div>
      </div>
      <p class="upg-dim">Packs: ${x.packs.length ? esc(x.packs.map(pname).join(", ")) : "none today"} · Sector (yfinance): ${esc(x.sector || "n/a")} · research only, no trades.</p>`;
    el.hidden = false;
  }

  function viewPackRecord() {
    const root = document.getElementById("upg-pack-root"); if (!root || !U()) return;
    const u = U(), r = u.record, d = u.diffs;
    const cell = (s, h) => { const v = s["d" + h]; return v.n ? `${pct(v.avgExcess)}<br><span class="upg-dim">hit ${v.hitRate}% · n=${v.n}${v.pending ? ` · ${v.pending} pending` : ""}</span>` : `<span class="upg-dim">pending${v.pending ? ` (${v.pending})` : ""}</span>`; };
    const diffRows = u.packs.map((p) => { const x = d.packs[p] || { new: [], dropped: [] }; const lk = (a) => a.map((t) => `<a href="#" data-upg-open="${esc(t)}">${esc(t)}</a>`).join(" ") || "—";
      return `<tr><td>${esc(pname(p))}</td><td class="upg-pos">+${x.new.length}</td><td>${lk(x.new)}</td><td class="upg-neg">−${x.dropped.length}</td><td>${lk(x.dropped)}</td></tr>`; }).join("");
    root.innerHTML = `<h2>Pack Record</h2>
      <p class="upg-dim">${esc(r.rankedBy)}. Forward returns over 1/5/20 trading days vs SPY, backfilled from dated Finviz captures (finviz/YYYY-MM-DD) into track-record/packs/. Last price bar ${esc(r.lastBar)}. Returns not yet elapsed are marked pending. Research only.</p>
      <div class="upg-scroll"><table class="upg-table"><thead><tr><th>Rank</th><th>Pack</th><th>1-day excess</th><th>5-day excess</th><th>20-day excess</th></tr></thead><tbody>
      ${r.stats.map((s) => `<tr><td>${s.rank || "—"}</td><td>${esc(pname(s.pack))}${s.v21 ? "" : ' <span class="upg-chip">TTF×Books</span>'}</td><td>${cell(s, 1)}</td><td>${cell(s, 5)}</td><td>${cell(s, 20)}</td></tr>`).join("")}</tbody></table></div>
      <h3>New today / Dropped today <span class="upg-dim">(${esc(d.date)} vs ${esc(d.prev || "n/a")})</span></h3>${d.gapNote ? `<p class="upg-dim">${esc(d.gapNote)}</p>` : ""}
      <div class="upg-scroll"><table class="upg-table"><thead><tr><th>Pack</th><th>New</th><th>Tickers</th><th>Dropped</th><th>Tickers</th></tr></thead><tbody>${diffRows}</tbody></table></div>`;
  }

  function viewSectors() {
    const root = document.getElementById("upg-sector-root"); if (!root || !U()) return;
    const s = U().sectors;
    const heat = (v) => v == null ? "transparent" : v > 0 ? `rgba(34,197,94,${Math.min(0.15 + Math.abs(v) / 4, 0.75)})` : `rgba(239,68,68,${Math.min(0.15 + Math.abs(v) / 4, 0.75)})`;
    root.innerHTML = `<h2>Sector heat map</h2><p class="upg-dim">${s.base} pack names (6 v2.1 + 2 TTF×Books, capture ${esc(U().captureDate)}) grouped by yfinance sector. Tile colour = average daily % move of pack names on ${esc(U().lastBar)}; SPDR sector ETF move shown for comparison.</p>
      ${s.crowding.length ? `<div class="upg-warn"><b>Crowding warnings (${s.crowding.length})</b><ul>${s.crowding.map((c) => `<li>${esc(c.kind === "pack-sector" ? `${pname(c.pack)}: ${c.n} names in ${c.sector}` : c.msg)}</li>`).join("")}</ul></div>` : `<p>No crowding warnings.</p>`}
      <div class="upg-heat">${s.rows.map((r) => `<div class="upg-tile${r.crowded ? " is-crowded" : ""}" style="background:${heat(r.avgChg)}"><b>${esc(r.sector)}</b><span>${r.n} names · ${r.share}%</span><span>Pack avg ${pct(r.avgChg)}</span><span>${r.etf ? esc(r.etf) + " " : ""}${r.etf ? pct(r.etfChg) : "no ETF"}</span><small>${r.tickers.map((t) => `<a href="#" data-upg-open="${esc(t)}">${esc(t)}</a>`).join(" ")}</small></div>`).join("")}</div>`;
  }

  const TS = { key: "rsScore", dir: -1, q: "", pack: "", sector: "", only: "", cmp: [] };
  function rowsAll() {
    return wl().map((s) => { const x = T(s.ticker) || {}; const c = comb(s.ticker) || {};
      return { t: s.ticker, name: s.name, price: s.price, chg: s.changePct, score: c.score != null ? c.score : null, packs: (x.packs || []).length, packList: x.packs || [], rs: x.rsScore, rs3: x.rs && x.rs.m3,
        books: x.books ? x.books.score : null, earn: x.earnings ? x.earnings.days : null, earnDate: x.earnings ? x.earnings.date : null, sector: x.sector || "n/a",
        iv: x.options ? x.options.atmIV : null, unusual: !!(x.options && x.options.unusual), ins: !!(x.insider && x.insider.flag), pat: (x.patterns || []).map((p) => p.label).join(", ") }; });
  }
  function viewTable() {
    const root = document.getElementById("upg-table-root"); if (!root || !U()) return;
    let rows = rowsAll();
    const q = TS.q.toUpperCase();
    rows = rows.filter((r) => (!q || r.t.includes(q) || String(r.name || "").toUpperCase().includes(q)) && (!TS.pack || r.packList.includes(TS.pack)) && (!TS.sector || r.sector === TS.sector)
      && (TS.only !== "earn7" || (r.earn != null && r.earn <= 7)) && (TS.only !== "unusual" || r.unusual) && (TS.only !== "ins" || r.ins) && (TS.only !== "multi" || r.packs >= 2) && (TS.only !== "pattern" || r.pat));
    rows.sort((a, b) => { const x = a[TS.key], y = b[TS.key]; if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1; return (x > y ? 1 : x < y ? -1 : 0) * TS.dir; });
    const cols = [["t", "Ticker"], ["price", "Price"], ["chg", "% Chg"], ["score", "Score"], ["packs", "Packs"], ["rs", "RS"], ["rs3", "RS 3m"], ["books", "Books"], ["earn", "Earnings (d)"], ["iv", "ATM IV"], ["sector", "Sector"], ["pat", "Patterns"]];
    const sectors = [...new Set(rowsAll().map((r) => r.sector))].sort();
    root.innerHTML = `<h2>Table &amp; compare</h2>
      <div class="upg-filters"><input id="upg-q" placeholder="Search ticker / name" value="${esc(TS.q)}">
        <select id="upg-pack"><option value="">All packs</option>${U().packs.map((p) => `<option value="${esc(p)}"${TS.pack === p ? " selected" : ""}>${esc(pname(p))}</option>`).join("")}</select>
        <select id="upg-sector"><option value="">All sectors</option>${sectors.map((s) => `<option${TS.sector === s ? " selected" : ""}>${esc(s)}</option>`).join("")}</select>
        <select id="upg-only"><option value="">No flag filter</option>${[["earn7", "Earnings ≤7d"], ["unusual", "Unusual options"], ["ins", "Insider buying"], ["multi", "In 2+ packs"], ["pattern", "Any pattern"]].map(([v, l]) => `<option value="${v}"${TS.only === v ? " selected" : ""}>${l}</option>`).join("")}</select>
        <span class="upg-dim">${rows.length} rows · tick 2–4 to compare</span></div>
      <div id="upg-cmp"></div>
      <div class="upg-scroll"><table class="upg-table upg-sort"><thead><tr><th></th>${cols.map(([k, l]) => `<th data-k="${k}" class="${TS.key === k ? (TS.dir > 0 ? "is-asc" : "is-desc") : ""}">${l}</th>`).join("")}</tr></thead><tbody>
      ${rows.map((r) => `<tr><td><input type="checkbox" data-cmp="${esc(r.t)}"${TS.cmp.includes(r.t) ? " checked" : ""}></td><td><a href="#" data-upg-open="${esc(r.t)}"><b>${esc(r.t)}</b></a> ${rowChips(r.t)}</td><td>${r.price != null ? "$" + Number(r.price).toFixed(2) : na}</td><td>${pct(r.chg)}</td><td>${r.score != null ? r.score : na}</td><td>${r.packs}</td><td>${r.rs != null ? r.rs : na}</td><td>${pct(r.rs3, 1)}</td><td>${r.books != null ? r.books : na}</td><td>${r.earn != null ? `${r.earn} <span class="upg-dim">${esc(r.earnDate)}</span>` : na}</td><td>${r.iv != null ? r.iv + "%" : na}</td><td>${esc(r.sector)}</td><td class="upg-dim">${esc(r.pat)}</td></tr>`).join("")}</tbody></table></div>`;
    root.querySelector("#upg-q").addEventListener("change", (e) => { TS.q = e.target.value; viewTable(); });
    [["#upg-pack", "pack"], ["#upg-sector", "sector"], ["#upg-only", "only"]].forEach(([s, k]) => root.querySelector(s).addEventListener("change", (e) => { TS[k] = e.target.value; viewTable(); }));
    root.querySelectorAll("th[data-k]").forEach((th) => th.addEventListener("click", () => { const k = th.dataset.k; if (TS.key === k) TS.dir = -TS.dir; else { TS.key = k; TS.dir = ["t", "sector", "earn"].includes(k) ? 1 : -1; } viewTable(); }));
    root.querySelectorAll("input[data-cmp]").forEach((cb) => cb.addEventListener("change", () => { const t = cb.dataset.cmp; if (cb.checked) { if (TS.cmp.length >= 4) { cb.checked = false; return; } TS.cmp.push(t); } else TS.cmp = TS.cmp.filter((x) => x !== t); renderCompare(); }));
    renderCompare();
  }
  function renderCompare() {
    const el = document.getElementById("upg-cmp"); if (!el) return;
    if (TS.cmp.length < 2) { el.innerHTML = TS.cmp.length ? `<p class="upg-dim">Pick ${2 - TS.cmp.length} more to compare (max 4).</p>` : ""; return; }
    const R = Object.fromEntries(rowsAll().map((r) => [r.t, r]));
    const lines = [["Price", (t) => R[t].price != null ? "$" + Number(R[t].price).toFixed(2) : na], ["% change", (t) => pct(R[t].chg)], ["Combined score", (t) => R[t].score != null ? R[t].score : na],
      ["Packs", (t) => { const x = T(t); return x && x.packs.length ? esc(x.packs.map(pname).join(", ")) + (x.overlap >= 2 ? ` <b>×${x.overlap}</b>` : "") : "none"; }],
      ["RS composite", (t) => R[t].rs != null ? R[t].rs : na], ["RS 1/3/6/12m", (t) => { const r = (T(t) || {}).rs || {}; return `${pct(r.m1, 1)} / ${pct(r.m3, 1)} / ${pct(r.m6, 1)} / ${pct(r.m12, 1)}`; }],
      ["Next earnings", (t) => { const e = (T(t) || {}).earnings; return e ? `${esc(e.date)} (${e.days}d)` : na; }], ["Latest headline", (t) => { const n = ((T(t) || {}).news || [])[0]; return n ? `<a href="${esc(n.link)}" target="_blank" rel="noopener">${esc(n.title)}</a>` : na; }],
      ["Books score", (t) => { const b = (T(t) || {}).books; return b && b.score != null ? `${b.score} (${b.passes}/${b.passes + b.fails})` : na; }],
      ["Options", (t) => { const o = (T(t) || {}).options; return o ? `IV ${o.atmIV != null ? o.atmIV + "%" : "n/a"} · ${esc(o.ivLabel)} · vol ${o.volume.toLocaleString()} / OI ${o.openInterest.toLocaleString()}${o.unusual ? " · ⚡unusual" : ""}` : na; }],
      ["Insider buys (90d)", (t) => { const i = (T(t) || {}).insider; return i && i.status === "ok" ? (i.flag ? `${i.buys} buy(s)` : "none") : na; }], ["Patterns", (t) => esc(R[t].pat) || "none"], ["Sector", (t) => esc(R[t].sector)]];
    el.innerHTML = `<div class="upg-scroll"><table class="upg-table upg-cmp"><thead><tr><th>Compare</th>${TS.cmp.map((t) => `<th><a href="#" data-upg-open="${esc(t)}">${esc(t)}</a></th>`).join("")}</tr></thead><tbody>${lines.map(([l, f]) => `<tr><td>${l}</td>${TS.cmp.map((t) => `<td>${f(t)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }
  function renderView(v) { if (v === "packrecord") viewPackRecord(); if (v === "sectors") viewSectors(); if (v === "table") viewTable(); }
  document.addEventListener("click", (e) => { const a = e.target.closest && e.target.closest("[data-upg-open]"); if (a) { e.preventDefault(); open(a.dataset.upgOpen); } });
  window.__UPG = { rowChips, detail, renderView };
})();
/* UPG-END */
(() => {
  const data = window.WATCHLIST;
  if (!data || !Array.isArray(data.stocks)) {
    document.body.innerHTML =
      '<p style="padding:2rem;font-family:sans-serif;color:#f18998">Missing window.WATCHLIST — run rebuild_quotes.py</p>';
    return;
  }

  const market = window.MARKET || null;
  const gate = window.GATE_SUMMARY || null;
  const booksAlign = window.BOOKS_ALIGN || null;
  const additivePacks = window.ADDITIVE_PACKS || null;
  const packScreenerUrls = window.PACK_SCREENER_URLS || null;

  function screenerUrlForPack(packId) {
    if (!packId) return null;
    // Prefer additive publicUrl from ADDITIVE_PACKS, then pack-screener-urls.js (registry/summary)
    if (additivePacks && Array.isArray(additivePacks.packs)) {
      const hit = additivePacks.packs.find((p) => p.id === packId);
      if (hit && hit.publicUrl) return hit.publicUrl;
    }
    if (packScreenerUrls) {
      const a = packScreenerUrls.additive && packScreenerUrls.additive[packId];
      if (a && a.url) return a.url;
      const v = packScreenerUrls.v21 && packScreenerUrls.v21[packId];
      if (v && v.url) return v.url;
    }
    return null;
  }

  function makeFinvizLink(url, label) {
    const a = document.createElement("a");
    a.className = "finviz-screener-link";
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.title = label || "Open this pack on Finviz (public screener)";
    a.textContent = "Open on Finviz ↗";
    a.addEventListener("click", (e) => e.stopPropagation());
    return a;
  }

  function wrapChipWithScreener(btn, packId, packName) {
    const url = screenerUrlForPack(packId);
    if (!url) return btn;
    const wrap = document.createElement("span");
    wrap.className = "pack-chip-group";
    wrap.appendChild(btn);
    wrap.appendChild(makeFinvizLink(url, `${packName || packId} on Finviz`));
    return wrap;
  }

  // Merge book-alignment labels onto stocks (UI-side; never removes stocks or touches quotes/TTF/TSM)
  const BOOK_META = (booksAlign && booksAlign.books) || {};
  data.stocks.forEach((s) => {
    const hit = booksAlign && booksAlign.tickers ? booksAlign.tickers[s.ticker] : null;
    s.books = hit && Array.isArray(hit.books) ? hit.books : [];
    s.booksAlign = !!(hit && hit.booksAlign && s.books.length);
  });

  // Overlay additive Finviz packs (UI-side; never removes stocks / wipe v2.1 / TTF / TSM)
  const ADDITIVE_META = {};
  const ADDITIVE_IDS = new Set();
  ((additivePacks && additivePacks.packs) || []).forEach((p) => {
    ADDITIVE_META[p.id] = p;
    ADDITIVE_IDS.add(p.id);
  });
  const additiveTickerMap = (additivePacks && additivePacks.tickers) || {};
  const boardBeforeAdditive = data.stocks.length;
  data.stocks.forEach((s) => {
    const hit = additiveTickerMap[s.ticker];
    const addIds = hit && Array.isArray(hit.packIds) ? hit.packIds : [];
    s.additivePackIds = addIds.slice();
    if (!addIds.length) return;
    if (!Array.isArray(s.packIds)) s.packIds = [];
    if (!Array.isArray(s.packs)) s.packs = [];
    addIds.forEach((id) => {
      if (!s.packIds.includes(id)) s.packIds.push(id);
      const meta = ADDITIVE_META[id];
      const nm = meta ? meta.name : id;
      if (!s.packs.includes(nm)) s.packs.push(nm);
    });
    s.packCount = s.packIds.length;
    if ((!s.name || s.name === "—") && hit && hit.name) s.name = hit.name;
  });
  // Append additive-only tickers missing from the board (minimal rows; null quotes OK)
  Object.keys(additiveTickerMap).forEach((ticker) => {
    if (data.stocks.some((s) => s.ticker === ticker)) return;
    const hit = additiveTickerMap[ticker];
    const addIds = (hit && hit.packIds) || [];
    const packNames = addIds.map((id) => (ADDITIVE_META[id] && ADDITIVE_META[id].name) || id);
    let name = (hit && hit.name) || null;
    if (!name) {
      for (const id of addIds) {
        const cn = ADDITIVE_META[id] && ADDITIVE_META[id].companyNames;
        if (cn && cn[ticker]) { name = cn[ticker]; break; }
      }
    }
    data.stocks.push({
      ticker,
      name: name || null,
      price: null,
      changePct: null,
      change: null,
      volume: null,
      marketCap: null,
      packs: packNames,
      packIds: addIds.slice(),
      packCount: addIds.length,
      additivePackIds: addIds.slice(),
      sources: [],
      hasTtf: false,
      hasTsm: false,
      books: [],
      booksAlign: false,
      additiveOnly: true,
    });
  });
  if (additivePacks) {
    data.uniqueCount = data.stocks.length;
    data.additiveAdded = data.stocks.length - boardBeforeAdditive;
  }

  const SHORT = {
    "Lynch Fast Grower GARP": "Lynch GARP",
    "Stalwart Quality": "Stalwart",
    "Micro Insider Compounders": "Micro Insider",
    "Mid Momentum Pullback": "Mid Momentum",
    "Cyclical Quality": "Cyclical",
    "Hidden Gem Low-Inst": "Hidden Gem",
  };

  const state = {
    view: "watchlist", // watchlist | gate | market
    search: "",
    packIds: new Set(),
    changeFilter: "all",
    minPct: null,
    maxPct: null,
    sort: "changePct-desc",
    sourceFilter: "all",
    marketSection: "all",
    gateStatus: "all",
    highlightTicker: null,
    bookAlign: false,
    chartTicker: null,
    chartRange: "1mo",
  };

  const byTicker = new Map(data.stocks.map((s) => [s.ticker, s]));

  const $ = (sel) => document.querySelector(sel);
  const body = $("#table-body");
  const empty = $("#empty-state");
  const resultCount = $("#result-count");

  function fmtTime(iso) {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleString("en-US", {
        timeZone: "America/Chicago",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }) + " CT";
    } catch {
      return iso;
    }
  }

  function fmtPrice(v) {
    if (v == null || Number.isNaN(v)) return "—";
    const n = Number(v);
    if (n >= 1000) return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (n >= 1) return n.toFixed(2);
    return n.toFixed(4);
  }

  function fmtPct(v) {
    if (v == null || Number.isNaN(v)) return "—";
    const n = Number(v);
    const sign = n > 0 ? "+" : "";
    return sign + n.toFixed(2) + "%";
  }

  function chgClass(v) {
    if (v == null || Number.isNaN(v)) return "na";
    if (Math.abs(v) < 0.005) return "flat";
    return v > 0 ? "up" : "down";
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, "&#39;");
  }


  // —— Chart detail drawer (Yahoo OHLC via /api/chart) ——
  const chartDrawer = $("#chart-drawer");
  const chartPriceEl = $("#chart-price-el");
  const chartVolumeEl = $("#chart-volume-el");
  const chartStatus = $("#chart-status");
  const chartMeta = $("#chart-meta");
  let chartPriceApi = null;
  let chartVolumeApi = null;
  let chartCandleSeries = null;
  let chartAreaSeries = null;
  let chartVolSeries = null;
  let chartAbort = null;
  let chartResizeObs = null;

  function fmtMoneyChg(v) {
    if (v == null || Number.isNaN(v)) return "—";
    const n = Number(v);
    const sign = n > 0 ? "+" : "";
    return sign + fmtPrice(Math.abs(n) >= 1 ? n : n);
  }

  function destroyCharts() {
    if (chartResizeObs) {
      try { chartResizeObs.disconnect(); } catch (_) {}
      chartResizeObs = null;
    }
    if (chartPriceApi) {
      try { chartPriceApi.remove(); } catch (_) {}
    }
    if (chartVolumeApi) {
      try { chartVolumeApi.remove(); } catch (_) {}
    }
    chartPriceApi = null;
    chartVolumeApi = null;
    chartCandleSeries = null;
    chartAreaSeries = null;
    chartVolSeries = null;
    if (chartPriceEl) chartPriceEl.innerHTML = "";
    if (chartVolumeEl) chartVolumeEl.innerHTML = "";
  }

  function setChartStatus(msg, kind) {
    if (!chartStatus) return;
    if (!msg) {
      chartStatus.hidden = true;
      chartStatus.textContent = "";
      chartStatus.className = "chart-status";
      return;
    }
    chartStatus.hidden = false;
    chartStatus.textContent = msg;
    chartStatus.className = "chart-status" + (kind ? " is-" + kind : "");
  }

  function chartTheme() {
    return {
      layout: {
        background: { type: "solid", color: "transparent" },
        textColor: "#8c9bab",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
      },
      grid: {
        vertLines: { color: "rgba(36, 48, 62, 0.55)" },
        horzLines: { color: "rgba(36, 48, 62, 0.55)" },
      },
      rightPriceScale: { borderColor: "#24303e" },
      timeScale: { borderColor: "#24303e", timeVisible: true, secondsVisible: false },
      crosshair: {
        vertLine: { color: "rgba(61, 214, 189, 0.45)", labelBackgroundColor: "#10151d" },
        horzLine: { color: "rgba(61, 214, 189, 0.45)", labelBackgroundColor: "#10151d" },
      },
    };
  }

  function ensureCharts() {
    if (!chartPriceEl || !chartVolumeEl) return false;
    if (typeof LightweightCharts === "undefined") return false;
    if (chartPriceApi && chartVolumeApi) return true;
    destroyCharts();
    const w = chartPriceEl.clientWidth || 480;
    chartPriceApi = LightweightCharts.createChart(chartPriceEl, {
      ...chartTheme(),
      width: w,
      height: Math.max(220, chartPriceEl.clientHeight || 260),
    });
    chartVolumeApi = LightweightCharts.createChart(chartVolumeEl, {
      ...chartTheme(),
      width: w,
      height: Math.max(72, chartVolumeEl.clientHeight || 88),
      timeScale: { borderColor: "#24303e", timeVisible: true, secondsVisible: false, visible: true },
    });
    // Prefer candles; area as alternate if needed
    chartCandleSeries = chartPriceApi.addCandlestickSeries({
      upColor: "#6bcf8e",
      downColor: "#f18998",
      borderUpColor: "#6bcf8e",
      borderDownColor: "#f18998",
      wickUpColor: "#6bcf8e",
      wickDownColor: "#f18998",
    });
    chartVolSeries = chartVolumeApi.addHistogramSeries({
      priceFormat: { type: "volume" },
      priceScaleId: "",
    });
    chartVolumeApi.priceScale("").applyOptions({
      scaleMargins: { top: 0.15, bottom: 0 },
    });
    chartPriceApi.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (range && chartVolumeApi) {
        chartVolumeApi.timeScale().setVisibleLogicalRange(range);
      }
    });
    chartVolumeApi.timeScale().subscribeVisibleLogicalRangeChange((range) => {
      if (range && chartPriceApi) {
        chartPriceApi.timeScale().setVisibleLogicalRange(range);
      }
    });
    if (typeof ResizeObserver !== "undefined") {
      chartResizeObs = new ResizeObserver(() => {
        if (!chartPriceApi || !chartPriceEl) return;
        const nw = chartPriceEl.clientWidth || w;
        chartPriceApi.applyOptions({ width: nw, height: Math.max(220, chartPriceEl.clientHeight || 260) });
        chartVolumeApi.applyOptions({ width: nw, height: Math.max(72, chartVolumeEl.clientHeight || 88) });
      });
      chartResizeObs.observe(chartPriceEl);
    }
    return true;
  }

  function paintFallbackSvg(payload) {
    destroyCharts();
    if (!chartPriceEl || !payload || !payload.bars || !payload.bars.length) return;
    const bars = payload.bars;
    const prices = bars.map((b) => b.c);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const pad = (max - min) * 0.08 || 1;
    const lo = min - pad;
    const hi = max + pad;
    const W = 560;
    const H = 240;
    const pts = bars.map((b, i) => {
      const x = (i / Math.max(1, bars.length - 1)) * (W - 16) + 8;
      const y = H - 12 - ((b.c - lo) / (hi - lo)) * (H - 24);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(" ");
    const last = bars[bars.length - 1].c;
    const first = bars[0].c;
    const stroke = last >= first ? "#6bcf8e" : "#f18998";
    chartPriceEl.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">
      <polyline fill="none" stroke="${stroke}" stroke-width="2" points="${pts}"/>
    </svg>`;
    if (chartVolumeEl) {
      const vols = bars.map((b) => b.v || 0);
      const vmax = Math.max(...vols, 1);
      const barsHtml = bars.map((b, i) => {
        const x = (i / Math.max(1, bars.length - 1)) * (W - 16) + 8;
        const h = ((b.v || 0) / vmax) * 60;
        const up = i === 0 || b.c >= bars[i - 1].c;
        return `<rect x="${(x - 1).toFixed(1)}" y="${(70 - h).toFixed(1)}" width="2" height="${h.toFixed(1)}" fill="${up ? "rgba(107,207,142,0.55)" : "rgba(241,137,152,0.55)"}"/>`;
      }).join("");
      chartVolumeEl.innerHTML = `<svg viewBox="0 0 ${W} 70" width="100%" height="100%" preserveAspectRatio="none">${barsHtml}</svg>`;
    }
  }

  function applyChartQuote(payload, boardRow) {
    const tickerEl = $("#chart-ticker");
    const nameEl = $("#chart-name");
    const lastEl = $("#chart-last");
    const chgEl = $("#chart-change");
    const pctEl = $("#chart-change-pct");
    // Prefer board company name; API may only echo the ticker when .info is skipped
    const apiName = payload && payload.name && payload.name !== payload.ticker ? payload.name : null;
    const name = (boardRow && boardRow.name) || apiName || (payload && payload.name) || "—";
    const last = payload && payload.regularMarketPrice != null
      ? payload.regularMarketPrice
      : (boardRow && boardRow.price);
    const change = payload && payload.change != null
      ? payload.change
      : (boardRow && boardRow.change);
    const pct = payload && payload.changePct != null
      ? payload.changePct
      : (boardRow && boardRow.changePct);
    if (tickerEl) tickerEl.textContent = (payload && payload.ticker) || (boardRow && boardRow.ticker) || "—";
    if (nameEl) nameEl.textContent = name || "—";
    if (lastEl) lastEl.textContent = fmtPrice(last);
    const cls = chgClass(pct);
    if (chgEl) {
      chgEl.className = "chg " + cls;
      if (change == null || Number.isNaN(Number(change))) chgEl.textContent = "—";
      else {
        const n = Number(change);
        chgEl.textContent = (n > 0 ? "+" : "") + fmtPrice(n);
      }
    }
    if (pctEl) {
      pctEl.className = "chg " + cls;
      pctEl.textContent = fmtPct(pct);
    }
  }

  function renderChartMeta(boardRow) {
    if (!chartMeta) return;
    if (!boardRow) {
      chartMeta.innerHTML = state.chartTicker ? invLabelHtml(state.chartTicker, 99) : "";
      return;
    }
    let html = "";
    const ttfSrc = (boardRow.sources || []).find((x) => x.id === "ttf");
    const tsmSrc = (boardRow.sources || []).find((x) => x.id === "tsm");
    if (ttfSrc) html += `<span class="source-badge source-ttf" title="Trading Fraternity">TTF</span>`;
    if (tsmSrc) html += `<span class="source-badge source-tsm" title="Stock Market Live">TSM</span>`;
    const ttgSrc0 = (boardRow.sources || []).find((x) => x.id === "ttg");
    if (ttgSrc0) html += `<a class="source-badge source-ttg" href="${escapeAttr((ttgSrc0.videos && ttgSrc0.videos[0] && ttgSrc0.videos[0].url) || "https://www.youtube.com/@cfromhertz33")}" target="_blank" rel="noopener noreferrer" title="${escapeAttr("Tribeca Trade Group (Christian Fromhertz) — " + (ttgSrc0.stance || ""))}">TTG</a>`;
    for (const b of boardRow.books || []) {
      const meta = BOOK_META[b.id] || {};
      html += `<span class="book-badge book-${escapeAttr(b.id)}">${escapeHtml(meta.label || b.id)}</span>`;
    }
    if (boardRow.booksAlign) {
      html += `<span class="book-badge book-align">ALIGN</span>`;
    }
    html += invLabelHtml(boardRow.ticker, 99);
    const v21Names = (boardRow.packs || []).filter((n) => {
      return !Object.values(ADDITIVE_META).some((m) => m.name === n);
    });
    html += v21Names
      .map((n) => `<span class="pack-pill" title="${escapeAttr(n)}">${escapeHtml(SHORT[n] || n)}</span>`)
      .join("");
    html += (boardRow.additivePackIds || [])
      .map((id) => {
        const meta = ADDITIVE_META[id] || {};
        const name = meta.name || id;
        const short = meta.short || SHORT[name] || name;
        return `<span class="pack-pill additive-pill" title="${escapeAttr(name)}">${escapeHtml(short)}</span>`;
      })
      .join("");
    chartMeta.innerHTML = html || `<span style="color:var(--dim);font-size:0.75rem">No pack / source badges</span>`;
  }

  function barTime(b, intraday) {
    if (intraday) return b.t;
    // Daily: business-day string avoids UTC off-by-one from exchange tz midnights
    const d = new Date(b.t * 1000);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function paintChartBars(payload) {
    const bars = (payload && payload.bars) || [];
    if (!bars.length) {
      setChartStatus("quote unavailable", "error");
      return;
    }
    if (!ensureCharts()) {
      paintFallbackSvg(payload);
      setChartStatus(null);
      return;
    }
    const interval = (payload && payload.interval) || "1d";
    const intraday = /m$|h$/i.test(interval) && interval !== "1d";
    // Show clock on intraday ranges
    try {
      chartPriceApi.applyOptions({ timeScale: { timeVisible: intraday, secondsVisible: false } });
      chartVolumeApi.applyOptions({ timeScale: { timeVisible: intraday, secondsVisible: false } });
    } catch (_) {}
    const candles = bars.map((b) => ({
      time: barTime(b, intraday),
      open: b.o,
      high: b.h,
      low: b.l,
      close: b.c,
    }));
    const vols = bars.map((b, i) => {
      const up = i === 0 || b.c >= bars[i - 1].c;
      return {
        time: barTime(b, intraday),
        value: b.v || 0,
        color: up ? "rgba(107, 207, 142, 0.55)" : "rgba(241, 137, 152, 0.55)",
      };
    });
    chartCandleSeries.setData(candles);
    chartVolSeries.setData(vols);
    chartPriceApi.timeScale().fitContent();
    chartVolumeApi.timeScale().fitContent();
    setChartStatus(null);
  }

  async function loadChartData(ticker, range) {
    const t = String(ticker || "").toUpperCase();
    const r = range || state.chartRange || "1mo";
    state.chartTicker = t;
    state.chartRange = r;
    document.querySelectorAll("#chart-ranges .chart-range-chip").forEach((b) => {
      b.classList.toggle("is-on", b.dataset.range === r);
    });
    const boardRow = byTicker.get(t) || null;
    applyChartQuote(null, boardRow);
    renderChartMeta(boardRow);
    setChartStatus("Loading quote…", "loading");
    if (chartAbort) {
      try { chartAbort.abort(); } catch (_) {}
    }
    chartAbort = typeof AbortController !== "undefined" ? new AbortController() : null;
    try {
      const sig = chartAbort ? chartAbort.signal : undefined;
      const url = `/api/chart?ticker=${encodeURIComponent(t)}&range=${encodeURIComponent(r)}`;
      let payload = null;
      // Live API (local serve.py) first; static host (GitHub Pages) falls back to pre-baked charts/<T>_<range>.json
      if (!window.__NO_CHART_API) {
        try {
          const res = await fetch(url, { signal: sig });
          if ((res.headers.get("content-type") || "").indexOf("json") !== -1) payload = await res.json();
          else window.__NO_CHART_API = true;
        } catch (e) {
          if (e && e.name === "AbortError") throw e;
          window.__NO_CHART_API = true;
        }
      }
      if (!payload) {
        try {
          const sres = await fetch(`charts/${encodeURIComponent(t)}_${encodeURIComponent(r)}.json`, { signal: sig, cache: "no-cache" });
          payload = sres.ok ? await sres.json() : { error: "quote unavailable", detail: "no static chart" };
        } catch (e) {
          if (e && e.name === "AbortError") throw e;
          payload = { error: "quote unavailable", detail: "invalid JSON" };
        }
      }
      if (!payload || payload.error || !payload.bars || !payload.bars.length) {
        applyChartQuote(payload, boardRow);
        destroyCharts();
        setChartStatus("quote unavailable", "error");
        return;
      }
      applyChartQuote(payload, boardRow);
      paintChartBars(payload);
    } catch (err) {
      if (err && err.name === "AbortError") return;
      applyChartQuote(null, boardRow);
      destroyCharts();
      setChartStatus("quote unavailable", "error");
    }
  }

  function openChart(ticker, range) {
    const t = String(ticker || "").toUpperCase();
    if (!t) return;
    if (!chartDrawer) return;
    chartDrawer.hidden = false;
    chartDrawer.setAttribute("aria-hidden", "false");
    document.body.classList.add("chart-open");
    const r = range || state.chartRange || "1mo";
    // Update deep-link without reload
    try {
      const u = new URL(location.href);
      u.searchParams.set("ticker", t);
      history.replaceState(null, "", u.pathname + u.search + u.hash);
    } catch (_) {}
    state.chartRange = r;
    openTvChart(t);
  }

  function closeChart() {
    if (!chartDrawer || chartDrawer.hidden) return;
    chartDrawer.hidden = true;
    chartDrawer.setAttribute("aria-hidden", "true");
    document.body.classList.remove("chart-open");
    state.chartTicker = null;
    if (chartAbort) {
      try { chartAbort.abort(); } catch (_) {}
      chartAbort = null;
    }
    destroyCharts();
    { const h = document.getElementById("tv-chart"); if (h) h.innerHTML = ""; }
    setChartStatus(null);
    try {
      const u = new URL(location.href);
      u.searchParams.delete("ticker");
      const q = u.searchParams.toString();
      history.replaceState(null, "", u.pathname + (q ? "?" + q : "") + u.hash);
    } catch (_) {}
  }

  if (chartDrawer) {
    chartDrawer.querySelectorAll("[data-chart-close]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        closeChart();
      });
    });
  }
  const chartRanges = $("#chart-ranges");
  if (chartRanges) {
    chartRanges.querySelectorAll(".chart-range-chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (!state.chartTicker) return;
        loadChartData(state.chartTicker, btn.dataset.range);
      });
    });
  }


  // Metrics
  const overlaps = data.stocks.filter((s) => (s.packCount || 0) >= 2).length;
  $("#metric-unique").textContent = String(data.uniqueCount ?? data.stocks.length);
  // Unique-ticker metric note (6 packs + additive)
  const uniqueMetric = $("#metric-unique") && $("#metric-unique").closest(".metric");
  if (uniqueMetric) {
    const note = uniqueMetric.querySelector(".metric-note");
    if (note && additivePacks) {
      const added = data.additiveAdded || 0;
      note.textContent = added
        ? `6 packs + additive (+${added})`
        : "6 packs + additive";
    }
  }
  $("#metric-quoted").textContent = String(data.quotedCount ?? "—");
  $("#metric-overlaps").textContent = String(overlaps);
  $("#updated-at").textContent = fmtTime(data.updatedAt);
  $("#captured-at").textContent = fmtTime(data.capturedAt);
  const ttfEl = $("#metric-ttf");
  if (ttfEl) ttfEl.textContent = String(data.ttfCount ?? data.stocks.filter((s) => s.hasTtf).length);
  const tsmEl = $("#metric-tsm");
  if (tsmEl) tsmEl.textContent = String(data.tsmCount ?? data.stocks.filter((s) => s.hasTsm).length);
  const ttgEl = $("#metric-ttg");
  if (ttgEl) ttgEl.textContent = String(data.ttgCount ?? data.stocks.filter((s) => s.hasTtg).length);

  // Pack chips (v2.1 six) + Finviz screener links
  const packChips = $("#pack-chips");
  (data.packs || []).forEach((p) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip pack-chip";
    btn.dataset.packId = p.id;
    btn.innerHTML = `${SHORT[p.name] || p.name}<b>${p.count}</b>`;
    btn.title = p.name;
    btn.addEventListener("click", () => {
      if (state.packIds.has(p.id)) state.packIds.delete(p.id);
      else state.packIds.add(p.id);
      btn.classList.toggle("is-on", state.packIds.has(p.id));
      render();
    });
    packChips.appendChild(wrapChipWithScreener(btn, p.id, p.name));
  });

  // Additive pack chips (teal/green; same OR filter via state.packIds) + Finviz links
  const additiveChips = $("#additive-pack-chips");
  if (additiveChips && additivePacks && Array.isArray(additivePacks.packs)) {
    additivePacks.packs.forEach((p) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip pack-chip additive-pack-chip";
      btn.dataset.packId = p.id;
      const label = p.short || SHORT[p.name] || p.name;
      btn.innerHTML = `${label}<b>${p.count}</b>`;
      btn.title = `${p.name}${p.filterHighlight ? " — " + p.filterHighlight : ""} (additive; research only)`;
      btn.addEventListener("click", () => {
        if (state.packIds.has(p.id)) state.packIds.delete(p.id);
        else state.packIds.add(p.id);
        btn.classList.toggle("is-on", state.packIds.has(p.id));
        render();
      });
      additiveChips.appendChild(wrapChipWithScreener(btn, p.id, p.name));
    });
  } else if (additiveChips && !additivePacks) {
    additiveChips.hidden = true;
    const wrap = $("#additive-pack-wrap");
    if (wrap) wrap.hidden = true;
  }

  // Screeners row — obvious Finviz links for all packs (additive + v2.1)
  (function renderScreenerLinksRow() {
    const row = $("#screener-links");
    const wrap = $("#screener-links-row");
    if (!row) return;
    row.innerHTML = "";
    const items = [];
    (data.packs || []).forEach((p) => {
      const url = screenerUrlForPack(p.id);
      if (url) items.push({ id: p.id, name: SHORT[p.name] || p.name, full: p.name, url, kind: "v21" });
    });
    ((additivePacks && additivePacks.packs) || []).forEach((p) => {
      const url = screenerUrlForPack(p.id);
      if (url) items.push({ id: p.id, name: p.short || p.name, full: p.name, url, kind: "additive" });
    });
    if (!items.length) {
      if (wrap) wrap.hidden = true;
      return;
    }
    items.forEach((it) => {
      const a = document.createElement("a");
      a.className = "screener-link-pill" + (it.kind === "additive" ? " is-additive" : "");
      a.href = it.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.title = `${it.full} — open public Finviz screener`;
      a.textContent = `${it.name} ↗`;
      row.appendChild(a);
    });
  })();

  const sourceChips = $("#source-chips");
  if (sourceChips) {
    sourceChips.querySelectorAll(".chip[data-source]").forEach((btn) => {
      btn.addEventListener("click", () => {
        sourceChips.querySelectorAll(".chip[data-source]").forEach((b) => b.classList.remove("is-on"));
        btn.classList.add("is-on");
        state.sourceFilter = btn.dataset.source;
        render();
      });
    });
  }

  // Book align chip (independent toggle, UI filter only)
  const bookChip = $("#book-align-chip");
  if (bookChip) {
    if (!booksAlign) bookChip.hidden = true;
    bookChip.addEventListener("click", () => {
      state.bookAlign = !state.bookAlign;
      bookChip.classList.toggle("is-on", state.bookAlign);
      render();
    });
  }

  // Book metric + legend
  (function renderBooksOverview() {
    const el = $("#metric-books");
    const note = $("#metric-books-note");
    const legend = $("#books-legend");
    if (!booksAlign) {
      const m = document.querySelector(".metric-books");
      if (m) m.hidden = true;
      return;
    }
    const counts = { lynch: 0, chan: 0, mayer100: 0 };
    let alignN = 0;
    data.stocks.forEach((s) => {
      if (s.booksAlign) alignN += 1;
      s.books.forEach((b) => { if (b.id in counts) counts[b.id] += 1; });
    });
    if (el) el.textContent = String(alignN);
    if (note) note.textContent = `Lynch ${counts.lynch} · Chan ${counts.chan} · 100× ${counts.mayer100}`;
    if (legend) {
      const scored = Object.entries(BOOK_META)
        .map(([id, b]) => `<span class="book-badge book-${escapeAttr(id)}" title="${escapeAttr(b.title + " — " + b.rule + " · " + b.basis)}">${escapeHtml(b.label)}<b>${counts[id] ?? 0}</b></span>`)
        .join("");
      const proc = (booksAlign.processBooks || [])
        .map((b) => `<span class="book-proc" title="${escapeAttr(b.title + " — not ticker-scored: " + b.reason)}">${escapeHtml(b.id)}</span>`)
        .join("");
      legend.innerHTML = `
        <div class="books-legend-row">
          <span class="books-legend-label">Book pills</span>
          ${scored}
          <span class="book-badge book-align" title="booksAlign = ≥1 of Lynch / Chan / 100×">ALIGN<b>${alignN}</b></span>
          <span class="books-legend-hint">Finviz-pack proxies · hover for rule</span>
        </div>
        <div class="books-legend-row">
          <span class="books-legend-label">Process books</span>
          ${proc}
          <span class="books-legend-hint">not ticker-scored yet (need IV/Greeks, VAP/POC, chart, AH, ML, or scuttlebutt data)</span>
        </div>`;
      legend.hidden = false;
    }
  })();

  function passes(s) {
    const q = state.search.trim().toLowerCase();
    if (q) {
      const hay = `${s.ticker || ""} ${s.name || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (state.packIds.size) {
      const ids = s.packIds || [];
      let hit = false;
      for (const id of state.packIds) {
        if (ids.includes(id)) { hit = true; break; }
      }
      if (!hit) return false;
    }
    if (state.sourceFilter === "ttf" && !s.hasTtf) return false;
    if (state.sourceFilter === "tsm" && !s.hasTsm) return false;
    if (state.sourceFilter === "ttg" && !s.hasTtg) return false;
    if (state.sourceFilter === "finviz" && !(s.packIds && s.packIds.length)) return false;
    if (state.bookAlign && !s.booksAlign) return false;
    const pct = s.changePct;
    if (state.changeFilter === "gainers" && !(pct != null && pct > 0)) return false;
    if (state.changeFilter === "losers" && !(pct != null && pct < 0)) return false;
    if (state.changeFilter === "flat" && !(pct != null && Math.abs(pct) <= 0.5)) return false;
    if (state.minPct != null && !(pct != null && pct >= state.minPct)) return false;
    if (state.maxPct != null && !(pct != null && pct <= state.maxPct)) return false;
    return true;
  }

  function sortRows(rows) {
    const [key, dir] = state.sort.split("-");
    const mult = dir === "asc" ? 1 : -1;
    return rows.slice().sort((a, b) => {
      let av = a[key];
      let bv = b[key];
      if (key === "ticker") {
        av = (av || "").toUpperCase();
        bv = (bv || "").toUpperCase();
        return av < bv ? -mult : av > bv ? mult : 0;
      }
      const aNull = av == null || Number.isNaN(av);
      const bNull = bv == null || Number.isNaN(bv);
      if (aNull && bNull) return 0;
      if (aNull) return 1;
      if (bNull) return -1;
      if (av === bv) return (a.ticker || "").localeCompare(b.ticker || "");
      return av < bv ? -mult : mult;
    });
  }

  function render() {
    const filtered = sortRows(data.stocks.filter(passes));
    resultCount.textContent = `${filtered.length} shown · ${data.stocks.length} total`;
    body.innerHTML = "";
    if (!filtered.length) {
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    const frag = document.createDocumentFragment();
    for (const s of filtered) {
      const tr = document.createElement("tr");
      tr.dataset.ticker = s.ticker;
      if ((s.packCount || 0) >= 2) tr.classList.add("is-overlap");
      if (state.highlightTicker && s.ticker === state.highlightTicker) {
        tr.classList.add("market-flash");
      }

      const pct = s.changePct;
      const v21Names = (s.packs || []).filter((n) => {
        // exclude additive pack full names from grey pills
        return !Object.values(ADDITIVE_META).some((m) => m.name === n);
      });
      const packsHtmlV21 = v21Names
        .map((n) => `<span class="pack-pill" title="${escapeAttr(n)}">${escapeHtml(SHORT[n] || n)}</span>`)
        .join("");
      const packsHtmlAdd = (s.additivePackIds || [])
        .map((id) => {
          const meta = ADDITIVE_META[id] || {};
          const name = meta.name || id;
          const short = meta.short || SHORT[name] || name;
          return `<span class="pack-pill additive-pill" title="${escapeAttr(name + " (additive; research only)")}">${escapeHtml(short)}</span>`;
        })
        .join("");
      const packsHtml = packsHtmlV21 + packsHtmlAdd;
      const ttfSrc = (s.sources || []).find((x) => x.id === "ttf");
      const tsmSrc = (s.sources || []).find((x) => x.id === "tsm");
      let badgeHtml = "";
      if (ttfSrc) {
        const vids = ttfSrc.videos || [];
        const tip = vids.length
          ? vids.map((v) => v.title).slice(0, 3).join(" · ")
          : "Trading Fraternity";
        const href = (vids[0] && vids[0].url) || ttfSrc.channelUrl || "https://www.youtube.com/@Thetradingfraternity";
        badgeHtml += `<a class="source-badge source-ttf" href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer" title="${escapeAttr("Trading Fraternity — " + tip)}">TTF</a>`;
      }
      if (tsmSrc) {
        const vids = tsmSrc.videos || [];
        const tip = vids.length
          ? vids.map((v) => v.title).slice(0, 3).join(" · ")
          : "Stock Market Live";
        const href = (vids[0] && vids[0].url) || tsmSrc.channelUrl || "https://www.youtube.com/@TheStockMarket";
        badgeHtml += `<a class="source-badge source-tsm" href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer" title="${escapeAttr("Stock Market Live / TSM — " + tip)}">TSM</a>`;
      }
      const ttgSrc = (s.sources || []).find((x) => x.id === "ttg");
      if (ttgSrc) {
        const vids = ttgSrc.videos || [];
        const v0 = vids[0] || {};
        const tip = `${ttgSrc.stance || ""}${v0.title ? " · " + v0.title : ""}${v0.ts ? " @" + v0.ts : ""}${v0.snip ? " — “" + v0.snip.slice(0, 140) + "…”" : ""}`;
        const href = v0.url || ttgSrc.channelUrl || "https://www.youtube.com/@cfromhertz33";
        badgeHtml += `<a class="source-badge source-ttg" href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer" title="${escapeAttr("Tribeca Trade Group (Christian Fromhertz) — " + tip)}">TTG</a>`;
      }

      let bookHtml = "";
      for (const b of s.books || []) {
        const meta = BOOK_META[b.id] || {};
        const tip = `${meta.title || b.id} — ${b.why || ""}${b.note ? " [" + b.note + "]" : ""}`;
        bookHtml += `<span class="book-badge book-${escapeAttr(b.id)}${b.note ? " has-gate" : ""}" title="${escapeAttr(tip)}">${escapeHtml(meta.label || b.id)}</span>`;
      }
      bookHtml += invLabelHtml(s.ticker, 3);
      if (s.booksAlign) {
        bookHtml += `<span class="book-badge book-align" title="${escapeAttr("Book align — " + s.books.map((b) => (BOOK_META[b.id] || {}).label || b.id).join(" + ") + " (Finviz-pack proxy; research only)")}">ALIGN</span>`;
        tr.classList.add("is-book-align");
      }

      if (s.hasTtf) tr.classList.add("has-ttf");
      if (s.hasTsm) tr.classList.add("has-tsm");
      if (s.hasTtg) tr.classList.add("has-ttg");

      tr.innerHTML = `
        <td class="col-ticker"><span class="ticker">${escapeHtml(s.ticker)}</span>${scoreBadge(s.ticker)}${combinedChip(s.ticker)}${window.__UPG ? window.__UPG.rowChips(s.ticker) : ""}${badgeHtml ? `<span class="ticker-badges">${badgeHtml}</span>` : ""}</td>
        <td class="col-name name-cell" title="${escapeAttr(s.name || "")}">${escapeHtml(s.name || "—")}${industryTag(s.ticker)}</td>
        <td class="col-price num"><span class="price">${fmtPrice(s.price)}</span></td>
        <td class="col-chg num"><span class="chg ${chgClass(pct)}">${fmtPct(pct)}</span></td>
        <td class="col-packs packs-cell"><div class="packs">${badgeHtml}${bookHtml}${packsHtml || (badgeHtml || bookHtml ? "" : "—")}</div></td>
        <td class="col-count num"><span class="pack-count">${s.packCount ?? "—"}</span></td>
      `;
      tr.classList.add("is-clickable");
      tr.style.cursor = "pointer";
      tr.title = "Open chart · " + s.ticker;
      tr.addEventListener("click", (e) => {
        if (e.target.closest("a.source-badge")) return;
        openChart(s.ticker);
      });
      tr.querySelectorAll("a.source-badge").forEach((a) => {
        a.addEventListener("click", (e) => e.stopPropagation());
      });
      frag.appendChild(tr);
    }
    body.appendChild(frag);
  }

  // ===== Performance (forward track record) =====
  function renderPerformance() {
    const el = document.getElementById("perf-root");
    const P = window.PERFORMANCE;
    if (!el) return;
    if (!P || !P.packs) { el.innerHTML = `<p class="perf-note">Track record data not generated yet (track_record.py).</p>`; return; }
    const pct = (v) => (v == null ? "—" : (v >= 0 ? "+" : "") + (v * 100).toFixed(2) + "%");
    const cls = (v) => (v == null ? "" : v > 0 ? "up" : v < 0 ? "down" : "");
    const snaps = P.snapshots || [];
    const nb = snaps.filter((s) => s.backfilled).length, nf = snaps.length - nb;
    const W = [["1w", "1 week"], ["4w", "4 weeks"], ["12w", "12 weeks"]];
    let html = `<header class="perf-hero"><p class="perf-eyebrow">Research and education only, not investment advice</p><h2>Track record</h2>
      <p class="perf-sub">Every Finviz pack, snapshotted daily with entry at that day's close, measured against SPY and QQQ. Equal-weight per pack. Last close used: <b>${escapeHtml(P.lastClose)}</b> · generated ${escapeHtml(fmtTime(P.generatedAt))}.</p>
      <div class="perf-pills"><span class="perf-pill">${snaps.length} snapshots</span><span class="perf-pill is-warn">${nb} backfilled</span><span class="perf-pill is-ok">${nf} forward</span></div></header>`;
    for (const m of P.missingCaptures || []) html += `<p class="perf-warn">⚠ ${escapeHtml(m.date)}: no Finviz capture, so no forward snapshot was written. Yesterday's members were not reused.</p>`;
    html += `<div class="perf-table-wrap"><table class="perf-table"><thead><tr><th>Pack</th>${W.map(([, l]) => `<th>${l}</th>`).join("")}</tr></thead><tbody>`;
    for (const [pid, r] of Object.entries(P.packs)) {
      html += `<tr><td class="perf-pack">${escapeHtml(r.name || pid)}</td>`;
      for (const [w] of W) {
        const x = (r.windows || {})[w] || {};
        if (x.status !== "ok") { html += `<td class="perf-na"><b>N/A</b><small>N=0 · ${x.tradingDaysRemaining ?? "?"} trading days to first result</small></td>`; continue; }
        html += `<td><div class="perf-ret ${cls(x.avgReturn)}">${pct(x.avgReturn)}</div>
          <div class="perf-row"><span>vs SPY</span><b class="${cls(x.excessVsSPY)}">${pct(x.excessVsSPY)}</b></div>
          <div class="perf-row"><span>vs QQQ</span><b class="${cls(x.excessVsQQQ)}">${pct(x.excessVsQQQ)}</b></div>
          <div class="perf-row"><span>Hit rate</span><b>${(x.hitRateVsSPY * 100).toFixed(0)}%</b></div>
          <div class="perf-row"><span>Max DD</span><b class="down">${pct(x.maxDrawdown)}</b></div>
          <small>N=${x.cohorts} cohorts (${x.backfilledCohorts} backfilled) · ${x.positions} positions</small></td>`;
      }
      html += `</tr>`;
    }
    html += `</tbody></table></div>`;
    html += `<details class="perf-details"><summary>Snapshot log (${snaps.length})</summary><ul class="perf-log">${snaps.map((s) => `<li><b>${escapeHtml(s.date)}</b> <span class="perf-pill ${s.backfilled ? "is-warn" : "is-ok"}">${s.backfilled ? "backfilled" : "forward"}</span> ${escapeHtml(s.status || "")}${s.membershipFrom && s.membershipFrom !== s.date ? ` · membership carried from ${escapeHtml(s.membershipFrom)} capture` : ""}${s.elapsedTradingDays != null ? ` · ${s.elapsedTradingDays} trading days elapsed` : ""}</li>`).join("")}</ul></details>`;
    html += `<p class="perf-note"><b>Method.</b> ${escapeHtml(P.method)} Cohorts overlap (daily snapshots share many names), so they are not independent samples. Small N: treat early numbers as noise.</p>`;
    el.innerHTML = html;
  }

  // ===== Composite score (PROVISIONAL equal weights) + diffs =====
  const SCORES = window.SCORES || null;
  const scoreOf = (t) => (SCORES && SCORES.scores && SCORES.scores[t]) || null;
  function scoreBadge(t, big) {
    const s = scoreOf(t);
    if (!s || s.score == null) return big ? `<div class="sc-ring is-na" title="Not enough factor data (needs 3 of 5)"><b>—</b><small>no score</small></div>` : "";
    const cls = s.score >= 70 ? "is-hi" : s.score >= 50 ? "is-mid" : "is-lo";
    const tip = `Composite ${s.score}/100 (provisional equal weights) · ` + Object.entries(s.factors).map(([k, v]) => `${k} ${v ?? "—"}`).join(" · ") + (s.topTier ? " · Top tier" : "");
    if (big) return `<div class="sc-ring ${cls}" style="--p:${s.score}" title="${escapeAttr(tip)}"><b>${s.score}</b><small>score</small></div>`;
    return `<span class="sc-chip ${cls}${s.topTier ? " is-top" : ""}" title="${escapeAttr(tip)}">${s.score}</span>`;
  }
  const COMBINED = (SCORES && SCORES.combined) || null;
  const combOf = (t) => (COMBINED && COMBINED.scores && COMBINED.scores[t]) || null;
  function invLabelHtml(t, max) {
    const c = combOf(t);
    if (!c || !c.labels || !c.labels.length) return "";
    const L = c.labels, shown = L.slice(0, max);
    let h = shown.map((l) => `<span class="book-badge book-inv book-inv-${escapeAttr(l.id)}" title="${escapeAttr(l.label + " — " + l.why + " · source: " + l.src + " (investor-principle label; research only)")}">${escapeHtml(l.label)}</span>`).join("");
    if (L.length > shown.length) h += `<span class="book-badge book-inv book-inv-more" title="${escapeAttr(L.slice(max).map((l) => l.label).join(" · "))}">+${L.length - shown.length}</span>`;
    return h;
  }
  const B31 = (COMBINED && COMBINED.books31) || null;
  const B31BY = {}; ((B31 && B31.books) || []).forEach((b) => { B31BY[b.id] = b; });
  function booksChip(t) {
    const c = combOf(t);
    if (!c || !c.books) return "";
    const n = c.books.n, cls = n >= 20 ? "is-hi" : n >= 13 ? "is-mid" : "is-lo";
    const names = (c.books.ids || []).map((id) => (B31BY[id] || {}).title || id);
    return `<span class="sc-chip sc-books ${cls}" title="${escapeAttr("Books aligned " + n + "/31 (" + c.books.scorable + " are ticker-scorable; MarketWebs and Think and Grow Rich map to site presentation). Met: " + names.join(" · "))}">📚${n}/31</span>`;
  }
  const TA_RULES = [
    "Price above the 200-day SMA (or a reclaim: back above the 20/50-day within 3% of the 200-day) and a rising 200-day: score points (Grimes)",
    "RSI(14) in the 40–70 band scores best; overbought (≥ 70) earns fewer points except for the CAN SLIM preset; oversold earns partial credit, more for value presets (Option Trader's Guide)",
    "At least 15% above the 52-week low scores full points; within 5% earns none (25 Rules of Trading: no breakdown)",
    "ATR under 6% of price scores best (volatility sanity, Option Trader's Guide)",
    "Bullish candle in context (above the 200-day, oversold, or near the 52-week low) = points plus a +2 bonus; bearish reversal candle = 0 points (Candlestick Bible)",
    "Extended-hours move under 3% scores points (After-Hours Trader); more than 25% above the 50-day loses 10 points (no chasing)",
    "Only hard technical gate: a broken chart (below 70% of the 200-day, or within 3% of the 52-week low while below the 200-day)",
  ];
  function screenAlignHtml(id) {
    const sc = ((B31 && B31.screens) || []).find((x) => x.id === id);
    if (!sc) return "";
    const gaps = (B31.books || []).filter((b) => (sc.cells[b.id] || {}).status === "P").map((b) => b.title);
    return `<p class="inv-align"><b>Books aligned: 31/31</b> — ${sc.native} via this screen's own Finviz filters, ${sc.shared} via the shared score/gates/labels, ${sc.presentation} presentation-only (${escapeHtml(gaps.join("; "))})${sc.avgBooksPerStock != null ? ` · its stocks meet ${sc.avgBooksPerStock}/31 on average` : ""}</p>`;
  }
  function techText(c) {
    const x = (c && c.tech) || {};
    if (x.score == null) return "Technical: no data";
    return `Technical ${x.score}/100 · ${x.aboveSma200 ? "above" : "below"} SMA200${x.sma200Rising ? " (rising)" : ""}${x.reclaim ? " · reclaim" : ""} · RSI ${x.rsi ?? "—"} · ATR ${x.atrPct ?? "—"}% · ${x.pctAbove52wLow ?? "—"}% above 52w low${(x.candles || []).length ? " · candle: " + x.candles.join(", ") : ""}${x.extMove ? " · ext-hours " + x.extMove + "%" : ""}${x.broken ? " · BROKEN CHART (gated)" : ""}`;
  }
  function combinedChip(t) {
    const c = combOf(t);
    if (!c || c.score == null) return "";
    const cls = c.score >= 70 ? "is-hi" : c.score >= 50 ? "is-mid" : "is-lo";
    return `<span class="sc-chip sc-comb ${cls}${c.topTier ? " is-top" : ""}" title="${escapeAttr("Combined investor score " + c.score + "/100 (base " + c.base + " + bonus " + c.bonus + ")" + (c.gates.length ? " · gated: " + c.gates.join("; ") : "") + (c.topTier ? " · Top tier" : "") + " · " + techText(c))}">C${c.score}</span>` + booksChip(t);
  }
  function combinedFactorHtml(t) {
    const c = combOf(t);
    if (!c) return "";
    const names = { quality: "Quality (ROIC, GP/A, FCF, margin)", value: "Value (EBIT/EV, FCF yld, PEG)", growth: "Growth (sales, EPS, qtr EPS)", momentum: "Momentum (12-1, 6M, trend)", strength: "Strength (F-Score, D/E, beta)", ownership: "Ownership (insider, inst, buybacks)", technical: "Technical (loose TA: trend, RSI, ATR, candles)" };
    const w = COMBINED.weights || {};
    return `<div class="sc-factors"><h3>Combined investor score <span class="ck-score">${c.score ?? "—"}/100</span></h3><p class="ck-note">Base ${c.base ?? "—"} + preset bonus ${c.bonus}${c.presets.length ? " (" + c.presets.map(presetLetter).join(", ") + ")" : ""}${c.fscore != null ? " · F-Score " + c.fscore + "/9" : ""}${c.topTier ? " · <b>Top tier</b>" : ""}${c.gates.length ? " · gated: " + escapeHtml(c.gates.join("; ")) : ""}</p><p class="ck-note">${escapeHtml(techText(c))}</p>${c.books ? `<p class="ck-note"><b>Books aligned ${c.books.n}/31:</b> ${escapeHtml((c.books.ids || []).map((id) => (B31BY[id] || {}).title || id).join(" · "))}</p>` : ""}${Object.entries(names)
      .map(([k, l]) => { const v = c.families[k]; return `<div class="sc-bar"><span>${l} · ${Math.round((w[k] || 0) * 100)}%</span><i><em style="width:${v ?? 0}%"></em></i><b>${v ?? "—"}</b></div>`; }).join("")}</div>`;
  }
  function presetLetter(id) {
    const p = COMBINED && (COMBINED.presets || []).find((x) => x.id === id);
    return p ? p.letter : id;
  }
  function factorHtml(t) {
    const s = scoreOf(t);
    if (!s) return combinedFactorHtml(t);
    const names = { growth: "Growth", valuation: "PEG / valuation", quality: "ROIC / FCF quality", momentum: "Momentum", ownership: "Insider / inst." };
    return combinedFactorHtml(t) + `<div class="sc-factors"><h3>Legacy composite score <span class="ck-score">${s.score ?? "—"}/100</span></h3><p class="ck-note">Provisional equal weights (20% each) · percentile vs board${s.topTier ? " · <b>Top tier</b>" : ""}</p>${Object.entries(names)
      .map(([k, l]) => { const v = s.factors[k]; return `<div class="sc-bar"><span>${l}</span><i><em style="width:${v ?? 0}%"></em></i><b>${v ?? "—"}</b></div>`; }).join("")}</div>`;
  }
  function renderDiffs() {
    const el = document.getElementById("sc-diffs");
    if (!el || !SCORES) return;
    const td = SCORES.tierDiff, pd = SCORES.packDiff;
    const chips = (arr, kind) => arr && arr.length ? arr.map((t) => `<button type="button" class="sc-diff-chip is-${kind}" data-ticker="${escapeAttr(t)}">${kind === "in" ? "+" : "−"}${escapeHtml(t)}</button>`).join("") : `<span class="ck-note">none</span>`;
    let h = `<h2 class="ss-h2">Entered / exited</h2>`;
    h += `<div class="sc-diff-card"><h3>Top tier (score ≥ 72 to enter, &lt; 68 to exit)</h3>`;
    h += td ? `<p class="ck-note">vs ${escapeHtml(td.vs)}</p><div class="sc-diff-row"><span>Entered</span>${chips(td.entered, "in")}</div><div class="sc-diff-row"><span>Exited</span>${chips(td.exited, "out")}</div>`
            : `<p class="ck-note">First score snapshot is ${escapeHtml(SCORES.date)}. Tier diffs start with the next daily snapshot (no prior day to compare yet).</p>`;
    h += `</div>`;
    if (pd) {
      h += `<div class="sc-diff-card"><h3>Pack membership: ${escapeHtml(pd.to)} vs ${escapeHtml(pd.from)} capture</h3>${pd.todayCapture ? "" : `<p class="ck-note is-warn">No Finviz capture for today yet, so this compares the two latest captures.</p>`}`;
      for (const [, p] of Object.entries(pd.packs)) {
        h += `<details class="sc-pack"><summary><b>${escapeHtml(p.name)}</b> <span class="sc-in">+${p.entered.length}</span> <span class="sc-out">−${p.exited.length}</span></summary><div class="sc-diff-row"><span>Entered</span>${chips(p.entered, "in")}</div><div class="sc-diff-row"><span>Exited</span>${chips(p.exited, "out")}</div></details>`;
      }
      h += `</div>`;
    }
    el.innerHTML = h;
    el.querySelectorAll(".sc-diff-chip").forEach((b) => b.addEventListener("click", () => { if (byTicker.has(b.dataset.ticker)) openChart(b.dataset.ticker); }));
  }

  // ===== Investor presets tab (A–F) + combined investor score ranking — data from scores.js (build_scores.py → combined_score.py) =====
  let investorsRendered = false;
  function renderInvestors() {
    const el = document.getElementById("inv-root");
    if (!el || investorsRendered) return;
    if (!COMBINED) { el.innerHTML = `<p class="ck-note">Combined score not available yet — runs with the weekday 8:12 AM CT pipeline.</p>`; return; }
    investorsRendered = true;
    const C = COMBINED, R = C.regime || {};
    const fmtT = (iso) => { try { return new Date(iso).toLocaleString("en-US", { timeZone: "America/Chicago", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) + " CT"; } catch (_) { return iso || "—"; } };
    const chip = (t) => {
      const c = C.scores[t] || {};
      const cls = c.score == null ? "is-na" : c.score >= 70 ? "is-hi" : c.score >= 50 ? "is-mid" : "is-lo";
      return `<button type="button" class="inv-tk ${cls}${c.topTier ? " is-top" : ""}${c.gates && c.gates.length ? " is-gated" : ""}" data-ticker="${escapeAttr(t)}" title="${escapeAttr((c.name || t) + (c.score != null ? " · combined " + c.score : "") + (c.gates && c.gates.length ? " · gated: " + c.gates.join("; ") : "") + (c.labels && c.labels.length ? " · " + c.labels.map((l) => l.label).join(", ") : "") + (c.books ? " · books " + c.books.n + "/31" : "") + " · " + techText(c))}"><b>${escapeHtml(t)}</b><span>${c.score ?? "—"}</span>${c.books ? `<i class="inv-tk-books" title="books aligned">${c.books.n}</i>` : ""}</button>`;
    };
    const regimeTxt = `${(R.level || "risk-on").toUpperCase()} · SPY ${R.spyClose ?? "—"} vs SMA200 ${R.spySma200 != null ? R.spySma200.toFixed(1) : "—"} · HY spread ${R.hyOas ?? "—"}% (1-yr median ${R.hyMedian1y ?? "—"}%)`;
    const W = C.weights || {};
    const top = (C.ranked || []).slice(0, 25);
    const legacy = (t) => { const s = scoreOf(t); return s && s.score != null ? s.score : "—"; };
    const fam = (c, k) => (c.families && c.families[k] != null ? c.families[k] : "—");
    let h = `<section class="inv-hero"><p class="eyebrow">Research and education only · not investment advice</p>
      <h2 class="ss-hero-title">Investor presets &amp; combined score</h2>
      <p class="ss-hero-sub">Six Finviz presets built from the investor library (Lynch, Greenblatt, O'Neil/Minervini, ARK, Buffett/Munger/Smith/Ackman, Piotroski), captured ${fmtT((C.presets[0] || {}).capturedAt)}. Combined score = Quality ${Math.round(W.quality * 100)}% · Value ${Math.round(W.value * 100)}% · Growth ${Math.round(W.growth * 100)}% · Momentum ${Math.round(W.momentum * 100)}% · Strength ${Math.round(W.strength * 100)}% · Ownership ${Math.round(W.ownership * 100)}%${W.technical != null ? " · Technical " + Math.round(W.technical * 100) + "%" : ""}, +4 per preset passed (max +12), +2 for a bullish candle in trend context. Hard gates: F-Score ≤ 3, negative FCF, D/E &gt; 2, avg volume &lt; 200k, dilution ≥ 10%/yr, weak value, broken chart. 📚 = books aligned out of 31 (21 library PDFs + 10 original Grok project books).</p>
      <p class="inv-regime inv-regime-${escapeAttr(R.level || "risk-on")}" title="${escapeAttr((R.reasons || []).join(" · ") + " — Marks 'Calibrating' / O'Neil 'M' overlay")}">Market regime: ${escapeHtml(regimeTxt)}${(R.reasons || []).length ? " — " + escapeHtml(R.reasons.join("; ")) : ""}</p></section>`;
    h += `<section class="inv-rank"><h3>Top 25 by combined score <small>${C.scored} scored of ${C.universe} (board + presets) · legacy score shown for comparison</small></h3><div class="table-wrap"><table class="wl-table inv-table"><thead><tr><th>#</th><th>Ticker</th><th>Combined</th><th>Legacy</th><th>Q</th><th>V</th><th>G</th><th>M</th><th>S</th><th>O</th><th>T</th><th>📚/31</th><th>Presets</th><th>Investor principles met</th></tr></thead><tbody>${top.map((t, i) => { const c = C.scores[t]; return `<tr class="inv-row${c.topTier ? " is-top" : ""}" data-ticker="${escapeAttr(t)}" tabindex="0"><td>${i + 1}</td><td class="col-ticker"><span class="ticker">${escapeHtml(t)}</span><div class="inv-name">${escapeHtml(c.name || "")}</div></td><td><span class="sc-chip ${c.score >= 70 ? "is-hi" : c.score >= 50 ? "is-mid" : "is-lo"}${c.topTier ? " is-top" : ""}" title="${escapeAttr("base " + c.base + " + bonus " + c.bonus + (c.gates.length ? " · gated: " + c.gates.join("; ") : ""))}">${c.score}</span>${c.gates.length ? '<span class="inv-gate" title="' + escapeAttr(c.gates.join("; ")) + '">gated</span>' : ""}</td><td>${legacy(t)}</td><td>${fam(c, "quality")}</td><td>${fam(c, "value")}</td><td>${fam(c, "growth")}</td><td>${fam(c, "momentum")}</td><td>${fam(c, "strength")}</td><td>${fam(c, "ownership")}</td><td title="${escapeAttr(techText(c))}">${fam(c, "technical")}</td><td title="${escapeAttr(((c.books || {}).ids || []).map((id) => (B31BY[id] || {}).title || id).join(" · "))}">${c.books ? c.books.n : "—"}</td><td>${c.presets.map(presetLetter).join(" ") || "—"}</td><td><div class="packs">${invLabelHtml(t, 4)}</div></td></tr>`; }).join("")}</tbody></table></div></section>`;
    h += `<section class="inv-presets">${(C.presets || []).map((p) => {
      const extra = p.greenblattRank ? `<p class="ck-note">Greenblatt rank (EBIT/EV rank + ROIC rank, financials/utilities excluded${p.excludedFinUtil && p.excludedFinUtil.length ? ": " + escapeHtml(p.excludedFinUtil.join(", ")) : ""}):</p><div class="inv-chips">${p.greenblattRank.slice(0, 30).map(chip).join("")}</div>`
        : p.fscorePass ? `<p class="ck-note">Piotroski pass (F-Score ≥ 7 from SEC filings): ${p.fscorePass.length}</p><div class="inv-chips">${p.fscorePass.map(chip).join("") || "—"}</div>`
        : p.strict ? `<p class="ck-note">Strict CAN SLIM / Trend Template (qtr EPS ≥ 25% and trend ≥ 6/7): ${p.strict.length}</p><div class="inv-chips">${p.strict.map(chip).join("") || "—"}</div>` : "";
      return `<article class="inv-preset" id="preset-${escapeAttr(p.id)}"><header><span class="inv-letter">${escapeHtml(p.letter)}</span><div><h3>${escapeHtml(p.name)}</h3><p class="ck-note">${escapeHtml(p.filterHighlight || "")}</p></div><span class="inv-count">${p.count ?? p.tickers.length}</span></header>${screenAlignHtml(p.id)}${p.countBefore31 != null && p.countBefore31 !== p.count ? `<p class="ck-note">Count ${p.countBefore31} → ${p.count} after the loose technical filter (+ta_highlow52w_a5h)</p>` : ""}
        <p class="inv-links"><a href="${escapeAttr(p.screenerUrl || p.publicUrl)}" target="_blank" rel="noopener noreferrer">Open Finviz screen ↗</a>${p.finvizPresetId ? " · preset " + escapeHtml(p.finvizPresetId) : ""} · captured ${fmtT(p.capturedAt)} · sorted by combined score</p>
        <div class="inv-chips">${(p.ranked || p.tickers).map(chip).join("") || "—"}</div>${extra}</article>`;
    }).join("")}</section>`;
    h += `<p class="ck-note inv-foot">Sources: /library PDFs (Berkshire letters, Fundsmith, Nomad, Pershing, Oaktree memos, Greenblatt, ARK Big Ideas, Piotroski, AQR, Fama-French, Novy-Marx). Data: Finviz (presets), TradingView scanner (metrics), SEC EDGAR (F-Score, dilution, asset growth), Yahoo (ownership), FRED (HY spread). Click any ticker to open its chart.</p>`;
    el.innerHTML = h;
    el.querySelectorAll("[data-ticker]").forEach((b) => {
      const go = () => openChart(b.dataset.ticker);
      b.addEventListener("click", go);
      b.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
    });
  }

  function setView(view) {
    state.view = view;
    document.querySelectorAll(".view-tab").forEach((b) => {
      b.classList.toggle("is-on", b.dataset.view === view);
    });
    const wl = $("#view-watchlist");
    const gt = $("#view-gate");
    const mk = $("#view-market");
    if (wl) wl.hidden = view !== "watchlist";
    if (gt) gt.hidden = view !== "gate";
    if (mk) mk.hidden = view !== "market";
    const pf = $("#view-performance");
    if (pf) pf.hidden = view !== "performance";
    if (view === "performance") renderPerformance();
    if (view === "market") renderMarket();
    if (view === "gate") renderGate();
    const iv = $("#view-investors");
    if (iv) iv.hidden = view !== "investors";
    if (view === "investors") renderInvestors();
    ["packrecord", "sectors", "table"].forEach((v) => { const p = document.getElementById("view-" + v); if (p) p.hidden = view !== v; });
    try { if (window.__UPG) window.__UPG.renderView(view); } catch (_) {}
  }

  function jumpToTicker(ticker) {
    const t = String(ticker || "").toUpperCase();
    if (!byTicker.has(t)) return;
    state.highlightTicker = t;
    state.search = t;
    state.packIds.clear();
    state.changeFilter = "all";
    state.minPct = null;
    state.maxPct = null;
    state.sourceFilter = "all";
    state.bookAlign = false;
    if (bookChip) bookChip.classList.remove("is-on");
    const searchEl = $("#search");
    if (searchEl) searchEl.value = t;
    $("#sort").value = "ticker-asc";
    state.sort = "ticker-asc";
    $("#min-pct").value = "";
    $("#max-pct").value = "";
    document.querySelectorAll("#change-chips .chip").forEach((b) => {
      b.classList.toggle("is-on", b.dataset.change === "all");
    });
    document.querySelectorAll("#pack-chips .chip, #additive-pack-chips .chip").forEach((b) => b.classList.remove("is-on"));
    document.querySelectorAll("#source-chips .chip").forEach((b) => {
      b.classList.toggle("is-on", b.dataset.source === "all");
    });
    setView("watchlist");
    render();
    requestAnimationFrame(() => {
      const row = body.querySelector(`tr[data-ticker="${CSS.escape(t)}"]`);
      if (row) {
        row.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
    setTimeout(() => {
      if (state.highlightTicker === t) {
        state.highlightTicker = null;
      }
    }, 2200);
  }


  function renderGateOverview() {
    const card = $("#gate-overview-card");
    if (!card) return;
    if (!gate || !gate.sample) {
      card.hidden = true;
      return;
    }
    card.hidden = false;
    const sample = gate.sample;
    const counts = sample.counts || {};
    const blurb = $("#gate-card-blurb");
    if (blurb) {
      blurb.textContent =
        (gate.gate && gate.gate.summaryBullets && gate.gate.summaryBullets[0]) ||
        "Second pass after Finviz pack capture — EPS, FCF, sector-relative PEG.";
    }
    const countsEl = $("#gate-card-counts");
    if (countsEl) {
      countsEl.innerHTML = `
        <div class="gate-count-pill is-pass"><span>Pass</span><b>${counts.pass ?? "—"}</b></div>
        <div class="gate-count-pill is-fail"><span>Fail</span><b>${counts.fail ?? "—"}</b></div>
        <div class="gate-count-pill is-exception"><span>Exception</span><b>${counts.exception ?? "—"}</b></div>
      `;
    }
    const meta = $("#gate-card-meta");
    if (meta) {
      const name = sample.packName || sample.packId || "sample";
      const n = sample.nTickers != null ? `${sample.nTickers} tickers` : "";
      meta.textContent = `${name}${n ? " · " + n : ""} · v${sample.finvizPackVersion || "2.1"}`;
    }
  }

  function renderGate() {
    if (!gate || !gate.sample) {
      const list = $("#gate-ticker-list");
      if (list) {
        list.innerHTML =
          '<div class="empty-state"><div class="empty-icon">∅</div><h3>No quality gate sample</h3><p>Generate gate-summary.js from finviz screener-quality-gate + gate-sample artifacts.</p></div>';
      }
      return;
    }

    const sample = gate.sample;
    const counts = sample.counts || {};
    const g = gate.gate || {};

    const angle = $("#gate-angle");
    if (angle) {
      angle.textContent =
        (g.summaryBullets && g.summaryBullets.slice(0, 2).join(" ")) ||
        "Second pass after pack capture: EPS quality, FCF>0 or disclosed exception, sector-relative PEG.";
    }
    const disc = $("#gate-disclaimer");
    if (disc) disc.textContent = gate.disclaimer || "";

    const setCount = (id, v) => {
      const el = $(id);
      if (el) el.textContent = String(v ?? "—");
    };
    setCount("#gate-count-pass", counts.pass);
    setCount("#gate-count-fail", counts.fail);
    setCount("#gate-count-exception", counts.exception);

    const exNote = $("#gate-exception-note");
    if (exNote) exNote.textContent = sample.exceptionNote ? "SMCI" : "disclosed";

    const sampleName = $("#gate-sample-name");
    if (sampleName) sampleName.textContent = sample.packName || sample.packId || "—";
    const runAt = $("#gate-run-at");
    if (runAt) runAt.textContent = fmtTime(sample.gateRunAt || gate.generatedAt);

    const bullets = $("#gate-bullets");
    if (bullets && !bullets.dataset.ready) {
      bullets.innerHTML = (g.summaryBullets || [])
        .map((b) => `<li>${escapeHtml(b)}</li>`)
        .join("");
      bullets.dataset.ready = "1";
    }

    const crit = $("#gate-criteria");
    if (crit && !crit.dataset.ready) {
      crit.innerHTML = (g.criteria || [])
        .map(
          (c) =>
            `<span class="gate-criterion"><b>${escapeHtml(c.id || "")}</b>${escapeHtml(c.title || "")}</span>`
        )
        .join("");
      crit.dataset.ready = "1";
    }

    const chips = $("#gate-status-chips");
    if (chips && !chips.dataset.ready) {
      chips.querySelectorAll(".chip").forEach((btn) => {
        btn.addEventListener("click", () => {
          chips.querySelectorAll(".chip").forEach((b) => b.classList.remove("is-on"));
          btn.classList.add("is-on");
          state.gateStatus = btn.dataset.gstatus;
          renderGateTickers();
        });
      });
      chips.dataset.ready = "1";
    }

    renderGateTickers();
  }

  function renderGateTickers() {
    const list = $("#gate-ticker-list");
    if (!list || !gate) return;
    const rows = (gate.tickers || []).filter((t) => {
      if (state.gateStatus === "all") return true;
      return t.status === state.gateStatus;
    });
    const hint = $("#gate-detail-hint");
    if (hint) {
      const c = gate.sample && gate.sample.counts ? gate.sample.counts : {};
      hint.textContent = `${rows.length} shown · pass ${c.pass ?? "—"} / fail ${c.fail ?? "—"} / exception ${c.exception ?? "—"}`;
    }
    if (!rows.length) {
      list.innerHTML =
        '<div class="empty-state"><div class="empty-icon">∅</div><h3>No tickers in this filter</h3></div>';
      return;
    }
    list.innerHTML = "";
    const frag = document.createDocumentFragment();
    for (const t of rows) {
      const onBoard = byTicker.has(t.ticker);
      const row = document.createElement("div");
      row.className = `gate-ticker-row status-${escapeAttr(t.status)}${onBoard ? " on-board" : ""}`;
      const flags = (t.flags || [])
        .map((f) => `<span class="gate-flag">${escapeHtml(f)}</span>`)
        .join("");
      const tickerBtn = onBoard
        ? `<button type="button" class="gate-ticker-btn" data-ticker="${escapeAttr(t.ticker)}" title="Jump to watchlist">${escapeHtml(t.ticker)}</button>`
        : `<span class="gate-ticker-off" title="Not on current watchlist board">${escapeHtml(t.ticker)}</span>`;
      row.innerHTML = `
        <div class="gate-ticker-left">
          ${tickerBtn}
          <span class="gate-status-pill status-${escapeAttr(t.status)}">${escapeHtml(t.status)}</span>
          ${flags}
        </div>
        <div class="gate-ticker-mid">
          <span class="gate-name">${escapeHtml(t.name || "")}</span>
          <span class="gate-reason">${escapeHtml(t.reason || "")}</span>
        </div>
      `;
      const btn = row.querySelector(".gate-ticker-btn");
      if (btn) btn.addEventListener("click", () => jumpToTicker(btn.dataset.ticker));
      frag.appendChild(row);
    }
    list.appendChild(frag);
  }


  function renderMarket() {
    if (!market || !Array.isArray(market.sections)) {
      const feed = $("#market-feed");
      if (feed) {
        feed.innerHTML =
          '<div class="empty-state"><div class="empty-icon">∅</div><h3>No Market briefing</h3><p>Run rebuild_market.py after seeding market.json with cited headlines.</p></div>';
      }
      return;
    }

    $("#market-angle").textContent = market.angle || "Lynch/GARP · TTF · TSM";
    $("#market-disclaimer").textContent = market.disclaimer || "";
    $("#market-updated-at").textContent = fmtTime(market.updatedAt) + (market.stale ? ` · STALE: content from ${market.contentDate}` : "");
    const itemCount = market.itemCount ?? market.sections.reduce((n, s) => n + (s.items || []).length, 0);
    const matchCount =
      market.matchedTickerCount ??
      new Set(market.sections.flatMap((s) => (s.items || []).flatMap((i) => i.matchedTickers || []))).size;
    $("#market-item-count").textContent = String(itemCount);
    $("#market-match-count").textContent = String(matchCount);

    // Section chips (once)
    const chips = $("#market-section-chips");
    if (chips && !chips.dataset.ready) {
      for (const sec of market.sections) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "chip";
        btn.dataset.msection = sec.id;
        btn.textContent = sec.title || sec.id;
        btn.addEventListener("click", () => {
          chips.querySelectorAll(".chip").forEach((b) => b.classList.remove("is-on"));
          btn.classList.add("is-on");
          state.marketSection = sec.id;
          renderMarket();
        });
        chips.appendChild(btn);
      }
      chips.querySelector('[data-msection="all"]').addEventListener("click", () => {
        chips.querySelectorAll(".chip").forEach((b) => b.classList.remove("is-on"));
        chips.querySelector('[data-msection="all"]').classList.add("is-on");
        state.marketSection = "all";
        renderMarket();
      });
      chips.dataset.ready = "1";
    }

    // Source gaps
    const gapsEl = $("#market-gaps");
    const gaps = (market.sourceGaps || []).filter((g) => g.status && g.status !== "reachable");
    if (gapsEl) {
      if (!gaps.length) {
        gapsEl.hidden = true;
        gapsEl.innerHTML = "";
      } else {
        gapsEl.hidden = false;
        gapsEl.innerHTML =
          "<strong>Source gaps</strong><ul>" +
          gaps
            .map(
              (g) =>
                `<li><b>${escapeHtml(g.source || "source")}</b> — ${escapeHtml(g.note || g.status || "")}</li>`
            )
            .join("") +
          "</ul>";
      }
    }

    const feed = $("#market-feed");
    feed.innerHTML = "";
    const sections =
      state.marketSection === "all"
        ? market.sections
        : market.sections.filter((s) => s.id === state.marketSection);

    for (const sec of sections) {
      const block = document.createElement("section");
      block.className = "market-section-block";
      block.dataset.section = sec.id;
      block.innerHTML = `
        <div class="market-section-head">
          <h3>${escapeHtml(sec.title || sec.id)}</h3>
          ${sec.blurb ? `<p class="sec-blurb">${escapeHtml(sec.blurb)}</p>` : ""}
        </div>
      `;
      for (const item of sec.items || []) {
        const card = document.createElement("article");
        card.className = "market-card";
        const tags = (item.tags || [])
          .map((t) => `<span class="market-tag">${escapeHtml(t)}</span>`)
          .join("");
        const src = item.source || {};
        const cite = src.url
          ? `<a class="market-cite" href="${escapeAttr(src.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(src.name || "Source")} · <time datetime="${escapeAttr(src.fetchedAt || "")}">${escapeHtml(fmtTime(src.fetchedAt || market.updatedAt))}</time></a>`
          : `<span class="market-cite">${escapeHtml(src.name || "Source unavailable")}</span>`;

        const tickersHtml = (item.matchedTickers || [])
          .map((t) => {
            const s = byTicker.get(t);
            const cls = [
              "market-ticker-btn",
              s && s.hasTtf ? "has-ttf" : "",
              s && s.hasTsm ? "has-tsm" : "",
            ]
              .filter(Boolean)
              .join(" ");
            const tip = s
              ? `${t}${s.name ? " — " + s.name : ""}${s.hasTtf ? " · TTF" : ""}${s.hasTsm ? " · TSM" : ""}`
              : t;
            return `<button type="button" class="${cls}" data-ticker="${escapeAttr(t)}" title="${escapeAttr(tip)}">${escapeHtml(t)}</button>`;
          })
          .join("");

        card.innerHTML = `
          <div class="market-card-top">
            <h4>${escapeHtml(item.title || "")}</h4>
            <div class="market-tags">${tags}</div>
          </div>
          <p class="market-why">${escapeHtml(item.whyItMatters || "")}</p>
          <div class="market-card-foot">
            ${cite}
            <div class="market-tickers">${tickersHtml || '<span class="market-cite">No watchlist ticker match</span>'}</div>
          </div>
        `;
        card.querySelectorAll(".market-ticker-btn").forEach((btn) => {
          btn.addEventListener("click", () => jumpToTicker(btn.dataset.ticker));
        });
        block.appendChild(card);
      }
      feed.appendChild(block);
    }
  }

  // View tabs
  document.querySelectorAll(".view-tab").forEach((btn) => {
    btn.addEventListener("click", () => setView(btn.dataset.view));
  });
  const gateOpenBtn = $("#gate-open-detail");
  if (gateOpenBtn) {
    gateOpenBtn.addEventListener("click", () => setView("gate"));
  }

  // Controls
  $("#search").addEventListener("input", (e) => {
    state.search = e.target.value;
    render();
  });
  $("#sort").addEventListener("change", (e) => {
    state.sort = e.target.value;
    render();
  });
  $("#min-pct").addEventListener("input", (e) => {
    const v = e.target.value;
    state.minPct = v === "" ? null : Number(v);
    render();
  });
  $("#max-pct").addEventListener("input", (e) => {
    const v = e.target.value;
    state.maxPct = v === "" ? null : Number(v);
    render();
  });
  document.querySelectorAll("#change-chips .chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("#change-chips .chip").forEach((b) => b.classList.remove("is-on"));
      btn.classList.add("is-on");
      state.changeFilter = btn.dataset.change;
      render();
    });
  });
  $("#clear-filters").addEventListener("click", () => {
    state.search = "";
    state.packIds.clear();
    state.changeFilter = "all";
    state.minPct = null;
    state.maxPct = null;
    state.sort = "changePct-desc";
    state.sourceFilter = "all";
    state.bookAlign = false;
    if (bookChip) bookChip.classList.remove("is-on");
    state.highlightTicker = null;
    $("#search").value = "";
    $("#sort").value = "changePct-desc";
    $("#min-pct").value = "";
    $("#max-pct").value = "";
    document.querySelectorAll("#change-chips .chip").forEach((b) => {
      b.classList.toggle("is-on", b.dataset.change === "all");
    });
    document.querySelectorAll("#pack-chips .chip, #additive-pack-chips .chip").forEach((b) => b.classList.remove("is-on"));
    document.querySelectorAll("#source-chips .chip").forEach((b) => {
      b.classList.toggle("is-on", b.dataset.source === "all");
    });
    render();
  });
  $("#refresh-btn").addEventListener("click", () => location.reload());

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (chartDrawer && !chartDrawer.hidden) {
        e.preventDefault();
        closeChart();
        return;
      }
    }
    if (e.key === "/" && document.activeElement !== $("#search") && state.view === "watchlist") {
      e.preventDefault();
      $("#search").focus();
    }
    if (e.key === "1" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setView("watchlist");
    }
    if (e.key === "2" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setView("gate");
    }
    if (e.key === "3" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setView("market");
    }
  });

  // Deep-link: ?view=market|gate or #market|#gate; ?ticker=MSFT opens chart
  const params = new URLSearchParams(location.search);
  const viewParam = params.get("view") || "";
  if (viewParam === "performance" || location.hash === "#performance") {
    setView("performance");
  } else if (viewParam === "market" || location.hash === "#market") {
    setView("market");
  } else if (viewParam === "gate" || location.hash === "#gate") {
    setView("gate");
  } else {
    setView("watchlist");
  }

  // ===== Investor presets A–F inside "Screens & filters" (chips + Finviz links + rules/codes list) =====
  (function renderInvestorPresetScreens() {
    const presets = (COMBINED && Array.isArray(COMBINED.presets)) ? COMBINED.presets : [];
    const wrap = document.getElementById("investor-preset-wrap");
    const det = document.getElementById("investor-preset-details");
    const chips = document.getElementById("investor-preset-chips");
    const list = document.getElementById("investor-preset-list");
    if (!presets.length) { if (wrap) wrap.hidden = true; if (det) det.hidden = true; return; }
    const urlOf = (p) => p.screenerUrl || p.publicUrl || ("https://finviz.com/screener.ashx?v=111&f=" + (p.filters || []).join(","));
    const countOf = (p) => (p.count ?? (p.tickers || []).length);
    const goPreset = (p) => {
      setView("investors");
      setTimeout(() => { const el = document.getElementById("preset-" + p.id); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 60);
    };
    if (chips) {
      presets.forEach((p) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "chip pack-chip additive-pack-chip investor-preset-chip";
        btn.dataset.presetId = p.id;
        btn.innerHTML = `${escapeHtml(p.letter || "")} · ${escapeHtml(p.short || p.name)}<b>${countOf(p)}</b>`;
        btn.title = `${p.name} — ${p.investors || ""}. Opens the Investor presets tab (research only)`;
        btn.addEventListener("click", () => goPreset(p));
        const g = document.createElement("span");
        g.className = "pack-chip-group";
        g.appendChild(btn);
        g.appendChild(makeFinvizLink(urlOf(p), `${p.name} on Finviz`));
        chips.appendChild(g);
      });
    }
    if (list) {
      list.innerHTML = presets.map((p) => `<article class="inv-screen" id="screen-${escapeAttr(p.id)}">
        <header><span class="inv-letter">${escapeHtml(p.letter || "")}</span><div><h4>${escapeHtml(p.name)}</h4><p class="inv-screen-who">${escapeHtml(p.investors || "")}</p></div><span class="inv-count" title="Tickers in the latest Finviz capture">${countOf(p)}</span></header>
        <p class="inv-screen-src"><b>Source PDFs:</b> ${(p.sourcePdfs || []).map(escapeHtml).join(" · ") || "—"}</p>
        <ul class="inv-screen-rules">${(p.rulesPlain || []).map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul>
        ${screenAlignHtml(p.id)}
        <p class="inv-screen-codes"><b>Finviz filters:</b> <code>${escapeHtml((p.filters || []).join(","))}</code>${p.countBefore31 != null && p.countBefore31 !== p.count ? ` <span class="inv-screen-note">(count ${p.countBefore31} → ${p.count} after the loose TA filter)</span>` : ""}</p>
        <p class="inv-screen-codes"><b>Saved Finviz preset:</b> ${p.finvizPresetId ? `<code>${escapeHtml(p.finvizPresetId)}</code>` : "—"}${p.finvizPresetNote ? ` <span class="inv-screen-note">(${escapeHtml(p.finvizPresetNote)})</span>` : ""}${p.needsResave ? ` <span class="inv-gate">preset needs re-save</span>` : ""}</p>
        <p class="inv-links"><a href="${escapeAttr(urlOf(p))}" target="_blank" rel="noopener noreferrer">Open on Finviz ↗</a> · <a href="?view=investors#preset-${escapeAttr(p.id)}" data-preset-jump="${escapeAttr(p.id)}">See tickers &amp; combined scores</a> · ${countOf(p)} tickers, captured ${p.capturedAt ? escapeHtml(String(p.capturedAt).slice(0, 10)) : "—"}</p>
      </article>`).join("");
      const scs = (B31 && B31.screens) || [];
      if (scs.length) {
        const st = (c) => (c.status === "F" ? "●" : c.status === "S" ? "◐" : "○");
        list.insertAdjacentHTML("beforeend", `<article class="inv-screen inv-screen-wide"><h4>Shared loose technical layer (all screens)</h4><ul class="inv-screen-rules">${TA_RULES.map((r) => `<li>${escapeHtml(r)}</li>`).join("")}</ul></article>
          <article class="inv-screen inv-screen-wide"><h4>31-book alignment by screen</h4><p class="ck-note">● = enforced by the screen's own Finviz filter · ◐ = added through the shared combined score, gates and labels · ○ = presentation only (no ticker-level rule exists). ${escapeHtml(B31.excludedNote || "")}</p>
          <div class="table-wrap"><table class="wl-table inv-table b31-table"><thead><tr><th>Screen</th><th>Tickers</th><th>●</th><th>◐</th><th>○</th><th>Avg 📚/stock</th><th>Books (hover for the rule)</th></tr></thead><tbody>${scs.map((sc) => `<tr><td>${escapeHtml(sc.letter ? sc.letter + " · " : "")}${escapeHtml(sc.name)}</td><td>${sc.count ?? "—"}</td><td>${sc.native}</td><td>${sc.shared}</td><td>${sc.presentation}</td><td>${sc.avgBooksPerStock ?? "—"}</td><td class="b31-cells">${(B31.books || []).map((b) => { const c = sc.cells[b.id] || {}; return `<span class="b31-c b31-${c.status}" title="${escapeAttr(b.title + ": " + b.principle + " → " + (c.rule || ""))}">${st(c)}</span>`; }).join("")}</td></tr>`).join("")}</tbody></table></div></article>`);
      }
      list.querySelectorAll("[data-preset-jump]").forEach((a) => a.addEventListener("click", (e) => {
        e.preventDefault();
        const p = presets.find((x) => x.id === a.dataset.presetJump);
        if (p) goPreset(p);
      }));
    }
    const row = document.getElementById("screener-links");
    if (row) {
      presets.forEach((p) => {
        const a = document.createElement("a");
        a.className = "screener-link-pill is-additive is-investor";
        a.href = urlOf(p);
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.title = `${p.name} — open public Finviz screener`;
        a.textContent = `${p.letter} ${p.short || p.name} ↗`;
        row.appendChild(a);
      });
      const rw = document.getElementById("screener-links-row");
      if (rw) rw.hidden = false;
    }
  })();

  // ===== Phase 1 redesign: Screens menu, Top 5 hero, glossary, theme =====
  (function phase1() {
    const body = document.getElementById("screens-body");
    if (body) {
      ["change-chips", "source-chips", "pack-chips", "additive-pack-wrap", "investor-preset-wrap", "investor-preset-details", "screener-links-row"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) body.appendChild(el);
      });
      const range = document.querySelector("#controls-section .range-row");
      if (range) body.appendChild(range);
      const hint = document.getElementById("screens-hint");
      const upd = () => {
        const on = Array.from(body.querySelectorAll(".chip.is-on"))
          .map((b) => b.textContent.trim())
          .filter((t) => !/^All( sources)?$/.test(t));
        hint.textContent = on.length ? on.join(" · ") : "All tickers";
      };
      body.addEventListener("click", () => setTimeout(upd, 0));
      upd();
    }
    const gBtn = document.getElementById("glossary-btn");
    const gl = document.getElementById("glossary");
    if (gBtn && gl) gBtn.addEventListener("click", () => {
      gl.hidden = !gl.hidden;
      if (!gl.hidden) { setView("watchlist"); gl.scrollIntoView({ behavior: "smooth", block: "start" }); }
    });
    const tBtn = document.getElementById("theme-btn");
    if (tBtn) tBtn.addEventListener("click", () => {
      const root = document.documentElement;
      const cur = root.dataset.theme || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      const next = cur === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem("ss-theme", next); } catch (e) {}
    });

    // Top 5: transparent ranking from real data only; composite score shown (provisional weights).
    // Rank = # screens (v2.1 + additive) → quality-gate pass → book-align → TTF/TSM mentions.
    const gateMap = new Map(((gate && gate.tickers) || []).map((t) => [t.ticker, t]));
    const addById = new Map(((additivePacks && additivePacks.packs) || []).map((p) => [p.id, p]));
    const addFor = (t) => ((additivePacks && additivePacks.packs) || []).filter((p) => (p.tickers || []).includes(t));
    const screensOf = (s) => {
      const ids = new Set(s.packIds || []);
      addFor(s.ticker).forEach((p) => ids.add(p.id));
      return Array.from(ids);
    };
    const nameOf = (id) => {
      const p = (data.packs || []).find((x) => x.id === id);
      if (p) return SHORT[p.name] || p.name;
      const a = addById.get(id);
      return a ? a.name : id;
    };
    const rankKey = (s) => {
      const g = gateMap.get(s.ticker);
      return [screensOf(s).length, g && g.status === "pass" ? 1 : 0, s.booksAlign ? 1 : 0, (s.hasTtf ? 1 : 0) + (s.hasTsm ? 1 : 0)];
    };
    const cmp = (a, b) => {
      const ka = rankKey(a), kb = rankKey(b);
      for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return kb[i] - ka[i];
      return a.ticker.localeCompare(b.ticker);
    };
    const pool = data.stocks.filter((s) => s.price != null && screensOf(s).length);
    const top = pool.slice().sort(cmp).slice(0, 5);
    const gateRun = gate && gate.sample ? fmtTime(gate.sample.gateRunAt) : null;
    const why = (s) => {
      const out = [];
      const sc = screensOf(s);
      out.push(`Passes ${sc.length} of 8 screens: ${sc.map(nameOf).join(", ")}.`);
      const g = gateMap.get(s.ticker);
      if (g) out.push(`Quality gate (${gate.sample.packName} sample, ${gateRun}): ${g.status}${g.status === "pass" ? " — EPS quality, FCF > 0 and PEG checks cleared" : ""}.`);
      if (s.booksAlign && s.books && s.books.length) {
        const ba = (window.BOOKS_ALIGN && window.BOOKS_ALIGN.books) || {};
        out.push(`Book align: ${s.books.map((b) => (ba[b.id] && ba[b.id].label) || b.id).join(", ")} framework${s.books.length > 1 ? "s" : ""} via its screens.`);
      }
      const src = (s.sources || []).map((x) => `${x.label}${x.mentionCount ? ` (${x.mentionCount} mentions)` : ""}`);
      if (src.length) out.push(`Discussed on ${src.join(", ")}.`);
      if (s.marketCap) out.push(`Market cap ${(s.marketCap / 1e9).toFixed(1)}B USD (Yahoo).`);
      return out.slice(0, 3);
    };
    const pills = (s) => {
      const p = [];
      if (s.hasTtf) p.push('<span class="ss-pill ss-pill-ttf">TTF</span>');
      if (s.hasTsm) p.push('<span class="ss-pill ss-pill-tsm">TSM</span>');
      if (s.hasTtg) p.push('<span class="ss-pill ss-pill-ttg">TTG</span>');
      if (s.booksAlign) p.push('<span class="ss-pill ss-pill-book">Books</span>');
      const g = gateMap.get(s.ticker);
      if (g) p.push(`<span class="ss-pill ss-pill-gate-${escapeAttr(g.status)}">Gate ${escapeHtml(g.status)}</span>`);
      if (addFor(s.ticker).length) p.push('<span class="ss-pill">TTF×Books</span>');
      return p.join("");
    };
    const sub = document.getElementById("top5-sub");
    if (sub) sub.textContent = `Ranked by how many of the 8 screens each stock passes, then quality gate, book alignment and channel mentions. Quotes ${fmtTime(data.updatedAt)} (Yahoo). Score = composite 0–100, provisional equal weights.`;
    const wrap = document.getElementById("top5-cards");
    if (wrap) {
      wrap.innerHTML = top.map((s, i) => `
        <article class="ss-card" data-ticker="${escapeAttr(s.ticker)}" tabindex="0" role="button" aria-label="Open ${escapeAttr(s.ticker)} chart">
          <div class="ss-card-head">
            <span class="ss-rank">${i + 1}</span>
            <div class="ss-card-id"><strong>${escapeHtml(s.ticker)}</strong><span>${escapeHtml(s.name || "")}</span></div>
            ${scoreBadge(s.ticker, true)}
          </div>
          <div class="ss-card-price"><span>${fmtPrice(s.price)}</span><span class="chg ${chgClass(s.changePct)}">${fmtPct(s.changePct)}</span></div>
          <ul class="ss-why">${why(s).map((w) => `<li>${escapeHtml(w)}</li>`).join("")}</ul>
          <div class="ss-pills">${pills(s)}</div>
        </article>`).join("");
      wrap.querySelectorAll(".ss-card").forEach((c) => {
        const go = () => openChart(c.dataset.ticker);
        c.addEventListener("click", go);
        c.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
      });
    }
  })();

  // ===== Live quotes (TradingView scanner, CORS-allowed for this origin; ~15-min delayed) + TradingView Advanced Chart =====
  const TV_SYMBOLS = window.TV_SYMBOLS || {};
  const TV_SCAN = "https://scanner.tradingview.com/america/scan";
  const CHECK_COLS = ["close", "change", "change_abs", "volume", "SMA20", "SMA50", "SMA200", "RSI", "price_earnings_growth_ttm", "debt_to_equity", "total_revenue_yoy_growth_ttm", "earnings_per_share_diluted_yoy_growth_ttm", "update_mode"];
  function tvSymbol(t) { return TV_SYMBOLS[t] || null; }
  async function tvScan(symbols, cols, timeoutMs) {
    const ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = ctl ? setTimeout(() => ctl.abort(), timeoutMs || 8000) : null;
    try {
      const res = await fetch(TV_SCAN, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" }, // simple request: no CORS preflight
        body: JSON.stringify({ symbols: { tickers: symbols }, columns: cols }),
        signal: ctl ? ctl.signal : undefined,
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const j = await res.json();
      const out = {};
      for (const row of j.data || []) { const o = {}; cols.forEach((c, i) => (o[c] = row.d[i])); out[row.s] = o; }
      return out;
    } finally { if (timer) clearTimeout(timer); }
  }
  const liveState = { ok: false, at: null, delayed: true };
  function setQuoteStamp(msg, kind) {
    const el = document.getElementById("live-quote-status");
    if (el) { el.textContent = msg; el.className = "live-quote-status" + (kind ? " is-" + kind : ""); }
  }
  async function refreshLiveQuotes() {
    const pairs = data.stocks.map((s) => [s.ticker, tvSymbol(s.ticker)]).filter((p) => p[1]);
    if (!pairs.length) { setQuoteStamp("Baked quotes as of " + fmtTime(data.updatedAt), "baked"); return; }
    try {
      const res = await tvScan(pairs.map((p) => p[1]), ["close", "change", "change_abs", "volume", "update_mode"], 10000);
      let n = 0, delayed = false;
      for (const [t, sym] of pairs) {
        const q = res[sym]; const s = byTicker.get(t);
        if (!q || !s || q.close == null) continue;
        s.price = q.close; s.changePct = q.change; s.change = q.change_abs; if (q.volume != null) s.volume = q.volume;
        s.liveQuote = true; n++;
        if (String(q.update_mode || "").indexOf("delayed") !== -1) delayed = true;
      }
      if (!n) throw new Error("no rows");
      liveState.ok = true; liveState.at = new Date(); liveState.delayed = delayed;
      render();
      document.querySelectorAll("#top5-cards .ss-card").forEach((c) => {
        const s = byTicker.get(c.dataset.ticker); const el = c.querySelector(".ss-card-price");
        if (s && el && s.liveQuote) el.innerHTML = `<span>${fmtPrice(s.price)}</span><span class="chg ${chgClass(s.changePct)}">${fmtPct(s.changePct)}</span>`;
      });
      const sub = document.getElementById("top5-sub");
      if (sub) sub.textContent = sub.textContent.replace(/Quotes .*? \(Yahoo\)\./, `Quotes live via TradingView${delayed ? " (≈15-min delayed)" : ""}; baked ${fmtTime(data.updatedAt)}.`);
      setQuoteStamp(`Live ${n}/${data.stocks.length} via TradingView${delayed ? " (≈15-min delayed)" : ""} · ${liveState.at.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} · others as of ${fmtTime(data.updatedAt)}`, "live");
    } catch (e) {
      setQuoteStamp("Live quotes unavailable — showing baked quotes as of " + fmtTime(data.updatedAt), "baked");
    }
  }

  // Pass/fail checklist (our pack rules) beside the chart, live from TradingView fundamentals/technicals
  async function renderChecklist(t) {
    const el = document.getElementById("chart-checklist");
    if (!el) return;
    const sym = tvSymbol(t);
    el.innerHTML = `<h3>Screen checklist</h3><p class="ck-note">Loading…</p>`;
    if (!sym) { el.innerHTML = `<h3>Screen checklist</h3><p class="ck-note">No TradingView symbol mapped for ${escapeHtml(t)}.</p>`; return; }
    let q;
    try { q = (await tvScan([sym], CHECK_COLS, 8000))[sym]; } catch (_) {}
    if (state.chartTicker !== t) return;
    if (!q) { el.innerHTML = `<h3>Screen checklist</h3><p class="ck-note">Checklist data unavailable right now.</p>`; return; }
    const f2 = (v, d = 2) => (v == null ? "—" : Number(v).toFixed(d));
    if (q.close != null) {
      const s0 = byTicker.get(t);
      if (s0) { s0.price = q.close; s0.changePct = q.change; s0.change = q.change_abs; }
      applyChartQuote(null, s0 || null);
    }
    const rows = [
      ["Price > SMA50", q.close != null && q.SMA50 != null ? q.close > q.SMA50 : null, `${f2(q.close)} vs ${f2(q.SMA50)}`],
      ["Price > SMA200", q.close != null && q.SMA200 != null ? q.close > q.SMA200 : null, `${f2(q.close)} vs ${f2(q.SMA200)}`],
      ["RSI(14) < 60", q.RSI != null ? q.RSI < 60 : null, f2(q.RSI, 1)],
      ["PEG < 2", q.price_earnings_growth_ttm != null ? q.price_earnings_growth_ttm > 0 && q.price_earnings_growth_ttm < 2 : null, f2(q.price_earnings_growth_ttm)],
      ["PEG ≤ 1.2 (2nd pass)", q.price_earnings_growth_ttm != null ? q.price_earnings_growth_ttm > 0 && q.price_earnings_growth_ttm <= 1.2 : null, f2(q.price_earnings_growth_ttm)],
      ["Debt/Equity < 1", q.debt_to_equity != null ? q.debt_to_equity < 1 : null, f2(q.debt_to_equity)],
      ["Revenue growth YoY > 0", q.total_revenue_yoy_growth_ttm != null ? q.total_revenue_yoy_growth_ttm > 0 : null, q.total_revenue_yoy_growth_ttm == null ? "—" : f2(q.total_revenue_yoy_growth_ttm, 1) + "%"],
      ["EPS growth YoY > 0", q.earnings_per_share_diluted_yoy_growth_ttm != null ? q.earnings_per_share_diluted_yoy_growth_ttm > 0 : null, q.earnings_per_share_diluted_yoy_growth_ttm == null ? "—" : f2(q.earnings_per_share_diluted_yoy_growth_ttm, 1) + "%"],
    ];
    const pass = rows.filter((r) => r[1] === true).length;
    el.innerHTML = `<h3>Screen checklist <span class="ck-score">${pass}/${rows.length}</span></h3><ul class="ck-list">${rows
      .map((r) => `<li class="${r[1] === true ? "is-pass" : r[1] === false ? "is-fail" : "is-na"}"><span class="ck-mark">${r[1] === true ? "✓" : r[1] === false ? "✕" : "–"}</span><span class="ck-label">${escapeHtml(r[0])}</span><span class="ck-val">${escapeHtml(r[2])}</span></li>`)
      .join("")}</ul>${factorHtml(t)}<p class="ck-note">TradingView data${String(q.update_mode || "").indexOf("delayed") !== -1 ? " (≈15-min delayed)" : ""} · research only</p>`;
  }

  // TradingView Advanced Chart widget
  const TV_RANGES = { "1D": "1D", "3D": "5D", "5D": "5D", "1M": "1M", "6M": "6M", "1Y": "12M", "5Y": "60M" };
  const TV_INTERVALS = { "1m": "1", "5m": "5", "15m": "15", "1h": "60", "1D": "D" };
  // TradingView's free embeds (embed-widget-advanced-chart.js and tv.js) reject multi-day intervals:
  // "3D"/"2D" silently fall back to 1W (tested 2026-10-15). So 3-day candles are built here from
  // baked daily OHLCV (charts/<T>_1y.json): each candle = 3 consecutive trading days.
  async function mountThreeDay(t) {
    showTvMode(false);
    const fb = document.getElementById("chart-ranges"); if (fb) fb.hidden = true;
    const tvc = document.getElementById("tv-controls"); if (tvc) tvc.hidden = false;
    document.querySelectorAll("#tv-intervals .chip").forEach((b) => b.classList.toggle("is-on", b.dataset.tvInterval === "3Dc"));
    document.querySelectorAll("#tv-ranges .chip").forEach((b) => b.classList.remove("is-on"));
    setChartStatus("Loading 3-day candles…", "loading");
    try {
      const res = await fetch(`charts/${encodeURIComponent(t)}_1y.json`, { cache: "no-cache" });
      const j = res.ok ? await res.json() : null;
      if (state.chartTicker !== t) return;
      const d = (j && j.bars) || [];
      if (!d.length) { destroyCharts(); setChartStatus("3-day candles unavailable (no baked daily data)", "error"); return; }
      const bars = [];
      for (let i = 0; i < d.length; i += 3) {
        const g = d.slice(i, i + 3);
        bars.push({ t: g[0].t, o: g[0].o, h: Math.max(...g.map((x) => x.h)), l: Math.min(...g.map((x) => x.l)), c: g[g.length - 1].c, v: g.reduce((a, x) => a + (x.v || 0), 0) });
      }
      destroyCharts();
      paintChartBars({ bars, interval: "1d" });
      const last = new Date(d[d.length - 1].t * 1000).toISOString().slice(0, 10);
      const note = document.getElementById("chart-3d-note");
      if (note) { note.hidden = false; note.textContent = `3-day candles (${bars.length} bars, each = 3 trading days) built from baked daily data through ${last}. TradingView's free embed doesn't offer multi-day intervals.`; }
    } catch (e) { destroyCharts(); setChartStatus("3-day candles unavailable", "error"); }
  }
  state.tvInterval = state.tvInterval || "1D";
  state.tvRange = state.tvRange || "6M";
  function tvTheme() {
    const t = document.documentElement.dataset.theme;
    return t ? t : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }
  function showTvMode(on) {
    const tv = document.getElementById("tv-chart");
    const tvc = document.getElementById("tv-controls");
    const fb = document.getElementById("chart-ranges");
    if (tv) tv.hidden = !on;
    if (tvc) tvc.hidden = !on;
    if (fb) fb.hidden = on;
    if (chartPriceEl) chartPriceEl.hidden = on;
    if (chartVolumeEl) chartVolumeEl.hidden = on;
  }
  function mountTvChart(t) {
    const host = document.getElementById("tv-chart");
    const sym = tvSymbol(t);
    { const n = document.getElementById("chart-3d-note"); if (n) n.hidden = true; }
    if (!host || !sym) return false;
    host.innerHTML = "";
    const wrap = document.createElement("div");
    wrap.className = "tradingview-widget-container";
    wrap.style.height = "100%"; wrap.style.width = "100%";
    const inner = document.createElement("div");
    inner.className = "tradingview-widget-container__widget";
    inner.style.height = "100%"; inner.style.width = "100%";
    wrap.appendChild(inner);
    const cfg = {
      autosize: true, symbol: sym, interval: TV_INTERVALS[state.tvInterval] || "D",
      timezone: "America/Chicago", theme: tvTheme(), style: "1", locale: "en", allow_symbol_change: false,
      hide_volume: false, hide_side_toolbar: true, withdateranges: false, save_image: false, calendar: false, support_host: "https://www.tradingview.com",
      studies: [
        { id: "MASimple@tv-basicstudies", inputs: { length: 50 } },
        { id: "MASimple@tv-basicstudies", inputs: { length: 200 } },
        { id: "RSI@tv-basicstudies", inputs: { length: 14 } },
      ],
    };
    // TradingView's embed lets "range" override "interval": send range only when the user last picked a range.
    if (state.tvPick !== "interval") cfg.range = TV_RANGES[state.tvRange] || "6M";
    const sc = document.createElement("script");
    sc.type = "text/javascript"; sc.async = true;
    sc.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    sc.text = JSON.stringify(cfg);
    let settled = false;
    const fail = () => {
      if (settled || state.chartTicker !== t) return;
      settled = true;
      showTvMode(false);
      loadChartData(t, state.chartRange || "1mo"); // static baked fallback
    };
    sc.onerror = fail;
    wrap.appendChild(sc);
    host.appendChild(wrap);
    showTvMode(true);
    // If no iframe appears in 9s, fall back to the baked chart.
    setTimeout(() => { if (!host.querySelector("iframe")) fail(); else settled = true; }, 9000);
    document.querySelectorAll("#tv-intervals .chip").forEach((b) => b.classList.toggle("is-on", state.tvPick === "interval" && b.dataset.tvInterval === state.tvInterval));
    document.querySelectorAll("#tv-ranges .chip").forEach((b) => b.classList.toggle("is-on", state.tvPick !== "interval" && b.dataset.tvRange === state.tvRange));
    return true;
  }
  // —— Company "at a glance" (profiles.js: Finviz public quote page + SEC EDGAR, cached) ——
  function profileFor(t) {
    const PROFILES = (window.PROFILES && window.PROFILES.profiles) || {};
    return PROFILES[t] || PROFILES[String(t || "").replace("-", ".")] || PROFILES[String(t || "").replace(".", "-")] || null; }
  function industryTag(t) {
    const p = profileFor(t);
    if (!p || !p.industry) return "";
    return `<span class="ind-tag" title="${escapeAttr((p.sector ? p.sector + " · " : "") + p.industry)}">${escapeHtml(p.industry)}</span>`;
  }
  function renderGlance(t) {
    const el = document.getElementById("chart-glance");
    if (!el) return;
    const p = profileFor(t);
    if (!p || !(p.sector || p.industry || p.summary)) { el.hidden = true; el.innerHTML = ""; return; }
    const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (_) { return u; } };
    const safeUrl = p.website && /^https?:\/\//i.test(p.website) ? p.website : null;
    const facts = [];
    if (p.hq) facts.push(`<span class="glance-fact"><i>HQ</i>${escapeHtml(p.hq)}</span>`);
    if (p.employees != null) facts.push(`<span class="glance-fact"><i>Employees</i>${escapeHtml(Number(p.employees).toLocaleString("en-US"))}</span>`);
    if (safeUrl) facts.push(`<span class="glance-fact"><i>Website</i><a href="${escapeAttr(safeUrl)}" target="_blank" rel="noopener nofollow">${escapeHtml(host(safeUrl))}</a></span>`);
    el.innerHTML = `<div class="glance-tags">${p.sector ? `<span class="glance-tag is-sector" title="Sector">${escapeHtml(p.sector)}</span>` : ""}${p.industry ? `<span class="glance-tag is-industry" title="Industry">${escapeHtml(p.industry)}</span>` : ""}</div>`
      + (p.summary ? `<p class="glance-summary">${escapeHtml(p.summary)}</p>` : "")
      + (facts.length ? `<div class="glance-facts">${facts.join("")}</div>` : "");
    el.hidden = false;
  }
  function openTvChart(t) {
    state.chartTicker = t;
    try { renderGlance(t); } catch (_) {}
    const boardRow = byTicker.get(t) || null;
    applyChartQuote(null, boardRow);
    renderChartMeta(boardRow);
    renderChecklist(t);
    try { if (window.__UPG) window.__UPG.detail(t); } catch (_) {}
    destroyCharts();
    setChartStatus(null);
    if (mountTvChart(t)) { showTvMode(true); return; }
    showTvMode(false);
    loadChartData(t, state.chartRange || "1mo");
  }
  document.querySelectorAll("#tv-intervals .chip").forEach((b) => b.addEventListener("click", () => {
    if (b.dataset.tvInterval === "3Dc") { if (state.chartTicker) mountThreeDay(state.chartTicker); return; }
    state.tvInterval = b.dataset.tvInterval; state.tvPick = "interval";
    // Pick a sensible range for very short intervals
    if (["1m", "5m"].includes(state.tvInterval) && !["1D", "3D", "5D"].includes(state.tvRange)) state.tvRange = "1D";
    if (state.chartTicker) mountTvChart(state.chartTicker);
  }));
  document.querySelectorAll("#tv-ranges .chip").forEach((b) => b.addEventListener("click", () => {
    state.tvRange = b.dataset.tvRange; state.tvPick = "range";
    const auto = { "1D": "5m", "3D": "15m", "5D": "15m", "1M": "1h", "6M": "1D", "1Y": "1D", "5Y": "1D" };
    state.tvInterval = auto[state.tvRange] || state.tvInterval;
    if (state.chartTicker) mountTvChart(state.chartTicker);
  }));
  window.__tvDebug = { tvSymbol, refreshLiveQuotes, liveState };

  window.__openChart = openChart;
  render();
  renderDiffs();
  setQuoteStamp("Baked quotes as of " + fmtTime(data.updatedAt) + " · fetching live…", "baked");
  refreshLiveQuotes();
  setInterval(() => { if (!document.hidden) refreshLiveQuotes(); }, 120000);
  renderGateOverview();
  if (gate) renderGate();
  if (market) renderMarket();

  if (params.get("view") === "investors") setView("investors");
  if (["packrecord", "sectors", "table"].includes(params.get("view"))) setView(params.get("view"));
  if (params.get("view") === "screens") {
    const sm = document.getElementById("screens-menu");
    const idt = document.getElementById("investor-preset-details");
    if (sm) sm.open = true;
    if (idt) idt.open = true;
    setTimeout(() => { const el = idt || sm; if (el) el.scrollIntoView({ block: "start" }); }, 50);
  }
  const deepTicker = (params.get("ticker") || "").toUpperCase();
  if (deepTicker && (byTicker.has(deepTicker) || (COMBINED && COMBINED.scores && COMBINED.scores[deepTicker]))) {
    openChart(deepTicker);
  }
})();
