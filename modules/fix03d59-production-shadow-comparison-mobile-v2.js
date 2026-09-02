/* =========================================================================
   FIX-03D5.9
   PRODUCTION SHADOW COMPARISON MOBILE V2.1

   PURPOSE:
   - Run Production Shadow Comparison V2.1 from mobile.
   - Display REAL CURRENT LAST_FORECAST selected predictions.
   - Compare selected CURRENT numbers against full Shadow 00-99 ranking.
   - Display Shadow Rank for every selected CURRENT number.
   - Display membership in Shadow Top1 / Top3 / Top5 / Top10.
   - Display aggregate comparison G1 -> G8.

   IMPORTANT:
   - SHADOW COMPARISON ONLY.
   - ENGINE EXECUTION ALLOWED FOR SHADOW SIDE.
   - ZERO PRODUCTION WRITE.
   - ZERO STORAGE WRITE.
   - NO ACTIVATION.
   - NO renderForecast().
   - NO savePrediction().
   - NO LAST_FORECAST MODIFICATION.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_PRODUCTION_SHADOW_COMPARISON_MOBILE_V21';


  const PANEL_ID =
    'fix03d59-production-shadow-comparison-v2-panel';

  const BUTTON_ID =
    'fix03d59-production-shadow-comparison-v2-run';

  const STATUS_ID =
    'fix03d59-production-shadow-comparison-v2-status';

  const OUTPUT_ID =
    'fix03d59-production-shadow-comparison-v2-output';


  const PRIZES = [
    'g1',
    'g2',
    'g3',
    'g4',
    'g5',
    'g6',
    'g7',
    'g8'
  ];


  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

  function readProvince03D59() {

    const select =
      document.getElementById(
        'provinceSelect'
      );


    if (
      !select ||
      !select.value
    ) {

      return null;

    }


    return String(
      select.value
    ).trim();

  }


  function join03D59(
    values
  ) {

    return Array.isArray(values) &&
      values.length
        ? values.join(' · ')
        : '--';

  }


  function yesNo03D59(
    value
  ) {

    return value === true
      ? 'YES ✅'
      : value === false
        ? 'NO ❌'
        : '--';

  }


  /*
   * =========================================================
   * ONE PRIZE REPORT
   * =========================================================
   */

  function buildPrizeReport03D59(
    prize,
    item,
    schema
  ) {

    const lines = [];


    lines.push(
      prize.toUpperCase()
    );

    lines.push(
      '------------------------'
    );


    if (
      !item ||
      item.ready !== true
    ) {

      lines.push(
        'Status: FAILED ❌'
      );

      lines.push(
        'Reason: ' +
        (
          item &&
          item.reason
            ? item.reason
            : (
                schema &&
                schema.reason
                  ? schema.reason
                  : 'UNKNOWN'
              )
        )
      );


      if (
        schema &&
        schema.source
      ) {

        lines.push(
          'Source: ' +
          schema.source
        );

      }


      return lines;

    }


    lines.push(
      'Status: MAPPED ✅'
    );


    lines.push(
      'Current Source: ' +
      (
        item.currentSource ||
        '--'
      )
    );


    lines.push(
      'Prediction Mode: ' +
      (
        item.predictionMode ||
        '--'
      )
    );


    lines.push(
      'Shadow Config: ' +
      (
        item.shadowModel ||
        '--'
      ) +
      ' W' +
      (
        item.shadowWindow != null
          ? item.shadowWindow
          : '--'
      )
    );


    lines.push('');

    lines.push(
      'CURRENT SELECTED'
    );


    lines.push(
      'Count: ' +
      (
        item.selectedCount != null
          ? item.selectedCount
          : '--'
      )
    );


    lines.push(
      'Numbers: ' +
      join03D59(
        item.selectedNumbers
      )
    );


    lines.push('');

    lines.push(
      'SELECTED → SHADOW RANK'
    );


    const details =
      Array.isArray(
        item.selectedDetails
      )
        ? item.selectedDetails
        : [];


    if (
      !details.length
    ) {

      lines.push(
        'No selected-number rank data.'
      );

    } else {

      details.forEach(
        detail => {

          let bands = [];


          if (
            detail.inTop1
          ) {

            bands.push(
              'TOP1'
            );

          } else if (
            detail.inTop3
          ) {

            bands.push(
              'TOP3'
            );

          } else if (
            detail.inTop5
          ) {

            bands.push(
              'TOP5'
            );

          } else if (
            detail.inTop10
          ) {

            bands.push(
              'TOP10'
            );

          }


          lines.push(
            (
              detail.number ||
              '--'
            ) +
            ' → Rank #' +
            (
              detail.shadowRank != null
                ? detail.shadowRank
                : '--'
            ) +
            (
              bands.length
                ? ' · ' +
                  bands.join(', ')
                : ''
            )
          );

        }
      );

    }


    lines.push('');

    lines.push(
      'SHADOW TOP'
    );


    lines.push(
      'Top1: ' +
      join03D59(
        item.shadowTop1
      )
    );


    lines.push(
      'Top3: ' +
      join03D59(
        item.shadowTop3
      )
    );


    lines.push(
      'Top5: ' +
      join03D59(
        item.shadowTop5
      )
    );


    lines.push(
      'Top10: ' +
      join03D59(
        item.shadowTop10
      )
    );


    lines.push('');

    lines.push(
      'CURRENT SELECTED INSIDE SHADOW'
    );


    const selected =
      item.selectedInShadow ||
      {};


    const denominator =
      item.selectedCount != null
        ? item.selectedCount
        : '--';


    lines.push(
      'Top1: ' +
      (
        selected.top1Count != null
          ? selected.top1Count
          : '--'
      ) +
      '/' +
      denominator
    );


    lines.push(
      'Top3: ' +
      (
        selected.top3Count != null
          ? selected.top3Count
          : '--'
      ) +
      '/' +
      denominator
    );


    lines.push(
      'Top5: ' +
      (
        selected.top5Count != null
          ? selected.top5Count
          : '--'
      ) +
      '/' +
      denominator
    );


    lines.push(
      'Top10: ' +
      (
        selected.top10Count != null
          ? selected.top10Count
          : '--'
      ) +
      '/' +
      denominator
    );


    lines.push(
      'Same Primary Top1: ' +
      yesNo03D59(
        item.samePrimaryTop1
      )
    );


    return lines;

  }


  /*
   * =========================================================
   * COMPLETE REPORT
   * =========================================================
   */

  function buildReport03D59(
    result
  ) {

    const lines = [];


    lines.push(
      'PRODUCTION SHADOW COMPARISON V2.1'
    );

    lines.push(
      '========================'
    );


    if (!result) {

      lines.push(
        'RESULT NOT AVAILABLE ❌'
      );

      return lines.join(
        '\n'
      );

    }


    lines.push(
      'Ready: ' +
      yesNo03D59(
        result.ready
      )
    );


    lines.push(
      'Passed: ' +
      yesNo03D59(
        result.passed
      )
    );


    lines.push(
      'Reason: ' +
      (
        result.reason ||
        '--'
      )
    );


    lines.push(
      'Mode: ' +
      (
        result.mode ||
        '--'
      )
    );


    lines.push('');

    lines.push(
      'PROVINCE BINDING'
    );

    lines.push(
      '------------------------'
    );


    lines.push(
      'Requested: ' +
      (
        result.province ||
        result.requestedProvince ||
        '--'
      )
    );


    lines.push(
      'Current Forecast Province: ' +
      (
        result.currentForecastProvince ||
        '--'
      )
    );


    lines.push(
      'Province Matched: ' +
      yesNo03D59(
        result.provinceMatched
      )
    );


    lines.push('');

    lines.push(
      'CURRENT FORECAST'
    );

    lines.push(
      '------------------------'
    );


    lines.push(
      'Version: ' +
      (
        result.currentForecastVersion ||
        '--'
      )
    );


    lines.push(
      'Original Window: ' +
      (
        result.currentForecastWindow != null
          ? result.currentForecastWindow
          : '--'
      )
    );


    lines.push('');

    lines.push(
      'LAST_FORECAST'
    );

    lines.push(
      '------------------------'
    );


    lines.push(
      'Unchanged: ' +
      yesNo03D59(
        result.lastForecastUnchanged
      )
    );


    lines.push('');

    lines.push(
      'SCHEMA SUMMARY'
    );

    lines.push(
      '------------------------'
    );


    lines.push(
      'Mapped Prizes: ' +
      (
        result.mappedPrizeCount != null
          ? result.mappedPrizeCount
          : '--'
      ) +
      '/8'
    );


    lines.push(
      'Failed Prizes: ' +
      (
        result.failedPrizeCount != null
          ? result.failedPrizeCount
          : '--'
      )
    );


    if (
      Array.isArray(
        result.failedPrizes
      ) &&
      result.failedPrizes.length
    ) {

      lines.push(
        'Failed List: ' +
        result.failedPrizes
          .map(
            value =>
              String(value)
                .toUpperCase()
          )
          .join(', ')
      );

    }


    lines.push('');

    lines.push(
      'PRIZE COMPARISON'
    );

    lines.push(
      '========================'
    );


    PRIZES.forEach(
      prize => {

        lines.push('');


        const prizeLines =
          buildPrizeReport03D59(
            prize,
            result.comparisons &&
            result.comparisons[
              prize
            ],
            result.schemaDiagnostics &&
            result.schemaDiagnostics[
              prize
            ]
          );


        lines.push(
          ...prizeLines
        );

      }
    );


    /*
     * =========================================================
     * AGGREGATE
     * =========================================================
     */

    if (
      result.aggregate
    ) {

      const aggregate =
        result.aggregate;


      lines.push('');

      lines.push(
        '========================'
      );

      lines.push(
        'AGGREGATE'
      );

      lines.push(
        '------------------------'
      );


      lines.push(
        'Selected Numbers Total: ' +
        (
          aggregate.selectedNumbersTotal != null
            ? aggregate.selectedNumbersTotal
            : '--'
        )
      );


      lines.push(
        'Same Primary Top1: ' +
        (
          aggregate.samePrimaryTop1Count != null
            ? aggregate.samePrimaryTop1Count
            : '--'
        ) +
        '/8'
      );


      lines.push(
        'Selected in Shadow Top1: ' +
        (
          aggregate.selectedInShadowTop1 != null
            ? aggregate.selectedInShadowTop1
            : '--'
        )
      );


      lines.push(
        'Selected in Shadow Top3: ' +
        (
          aggregate.selectedInShadowTop3 != null
            ? aggregate.selectedInShadowTop3
            : '--'
        )
      );


      lines.push(
        'Selected in Shadow Top5: ' +
        (
          aggregate.selectedInShadowTop5 != null
            ? aggregate.selectedInShadowTop5
            : '--'
        )
      );


      lines.push(
        'Selected in Shadow Top10: ' +
        (
          aggregate.selectedInShadowTop10 != null
            ? aggregate.selectedInShadowTop10
            : '--'
        )
      );

    }


    /*
     * =========================================================
     * SAFETY
     * =========================================================
     */

    lines.push('');

    lines.push(
      '========================'
    );

    lines.push(
      'SAFETY'
    );

    lines.push(
      '------------------------'
    );


    const safety =
      result.safety ||
      {};


    lines.push(
      'Comparison Only: ' +
      yesNo03D59(
        safety.comparisonOnly
      )
    );


    lines.push(
      'Shadow Only: ' +
      yesNo03D59(
        safety.shadowOnly
      )
    );


    lines.push(
      'Activation Authorized: ' +
      (
        result.activationAuthorized === true
          ? 'YES ❌'
          : 'NO ✅'
      )
    );


    lines.push(
      'Production Write: ' +
      (
        safety.productionWrite === false
          ? 'NO ✅'
          : 'YES ❌'
      )
    );


    lines.push(
      'Storage Write: ' +
      (
        safety.storageWrite === false
          ? 'NO ✅'
          : 'YES ❌'
      )
    );


    lines.push(
      'renderForecast Called: ' +
      (
        safety.renderForecastCalled === false
          ? 'NO ✅'
          : 'YES ❌'
      )
    );


    lines.push(
      'savePrediction Called: ' +
      (
        safety.savePredictionCalled === false
          ? 'NO ✅'
          : 'YES ❌'
      )
    );


    lines.push(
      'Activation Performed: ' +
      (
        safety.activationPerformed === false
          ? 'NO ✅'
          : 'YES ❌'
      )
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

  function runMobileComparison03D59() {

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


    const province =
      readProvince03D59();


    if (!province) {

      if (status) {

        status.textContent =
          '❌ Không đọc được tỉnh đang chọn.';

      }


      return;

    }


    if (
      typeof window
        .runProductionShadowComparisonV2 !==
      'function'
    ) {

      if (status) {

        status.textContent =
          '❌ Shadow Comparison Engine chưa được load.';

      }


      return;

    }


    if (button) {

      button.style.pointerEvents =
        'none';

      button.style.opacity =
        '.55';

      button.textContent =
        '⏳ Đang so sánh...';

    }


    if (status) {

      status.textContent =
        '⏳ ' +
        province +
        ' · CURRENT selected vs FROZEN shadow ranking...';

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
              .runProductionShadowComparisonV2(
                province
              );


          window
            .LAST_FIX03D59_PRODUCTION_SHADOW_COMPARISON_MOBILE_V21 =
            {

              version:
                VERSION,

              result,

              inspectedAt:
                new Date()
                  .toISOString()

            };


          if (status) {

            if (
              result &&
              result.passed === true
            ) {

              status.textContent =
                '✅ Comparison PASS · ' +
                result.mappedPrizeCount +
                '/8 mapped.';

            } else {

              status.textContent =
                '⚠️ Comparison chưa PASS · ' +
                (
                  result &&
                  result.reason
                    ? result.reason
                    : 'UNKNOWN'
                );

            }

          }


          if (output) {

            output.textContent =
              buildReport03D59(
                result
              );

          }

        } catch (error) {

          if (status) {

            status.textContent =
              '❌ Comparison lỗi: ' +
              (
                error &&
                error.message
                  ? error.message
                  : String(error)
              );

          }


          if (output) {

            output.textContent =
              'PRODUCTION SHADOW COMPARISON ERROR\n\n' +
              (
                error &&
                error.stack
                  ? error.stack
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
              '🔍 Chạy Shadow Comparison V2.1';

          }

        }

      },
      50
    );

  }


  /*
   * =========================================================
   * PANEL
   * =========================================================
   */

  function attach03D59() {

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
        'border:1px solid rgba(167,139,250,.40)',
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
        🔍 Production Shadow Comparison V2.1
      </div>

      <div
        style="
          opacity:.75;
          font-size:13px;
          line-height:1.55;
          margin-bottom:14px;
        "
      >
        CURRENT selected numbers
        <br>
        vs
        <br>
        Freeze V2 full 00–99 ranking
        <br><br>
        G1→G8 · Selected Rank · Top1/3/5/10
        <br>
        Shadow Only · Zero Write
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
              #a78bfa,
              #67e8f9
            );
          color:#17192f;
          font-size:16px;
          font-weight:900;
          text-align:center;
          cursor:pointer;
          user-select:none;
        "
      >
        🔍 Chạy Shadow Comparison V2.1
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
        runMobileComparison03D59
      );

    }


    return true;

  }


  if (
    !attach03D59()
  ) {

    let attempts =
      0;


    const timer =
      setInterval(
        function () {

          attempts++;


          if (
            attach03D59() ||
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
    .runProductionShadowComparisonMobileV2 =
    runMobileComparison03D59;


  window
    .FIX03D59_PRODUCTION_SHADOW_COMPARISON_MOBILE_V21_VERSION =
    VERSION;


  window
    .FIX03D59_PRODUCTION_SHADOW_COMPARISON_MOBILE_V21_LOADED =
    true;


  console.log(
    'FIX-03D5.9 Production Shadow Comparison Mobile V2.1 loaded / REAL SCHEMA'
  );

})();
