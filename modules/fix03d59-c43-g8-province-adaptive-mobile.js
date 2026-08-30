/* =========================================================================
   FIX-03D5.9
   C4.3 G8 PROVINCE-ADAPTIVE HOLDOUT — MOBILE V1

   PURPOSE:
   - Run existing C4.3 Province-Adaptive Holdout Research.
   - Display:
       + KEEP / SWITCH counts
       + Adaptive vs RECENT W60 holdout metrics
       + Positive province rate
       + Median / mean province quality delta
       + Switch success rate
       + Worst / best province
       + Province-by-province decisions
   - Mobile friendly.
   - Research only.

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
    'FIX03D59_C43_PROVINCE_ADAPTIVE_MOBILE_V1';


  const PANEL_ID =
    'fix03d59-c43-mobile-panel';

  const BUTTON_ID =
    'fix03d59-c43-mobile-run';

  const STATUS_ID =
    'fix03d59-c43-mobile-status';

  const OUTPUT_ID =
    'fix03d59-c43-mobile-output';


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
    ).toFixed(2) + '%';

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


  function signed(
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


  function buildProvinceLines(
    result
  ) {

    const rows =
      Array.isArray(
        result.provinceResults
      )
        ? result.provinceResults
        : [];


    const lines = [];


    rows.forEach(
      item => {

        lines.push('');

        lines.push(
          item.provinceName
        );


        lines.push(
          'Decision: ' +
          item.decision
        );


        lines.push(
          'Selected: ' +
          item.selected.model +
          ' W' +
          item.selected.window
        );


        lines.push(
          'Reference: ' +
          item.reference.model +
          ' W' +
          item.reference.window
        );


        lines.push(
          'Selection Quality Δ: ' +
          signed(
            item.selectionDelta
              .quality,
            4
          )
        );


        lines.push(
          'Holdout Quality Δ: ' +
          signed(
            item.holdoutDelta
              .quality,
            4
          )
        );


        lines.push(
          'Holdout H1 Δ: ' +
          signedPct(
            item.holdoutDelta
              .hit1
          )
        );


        lines.push(
          'Holdout H3 Δ: ' +
          signedPct(
            item.holdoutDelta
              .hit3
          )
        );


        lines.push(
          'Holdout H5 Δ: ' +
          signedPct(
            item.holdoutDelta
              .hit5
          )
        );


        lines.push(
          'Holdout H10 Δ: ' +
          signedPct(
            item.holdoutDelta
              .hit10
          )
        );


        lines.push(
          'Holdout MRR Δ: ' +
          signed(
            item.holdoutDelta
              .mrr,
            4
          )
        );


        lines.push(
          'Holdout Rank Improvement: ' +
          signed(
            item.holdoutDelta
              .averageRank,
            2
          )
        );


        lines.push(
          'Outcome: ' +
          item.holdoutOutcome
        );

      }
    );


    return lines;

  }


  function buildReport(
    result
  ) {

    if (
      !result ||
      result.ready !== true
    ) {

      return (
        'C4.3 NOT READY\n\n' +
        'Reason: ' +
        (
          result &&
          result.reason
            ? result.reason
            : 'UNKNOWN'
        )
      );

    }


    const a =
      result.adaptive;

    const r =
      result.referenceHoldout;

    const d =
      result.delta;

    const robustness =
      result.robustness;


    const lines = [];


    lines.push(
      'C4.3 G8 PROVINCE-ADAPTIVE'
    );

    lines.push(
      'TEMPORAL HOLDOUT'
    );

    lines.push(
      '========================'
    );


    lines.push(
      'Reference: ' +
      result.reference.model +
      ' W' +
      result.reference.window
    );


    lines.push(
      'Provinces: ' +
      result.provinceCount
    );


    lines.push(
      'Holdout Size: ' +
      result.holdoutSize
    );


    lines.push(
      'Method: ' +
      result.selectionMethod
    );


    lines.push('');

    lines.push(
      'CLASSIFICATION'
    );

    lines.push(
      result.classification
    );


    lines.push('');

    lines.push(
      'DECISIONS'
    );

    lines.push(
      'KEEP: ' +
      result.decisions.keep
    );

    lines.push(
      'SWITCH: ' +
      result.decisions.switch
    );


    lines.push('');

    lines.push(
      'ADAPTIVE HOLDOUT'
    );

    lines.push(
      'Tests: ' +
      a.tests
    );

    lines.push(
      'Hit@1: ' +
      pct(
        a.hit1Rate
      )
    );

    lines.push(
      'Hit@3: ' +
      pct(
        a.hit3Rate
      )
    );

    lines.push(
      'Hit@5: ' +
      pct(
        a.hit5Rate
      )
    );

    lines.push(
      'Hit@10: ' +
      pct(
        a.hit10Rate
      )
    );

    lines.push(
      'MRR: ' +
      num(
        a.mrr
      )
    );

    lines.push(
      'Avg Rank: ' +
      num(
        a.averageRank,
        2
      )
    );

    lines.push(
      'Quality: ' +
      num(
        a.quality,
        4
      )
    );


    lines.push('');

    lines.push(
      'REFERENCE RECENT W60 HOLDOUT'
    );

    lines.push(
      'Tests: ' +
      r.tests
    );

    lines.push(
      'Hit@1: ' +
      pct(
        r.hit1Rate
      )
    );

    lines.push(
      'Hit@3: ' +
      pct(
        r.hit3Rate
      )
    );

    lines.push(
      'Hit@5: ' +
      pct(
        r.hit5Rate
      )
    );

    lines.push(
      'Hit@10: ' +
      pct(
        r.hit10Rate
      )
    );

    lines.push(
      'MRR: ' +
      num(
        r.mrr
      )
    );

    lines.push(
      'Avg Rank: ' +
      num(
        r.averageRank,
        2
      )
    );

    lines.push(
      'Quality: ' +
      num(
        r.quality,
        4
      )
    );


    lines.push('');

    lines.push(
      'ADAPTIVE vs REFERENCE'
    );

    lines.push(
      'Quality Δ: ' +
      signed(
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
      signed(
        d.mrr,
        4
      )
    );

    lines.push(
      'Avg Rank Improvement: ' +
      signed(
        d.averageRank,
        2
      )
    );


    lines.push('');

    lines.push(
      'ROBUSTNESS'
    );

    lines.push(
      'Positive Provinces: ' +
      robustness
        .positiveProvinces
    );

    lines.push(
      'Negative Provinces: ' +
      robustness
        .negativeProvinces
    );

    lines.push(
      'Zero Provinces: ' +
      robustness
        .zeroProvinces
    );

    lines.push(
      'Positive Province Rate: ' +
      pct(
        robustness
          .positiveProvinceRate
      )
    );

    lines.push(
      'Median Province Quality Δ: ' +
      signed(
        robustness
          .medianProvinceQualityDelta,
        4
      )
    );

    lines.push(
      'Mean Province Quality Δ: ' +
      signed(
        robustness
          .meanProvinceQualityDelta,
        4
      )
    );


    lines.push('');

    lines.push(
      'SWITCH ROBUSTNESS'
    );

    lines.push(
      'Switch Wins: ' +
      robustness
        .switchWins
    );

    lines.push(
      'Switch Losses: ' +
      robustness
        .switchLosses
    );

    lines.push(
      'Switch Ties: ' +
      robustness
        .switchTies
    );

    lines.push(
      'Switch Success Rate: ' +
      pct(
        robustness
          .switchSuccessRate
      )
    );


    if (
      robustness.worstProvince
    ) {

      lines.push(
        'Worst Province: ' +
        robustness
          .worstProvince
          .provinceName +
        ' · Holdout Quality Δ ' +
        signed(
          robustness
            .worstProvince
            .holdoutDelta
            .quality,
          4
        )
      );

    }


    if (
      robustness.bestProvince
    ) {

      lines.push(
        'Best Province: ' +
        robustness
          .bestProvince
          .provinceName +
        ' · Holdout Quality Δ ' +
        signed(
          robustness
            .bestProvince
            .holdoutDelta
            .quality,
          4
        )
      );

    }


    lines.push('');

    lines.push(
      '========================'
    );

    lines.push(
      'PROVINCE DECISIONS'
    );


    lines.push(
      ...buildProvinceLines(
        result
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


  function runC43Mobile() {

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


    if (
      typeof window
        .runFix03D59C43ProvinceAdaptive !==
      'function'
    ) {

      if (status) {

        status.textContent =
          '❌ C4.3 Research Engine chưa sẵn sàng.';

      }

      return;

    }


    if (button) {

      button.style
        .pointerEvents =
        'none';

      button.style.opacity =
        '.55';

      button.textContent =
        '⏳ Đang chạy C4.3...';

    }


    if (status) {

      status.textContent =
        '⏳ Đang chạy selection + temporal holdout cho 21 tỉnh...';

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
              .runFix03D59C43ProvinceAdaptive();


          window
            .LAST_FIX03D59_C43_PROVINCE_ADAPTIVE_MOBILE =
            result;


          if (status) {

            status.textContent =
              result &&
              result.ready
                ? (
                    '✅ C4.3 hoàn tất · ' +
                    result
                      .provinceCount +
                    ' tỉnh.'
                  )
                : (
                    '❌ C4.3 chưa có kết quả.'
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
              '❌ C4.3 lỗi: ' +
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
              '🧬 Chạy C4.3 Province-Adaptive';

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
        'border:1px solid rgba(104,227,155,.35)',
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
        🧬 C4.3 G8 Province-Adaptive
      </div>


      <div
        style="
          opacity:.75;
          font-size:13px;
          line-height:1.55;
          margin-bottom:14px;
        "
      >
        20 configs / tỉnh
        <br>
        Early Selection → Late Holdout
        <br>
        Reference: RECENT W60
        <br>
        21 tỉnh · Read Only
      </div>


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
              #68e39b,
              #a78bfa
            );
          color:#17192f;
          font-size:16px;
          font-weight:900;
          text-align:center;
          cursor:pointer;
          user-select:none;
        "
      >
        🧬 Chạy C4.3 Province-Adaptive
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
        runC43Mobile
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
    .runFix03D59C43ProvinceAdaptiveMobile =
    runC43Mobile;


  window
    .FIX03D59_C43_PROVINCE_ADAPTIVE_MOBILE_VERSION =
    VERSION;


  window
    .FIX03D59_C43_PROVINCE_ADAPTIVE_MOBILE_LOADED =
    true;


  console.log(
    'FIX-03D5.9 C4.3 Province-Adaptive Mobile V1 loaded / READ ONLY'
  );

})();
