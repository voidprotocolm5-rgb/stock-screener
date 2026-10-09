/* Finviz screener URLs for watchlist chips — from registry/summary; research only. */
window.PACK_SCREENER_URLS = {
  "id": "pack-screener-urls",
  "version": "1.0",
  "disclaimer": "Research organizer only — not investment advice. Links open Finviz public screeners.",
  "v21": {
    "lynch-fast-grower-garp": {
      "name": "Lynch Fast Grower GARP",
      "url": "https://finviz.com/screener.ashx?v=121&f=cap_smallover,fa_debteq_u1,fa_eps5years_o10,fa_estltgrowth_o10,fa_peg_u2,fa_roe_o10,fa_sales5years_o5,sh_avgvol_o200,ta_rsi_nob60,ta_sma200_pa,ta_sma50_pa&o=peg",
      "source": "finviz/2026-10-07/summary.json (elite→public host)"
    },
    "stalwart-quality": {
      "name": "Stalwart Quality",
      "url": "https://finviz.com/screener.ashx?v=161&f=cap_midover,fa_debteq_u1,fa_eps5years_o5,fa_opermargin_o5,fa_peg_u2,fa_roe_o10,sh_avgvol_o500,ta_rsi_nob60,ta_sma200_pa,ta_sma50_pa&o=roe",
      "source": "finviz/2026-10-07/summary.json (elite→public host)"
    },
    "micro-insider-compounders": {
      "name": "Micro Insider Compounders",
      "url": "https://finviz.com/screener.ashx?v=131&f=cap_small,fa_debteq_u1,fa_estltgrowth_o5,fa_peg_u2,sh_avgvol_o200,sh_insiderown_o10,ta_rsi_nob60,ta_sma200_pa,ta_sma50_pa",
      "source": "finviz/2026-10-07/summary.json (elite→public host)"
    },
    "mid-momentum-pullback": {
      "name": "Mid Momentum Pullback",
      "url": "https://finviz.com/screener.ashx?v=171&f=cap_midover,fa_debteq_u1,fa_eps5years_o5,fa_estltgrowth_o10,fa_peg_u2,fa_roe_o5,sh_avgvol_o500,ta_rsi_nob60,ta_sma200_pa,ta_sma50_pa&o=rsi",
      "source": "finviz/2026-10-07/summary.json (elite→public host)"
    },
    "cyclical-quality": {
      "name": "Cyclical Quality",
      "url": "https://finviz.com/screener.ashx?v=121&f=cap_midover,fa_debteq_u1,fa_evebitda_u15,fa_fpe_u20,fa_roe_o5,sh_avgvol_o500,ta_rsi_nob60,ta_sma200_pa,ta_sma50_pa&o=forwardpe",
      "source": "finviz/2026-10-07/summary.json (elite→public host)"
    },
    "hidden-gem-low-institutional": {
      "name": "Hidden Gem Low-Inst",
      "url": "https://finviz.com/screener.ashx?v=131&f=cap_smallover,fa_debteq_u1,fa_peg_u2,sh_avgvol_o200,sh_instown_u40,ta_rsi_nob60,ta_sma200_pa,ta_sma50_pa&o=instown",
      "source": "finviz/2026-10-07/summary.json (elite→public host)"
    }
  },
  "additive": {
    "ttf-books-long-compounder": {
      "name": "TTF×Books Long Compounder",
      "url": "https://finviz.com/screener.ashx?v=121&f=cap_smallover,fa_debteq_u1,fa_eps5years_o10,fa_estltgrowth_o10,fa_peg_u2,fa_pfcf_u30,fa_roe_o10,fa_sales5years_o5,sh_avgvol_o200,sh_insiderown_o10,ta_rsi_nob60,ta_sma200_pa,ta_sma50_pa&o=peg",
      "source": "finviz/additive-packs.json#public_url"
    },
    "ttf-books-fcf-compounder": {
      "name": "TTF×Books FCF Compounder",
      "url": "https://finviz.com/screener.ashx?v=121&f=cap_smallover,fa_debteq_u1,fa_eps5years_o10,fa_estltgrowth_o10,fa_peg_u2,fa_pfcf_u30,fa_roe_o10,fa_sales5years_o5,sh_avgvol_o200,ta_rsi_nob60,ta_sma200_pa,ta_sma50_pa&o=peg",
      "source": "finviz/additive-packs.json#public_url"
    }
  }
};
