/* =========================================================================
   FIX-03D5.9 — PRODUCTION BRIDGE
   STEP 1 — MOBILE INSPECTOR

   PURPOSE:
   - Inspect Production Bridge Step 1 on mobile.
   - Resolve strategy for the currently selected province.
   - DISPLAY ONLY.

   SAFETY:
   - NO forecast generation.
   - NO LAST_FORECAST modification.
   - NO savePrediction().
   - NO storage write.
   - NO Production write.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'PRODUCTION-BRIDGE-STEP1-MOBILE-V1';

  const PANEL_ID =
    'fix03d59-production-bridge-step1-panel';

  const OUTPUT_ID =
    'fix03d59-production-bridge-step1-output';


  function esc(value) {

    return String(
      value === null ||
      value === undefined
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

    return value === true
      ? 'YES ✅'
      : value === false
        ? 'NO ❌'
        : '--';

  }


  function getSelectedProvince() {

    const select =
      document.getElementById(
        'provinceSelect'
      );


    if (
      select &&
      select.value
    ) {

      return select.value;

    }


    try {

      if (
        typeof SELECTED_PROVINCE !==
        'undefined' &&
        SELECTED_PROVINCE
      ) {

        return SELECTED_PROVINCE;

      }

    } catch (error) {

      // Ignore.
    }


    return null;

  }


  function row(label, value) {

    return `
      <div
        style="
          display:flex;
          justify-content:space-between;
          gap:14px;
          padding:9px 0;
          border-bottom:1px solid rgba(255,255,255,.08);
        "
      >
        <span
          style="
            color:rgba(255,255,255,.65);
            font-size:13px;
          "
        >
          ${esc(label)}
        </span>

        <b
          style="
            color:#fff;
            font-size:13px;
            text-align:right;
            word-break:break-word;
          "
        >
          ${value}
        </b>
      </div>
    `;

  }


  function renderInspector() {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {

      return;

    }


    const loaded =
      window
        .FIX03D59_PRODUCTION_BRIDGE_STEP1_LOADED ===
      true;


    const resolver =
      window
        .resolveFix03D59ProductionStrategy;


    const province =
      getSelectedProvince();


    if (
      !loaded ||
      typeof resolver !==
        'function'
    ) {

      output.innerHTML =
        row(
          'Module Loaded',
          'NO ❌'
        ) +
        row(
          'Resolver',
          'NOT AVAILABLE ❌'
        );

      return;

    }


    let result;


    try {

      result =
        resolver(
          province
        );

    } catch (error) {

      output.innerHTML =
        row(
          'Module Loaded',
          'YES ✅'
        ) +
        row(
          'Province',
          esc(province)
        ) +
        row(
          'Resolver',
          'ERROR ❌'
        ) +
        row(
          'Error',
          esc(
            error &&
            error.message
              ? error.message
              : error
          )
        );

      return;

    }


    window
      .LAST_FIX03D59_PRODUCTION_BRIDGE_STEP1_MOBILE =
      result;


    const strategy =
      result &&
      result.strategy
        ? result.strategy
        : '--';


    const strategyText =
      strategy === 'ADAPTIVE'
        ? 'ADAPTIVE 🟢'
        : strategy === 'V2_FALLBACK'
          ? 'V2 FALLBACK 🟡'
          : esc(strategy);


    output.innerHTML =

      row(
        'Module Loaded',
        'YES ✅'
      ) +

      row(
        'Province',
        esc(province)
      ) +

      row(
        'Decision Layer Ready',
        yesNo(
          result &&
          result.decisionLayerReady
        )
      ) +

      row(
        'Decision Source',
        esc(
          result &&
          result.decisionSource
        )
      ) +

      row(
        'Strategy',
        strategyText
      ) +

      row(
        'Classification',
        esc(
          result &&
          result.classification
        )
      ) +

      row(
        'Model',
        esc(
          result &&
          result.model
        )
      ) +

      row(
        'Window',
        esc(
          result &&
          result.window
        )
      ) +

      row(
        'Reason',
        esc(
          result &&
          result.reason
        )
      ) +

      `
        <div
          style="
            margin-top:17px;
            color:#72e6ae;
            font-size:15px;
            font-weight:900;
          "
        >
          🔒 SAFETY
        </div>
      ` +

      row(
        'Forecast Generated',
        yesNo(
          result &&
          result.forecastGenerated
        )
      ) +

      row(
        'Production Write',
        yesNo(
          result &&
          result.productionWrite
        )
      ) +

      row(
        'Storage Write',
        yesNo(
          result &&
          result.storageWrite
        )
      ) +

      row(
        'LAST_FORECAST Modified',
        yesNo(
          result &&
          result.lastForecastModified
        )
      ) +

      row(
        'savePrediction Called',
        yesNo(
          result &&
          result.savePredictionCalled
        )
      );

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
        'Production Bridge Step 1 Mobile: tab-settings not found'
      );

      return;

    }


    const panel =
      document.createElement(
        'section'
      );


    panel.id =
      PANEL_ID;


    panel.style.cssText = `
      margin:18px 0 30px;
      padding:18px;
      border-radius:20px;
      background:#20264f;
      border:1px solid rgba(114,230,174,.28);
      color:#fff;
      box-sizing:border-box;
    `;


    panel.innerHTML = `

      <div
        style="
          font-size:20px;
          font-weight:900;
          margin-bottom:7px;
        "
      >
        🌉 Production Bridge — Step 1
      </div>

      <div
        style="
          color:rgba(255,255,255,.65);
          font-size:13px;
          line-height:1.55;
        "
      >
        Resolve Production strategy
        for the selected province.

        <br>

        READ ONLY · ZERO WRITE
      </div>


      <div
        id="fix03d59-production-bridge-step1-run"
        role="button"
        tabindex="0"
        style="
          display:flex;
          width:100%;
          min-height:58px;
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
          cursor:pointer;
          box-sizing:border-box;
        "
      >
        🔍 CHECK PRODUCTION STRATEGY
      </div>


      <div
        id="${OUTPUT_ID}"
        style="
          margin-top:17px;
        "
      >
        Chưa kiểm tra.
      </div>

    `;


    settings.appendChild(
      panel
    );


    const control =
      document.getElementById(
        'fix03d59-production-bridge-step1-run'
      );


    if (control) {

      control.addEventListener(
        'click',
        renderInspector
      );


      control.addEventListener(
        'keydown',
        function (event) {

          if (
            event.key === 'Enter' ||
            event.key === ' '
          ) {

            event.preventDefault();

            renderInspector();

          }

        }
      );

    }


    /*
     * Auto-render once.
     * Resolver only — no forecast execution.
     */

    window.setTimeout(
      renderInspector,
      500
    );

  }


  window
    .renderFix03D59ProductionBridgeStep1Mobile =
    renderInspector;


  window
    .FIX03D59_PRODUCTION_BRIDGE_STEP1_MOBILE_LOADED =
    true;


  window
    .FIX03D59_PRODUCTION_BRIDGE_STEP1_MOBILE_VERSION =
    VERSION;


  function init() {

    window.setTimeout(
      buildPanel,
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

})();
