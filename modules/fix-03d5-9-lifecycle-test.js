/* =========================================================================
   FIX-03D5.9 STEP 8.4F-L / 8.4F-LH
   MOBILE LIFECYCLE TEST

   PURPOSE:
   - Test the rebuilt 8.4F-L lifecycle gate.
   - Verify the read-only lifecycle bridge.
   - Invoke the rebuilt 8.4F-LH hook after the gate.
   - Display results directly on mobile.
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


  /*
   * ---------------------------------------------------------
   * DISPLAY HELPERS
   * ---------------------------------------------------------
   */

  function yesNo84FLTest(
    value
  ) {

    return value
      ? 'YES ✅'
      : 'NO ❌';

  }


  function safeText84FLTest(
    value
  ) {

    return String(
      value ?? '--'
    )
      .replace(
        /&/g,
        '&amp;'
      )
      .replace(
        /</g,
        '&lt;'
      )
      .replace(
        />/g,
        '&gt;'
      );

  }


  function hookStatus84FLTest(
    hook
  ) {

    if (
      !hook
    ) {

      return 'NOT AVAILABLE ⚠️';

    }


    return (
      hook.ready === true &&
      hook.passed === true
    )
      ? 'PASS ✅'
      : 'FAILED ❌';

  }


  /*
   * ---------------------------------------------------------
   * MAIN TEST
   * ---------------------------------------------------------
   */

  function runLifecycleTest84FL() {

    const output =
      document.getElementById(
        'fix03d59-84fl-test-output'
      );


    if (
      !output
    ) {

      return;

    }


    /*
     * ---------------------------------------------------------
     * 1. VERIFY LIFECYCLE GATE
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
     * 2. RUN GATE
     * ---------------------------------------------------------
     *
     * The gate inspects Production state and publishes
     * LAST_FIX03D59_STEP84FL_BRIDGE.
     */

    let lifecycle;


    try {

      lifecycle =
        lifecycleInspector();

    } catch (
      error
    ) {

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
     * 3. READ BRIDGE
     * ---------------------------------------------------------
     */

    const bridge =
      window
        .LAST_FIX03D59_STEP84FL_BRIDGE ||
      null;


    /*
     * ---------------------------------------------------------
     * 4. VERIFY HOOK
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
     * 5. RUN HOOK
     * ---------------------------------------------------------
     *
     * IMPORTANT:
     *
     * Gate has already run above.
     * Therefore a current bridge snapshot exists before
     * the explicit hook inspection.
     */

    let hookResult =
      null;


    if (
      hookInspectorAvailable
    ) {

      try {

        hookResult =
          hookInspector();

      } catch (
        error
      ) {

        hookResult = {

          ready:
            false,

          passed:
            false,

          reason:
            'TEST_HOOK_EXCEPTION',

          stageReason:
            error &&
            error.message
              ? error.message
              : String(
                  error
                ),

          writeAuthorized:
            false,

          productionWrite:
            false,

          storageWrite:
            false,

          integrationPerformed:
            false,

          savePredictionCalled:
            false,

          forecastCreated:
            false,

          forecastModified:
            false,

          candidateModified:
            false,

          readOnly:
            true,

          failClosed:
            true

        };

      }

    }


    /*
     * ---------------------------------------------------------
     * 6. SAFETY LOCK VERIFICATION
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
     * 7. DISPLAY
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
                  Boolean(
                    bridge
                  )
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


  /*
   * ---------------------------------------------------------
   * BUILD MOBILE UI
   * ---------------------------------------------------------
   */

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


    if (
      !settings
    ) {

      return;

    }


    const style =
      document.createElement(
        'style'
      );


    style.textContent = `

      #fix03d59-84fl-test-panel {
        margin: 18px 0 30px;
        padding: 18px;
        border-radius: 20px;
        background: #20264f;
        color: white;
      }


      #fix03d59-84fl-test-panel h3 {
        margin: 0 0 8px;
        font-size: 20px;
      }


      .fix84fl-sub {
        opacity: .72;
        font-size: 13px;
        line-height: 1.5;
        margin-bottom: 14px;
      }


      #fix03d59-84fl-test-button {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;

        width: 100% !important;
        min-height: 52px !important;

        margin: 14px 0 0 !important;
        padding: 14px !important;

        border: 0 !important;
        border-radius: 14px !important;

        background: #ffc13d !important;
        color: #17182a !important;

        font-size: 16px !important;
        font-weight: 800 !important;

        position: relative !important;
        z-index: 10 !important;

        pointer-events: auto !important;
      }


      #fix03d59-84fl-test-output {
        margin-top: 16px;
      }


      .fix84fl-result {
        background: rgba(255,255,255,.06);
        border-radius: 15px;
        padding: 14px;
      }


      .fix84fl-section {
        margin-top: 18px;
        padding-top: 14px;
        border-top:
          1px solid
          rgba(255,255,255,.10);
      }


      .fix84fl-section-label {
        color: #ffc13d;
        font-size: 13px;
        font-weight: 900;
        margin-bottom: 8px;
      }


      .fix84fl-state {
        font-size: 22px;
        font-weight: 900;
        color: #ffc13d;
      }


      .fix84fl-reason {
        margin-top: 5px;
        opacity: .72;
        font-size: 12px;
        word-break: break-word;
      }


      .fix84fl-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-top: 15px;
      }


      .fix84fl-grid div {
        padding: 10px;
        border-radius: 10px;
        background: rgba(0,0,0,.15);
      }


      .fix84fl-grid span {
        display: block;
        opacity: .65;
        font-size: 11px;
      }


      .fix84fl-grid b {
        display: block;
        margin-top: 5px;
        font-size: 13px;
      }


      .fix84fl-locks {
        margin-top: 8px;
        line-height: 1.9;
        font-size: 13px;
      }


      .fix84fl-locks b {
        word-break: break-word;
      }


      .fix84fl-safe,
      .fix84fl-danger,
      .fix84fl-error {
        margin-top: 16px;
        padding: 12px;
        border-radius: 11px;
        font-weight: 800;
        line-height: 1.5;
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

    `;


    document.head.appendChild(
      style
    );


    const panel =
      document.createElement(
        'div'
      );


    panel.id =
      'fix03d59-84fl-test-panel';


    panel.innerHTML = `

      <h3>
        🧪 FIX-03D5.9 — FINAL LIFECYCLE TEST
      </h3>


      <div class="fix84fl-sub">

        8.4F-L Gate → Bridge → 8.4F-LH Hook
        <br>
        READ ONLY · ZERO WRITE · FAIL CLOSED

      </div>


      <div
        id="fix03d59-84fl-test-button"
        role="button"
        tabindex="0"
      >

        🧪 RUN FINAL LIFECYCLE TEST

      </div>


      <div
        id="fix03d59-84fl-test-output"
      ></div>

    `;


    settings.appendChild(
      panel
    );


    const testControl =
      document.getElementById(
        'fix03d59-84fl-test-button'
      );


    if (
      !testControl
    ) {

      return;

    }


    testControl.addEventListener(
      'click',
      runLifecycleTest84FL
    );


    testControl.addEventListener(
      'keydown',
      function (
        event
      ) {

        if (
          event.key === 'Enter' ||
          event.key === ' '
        ) {

          event.preventDefault();

          runLifecycleTest84FL();

        }

      }
    );

  }

  /*
   * ---------------------------------------------------------
   * MOBILE 8.4F MAPPING DIAGNOSTIC
   * ---------------------------------------------------------
   */

  function runMappingDiagnostic84FMobile() {

    const output =
      document.getElementById(
        'fix03d59-84f-diagnose-output'
      );

    if (!output) {
      return;
    }

    const result =
      window.LAST_FIX03D59_STEP84F ||
      null;

    if (!result) {

      output.innerHTML = `
        <div class="fix84fl-error">
          ❌ Không có LAST_FIX03D59_STEP84F.
          <br><br>
          Hãy bấm RUN FINAL LIFECYCLE TEST trước.
        </div>
      `;

      return;
    }

    const mappings =
      Array.isArray(result.mappings)
        ? result.mappings
        : [];

    const failed =
      mappings.filter(
        item =>
          item.mappingValid !== true
      );

    const rows =
      mappings.map(
        item => {

          const ok =
            item.mappingValid === true;

          return `
            <div
              style="
                margin-top:10px;
                padding:12px;
                border-radius:12px;
                background:rgba(0,0,0,.15);
              "
            >

              <div
                style="
                  font-weight:900;
                  margin-bottom:7px;
                  color:${ok ? '#65e6a5' : '#ff7b7b'};
                "
              >
                ${safeText84FLTest(
                  item.prize ||
                  item.forecastPrizeKey ||
                  ('Mapping ' + item.mappingIndex)
                )}

                ${ok ? '✅' : '❌'}
              </div>

              <div>
                Index:
                <b>${safeText84FLTest(
                  item.mappingIndex
                )}</b>
              </div>

              <div>
                Province:
                <b>${safeText84FLTest(
                  item.province
                )}</b>
              </div>

              <div>
                Forecast Province:
                <b>${safeText84FLTest(
                  item.forecastProvince
                )}</b>
              </div>

              <div>
                Forecast Prize:
                <b>${safeText84FLTest(
                  item.forecastPrizeKey
                )}</b>
              </div>

              <div>
                Number Count:
                <b>${safeText84FLTest(
                  item.productionNumberCount
                )}</b>
              </div>

              <div>
                Province Match:
                <b>${yesNo84FLTest(
                  item.provinceMatch === true
                )}</b>
              </div>

              <div>
                Prize Meta Valid:
                <b>${yesNo84FLTest(
                  item.prizeMetaValid === true
                )}</b>
              </div>

              <div>
                Forecast Item Valid:
                <b>${yesNo84FLTest(
                  item.forecastItemValid === true
                )}</b>
              </div>

              <div>
                Number Schema Valid:
                <b>${yesNo84FLTest(
                  item.numberSchemaValid === true
                )}</b>
              </div>

              <div>
                Mapping Valid:
                <b>${yesNo84FLTest(
                  item.mappingValid === true
                )}</b>
              </div>

            </div>
          `;

        }
      )
      .join('');

    output.innerHTML = `

      <div class="fix84fl-result">

        <div class="fix84fl-section-label">
          🔎 8.4F MAPPING DIAGNOSIS
        </div>

        <div class="fix84fl-locks">

          <div>
            8.4F Passed:
            <b>${yesNo84FLTest(
              result.passed === true
            )}</b>
          </div>

          <div>
            Reason:
            <b>${safeText84FLTest(
              result.reason
            )}</b>
          </div>

          <div>
            Expected Count:
            <b>${safeText84FLTest(
              result.expectedCount
            )}</b>
          </div>

          <div>
            Mapping Count:
            <b>${safeText84FLTest(
              result.mappingCount
            )}</b>
          </div>

          <div>
            Counts Match:
            <b>${yesNo84FLTest(
              result.countsMatch === true
            )}</b>
          </div>

          <div>
            All Mappings Valid:
            <b>${yesNo84FLTest(
              result.allMappingsValid === true
            )}</b>
          </div>

          <div>
            Failed Mappings:
            <b>${failed.length}</b>
          </div>

        </div>

        ${rows || `
          <div class="fix84fl-error">
            ⚠️ Không có mapping nào để kiểm tra.
          </div>
        `}

      </div>
    `;

  }


  function addMappingDiagnostic84FMobile() {

    const panel =
      document.getElementById(
        'fix03d59-84fl-test-panel'
      );

    if (!panel) {
      return;
    }

    if (
      document.getElementById(
        'fix03d59-84f-diagnose-button'
      )
    ) {
      return;
    }

    const button =
      document.createElement(
        'div'
      );

    button.id =
      'fix03d59-84f-diagnose-button';

    button.setAttribute(
      'role',
      'button'
    );

    button.setAttribute(
      'tabindex',
      '0'
    );

    button.style.cssText = `
      width:100%;
      margin-top:14px;
      padding:14px;
      border-radius:14px;
      background:#65e6a5;
      color:#17182a;
      font-size:16px;
      font-weight:900;
      text-align:center;
      box-sizing:border-box;
    `;

    button.textContent =
      '🔍 DIAGNOSE 8.4F MAPPING';


    const output =
      document.createElement(
        'div'
      );

    output.id =
      'fix03d59-84f-diagnose-output';

    output.style.marginTop =
      '16px';


    panel.appendChild(
      button
    );

    panel.appendChild(
      output
    );


    button.addEventListener(
      'click',
      runMappingDiagnostic84FMobile
    );


    button.addEventListener(
      'keydown',
      function (event) {

        if (
          event.key === 'Enter' ||
          event.key === ' '
        ) {

          event.preventDefault();

          runMappingDiagnostic84FMobile();

        }

      }
    );

  }
   
  /*
   * ---------------------------------------------------------
   * INITIALIZE
   * ---------------------------------------------------------
   */

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


  console.log(
    'FIX-03D5.9 FINAL Lifecycle Mobile Test loaded / READ ONLY / ZERO WRITE'
  );

})();

