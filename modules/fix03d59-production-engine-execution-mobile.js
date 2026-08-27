/* =========================================================================
   FIX-03D5.9
   PRODUCTION BRIDGE — STEP 3.4B
   ISOLATED EXECUTION VERIFICATION MOBILE V1

   PURPOSE:
   - Execute STEP 3.4B isolated engine from mobile.
   - Verify route, forecast result and safety contract.
   - Confirm LAST_FORECAST is not modified.
   - Confirm no production/storage promotion.

   IMPORTANT:
   - ENGINE EXECUTION IS ALLOWED.
   - RESULT MUST REMAIN ISOLATED.
   - NO savePrediction().
   - NO production promotion.
   - NO storage write.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'PRODUCTION-ENGINE-EXECUTION-MOBILE-V1';


  const PANEL_ID =
    'fix03d59-engine-execution-mobile-panel';


  const OUTPUT_ID =
    'fix03d59-engine-execution-mobile-output';


  function esc(value) {

    return String(
      value === null ||
      value === undefined ||
      value === ''
        ? '--'
        : value
    )
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  }


  function yesNo(value) {

    return value
      ? 'YES ✅'
      : 'NO ❌';

  }


  function row(
    label,
    value
  ) {

    return `
      <div
        style="
          display:flex;
          justify-content:space-between;
          gap:14px;
          padding:9px 0;
          border-bottom:
            1px solid rgba(255,255,255,.08);
        "
      >
        <span
          style="
            color:rgba(255,255,255,.65);
            font-size:13px;
            flex:0 0 47%;
          "
        >
          ${esc(label)}
        </span>

        <b
          style="
            color:#fff;
            text-align:right;
            font-size:13px;
            word-break:break-word;
            flex:1;
          "
        >
          ${value}
        </b>
      </div>
    `;

  }


  function sectionTitle(
    text,
    color
  ) {

    return `
      <div
        style="
          margin-top:20px;
          margin-bottom:6px;
          color:${color || '#ffc13d'};
          font-size:16px;
          font-weight:900;
        "
      >
        ${esc(text)}
      </div>
    `;

  }


  function stableSnapshot(value) {

    try {

      return JSON.stringify(value);

    } catch (error) {

      return '__UNSERIALIZABLE__';

    }

  }


  function countForecastItems(
    forecast
  ) {

    if (
      !forecast ||
      typeof forecast !==
        'object'
    ) {

      return 0;

    }


    if (
      Array.isArray(
        forecast.items
      )
    ) {

      return forecast.items.length;

    }


    return 0;

  }

  function readLastForecastSnapshotTarget() {

  try {

    if (
      typeof LAST_FORECAST !==
        'undefined'
    ) {

      return LAST_FORECAST;

    }

  } catch (error) {

    /*
     * Continue to window fallback.
     */

  }


  if (
    typeof window.LAST_FORECAST !==
      'undefined'
  ) {

    return window.LAST_FORECAST;

  }


  return undefined;

  }

  function runExecutionVerification() {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {
      return;
    }


    const executor =
      window
        .executeProductionEngine03D59;


    if (
      typeof executor !==
      'function'
    ) {

      output.innerHTML =
        sectionTitle(
          'VERDICT',
          '#ff7185'
        ) +
        row(
          'STEP 3.4B EXECUTION',
          'EXECUTOR NOT AVAILABLE ❌'
        );

      return;

    }


    const province =
      window.SELECTED_PROVINCE ||
      (
        typeof SELECTED_PROVINCE !==
        'undefined'
          ? SELECTED_PROVINCE
          : ''
      );


    const selectedWindow =
      window.SELECTED_WINDOW ||
      (
        typeof SELECTED_WINDOW !==
        'undefined'
          ? SELECTED_WINDOW
          : 30
      ) ||
      30;


    const beforeLastForecast =
  readLastForecastSnapshotTarget();


    const beforeSnapshot =
      stableSnapshot(
        beforeLastForecast
      );


    let result;


    try {

      result =
        executor(
          province,
          selectedWindow
        );

    } catch (error) {

      result = {

        ready:
          false,

        passed:
          false,

        reason:
          'EXECUTOR_THROW',

        error:
          error &&
          error.message
            ? error.message
            : String(error)

      };

    }


    const afterLastForecast =
  readLastForecastSnapshotTarget();


    const afterSnapshot =
      stableSnapshot(
        afterLastForecast
      );


    const lastForecastUnchanged =
      beforeSnapshot ===
      afterSnapshot;


    const isolatedResult =
      Boolean(
        result &&
        result.isolated ===
          true
      );


    const noProductionWrite =
      Boolean(
        result &&
        result.productionWrite ===
          false
      );


    const noStorageWrite =
      Boolean(
        result &&
        result.storageWrite ===
          false
      );


    const noPromotion =
      Boolean(
        result &&
        result.productionPromoted ===
          false
      );


    const noSavePrediction =
      Boolean(
        result &&
        result.savePredictionCalled ===
          false
      );


    const noRenderForecast =
      Boolean(
        result &&
        result.renderForecastCalled ===
          false
      );


    const forecastReturned =
      Boolean(
        result &&
        result.forecast &&
        typeof result.forecast ===
          'object'
      );


    const itemCount =
      countForecastItems(
        result &&
        result.forecast
      );


    const executionPassed =
      Boolean(
        result &&
        result.ready ===
          true &&
        result.passed ===
          true &&
        result.engineExecuted ===
          true &&
        forecastReturned &&
        isolatedResult &&
        noProductionWrite &&
        noStorageWrite &&
        noPromotion &&
        noSavePrediction &&
        noRenderForecast &&
        lastForecastUnchanged
      );


    let html = `

      ${sectionTitle(
        'EXECUTION RESULT'
      )}

      ${row(
        'Province',
        esc(
          result &&
          result.province
        )
      )}

      ${row(
        'Route',
        esc(
          result &&
          result.route
        )
      )}

      ${row(
        'Strategy',
        esc(
          result &&
          result.strategy
        )
      )}

      ${row(
        'Model',
        esc(
          result &&
          result.model
        )
      )}

      ${row(
        'Window',
        esc(
          result &&
          result.window
        )
      )}

      ${row(
        'Reason',
        esc(
          result &&
          result.reason
        )
      )}

      ${row(
        'Engine Executed',
        yesNo(
          result &&
          result.engineExecuted ===
            true
        )
      )}

      ${row(
        'Forecast Returned',
        yesNo(
          forecastReturned
        )
      )}

      ${row(
        'Forecast Item Count',
        esc(
          itemCount
        )
      )}


      ${sectionTitle(
        'ISOLATION SAFETY',
        '#72e6ae'
      )}

      ${row(
        'Isolated Result',
        yesNo(
          isolatedResult
        )
      )}

      ${row(
        'Production Promoted',
        result &&
        result.productionPromoted ===
          false
          ? 'NO ✅'
          : 'YES / UNKNOWN ❌'
      )}

      ${row(
        'Production Write',
        result &&
        result.productionWrite ===
          false
          ? 'NO ✅'
          : 'YES / UNKNOWN ❌'
      )}

      ${row(
        'Storage Write',
        result &&
        result.storageWrite ===
          false
          ? 'NO ✅'
          : 'YES / UNKNOWN ❌'
      )}

      ${row(
        'savePrediction Called',
        result &&
        result.savePredictionCalled ===
          false
          ? 'NO ✅'
          : 'YES / UNKNOWN ❌'
      )}

      ${row(
        'renderForecast Called',
        result &&
        result.renderForecastCalled ===
          false
          ? 'NO ✅'
          : 'YES / UNKNOWN ❌'
      )}

      ${row(
        'LAST_FORECAST Unchanged',
        yesNo(
          lastForecastUnchanged
        )
      )}


      ${sectionTitle(
        'VERDICT',
        executionPassed
          ? '#72e6ae'
          : '#ff7185'
      )}

      ${row(
        'STEP 3.4B ISOLATED EXECUTION',
        executionPassed
          ? 'PASS ✅'
          : 'FAIL CLOSED ❌'
      )}

    `;


    output.innerHTML =
      html;


    window
      .LAST_FIX03D59_PRODUCTION_ENGINE_EXECUTION_VERIFICATION =
      {

        version:
          VERSION,

        province,

        selectedWindow,

        result,

        lastForecastUnchanged,

        isolatedResult,

        noProductionWrite,

        noStorageWrite,

        noPromotion,

        noSavePrediction,

        noRenderForecast,

        forecastReturned,

        itemCount,

        executionPassed,

        checkedAt:
          new Date()
            .toISOString()

      };

  }


  function buildPanel() {

    const old =
      document.getElementById(
        PANEL_ID
      );


    if (old) {
      old.remove();
    }


    const settings =
      document.getElementById(
        'tab-settings'
      );


    if (!settings) {

      console.warn(
        'Step 3.4B Execution Mobile: tab-settings not found'
      );

      return;

    }


    const panel =
      document.createElement(
        'section'
      );


    panel.id =
      PANEL_ID;


    panel.style.cssText = [
      'margin:18px 0 30px',
      'padding:18px',
      'border-radius:20px',
      'background:#20264f',
      'border:1px solid rgba(135,145,255,.25)',
      'color:#fff',
      'box-sizing:border-box'
    ].join(';');


    panel.innerHTML = `

      <div
        style="
          font-size:21px;
          font-weight:900;
          margin-bottom:7px;
        "
      >
        🧪 Production Engine Isolated Execution
      </div>

      <div
        style="
          opacity:.7;
          font-size:13px;
          line-height:1.55;
        "
      >
        Step 3.4B Execution Verification

        <br>

        Engine execution allowed · isolated RAM only

        <br>

        <b style="color:#72e6ae;">
          NO PRODUCTION PROMOTION · NO STORAGE WRITE
        </b>
      </div>

      <div
        id="fix03d59-engine-execution-mobile-run"
        role="button"
        tabindex="0"
        style="
          display:flex;
          width:100%;
          min-height:60px;
          margin-top:16px;
          padding:15px;
          border-radius:16px;
          background:
            linear-gradient(
              90deg,
              #72e6ae,
              #47d1c5
            );
          color:#17192f;
          font-size:16px;
          font-weight:900;
          align-items:center;
          justify-content:center;
          text-align:center;
          box-sizing:border-box;
          cursor:pointer;
          position:relative;
          z-index:100;
        "
      >
        🧪 RUN ISOLATED EXECUTION
      </div>

      <div
        id="${OUTPUT_ID}"
        style="margin-top:17px;"
      ></div>

    `;


    settings.appendChild(
      panel
    );


    const control =
      document.getElementById(
        'fix03d59-engine-execution-mobile-run'
      );


    if (control) {

      control.addEventListener(
        'click',
        runExecutionVerification
      );


      control.addEventListener(
        'keydown',
        function (event) {

          if (
            event.key === 'Enter' ||
            event.key === ' '
          ) {

            event.preventDefault();

            runExecutionVerification();

          }

        }
      );

    }

  }


  window
    .runProductionEngineExecutionVerification03D59 =
    runExecutionVerification;


  window
    .rebuildProductionEngineExecutionMobile03D59 =
    buildPanel;


  window
    .FIX03D59_PRODUCTION_ENGINE_EXECUTION_MOBILE_LOADED =
    true;


  function init() {

    window.setTimeout(
      buildPanel,
      420
    );

  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      init,
      {
        once: true
      }
    );

  } else {

    init();

  }


  console.log(
    'FIX-03D5.9 Step 3.4B Isolated Execution Mobile loaded'
  );

})();
