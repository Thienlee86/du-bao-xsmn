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

