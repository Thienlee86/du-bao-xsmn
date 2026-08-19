/* =========================================================================
   FIX-03D5.9 STEP 8.4F-L / 8.4F-LH
   MOBILE LIFECYCLE SNAPSHOT TEST UI

   PURPOSE:
   - Test STEP 8.4F-L directly on mobile.
   - Publish the READ-ONLY lifecycle bridge.
   - Invoke STEP 8.4F-LH only AFTER the gate snapshot exists.
   - Display Gate + Bridge + Hook results on screen.
   - No DevTools Console required.
   - Never create or modify Production Forecast.
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
      )
      .replace(
        /"/g,
        '&quot;'
      )
      .replace(
        /'/g,
        '&#039;'
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
   * RUN TEST
   * ---------------------------------------------------------
   *
   * ORDER IS IMPORTANT:
   *
   * 1. Run 8.4F-L Gate
   * 2. Gate publishes 8.4F-L Bridge
   * 3. Verify Bridge
   * 4. Invoke 8.4F-LH Snapshot Hook
   * 5. Render all results
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
     * STEP 1 — VERIFY 8.4F-L GATE
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
     * STEP 2 — RUN GATE
     * ---------------------------------------------------------
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

          ❌ Lifecycle Gate gặp lỗi.

          <br><br>

          ${safeText84FLTest(
            error?.message ||
            error
          )}

        </div>

      `;

      return;

    }


    /*
     * ---------------------------------------------------------
     * STEP 3 — READ PUBLISHED BRIDGE
     * ---------------------------------------------------------
     */

    const bridge =
      window
        .LAST_FIX03D59_STEP84FL_BRIDGE ||
      null;


    const bridgeExists =
      Boolean(
        bridge
      );


    const bridgeForecastExists =
      bridge?.forecastExists === true;


    const bridgeForecastValid =
      bridge?.forecastValid === true;


    const bridgeMappingReady =
      bridge?.mappingReady === true;


    /*
     * ---------------------------------------------------------
     * STEP 4 — VERIFY SNAPSHOT HOOK
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
     * STEP 5 — RUN SNAPSHOT HOOK
     * ---------------------------------------------------------
     *
     * IMPORTANT:
     * Hook runs only after lifecycleInspector() has published
     * the current bridge snapshot.
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
            error?.message ||
            String(
              error
            )

        };

      }

    }


    /*
     * ---------------------------------------------------------
     * SAFETY VERIFICATION
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
          8.4F-L GATE
        </div>


        <div class="fix84fl-state">

          ${safeText84FLTest(
            lifecycle.lifecycleState
          )}

        </div>


        <div class="fix84fl-reason">

          ${safeText84FLTest(
            lifecycle.reason
          )}

        </div>


        <div class="fix84fl-grid">

          <div>

            <span>
              Forecast Exists
            </span>

            <b>
              ${yesNo84FLTest(
                lifecycle.forecastExists
              )}
            </b>

          </div>


          <div>

            <span>
              Forecast Valid
            </span>

            <b>
              ${yesNo84FLTest(
                lifecycle.forecastValid
              )}
            </b>

          </div>


          <div>

            <span>
              Mapping Preview
            </span>

            <b>
              ${yesNo84FLTest(
                lifecycle.mappingPreviewExists
              )}
            </b>

          </div>


          <div>

            <span>
              Mapping Ready
            </span>

            <b>
              ${yesNo84FLTest(
                lifecycle.mappingReady
              )}
            </b>

          </div>

        </div>


        <div class="fix84fl-section">

          <div class="fix84fl-section-label">
            🌉 8.4F-L READ-ONLY BRIDGE
          </div>


          <div class="fix84fl-locks">

            <div>
              Bridge Exists:
              <b>
                ${yesNo84FLTest(
                  bridgeExists
                )}
              </b>
            </div>


            <div>
              Bridge Forecast Exists:
              <b>
                ${yesNo84FLTest(
                  bridgeForecastExists
                )}
              </b>
            </div>


            <div>
              Bridge Forecast Valid:
              <b>
                ${yesNo84FLTest(
                  bridgeForecastValid
                )}
              </b>
            </div>


            <div>
              Bridge Mapping Ready:
              <b>
                ${yesNo84FLTest(
                  bridgeMappingReady
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
              Window:
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

          </div>

        </div>


        <div class="fix84fl-section">

          <div class="fix84fl-section-label">
            🔗 8.4F-LH SNAPSHOT HOOK
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
                  (
                    hookInspectorAvailable
                      ? 'HOOK_RESULT_NOT_AVAILABLE'
                      : 'HOOK_INSPECTOR_NOT_AVAILABLE'
                  )
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
            🔒 SAFETY LOCKS
          </div>


          <div class="fix84fl-locks">

            <div>
              Write Authorized:
              <b>
                ${yesNo84FLTest(
                  lifecycle.writeAuthorized
                )}
              </b>
            </div>


            <div>
              Production Write:
              <b>
                ${yesNo84FLTest(
                  lifecycle.productionWrite
                )}
              </b>
            </div>


            <div>
              Storage Write:
              <b>
                ${yesNo84FLTest(
                  lifecycle.storageWrite
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
   * BUILD MOBILE TEST UI
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


    /*
     * ---------------------------------------------------------
     * STYLE
     * ---------------------------------------------------------
     */

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
        line-height: 1.3 !important;

        position: relative !important;
        z-index: 10 !important;

        pointer-events: auto !important;
        cursor: pointer !important;
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
        letter-spacing: .04em;
        margin-bottom: 8px;
      }


      .fix84fl-state {
        font-size: 22px;
        font-weight: 900;
        color: #ffc13d;
      }


      .fix84fl-reason {
        margin-top: 5px;
        opacity: .7;
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


    /*
     * ---------------------------------------------------------
     * PANEL
     * ---------------------------------------------------------
     */

    const panel =
      document.createElement(
        'div'
      );


    panel.id =
      'fix03d59-84fl-test-panel';


    panel.innerHTML = `

      <h3>
        🧪 FIX-03D5.9 — 8.4F-L / LH
      </h3>


      <div class="fix84fl-sub">

        Mobile Lifecycle Snapshot Test
        · READ ONLY
        · ZERO WRITE

      </div>


      <div
        id="fix03d59-84fl-test-button"
        role="button"
        tabindex="0"
      >

        🧪 TEST 8.4F-L → LH

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
   * INIT
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
    'FIX-03D5.9 STEP 8.4F-L/LH Mobile Snapshot Test loaded / TEST ONLY / ZERO WRITE'
  );

})();
