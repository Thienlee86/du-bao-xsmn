/* =========================================================================
   FIX-03D5.9
   PRODUCTION SHADOW COMPARISON MOBILE V2

   PURPOSE:
   - Run Production Shadow Comparison V2 from mobile.
   - Read selected province from #provinceSelect.
   - Compare CURRENT LAST_FORECAST vs certified Shadow Adapter.
   - Display schema mapping and overlap G1 -> G8.
   - Show current Top1 rank inside shadow ranking.
   - Fail closed on unmapped/ambiguous current forecast schema.

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
    'FIX03D59_PRODUCTION_SHADOW_COMPARISON_MOBILE_V2';


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


  function readProvince() {

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


  function joinValues(
    values
  ) {

    return Array.isArray(values) &&
      values.length
        ? values.join(' · ')
        : '--';

  }


  function buildPrizeReport(
    prize,
    item,
    schema
  ) {

    const lines = [];


    lines.push(
      prize.toUpperCase()
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
            : 'UNKNOWN'
        )
      );


      if (
        schema &&
        schema.source
      ) {

        lines.push(
          'Schema Source: ' +
          schema.source
        );

      }


      if (
        schema &&
        schema.candidates
      ) {

        lines.push(
          'Schema Candidates:'
        );


        schema.candidates
          .forEach(
            candidate => {

              lines.push(
                '- ' +
                candidate.source +
                ' · Count ' +
                candidate.count +
                ' · ' +
                joinValues(
                  candidate.preview
                )
              );

            }
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
      'Current Ranking Count: ' +
      item.currentRankingCount
    );


    lines.push(
      'Shadow Ranking Count: ' +
      item.shadowRankingCount
    );


    lines.push(
      'Current Top1: ' +
      joinValues(
        item.current.top1
      )
    );


    lines.push(
      'Shadow Top1: ' +
      joinValues(
        item.shadow.top1
      )
    );


    lines.push(
      'Same Top1: ' +
      (
        item.sameTop1
          ? 'YES ✅'
          : 'NO'
      )
    );


    lines.push(
      'Current Top1 Shadow Rank: ' +
      (
        item.currentTop1ShadowRank != null
          ? item.currentTop1ShadowRank
          : '--'
      )
    );


    lines.push(
      'Top3 Overlap: ' +
      item.overlapCount.top3 +
      '/3 · ' +
      joinValues(
        item.overlap.top3
      )
    );


    lines.push(
      'Top5 Overlap: ' +
      item.overlapCount.top5 +
      '/5 · ' +
      joinValues(
        item.overlap.top5
      )
    );


    lines.push(
      'Top10 Overlap: ' +
      item.overlapCount.top10 +
      '/10 · ' +
      joinValues(
        item.overlap.top10
      )
    );


    return lines;

  }


  function buildReport(
    result
  ) {

    const lines = [];


    lines.push(
      'PRODUCTION SHADOW COMPARISON V2'
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
      (
        result.ready
          ? 'YES ✅'
          : 'NO ❌'
      )
    );


    lines.push(
      'Passed: ' +
      (
        result.passed
          ? 'YES ✅'
          : 'NO ❌'
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
      (
        result.provinceMatched === true
          ? 'YES ✅'
          : (
              result.provinceMatched === false
                ? 'NO ❌'
                : '--'
            )
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
      (
        result.lastForecastUnchanged === true
          ? 'YES ✅'
          : (
              result.lastForecastUnchanged === false
                ? 'NO ❌'
                : '--'
            )
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
          buildPrizeReport(
            prize,
            result.comparisons &&
            result.comparisons[prize],
            result.schemaDiagnostics &&
            result.schemaDiagnostics[prize]
          );


        lines.push(
          ...prizeLines
        );

      }
    );


    if (
      result.passed === true &&
      result.aggregate
    ) {

      lines.push('');

      lines.push(
        '========================'
      );

      lines.push(
        'AGGREGATE OVERLAP'
      );

      lines.push(
        '------------------------'
      );


      lines.push(
        'Same Top1: ' +
        result.aggregate.sameTop1Count +
        '/8'
      );


      lines.push(
        'Top3 Overlap Total: ' +
        result.aggregate.top3OverlapTotal +
        '/24'
      );


      lines.push(
        'Top5 Overlap Total: ' +
        result.aggregate.top5OverlapTotal +
        '/40'
      );


      lines.push(
        'Top10 Overlap Total: ' +
        result.aggregate.top10OverlapTotal +
        '/80'
      );

    }


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
      (
        safety.comparisonOnly === true
          ? 'YES ✅'
          : 'NO ❌'
      )
    );


    lines.push(
      'Shadow Only: ' +
      (
        safety.shadowOnly === true
          ? 'YES ✅'
          : 'NO ❌'
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


  function runMobileComparison() {

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
      readProvince();


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
          '❌ Shadow Comparison V2 chưa được load.';

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
        ' · CURRENT vs FROZEN SHADOW...';

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
            .LAST_FIX03D59_PRODUCTION_SHADOW_COMPARISON_MOBILE_V2 =
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
              buildReport(
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
              '🔍 Chạy Shadow Comparison V2';

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
        🔍 Production Shadow Comparison V2
      </div>

      <div
        style="
          opacity:.75;
          font-size:13px;
          line-height:1.55;
          margin-bottom:14px;
        "
      >
        CURRENT LAST_FORECAST
        <br>
        vs
        <br>
        Freeze V2 Shadow Forecast
        <br><br>
        Schema Mapping · Top1/3/5/10 Overlap
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
        🔍 Chạy Shadow Comparison V2
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
        runMobileComparison
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
    .runProductionShadowComparisonMobileV2 =
    runMobileComparison;


  window
    .FIX03D59_PRODUCTION_SHADOW_COMPARISON_MOBILE_V2_VERSION =
    VERSION;


  window
    .FIX03D59_PRODUCTION_SHADOW_COMPARISON_MOBILE_V2_LOADED =
    true;


  console.log(
    'FIX-03D5.9 Production Shadow Comparison Mobile V2 loaded / SHADOW ONLY'
  );

})();
