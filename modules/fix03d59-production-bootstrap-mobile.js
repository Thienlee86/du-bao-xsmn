/* =========================================================================
   FIX-03D5.9
   PRODUCTION BOOTSTRAP — MOBILE V3
   RUNTIME CHAIN INSPECTOR + LAYOUT ISOLATION DIAGNOSTIC

   PURPOSE:
   - Show Production Bootstrap inspection directly in Settings.
   - Call ONLY inspectFix03D59ProductionBootstrap().
   - Display function availability and RAM availability separately.
   - Identify the first missing runtime dependency.
   - Diagnose button / wrapper / card / panel dimensions.
   - Isolate Inspect button from external collapsing layout rules.

   READ ONLY
   ZERO WRITE
   ZERO PROMOTION
   ZERO PRODUCTION EXECUTION
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_PRODUCTION_BOOTSTRAP_MOBILE_V3';


  const PANEL_ID =
    'fix03d59-production-bootstrap-panel';

  const CARD_ID =
    'fix03d59-production-bootstrap-card';

  const BUTTON_WRAP_ID =
    'fix03d59-production-bootstrap-button-wrap';

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
        display: block !important;
        visibility: visible !important;
        position: relative !important;

        width: 100% !important;
        min-width: 0 !important;
        height: auto !important;
        min-height: 1px !important;

        margin: 24px 0 34px !important;
        padding: 0 !important;

        overflow: visible !important;

        box-sizing: border-box !important;
      }


      #${PANEL_ID},
      #${PANEL_ID} * {
        box-sizing: border-box !important;
      }


      #${CARD_ID} {
        display: block !important;
        visibility: visible !important;

        position: relative !important;

        width: 100% !important;
        min-width: 0 !important;

        height: auto !important;
        min-height: 1px !important;

        overflow: visible !important;

        background:
          linear-gradient(
            145deg,
            rgba(28,38,82,.98),
            rgba(20,29,66,.98)
          ) !important;

        border:
          1px solid
          rgba(129,140,248,.35) !important;

        border-radius: 24px !important;

        padding: 20px !important;

        margin: 0 0 16px !important;

        color: #fff !important;
      }


      #${PANEL_ID} .pb-title {
        display: block !important;

        font-size: 23px !important;
        line-height: 1.3 !important;
        font-weight: 900 !important;

        margin: 0 0 10px !important;

        color: #fff !important;
      }


      #${PANEL_ID} .pb-sub {
        display: block !important;

        color:
          rgba(255,255,255,.68) !important;

        font-size: 14px !important;

        line-height: 1.55 !important;
      }


      #${PANEL_ID} .pb-safety {
        display: block !important;

        margin-top: 12px !important;

        color: #72e6ae !important;

        font-weight: 800 !important;

        line-height: 1.5 !important;
      }


      /*
       * ---------------------------------------------------------
       * V3 BUTTON LAYOUT ISOLATION
       * ---------------------------------------------------------
       *
       * The wrapper gives the button its own normal block layout.
       * We deliberately force non-zero dimensions at both levels.
       */

      #${BUTTON_WRAP_ID} {
        display: block !important;
        visibility: visible !important;

        position: relative !important;

        width: 100% !important;
        min-width: 1px !important;

        height: auto !important;
        min-height: 64px !important;

        margin: 18px 0 0 !important;
        padding: 0 !important;

        overflow: visible !important;

        opacity: 1 !important;

        transform: none !important;

        flex: none !important;

        align-self: stretch !important;

        pointer-events: auto !important;

        z-index: 50 !important;
      }


      #${BUTTON_ID} {
        display: block !important;
        visibility: visible !important;

        position: relative !important;

        left: auto !important;
        right: auto !important;
        top: auto !important;
        bottom: auto !important;

        width: 100% !important;
        min-width: 1px !important;
        max-width: none !important;

        height: 60px !important;
        min-height: 60px !important;
        max-height: none !important;

        margin: 0 !important;

        padding: 14px 12px !important;

        border: 0 !important;

        border-radius: 17px !important;

        background:
          linear-gradient(
            90deg,
            #ffbd3c,
            #ff913d
          ) !important;

        color: #17182a !important;

        font-family: inherit !important;

        font-size: 17px !important;

        font-weight: 900 !important;

        line-height: 1.25 !important;

        text-align: center !important;

        white-space: normal !important;

        opacity: 1 !important;

        overflow: visible !important;

        transform: none !important;

        clip: auto !important;

        clip-path: none !important;

        pointer-events: auto !important;

        flex: none !important;

        z-index: 51 !important;
      }


      #${STATUS_ID} {
        display: block !important;

        margin-top: 15px !important;

        color:
          rgba(255,255,255,.75) !important;

        line-height: 1.55 !important;
      }


      #${DIAGNOSTIC_ID} {
        display: block !important;

        margin-top: 14px !important;

        padding: 13px !important;

        border-radius: 14px !important;

        background:
          rgba(59,130,246,.08) !important;

        border:
          1px solid
          rgba(96,165,250,.30) !important;

        color:
          rgba(255,255,255,.82) !important;

        font-size: 13px !important;

        line-height: 1.6 !important;

        overflow-wrap: anywhere !important;
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
   * LAYOUT DIAGNOSTIC
   * =========================================================
   */

  function inspectElement(
    element
  ) {

    if (!element) {

      return {
        exists: false
      };

    }


    const computed =
      window.getComputedStyle(
        element
      );


    const rect =
      element.getBoundingClientRect();


    return {

      exists: true,

      display:
        computed.display,

      visibility:
        computed.visibility,

      opacity:
        computed.opacity,

      position:
        computed.position,

      width:
        Math.round(
          rect.width
        ),

      height:
        Math.round(
          rect.height
        )

    };

  }


  function diagnosticRow(
    label,
    info
  ) {

    if (
      !info ||
      !info.exists
    ) {

      return `
        <div style="margin-top:10px;">

          <b>
            ${escapeHtml(label)}
          </b>

          <br>

          DOM:
          <strong class="pb-fail">
            NO ❌
          </strong>

        </div>
      `;

    }


    const hasSize =
      info.width > 0 &&
      info.height > 0;


    return `
      <div style="margin-top:10px;">

        <b>
          ${escapeHtml(label)}
        </b>

        <br>

        DOM:
        <strong class="pb-ok">
          YES ✅
        </strong>

        · Size:
        <strong class="${
          hasSize
            ? 'pb-ok'
            : 'pb-fail'
        }">
          ${info.width} × ${info.height}px
        </strong>

        <br>

        Display:
        <b>
          ${escapeHtml(
            info.display
          )}
        </b>

        · Visibility:
        <b>
          ${escapeHtml(
            info.visibility
          )}
        </b>

        <br>

        Position:
        <b>
          ${escapeHtml(
            info.position
          )}
        </b>

        · Opacity:
        <b>
          ${escapeHtml(
            info.opacity
          )}
        </b>

      </div>
    `;

  }


  function inspectLayout() {

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


    const wrapper =
      document.getElementById(
        BUTTON_WRAP_ID
      );


    const card =
      document.getElementById(
        CARD_ID
      );


    const panel =
      document.getElementById(
        PANEL_ID
      );


    const result = {

      button:
        inspectElement(
          button
        ),

      wrapper:
        inspectElement(
          wrapper
        ),

      card:
        inspectElement(
          card
        ),

      panel:
        inspectElement(
          panel
        )

    };


    diagnostic.innerHTML = `

      <b>
        🧪 MOBILE V3 LAYOUT DIAGNOSTIC
      </b>


      ${diagnosticRow(
        'BUTTON',
        result.button
      )}


      ${diagnosticRow(
        'BUTTON WRAPPER',
        result.wrapper
      )}


      ${diagnosticRow(
        'CARD',
        result.card
      )}


      ${diagnosticRow(
        'PANEL',
        result.panel
      )}

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

          layoutDiagnostic:
            inspectLayout()

        };


    } catch (
      error
    ) {

      console.error(
        'Production Bootstrap Mobile V3:',
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
        'Production Bootstrap Mobile V3: tab-settings not found'
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

      <div
        class="pb-card"
        id="${CARD_ID}"
      >

        <div class="pb-title">
          🚦 PRODUCTION BOOTSTRAP V3
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


        <div
          id="${BUTTON_WRAP_ID}"
        >

          <button
            type="button"
            id="${BUTTON_ID}"
          >
            🔬 INSPECT PRODUCTION RUNTIME
          </button>

        </div>


        <div
          class="pb-status"
          id="${STATUS_ID}"
        >
          V3 loaded · Sẵn sàng kiểm tra runtime.
        </div>


        <div
          class="pb-diagnostic"
          id="${DIAGNOSTIC_ID}"
        >
          🧪 Đang kiểm tra V3 layout...
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
        'Production Bootstrap Mobile V3: button creation failed'
      );

      inspectLayout();

      return;

    }


    button.addEventListener(
      'click',
      runInspection
    );


    /*
     * First layout pass.
     */

    window.requestAnimationFrame(
      function () {

        inspectLayout();


        /*
         * Second measurement after layout settles.
         */

        window.requestAnimationFrame(
          function () {

            const layout =
              inspectLayout();


            window
              .LAST_FIX03D59_PRODUCTION_BOOTSTRAP_MOBILE =
              {

                version:
                  VERSION,

                layoutDiagnostic:
                  layout

              };

          }
        );

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
    'FIX-03D5.9 Production Bootstrap Mobile V3 loaded — LAYOUT DIAGNOSTIC ONLY'
  );

})();

