/* =========================================================================
   FIX-03D5.9
   PRODUCTION BRIDGE — STEP 2.3
   DECISION BOOTSTRAP MOBILE CHECK V1

   PURPOSE:
   - Verify Production Decision Bootstrap is loaded.
   - Inspect canonical V2.6 Decision runner availability.
   - Inspect current Decision RAM.
   - DO NOT execute bootstrap.
   - READ ONLY / ZERO WRITE.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'PRODUCTION-DECISION-BOOTSTRAP-MOBILE-CHECK-V1';


  const PANEL_ID =
    'fix03d59-production-decision-bootstrap-mobile-panel';


  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

  function escapeHtml(value) {

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
          align-items:flex-start;
          gap:14px;
          padding:10px 0;
          border-bottom:
            1px solid rgba(255,255,255,.08);
        "
      >

        <span
          style="
            color:rgba(255,255,255,.67);
            font-size:13px;
            flex:0 0 45%;
          "
        >
          ${escapeHtml(label)}
        </span>

        <b
          style="
            color:#fff;
            font-size:13px;
            text-align:right;
            word-break:break-word;
            flex:1;
          "
        >
          ${value}
        </b>

      </div>

    `;

  }


  /*
   * =========================================================
   * READ-ONLY CHECK
   * =========================================================
   */

  function inspectMobilePDB() {

    const inspector =
      window
        .inspectProductionDecisionBootstrap03D59;


    const bootstrap =
      window
        .bootstrapProductionDecision03D59;


    let result =
      null;


    let error =
      null;


    /*
     * IMPORTANT:
     * Inspector only.
     *
     * bootstrapProductionDecision03D59()
     * is deliberately NOT called here.
     */

    if (
      typeof inspector ===
      'function'
    ) {

      try {

        result =
          inspector();

      } catch (caught) {

        error =
          caught &&
          caught.message
            ? caught.message
            : String(caught);

      }

    }


    return {

      moduleLoaded:
        window
          .FIX03D59_PRODUCTION_DECISION_BOOTSTRAP_LOADED ===
        true,

      moduleVersion:
        window
          .FIX03D59_PRODUCTION_DECISION_BOOTSTRAP_VERSION ||
        '--',

      inspectorAvailable:
        typeof inspector ===
        'function',

      bootstrapAvailable:
        typeof bootstrap ===
        'function',

      inspectorError:
        error,

      result

    };

  }


  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  function renderMobilePDB() {

    const output =
      document.getElementById(
        'fix03d59-production-decision-bootstrap-mobile-output'
      );


    if (!output) {

      return;

    }


    const state =
      inspectMobilePDB();


    const result =
      state.result ||
      {};


    output.innerHTML = `

      <div
        style="
          margin-bottom:12px;
          color:#ffc13d;
          font-size:15px;
          font-weight:900;
        "
      >
        STEP 2.3 RUNTIME RESULT
      </div>


      ${row(
        'Bootstrap Module Loaded',
        yesNo(
          state.moduleLoaded
        )
      )}


      ${row(
        'Module Version',
        escapeHtml(
          state.moduleVersion
        )
      )}


      ${row(
        'Inspector Available',
        yesNo(
          state.inspectorAvailable
        )
      )}


      ${row(
        'Bootstrap Function Available',
        yesNo(
          state.bootstrapAvailable
        )
      )}


      ${row(
        'Province',
        escapeHtml(
          result.province
        )
      )}


      ${row(
        'Decision Ready',
        yesNo(
          result.decisionReady ===
          true
        )
      )}


      ${row(
        'Decision Source',
        escapeHtml(
          result.decisionSource
        )
      )}


      ${row(
        'Runner Available',
        yesNo(
          result.runnerAvailable ===
          true
        )
      )}


      ${row(
        'Runner Name',
        escapeHtml(
          result.runnerName
        )
      )}


      ${row(
        'Inspector Error',
        escapeHtml(
          state.inspectorError
        )
      )}


      <div
        style="
          margin-top:18px;
          color:#72e6ae;
          font-size:15px;
          font-weight:900;
        "
      >
        🔒 SAFETY
      </div>


      ${row(
        'Bootstrap Executed',
        'NO ❌'
      )}


      ${row(
        'Forecast Generated',
        'NO ❌'
      )}


      ${row(
        'Production Write',
        'NO ❌'
      )}


      ${row(
        'Storage Write',
        'NO ❌'
      )}


      ${row(
        'LAST_FORECAST Modified',
        'NO ❌'
      )}


      ${row(
        'savePrediction Called',
        'NO ❌'
      )}


      ${row(
        'Candidate Promoted',
        'NO ❌'
      )}

    `;

  }


  /*
   * =========================================================
   * PANEL
   * =========================================================
   */

  function buildMobilePDBPanel() {

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
        'Production Decision Bootstrap Mobile: tab-settings not found'
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
      background:rgba(30,36,78,.96);
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
        🧠 Production Decision Bootstrap
      </div>


      <div
        style="
          color:rgba(255,255,255,.67);
          font-size:13px;
          line-height:1.6;
        "
      >
        Step 2.3 — canonical Decision runner check.

        <br>

        <b style="color:#72e6ae;">
          INSPECTION ONLY · ZERO WRITE
        </b>
      </div>


      <div
        id="fix03d59-production-decision-bootstrap-mobile-run"
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
          box-sizing:border-box;
          cursor:pointer;
        "
      >
        🔎 CHECK DECISION BOOTSTRAP
      </div>


      <div
        id="fix03d59-production-decision-bootstrap-mobile-output"
        style="
          margin-top:18px;
        "
      ></div>

    `;


    settings.appendChild(
      panel
    );


    const control =
      document.getElementById(
        'fix03d59-production-decision-bootstrap-mobile-run'
      );


    if (control) {

      control.addEventListener(
        'click',
        renderMobilePDB
      );

    }


    /*
     * Auto inspection is safe because it does NOT
     * execute the bootstrap function.
     */

    window.setTimeout(
      renderMobilePDB,
      350
    );

  }


  /*
   * =========================================================
   * PUBLIC
   * =========================================================
   */

  window
    .inspectProductionDecisionBootstrapMobile03D59 =
    renderMobilePDB;


  window
    .FIX03D59_PRODUCTION_DECISION_BOOTSTRAP_MOBILE_LOADED =
    true;


  /*
   * =========================================================
   * INIT
   * =========================================================
   */

  function initialize() {

    window.setTimeout(
      buildMobilePDBPanel,
      350
    );

  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      initialize,
      {
        once: true
      }
    );

  } else {

    initialize();

  }


  console.log(
    'FIX-03D5.9 Production Decision Bootstrap Mobile Check V1 loaded'
  );

})();
