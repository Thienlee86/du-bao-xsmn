/* =========================================================================
   FIX-03D5.9
   PRODUCTION COMMIT CONTROLLER MOBILE V2

   FILE:
   modules/fix03d59-production-commit-controller-mobile.js

   PURPOSE:
   - Provide mobile UI for:
       inspectFix03D59ProductionCommitController()
   - Show CURRENT Production authorization state.
   - Surface precise V3 Pre-Commit failure diagnostics.
   - Never execute forecast engine.
   - Never modify LAST_FORECAST.
   - Never modify forecast / pairFormulas.
   - Never call savePrediction().
   - Never write Production/storage.

   READ ONLY
   ZERO PRODUCTION WRITE
   ZERO STORAGE WRITE
   NO ENGINE EXECUTION
   FAIL CLOSED
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_PRODUCTION_COMMIT_CONTROLLER_MOBILE_V2';


  const PANEL_ID =
    'fix03d59-production-commit-controller-mobile-panel';


  const OUTPUT_ID =
    'fix03d59-production-commit-controller-mobile-output';


  const BUTTON_ID =
    'fix03d59-production-commit-controller-mobile-run';


  /*
   * =========================================================
   * 1. SAFE HELPERS
   * =========================================================
   */

  function safeText(
    value
  ) {

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {

      return '--';

    }


    return String(
      value
    );

  }


  function yesNo(
    value
  ) {

    return (
      value === true
        ? 'YES ✅'
        : 'NO ❌'
    );

  }


  function statusColor(
    value
  ) {

    return (
      value === true
        ? '#8ff0bd'
        : '#ff9aab'
    );

  }


  function rowHtml(
    label,
    value,
    color
  ) {

    return `

      <div
        style="
          padding:11px 0;
          border-bottom:
            1px solid rgba(255,255,255,.08);
          color:rgba(255,255,255,.68);
          min-width:0;
        "
      >
        ${safeText(label)}
      </div>


      <div
        style="
          padding:11px 0 11px 12px;
          border-bottom:
            1px solid rgba(255,255,255,.08);
          text-align:right;
          font-weight:900;
          color:${
            color ||
            '#ffffff'
          };
          min-width:0;
          max-width:100%;
          overflow-wrap:anywhere;
          word-break:break-word;
        "
      >
        ${safeText(value)}
      </div>

    `;

  }


  /*
   * =========================================================
   * 2. READ PRE-COMMIT STATE
   * =========================================================
   *
   * On blocked V3 results:
   *
   * result.preCommit contains the COMPLETE gate result.
   *
   * On success it may contain only the summarized state.
   * =========================================================
   */

  function getPreCommitState(
    result
  ) {

    if (
      result &&
      result.preCommit &&
      typeof result.preCommit ===
        'object'
    ) {

      return result.preCommit;

    }


    return null;

  }


  /*
   * =========================================================
   * 3. READ FAILURE DIAGNOSTICS
   * =========================================================
   */

  function getFailureDiagnostics(
    result
  ) {

    const preCommit =
      getPreCommitState(
        result
      );


    const forecastCheck =
      (
        preCommit &&
        preCommit.forecastCheck &&
        typeof preCommit.forecastCheck ===
          'object'
      )
        ? preCommit.forecastCheck
        : null;


    /*
     * Prefer Controller V3 flattened fields.
     *
     * Fall back to the raw Pre-Commit forecastCheck
     * so diagnostics remain visible even if one layer
     * does not flatten a particular field.
     */

    const failedPrize =
      result.failedPrize ??
      (
        forecastCheck
          ? (
              forecastCheck.prizeKey ??
              forecastCheck.expectedKey ??
              null
            )
          : null
      );


    const failedIndex =
      result.failedIndex ??
      (
        forecastCheck
          ? (
              forecastCheck.failedIndex ??
              null
            )
          : null
      );


    const actualNumberCount =
      result.actualNumberCount ??
      (
        forecastCheck
          ? (
              forecastCheck.actualCount ??
              null
            )
          : null
      );


    const expectedNumberCount =
      result.expectedNumberCount ??
      (
        forecastCheck
          ? (
              forecastCheck.expectedCount ??
              null
            )
          : null
      );


    const expectedDigits =
      result.expectedDigits ??
      (
        forecastCheck
          ? (
              forecastCheck.expectedDigits ??
              null
            )
          : null
      );


    const expectedKey =
      result.expectedKey ??
      (
        forecastCheck
          ? (
              forecastCheck.expectedKey ??
              null
            )
          : null
      );


    const actualKey =
      result.actualKey ??
      (
        forecastCheck
          ? (
              forecastCheck.actualKey ??
              null
            )
          : null
      );


    const gateReason =
      result.preCommitReason ??
      (
        preCommit
          ? (
              preCommit.reason ??
              null
            )
          : null
      );


    return {

      gateReason,

      failedPrize,

      failedIndex,

      actualNumberCount,

      expectedNumberCount,

      expectedDigits,

      expectedKey,

      actualKey

    };

  }


  /*
   * =========================================================
   * 4. BUILD OUTPUT
   * =========================================================
   */

  function renderResult(
    result
  ) {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {

      return;

    }


    if (
      !result ||
      typeof result !==
        'object'
    ) {

      output.innerHTML = `

        <div
          style="
            margin-top:16px;
            padding:16px;
            border-radius:16px;
            background:rgba(248,113,113,.15);
            color:#ffd3da;
            line-height:1.6;
          "
        >
          ❌ Controller returned no usable result.
        </div>

      `;

      return;

    }


    const authorized =
      result.authorized === true;


    const preCommit =
      getPreCommitState(
        result
      );


    const diagnostics =
      getFailureDiagnostics(
        result
      );


    output.innerHTML = `

      <div
        style="
          margin-top:18px;
          padding:18px;
          border-radius:18px;
          background:rgba(0,0,0,.18);
          line-height:1.65;
        "
      >

        <div
          style="
            font-size:20px;
            font-weight:900;
            color:${
              authorized
                ? '#8ff0bd'
                : '#ff9aab'
            };
            margin-bottom:14px;
          "
        >
          ${
            authorized
              ? '✅ PRODUCTION AUTHORIZED'
              : '❌ PRODUCTION BLOCKED'
          }
        </div>


        <div
          style="
            display:grid;
            grid-template-columns:
              minmax(0,1fr)
              minmax(0,1fr);
            column-gap:14px;
          "
        >

          ${rowHtml(
            'Controller Ready',
            yesNo(
              result.ready === true
            ),
            statusColor(
              result.ready === true
            )
          )}

          ${rowHtml(
            'Controller Passed',
            yesNo(
              result.passed === true
            ),
            statusColor(
              result.passed === true
            )
          )}

          ${rowHtml(
            'Authorized',
            yesNo(
              authorized
            ),
            statusColor(
              authorized
            )
          )}

          ${rowHtml(
            'Reason',
            result.reason
          )}

          ${rowHtml(
            'Controller Version',
            result.version
          )}

          ${rowHtml(
            'Selected Province',
            result.selectedProvince
          )}

          ${rowHtml(
            'Forecast Province',
            result.forecastProvince
          )}

          ${rowHtml(
            'Window Size',
            result.windowSize
          )}

          ${rowHtml(
            'Forecast Item Count',
            result.forecastItemCount
          )}

          ${rowHtml(
            'Pair Formula Count',
            result.pairFormulaCount
          )}

        </div>


        <div
          style="
            margin-top:20px;
            padding-top:16px;
            border-top:
              1px solid rgba(255,255,255,.10);
          "
        >

          <div
            style="
              color:#ffbd3c;
              font-size:17px;
              font-weight:900;
              margin-bottom:10px;
            "
          >
            PRE-COMMIT GATE
          </div>


          <div
            style="
              display:grid;
              grid-template-columns:
                minmax(0,1fr)
                minmax(0,1fr);
              column-gap:14px;
            "
          >

            ${rowHtml(
              'Gate Ready',
              preCommit
                ? yesNo(
                    preCommit.ready === true
                  )
                : '--',
              preCommit
                ? statusColor(
                    preCommit.ready === true
                  )
                : null
            )}

            ${rowHtml(
              'Gate Passed',
              preCommit
                ? yesNo(
                    preCommit.passed === true
                  )
                : '--',
              preCommit
                ? statusColor(
                    preCommit.passed === true
                  )
                : null
            )}

            ${rowHtml(
              'Gate Authorized',
              preCommit
                ? yesNo(
                    preCommit.authorized === true
                  )
                : '--',
              preCommit
                ? statusColor(
                    preCommit.authorized === true
                  )
                : null
            )}

            ${rowHtml(
              'Gate Reason',
              diagnostics.gateReason
            )}

            ${rowHtml(
              'Gate Version',
              preCommit
                ? preCommit.version
                : null
            )}

          </div>

        </div>


        <div
          style="
            margin-top:22px;
            padding:16px;
            border-radius:16px;
            background:rgba(255,189,60,.08);
            border:
              1px solid rgba(255,189,60,.18);
          "
        >

          <div
            style="
              color:#ffbd3c;
              font-size:17px;
              font-weight:900;
              margin-bottom:10px;
            "
          >
            🔬 PRE-COMMIT FAILURE DIAGNOSTICS
          </div>


          <div
            style="
              display:grid;
              grid-template-columns:
                minmax(0,1fr)
                minmax(0,1fr);
              column-gap:14px;
            "
          >

            ${rowHtml(
              'Failed Prize',
              diagnostics.failedPrize
            )}

            ${rowHtml(
              'Failed Index',
              diagnostics.failedIndex
            )}

            ${rowHtml(
              'Actual Number Count',
              diagnostics.actualNumberCount
            )}

            ${rowHtml(
              'Expected Number Count',
              diagnostics.expectedNumberCount
            )}

            ${rowHtml(
              'Expected Digits',
              diagnostics.expectedDigits
            )}

            ${rowHtml(
              'Expected Key',
              diagnostics.expectedKey
            )}

            ${rowHtml(
              'Actual Key',
              diagnostics.actualKey
            )}

          </div>

        </div>


        <div
          style="
            margin-top:18px;
            padding:14px;
            border-radius:14px;
            background:rgba(52,211,153,.10);
            color:#caffdf;
            font-size:13px;
            font-weight:800;
            line-height:1.6;
          "
        >
          🔒 LAST_FORECAST NOT MODIFIED
          <br>
          🔒 NO ENGINE EXECUTION
          <br>
          🔒 NO savePrediction()
          <br>
          🔒 NO STORAGE WRITE
        </div>

      </div>

    `;

  }


  /*
   * =========================================================
   * 5. RUN CONTROLLER
   * =========================================================
   */

  function runControllerMobile() {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {

      return;

    }


    const inspector =
      window
        .inspectFix03D59ProductionCommitController;


    if (
      typeof inspector !==
        'function'
    ) {

      output.innerHTML = `

        <div
          style="
            margin-top:16px;
            padding:16px;
            border-radius:16px;
            background:rgba(248,113,113,.15);
            color:#ffd3da;
            line-height:1.6;
          "
        >
          ❌ PRODUCTION COMMIT CONTROLLER NOT AVAILABLE
          <br><br>

          Function:
          <b>
            inspectFix03D59ProductionCommitController
          </b>
        </div>

      `;

      return;

    }


    output.innerHTML = `

      <div
        style="
          margin-top:16px;
          padding:14px;
          border-radius:14px;
          background:rgba(255,189,60,.10);
          color:#ffe9ad;
          font-weight:800;
        "
      >
        🔎 Inspecting current Production Forecast...
      </div>

    `;


    try {

      const result =
        inspector();


      renderResult(
        result
      );


    } catch (error) {

      output.innerHTML = `

        <div
          style="
            margin-top:16px;
            padding:16px;
            border-radius:16px;
            background:rgba(248,113,113,.15);
            color:#ffd3da;
            line-height:1.6;
          "
        >
          ❌ CONTROLLER EXECUTION ERROR
          <br><br>

          ${safeText(
            error &&
            error.message
              ? error.message
              : error
          )}
        </div>

      `;

    }

  }


  /*
   * =========================================================
   * 6. BUILD MOBILE PANEL
   * =========================================================
   */

  function buildControllerMobilePanel() {

    /*
     * Prevent duplicate panel.
     */

    if (
      document.getElementById(
        PANEL_ID
      )
    ) {

      return;

    }


    const settings =
      document.getElementById(
        'tab-settings'
      );


    if (!settings) {

      return;

    }


    const panel =
      document.createElement(
        'div'
      );


    panel.id =
      PANEL_ID;


    panel.style.cssText = [

      'margin:22px 24px 32px',

      'padding:22px',

      'border-radius:26px',

      'background:linear-gradient(145deg,#20294f,#1b2345)',

      'border:1px solid rgba(255,189,60,.30)',

      'color:#ffffff',

      'box-sizing:border-box'

    ].join(';');


    const controllerLoaded =
      (
        typeof window
          .inspectFix03D59ProductionCommitController ===
        'function'
      );


    const preCommitLoaded =
      (
        typeof window
          .inspectFix03D59ProductionPreCommit ===
        'function'
      );


    panel.innerHTML = `

      <div
        style="
          font-size:25px;
          font-weight:950;
          line-height:1.25;
        "
      >
        🔐 Production Commit Controller
      </div>


      <div
        style="
          margin-top:10px;
          color:rgba(255,255,255,.70);
          line-height:1.6;
          font-size:15px;
        "
      >
        Final runtime authorization check
        for the REAL Production Forecast envelope.
      </div>


      <div
        style="
          margin-top:8px;
          color:#8ff0bd;
          font-size:13px;
          font-weight:900;
        "
      >
        READ ONLY · ZERO WRITE · NO ENGINE EXECUTION
      </div>


      <div
        style="
          margin-top:20px;
          padding:16px;
          border-radius:16px;
          background:rgba(0,0,0,.18);
          line-height:1.8;
        "
      >

        Controller Script:
        <b
          style="
            color:${
              controllerLoaded
                ? '#8ff0bd'
                : '#ff9aab'
            };
          "
        >
          ${
            controllerLoaded
              ? 'YES ✅'
              : 'NO ❌'
          }
        </b>

        <br>

        Pre-Commit Gate:
        <b
          style="
            color:${
              preCommitLoaded
                ? '#8ff0bd'
                : '#ff9aab'
            };
          "
        >
          ${
            preCommitLoaded
              ? 'YES ✅'
              : 'NO ❌'
          }
        </b>

        <br>

        Mobile UI:
        <b
          style="
            color:#8ff0bd;
          "
        >
          V2 DIAGNOSTICS ✅
        </b>

      </div>


      <div
        id="${BUTTON_ID}"
        role="button"
        tabindex="0"
        style="
          display:flex;
          align-items:center;
          justify-content:center;
          width:100%;
          min-height:68px;
          margin-top:20px;
          padding:16px;
          border-radius:18px;
          background:
            linear-gradient(
              90deg,
              #ffbf38,
              #ff963d
            );
          color:#17182a;
          font-size:17px;
          font-weight:950;
          text-align:center;
          box-sizing:border-box;
          cursor:pointer;
        "
      >
        🔎 RUN PRODUCTION COMMIT CHECK
      </div>


      <div
        id="${OUTPUT_ID}"
      >

        <div
          style="
            margin-top:16px;
            color:rgba(255,255,255,.65);
            line-height:1.6;
          "
        >
          Chưa chạy kiểm tra.
        </div>

      </div>

    `;


    settings.appendChild(
      panel
    );


    const button =
      document.getElementById(
        BUTTON_ID
      );


    if (!button) {

      return;

    }


    button.addEventListener(
      'click',
      runControllerMobile
    );


    button.addEventListener(
      'keydown',
      function (event) {

        if (
          event.key === 'Enter' ||
          event.key === ' '
        ) {

          event.preventDefault();

          runControllerMobile();

        }

      }
    );

  }


  /*
   * =========================================================
   * 7. INITIALIZE
   * =========================================================
   */

  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      buildControllerMobilePanel,
      {
        once: true
      }
    );

  } else {

    window.setTimeout(
      buildControllerMobilePanel,
      300
    );

  }


  /*
   * =========================================================
   * 8. PUBLIC API
   * =========================================================
   */

  window
    .rebuildFix03D59ProductionCommitControllerMobile =
    buildControllerMobilePanel;


  window
    .FIX03D59_PRODUCTION_COMMIT_CONTROLLER_MOBILE_VERSION =
    VERSION;


  window
    .FIX03D59_PRODUCTION_COMMIT_CONTROLLER_MOBILE_LOADED =
    true;


  console.log(
    'FIX-03D5.9 Production Commit Controller Mobile V2 loaded / V3 DIAGNOSTICS / READ ONLY / ZERO WRITE'
  );

})();
