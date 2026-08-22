/* =========================================================================
   FIX-03D5.9 — STEP 8.3B INTEGRATION GATE MOBILE V3-B8PATH
   FILE:
   modules/fix03d59-83b-integration-gate-mobile.js

   PURPOSE:
   - Run STEP 8.3B Integration Gate V3-B8PATH from mobile.
   - Display:
       Production
       -> Scope Resolver
       -> B8 Verified Path
       -> Current STEP 8.3B
       -> Comparison
       -> Boundary Gate
       -> Safety Contract
   - No DevTools required.

   IMPORTANT:
   - READ ONLY.
   - ZERO WRITE.
   - BOUNDARY ONLY.
   - NO ENGINE EXECUTION.
   - Does NOT rebuild STEP 8.3B.
   - Does NOT modify STEP 8.3B candidates.
   - Does NOT modify LAST_FORECAST.
   - Does NOT call savePrediction().
   - Does NOT write storage.
   - FAIL CLOSED.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    '83B-GATE-MOBILE-V3-B8PATH';


  const PANEL_ID =
    'fix03d59-83b-integration-gate-mobile-panel';


  const OUTPUT_ID =
    'fix03d59-83b-integration-gate-mobile-output';


  const CONTROL_ID =
    'fix03d59-83b-integration-gate-mobile-control';


  /* =========================================================
     HELPERS
     ========================================================= */

  function safeText83BGateMobile(value) {

    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {

      return '--';

    }


    if (Array.isArray(value)) {

      return value.length
        ? value.join(', ')
        : '[empty]';

    }


    if (typeof value === 'object') {

      try {

        return JSON.stringify(
          value
        );

      } catch (error) {

        return '[object]';

      }

    }


    return String(value);

  }


  function escape83BGateMobile(value) {

    return safeText83BGateMobile(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  }


  function yesNo83BGateMobile(value) {

    return value
      ? 'YES ✅'
      : 'NO ❌';

  }


  function safeNo83BGateMobile(value) {

    return value
      ? 'YES ❌'
      : 'NO ✅';

  }


  /* =========================================================
     RESOLVE GATE FUNCTION
     ========================================================= */

  function resolve83BIntegrationGateMobile() {

    try {

      if (
        typeof window
          .inspectStep83BIntegrationGate03D59 ===
        'function'
      ) {

        return {

          ready: true,

          name:
            'inspectStep83BIntegrationGate03D59',

          fn:
            window
              .inspectStep83BIntegrationGate03D59

        };

      }

    } catch (error) {

      // FAIL CLOSED

    }


    return {

      ready: false,

      name: null,

      fn: null

    };

  }


  /* =========================================================
     RENDER
     ========================================================= */

  function render83BGateMobile(
    result,
    functionName
  ) {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {

      return;

    }


    const production =
      result &&
      result.production
        ? result.production
        : {};


    const resolver =
      result &&
      result.resolver
        ? result.resolver
        : {};


    const b8Path =
      result &&
      result.b8Path
        ? result.b8Path
        : {};


    const current83B =
      result &&
      result.current83B
        ? result.current83B
        : {};


    const comparison =
      result &&
      result.comparison
        ? result.comparison
        : {};


    const gate =
      result &&
      result.gate
        ? result.gate
        : {};


    const safety =
      result &&
      result.safety
        ? result.safety
        : {};


    const boundaryReady =
      gate.boundaryReady === true;


    const productionPathReady =
      production.pathReady === true;


    const b8PreProductionPathReady =
      b8Path.preProductionPathReady ===
      true;


    let boundaryTitle =
      '🔴 BOUNDARY BLOCKED';


    if (boundaryReady) {

      if (
        b8PreProductionPathReady
      ) {

        boundaryTitle =
          '🟢 B8 PRE-PRODUCTION BOUNDARY READY';

      } else if (
        productionPathReady
      ) {

        boundaryTitle =
          '🟢 PRODUCTION BOUNDARY READY';

      } else {

        boundaryTitle =
          '🟢 BOUNDARY READY';

      }

    }


    let html = `

      <div
        style="
          margin-top:18px;
          padding:16px;
          border-radius:18px;
          background:rgba(0,0,0,.16);
          line-height:1.6;
        "
      >

        <div
          style="
            color:#ffbd3c;
            font-size:18px;
            font-weight:900;
          "
        >
          🚦 8.3B INTEGRATION GATE
        </div>

        <div style="margin-top:10px;">
          Mobile Version:
          <b>
            ${escape83BGateMobile(
              VERSION
            )}
          </b>
        </div>

        <div>
          Gate Function:
          <b>
            ${escape83BGateMobile(
              functionName
            )}
          </b>
        </div>

        <div>
          Gate Version:
          <b>
            ${escape83BGateMobile(
              result &&
              result.version
            )}
          </b>
        </div>

      </div>


      <div
        style="
          margin-top:14px;
          padding:16px;
          border-radius:18px;
          background:rgba(52,211,153,.09);
          line-height:1.65;
        "
      >

        <div
          style="
            color:#ffbd3c;
            font-size:17px;
            font-weight:900;
          "
        >
          🎯 PRODUCTION
        </div>

        <div style="margin-top:8px;">
          Forecast Exists:
          <b>
            ${yesNo83BGateMobile(
              production.forecastExists
            )}
          </b>
        </div>

        <div>
          Production Province:
          <b>
            ${escape83BGateMobile(
              production.province
            )}
          </b>
        </div>

        <div>
          Selected = Production:
          <b>
            ${yesNo83BGateMobile(
              production
                .selectedMatchesProduction
            )}
          </b>
        </div>

        <div>
          Production Path Ready:
          <b>
            ${yesNo83BGateMobile(
              production.pathReady
            )}
          </b>
        </div>

      </div>


      <div
        style="
          margin-top:14px;
          padding:16px;
          border-radius:18px;
          background:rgba(59,130,246,.10);
          line-height:1.65;
        "
      >

        <div
          style="
            color:#ffbd3c;
            font-size:17px;
            font-weight:900;
          "
        >
          🧭 SCOPE RESOLVER
        </div>

        <div style="margin-top:8px;">
          Available:
          <b>
            ${yesNo83BGateMobile(
              resolver.available
            )}
          </b>
        </div>

        <div>
          Resolver Version:
          <b>
            ${escape83BGateMobile(
              resolver.version
            )}
          </b>
        </div>

        <div>
          Ready:
          <b>
            ${yesNo83BGateMobile(
              resolver.ready
            )}
          </b>
        </div>

        <div>
          Resolved Scope:
          <b>
            ${escape83BGateMobile(
              resolver.resolvedScope
            )}
          </b>
        </div>

        <div>
          Source:
          <b>
            ${escape83BGateMobile(
              resolver.source
            )}
          </b>
        </div>

        <div>
          Resolver Reason:
          <b>
            ${escape83BGateMobile(
              resolver.reason
            )}
          </b>
        </div>

        <div>
          Resolver Error:
          <b>
            ${escape83BGateMobile(
              resolver.error
            )}
          </b>
        </div>

      </div>


      <div
        style="
          margin-top:14px;
          padding:16px;
          border-radius:18px;
          background:rgba(168,85,247,.12);
          border:1px solid rgba(196,181,253,.24);
          line-height:1.65;
        "
      >

        <div
          style="
            color:#ffbd3c;
            font-size:17px;
            font-weight:900;
          "
        >
          🧬 B8 VERIFIED PATH
        </div>

        <div style="margin-top:8px;">
          Trusted Source:
          <b>
            ${escape83BGateMobile(
              b8Path.trustedSource
            )}
          </b>
        </div>

        <div>
          Resolver Source:
          <b>
            ${escape83BGateMobile(
              b8Path.resolverSource
            )}
          </b>
        </div>

        <div>
          Source Trusted:
          <b>
            ${yesNo83BGateMobile(
              b8Path.sourceTrusted
            )}
          </b>
        </div>

        <div>
          Selected Province:
          <b>
            ${escape83BGateMobile(
              b8Path.selectedProvince
            )}
          </b>
        </div>

        <div>
          Resolved Province:
          <b>
            ${escape83BGateMobile(
              b8Path.resolvedProvince
            )}
          </b>
        </div>

        <div>
          Selected = Resolved:
          <b>
            ${yesNo83BGateMobile(
              b8Path
                .selectedMatchesResolved
            )}
          </b>
        </div>

        <div>
          B8 Verified:
          <b>
            ${yesNo83BGateMobile(
              b8Path.verified
            )}
          </b>
        </div>

        <div>
          Pre-Production Path Ready:
          <b>
            ${yesNo83BGateMobile(
              b8Path
                .preProductionPathReady
            )}
          </b>
        </div>

      </div>


      <div
        style="
          margin-top:14px;
          padding:16px;
          border-radius:18px;
          background:rgba(248,113,113,.10);
          line-height:1.65;
        "
      >

        <div
          style="
            color:#ffbd3c;
            font-size:17px;
            font-weight:900;
          "
        >
          🔎 CURRENT STEP 8.3B
        </div>

        <div style="margin-top:8px;">
          8.3B Exists:
          <b>
            ${yesNo83BGateMobile(
              current83B.exists
            )}
          </b>
        </div>

        <div>
          Candidate Count:
          <b>
            ${escape83BGateMobile(
              current83B.candidateCount
            )}
          </b>
        </div>

        <div>
          Current Scope:
          <b>
            ${escape83BGateMobile(
              current83B.provinces
            )}
          </b>
        </div>

        <div>
          Legacy Matches:
          <b>
            ${escape83BGateMobile(
              current83B.legacyMatches
            )}
          </b>
        </div>

        <div>
          Carries Full Legacy Scope:
          <b>
            ${yesNo83BGateMobile(
              current83B
                .carriesFullLegacyScope
            )}
          </b>
        </div>

      </div>


      <div
        style="
          margin-top:14px;
          padding:16px;
          border-radius:18px;
          background:rgba(255,189,60,.10);
          border:1px solid rgba(255,189,60,.28);
          line-height:1.65;
        "
      >

        <div
          style="
            color:#ffbd3c;
            font-size:17px;
            font-weight:900;
          "
        >
          ⚖️ COMPARISON
        </div>

        <div style="margin-top:8px;">
          Current 8.3B = Resolved:
          <b>
            ${yesNo83BGateMobile(
              comparison
                .current83BMatchesResolved
            )}
          </b>
        </div>

        <div>
          Current 8.3B Contains Resolved:
          <b>
            ${yesNo83BGateMobile(
              comparison
                .current83BContainsResolved
            )}
          </b>
        </div>

        <div>
          Legacy Divergence Observed:
          <b>
            ${yesNo83BGateMobile(
              comparison
                .legacyDivergenceObserved
            )}
          </b>
        </div>

        <div>
          Scope Would Change:
          <b>
            ${yesNo83BGateMobile(
              comparison.scopeWouldChange
            )}
          </b>
        </div>

      </div>


      <div
        style="
          margin-top:16px;
          padding:18px;
          border-radius:20px;
          background:${
            boundaryReady
              ? 'rgba(52,211,153,.16)'
              : 'rgba(248,113,113,.16)'
          };
          border:2px solid ${
            boundaryReady
              ? '#34d399'
              : '#f87171'
          };
          line-height:1.65;
        "
      >

        <div
          style="
            font-size:19px;
            font-weight:900;
            color:${
              boundaryReady
                ? '#9ff0c8'
                : '#ffaaaa'
            };
          "
        >
          ${boundaryTitle}
        </div>

        <div style="margin-top:9px;">
          Boundary Ready:
          <b>
            ${yesNo83BGateMobile(
              gate.boundaryReady
            )}
          </b>
        </div>

        <div>
          Production Path Ready:
          <b>
            ${yesNo83BGateMobile(
              production.pathReady
            )}
          </b>
        </div>

        <div>
          B8 Pre-Production Path Ready:
          <b>
            ${yesNo83BGateMobile(
              b8Path
                .preProductionPathReady
            )}
          </b>
        </div>

        <div>
          Gate Reason:
          <b>
            ${escape83BGateMobile(
              gate.reason
            )}
          </b>
        </div>

        <div>
          Integration Executed:
          <b>
            ${safeNo83BGateMobile(
              gate.integrationExecuted
            )}
          </b>
        </div>

        <div>
          Write Authorized:
          <b>
            ${safeNo83BGateMobile(
              gate.writeAuthorized
            )}
          </b>
        </div>

      </div>


      <div
        style="
          margin-top:16px;
          padding:15px;
          border-radius:16px;
          background:rgba(14,116,144,.25);
          line-height:1.65;
          font-weight:800;
        "
      >

        🔒 SAFETY CONTRACT

        <br>

        Read Only:
        ${yesNo83BGateMobile(
          safety.readOnly
        )}

        <br>

        Boundary Only:
        ${yesNo83BGateMobile(
          safety.boundaryOnly
        )}

        <br>

        Write Authorized:
        ${safeNo83BGateMobile(
          safety.writeAuthorized
        )}

        <br>

        Production Write:
        ${safeNo83BGateMobile(
          safety.productionWrite
        )}

        <br>

        Storage Write:
        ${safeNo83BGateMobile(
          safety.storageWrite
        )}

        <br>

        Engine Executed:
        ${safeNo83BGateMobile(
          safety.engineExecuted
        )}

        <br>

        savePrediction Called:
        ${safeNo83BGateMobile(
          safety.savePredictionCalled
        )}

        <br>

        LAST_FORECAST Modified:
        ${safeNo83BGateMobile(
          safety.lastForecastModified
        )}

        <br>

        Candidates Modified:
        ${safeNo83BGateMobile(
          safety.candidatesModified
        )}

        <br>

        STEP 8.3B Modified:
        ${safeNo83BGateMobile(
          safety.step83BModified
        )}

      </div>

    `;


    output.innerHTML =
      html;

  }


  /* =========================================================
     RUN
     ========================================================= */

  function run83BIntegrationGateMobile() {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {

      return null;

    }


    const gate =
      resolve83BIntegrationGateMobile();


    if (!gate.ready) {

      output.innerHTML = `

        <div
          style="
            margin-top:14px;
            padding:15px;
            border-radius:15px;
            background:rgba(248,113,113,.15);
            line-height:1.6;
          "
        >
          ❌ 8.3B INTEGRATION GATE NOT FOUND
          <br><br>
          inspectStep83BIntegrationGate03D59
          chưa có trong runtime.
        </div>

      `;


      return null;

    }


    try {

      const result =
        gate.fn();


      if (!result) {

        throw new Error(
          'INTEGRATION_GATE_RETURNED_EMPTY_RESULT'
        );

      }


      render83BGateMobile(
        result,
        gate.name
      );


      return result;

    } catch (error) {

      output.innerHTML = `

        <div
          style="
            margin-top:14px;
            padding:15px;
            border-radius:15px;
            background:rgba(248,113,113,.15);
            line-height:1.6;
            word-break:break-word;
          "
        >
          ❌ 8.3B INTEGRATION GATE ERROR
          <br><br>
          ${escape83BGateMobile(
            error &&
            error.message
              ? error.message
              : String(error)
          )}
        </div>

      `;


      return null;

    }

  }


  /* =========================================================
     BUILD MOBILE UI
     ========================================================= */

  function build83BIntegrationGateMobileUI() {

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


    const gate =
      resolve83BIntegrationGateMobile();


    const panel =
      document.createElement('div');


    panel.id =
      PANEL_ID;


    panel.style.cssText = [
      'margin:18px 24px 30px',
      'padding:20px',
      'border-radius:24px',
      'background:linear-gradient(145deg,#242d67,#1b214b)',
      'border:1px solid rgba(255,193,61,.32)',
      'color:#ffffff',
      'box-sizing:border-box'
    ].join(';');


    panel.innerHTML = `

      <div
        style="
          font-size:20px;
          font-weight:900;
        "
      >
        🚦 8.3B INTEGRATION GATE
      </div>


      <div
        style="
          margin-top:9px;
          line-height:1.55;
          opacity:.78;
        "
      >
        Kiểm tra B8 → Scope Resolver →
        STEP 8.3B boundary.
        Diagnostic only · ZERO WRITE.
      </div>


      <div
        style="
          margin-top:14px;
          padding:12px;
          border-radius:13px;
          background:rgba(0,0,0,.16);
          line-height:1.6;
        "
      >

        Mobile Version:

        <b>
          ${escape83BGateMobile(
            VERSION
          )}
        </b>

        <br>

        Integration Gate Script:

        <b
          style="
            color:${
              gate.ready
                ? '#9ff0c8'
                : '#ff9b9b'
            };
          "
        >
          ${
            gate.ready
              ? 'YES ✅'
              : 'NO ❌'
          }
        </b>

        <br>

        Function:

        <b>
          ${escape83BGateMobile(
            gate.name
          )}
        </b>

      </div>


      <div
        id="${CONTROL_ID}"
        role="button"
        tabindex="0"
        style="
          display:flex;
          align-items:center;
          justify-content:center;
          width:100%;
          min-height:60px;
          margin-top:18px;
          padding:15px;
          border-radius:16px;
          background:linear-gradient(90deg,#ffc13d,#ff963d);
          color:#17182a;
          font-size:16px;
          font-weight:900;
          text-align:center;
          box-sizing:border-box;
          cursor:pointer;
          user-select:none;
        "
      >
        🚦 RUN 8.3B B8 BOUNDARY GATE
      </div>


      <div
        id="${OUTPUT_ID}"
      ></div>

    `;


    settings.appendChild(
      panel
    );


    const control =
      document.getElementById(
        CONTROL_ID
      );


    if (control) {

      control.addEventListener(
        'click',
        run83BIntegrationGateMobile
      );


      control.addEventListener(
        'keydown',
        function (event) {

          if (
            event.key === 'Enter' ||
            event.key === ' '
          ) {

            event.preventDefault();

            run83BIntegrationGateMobile();

          }

        }
      );

    }

  }


  /* =========================================================
     PUBLIC MOBILE API
     ========================================================= */

  window
    .run83BIntegrationGateMobile03D59 =
    run83BIntegrationGateMobile;


  window
    .rebuild83BIntegrationGateMobile03D59 =
    build83BIntegrationGateMobileUI;


  window
    .FIX03D59_STEP83B_INTEGRATION_GATE_MOBILE_LOADED =
    true;


  /* =========================================================
     INITIALIZE
     ========================================================= */

  function initialize83BIntegrationGateMobile() {

    window.setTimeout(
      build83BIntegrationGateMobileUI,
      500
    );

  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      initialize83BIntegrationGateMobile,
      {
        once: true
      }
    );

  } else {

    initialize83BIntegrationGateMobile();

  }


  console.log(
    '🛡️ FIX-03D5.9 STEP 8.3B Integration Gate Mobile V3-B8PATH loaded / READ ONLY / ZERO WRITE / BOUNDARY ONLY'
  );

})();
