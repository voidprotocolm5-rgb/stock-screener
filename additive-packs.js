window.ADDITIVE_PACKS = {
  "meta": {
    "created": "2026-10-05T10:50:00-05:00",
    "timezone": "America/Chicago",
    "note": "Additive weekday packs ONLY. Never merges into improved-packs-v2.json packs[] / v2.1 six. Weekday digests should re-capture these after the six v2.1 into the day dir as named files (do not overwrite summary.json). rebuild_quotes FINVIZ_DIR stays on latest day summary.json (v2.1 six).",
    "v2_1_untouched": true,
    "compliance": "Research organizer only. Not investment advice."
  },
  "packs": [
    {
      "id": "ttf-books-long-compounder",
      "name": "TTF\u00d7Books Long Compounder",
      "accepted": true,
      "mode": "strict",
      "accepted_at": "2026-10-05T10:49:00-05:00",
      "public_url": "https://finviz.com/screener.ashx?v=121&f=cap_smallover,fa_debteq_u1,fa_eps5years_o10,fa_estltgrowth_o10,fa_peg_u2,fa_pfcf_u30,fa_roe_o10,fa_sales5years_o5,sh_avgvol_o200,sh_insiderown_o10,ta_rsi_nob60,ta_sma200_pa,ta_sma50_pa&o=peg",
      "elite_url": "https://elite.finviz.com/screener.ashx?v=121&f=cap_smallover,fa_debteq_u1,fa_eps5years_o10,fa_estltgrowth_o10,fa_peg_u2,fa_pfcf_u30,fa_roe_o10,fa_sales5years_o5,sh_avgvol_o200,sh_insiderown_o10,ta_rsi_nob60,ta_sma200_pa,ta_sma50_pa&o=peg",
      "capture_dir": "finviz/2026-10-13/",
      "files": [
        "ttf-books-long-compounder.md",
        "ttf-books-long-compounder.json",
        "ttf-books-long-compounder-summary.json"
      ],
      "tickers_at_ship": [
        "SBLK",
        "PLGO",
        "GLBE",
        "DLO"
      ],
      "count_at_ship": 4,
      "filter_highlight": "keeps sh_insiderown_o10 + fa_pfcf_u30",
      "last_capture_count": 2,
      "last_captured_at": "2026-10-13T09:10:13-05:00"
    },
    {
      "id": "ttf-books-fcf-compounder",
      "name": "TTF\u00d7Books FCF Compounder",
      "accepted": true,
      "mode": "fcf_no_insider",
      "accepted_at": "2026-10-05T10:50:00-05:00",
      "public_url": "https://finviz.com/screener.ashx?v=121&f=cap_smallover,fa_debteq_u1,fa_eps5years_o10,fa_estltgrowth_o10,fa_peg_u2,fa_pfcf_u30,fa_roe_o10,fa_sales5years_o5,sh_avgvol_o200,ta_rsi_nob60,ta_sma200_pa,ta_sma50_pa&o=peg",
      "elite_url": "https://elite.finviz.com/screener.ashx?v=121&f=cap_smallover,fa_debteq_u1,fa_eps5years_o10,fa_estltgrowth_o10,fa_peg_u2,fa_pfcf_u30,fa_roe_o10,fa_sales5years_o5,sh_avgvol_o200,ta_rsi_nob60,ta_sma200_pa,ta_sma50_pa&o=peg",
      "capture_dir": "finviz/2026-10-13/",
      "files": [
        "ttf-books-fcf-compounder.md",
        "ttf-books-fcf-compounder.json",
        "ttf-books-fcf-compounder-summary.json"
      ],
      "tickers_at_ship": [
        "SKHY",
        "SBLK",
        "MU",
        "FSM",
        "PLGO",
        "ERO",
        "SSRM",
        "GLBE",
        "DLO",
        "RGA",
        "EXEL",
        "FIX",
        "EXLS",
        "ECG",
        "EME",
        "WAB",
        "DSGX",
        "LECO"
      ],
      "count_at_ship": 18,
      "filter_highlight": "drops sh_insiderown_o10; keeps fa_pfcf_u30",
      "sibling": "ttf-books-long-compounder",
      "last_capture_count": 7,
      "last_captured_at": "2026-10-13T09:10:13-05:00"
    }
  ]
};
