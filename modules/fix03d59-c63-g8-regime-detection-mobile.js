/* =========================================================================
   FIX-03D5.9
   C6.3 G8 REGIME DETECTION — MOBILE V1

   PURPOSE:
   - Run existing C6.3 Regime Detection Research.
   - Display:
       + Reference RECENT W60
       + Regime distribution
       + Performance by regime
       + Regime separation
       + Province robustness
       + Feature diagnostics
       + Final classification
   - Mobile friendly.

   SAFETY:
   - RESEARCH ONLY.
   - READ ONLY.
   - ZERO PRODUCTION WRITE.
   - ZERO STORAGE WRITE.
   - NO savePrediction().
   - NO LAST_FORECAST MODIFICATION.
   - NO MODEL SWITCHING.
   - NO RANKING MODIFICATION.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_C63_REGIME_DETECTION_MOBILE_V1';


  const PANEL_ID =
    'fix03d59-c63-mobile-panel';

  const BUTTON_ID =
    'fix03d59-c63-mobile-run';

  const STATUS_ID =
    'fix03d59-c63-mobile-status';

  const OUTPUT_ID =
    'fix03d59-c63-mobile-output';


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


  function regimeLabel(
    regime
  ) {

    const labels = {

      STABLE:
        'STABLE',

      CONCENTRATED:
        'CONCENTRATED',

      VOLATILE:
        'VOLATILE',

      SHIFTING:
        'SHIFTING'

    };


    return (
      labels[
        regime
      ] ||
      regime
    );

  }


  function buildRegimeLines(
    result
  ) {

    const lines = [];


    [
      'STABLE',
      'CONCENTRATED',
      'VOLATILE',
      'SHIFTING'
    ]
      .forEach(
        regime => {

          const metric =
            result.regimes[
              regime
            ];


          if (!metric) {

            return;

          }


          lines.push('');

          lines.push(
            regimeLabel(
              regime
            )
          );


          lines.push(
            'Tests: ' +
            metric.tests
          );


          lines.push(
            'Hit@1: ' +
            pct(
              metric.hit1Rate
            )
          );


          lines.push(
            'Hit@3: ' +
            pct(
              metric.hit3Rate
            )
          );


          lines.push(
            'Hit@5: ' +
            pct(
              metric.hit5Rate
            )
          );


          lines.push(
            'Hit@10: ' +
            pct(
              metric.hit10Rate
            )
          );


          lines.push(
            'MRR: ' +
            num(
              metric.mrr
            )
          );


          lines.push(
            'Avg Rank: ' +
            num(
              metric.averageRank,
              2
            )
          );


          lines.push(
            'Quality: ' +
            num(
              metric.quality
            )
          );

        }
      );


    return lines;

  }


  function buildFeatureSummaryLines(
    result
  ) {

    const lines = [];


    const labels = {

      entropy:
        'Entropy',

      concentration:
        'Concentration',

      divergence:
        'Short/Long Divergence',

      volatility:
        'Rank Volatility',

      hotColdSpread:
        'Hot/Cold Spread'

    };


    Object.keys(
      labels
    )
      .forEach(
        feature => {

          const item =
            result.featureSummary[
              feature
            ];


          if (!item) {

            return;

          }


          lines.push('');

          lines.push(
            labels[
              feature
            ]
          );


          lines.push(
            'Mean: ' +
            num(
              item.mean
            )
          );


          lines.push(
            'Median: ' +
            num(
              item.median
            )
          );


          lines.push(
            'Std: ' +
            num(
              item.std
            )
          );


          lines.push(
            'Min: ' +
            num(
              item.min
            )
          );


          lines.push(
            'Max: ' +
            num(
              item.max
            )
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
        'C6.3 NOT READY\n\n' +
        'Reason: ' +
        (
          result &&
          result.reason
            ? result.reason
            : 'UNKNOWN'
        )
      );

    }


    const lines = [];


    lines.push(
      'C6.3 G8 REGIME DETECTION'
    );

    lines.push(
      'TEMPORAL HOLDOUT'
    );

    lines.push(
      '========================'
    );


    lines.push(
      'Reference: ' +
      result.referenceModel +
      ' W' +
      result.referenceWindow
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
      'Tests: ' +
      result.reference.tests
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
      'REFERENCE — RECENT W60'
    );


    lines.push(
      'Hit@1: ' +
      pct(
        result.reference.hit1Rate
      )
    );


    lines.push(
      'Hit@3: ' +
      pct(
        result.reference.hit3Rate
      )
    );


    lines.push(
      'Hit@5: ' +
      pct(
        result.reference.hit5Rate
      )
    );


    lines.push(
      'Hit@10: ' +
      pct(
        result.reference.hit10Rate
      )
    );


    lines.push(
      'MRR: ' +
      num(
        result.reference.mrr
      )
    );


    lines.push(
      'Avg Rank: ' +
      num(
        result.reference.averageRank,
        2
      )
    );


    lines.push(
      'Quality: ' +
      num(
        result.reference.quality
      )
    );


    lines.push('');

    lines.push(
      '========================'
    );

    lines.push(
      'REGIME DISTRIBUTION'
    );


    [
      'STABLE',
      'CONCENTRATED',
      'VOLATILE',
      'SHIFTING'
    ]
      .forEach(
        regime => {

          const count =
            Number(
              result
                .regimeDistribution[
                  regime
                ]
            ) || 0;


          const rate =
            result.reference.tests
              ? (
                  count /
                  result.reference.tests
                )
              : 0;


          lines.push(
            regime +
            ': ' +
            count +
            ' · ' +
            pct(
              rate
            )
          );

        }
      );


    lines.push('');

    lines.push(
      'Eligible Regimes: ' +
      result.eligibleRegimeCount
    );


    lines.push(
      'Minimum Global Sample: ' +
      result.minimumGlobalSample
    );


    lines.push('');

    lines.push(
      '========================'
    );

    lines.push(
      'PERFORMANCE BY REGIME'
    );


    lines.push(
      ...buildRegimeLines(
        result
      )
    );


    lines.push('');

    lines.push(
      '========================'
    );

    lines.push(
      'REGIME SEPARATION'
    );


    lines.push(
      'Best Regime: ' +
      (
        result.bestRegime ||
        '--'
      )
    );


    lines.push(
      'Worst Regime: ' +
      (
        result.worstRegime ||
        '--'
      )
    );


    lines.push(
      'Quality Spread: ' +
      signed(
        result.qualitySpread
      )
    );


    lines.push(
      'Hit@1 Spread: ' +
      signedPct(
        result.hit1Spread
      )
    );


    lines.push(
      'MRR Spread: ' +
      signed(
        result.mrrSpread
      )
    );


    lines.push('');

    lines.push(
      '========================'
    );

    lines.push(
      'PROVINCE ROBUSTNESS'
    );


    lines.push(
      'Positive Provinces: ' +
      result.robustness
        .positiveProvinces
    );


    lines.push(
      'Weak Positive Provinces: ' +
      result.robustness
        .weakPositiveProvinces
    );


    lines.push(
      'Zero Provinces: ' +
      result.robustness
        .zeroProvinces
    );


    lines.push(
      'Positive Province Rate: ' +
      pct(
        result.robustness
          .positiveProvinceRate
      )
    );


    lines.push(
      'Mean Separation: ' +
      signed(
        result.robustness
          .meanSeparation
      )
    );


    lines.push(
      'Median Separation: ' +
      signed(
        result.robustness
          .medianSeparation
      )
    );


    lines.push('');

    lines.push(
      '========================'
    );

    lines.push(
      'FEATURE DIAGNOSTICS'
    );


    lines.push(
      ...buildFeatureSummaryLines(
        result
      )
    );


    lines.push('');

    lines.push(
      '========================'
    );

    lines.push(
      'NEXT STEP ALLOWED'
    );


    lines.push(
      result.nextStepAllowed
        ? 'YES ✅'
        : 'NO ❌'
    );


    lines.push('');

    lines.push(
      'RESEARCH ONLY'
    );

    lines.push(
      'NO MODEL SWITCHING'
    );

    lines.push(
      'NO RANKING MODIFICATION'
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


  function runC63Mobile() {

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
        .runFix03D59C63RegimeDetection !==
      'function'
    ) {

      if (status) {

        status.textContent =
          '❌ C6.3 Research Engine chưa sẵn sàng.';

      }

      return;

    }


    if (button) {

      button.style.pointerEvents =
        'none';

      button.style.opacity =
        '.55';

      button.textContent =
        '⏳ Đang chạy C6.3...';

    }


    if (status) {

      status.textContent =
        '⏳ G8 · 5 regime features · 21 tỉnh · 630 holdout tests...';

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
              .runFix03D59C63RegimeDetection();


          window
            .LAST_FIX03D59_C63_REGIME_DETECTION_MOBILE =
            result;


          if (status) {

            status.textContent =
              result &&
              result.ready
                ? (
                    '✅ C6.3 hoàn tất · ' +
                    result.provinceCount +
                    ' tỉnh · ' +
                    result.reference.tests +
                    ' tests.'
                  )
                : (
                    '❌ C6.3 chưa có kết quả.'
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
              '❌ C6.3 lỗi: ' +
              (
                error &&
                error.message
                  ? error.message
                  : String(error)
              );

          }

        } finally {

          if (button) {

            button.style.pointerEvents =
              'auto';

            button.style.opacity =
              '1';

            button.textContent =
              '🌡️ Chạy C6.3 Regime Detection';

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
        'border:1px solid rgba(255,189,60,.35)',
        'border-radius:16px',
        'background:rgba(255,255,255,.05)'
      ].join(
        ';'
      );


    panel.innerHTML = `

      <div
        style="
          font-size:18px;
          font-weight:900;
          margin-bottom:8px;
        "
      >
        🌡️ C6.3 G8 Regime Detection
      </div>


      <div
        style="
          opacity:.75;
          font-size:13px;
          line-height:1.55;
          margin-bottom:14px;
        "
      >
        RECENT W60 performance by regime
        <br>
        Entropy · Concentration
        <br>
        Divergence · Volatility · Hot/Cold Spread
        <br>
        21 tỉnh · Late Holdout
        <br>
        No Ranking Change · Read Only
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
              #ffbd3c,
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
        🌡️ Chạy C6.3 Regime Detection
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
        runC63Mobile
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
    .runFix03D59C63RegimeDetectionMobile =
    runC63Mobile;


  window
    .FIX03D59_C63_REGIME_DETECTION_MOBILE_VERSION =
    VERSION;


  window
    .FIX03D59_C63_REGIME_DETECTION_MOBILE_LOADED =
    true;


  console.log(
    'FIX-03D5.9 C6.3 Regime Detection Mobile V1 loaded / READ ONLY'
  );

})();
