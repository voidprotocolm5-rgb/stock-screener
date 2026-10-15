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
      chartMeta.innerHTML = "";
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
      if (s.booksAlign) {
        bookHtml += `<span class="book-badge book-align" title="${escapeAttr("Book align — " + s.books.map((b) => (BOOK_META[b.id] || {}).label || b.id).join(" + ") + " (Finviz-pack proxy; research only)")}">ALIGN</span>`;
        tr.classList.add("is-book-align");
      }

      if (s.hasTtf) tr.classList.add("has-ttf");
      if (s.hasTsm) tr.classList.add("has-tsm");
      if (s.hasTtg) tr.classList.add("has-ttg");

      tr.innerHTML = `
        <td class="col-ticker"><span class="ticker">${escapeHtml(s.ticker)}</span>${scoreBadge(s.ticker)}${badgeHtml ? `<span class="ticker-badges">${badgeHtml}</span>` : ""}</td>
        <td class="col-name name-cell" title="${escapeAttr(s.name || "")}">${escapeHtml(s.name || "—")}</td>
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
  function factorHtml(t) {
    const s = scoreOf(t);
    if (!s) return "";
    const names = { growth: "Growth", valuation: "PEG / valuation", quality: "ROIC / FCF quality", momentum: "Momentum", ownership: "Insider / inst." };
    return `<div class="sc-factors"><h3>Composite score <span class="ck-score">${s.score ?? "—"}/100</span></h3><p class="ck-note">Provisional equal weights (20% each) · percentile vs board${s.topTier ? " · <b>Top tier</b>" : ""}</p>${Object.entries(names)
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

  // ===== Phase 1 redesign: Screens menu, Top 5 hero, glossary, theme =====
  (function phase1() {
    const body = document.getElementById("screens-body");
    if (body) {
      ["change-chips", "source-chips", "pack-chips", "additive-pack-wrap", "screener-links-row"].forEach((id) => {
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
  function openTvChart(t) {
    state.chartTicker = t;
    const boardRow = byTicker.get(t) || null;
    applyChartQuote(null, boardRow);
    renderChartMeta(boardRow);
    renderChecklist(t);
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

  render();
  renderDiffs();
  setQuoteStamp("Baked quotes as of " + fmtTime(data.updatedAt) + " · fetching live…", "baked");
  refreshLiveQuotes();
  setInterval(() => { if (!document.hidden) refreshLiveQuotes(); }, 120000);
  renderGateOverview();
  if (gate) renderGate();
  if (market) renderMarket();

  const deepTicker = (params.get("ticker") || "").toUpperCase();
  if (deepTicker && byTicker.has(deepTicker)) {
    openChart(deepTicker);
  }
})();
