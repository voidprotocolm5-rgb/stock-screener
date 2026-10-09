/* Mirror of screener quality gate + Lynch GARP sample — do not invent metrics. */
window.GATE_SUMMARY = {
  "id": "screener-quality-gate-summary",
  "version": "1.0",
  "generatedAt": "2026-09-30T18:40:00-05:00",
  "timezone": "America/Chicago",
  "disclaimer": "Research organizer only \u2014 not investment advice. Quality gate is a post-Finviz checklist; does not place trades or connect to a broker. Never invent PEG, FCF, EPS, or quotes.",
  "gate": {
    "id": "screener-quality-gate",
    "title": "Screener quality gate",
    "finvizPackBaseline": "v2.1",
    "appliesAfter": "finviz_pack_capture",
    "statuses": [
      "pass",
      "fail",
      "exception",
      "insufficient_data"
    ],
    "summaryBullets": [
      "Second pass after Finviz v2.1 pack capture \u2014 before promoting names onto the watchlist / draft-thesis path.",
      "EPS quality: drop material one-time engineering; flag uncertain bridges (do not invent a clean bill of health).",
      "FCF: require Free Cash Flow > 0, or disclose a written exception (exception \u2260 clean pass).",
      "PEG: Finviz ticker PEG \u2264 1.2 (pack second-pass) OR \u2264 1.5 \u00d7 sector group PEG; missing PEG \u2192 pegGap / insufficient_data \u2014 never invent.",
      "Hidden Gem flag is informational only (Inst Own < 40% or \u2264 5 analysts) \u2014 does not alone pass/fail."
    ],
    "criteria": [
      {
        "id": "eps_quality",
        "title": "Drop one-time EPS engineering (or flag uncertain)"
      },
      {
        "id": "fcf_positive",
        "title": "Require FCF>0 or disclose exception"
      },
      {
        "id": "peg_sector_relative",
        "title": "Sector-relative PEG check"
      },
      {
        "id": "hidden_gem_flag",
        "title": "Hidden Gem flag"
      }
    ],
    "pipelineOrder": [
      "finviz_pack_capture",
      "quality_gate",
      "watchlist_rebuild_preserve_ttf_tsm",
      "market_briefing",
      "optional_publish"
    ]
  },
  "sample": {
    "packId": "lynch-fast-grower-garp",
    "packName": "Lynch Fast Grower GARP",
    "packCapture": "2026-09-30T13:52:00-05:00",
    "gateRunAt": "2026-09-30T18:40:00-05:00",
    "finvizPackVersion": "v2.1",
    "nTickers": 30,
    "counts": {
      "pass": 21,
      "exception": 1,
      "fail": 8
    },
    "pegRule": "PASS if Finviz ticker PEG \u2264 1.2 (pack second-pass) OR \u2264 1.5 \u00d7 Finviz sector group PEG; else FAIL. If PEG missing \u2192 pegGap / insufficient_data \u2014 never invent.",
    "artifact": "finviz/2026-09-30-v21/gate-sample-lynch-fast-grower-garp.json",
    "exceptionNote": "SMCI is the sole exception (FCF exception disclosed; EPS quality concern flagged)."
  },
  "tickers": [
    {
      "ticker": "SMCI",
      "name": "Super Micro Computer, Inc.",
      "status": "exception",
      "reason": "EPS_FLAG (uncertain, not auto-drop): FY2026 NI $2.23B / diluted EPS $3.26 but OCF -$6.81B and FCF ~-$6.97B (inventory/WC). Earnings not cash-backed \u2014 quality\u2026",
      "flags": [
        "fcfException",
        "epsQualityConcern"
      ]
    },
    {
      "ticker": "ACMR",
      "name": "ACM Research, Inc.",
      "status": "fail",
      "reason": "FCF<=0: Free Cash Flow=-67980000 via yfinance cashflow[Free Cash Flow] TTM/latest col; Finviz P/FCF=-. No exception disclosed.",
      "flags": []
    },
    {
      "ticker": "ANET",
      "name": "Arista Networks, Inc.",
      "status": "fail",
      "reason": "FCF>0: latest annual Free Cash Flow=4252400000 via yfinance cashflow[Free Cash Flow] TTM/latest col.",
      "flags": []
    },
    {
      "ticker": "ATEN",
      "name": "A10 Networks, Inc.",
      "status": "fail",
      "reason": "FCF>0: latest annual Free Cash Flow=64766000 via yfinance cashflow[Free Cash Flow] TTM/latest col.",
      "flags": []
    },
    {
      "ticker": "CGAU",
      "name": "Centerra Gold Inc.",
      "status": "fail",
      "reason": "EPS_DROP: FY2025 net earnings $584.0M ($2.85/sh) vs adjusted net earnings $228.6M ($1.12/sh); key adjustments include $338.3M non-cash impairment reversals (\u2026",
      "flags": [
        "hiddenGem",
        "epsQualityConcern"
      ]
    },
    {
      "ticker": "DSGX",
      "name": "The Descartes Systems Group Inc",
      "status": "fail",
      "reason": "FCF>0: latest annual Free Cash Flow=260516000 via yfinance cashflow[Free Cash Flow] TTM/latest col.",
      "flags": []
    },
    {
      "ticker": "GRMN",
      "name": "Garmin Ltd.",
      "status": "fail",
      "reason": "FCF>0: latest annual Free Cash Flow=1362913000 via yfinance cashflow[Free Cash Flow] TTM/latest col.",
      "flags": []
    },
    {
      "ticker": "NOW",
      "name": "ServiceNow, Inc.",
      "status": "fail",
      "reason": "FCF>0: latest annual Free Cash Flow=4533000000 via yfinance cashflow[Free Cash Flow] TTM/latest col.",
      "flags": []
    },
    {
      "ticker": "SHOP",
      "name": "Shopify Inc.",
      "status": "fail",
      "reason": "FCF>0: latest annual Free Cash Flow=2007000000 via yfinance cashflow[Free Cash Flow] TTM/latest col.",
      "flags": []
    },
    {
      "ticker": "ASML",
      "name": "ASML Holding N.V. - New York Re",
      "status": "pass",
      "reason": "FCF>0: latest annual Free Cash Flow=11027300000 via yfinance cashflow[Free Cash Flow] TTM/latest col.",
      "flags": [
        "hiddenGem"
      ]
    },
    {
      "ticker": "BAP",
      "name": "Credicorp Ltd.",
      "status": "pass",
      "reason": "FCF>0: latest annual Free Cash Flow=7337520000 via yfinance cashflow[Free Cash Flow] TTM/latest col.",
      "flags": []
    },
    {
      "ticker": "CLS",
      "name": "Celestica, Inc.",
      "status": "pass",
      "reason": "FCF>0: latest annual Free Cash Flow=458300000 via yfinance cashflow[Free Cash Flow] TTM/latest col.",
      "flags": []
    },
    {
      "ticker": "DXCM",
      "name": "DexCom, Inc.",
      "status": "pass",
      "reason": "FCF>0: latest annual Free Cash Flow=1077200000 via yfinance cashflow[Free Cash Flow] TTM/latest col.",
      "flags": []
    },
    {
      "ticker": "ERO",
      "name": "Ero Copper Corp.",
      "status": "pass",
      "reason": "EPS_FLAG (uncertain, not auto-drop): FY2025 attributable NI $263.7M vs adjusted $220.4M; large FX mark-to-market in bridge but operations recovered from FY20\u2026",
      "flags": [
        "hiddenGem",
        "epsQualityConcern"
      ]
    },
    {
      "ticker": "EXEL",
      "name": "Exelixis, Inc.",
      "status": "pass",
      "reason": "FCF>0: latest annual Free Cash Flow=844339000 via yfinance cashflow[Free Cash Flow] TTM/latest col.",
      "flags": []
    },
    {
      "ticker": "FCX",
      "name": "Freeport-McMoRan, Inc.",
      "status": "pass",
      "reason": "FCF>0: latest annual Free Cash Flow=1116000000 via yfinance cashflow[Free Cash Flow] TTM/latest col.",
      "flags": []
    },
    {
      "ticker": "FIX",
      "name": "Comfort Systems USA, Inc.",
      "status": "pass",
      "reason": "FCF>0: latest annual Free Cash Flow=1031453000 via yfinance cashflow[Free Cash Flow] TTM/latest col.",
      "flags": []
    },
    {
      "ticker": "FSM",
      "name": "Fortuna Mining Corp.",
      "status": "pass",
      "reason": "FCF>0: latest annual Free Cash Flow=277362000 via yfinance cashflow[Free Cash Flow] TTM/latest col.",
      "flags": [
        "hiddenGem"
      ]
    },
    {
      "ticker": "GLBE",
      "name": "Global-E Online Ltd.",
      "status": "pass",
      "reason": "FCF>0: latest annual Free Cash Flow=280683000 via yfinance cashflow[Free Cash Flow] TTM/latest col.",
      "flags": []
    },
    {
      "ticker": "GLW",
      "name": "Corning Incorporated",
      "status": "pass",
      "reason": "FCF>0: latest annual Free Cash Flow=1413000000 via yfinance cashflow[Free Cash Flow] TTM/latest col.",
      "flags": []
    },
    {
      "ticker": "GOOG",
      "name": "Alphabet Inc.",
      "status": "pass",
      "reason": "FCF>0: latest annual Free Cash Flow=73266000000 via yfinance cashflow[Free Cash Flow] TTM/latest col.",
      "flags": [
        "hiddenGem"
      ]
    },
    {
      "ticker": "GOOGL",
      "name": "Alphabet Inc.",
      "status": "pass",
      "reason": "FCF>0: latest annual Free Cash Flow=73266000000 via yfinance cashflow[Free Cash Flow] TTM/latest col.",
      "flags": [
        "hiddenGem"
      ]
    },
    {
      "ticker": "KLAC",
      "name": "KLA Corporation",
      "status": "pass",
      "reason": "FCF>0: latest annual Free Cash Flow=3767134000 via yfinance cashflow[Free Cash Flow] TTM/latest col.",
      "flags": []
    },
    {
      "ticker": "MPWR",
      "name": "Monolithic Power Systems, Inc.",
      "status": "pass",
      "reason": "FCF>0: latest annual Free Cash Flow=663261000 via yfinance cashflow[Free Cash Flow] TTM/latest col.",
      "flags": []
    },
    {
      "ticker": "NVDA",
      "name": "NVIDIA Corporation",
      "status": "pass",
      "reason": "FCF>0: latest annual Free Cash Flow=96676000000 via yfinance cashflow[Free Cash Flow] TTM/latest col.",
      "flags": []
    },
    {
      "ticker": "PWR",
      "name": "Quanta Services, Inc.",
      "status": "pass",
      "reason": "FCF>0: latest annual Free Cash Flow=1620816000 via yfinance cashflow[Free Cash Flow] TTM/latest col.",
      "flags": []
    },
    {
      "ticker": "RGA",
      "name": "Reinsurance Group of America, I",
      "status": "pass",
      "reason": "FCF>0: latest annual Free Cash Flow=4091000000 via yfinance cashflow[Free Cash Flow] TTM/latest col.",
      "flags": []
    },
    {
      "ticker": "SKHY",
      "name": "SK hynix Inc.",
      "status": "pass",
      "reason": "EPS_FLAG (uncertain, not auto-drop): SK hynix ADR; cash-flow statement in KRW (FCF +\u20a924.8T latest annual col per Yahoo). Yahoo earnings_history shows extreme\u2026",
      "flags": [
        "hiddenGem",
        "epsQualityConcern"
      ]
    },
    {
      "ticker": "SN",
      "name": "SharkNinja, Inc.",
      "status": "pass",
      "reason": "FCF>0: latest annual Free Cash Flow=474353000 via yfinance cashflow[Free Cash Flow] TTM/latest col.",
      "flags": []
    },
    {
      "ticker": "TT",
      "name": "Trane Technologies plc",
      "status": "pass",
      "reason": "FCF>0: latest annual Free Cash Flow=2811500000 via yfinance cashflow[Free Cash Flow] TTM/latest col.",
      "flags": []
    }
  ]
};
