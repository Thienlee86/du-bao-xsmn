/* =========================================================================
   FIX-03D5.9
   PRODUCTION BOOTSTRAP — MOBILE V1
   RUNTIME CHAIN INSPECTOR UI

   PURPOSE:
   - Show Production Bootstrap inspection directly in Settings.
   - Call ONLY inspectFix03D59ProductionBootstrap().
   - Display function availability and RAM availability separately.
   - Identify the first missing runtime dependency.
   - Never execute any production stage.

   READ ONLY
   ZERO WRITE
   ZERO PROMOTION
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_PRODUCTION_BOOTSTRAP_MOBILE_V1';


  const PANEL_ID =
    'fix03d59-production-bootstrap-panel';


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
          stage
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
          stage
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

    if (
      document.getElementById(
        'fix03d59-production-bootstrap-style'
      )
    ) {

      return;

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

      #${PANEL_ID} .pb-button {
        width: 100%;
        margin-top: 18px;
        border: 0;
        border-radius: 17px;
        padding: 17px 10px;
        background:
          linear-gradient(
            90deg,
            #ffbd3c,
            #ff913d
          );
        color: #17182a;
        font-size: 17px;
        font-weight: 900;
      }

      #${PANEL_ID} .pb-status {
        margin-top: 15px;
        color:
          rgba(255,255,255,.75);
        line-height: 1.55;
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
        justify-content: space-between;
        align-items: flex-start;
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
   * RUN INSPECTION
   * =========================================================
   */

  function runInspection() {

    const status =
      document.getElementById(
        'fix03d59-production-bootstrap-status'
      );


    const output =
      document.getElementById(
        'fix03d59-production-bootstrap-result'
      );


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
                !result.safety
                  .executionPerformed,

              candidateCreated:
                !result.safety
                  .candidateCreated,

              canonicalWrite:
                !result.safety
                  .canonicalWrite,

              productionWrite:
                !result.safety
                  .productionWrite,

              storageWrite:
                !result.safety
                  .storageWrite,

              forecastModified:
                !result.safety
                  .forecastModified,

              savePredictionCalled:
                !result.safety
                  .savePredictionCalled
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
            missing
        };


    } catch (
      error
    ) {

      console.error(
        'Production Bootstrap Mobile:',
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

    if (
      document.getElementById(
        PANEL_ID
      )
    ) {

      return;

    }


    installStyles();


    const settings =
      document.getElementById(
        'tab-settings'
      );


    if (!settings) {

      console.warn(
        'Production Bootstrap Mobile: tab-settings not found'
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

      <div class="pb-card">

        <div class="pb-title">
          🚦 PRODUCTION BOOTSTRAP
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
          id="fix03d59-production-bootstrap-run"
        >
          🔬 INSPECT PRODUCTION RUNTIME
        </button>


        <div
          class="pb-status"
          id="fix03d59-production-bootstrap-status"
        >
          Sẵn sàng kiểm tra runtime.
        </div>

      </div>


      <div
        id="fix03d59-production-bootstrap-result"
      ></div>

    `;


    settings.appendChild(
      panel
    );


    const button =
      document.getElementById(
        'fix03d59-production-bootstrap-run'
      );


    button.addEventListener(
      'click',
      runInspection
    );

  }


  /*
   * =========================================================
   * INIT
   * =========================================================
   */

  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      buildPanel,
      {
        once: true
      }
    );

  } else {

    buildPanel();

  }


  window
    .FIX03D59_PRODUCTION_BOOTSTRAP_MOBILE_VERSION =
    VERSION;


  console.log(
    'FIX-03D5.9 Production Bootstrap Mobile V1 loaded — INSPECTION ONLY'
  );

})();