function diagnoseMapping84F() {

  const result =
    window.LAST_FIX03D59_STEP84F ||
    null;

  console.log(
    '=========================================='
  );

  console.log(
    '🔎 FIX-03D5.9 — 8.4F MAPPING DIAGNOSIS'
  );

  console.log(
    '=========================================='
  );

  if (!result) {

    console.log(
      '❌ Không có LAST_FIX03D59_STEP84F'
    );

    return null;
  }

  console.log(
    '8.4F passed:',
    result.passed
  );

  console.log(
    'reason:',
    result.reason
  );

  console.log(
    'expectedCount:',
    result.expectedCount
  );

  console.log(
    'mappingCount:',
    result.mappingCount
  );

  console.log(
    'countsMatch:',
    result.countsMatch
  );

  console.log(
    'allMappingsValid:',
    result.allMappingsValid
  );

  console.log(
    '------------------------------------------'
  );

  const mappings =
    Array.isArray(result.mappings)
      ? result.mappings
      : [];

  if (!mappings.length) {

    console.log(
      '⚠️ Không có mapping nào để kiểm tra.'
    );

    return result;
  }

  console.table(
    mappings.map(
      item => ({

        index:
          item.mappingIndex,

        prize:
          item.prize,

        province:
          item.province,

        forecastProvince:
          item.forecastProvince,

        forecastPrize:
          item.forecastPrizeKey,

        numberCount:
          item.productionNumberCount,

        provinceMatch:
          item.provinceMatch,

        prizeMetaValid:
          item.prizeMetaValid,

        forecastItemValid:
          item.forecastItemValid,

        numberSchemaValid:
          item.numberSchemaValid,

        mappingValid:
          item.mappingValid

      })
    )
  );

  const failed =
    mappings.filter(
      item =>
        item.mappingValid !== true
    );

  console.log(
    '------------------------------------------'
  );

  console.log(
    'FAILED MAPPINGS:',
    failed.length
  );

  if (failed.length) {

    console.table(
      failed.map(
        item => ({

          index:
            item.mappingIndex,

          prize:
            item.prize,

          provinceMatch:
            item.provinceMatch,

          prizeMetaValid:
            item.prizeMetaValid,

          forecastItemValid:
            item.forecastItemValid,

          numberSchemaValid:
            item.numberSchemaValid

        })
      )
    );

  } else {

    console.log(
      '✅ Không phát hiện mapping lỗi.'
    );

  }

  return {
    result,
    failed
  };
}

