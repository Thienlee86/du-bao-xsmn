/* =========================================================================
   FIX-03D5.9 STEP 8.4F-L / 8.4F-LH
   MOBILE FINAL LIFECYCLE TEST

   PURPOSE:
   - Test 8.4F-L lifecycle gate.
   - Verify read-only lifecycle bridge.
   - Run 8.4F-LH lifecycle hook.
   - Diagnose 8.4F Production Forecast Mapping Preview.
   - Display results directly on mobile.

   TEST ONLY
   READ ONLY
   ZERO WRITE
   FAIL CLOSED
   ========================================================================= */

(function () {

  'use strict';


  /* =====================================================================
     HELPERS
     ===================================================================== */

  function safeText(value) {

    return String(
      value ?? '--'
    )
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  }


  function yesNo(value) {

    return value === true
      ? 'YES ✅'
      : 'NO ❌';

  }


  /* =====================================================================
     FINAL LIFECYCLE TEST
     ===================================================================== */

  function runFinalLifecycleTest() {

    const output =
      document.getElementById(
        'fix03d59-final-output'
      );


    if (!output) {

      return;

    }


    const lifecycleFn =
      window
        .inspectProductionForecastLifecycle84FL;


    if (
      typeof lifecycleFn !==
      'function'
    ) {

      output.innerHTML = `
        <div style="
          margin-top:14px;
          padding:14px;
          border-radius:12px;
          background:rgba(255,70,70,.15);
        ">
          ❌ 8.4F-L Lifecycle Gate chưa được tải.
        </div>
      `;

      return;

    }


    let lifecycle;


    try {

      lifecycle =
        lifecycleFn();

    } catch (error) {

      output.innerHTML = `
        <div style="
          margin-top:14px;
          padding:14px;
          border-radius:12px;
          background:rgba(255,70,70,.15);
        ">
          ❌ Lifecycle Gate Exception
          <br><br>
          ${safeText(
            error?.message || error
          )}
        </div>
      `;

      return;

    }


    const bridge =
      window
        .LAST_FIX03D59_STEP84FL_BRIDGE ||
      null;


    const hookLoaded =
      window
        .FIX03D59_STEP84FLH_HOOK_LOADED ===
      true;


    const hookFn =
      window
        .inspectLifecycle84FLH;


    let hook =
      null;


    if (
      typeof hookFn ===
      'function'
    ) {

      try {

        hook =
          hookFn();

      } catch (error) {

        hook = {

          ready: false,
          passed: false,

          reason:
            'HOOK_EXCEPTION',

          stageReason:
            error?.message ||
            String(error),

          writeAuthorized: false,
          productionWrite: false,
          storageWrite: false,
          integrationPerformed: false,

          savePredictionCalled: false,
          forecastCreated: false,
          forecastModified: false,
          candidateModified: false,

          readOnly: true,
          failClosed: true

        };

      }

    }


    const lifecycleSafe =
      Boolean(
        lifecycle &&
        lifecycle.writeAuthorized === false &&
        lifecycle.productionWrite === false &&
        lifecycle.storageWrite === false &&
        lifecycle.integrationPerformed === false &&
        lifecycle.savePredictionCalled === false &&
        lifecycle.forecastCreated === false &&
        lifecycle.forecastModified === false &&
        lifecycle.candidateModified === false &&
        lifecycle.readOnly === true &&
        lifecycle.failClosed === true
      );


    const hookSafe =
      !hook ||
      Boolean(
        hook.writeAuthorized === false &&
        hook.productionWrite === false &&
        hook.storageWrite === false &&
        hook.integrationPerformed === false &&
        hook.savePredictionCalled === false &&
        hook.forecastCreated === false &&
        hook.forecastModified === false &&
        hook.candidateModified === false &&
        hook.readOnly === true &&
        hook.failClosed === true
      );


    const safe =
      lifecycleSafe &&
      hookSafe;


    output.innerHTML = `

      <div style="
        margin-top:18px;
        padding:15px;
        border-radius:15px;
        background:rgba(255,255,255,.06);
        line-height:1.8;
      ">

        <div style="
          color:#ffc13d;
          font-weight:900;
          margin-bottom:8px;
        ">
          ① 8.4F-L LIFECYCLE GATE
        </div>

        State:
        <b>
          ${safeText(
            lifecycle?.lifecycleState
          )}
        </b>

        <br>

        Reason:
        <b>
          ${safeText(
            lifecycle?.reason
          )}
        </b>

        <br>

        Forecast Exists:
        <b>
          ${yesNo(
            lifecycle?.forecastExists
          )}
        </b>

        <br>

        Forecast Valid:
        <b>
          ${yesNo(
            lifecycle?.forecastValid
          )}
        </b>

        <br>

        Mapping Preview:
        <b>
          ${yesNo(
            lifecycle?.mappingPreviewExists
          )}
        </b>

        <br>

        Mapping Ready:
        <b>
          ${yesNo(
            lifecycle?.mappingReady
          )}
        </b>


        <div style="
          margin-top:18px;
          padding-top:14px;
          border-top:1px solid rgba(255,255,255,.12);
          color:#ffc13d;
          font-weight:900;
        ">
          ② READ-ONLY BRIDGE
        </div>

        Bridge Exists:
        <b>
          ${yesNo(
            Boolean(bridge)
          )}
        </b>

        <br>

        Province:
        <b>
          ${safeText(
            bridge?.forecastProvince
          )}
        </b>

        <br>

        Window Size:
        <b>
          ${safeText(
            bridge?.forecastWindowSize
          )}
        </b>

        <br>

        Prize Count:
        <b>
          ${safeText(
            bridge?.forecastPrizeCount
          )}
        </b>

        <br>

        Mapping Ready:
        <b>
          ${yesNo(
            bridge?.mappingReady
          )}
        </b>


        <div style="
          margin-top:18px;
          padding-top:14px;
          border-top:1px solid rgba(255,255,255,.12);
          color:#ffc13d;
          font-weight:900;
        ">
          ③ 8.4F-LH HOOK
        </div>

        Hook Script Loaded:
        <b>
          ${yesNo(
            hookLoaded
          )}
        </b>

        <br>

        Hook Function:
        <b>
          ${yesNo(
            typeof hookFn ===
            'function'
          )}
        </b>

        <br>

        Hook Passed:
        <b>
          ${yesNo(
            hook?.passed
          )}
        </b>

        <br>

        Hook Reason:
        <b>
          ${safeText(
            hook?.reason ||
            'NO_RESULT'
          )}
        </b>

        <br>

        Failed Stage:
        <b>
          ${safeText(
            hook?.failedStage
          )}
        </b>

        <br>

        Stage Reason:
        <b>
          ${safeText(
            hook?.stageReason
          )}
        </b>


        <div style="
          margin-top:18px;
          padding:14px;
          border-radius:12px;
          font-weight:900;
          background:${
            safe
              ? 'rgba(45,200,120,.15)'
              : 'rgba(255,70,70,.15)'
          };
        ">

          ${
            safe
              ? '🔒 SAFETY LOCKS VERIFIED — ZERO WRITE'
              : '⚠️ SAFETY LOCK CHECK FAILED'
          }

        </div>

      </div>

    `;

  }


  /* =====================================================================
     8.4F MAPPING DIAGNOSIS
     ===================================================================== */

  function runMappingDiagnosis() {

    const output =
      document.getElementById(
        'fix03d59-final-output'
      );


    if (!output) {

      return;

    }


    const result =
      window
        .LAST_FIX03D59_STEP84F ||
      null;


    if (!result) {

      output.innerHTML = `
        <div style="
          margin-top:14px;
          padding:14px;
          border-radius:12px;
          background:rgba(255,189,60,.12);
        ">

          ⚠️ LAST_FIX03D59_STEP84F chưa tồn tại.

          <br><br>

          Hãy bấm
          <b>RUN FINAL LIFECYCLE TEST</b>
          trước.

        </div>
      `;

      return;

    }


    const mappings =
      Array.isArray(
        result.mappings
      )
        ? result.mappings
        : [];


    const failed =
      mappings.filter(
        item =>
          item.mappingValid !== true
      );


    let html = `

      <div style="
        margin-top:18px;
        padding:15px;
        border-radius:15px;
        background:rgba(255,255,255,.06);
        line-height:1.8;
      ">

        <div style="
          color:#ffc13d;
          font-weight:900;
          font-size:17px;
          margin-bottom:10px;
        ">
          🔎 8.4F MAPPING DIAGNOSIS
        </div>

        Passed:
        <b>
          ${yesNo(
            result.passed
          )}
        </b>

        <br>

        Reason:
        <b>
          ${safeText(
            result.reason
          )}
        </b>

        <br>

        Expected Count:
        <b>
          ${safeText(
            result.expectedCount
          )}
        </b>

        <br>

        Mapping Count:
        <b>
          ${safeText(
            result.mappingCount
          )}
        </b>

        <br>

        Counts Match:
        <b>
          ${yesNo(
            result.countsMatch
          )}
        </b>

        <br>

        All Mappings Valid:
        <b>
          ${yesNo(
            result.allMappingsValid
          )}
        </b>

        <br>

        Failed Mappings:
        <b>
          ${failed.length}
        </b>

      </div>

    `;


    if (
      mappings.length === 0
    ) {

      html += `

        <div style="
          margin-top:12px;
          padding:14px;
          border-radius:12px;
          background:rgba(255,189,60,.12);
        ">

          ⚠️ Không có mapping nào để kiểm tra.

        </div>

      `;

    }


    mappings.forEach(
      function (
        item,
        index
      ) {

        const valid =
          item.mappingValid === true;


        html += `

          <div style="
            margin-top:12px;
            padding:14px;
            border-radius:14px;
            line-height:1.75;
            background:${
              valid
                ? 'rgba(45,200,120,.10)'
                : 'rgba(255,70,70,.13)'
            };
          ">

            <div style="
              color:#ffc13d;
              font-weight:900;
              font-size:16px;
              margin-bottom:8px;
            ">

              ${
                valid
                  ? '✅'
                  : '❌'
              }

              Mapping ${index + 1}

              ·

              ${safeText(
                item.prize ||
                item.forecastPrizeKey
              )}

            </div>

            Province:
            <b>
              ${safeText(
                item.province
              )}
            </b>

            <br>

            Forecast Province:
            <b>
              ${safeText(
                item.forecastProvince
              )}
            </b>

            <br>

            Forecast Prize:
            <b>
              ${safeText(
                item.forecastPrizeKey
              )}
            </b>

            <br>

            Number Count:
            <b>
              ${safeText(
                item.productionNumberCount
              )}
            </b>

            <br><br>

            Province Match:
            <b>
              ${yesNo(
                item.provinceMatch
              )}
            </b>

            <br>

            Prize Meta Valid:
            <b>
              ${yesNo(
                item.prizeMetaValid
              )}
            </b>

            <br>

            Forecast Item Valid:
            <b>
              ${yesNo(
                item.forecastItemValid
              )}
            </b>

            <br>

            Number Schema Valid:
            <b>
              ${yesNo(
                item.numberSchemaValid
              )}
            </b>

            <br>

            Mapping Valid:
            <b>
              ${yesNo(
                item.mappingValid
              )}
            </b>

          </div>

        `;

      }
    );


    output.innerHTML =
      html;

  }


  /* =====================================================================
     BUILD UI
     ===================================================================== */

  function buildFinalTestUI() {

    /*
     * Prevent duplicate panel.
     */

    if (
      document.getElementById(
        'fix03d59-final-test-panel'
      )
    ) {

      return;

    }


    const settings =
      document.getElementById(
        'tab-settings'
      );


    if (!settings) {

      console.warn(
        'FIX-03D5.9 FINAL TEST: tab-settings not found'
      );

      return;

    }


    const panel =
      document.createElement(
        'div'
      );


    panel.id =
      'fix03d59-final-test-panel';


    /*
     * IMPORTANT:
     *
     * Inline styles intentionally used here.
     * This diagnostic panel must not depend
     * on style.css.
     */

    panel.style.cssText = [
      'margin:24px 0 90px',
      'padding:18px',
      'border-radius:20px',
      'background:#20264f',
      'color:#ffffff',
      'box-sizing:border-box',
      'border:1px solid rgba(255,193,61,.30)'
    ].join(';');


    panel.innerHTML = `

      <div style="
        font-size:21px;
        font-weight:900;
        margin-bottom:8px;
      ">
        🧪 FIX-03D5.9 FINAL TEST
      </div>


      <div style="
        opacity:.72;
        font-size:13px;
        line-height:1.6;
        margin-bottom:16px;
      ">

        Production Forecast Lifecycle

        <br>

        8.4F-L Gate →
        Read-Only Bridge →
        8.4F-LH Hook →
        8.4F Mapping Diagnosis

        <br><br>

        READ ONLY · ZERO WRITE · FAIL CLOSED

      </div>


      <button
        id="fix03d59-run-final-test"
        type="button"
        style="
          display:block !important;
          visibility:visible !important;
          opacity:1 !important;
          width:100%;
          min-height:56px;
          margin:0 0 12px;
          padding:14px;
          border:0;
          border-radius:15px;
          background:#ffc13d;
          color:#17182a;
          font-size:16px;
          font-weight:900;
          text-align:center;
          box-sizing:border-box;
        "
      >
        🧪 RUN FINAL LIFECYCLE TEST
      </button>


      <button
        id="fix03d59-run-mapping-diagnosis"
        type="button"
        style="
          display:block !important;
          visibility:visible !important;
          opacity:1 !important;
          width:100%;
          min-height:56px;
          margin:0;
          padding:14px;
          border:1px solid rgba(255,193,61,.60);
          border-radius:15px;
          background:#303966;
          color:#ffffff;
          font-size:16px;
          font-weight:900;
          text-align:center;
          box-sizing:border-box;
        "
      >
        🔎 RUN 8.4F DIAGNOSIS
      </button>


      <div
        id="fix03d59-final-output"
      ></div>

    `;


    /*
     * Put the diagnostic at the END
     * of Settings.
     */

    settings.appendChild(
      panel
    );


    const finalButton =
      document.getElementById(
        'fix03d59-run-final-test'
      );


    const diagnosisButton =
      document.getElementById(
        'fix03d59-run-mapping-diagnosis'
      );


    if (finalButton) {

      finalButton.addEventListener(
        'click',
        runFinalLifecycleTest
      );

    }


    if (diagnosisButton) {

      diagnosisButton.addEventListener(
        'click',
        runMappingDiagnosis
      );

    }


    console.log(
      'FIX-03D5.9 FINAL TEST UI BUILT'
    );

  }


  /* =====================================================================
     INITIALIZE
     ===================================================================== */

  function initializeFinalTestUI() {

    /*
     * Delay slightly so the normal Settings UI,
     * V2.2 and V2.4 can finish building first.
     *
     * No production state is touched.
     */

    window.setTimeout(
      buildFinalTestUI,
      800
    );

  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      initializeFinalTestUI
    );

  } else {

    initializeFinalTestUI();

  }


  /* =====================================================================
     PUBLIC DIAGNOSTIC API
     ===================================================================== */

  window.runLifecycleTest84FL =
    runFinalLifecycleTest;


  window.runMappingDiagnosisUI84F =
    runMappingDiagnosis;


  window.FIX03D59_FINAL_TEST_UI_LOADED =
    true;


  console.log(
    'FIX-03D5.9 FINAL TEST loaded / READ ONLY / ZERO WRITE'
  );


})();
