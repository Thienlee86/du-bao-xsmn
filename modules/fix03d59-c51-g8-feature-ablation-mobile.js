/* =========================================================================
   FIX-03D5.9
   C5.1 G8 FEATURE ABLATION — MOBILE V1

   PURPOSE:
   - Run existing C5.1 Feature Ablation Research.
   - Display reference RECENT W60 metrics.
   - Display all feature ablation results.
   - Show classification, province robustness,
     mean / median delta, best / worst province.
   - Mobile friendly.

   SAFETY:
   - RESEARCH ONLY.
   - READ ONLY.
   - ZERO PRODUCTION WRITE.
   - ZERO STORAGE WRITE.
   - NO savePrediction().
   - NO LAST_FORECAST MODIFICATION.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_C51_FEATURE_ABLATION_MOBILE_V1';


  const PANEL_ID =
    'fix03d59-c51-mobile-panel';

  const BUTTON_ID =
    'fix03d59-c51-mobile-run';

  const STATUS_ID =
    'fix03d59-c51-mobile-status';

  const OUTPUT_ID =
    'fix03d59-c51-mobile-output';


  /*
   * =========================================================
   * FORMATTERS
   * =========================================================
   */

  function pct(
    value
  ) {

    const n =
      Number(
        value
      );


    if (
      !Number.isFinite(
        n
      )
    ) {

      return '--';

    }


    return (
      n * 100
    ).toFixed(
      2
    ) + '%';

  }


  function signedPct(
    value
  ) {

    const n =
      Number(
        value
      );


    if (
      !Number.isFinite(
        n
      )
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
    ).toFixed(
      2
    ) +
    ' pp';

  }


  function num(
    value,
    digits = 4
  ) {

    const n =
      Number(
        value
      );


    if (
      !Number.isFinite(
        n
      )
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
      Number(
        value
      );


    if (
      !Number.isFinite(
        n
      )
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


  /*
   * =========================================================
   * HUMAN LABELS
   * =========================================================
   */

  function featureLabel(
    feature
  ) {

    const labels = {

      frequency:
        'Frequency',

      recent:
        'Recent',

      momentum:
        'Momentum',

      gan:
        'Gan',

      cycle:
        'Cycle',

      headTail:
        'HeadTail',

      stability:
        'Stability'

    };


    return (
      labels[
        feature
      ] ||
      feature
    );

  }


  function classificationLabel(
    value
  ) {

    const labels = {

      IMPORTANT:
        '🟢 IMPORTANT',

      USEFUL:
        '🟢 USEFUL',

      MIXED:
        '🟡 MIXED',

      REDUNDANT_OR_NOISY:
        '🟠 REDUNDANT / NOISY',

      POSSIBLY_HARMFUL:
        '🔴 POSSIBLY HARMFUL'

    };


    return (
      labels[
        value
      ] ||
      value
    );

  }


  /*
   * =========================================================
   * REPORT
   * =========================================================
   */

  function buildReport(
    result
  ) {

    if (
      !result ||
      result.ready !== true
    ) {

      return (
        'C5.1 NOT READY\n\n' +
        'Reason: ' +
        (
          result &&
          result.reason
            ? result.reason
            : 'UNKNOWN'
        )
      );

    }


    const reference =
      result.reference;


    const lines = [];


    lines.push(
      'C5.1 G8 FEATURE ABLATION'
    );

    lines.push(
      'TEMPORAL HOLDOUT'
    );

    lines.push(
      '========================'
    );


    lines.push(
      'Model: ' +
      result.model
    );


    lines.push(
      'Window: ' +
      result.windowSize
    );


    lines.push(
      'Provinces: ' +
      result.provinceCount
    );


    lines.push(
      'Holdout Size: ' +
      result.holdoutSize
    );


    lines.push('');

    lines.push(
      'REFERENCE — ALL FEATURES'
    );


    lines.push(
      'Tests: ' +
      reference.tests
    );


    lines.push(
      'Hit@1: ' +
      pct(
        reference.hit1Rate
      )
    );


    lines.push(
      'Hit@3: ' +
      pct(
        reference.hit3Rate
      )
    );


    lines.push(
      'Hit@5: ' +
      pct(
        reference.hit5Rate
      )
    );


    lines.push(
      'Hit@10: ' +
      pct(
        reference.hit10Rate
      )
    );


    lines.push(
      'MRR: ' +
      num(
        reference.mrr
      )
    );


    lines.push(
      'Avg Rank: ' +
      num(
        reference.averageRank,
        2
      )
    );


    lines.push(
      'Quality: ' +
      num(
        reference.quality,
        4
      )
    );


    lines.push('');

    lines.push(
      '========================'
    );

    lines.push(
      'FEATURE IMPORTANCE'
    );


    result.features
      .forEach(
        (
          item,
          index
        ) => {

          lines.push('');

          lines.push(
            '#' +
            (index + 1) +
            ' REMOVE ' +
            featureLabel(
              item.feature
            )
          );


          lines.push(
            'Classification: ' +
            classificationLabel(
              item.classification
            )
          );


          lines.push(
            'Quality Δ: ' +
            signed(
              item.delta
                .quality,
              4
            )
          );


          lines.push(
            'Hit@1 Δ: ' +
            signedPct(
              item.delta
                .hit1
            )
          );


          lines.push(
            'Hit@3 Δ: ' +
            signedPct(
              item.delta
                .hit3
            )
          );


          lines.push(
            'Hit@5 Δ: ' +
            signedPct(
              item.delta
                .hit5
            )
          );


          lines.push(
            'Hit@10 Δ: ' +
            signedPct(
              item.delta
                .hit10
            )
          );


          lines.push(
            'MRR Δ: ' +
            signed(
              item.delta
                .mrr,
              4
            )
          );


          lines.push(
            'Avg Rank Improvement: ' +
            signed(
              item.delta
                .averageRank,
              2
            )
          );


          lines.push(
            'Province Win / Loss / Tie: ' +
            item.provinceWins +
            ' / ' +
            item.provinceLosses +
            ' / ' +
            item.provinceTies
          );


          lines.push(
            'Province Win Rate: ' +
            pct(
              item.provinceWinRate
            )
          );


          lines.push(
            'Province Loss Rate: ' +
            pct(
              item.provinceLossRate
            )
          );


          lines.push(
            'Mean Province Quality Δ: ' +
            signed(
              item
                .meanProvinceQualityDelta,
              4
            )
          );


          lines.push(
            'Median Province Quality Δ: ' +
            signed(
              item
                .medianProvinceQualityDelta,
              4
            )
          );


          if (
            item.worstProvince
          ) {

            lines.push(
              'Worst Province: ' +
              item
                .worstProvince
                .provinceName +
              ' · Δ ' +
              signed(
                item
                  .worstProvince
                  .delta,
                4
              )
            );

          }


          if (
            item.bestProvince
          ) {

            lines.push(
              'Best Province: ' +
              item
                .bestProvince
                .provinceName +
              ' · Δ ' +
              signed(
                item
                  .bestProvince
                  .delta,
                4
              )
            );

          }

        }
      );


    lines.push('');

    lines.push(
      '========================'
    );

    lines.push(
      'INTERPRETATION'
    );


    lines.push(
      'Negative Δ = removing feature hurts'
    );


    lines.push(
      'Positive Δ = removing feature helps'
    );


    lines.push('');

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


  /*
   * =========================================================
   * RUN
   * =========================================================
   */

  function runC51Mobile() {

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
        .runFix03D59C51FeatureAblation !==
      'function'
    ) {

      if (status) {

        status.textContent =
          '❌ C5.1 Research Engine chưa sẵn sàng.';

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
        '⏳ Đang chạy C5.1...';

    }


    if (status) {

      status.textContent =
        '⏳ G8 RECENT W60 · 7 feature · 21 tỉnh · holdout...';

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
              .runFix03D59C51FeatureAblation();


          window
            .LAST_FIX03D59_C51_FEATURE_ABLATION_MOBILE =
            result;


          if (status) {

            status.textContent =
              result &&
              result.ready
                ? (
                    '✅ C5.1 hoàn tất · ' +
                    result
                      .provinceCount +
                    ' tỉnh · 7 feature.'
                  )
                : (
                    '❌ C5.1 chưa có kết quả.'
                  );

          }


          if (output) {

            output.textContent =
              buildReport(
                result
              );

          }

        } catch (
          error
        ) {

          if (status) {

            status.textContent =
              '❌ C5.1 lỗi: ' +
              (
                error &&
                error.message
                  ? error.message
                  : String(
                      error
                    )
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
              '🧪 Chạy C5.1 Feature Ablation';

          }

        }

      },
      50
    );

  }


  /*
   * =========================================================
   * MOBILE PANEL
   * =========================================================
   */

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
        'border:1px solid rgba(255,99,132,.35)',
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
        🧪 C5.1 G8 Feature Ablation
      </div>


      <div
        style="
          opacity:.75;
          font-size:13px;
          line-height:1.55;
          margin-bottom:14px;
        "
      >
        RECENT W60
        <br>
        Remove 1 feature at a time
        <br>
        7 feature · 21 tỉnh
        <br>
        Late Temporal Holdout
        <br>
        Research Only · Read Only
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
              #ff6384,
              #ffbd3c
            );
          color:#17192f;
          font-size:16px;
          font-weight:900;
          text-align:center;
          cursor:pointer;
          user-select:none;
        "
      >
        🧪 Chạy C5.1 Feature Ablation
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
        runC51Mobile
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


  /*
   * =========================================================
   * PUBLIC API
   * =========================================================
   */

  window
    .runFix03D59C51FeatureAblationMobile =
    runC51Mobile;


  window
    .FIX03D59_C51_FEATURE_ABLATION_MOBILE_VERSION =
    VERSION;


  window
    .FIX03D59_C51_FEATURE_ABLATION_MOBILE_LOADED =
    true;


  console.log(
    'FIX-03D5.9 C5.1 Feature Ablation Mobile V1 loaded / READ ONLY'
  );

})();