/* =========================================================================
   FIX-03D5.9 — MOBILE 8.4F MAPPING DIAGNOSIS
   DISPLAY ONLY / READ ONLY / ZERO WRITE
   ========================================================================= */

(function () {

  'use strict';


  function safeDiag84F(value) {

    return String(
      value ?? '--'
    )
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  }


  function yesNoDiag84F(value) {

    return value === true
      ? 'YES ✅'
      : 'NO ❌';

  }


  function buildMappingDiagnosisUI84F() {

    if (
      document.getElementById(
        'fix03d59-84f-diagnosis-panel'
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
      document.createElement('div');


    panel.id =
      'fix03d59-84f-diagnosis-panel';


    panel.style.cssText = `
      margin:18px 0 30px;
      padding:18px;
      border-radius:20px;
      background:#20264f;
      color:white;
    `;


    panel.innerHTML = `

      <h3 style="
        margin:0 0 8px;
        font-size:20px;
      ">
        🔎 8.4F MAPPING DIAGNOSIS
      </h3>


      <div style="
        opacity:.72;
        font-size:13px;
        line-height:1.5;
      ">
        Kiểm tra chính xác mapping nào làm
        Production Forecast Mapping Preview thất bại.
        <br>
        READ ONLY · ZERO WRITE
      </div>


      <button
        id="fix03d59-84f-diagnosis-button"
        type="button"
        style="
          width:100%;
          margin-top:14px;
          padding:14px;
          border:0;
          border-radius:14px;
          background:#ffc13d;
          color:#17182a;
          font-size:16px;
          font-weight:800;
        "
      >
        🔎 RUN 8.4F DIAGNOSIS
      </button>


      <div
        id="fix03d59-84f-diagnosis-output"
        style="
          margin-top:16px;
        "
      ></div>

    `;


    settings.appendChild(panel);


    document
      .getElementById(
        'fix03d59-84f-diagnosis-button'
      )
      .addEventListener(
        'click',
        runMappingDiagnosisUI84F
      );

  }


  function runMappingDiagnosisUI84F() {

    const output =
      document.getElementById(
        'fix03d59-84f-diagnosis-output'
      );


    const result =
      window.LAST_FIX03D59_STEP84F ||
      null;


    if (!result) {

      output.innerHTML = `
        <div style="
          padding:14px;
          border-radius:12px;
          background:rgba(255,80,80,.15);
        ">
          ❌ LAST_FIX03D59_STEP84F
          chưa tồn tại.
          <br><br>
          Hãy chạy FINAL LIFECYCLE TEST trước,
          sau đó chạy Diagnosis lại.
        </div>
      `;

      return;

    }


    const mappings =
      Array.isArray(result.mappings)
        ? result.mappings
        : [];


    const failed =
      mappings.filter(
        item =>
          item.mappingValid !== true
      );


    let html = `

      <div style="
        padding:14px;
        border-radius:14px;
        background:rgba(255,255,255,.06);
        line-height:1.8;
      ">

        <b style="color:#ffc13d;">
          8.4F SUMMARY
        </b>

        <br><br>

        Passed:
        <b>
          ${yesNoDiag84F(result.passed)}
        </b>

        <br>

        Reason:
        <b>
          ${safeDiag84F(result.reason)}
        </b>

        <br>

        Expected Count:
        <b>
          ${safeDiag84F(result.expectedCount)}
        </b>

        <br>

        Mapping Count:
        <b>
          ${safeDiag84F(result.mappingCount)}
        </b>

        <br>

        Counts Match:
        <b>
          ${yesNoDiag84F(result.countsMatch)}
        </b>

        <br>

        All Mappings Valid:
        <b>
          ${yesNoDiag84F(result.allMappingsValid)}
        </b>

        <br>

        Failed Mappings:
        <b>
          ${failed.length}
        </b>

      </div>

    `;


    if (!mappings.length) {

      html += `

        <div style="
          margin-top:12px;
          padding:14px;
          border-radius:12px;
          background:rgba(255,189,60,.12);
        ">
          ⚠️ Không có mapping để kiểm tra.
        </div>

      `;

      output.innerHTML = html;

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

          <div style="
            margin-top:12px;
            padding:14px;
            border-radius:14px;
            background:${
              valid
                ? 'rgba(45,200,120,.10)'
                : 'rgba(255,80,80,.13)'
            };
            line-height:1.75;
          ">

            <div style="
              font-size:16px;
              font-weight:900;
              color:${
                valid
                  ? '#67e8a5'
                  : '#ff8b8b'
              };
            ">

              ${
                valid
                  ? '✅'
                  : '❌'
              }

              Mapping ${index + 1}

              · ${safeDiag84F(
                item.prize
              )}

            </div>


            Province:
            <b>
              ${safeDiag84F(
                item.province
              )}
            </b>

            <br>


            Forecast Province:
            <b>
              ${safeDiag84F(
                item.forecastProvince
              )}
            </b>

            <br>


            Forecast Prize:
            <b>
              ${safeDiag84F(
                item.forecastPrizeKey
              )}
            </b>

            <br>


            Number Count:
            <b>
              ${safeDiag84F(
                item.productionNumberCount
              )}
            </b>

            <br><br>


            Province Match:
            <b>
              ${yesNoDiag84F(
                item.provinceMatch
              )}
            </b>

            <br>


            Prize Meta Valid:
            <b>
              ${yesNoDiag84F(
                item.prizeMetaValid
              )}
            </b>

            <br>


            Forecast Item Valid:
            <b>
              ${yesNoDiag84F(
                item.forecastItemValid
              )}
            </b>

            <br>


            Number Schema Valid:
            <b>
              ${yesNoDiag84F(
                item.numberSchemaValid
              )}
            </b>

            <br>


            Mapping Valid:
            <b>
              ${yesNoDiag84F(
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


  if (
    document.readyState === 'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      buildMappingDiagnosisUI84F
    );

  } else {

    buildMappingDiagnosisUI84F();

  }


  window.runMappingDiagnosisUI84F =
    runMappingDiagnosisUI84F;


  console.log(
    'FIX-03D5.9 8.4F Mobile Mapping Diagnosis loaded / READ ONLY / ZERO WRITE'
  );

})();

