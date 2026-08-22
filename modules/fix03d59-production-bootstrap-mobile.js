/* =========================================================================
   FIX-03D5.9
   PRODUCTION BOOTSTRAP — MOBILE V2
   RUNTIME CHAIN INSPECTOR + DOM DIAGNOSTIC

   PURPOSE:
   - Show Production Bootstrap inspection directly in Settings.
   - Call ONLY inspectFix03D59ProductionBootstrap().
   - Display function availability and RAM availability separately.
   - Identify the first missing runtime dependency.
   - Verify the Inspect button exists and is visible on mobile.

   READ ONLY
   ZERO WRITE
   ZERO PROMOTION
   ZERO PRODUCTION EXECUTION
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_PRODUCTION_BOOTSTRAP_MOBILE_V2';


  const PANEL_ID =
    'fix03d59-production-bootstrap-panel';


  const BUTTON_ID =
    'fix03d59-production-bootstrap-run';


  const STATUS_ID =
    'fix03d59-production-bootstrap-status';


  const RESULT_ID =
    'fix03d59-production-bootstrap-result';


  const DIAGNOSTIC_ID =
    'fix03d59-production-bootstrap-diagnostic';


  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

  function yesNo(
    value
  ) {

    return value
      ? 'YES ✅'
      : 'NO ❌';

  }


  function escapeHtml(
    value
  ) {

    return String(
      value == null
        ? ''
        : value
    )
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  }


  function findFirstMissing(
    result
  ) {

    if (
      !result ||
      typeof result !== 'object'
    ) {

      return {
        type: 'BOOTSTRAP',
        stage: '--'
      };

    }


    const functionOrder = [
      'step83B',
      'step83C',
      'step83D',
      'step83E',
      'step83F',
      'step83R',
      'step84A',
      'step84B',
      'step84C',
      'step84D',
      'step84F'
    ];


    for (
      const stage
      of functionOrder
    ) {

      if (
        !result.functions ||
        result.functions[stage] !== true
      ) {

        return {
          type: 'FUNCTION',
          stage: stage
        };

      }

    }


    const ramOrder = [
      'step82C',
      'step83B',
      'step83C',
      'step83Q',
      'step83R',
      'step84A',
      'step84B',
      'step84C',
      'step84D',
      'step84E',
      'step84F'
    ];


    for (
      const stage
      of ramOrder
    ) {

      if (
        !result.ram ||
        result.ram[stage] !== true
      ) {

        return {
          type: 'RAM',
          stage: stage
        };

      }

    }


    return {
      type: 'NONE',
      stage: 'ALL_AVAILABLE'
    };

  }


  function buildRows(
    values
  ) {

    if (
      !values ||
      typeof values !== 'object'
    ) {

      return `
        <div class="pb-empty">
          No runtime information.
        </div>
      `;

    }


    return Object
      .entries(
        values
      )
      .map(
        function (
          entry
        ) {

          const key =
            entry[0];

          const value =
            entry[1];


          return `
            <div class="pb-row">

              <span class="pb-key">
                ${escapeHtml(key)}
              </span>

              <strong class="${
                value
                  ? 'pb-ok'
                  : 'pb-fail'
              }">
                ${yesNo(value)}
              </strong>

            </div>
          `;

        }
      )
      .join('');

  }


  /*
   * =========================================================
   * STYLES
   * =========================================================
   */

  function installStyles() {

    const oldStyle =
      document.getElementById(
        'fix03d59-production-bootstrap-style'
      );


    if (oldStyle) {

      oldStyle.remove();

    }


    const style =
      document.createElement(
        'style'
      );


    style.id =
      'fix03d59-production-bootstrap-style';


    style.textContent = `

      #${PANEL_ID} {
        margin: 24px 0 34px;
      }


      #${PANEL_ID} .pb-card {
        background:
          linear-gradient(
            145deg,
            rgba(28,38,82,.98),
            rgba(20,29,66,.98)
          );

        border:
          1px solid
          rgba(129,140,248,.35);

        border-radius: 24px;

        padding: 20px;

        margin-bottom: 16px;

        color: #fff;
      }


      #${PANEL_ID} .pb-title {
        font-size: 23px;
        line-height: 1.3;
        font-weight: 900;
        margin-bottom: 10px;
      }


      #${PANEL_ID} .pb-sub {
        color:
          rgba(255,255,255,.68);

        font-size: 14px;

        line-height: 1.55;
      }


      #${PANEL_ID} .pb-safety {
        margin-top: 12px;

        color: #72e6ae;

        font-weight: 800;

        line-height: 1.5;
      }


      /*
       * IMPORTANT:
       * Force button visibility during diagnostic.
       */

      #${PANEL_ID} #${BUTTON_ID} {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;

        position: relative !important;

        width: 100% !important;

        height: auto !important;
        min-height: 56px !important;

        margin: 18px 0 0 !important;

        padding: 17px 10px !important;

        border: 0 !important;

        border-radius: 17px !important;

        background:
          linear-gradient(
            90deg,
            #ffbd3c,
            #ff913d
          ) !important;

        color: #17182a !important;

        font-size: 17px !important;

        font-weight: 900 !important;

        line-height: 1.3 !important;

        pointer-events: auto !important;

        z-index: 20 !important;
      }


      #${PANEL_ID} .pb-status {
        margin-top: 15px;

        color:
          rgba(255,255,255,.75);

        line-height: 1.55;
      }


      #${PANEL_ID} .pb-diagnostic {
        margin-top: 14px;

        padding: 13px;

        border-radius: 14px;

        background:
          rgba(59,130,246,.08);

        border:
          1px solid
          rgba(96,165,250,.30);

        color:
          rgba(255,255,255,.82);

        font-size: 13px;

        line-height: 1.6;

        overflow-wrap: anywhere;
      }


      #${PANEL_ID} .pb-section {
        margin-top: 18px;
      }


      #${PANEL_ID} .pb-section-title {
        color: #ffbd3c;

        font-size: 18px;

        font-weight: 900;

        margin-bottom: 10px;
      }


      #${PANEL_ID} .pb-row {
        display: flex;

        justify-content:
          space-between;

        align-items:
          flex-start;

        gap: 12px;

        padding: 11px 0;

        border-bottom:
          1px solid
          rgba(255,255,255,.08);
      }


      #${PANEL_ID} .pb-key {
        font-weight: 700;

        color:
          rgba(255,255,255,.88);
      }


      #${PANEL_ID} .pb-ok {
        color: #72e6ae;

        white-space: nowrap;
      }


      #${PANEL_ID} .pb-fail {
        color: #ff7185;

        white-space: nowrap;
      }


      #${PANEL_ID} .pb-first-missing {
        margin-top: 18px;

        padding: 15px;

        border-radius: 15px;

        background:
          rgba(255,189,60,.08);

        border:
          1px solid
          rgba(255,189,60,.30);

        line-height: 1.55;
      }


      #${PANEL_ID} .pb-first-missing strong {
        color: #ffbd3c;
      }


      #${PANEL_ID} .pb-empty {
        color:
          rgba(255,255,255,.55);
      }

    `;


    document.head.appendChild(
      style
    );

  }


  /*
   * =========================================================
   * BUTTON DOM DIAGNOSTIC
   * =========================================================
   */

  function inspectButtonDom() {

    const diagnostic =
      document.getElementById(
        DIAGNOSTIC_ID
      );


    if (!diagnostic) {

      return null;

    }


    const button =
      document.getElementById(
        BUTTON_ID
      );


    if (!button) {

      diagnostic.innerHTML = `
        <b>🧪 MOBILE DOM DIAGNOSTIC</b>
        <br>
        Button DOM:
        <strong class="pb-fail">
          NO ❌
        </strong>
      `;


      return {
        exists: false
      };

    }


    const computed =
      window.getComputedStyle(
        button
      );


    const rect =
      button.getBoundingClientRect();


    const result = {

      exists: true,

      display:
        computed.display,

      visibility:
        computed.visibility,

      opacity:
        computed.opacity,

      width:
        Math.round(
          rect.width
        ),

      height:
        Math.round(
          rect.height
        )

    };


    diagnostic.innerHTML = `

      <b>
        🧪 MOBILE DOM DIAGNOSTIC
      </b>

      <br>

      Button DOM:
      <strong class="pb-ok">
        YES ✅
      </strong>

      <br>

      Display:
      <b>
        ${escapeHtml(
          result.display
        )}
      </b>

      <br>

      Visibility:
      <b>
        ${escapeHtml(
          result.visibility
        )}
      </b>

      <br>

      Opacity:
      <b>
        ${escapeHtml(
          result.opacity
        )}
      </b>

      <br>

      Size:
      <b>
        ${result.width}
        ×
        ${result.height}px
      </b>

    `;


    return result;

  }


  /*
   * =========================================================
   * RUN INSPECTION
   * =========================================================
   */

  function runInspection() {

    const status =
      document.getElementById(
        STATUS_ID
      );


    const output =
      document.getElementById(
        RESULT_ID
      );


    if (
      !status ||
      !output
    ) {

      return;

    }


    if (
      typeof
        window.inspectFix03D59ProductionBootstrap !==
      'function'
    ) {

      status.innerHTML =
        '❌ Production Bootstrap Inspector chưa có trong runtime.';


      output.innerHTML = `

        <div class="pb-card">

          <div class="pb-first-missing">

            <strong>
              FIRST MISSING:
            </strong>

            BOOTSTRAP INSPECTOR FUNCTION

          </div>

        </div>

      `;


      return;

    }


    try {

      const result =
        window
          .inspectFix03D59ProductionBootstrap();


      const missing =
        findFirstMissing(
          result
        );


      status.innerHTML =
        '✅ Runtime inspection completed.';


      output.innerHTML = `

        <div class="pb-card">

          <div class="pb-title">
            📡 PRODUCTION RUNTIME RESULT
          </div>


          <div class="pb-sub">

            Bootstrap:
            <b>
              ${escapeHtml(
                result.version
              )}
            </b>

            <br>

            Mode:
            <b>
              ${escapeHtml(
                result.mode
              )}
            </b>

          </div>


          <div class="pb-section">

            <div class="pb-section-title">
              🧠 ENGINE FUNCTIONS
            </div>

            ${buildRows(
              result.functions
            )}

          </div>


          <div class="pb-section">

            <div class="pb-section-title">
              💾 RAM RESULTS
            </div>

            ${buildRows(
              result.ram
            )}

          </div>


          <div class="pb-first-missing">

            <strong>
              FIRST MISSING:
            </strong>

            ${
              missing.type ===
              'NONE'
                ? 'NONE ✅ — runtime chain is present'
                : escapeHtml(
                    missing.type +
                    ' / ' +
                    missing.stage
                  )
            }

          </div>


          <div class="pb-section">

            <div class="pb-section-title">
              🔒 SAFETY
            </div>

            ${buildRows({

              executionPerformed:
                !(
                  result.safety &&
                  result.safety
                    .executionPerformed
                ),

              candidateCreated:
                !(
                  result.safety &&
                  result.safety
                    .candidateCreated
                ),

              canonicalWrite:
                !(
                  result.safety &&
                  result.safety
                    .canonicalWrite
                ),

              productionWrite:
                !(
                  result.safety &&
                  result.safety
                    .productionWrite
                ),

              storageWrite:
                !(
                  result.safety &&
                  result.safety
                    .storageWrite
                ),

              forecastModified:
                !(
                  result.safety &&
                  result.safety
                    .forecastModified
                ),

              savePredictionCalled:
                !(
                  result.safety &&
                  result.safety
                    .savePredictionCalled
                )

            })}

          </div>

        </div>

      `;


      window
        .LAST_FIX03D59_PRODUCTION_BOOTSTRAP_MOBILE =
        {

          version:
            VERSION,

          inspection:
            result,

          firstMissing:
            missing,

          buttonDiagnostic:
            inspectButtonDom()

        };


    } catch (
      error
    ) {

      console.error(
        'Production Bootstrap Mobile V2:',
        error
      );


      status.innerHTML =
        '❌ Inspection failed: ' +
        escapeHtml(
          error &&
          error.message
            ? error.message
            : error
        );

    }

  }


  /*
   * =========================================================
   * BUILD MOBILE PANEL
   * =========================================================
   */

  function buildPanel() {

    /*
     * Remove an existing Bootstrap panel.
     *
     * This is intentional for V2 diagnostic:
     * it prevents an older runtime panel from blocking
     * creation of the current V2 panel.
     */

    const oldPanel =
      document.getElementById(
        PANEL_ID
      );


    if (oldPanel) {

      oldPanel.remove();

    }


    installStyles();


    const settings =
      document.getElementById(
        'tab-settings'
      );


    if (!settings) {

      console.warn(
        'Production Bootstrap Mobile V2: tab-settings not found'
      );

      return;

    }


    const panel =
      document.createElement(
        'section'
      );


    panel.id =
      PANEL_ID;


    panel.setAttribute(
      'data-bootstrap-mobile-version',
      VERSION
    );


    panel.innerHTML = `

      <div class="pb-card">

        <div class="pb-title">
          🚦 PRODUCTION BOOTSTRAP V2
        </div>


        <div class="pb-sub">

          Kiểm tra toàn bộ runtime chain hiện có
          trước khi nối Production Execution.

          <br><br>

          Không chạy STEP.
          Không thay đổi Forecast.
          Không ghi Storage.

        </div>


        <div class="pb-safety">
          🔒 INSPECTION ONLY · ZERO WRITE
        </div>


        <button
          type="button"
          class="pb-button"
          id="${BUTTON_ID}"
        >
          🔬 INSPECT PRODUCTION RUNTIME
        </button>


        <div
          class="pb-status"
          id="${STATUS_ID}"
        >
          V2 loaded · Sẵn sàng kiểm tra runtime.
        </div>


        <div
          class="pb-diagnostic"
          id="${DIAGNOSTIC_ID}"
        >
          🧪 Đang kiểm tra Button DOM...
        </div>

      </div>


      <div
        id="${RESULT_ID}"
      ></div>

    `;


    settings.appendChild(
      panel
    );


    const button =
      document.getElementById(
        BUTTON_ID
      );


    if (!button) {

      console.error(
        'Production Bootstrap Mobile V2: button creation failed'
      );

      inspectButtonDom();

      return;

    }


    button.addEventListener(
      'click',
      runInspection
    );


    /*
     * Run diagnostic after browser layout.
     */

    window.requestAnimationFrame(
      function () {

        inspectButtonDom();

      }
    );

  }


  /*
   * =========================================================
   * INIT
   * =========================================================
   */

  function init() {

    buildPanel();

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


  window
    .FIX03D59_PRODUCTION_BOOTSTRAP_MOBILE_VERSION =
    VERSION;


  console.log(
    'FIX-03D5.9 Production Bootstrap Mobile V2 loaded — INSPECTION ONLY'
  );

})();
