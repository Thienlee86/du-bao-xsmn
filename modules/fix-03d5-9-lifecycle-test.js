/* =========================================================================
   FIX-03D5.9 STEP 8.4F-L / 8.4F-LH
   MOBILE FINAL LIFECYCLE TEST + 8.4F MAPPING DIAGNOSIS

   PURPOSE:
   - Test the rebuilt 8.4F-L lifecycle gate.
   - Verify the read-only lifecycle bridge.
   - Invoke the rebuilt 8.4F-LH hook after the gate.
   - Diagnose STEP 8.4F Production Forecast Mapping Preview.
   - Display all results directly on mobile.

   SAFETY:
   - Never create or modify LAST_FORECAST.
   - Never modify candidates.
   - Never call savePrediction().
   - Never write production/storage.

   TEST ONLY
   READ ONLY
   ZERO WRITE
   FAIL CLOSED
   ========================================================================= */

(function () {

  'use strict';


  /* ======================================================================
     1. DISPLAY HELPERS
     ====================================================================== */

  function yesNo84FLTest(value) {

    return value === true
      ? 'YES ✅'
      : 'NO ❌';

  }


  function safeText84FLTest(value) {

    return String(
      value ?? '--'
    )
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  }


  function hookStatus84FLTest(hook) {

    if (!hook) {

      return 'NOT AVAILABLE ⚠️';

    }

    return (
      hook.ready === true &&
      hook.passed === true
    )
      ? 'PASS ✅'
      : 'FAILED ❌';

  }


  /* ======================================================================
     2. FINAL LIFECYCLE TEST
     ====================================================================== */

  function runLifecycleTest84FL() {

    const output =
      document.getElementById(
        'fix03d59-84fl-test-output'
      );


    if (!output) {

      return;

    }


    /*
     * ---------------------------------------------------------
     * VERIFY 8.4F-L LIFECYCLE GATE
     * ---------------------------------------------------------
     */

    const lifecycleInspector =
      window
        .inspectProductionForecastLifecycle84FL;


    if (
      typeof lifecycleInspector !==
      'function'
    ) {

      output.innerHTML = `

        <div class="fix84fl-error">

          ❌ 8.4F-L Lifecycle Gate chưa được tải.

        </div>

      `;

      return;

    }


    /*
     * ---------------------------------------------------------
     * RUN GATE
     * ---------------------------------------------------------
     */

    let lifecycle;


    try {

      lifecycle =
        lifecycleInspector();

    } catch (error) {

      output.innerHTML = `

        <div class="fix84fl-error">

          ❌ 8.4F-L Lifecycle Gate gặp lỗi.

          <br><br>

          ${safeText84FLTest(
            error &&
            error.message
              ? error.message
              : error
          )}

        </div>

      `;

      return;

    }


    /*
     * ---------------------------------------------------------
     * READ BRIDGE
     * ---------------------------------------------------------
     */

    const bridge =
      window
        .LAST_FIX03D59_STEP84FL_BRIDGE ||
      null;


    /*
     * ---------------------------------------------------------
     * VERIFY 8.4F-LH HOOK
     * ---------------------------------------------------------
     */

    const hookScriptLoaded =
      window
        .FIX03D59_STEP84FLH_HOOK_LOADED ===
      true;


    const hookInspector =
      window
        .inspectLifecycle84FLH;


    const hookInspectorAvailable =
      typeof hookInspector ===
      'function';


    /*
     * ---------------------------------------------------------
     * RUN HOOK
     * ---------------------------------------------------------
     */

    let hookResult =
      null;


    if (
      hookInspectorAvailable
    ) {

      try {

        hookResult =
          hookInspector();

      } catch (error) {

        hookResult = {

          ready: false,

          passed: false,

          reason:
            'TEST_HOOK_EXCEPTION',

          stageReason:
            error &&
            error.message
              ? error.message
              : String(error),

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


    /*
     * ---------------------------------------------------------
     * SAFETY LOCK VERIFICATION
     * ---------------------------------------------------------
     */

    const lifecycleLocksSafe =
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


    const hookLocksSafe =
      Boolean(

        hookResult &&

        hookResult.writeAuthorized === false &&

        hookResult.productionWrite === false &&

        hookResult.storageWrite === false &&

        hookResult.integrationPerformed === false &&

        hookResult.savePredictionCalled === false &&

        hookResult.forecastCreated === false &&

        hookResult.forecastModified === false &&

        hookResult.candidateModified === false &&

        hookResult.readOnly === true &&

        hookResult.failClosed === true

      );


    const hardLocksSafe =
      lifecycleLocksSafe &&
      (
        !hookResult ||
        hookLocksSafe
      );


    /*
     * ---------------------------------------------------------
     * DISPLAY RESULT
     * ---------------------------------------------------------
     */

    output.innerHTML = `

      <div class="fix84fl-result">


        <div class="fix84fl-section-label">

          ① 8.4F-L LIFECYCLE GATE

        </div>


        <div class="fix84fl-state">

          ${safeText84FLTest(
            lifecycle?.lifecycleState
          )}

        </div>


        <div class="fix84fl-reason">

          ${safeText84FLTest(
            lifecycle?.reason
          )}

        </div>


        <div class="fix84fl-grid">

          <div>

            <span>
              Forecast Exists
            </span>

            <b>
              ${yesNo84FLTest(
                lifecycle?.forecastExists
              )}
            </b>

          </div>


          <div>

            <span>
              Forecast Valid
            </span>

            <b>
              ${yesNo84FLTest(
                lifecycle?.forecastValid
              )}
            </b>

          </div>


          <div>

            <span>
              Mapping Preview
            </span>

            <b>
              ${yesNo84FLTest(
                lifecycle?.mappingPreviewExists
              )}
            </b>

          </div>


          <div>

            <span>
              Mapping Ready
            </span>

            <b>
              ${yesNo84FLTest(
                lifecycle?.mappingReady
              )}
            </b>

          </div>

        </div>


        <div class="fix84fl-section">

          <div class="fix84fl-section-label">

            ② READ-ONLY BRIDGE

          </div>


          <div class="fix84fl-locks">

            <div>
              Bridge Exists:
              <b>
                ${yesNo84FLTest(
                  Boolean(bridge)
                )}
              </b>
            </div>


            <div>
              Forecast Exists:
              <b>
                ${yesNo84FLTest(
                  bridge?.forecastExists
                )}
              </b>
            </div>


            <div>
              Forecast Valid:
              <b>
                ${yesNo84FLTest(
                  bridge?.forecastValid
                )}
              </b>
            </div>


            <div>
              Province:
              <b>
                ${safeText84FLTest(
                  bridge?.forecastProvince
                )}
              </b>
            </div>


            <div>
              Window Size:
              <b>
                ${safeText84FLTest(
                  bridge?.forecastWindowSize
                )}
              </b>
            </div>


            <div>
              Prize Count:
              <b>
                ${safeText84FLTest(
                  bridge?.forecastPrizeCount
                )}
              </b>
            </div>


            <div>
              Mapping Ready:
              <b>
                ${yesNo84FLTest(
                  bridge?.mappingReady
                )}
              </b>
            </div>

          </div>

        </div>


        <div class="fix84fl-section">

          <div class="fix84fl-section-label">

            ③ 8.4F-LH LIFECYCLE HOOK

          </div>


          <div class="fix84fl-locks">

            <div>
              Hook Script Loaded:
              <b>
                ${yesNo84FLTest(
                  hookScriptLoaded
                )}
              </b>
            </div>


            <div>
              Hook Inspector Available:
              <b>
                ${yesNo84FLTest(
                  hookInspectorAvailable
                )}
              </b>
            </div>


            <div>
              Lifecycle Hook:
              <b>
                ${hookStatus84FLTest(
                  hookResult
                )}
              </b>
            </div>


            <div>
              Hook Reason:
              <b>
                ${safeText84FLTest(
                  hookResult?.reason ||
                  'HOOK_RESULT_NOT_AVAILABLE'
                )}
              </b>
            </div>


            <div>
              Failed Stage:
              <b>
                ${safeText84FLTest(
                  hookResult?.failedStage
                )}
              </b>
            </div>


            <div>
              Stage Reason:
              <b>
                ${safeText84FLTest(
                  hookResult?.stageReason
                )}
              </b>
            </div>

          </div>

        </div>


        <div class="fix84fl-section">

          <div class="fix84fl-section-label">

            ④ SAFETY LOCKS

          </div>


          <div class="fix84fl-locks">

            <div>
              Write Authorized:
              <b>
                ${yesNo84FLTest(
                  lifecycle?.writeAuthorized
                )}
              </b>
            </div>


            <div>
              Production Write:
              <b>
                ${yesNo84FLTest(
                  lifecycle?.productionWrite
                )}
              </b>
            </div>


            <div>
              Storage Write:
              <b>
                ${yesNo84FLTest(
                  lifecycle?.storageWrite
                )}
              </b>
            </div>

          </div>

        </div>


        <div
          class="${
            hardLocksSafe
              ? 'fix84fl-safe'
              : 'fix84fl-danger'
          }"
        >

          ${
            hardLocksSafe
              ? '🔒 SAFETY LOCKS VERIFIED — ZERO WRITE'
              : '⚠️ SAFETY LOCK CHECK FAILED'
          }

        </div>


      </div>

    `;

  }


  /* ======================================================================
     3. 8.4F MAPPING DIAGNOSIS
     ====================================================================== */

  function runMappingDiagnosisUI84F() {

    const output =
      document.getElementById(
        'fix03d59-84f-diagnosis-output'
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

        <div class="fix84fl-error">

          ❌ LAST_FIX03D59_STEP84F
          chưa tồn tại.

          <br><br>

          Hãy bấm
          <b>RUN FINAL LIFECYCLE TEST</b>
          trước rồi chạy Diagnosis lại.

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

      <div class="fix84fl-result">

        <div class="fix84fl-section-label">

          🔎 8.4F SUMMARY

        </div>


        <div class="fix84fl-locks">

          <div>
            Passed:
            <b>
              ${yesNo84FLTest(
                result.passed
              )}
            </b>
          </div>


          <div>
            Reason:
            <b>
              ${safeText84FLTest(
                result.reason
              )}
            </b>
          </div>


          <div>
            Expected Count:
            <b>
              ${safeText84FLTest(
                result.expectedCount
              )}
            </b>
          </div>


          <div>
            Mapping Count:
            <b>
              ${safeText84FLTest(
                result.mappingCount
              )}
            </b>
          </div>


          <div>
            Counts Match:
            <b>
              ${yesNo84FLTest(
                result.countsMatch
              )}
            </b>
          </div>


          <div>
            All Mappings Valid:
            <b>
              ${yesNo84FLTest(
                result.allMappingsValid
              )}
            </b>
          </div>


          <div>
            Failed Mappings:
            <b>
              ${failed.length}
            </b>
          </div>

        </div>

      </div>

    `;


    if (!mappings.length) {

      html += `

        <div class="fix84fl-warning">

          ⚠️ Không có mapping nào để kiểm tra.

        </div>

      `;


      output.innerHTML =
        html;


      return;

    }


    mappings.forEach(
      function (
        item,
        index
      ) {

        const valid =
          item.mappingValid === true;


        html += `

          <div
            class="${
              valid
                ? 'fix84fl-mapping-ok'
                : 'fix84fl-mapping-fail'
            }"
          >

            <div
              class="fix84fl-mapping-title"
            >

              ${
                valid
                  ? '✅'
                  : '❌'
              }

              Mapping ${index + 1}

              ·

              ${safeText84FLTest(
                item.prize ||
                item.forecastPrizeKey
              )}

            </div>


            <div>
              Mapping Index:
              <b>
                ${safeText84FLTest(
                  item.mappingIndex
                )}
              </b>
            </div>


            <div>
              Province:
              <b>
                ${safeText84FLTest(
                  item.province
                )}
              </b>
            </div>


            <div>
              Forecast Province:
              <b>
                ${safeText84FLTest(
                  item.forecastProvince
                )}
              </b>
            </div>


            <div>
              Forecast Prize:
              <b>
                ${safeText84FLTest(
                  item.forecastPrizeKey
                )}
              </b>
            </div>


            <div>
              Number Count:
              <b>
                ${safeText84FLTest(
                  item.productionNumberCount
                )}
              </b>
            </div>


            <br>


            <div>
              Province Match:
              <b>
                ${yesNo84FLTest(
                  item.provinceMatch
                )}
              </b>
            </div>


            <div>
              Prize Meta Valid:
              <b>
                ${yesNo84FLTest(
                  item.prizeMetaValid
                )}
              </b>
            </div>


            <div>
              Forecast Item Valid:
              <b>
                ${yesNo84FLTest(
                  item.forecastItemValid
                )}
              </b>
            </div>


            <div>
              Number Schema Valid:
              <b>
                ${yesNo84FLTest(
                  item.numberSchemaValid
                )}
              </b>
            </div>


            <div>
              Mapping Valid:
              <b>
                ${yesNo84FLTest(
                  item.mappingValid
                )}
              </b>
            </div>

          </div>

        `;

      }
    );


    output.innerHTML =
      html;

  }


  /* ======================================================================
     4. BUILD MOBILE UI
     ====================================================================== */

  function buildLifecycleTestUI84FL() {

    if (
      document.getElementById(
        'fix03d59-84fl-test-panel'
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


    const style =
      document.createElement(
        'style'
      );


    style.textContent = `

      #fix03d59-84fl-test-panel,
      #fix03d59-84f-diagnosis-panel {

        margin:18px 0 30px;
        padding:18px;
        border-radius:20px;
        background:#20264f;
        color:white;

      }


      #fix03d59-84fl-test-panel h3,
      #fix03d59-84f-diagnosis-panel h3 {

        margin:0 0 8px;
        font-size:20px;

      }


      .fix84fl-sub {

        opacity:.72;
        font-size:13px;
        line-height:1.5;
        margin-bottom:14px;

      }


      .fix84fl-button {

        display:block;
        width:100%;
        min-height:52px;

        margin-top:14px;
        padding:14px;

        border:0;
        border-radius:14px;

        background:#ffc13d;
        color:#17182a;

        font-size:16px;
        font-weight:900;

        text-align:center;
        box-sizing:border-box;

        cursor:pointer;

      }


      .fix84fl-result {

        margin-top:16px;
        background:rgba(255,255,255,.06);
        border-radius:15px;
        padding:14px;

      }


      .fix84fl-section {

        margin-top:18px;
        padding-top:14px;

        border-top:
          1px solid
          rgba(255,255,255,.10);

      }


      .fix84fl-section-label {

        color:#ffc13d;
        font-size:13px;
        font-weight:900;
        margin-bottom:8px;

      }


      .fix84fl-state {

        font-size:22px;
        font-weight:900;
        color:#ffc13d;

      }


      .fix84fl-reason {

        margin-top:5px;
        opacity:.72;
        font-size:12px;
        word-break:break-word;

      }


      .fix84fl-grid {

        display:grid;
        grid-template-columns:1fr 1fr;
        gap:8px;
        margin-top:15px;

      }


      .fix84fl-grid div {

        padding:10px;
        border-radius:10px;
        background:rgba(0,0,0,.15);

      }


      .fix84fl-grid span {

        display:block;
        opacity:.65;
        font-size:11px;

      }


      .fix84fl-grid b {

        display:block;
        margin-top:5px;
        font-size:13px;

      }


      .fix84fl-locks {

        margin-top:8px;
        line-height:1.9;
        font-size:13px;

      }


      .fix84fl-locks b {

        word-break:break-word;

      }


      .fix84fl-safe,
      .fix84fl-danger,
      .fix84fl-error,
      .fix84fl-warning {

        margin-top:16px;
        padding:12px;
        border-radius:11px;
        font-weight:800;
        line-height:1.5;

      }


      .fix84fl-safe {

        background:
          rgba(45,200,120,.15);

      }


      .fix84fl-danger,
      .fix84fl-error {

        background:
          rgba(255,80,80,.15);

      }


      .fix84fl-warning {

        background:
          rgba(255,189,60,.12);

      }


      .fix84fl-mapping-ok,
      .fix84fl-mapping-fail {

        margin-top:12px;
        padding:14px;
        border-radius:14px;
        line-height:1.75;
        font-size:13px;

      }


      .fix84fl-mapping-ok {

        background:
          rgba(45,200,120,.10);

      }


      .fix84fl-mapping-fail {

        background:
          rgba(255,80,80,.13);

      }


      .fix84fl-mapping-title {

        font-size:16px;
        font-weight:900;
        color:#ffc13d;
        margin-bottom:8px;

      }

    `;


    document.head.appendChild(
      style
    );


    /*
     * ---------------------------------------------------------
     * LIFECYCLE PANEL
     * ---------------------------------------------------------
     */

    const lifecyclePanel =
      document.createElement(
        'div'
      );


    lifecyclePanel.id =
      'fix03d59-84fl-test-panel';


    lifecyclePanel.innerHTML = `

      <h3>

        🧪 FIX-03D5.9 — FINAL LIFECYCLE TEST

      </h3>


      <div class="fix84fl-sub">

        8.4F-L Gate → Bridge → 8.4F-LH Hook

        <br>

        READ ONLY · ZERO WRITE · FAIL CLOSED

      </div>


      <button
        id="fix03d59-84fl-test-button"
        class="fix84fl-button"
        type="button"
      >

        🧪 RUN FINAL LIFECYCLE TEST

      </button>


      <div
        id="fix03d59-84fl-test-output"
      ></div>

    `;


    settings.appendChild(
      lifecyclePanel
    );


    /*
     * ---------------------------------------------------------
     * DIAGNOSIS PANEL
     * ---------------------------------------------------------
     */

    const diagnosisPanel =
      document.createElement(
        'div'
      );


    diagnosisPanel.id =
      'fix03d59-84f-diagnosis-panel';


    diagnosisPanel.innerHTML = `

      <h3>

        🔎 8.4F MAPPING DIAGNOSIS

      </h3>


      <div class="fix84fl-sub">

        Kiểm tra mapping nào làm
        Production Forecast Mapping Preview
        thất bại.

        <br>

        READ ONLY · ZERO WRITE

      </div>


      <button
        id="fix03d59-84f-diagnosis-button"
        class="fix84fl-button"
        type="button"
      >

        🔎 RUN 8.4F DIAGNOSIS

      </button>


      <div
        id="fix03d59-84f-diagnosis-output"
      ></div>

    `;


    settings.appendChild(
      diagnosisPanel
    );


    /*
     * ---------------------------------------------------------
     * BUTTON EVENTS
     * ---------------------------------------------------------
     */

    const lifecycleButton =
      document.getElementById(
        'fix03d59-84fl-test-button'
      );


    const diagnosisButton =
      document.getElementById(
        'fix03d59-84f-diagnosis-button'
      );


    if (lifecycleButton) {

      lifecycleButton.addEventListener(
        'click',
        runLifecycleTest84FL
      );

    }


    if (diagnosisButton) {

      diagnosisButton.addEventListener(
        'click',
        runMappingDiagnosisUI84F
      );

    }

  }


  /* ======================================================================
     5. INITIALIZE
     ====================================================================== */

  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      buildLifecycleTestUI84FL
    );

  } else {

    buildLifecycleTestUI84FL();

  }


  /*
   * ---------------------------------------------------------
   * OPTIONAL GLOBAL TEST ACCESS
   * ---------------------------------------------------------
   *
   * Read-only diagnostic access only.
   */

  window.runLifecycleTest84FL =
    runLifecycleTest84FL;


  window.runMappingDiagnosisUI84F =
    runMappingDiagnosisUI84F;


  console.log(
    'FIX-03D5.9 FINAL Lifecycle + 8.4F Mapping Diagnosis loaded / READ ONLY / ZERO WRITE'
  );


})();

