/* =========================================================================
   FIX-03D5.9
   FINAL PRODUCTION CERTIFICATION MOBILE V1

   FILE:
   modules/fix03d59-final-production-certification-mobile.js

   PURPOSE:
   - Provide a mobile UI for the FINAL FIX-03D5.9 Production Certification.
   - Call ONLY the existing read-only:
       certifyFix03D59Production()
   - Display PASS / BLOCKED and exact diagnostic information.
   - Never execute forecast engine.
   - Never modify LAST_FORECAST.
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
    'FIX03D59_FINAL_PRODUCTION_CERTIFICATION_MOBILE_V1';


  const PANEL_ID =
    'fix03d59-final-production-certification-mobile-panel';


  const OUTPUT_ID =
    'fix03d59-final-production-certification-mobile-output';


  const BUTTON_ID =
    'fix03d59-final-production-certification-mobile-run';


  /*
   * =========================================================
   * 1. HELPERS
   * =========================================================
   */

  function safeText(value) {

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {

      return '--';

    }


    return String(value);

  }


  function yesNo(value) {

    return (
      value === true
        ? 'YES ✅'
        : 'NO ❌'
    );

  }


  function statusColor(value) {

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
        "
      >
        ${label}
      </div>

      <div
        style="
          padding:11px 0;
          border-bottom:
            1px solid rgba(255,255,255,.08);
          text-align:right;
          font-weight:900;
          color:${color || '#ffffff'};
          max-width:320px;
          overflow-wrap:anywhere;
        "
      >
        ${safeText(value)}
      </div>

    `;

  }


  /*
   * =========================================================
   * 2. RENDER RESULT
   * =========================================================
   */

  function renderResult(result) {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {

      return;

    }


    if (
      !result ||
      typeof result !== 'object'
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
          ❌ Certification returned no usable result.
        </div>

      `;

      return;

    }


    const certified =
      result.certified === true;


    const production =
      result.production &&
      typeof result.production === 'object'
        ? result.production
        : {};


    const gate =
      result.preCommitGate &&
      typeof result.preCommitGate === 'object'
        ? result.preCommitGate
        : {};


    const controller =
      result.controller &&
      typeof result.controller === 'object'
        ? result.controller
        : {};


    const safety =
      result.safety &&
      typeof result.safety === 'object'
        ? result.safety
        : {};


    const details =
      result.details &&
      typeof result.details === 'object'
        ? result.details
        : {};


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
            font-size:21px;
            font-weight:950;
            color:${
              certified
                ? '#8ff0bd'
                : '#ff9aab'
            };
            margin-bottom:16px;
          "
        >
          ${
            certified
              ? '✅ FINAL PRODUCTION CERTIFIED'
              : '❌ FINAL CERTIFICATION BLOCKED'
          }
        </div>


        <div
          style="
            display:grid;
            grid-template-columns:
              minmax(0,1fr)
              auto;
          "
        >

          ${rowHtml(
            'Ready',
            yesNo(
              result.ready === true
            ),
            statusColor(
              result.ready === true
            )
          )}

          ${rowHtml(
            'Passed',
            yesNo(
              result.passed === true
            ),
            statusColor(
              result.passed === true
            )
          )}

          ${rowHtml(
            'Certified',
            yesNo(certified),
            statusColor(certified)
          )}

          ${rowHtml(
            'Reason',
            result.reason
          )}

          ${rowHtml(
            'Version',
            result.version
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
              font-weight:950;
              margin-bottom:10px;
            "
          >
            PRODUCTION
          </div>


          <div
            style="
              display:grid;
              grid-template-columns:
                minmax(0,1fr)
                auto;
            "
          >

            ${rowHtml(
              'Selected Province',
              production.selectedProvince ||
              details.selectedProvince
            )}

            ${rowHtml(
              'Forecast Province',
              production.forecastProvince ||
              details.forecastProvince
            )}

            ${rowHtml(
              'Window Size',
              production.windowSize ||
              details.windowSize
            )}

            ${rowHtml(
              'Forecast Item Count',
              production.forecastItemCount ||
              details.actual
            )}

            ${rowHtml(
              'Pair Formula Count',
              production.pairFormulaCount
            )}

          </div>

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
              font-weight:950;
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
                auto;
            "
          >

            ${rowHtml(
              'Gate Ready',
              gate.ready === undefined
                ? '--'
                : yesNo(
                    gate.ready === true
                  ),
              gate.ready === undefined
                ? null
                : statusColor(
                    gate.ready === true
                  )
            )}

            ${rowHtml(
              'Gate Passed',
              gate.passed === undefined
                ? '--'
                : yesNo(
                    gate.passed === true
                  ),
              gate.passed === undefined
                ? null
                : statusColor(
                    gate.passed === true
                  )
            )}

            ${rowHtml(
              'Gate Authorized',
              gate.authorized === undefined
                ? '--'
                : yesNo(
                    gate.authorized === true
                  ),
              gate.authorized === undefined
                ? null
                : statusColor(
                    gate.authorized === true
                  )
            )}

            ${rowHtml(
              'Gate Reason',
              gate.reason
            )}

            ${rowHtml(
              'Gate Version',
              gate.version
            )}

          </div>

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
              font-weight:950;
              margin-bottom:10px;
            "
          >
            COMMIT CONTROLLER
          </div>


          <div
            style="
              display:grid;
              grid-template-columns:
                minmax(0,1fr)
                auto;
            "
          >

            ${rowHtml(
              'Controller Ready',
              controller.ready === undefined
                ? '--'
                : yesNo(
                    controller.ready === true
                  ),
              controller.ready === undefined
                ? null
                : statusColor(
                    controller.ready === true
                  )
            )}

            ${rowHtml(
              'Controller Source',
              controller.source
            )}

            ${rowHtml(
              'Function Available',
              controller.functionAvailable ===
                undefined
                ? '--'
                : yesNo(
                    controller.functionAvailable ===
                      true
                  ),
              controller.functionAvailable ===
                undefined
                ? null
                : statusColor(
                    controller.functionAvailable ===
                      true
                  )
            )}

          </div>

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
              font-weight:950;
              margin-bottom:10px;
            "
          >
            SAFETY
          </div>


          <div
            style="
              display:grid;
              grid-template-columns:
                minmax(0,1fr)
                auto;
            "
          >

            ${rowHtml(
              'Read Only',
              yesNo(
                safety.readOnly === true
              ),
              statusColor(
                safety.readOnly === true
              )
            )}

            ${rowHtml(
              'Engine Execution',
              safety.engineExecution === false
                ? 'NO ✅'
                : 'YES ❌',
              safety.engineExecution === false
                ? '#8ff0bd'
                : '#ff9aab'
            )}

            ${rowHtml(
              'Production Write',
              safety.productionWrite === false
                ? 'NO ✅'
                : 'YES ❌',
              safety.productionWrite === false
                ? '#8ff0bd'
                : '#ff9aab'
            )}

            ${rowHtml(
              'Storage Write',
              safety.storageWrite === false
                ? 'NO ✅'
                : 'YES ❌',
              safety.storageWrite === false
                ? '#8ff0bd'
                : '#ff9aab'
            )}

            ${rowHtml(
              'savePrediction()',
              safety.savePrediction === false
                ? 'NO ✅'
                : 'YES ❌',
              safety.savePrediction === false
                ? '#8ff0bd'
                : '#ff9aab'
            )}

            ${rowHtml(
              'LAST_FORECAST Modified',
              safety.lastForecastModified === false
                ? 'NO ✅'
                : 'YES ❌',
              safety.lastForecastModified === false
                ? '#8ff0bd'
                : '#ff9aab'
            )}

          </div>

        </div>


        ${
          certified
            ? ''
            : `

              <div
                style="
                  margin-top:18px;
                  padding:14px;
                  border-radius:14px;
                  background:rgba(248,113,113,.12);
                  color:#ffd3da;
                  font-size:13px;
                  font-weight:800;
                  line-height:1.6;
                  overflow-wrap:anywhere;
                "
              >
                BLOCK REASON:
                <br>
                ${safeText(
                  result.reason
                )}
              </div>

            `
        }


        <div
          style="
            margin-top:18px;
            padding:14px;
            border-radius:14px;
            background:rgba(52,211,153,.10);
            color:#caffdf;
            font-size:13px;
            font-weight:850;
            line-height:1.65;
          "
        >
          🔒 READ ONLY
          <br>
          🔒 NO ENGINE EXECUTION
          <br>
          🔒 ZERO PRODUCTION WRITE
          <br>
          🔒 ZERO STORAGE WRITE
          <br>
          🔒 NO savePrediction()
          <br>
          🔒 LAST_FORECAST NOT MODIFIED
        </div>

      </div>

    `;

  }


  /*
   * =========================================================
   * 3. RUN FINAL CERTIFICATION
   * =========================================================
   */

  function runFinalCertificationMobile() {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {

      return;

    }


    const certifier =
      window
        .certifyFix03D59Production;


    if (
      typeof certifier !==
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
          ❌ FINAL CERTIFICATION CORE NOT AVAILABLE
          <br><br>
          Function:
          <b>certifyFix03D59Production</b>
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
          font-weight:850;
        "
      >
        🔎 Running FINAL read-only Production Certification...
      </div>

    `;


    try {

      const result =
        certifier();


      renderResult(result);


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
          ❌ FINAL CERTIFICATION EXECUTION ERROR
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
   * 4. BUILD MOBILE PANEL
   * =========================================================
   */

  function buildFinalCertificationMobilePanel() {

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

      'border:1px solid rgba(143,240,189,.35)',

      'color:#ffffff',

      'box-sizing:border-box'

    ].join(';');


    const coreLoaded =
      typeof window
        .certifyFix03D59Production ===
      'function';


    const gateLoaded =
      typeof window
        .inspectFix03D59ProductionPreCommit ===
      'function';


    const controllerLoaded =
      typeof window
        .inspectFix03D59ProductionCommitController ===
      'function';


    panel.innerHTML = `

      <div
        style="
          font-size:25px;
          font-weight:950;
          line-height:1.25;
        "
      >
        🏁 Final Production Certification
      </div>


      <div
        style="
          margin-top:10px;
          color:rgba(255,255,255,.70);
          line-height:1.6;
          font-size:15px;
        "
      >
        Final read-only certification of the
        FIX-03D5.9 Production Forecast chain.
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
          line-height:1.9;
        "
      >

        Certification Core:
        <b
          style="
            color:${
              coreLoaded
                ? '#8ff0bd'
                : '#ff9aab'
            };
          "
        >
          ${
            coreLoaded
              ? 'YES ✅'
              : 'NO ❌'
          }
        </b>

        <br>

        Pre-Commit Gate:
        <b
          style="
            color:${
              gateLoaded
                ? '#8ff0bd'
                : '#ff9aab'
            };
          "
        >
          ${
            gateLoaded
              ? 'YES ✅'
              : 'NO ❌'
          }
        </b>

        <br>

        Commit Controller:
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
          min-height:70px;
          margin-top:20px;
          padding:16px;
          border-radius:18px;
          background:
            linear-gradient(
              90deg,
              #8ff0bd,
              #ffbd3c
            );
          color:#17182a;
          font-size:17px;
          font-weight:950;
          text-align:center;
          box-sizing:border-box;
          cursor:pointer;
        "
      >
        🏁 RUN FINAL PRODUCTION CERTIFICATION
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
          Chưa chạy Final Certification.
        </div>

      </div>

    `;


    settings.appendChild(panel);


    const button =
      document.getElementById(
        BUTTON_ID
      );


    if (!button) {

      return;

    }


    button.addEventListener(
      'click',
      runFinalCertificationMobile
    );


    button.addEventListener(
      'keydown',
      function (event) {

        if (
          event.key === 'Enter' ||
          event.key === ' '
        ) {

          event.preventDefault();

          runFinalCertificationMobile();

        }

      }
    );

  }


  /*
   * =========================================================
   * 5. INITIALIZE
   * =========================================================
   */

  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      buildFinalCertificationMobilePanel,
      {
        once: true
      }
    );

  } else {

    window.setTimeout(
      buildFinalCertificationMobilePanel,
      300
    );

  }


  /*
   * =========================================================
   * 6. PUBLIC API
   * =========================================================
   */

  window
    .runFix03D59FinalProductionCertificationMobile =
    runFinalCertificationMobile;


  window
    .rebuildFix03D59FinalProductionCertificationMobile =
    buildFinalCertificationMobilePanel;


  window
    .FIX03D59_FINAL_PRODUCTION_CERTIFICATION_MOBILE_VERSION =
    VERSION;


  window
    .FIX03D59_FINAL_PRODUCTION_CERTIFICATION_MOBILE_LOADED =
    true;


  console.log(
    'FIX-03D5.9 Final Production Certification Mobile V1 loaded / READ ONLY / ZERO WRITE'
  );

})();
