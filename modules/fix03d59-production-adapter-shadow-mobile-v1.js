/* =========================================================================
   FIX-03D5.9
   PRODUCTION ADAPTER SHADOW MOBILE VERIFICATION V1

   PURPOSE:
   - Run Production Forecast Adapter V1 from mobile.
   - Read province directly from #provinceSelect.
   - Verify frozen Model × Window for G1 -> G8.
   - Display TOP3 / TOP5 / TOP10.
   - Verify LAST_FORECAST is unchanged across execution.

   IMPORTANT:
   - SHADOW ONLY.
   - ENGINE EXECUTION ALLOWED.
   - ZERO PRODUCTION WRITE.
   - ZERO STORAGE WRITE.
   - NO renderForecast().
   - NO savePrediction().
   - NO LAST_FORECAST MODIFICATION.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_PRODUCTION_ADAPTER_SHADOW_MOBILE_V1';


  const PANEL_ID =
    'fix03d59-production-adapter-shadow-panel';

  const BUTTON_ID =
    'fix03d59-production-adapter-shadow-run';

  const STATUS_ID =
    'fix03d59-production-adapter-shadow-status';

  const OUTPUT_ID =
    'fix03d59-production-adapter-shadow-output';


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

  function safeClone(
    value
  ) {

    try {

      return JSON.parse(
        JSON.stringify(
          value
        )
      );

    } catch (error) {

      return null;

    }

  }


  function stableStringify(
    value
  ) {

    try {

      return JSON.stringify(
        value
      );

    } catch (error) {

      return '__UNSERIALIZABLE__';

    }

  }


  function readProvinceFromUI() {

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


  /*
   * =========================================================
   * LAST_FORECAST SNAPSHOT
   *
   * Prefer existing read-only lexical bridge if available.
   * Fallback to window.LAST_FORECAST only when exposed there.
   * =========================================================
   */

  function readLastForecastSnapshot() {

    const readers = [

      'readLastForecast03D59',

      'readProductionForecast03D59',

      'getLastForecast03D59ReadOnly',

      'readLastForecast84FLH'

    ];


    for (
      let i = 0;
      i < readers.length;
      i++
    ) {

      const name =
        readers[i];


      if (
        typeof window[name] ===
        'function'
      ) {

        try {

          return {

            available:
              true,

            source:
              name,

            value:
              safeClone(
                window[name]()
              )

          };

        } catch (error) {

          /*
           * Try next known read-only reader.
           */

        }

      }

    }


    if (
      Object.prototype
        .hasOwnProperty.call(
          window,
          'LAST_FORECAST'
        )
    ) {

      return {

        available:
          true,

        source:
          'window.LAST_FORECAST',

        value:
          safeClone(
            window.LAST_FORECAST
          )

      };

    }


    return {

      available:
        false,

      source:
        null,

      value:
        null

    };

  }


  function compareLastForecast(
    before,
    after
  ) {

    if (
      !before.available ||
      !after.available
    ) {

      return {

        verified:
          false,

        unchanged:
          null,

        reason:
          'LAST_FORECAST_SNAPSHOT_NOT_AVAILABLE'

      };

    }


    if (
      before.source !==
      after.source
    ) {

      return {

        verified:
          false,

        unchanged:
          null,

        reason:
          'LAST_FORECAST_SNAPSHOT_SOURCE_CHANGED'

      };

    }


    const unchanged =
      stableStringify(
        before.value
      ) ===
      stableStringify(
        after.value
      );


    return {

      verified:
        true,

      unchanged,

      reason:
        unchanged
          ? 'LAST_FORECAST_UNCHANGED'
          : 'LAST_FORECAST_CHANGED',

      source:
        before.source

    };

  }


  /*
   * =========================================================
   * REPORT
   * =========================================================
   */

  function buildReport(
    result,
    lastForecastCheck
  ) {

    const lines = [];


    lines.push(
      'PRODUCTION ADAPTER SHADOW V1'
    );

    lines.push(
      '========================'
    );


    if (
      !result
    ) {

      lines.push(
        'RESULT: NOT AVAILABLE ❌'
      );

      return lines.join(
        '\n'
      );

    }


    lines.push(
      'Adapter Ready: ' +
      (
        result.ready === true
          ? 'YES ✅'
          : 'NO ❌'
      )
    );

    lines.push(
      'Passed: ' +
      (
        result.passed === true
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
        'SHADOW_EXECUTION'
      )
    );


    lines.push('');

    lines.push(
      'PROVINCE'
    );

    lines.push(
      '------------------------'
    );

    lines.push(
      'Province: ' +
      (
        result.provinceName ||
        result.province ||
        '--'
      )
    );

    lines.push(
      'Slug: ' +
      (
        result.province ||
        '--'
      )
    );

    lines.push(
      'Draws: ' +
      (
        result.drawCount != null
          ? result.drawCount
          : '--'
      )
    );


    lines.push('');

    lines.push(
      'FREEZE'
    );

    lines.push(
      '------------------------'
    );

    lines.push(
      'Status: ' +
      (
        result.freezeStatus ||
        '--'
      )
    );

    lines.push(
      'Version: ' +
      (
        result.freezeVersion ||
        '--'
      )
    );


    lines.push('');

    lines.push(
      'FROZEN PRIZE EXECUTION'
    );

    lines.push(
      '------------------------'
    );


    PRIZES.forEach(
      prize => {

        const item =
          result.prizes &&
          result.prizes[
            prize
          ];


        if (
          !item
        ) {

          lines.push(
            prize.toUpperCase() +
            '  NO RESULT ❌'
          );

          return;

        }


        if (
          item.ready !== true
        ) {

          lines.push(
            prize.toUpperCase() +
            '  FAILED ❌'
          );

          lines.push(
            '  Reason: ' +
            (
              item.reason ||
              '--'
            )
          );

          return;

        }


        lines.push(
          prize.toUpperCase() +
          '  ' +
          item.model +
          '  W' +
          item.window +
          '  ✅'
        );

        lines.push(
          '  Top3: ' +
          item.top3.join(
            ' · '
          )
        );

        lines.push(
          '  Top5: ' +
          item.top5.join(
            ' · '
          )
        );

        lines.push(
          '  Top10: ' +
          item.top10.join(
            ' · '
          )
        );

      }
    );


    lines.push('');

    lines.push(
      'SUMMARY'
    );

    lines.push(
      '------------------------'
    );

    lines.push(
      'Successful Prizes: ' +
      (
        result.successfulPrizeCount != null
          ? result.successfulPrizeCount
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
            item =>
              String(item)
                .toUpperCase()
          )
          .join(
            ', '
          )
      );

    }


    lines.push('');

    lines.push(
      'LAST_FORECAST VERIFICATION'
    );

    lines.push(
      '------------------------'
    );

    lines.push(
      'Snapshot Verified: ' +
      (
        lastForecastCheck &&
        lastForecastCheck.verified
          ? 'YES ✅'
          : 'NO ⚠️'
      )
    );


    if (
      lastForecastCheck &&
      lastForecastCheck.verified
    ) {

      lines.push(
        'LAST_FORECAST Unchanged: ' +
        (
          lastForecastCheck.unchanged
            ? 'YES ✅'
            : 'NO ❌'
        )
      );

      lines.push(
        'Snapshot Source: ' +
        (
          lastForecastCheck.source ||
          '--'
        )
      );

    } else {

      lines.push(
        'LAST_FORECAST Unchanged: NOT VERIFIED ⚠️'
      );

      lines.push(
        'Reason: ' +
        (
          lastForecastCheck &&
          lastForecastCheck.reason
            ? lastForecastCheck.reason
            : '--'
        )
      );

    }


    lines.push('');

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
      'Shadow Only: ' +
      (
        safety.shadowOnly === true
          ? 'YES ✅'
          : 'NO ❌'
      )
    );

    /*
     * A successful 8/8 result proves the model
     * execution path was reached.
     */

    lines.push(
      'Engine Executed: ' +
      (
        result.passed === true
          ? 'YES ✅'
          : 'NOT FULLY VERIFIED ⚠️'
      )
    );

    lines.push(
      'Production Authorized: ' +
      (
        result.productionAuthorized === true
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


    lines.push('');

    lines.push(
      '========================'
    );

    lines.push(
      'SHADOW EXECUTION ONLY'
    );

    lines.push(
      'ZERO PRODUCTION WRITE'
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

  function runMobileVerification() {

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
      readProvinceFromUI();


    if (
      !province
    ) {

      if (status) {

        status.textContent =
          '❌ Không đọc được tỉnh đang chọn.';

      }

      return;

    }


    if (
      typeof window
        .runProductionForecastAdapterShadow03D59 !==
      'function'
    ) {

      if (status) {

        status.textContent =
          '❌ Production Adapter V1 chưa được load.';

      }

      return;

    }


    if (button) {

      button.style.pointerEvents =
        'none';

      button.style.opacity =
        '.55';

      button.textContent =
        '⏳ Đang chạy Shadow...';

    }


    if (status) {

      status.textContent =
        '⏳ ' +
        province +
        ' · G1→G8...';

    }


    if (output) {

      output.textContent =
        '';

    }


    setTimeout(
      function () {

        try {

          const before =
            readLastForecastSnapshot();


          const result =
            window
              .runProductionForecastAdapterShadow03D59(
                province
              );


          const after =
            readLastForecastSnapshot();


          const lastForecastCheck =
            compareLastForecast(
              before,
              after
            );


          /*
           * Diagnostic RAM only.
           */

          window
            .LAST_FIX03D59_PRODUCTION_ADAPTER_MOBILE_VERIFICATION =
            {
              version:
                VERSION,

              result:
                safeClone(
                  result
                ),

              lastForecastCheck:
                safeClone(
                  lastForecastCheck
                ),

              inspectedAt:
                new Date()
                  .toISOString()
            };


          if (status) {

            status.textContent =
              result &&
              result.passed === true
                ? (
                    '✅ Shadow hoàn tất · ' +
                    result.successfulPrizeCount +
                    '/8 giải.'
                  )
                : (
                    '❌ Shadow chưa PASS · ' +
                    (
                      result &&
                      result.reason
                        ? result.reason
                        : 'UNKNOWN'
                    )
                  );

          }


          if (output) {

            output.textContent =
              buildReport(
                result,
                lastForecastCheck
              );

          }

        } catch (error) {

          if (status) {

            status.textContent =
              '❌ Shadow lỗi: ' +
              (
                error &&
                error.message
                  ? error.message
                  : String(error)
              );

          }


          if (output) {

            output.textContent =
              'PRODUCTION ADAPTER SHADOW ERROR\n\n' +
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
              '🧪 Chạy Production Shadow';

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
        'border:1px solid rgba(103,232,249,.35)',
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
        🧪 Production Adapter Shadow V1
      </div>

      <div
        style="
          opacity:.75;
          font-size:13px;
          line-height:1.55;
          margin-bottom:14px;
        "
      >
        Production Config Freeze V2 → G1–G8
        <br>
        Chạy engine bằng cấu hình đã freeze
        <br>
        RAM Only · Zero Production Write
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
              #67e8f9,
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
        🧪 Chạy Production Shadow
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
        runMobileVerification
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
    .runProductionAdapterShadowMobile03D59 =
    runMobileVerification;


  window
    .FIX03D59_PRODUCTION_ADAPTER_SHADOW_MOBILE_VERSION =
    VERSION;


  window
    .FIX03D59_PRODUCTION_ADAPTER_SHADOW_MOBILE_LOADED =
    true;


  console.log(
    'FIX-03D5.9 Production Adapter Shadow Mobile V1 loaded / ZERO PRODUCTION WRITE'
  );

})();
