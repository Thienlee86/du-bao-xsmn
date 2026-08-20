/* =========================================================================
   FIX-03D5.9 STEP 8.4F-L / 8.4F-LH
   MOBILE FINAL LIFECYCLE TEST
   SELF-CONTAINED DIAGNOSTIC UI

   PURPOSE:
   - Verify STEP 8.4F-L Lifecycle Gate.
   - Verify read-only lifecycle bridge.
   - Verify STEP 8.4F-LH Lifecycle Hook.
   - Diagnose STEP 8.4F Production Forecast Mapping Preview.
   - Render everything directly inside Settings on mobile.
   - Avoid dependency on external diagnostic CSS.

   SAFETY:
   - Never create LAST_FORECAST.
   - Never modify LAST_FORECAST.
   - Never modify candidates.
   - Never call savePrediction().
   - Never write production.
   - Never write storage.

   TEST ONLY
   READ ONLY
   ZERO WRITE
   FAIL CLOSED
   ========================================================================= */

(function () {

  'use strict';


  const PANEL_ID =
    'fix03d59-84fl-final-panel';

  const STYLE_ID =
    'fix03d59-84fl-final-style';

  const TEST_BUTTON_ID =
    'fix03d59-84fl-final-test-button';

  const DIAG_BUTTON_ID =
    'fix03d59-84fl-final-diagnosis-button';

  const TEST_OUTPUT_ID =
    'fix03d59-84fl-final-test-output';

  const DIAG_OUTPUT_ID =
    'fix03d59-84fl-final-diagnosis-output';


  /* =====================================================================
     1. SAFE DISPLAY HELPERS
     ===================================================================== */

  function escapeHtml84FL(value) {

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


  function yesNo84FL(value) {

    return value === true
      ? 'YES ✅'
      : 'NO ❌';

  }


  function passFail84FL(value) {

    return value === true
      ? 'PASS ✅'
      : 'FAILED ❌';

  }


  function safeReason84FL(value) {

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {

      return '--';

    }

    return escapeHtml84FL(
      value
    );

  }


  /* =====================================================================
     2. SELF-CONTAINED CSS
     ===================================================================== */

  function installStyles84FL() {

    if (
      document.getElementById(
        STYLE_ID
      )
    ) {

      return;

    }


    const style =
      document.createElement(
        'style'
      );


    style.id =
      STYLE_ID;


    style.textContent = `

      #${PANEL_ID} {

        display:block !important;
        visibility:visible !important;
        opacity:1 !important;

        width:100%;
        box-sizing:border-box;

        margin:20px 0 32px;
        padding:16px;

        border:
          1px solid
          rgba(255,193,61,.35);

        border-radius:20px;

        background:
          linear-gradient(
            145deg,
            #252b59,
            #1c2148
          );

        color:#ffffff;

        box-shadow:
          0 12px 28px
          rgba(0,0,0,.22);

      }


      #${PANEL_ID} * {

        box-sizing:border-box;

      }


      .fix84-final-title {

        margin:0 0 6px;

        color:#ffffff;

        font-size:20px;
        font-weight:900;

        line-height:1.3;

      }


      .fix84-final-sub {

        margin-bottom:16px;

        color:
          rgba(255,255,255,.68);

        font-size:12.5px;
        line-height:1.55;

      }


      .fix84-final-status {

        margin:12px 0;

        padding:10px 12px;

        border-radius:12px;

        background:
          rgba(255,255,255,.055);

        color:
          rgba(255,255,255,.78);

        font-size:12px;
        line-height:1.55;

      }


      .fix84-final-button {

        display:flex !important;
        visibility:visible !important;
        opacity:1 !important;

        align-items:center;
        justify-content:center;

        width:100% !important;
        min-height:54px !important;

        margin:10px 0 !important;
        padding:14px 12px !important;

        border:0 !important;
        border-radius:14px !important;

        background:
          linear-gradient(
            90deg,
            #ffc13d,
            #ff913d
          ) !important;

        color:#17182a !important;

        font-family:inherit !important;
        font-size:15px !important;
        font-weight:900 !important;

        line-height:1.25 !important;
        text-align:center !important;

        cursor:pointer !important;

        box-shadow:
          0 7px 18px
          rgba(255,160,50,.22) !important;

      }


      .fix84-final-button:active {

        transform:
          scale(.985);

      }


      .fix84-final-button-secondary {

        background:
          rgba(255,255,255,.09)
          !important;

        color:#ffffff !important;

        border:
          1px solid
          rgba(255,255,255,.18)
          !important;

        box-shadow:none !important;

      }


      .fix84-final-result {

        margin-top:14px;
        padding:13px;

        border-radius:14px;

        background:
          rgba(255,255,255,.055);

      }


      .fix84-final-section {

        margin-top:16px;
        padding-top:14px;

        border-top:
          1px solid
          rgba(255,255,255,.10);

      }


      .fix84-final-label {

        margin-bottom:8px;

        color:#ffc13d;

        font-size:12px;
        font-weight:900;

        letter-spacing:.2px;

      }


      .fix84-final-state {

        color:#ffc13d;

        font-size:20px;
        font-weight:900;

        word-break:break-word;

      }


      .fix84-final-reason {

        margin-top:5px;

        color:
          rgba(255,255,255,.62);

        font-size:11.5px;
        line-height:1.5;

        word-break:break-word;

      }


      .fix84-final-grid {

        display:grid;

        grid-template-columns:
          repeat(2, minmax(0, 1fr));

        gap:8px;

        margin-top:12px;

      }


      .fix84-final-box {

        min-width:0;

        padding:9px;

        border-radius:10px;

        background:
          rgba(0,0,0,.14);

      }


      .fix84-final-box span {

        display:block;

        color:
          rgba(255,255,255,.58);

        font-size:10.5px;

      }


      .fix84-final-box b {

        display:block;

        margin-top:5px;

        color:#ffffff;

        font-size:12px;

        word-break:break-word;

      }


      .fix84-final-lines {

        font-size:12px;
        line-height:1.85;

      }


      .fix84-final-lines div {

        word-break:break-word;

      }


      .fix84-final-safe,
      .fix84-final-danger,
      .fix84-final-warning,
      .fix84-final-error {

        margin-top:14px;

        padding:11px;

        border-radius:11px;

        font-size:12px;
        font-weight:800;

        line-height:1.5;

      }


      .fix84-final-safe {

        background:
          rgba(52,211,153,.13);

        color:#78e6ba;

      }


      .fix84-final-danger,
      .fix84-final-error {

        background:
          rgba(248,113,113,.13);

        color:#ff9b9b;

      }


      .fix84-final-warning {

        background:
          rgba(255,193,61,.11);

        color:#ffd77b;

      }


      .fix84-final-mapping {

        margin-top:10px;

        padding:12px;

        border-radius:12px;

        font-size:12px;
        line-height:1.7;

      }


      .fix84-final-mapping-ok {

        background:
          rgba(52,211,153,.09);

        border:
          1px solid
          rgba(52,211,153,.16);

      }


      .fix84-final-mapping-fail {

        background:
          rgba(248,113,113,.10);

        border:
          1px solid
          rgba(248,113,113,.18);

      }


      .fix84-final-mapping-title {

        margin-bottom:7px;

        color:#ffc13d;

        font-size:14px;
        font-weight:900;

      }


      @media (
        max-width:380px
      ) {

        .fix84-final-grid {

          grid-template-columns:1fr;

        }

      }

    `;


    document.head.appendChild(
      style
    );

  }


  /* =====================================================================
     3. SAFETY VERIFICATION
     ===================================================================== */

  function verifySafetyLocks84FL(
    result
  ) {

    return Boolean(

      result &&

      result.writeAuthorized === false &&

      result.productionWrite === false &&

      result.storageWrite === false &&

      result.integrationPerformed === false &&

      result.savePredictionCalled === false &&

      result.forecastCreated === false &&

      result.forecastModified === false &&

      result.candidateModified === false &&

      result.readOnly === true &&

      result.failClosed === true

    );

  }


  /* =====================================================================
     4. RUN FINAL LIFECYCLE TEST
     ===================================================================== */

  function runFinalLifecycleTest84FL() {

    const output =
      document.getElementById(
        TEST_OUTPUT_ID
      );


    if (!output) {

      return;

    }


    output.innerHTML = `

      <div class="fix84-final-status">

        ⏳ Đang kiểm tra
        Lifecycle Gate → Bridge → Hook...

      </div>

    `;


    const lifecycleInspector =
      window
        .inspectProductionForecastLifecycle84FL;


    if (
      typeof lifecycleInspector !==
      'function'
    ) {

      output.innerHTML = `

        <div class="fix84-final-error">

          ❌ Không tìm thấy
          inspectProductionForecastLifecycle84FL().

          <br><br>

          File 8.4F-L Lifecycle Gate
          chưa được tải.

        </div>

      `;

      return;

    }


    let lifecycle =
      null;


    try {

      lifecycle =
        lifecycleInspector();

    } catch (error) {

      output.innerHTML = `

        <div class="fix84-final-error">

          ❌ Lifecycle Gate exception.

          <br><br>

          ${safeReason84FL(
            error?.message ||
            error
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


    const hookInspector =
      window
        .inspectLifecycle84FLH;


    const hookAvailable =
      typeof hookInspector ===
      'function';


    let hook =
      null;


    if (
      hookAvailable
    ) {

      try {

        hook =
          hookInspector();

      } catch (error) {

        hook = {

          ready:false,
          passed:false,

          reason:
            'TEST_HOOK_EXCEPTION',

          stageReason:
            error?.message ||
            String(error),

          writeAuthorized:false,
          productionWrite:false,
          storageWrite:false,
          integrationPerformed:false,

          savePredictionCalled:false,

          forecastCreated:false,
          forecastModified:false,
          candidateModified:false,

          readOnly:true,
          failClosed:true

        };

      }

    }


    /*
     * Hook may have rebuilt 8.4F.
     * Re-run lifecycle gate once so the displayed
     * lifecycle snapshot reflects the newest 8.4F result.
     */

    try {

      lifecycle =
        lifecycleInspector();

    } catch (error) {

      /*
       * Keep previous valid lifecycle snapshot.
       */

    }


    const latestBridge =
      window
        .LAST_FIX03D59_STEP84FL_BRIDGE ||
      bridge;


    const lifecycleSafe =
      verifySafetyLocks84FL(
        lifecycle
      );


    const hookSafe =
      hook
        ? verifySafetyLocks84FL(
            hook
          )
        : false;


    const allSafe =
      lifecycleSafe &&
      (
        !hookAvailable ||
        hookSafe
      );


    const lifecyclePass =
      Boolean(
        lifecycle &&
        lifecycle.ready === true &&
        lifecycle.passed === true
      );


    const hookPass =
      Boolean(
        hook &&
        hook.ready === true &&
        hook.passed === true
      );


    output.innerHTML = `

      <div class="fix84-final-result">


        <div class="fix84-final-label">

          ① 8.4F-L LIFECYCLE GATE

        </div>


        <div class="fix84-final-state">

          ${escapeHtml84FL(
            lifecycle?.lifecycleState
          )}

        </div>


        <div class="fix84-final-reason">

          ${safeReason84FL(
            lifecycle?.reason
          )}

        </div>


        <div class="fix84-final-grid">

          <div class="fix84-final-box">

            <span>
              Gate
            </span>

            <b>
              ${passFail84FL(
                lifecyclePass
              )}
            </b>

          </div>


          <div class="fix84-final-box">

            <span>
              Forecast Exists
            </span>

            <b>
              ${yesNo84FL(
                lifecycle?.forecastExists
              )}
            </b>

          </div>


          <div class="fix84-final-box">

            <span>
              Forecast Valid
            </span>

            <b>
              ${yesNo84FL(
                lifecycle?.forecastValid
              )}
            </b>

          </div>


          <div class="fix84-final-box">

            <span>
              Mapping Preview
            </span>

            <b>
              ${yesNo84FL(
                lifecycle?.mappingPreviewExists
              )}
            </b>

          </div>


          <div class="fix84-final-box">

            <span>
              Mapping Ready
            </span>

            <b>
              ${yesNo84FL(
                lifecycle?.mappingReady
              )}
            </b>

          </div>


          <div class="fix84-final-box">

            <span>
              Lifecycle Ready
            </span>

            <b>
              ${yesNo84FL(
                lifecycle?.lifecycleReady
              )}
            </b>

          </div>

        </div>


        <div class="fix84-final-section">

          <div class="fix84-final-label">

            ② READ-ONLY BRIDGE

          </div>


          <div class="fix84-final-lines">

            <div>

              Bridge Exists:
              <b>
                ${yesNo84FL(
                  Boolean(
                    latestBridge
                  )
                )}
              </b>

            </div>


            <div>

              Forecast Exists:
              <b>
                ${yesNo84FL(
                  latestBridge
                    ?.forecastExists
                )}
              </b>

            </div>


            <div>

              Forecast Valid:
              <b>
                ${yesNo84FL(
                  latestBridge
                    ?.forecastValid
                )}
              </b>

            </div>


            <div>

              Province:
              <b>
                ${escapeHtml84FL(
                  latestBridge
                    ?.forecastProvince
                )}
              </b>

            </div>


            <div>

              Window Size:
              <b>
                ${escapeHtml84FL(
                  latestBridge
                    ?.forecastWindowSize
                )}
              </b>

            </div>


            <div>

              Prize Count:
              <b>
                ${escapeHtml84FL(
                  latestBridge
                    ?.forecastPrizeCount
                )}
              </b>

            </div>


            <div>

              Mapping Ready:
              <b>
                ${yesNo84FL(
                  latestBridge
                    ?.mappingReady
                )}
              </b>

            </div>

          </div>

        </div>


        <div class="fix84-final-section">

          <div class="fix84-final-label">

            ③ 8.4F-LH LIFECYCLE HOOK

          </div>


          <div class="fix84-final-lines">

            <div>

              Hook Script Loaded:
              <b>
                ${yesNo84FL(
                  hookLoaded
                )}
              </b>

            </div>


            <div>

              Hook Inspector Available:
              <b>
                ${yesNo84FL(
                  hookAvailable
                )}
              </b>

            </div>


            <div>

              Lifecycle Hook:
              <b>
                ${
                  hookAvailable
                    ? passFail84FL(
                        hookPass
                      )
                    : 'NOT AVAILABLE ⚠️'
                }
              </b>

            </div>


            <div>

              Hook Reason:
              <b>
                ${safeReason84FL(
                  hook?.reason
                )}
              </b>

            </div>


            <div>

              Failed Stage:
              <b>
                ${safeReason84FL(
                  hook?.failedStage
                )}
              </b>

            </div>


            <div>

              Missing Stage:
              <b>
                ${safeReason84FL(
                  hook?.missingStage
                )}
              </b>

            </div>


            <div>

              Stage Reason:
              <b>
                ${safeReason84FL(
                  hook?.stageReason
                )}
              </b>

            </div>


            <div>

              Certification Rebuilt:
              <b>
                ${yesNo84FL(
                  hook?.certificationRebuilt
                )}
              </b>

            </div>


            <div>

              Certified 8.3R:
              <b>
                ${yesNo84FL(
                  hook?.certified83R
                )}
              </b>

            </div>

          </div>

        </div>


        <div class="fix84-final-section">

          <div class="fix84-final-label">

            ④ HARD SAFETY LOCKS

          </div>


          <div class="fix84-final-lines">

            <div>

              Lifecycle Safety:
              <b>
                ${passFail84FL(
                  lifecycleSafe
                )}
              </b>

            </div>


            <div>

              Hook Safety:
              <b>
                ${
                  hookAvailable
                    ? passFail84FL(
                        hookSafe
                      )
                    : 'NOT TESTED ⚠️'
                }
              </b>

            </div>


            <div>

              Write Authorized:
              <b>
                ${yesNo84FL(
                  lifecycle
                    ?.writeAuthorized
                )}
              </b>

            </div>


            <div>

              Production Write:
              <b>
                ${yesNo84FL(
                  lifecycle
                    ?.productionWrite
                )}
              </b>

            </div>


            <div>

              Storage Write:
              <b>
                ${yesNo84FL(
                  lifecycle
                    ?.storageWrite
                )}
              </b>

            </div>


            <div>

              savePrediction Called:
              <b>
                ${yesNo84FL(
                  lifecycle
                    ?.savePredictionCalled
                )}
              </b>

            </div>


            <div>

              Forecast Modified:
              <b>
                ${yesNo84FL(
                  lifecycle
                    ?.forecastModified
                )}
              </b>

            </div>


            <div>

              Candidate Modified:
              <b>
                ${yesNo84FL(
                  lifecycle
                    ?.candidateModified
                )}
              </b>

            </div>

          </div>

        </div>


        <div
          class="${
            allSafe
              ? 'fix84-final-safe'
              : 'fix84-final-danger'
          }"
        >

          ${
            allSafe
              ? '🔒 SAFETY LOCKS VERIFIED — ZERO WRITE'
              : '⚠️ SAFETY LOCK VERIFICATION FAILED'
          }

        </div>


      </div>

    `;

  }


  /* =====================================================================
     5. RUN 8.4F MAPPING DIAGNOSIS
     ===================================================================== */

  function runMappingDiagnosis84F() {

    const output =
      document.getElementById(
        DIAG_OUTPUT_ID
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

        <div class="fix84-final-warning">

          ⚠️ LAST_FIX03D59_STEP84F
          chưa tồn tại trong RAM.

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


    const failedMappings =
      mappings.filter(
        item =>
          item?.mappingValid !==
          true
      );


    const summaryPass =
      Boolean(
        result.ready === true &&
        result.passed === true &&
        result.mappingValid === true
      );


    let html = `

      <div class="fix84-final-result">


        <div class="fix84-final-label">

          🔎 STEP 8.4F SUMMARY

        </div>


        <div class="fix84-final-grid">


          <div class="fix84-final-box">

            <span>
              STEP 8.4F
            </span>

            <b>
              ${passFail84FL(
                summaryPass
              )}
            </b>

          </div>


          <div class="fix84-final-box">

            <span>
              Mapping Valid
            </span>

            <b>
              ${yesNo84FL(
                result.mappingValid
              )}
            </b>

          </div>


          <div class="fix84-final-box">

            <span>
              Expected
            </span>

            <b>
              ${escapeHtml84FL(
                result.expectedCount
              )}
            </b>

          </div>


          <div class="fix84-final-box">

            <span>
              Actual
            </span>

            <b>
              ${escapeHtml84FL(
                result.mappingCount
              )}
            </b>

          </div>


          <div class="fix84-final-box">

            <span>
              Counts Match
            </span>

            <b>
              ${yesNo84FL(
                result.countsMatch
              )}
            </b>

          </div>


          <div class="fix84-final-box">

            <span>
              All Valid
            </span>

            <b>
              ${yesNo84FL(
                result.allMappingsValid
              )}
            </b>

          </div>

        </div>


        <div class="fix84-final-lines"
             style="margin-top:12px;">

          <div>

            Reason:
            <b>
              ${safeReason84FL(
                result.reason
              )}
            </b>

          </div>


          <div>

            Adapter Valid:
            <b>
              ${yesNo84FL(
                result.adapterValid
              )}
            </b>

          </div>


          <div>

            Boundary Valid:
            <b>
              ${yesNo84FL(
                result.boundaryValid
              )}
            </b>

          </div>


          <div>

            Forecast Valid:
            <b>
              ${yesNo84FL(
                result.forecastValid
              )}
            </b>

          </div>


          <div>

            Failed Mappings:
            <b>
              ${failedMappings.length}
            </b>

          </div>

        </div>

      </div>

    `;


    if (
      mappings.length === 0
    ) {

      html += `

        <div class="fix84-final-warning">

          ⚠️ Không có mapping
          trong STEP 8.4F result.

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
          item?.mappingValid ===
          true;


        html += `

          <div
            class="
              fix84-final-mapping
              ${
                valid
                  ? 'fix84-final-mapping-ok'
                  : 'fix84-final-mapping-fail'
              }
            "
          >

            <div
              class="fix84-final-mapping-title"
            >

              ${
                valid
                  ? '✅'
                  : '❌'
              }

              Mapping ${index + 1}

              ·

              ${escapeHtml84FL(
                item?.prize ||
                item?.forecastPrizeKey
              )}

            </div>


            <div>

              Mapping Index:
              <b>
                ${escapeHtml84FL(
                  item?.mappingIndex
                )}
              </b>

            </div>


            <div>

              Candidate ID:
              <b>
                ${escapeHtml84FL(
                  item?.candidateId
                )}
              </b>

            </div>


            <div>

              Province:
              <b>
                ${escapeHtml84FL(
                  item?.province
                )}
              </b>

            </div>


            <div>

              Forecast Province:
              <b>
                ${escapeHtml84FL(
                  item?.forecastProvince
                )}
              </b>

            </div>


            <div>

              Forecast Prize:
              <b>
                ${escapeHtml84FL(
                  item?.forecastPrizeKey
                )}
              </b>

            </div>


            <div>

              Number Count:
              <b>
                ${escapeHtml84FL(
                  item?.productionNumberCount
                )}
              </b>

            </div>


            <br>


            <div>

              Province Match:
              <b>
                ${yesNo84FL(
                  item?.provinceMatch
                )}
              </b>

            </div>


            <div>

              Prize Meta Valid:
              <b>
                ${yesNo84FL(
                  item?.prizeMetaValid
                )}
              </b>

            </div>


            <div>

              Forecast Item Valid:
              <b>
                ${yesNo84FL(
                  item?.forecastItemValid
                )}
              </b>

            </div>


            <div>

              Number Schema Valid:
              <b>
                ${yesNo84FL(
                  item?.numberSchemaValid
                )}
              </b>

            </div>


            <div>

              Mapping Valid:
              <b>
                ${yesNo84FL(
                  item?.mappingValid
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


  /* =====================================================================
     6. BUILD SELF-CONTAINED MOBILE PANEL
     ===================================================================== */

  function buildFinalPanel84FL() {

    installStyles84FL();


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

      console.warn(
        'FIX-03D5.9 FINAL TEST: tab-settings not found'
      );

      return;

    }


    const panel =
      document.createElement(
        'section'
      );


    panel.id =
      PANEL_ID;


    panel.innerHTML = `

      <div class="fix84-final-title">

        🧪 FIX-03D5.9 FINAL TEST

      </div>


      <div class="fix84-final-sub">

        Production Forecast Lifecycle

        <br>

        8.4F-L Gate
        → Read-Only Bridge
        → 8.4F-LH Hook
        → 8.4F Mapping Diagnosis

        <br><br>

        READ ONLY · ZERO WRITE · FAIL CLOSED

      </div>


      <button
        id="${TEST_BUTTON_ID}"
        type="button"
        class="fix84-final-button"
      >

        🧪 RUN FINAL LIFECYCLE TEST

      </button>


      <button
        id="${DIAG_BUTTON_ID}"
        type="button"
        class="
          fix84-final-button
          fix84-final-button-secondary
        "
      >

        🔎 RUN 8.4F MAPPING DIAGNOSIS

      </button>


      <div
        id="${TEST_OUTPUT_ID}"
      ></div>


      <div
        id="${DIAG_OUTPUT_ID}"
      ></div>

    `;


    /*
     * Put diagnostic panel at the TOP of Settings.
     *
     * This makes it immediately visible on mobile
     * and avoids having to scroll through V2.2/V2.4 panels.
     */

    settings.insertBefore(
      panel,
      settings.firstChild
    );


    const testButton =
      document.getElementById(
        TEST_BUTTON_ID
      );


    const diagnosisButton =
      document.getElementById(
        DIAG_BUTTON_ID
      );


    if (testButton) {

      testButton.addEventListener(
        'click',
        runFinalLifecycleTest84FL
      );

    }


    if (diagnosisButton) {

      diagnosisButton.addEventListener(
        'click',
        runMappingDiagnosis84F
      );

    }


    console.log(
      'FIX-03D5.9 FINAL TEST UI mounted'
    );

  }


  /* =====================================================================
     7. ROBUST INITIALIZATION
     ===================================================================== */

  function initialize84FL() {

    buildFinalPanel84FL();


    /*
     * Retry mounting briefly in case another script
     * is still constructing the Settings UI.
     *
     * UI only.
     * No production/storage write.
     */

    let attempts =
      0;


    const retry =
      window.setInterval(
        function () {

          attempts += 1;


          if (
            document.getElementById(
              PANEL_ID
            )
          ) {

            window.clearInterval(
              retry
            );

            return;

          }


          buildFinalPanel84FL();


          if (
            attempts >= 20
          ) {

            window.clearInterval(
              retry
            );

            console.warn(
              'FIX-03D5.9 FINAL TEST UI mount timeout'
            );

          }

        },
        250
      );

  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      initialize84FL,
      {
        once:true
      }
    );

  } else {

    initialize84FL();

  }


  /* =====================================================================
     8. PUBLIC DIAGNOSTIC API
     ===================================================================== */

  window.runLifecycleTest84FL =
    runFinalLifecycleTest84FL;


  window.runMappingDiagnosisUI84F =
    runMappingDiagnosis84F;


  window.FIX03D59_FINAL_TEST_UI_LOADED =
    true;


  console.log(
    'FIX-03D5.9 FINAL Lifecycle Test UI loaded / SELF-CONTAINED / READ ONLY / ZERO WRITE'
  );


})();

