/* =========================================================================
   FIX-03D5.9
   PRODUCTION BRIDGE — STEP 3.2
   STRATEGY ROUTER MOBILE CHECK V1

   PURPOSE:
   - Verify Production Strategy Router Step 3.1 on mobile.
   - Resolve strategy for the currently selected province.
   - Display exact Decision + Route result.

   SAFETY:
   - READ ONLY.
   - DOES NOT execute forecast engine.
   - DOES NOT generate forecast.
   - DOES NOT modify LAST_FORECAST.
   - DOES NOT call savePrediction().
   - ZERO PRODUCTION WRITE.
   - ZERO STORAGE WRITE.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'PRODUCTION-STRATEGY-ROUTER-MOBILE-V1';


  const PANEL_ID =
    'fix03d59-production-router-mobile-panel';


  const OUTPUT_ID =
    'fix03d59-production-router-mobile-output';


  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

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

    if (value === true) {
      return 'YES ✅';
    }

    if (value === false) {
      return 'NO ❌';
    }

    return '--';

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
          align-items:flex-start;
          gap:14px;
          padding:10px 0;
          border-bottom:1px solid rgba(255,255,255,.08);
        "
      >

        <span
          style="
            color:rgba(255,255,255,.65);
            font-size:13px;
            flex:0 0 43%;
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


  function title(
    text,
    color
  ) {

    return `
      <div
        style="
          margin-top:18px;
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


  /*
   * =========================================================
   * RUN CHECK
   * =========================================================
   */

  function runMobileCheck32() {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {
      return;
    }


    const router =
      window.resolveProductionStrategy31;


    const loaded =
      window
        .FIX03D59_PRODUCTION_STRATEGY_ROUTER_LOADED ===
      true;


    /*
     * ---------------------------------------------------------
     * ROUTER LOAD CHECK
     * ---------------------------------------------------------
     */

    if (
      typeof router !==
      'function'
    ) {

      output.innerHTML = `

        ${title(
          'STEP 3.2 RUNTIME RESULT'
        )}

        ${row(
          'Router Module Loaded',
          yesNo(loaded)
        )}

        ${row(
          'Router Function',
          'NOT AVAILABLE ❌'
        )}

        ${row(
          'Expected Function',
          'resolveProductionStrategy31'
        )}

        ${row(
          'STOP',
          'FAIL CLOSED 🔒'
        )}

      `;

      return;

    }


    /*
     * ---------------------------------------------------------
     * EXECUTE ROUTER ONLY
     *
     * Router itself is READ ONLY.
     * No forecast engine is executed.
     * ---------------------------------------------------------
     */

    let result = null;
    let error = null;


    try {

      result =
        router();

    } catch (err) {

      error =
        err && err.message
          ? err.message
          : String(err);

    }


    if (error) {

      output.innerHTML = `

        ${title(
          'STEP 3.2 RUNTIME RESULT'
        )}

        ${row(
          'Router Module Loaded',
          yesNo(loaded)
        )}

        ${row(
          'Router Function',
          'AVAILABLE ✅'
        )}

        ${row(
          'Execution',
          'ERROR ❌'
        )}

        ${row(
          'Error',
          esc(error)
        )}

        ${row(
          'STOP',
          'FAIL CLOSED 🔒'
        )}

      `;

      return;

    }


    if (!result) {

      output.innerHTML = `

        ${title(
          'STEP 3.2 RUNTIME RESULT'
        )}

        ${row(
          'Router Module Loaded',
          yesNo(loaded)
        )}

        ${row(
          'Router Function',
          'AVAILABLE ✅'
        )}

        ${row(
          'Result',
          'NOT AVAILABLE ❌'
        )}

        ${row(
          'STOP',
          'FAIL CLOSED 🔒'
        )}

      `;

      return;

    }


    /*
     * ---------------------------------------------------------
     * ROUTE DISPLAY
     * ---------------------------------------------------------
     */

    let routeStatus =
      'NOT RESOLVED ❌';


    if (
      result.route ===
      'V2_PRODUCTION'
    ) {

      routeStatus =
        'V2_PRODUCTION 🟠';

    }


    if (
      result.route ===
      'ADAPTIVE'
    ) {

      routeStatus =
        'ADAPTIVE 🟢';

    }


    output.innerHTML = `

      ${title(
        'STEP 3.2 RUNTIME RESULT'
      )}

      ${row(
        'Mobile Module',
        'LOADED ✅'
      )}

      ${row(
        'Router Module Loaded',
        yesNo(loaded)
      )}

      ${row(
        'Router Function',
        'AVAILABLE ✅'
      )}

      ${row(
        'Router Ready',
        yesNo(result.ready)
      )}

      ${row(
        'Router Passed',
        yesNo(result.passed)
      )}


      ${title(
        'PROVINCE'
      )}

      ${row(
        'Province',
        esc(result.province)
      )}


      ${title(
        'DECISION LAYER'
      )}

      ${row(
        'Decision Ready',
        yesNo(
          result.decisionReady
        )
      )}

      ${row(
        'Decision Source',
        esc(
          result.decisionSource
        )
      )}

      ${row(
        'Decision Action',
        esc(
          result.decisionAction
        )
      )}

      ${row(
        'Classification',
        esc(
          result.classification
        )
      )}

      ${row(
        'Model',
        esc(
          result.model
        )
      )}

      ${row(
        'Window',
        esc(
          result.window
        )
      )}

      ${row(
        'Gate Score',
        esc(
          result.gateScore
        )
      )}

      ${row(
        'Decision Reason',
        esc(
          result.decisionReason
        )
      )}


      ${title(
        'PRODUCTION ROUTE',
        '#72e6ae'
      )}

      ${row(
        'Route',
        routeStatus
      )}

      ${row(
        'Strategy',
        esc(
          result.strategy
        )
      )}

      ${row(
        'Router Reason',
        esc(
          result.reason
        )
      )}


      ${title(
        'SAFETY',
        '#72e6ae'
      )}

      ${row(
        'Read Only',
        yesNo(
          result.readOnly
        )
      )}

      ${row(
        'Engine Executed',
        yesNo(
          result.engineExecuted
        )
      )}

      ${row(
        'Forecast Generated',
        yesNo(
          result.forecastGenerated
        )
      )}

      ${row(
        'Production Write',
        yesNo(
          result.productionWrite
        )
      )}

      ${row(
        'Storage Write',
        yesNo(
          result.storageWrite
        )
      )}

      ${row(
        'LAST_FORECAST Modified',
        yesNo(
          result.lastForecastModified
        )
      )}

      ${row(
        'savePrediction Called',
        yesNo(
          result.savePredictionCalled
        )
      )}

    `;


    /*
     * Diagnostic alias only.
     */

    window
      .LAST_FIX03D59_PRODUCTION_ROUTER_MOBILE_CHECK =
      {

        version:
          VERSION,

        result,

        checkedAt:
          new Date()
            .toISOString(),

        readOnly:
          true

      };

  }


  /*
   * =========================================================
   * BUILD MOBILE PANEL
   * =========================================================
   */

  function buildMobilePanel32() {

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
        'Production Router Mobile: tab-settings not found'
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
        🚦 Production Strategy Router
      </div>


      <div
        style="
          opacity:.68;
          font-size:13px;
          line-height:1.55;
        "
      >

        Production Bridge — Step 3.2

        <br>

        Decision → Production Route

        <br>

        <b style="color:#72e6ae;">
          READ ONLY · ZERO WRITE
        </b>

      </div>


      <div
        id="fix03d59-production-router-mobile-run"
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
              #46cfa0
            );
          color:#10251d;
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

        🔍 CHECK PRODUCTION ROUTE

      </div>


      <div
        id="${OUTPUT_ID}"
        style="
          margin-top:17px;
        "
      ></div>

    `;


    settings.appendChild(
      panel
    );


    const control =
      document.getElementById(
        'fix03d59-production-router-mobile-run'
      );


    if (control) {

      control.addEventListener(
        'click',
        runMobileCheck32
      );


      control.addEventListener(
        'keydown',
        function (event) {

          if (
            event.key === 'Enter' ||
            event.key === ' '
          ) {

            event.preventDefault();

            runMobileCheck32();

          }

        }
      );

    }

  }


  /*
   * =========================================================
   * PUBLIC API
   * =========================================================
   */

  window
    .checkProductionStrategyRouterMobile =
    runMobileCheck32;


  window
    .rebuildProductionStrategyRouterMobile =
    buildMobilePanel32;


  window
    .FIX03D59_PRODUCTION_STRATEGY_ROUTER_MOBILE_LOADED =
    true;


  /*
   * =========================================================
   * INIT
   * =========================================================
   */

  function init() {

    window.setTimeout(
      buildMobilePanel32,
      350
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
    'Production Bridge Step 3.2 Strategy Router Mobile loaded'
  );

})();
