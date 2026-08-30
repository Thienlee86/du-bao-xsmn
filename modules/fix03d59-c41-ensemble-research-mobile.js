/* =========================================================================
   FIX-03D5.9
   C4.1 EQUAL-RANK ENSEMBLE RESEARCH — MOBILE V1

   PURPOSE:
   - Run existing C4.1 Equal-Rank Ensemble Research from mobile.
   - Benchmark one prize at a time across all provinces.
   - Compare:
       BASELINE W30
       vs
       5-model equal-rank ensemble W30

   METRICS:
   - Hit@1
   - Hit@3
   - Hit@5
   - Hit@10
   - MRR
   - Average Rank
   - Quality
   - Province quality wins/losses/ties

   SAFETY:
   - READ ONLY.
   - ZERO PRODUCTION WRITE.
   - ZERO STORAGE WRITE.
   - NO savePrediction().
   - NO LAST_FORECAST MODIFICATION.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_C41_ENSEMBLE_RESEARCH_MOBILE_V1';


  const PANEL_ID =
    'fix03d59-c41-ensemble-mobile-panel';

  const PRIZE_ID =
    'fix03d59-c41-ensemble-prize';

  const BUTTON_ID =
    'fix03d59-c41-ensemble-run';

  const STATUS_ID =
    'fix03d59-c41-ensemble-status';

  const OUTPUT_ID =
    'fix03d59-c41-ensemble-output';


  function pct(
    value
  ) {

    const n =
      Number(value);


    if (
      !Number.isFinite(n)
    ) {

      return '--';

    }


    return (
      n * 100
    ).toFixed(2) +
    '%';

  }


  function num(
    value,
    digits = 4
  ) {

    const n =
      Number(value);


    if (
      !Number.isFinite(n)
    ) {

      return '--';

    }


    return n.toFixed(
      digits
    );

  }


  function signedPct(
    value
  ) {

    const n =
      Number(value);


    if (
      !Number.isFinite(n)
    ) {

      return '--';

    }


    return (
      n >= 0
        ? '+'
        : ''
    ) +
    (
      n * 100
    ).toFixed(2) +
    ' pp';

  }


  function signedNum(
    value,
    digits = 4
  ) {

    const n =
      Number(value);


    if (
      !Number.isFinite(n)
    ) {

      return '--';

    }


    return (
      n >= 0
        ? '+'
        : ''
    ) +
    n.toFixed(
      digits
    );

  }


  function buildReport(
    result
  ) {

    if (
      !result ||
      result.ready !== true
    ) {

      return (
        'C4.1 NOT READY\n\n' +
        'Reason: ' +
        (
          result &&
          result.reason
            ? result.reason
            : 'UNKNOWN'
        )
      );

    }


    const b =
      result.baseline;

    const e =
      result.ensemble;

    const d =
      result.delta;


    const lines = [];


    lines.push(
      'C4.1 EQUAL-RANK ENSEMBLE'
    );

    lines.push(
      'CROSS-PROVINCE BENCHMARK'
    );

    lines.push(
      '========================'
    );

    lines.push(
      'Prize: ' +
      String(
        result.prize
      ).toUpperCase()
    );

    lines.push(
      'Window: ' +
      result.windowSize
    );

    lines.push(
      'Provinces: ' +
      result.provinceCount
    );


    lines.push('');

    lines.push(
      'BASELINE W30'
    );

    lines.push(
      'Tests: ' +
      b.tests
    );

    lines.push(
      'Hit@1:  ' +
      pct(
        b.hit1Rate
      )
    );

    lines.push(
      'Hit@3:  ' +
      pct(
        b.hit3Rate
      )
    );

    lines.push(
      'Hit@5:  ' +
      pct(
        b.hit5Rate
      )
    );

    lines.push(
      'Hit@10: ' +
      pct(
        b.hit10Rate
      )
    );

    lines.push(
      'MRR: ' +
      num(
        b.mrr
      )
    );

    lines.push(
      'Avg Rank: ' +
      num(
        b.averageRank,
        2
      )
    );

    lines.push(
      'Quality: ' +
      num(
        b.quality,
        4
      )
    );


    lines.push('');

    lines.push(
      '5-MODEL EQUAL-RANK ENSEMBLE'
    );

    lines.push(
      'Tests: ' +
      e.tests
    );

    lines.push(
      'Hit@1:  ' +
      pct(
        e.hit1Rate
      )
    );

    lines.push(
      'Hit@3:  ' +
      pct(
        e.hit3Rate
      )
    );

    lines.push(
      'Hit@5:  ' +
      pct(
        e.hit5Rate
      )
    );

    lines.push(
      'Hit@10: ' +
      pct(
        e.hit10Rate
      )
    );

    lines.push(
      'MRR: ' +
      num(
        e.mrr
      )
    );

    lines.push(
      'Avg Rank: ' +
      num(
        e.averageRank,
        2
      )
    );

    lines.push(
      'Quality: ' +
      num(
        e.quality,
        4
      )
    );


    lines.push('');

    lines.push(
      'ENSEMBLE vs BASELINE'
    );

    lines.push(
      'Quality Δ: ' +
      signedNum(
        d.quality,
        4
      )
    );

    lines.push(
      'Hit@1 Δ: ' +
      signedPct(
        d.hit1
      )
    );

    lines.push(
      'Hit@3 Δ: ' +
      signedPct(
        d.hit3
      )
    );

    lines.push(
      'Hit@5 Δ: ' +
      signedPct(
        d.hit5
      )
    );

    lines.push(
      'Hit@10 Δ: ' +
      signedPct(
        d.hit10
      )
    );

    lines.push(
      'MRR Δ: ' +
      signedNum(
        d.mrr,
        4
      )
    );

    lines.push(
      'Avg Rank Improvement: ' +
      signedNum(
        d.averageRank,
        2
      )
    );


    lines.push('');

    lines.push(
      'PROVINCE QUALITY'
    );

    lines.push(
      'Wins: ' +
      result.provinceQualityWins
    );

    lines.push(
      'Losses: ' +
      result.provinceQualityLosses
    );

    lines.push(
      'Ties: ' +
      result.provinceQualityTies
    );


    const support =
      result.provinceCount
        ? (
            result
              .provinceQualityWins /
            result.provinceCount
          )
        : 0;


    lines.push(
      'Positive Rate: ' +
      pct(
        support
      )
    );


    lines.push('');

    lines.push(
      '========================'
    );

    lines.push(
      'RESEARCH ONLY'
    );

    lines.push(
      'NO PRODUCTION CHANGE'
    );

    lines.push(
      'READ ONLY / ZERO WRITE'
    );


    return lines.join(
      '\n'
    );

  }


  function runC41Mobile() {

    const prizeSelect =
      document.getElementById(
        PRIZE_ID
      );

    const button =
      document.getElementById(
        BUTTON_ID
      );

    const status =
      document.getElementById(
        STATUS_ID
      );

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    const prize =
      prizeSelect
        ? prizeSelect.value
        : 'g8';


    if (
      typeof window
        .benchmarkPrizeAllProvincesC41 !==
      'function'
    ) {

      if (status) {

        status.textContent =
          '❌ C4.1 Research Engine chưa sẵn sàng.';

      }

      return;

    }


    if (button) {

      button.style.pointerEvents =
        'none';

      button.style.opacity =
        '.55';

      button.textContent =
        '⏳ Đang chạy C4.1...';

    }


    if (status) {

      status.textContent =
        '⏳ Đang chạy 21 tỉnh · ' +
        String(prize).toUpperCase();

    }


    if (output) {

      output.textContent =
        '';

    }


    setTimeout(
      function () {

        try {

          const result =
            window
              .benchmarkPrizeAllProvincesC41(
                prize
              );


          window
            .LAST_FIX03D59_C41_ENSEMBLE_MOBILE =
            result;


          if (status) {

            status.textContent =
              result &&
              result.ready
                ? (
                    '✅ Hoàn tất ' +
                    String(
                      prize
                    ).toUpperCase() +
                    ' · ' +
                    result
                      .provinceCount +
                    ' tỉnh.'
                  )
                : (
                    '❌ C4.1 chưa có kết quả.'
                  );

          }


          if (output) {

            output.textContent =
              buildReport(
                result
              );

          }

        } catch (error) {

          if (status) {

            status.textContent =
              '❌ C4.1 lỗi: ' +
              (
                error &&
                error.message
                  ? error.message
                  : String(error)
              );

          }

        } finally {

          if (button) {

            button.style
              .pointerEvents =
              'auto';

            button.style.opacity =
              '1';

            button.textContent =
              '🧠 Chạy C4.1 Ensemble';

          }

        }

      },
      50
    );

  }


  function attach() {

    if (
      document.getElementById(
        PANEL_ID
      )
    ) {

      return true;

    }


    const settings =
      document.getElementById(
        'tab-settings'
      );


    if (!settings) {

      return false;

    }


    const panel =
      document.createElement(
        'div'
      );


    panel.id =
      PANEL_ID;


    panel.style.cssText =
      [
        'margin-top:18px',
        'padding:16px',
        'border:1px solid rgba(167,139,250,.35)',
        'border-radius:16px',
        'background:rgba(255,255,255,.05)'
      ].join(';');


    panel.innerHTML = `

      <div
        style="
          font-size:18px;
          font-weight:900;
          margin-bottom:8px;
        "
      >
        🧠 C4.1 Equal-Rank Ensemble
      </div>


      <div
        style="
          opacity:.75;
          font-size:13px;
          line-height:1.55;
          margin-bottom:14px;
        "
      >
        5 model V2.3 · Equal Rank Consensus ·
        Window 30 · 21 tỉnh ·
        Walk-Forward · Read Only
      </div>


      <label
        style="
          display:block;
          margin-bottom:7px;
          font-weight:800;
        "
      >
        Chọn giải
      </label>


      <select
        id="${PRIZE_ID}"
        style="
          width:100%;
          min-height:48px;
          padding:10px;
          margin-bottom:12px;
          border-radius:10px;
          font-size:16px;
        "
      >
        <option value="g8" selected>G8 — Giải Tám</option>
        <option value="g6">G6 — Giải Sáu</option>
        <option value="g4">G4 — Giải Tư</option>
        <option value="g3">G3 — Giải Ba</option>
        <option value="g1">G1 — Giải Nhất</option>
        <option value="g2">G2 — Giải Nhì</option>
        <option value="g5">G5 — Giải Năm</option>
        <option value="g7">G7 — Giải Bảy</option>
      </select>


      <div
        id="${BUTTON_ID}"
        role="button"
        tabindex="0"
        style="
          display:flex;
          width:100%;
          min-height:58px;
          align-items:center;
          justify-content:center;
          padding:13px;
          box-sizing:border-box;
          border-radius:14px;
          background:
            linear-gradient(
              90deg,
              #a78bfa,
              #63d9ff
            );
          color:#17192f;
          font-size:16px;
          font-weight:900;
          text-align:center;
          cursor:pointer;
          user-select:none;
        "
      >
        🧠 Chạy C4.1 Ensemble
      </div>


      <div
        id="${STATUS_ID}"
        style="
          margin-top:12px;
          font-size:13px;
          line-height:1.5;
        "
      >
        Chưa chạy.
      </div>


      <pre
        id="${OUTPUT_ID}"
        style="
          margin-top:12px;
          padding:12px;
          border-radius:11px;
          background:rgba(0,0,0,.22);
          white-space:pre-wrap;
          word-break:break-word;
          font-size:12px;
          line-height:1.55;
          overflow:auto;
        "
      ></pre>

    `;


    settings.appendChild(
      panel
    );


    const button =
      document.getElementById(
        BUTTON_ID
      );


    if (button) {

      button.addEventListener(
        'click',
        runC41Mobile
      );

    }


    return true;

  }


  if (
    !attach()
  ) {

    let attempts =
      0;


    const timer =
      setInterval(
        function () {

          attempts++;


          if (
            attach() ||
            attempts >= 20
          ) {

            clearInterval(
              timer
            );

          }

        },
        500
      );

  }


  window
    .runFix03D59C41EnsembleMobile =
    runC41Mobile;


  window
    .FIX03D59_C41_ENSEMBLE_RESEARCH_MOBILE_VERSION =
    VERSION;


  window
    .FIX03D59_C41_ENSEMBLE_RESEARCH_MOBILE_LOADED =
    true;


  console.log(
    'FIX-03D5.9 C4.1 Ensemble Research Mobile V1 loaded / READ ONLY'
  );

})();
