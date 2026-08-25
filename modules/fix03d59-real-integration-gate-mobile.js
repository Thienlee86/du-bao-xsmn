/* =========================================================================
   FIX-03D5.9 — REAL INTEGRATION GATE MOBILE V2
   STATIC HTML BINDING

   PURPOSE:
   - Bind the static Gate button already present in index.html.
   - Run existing READ-ONLY Real Integration Gate V1.
   - Display result directly on mobile.

   IMPORTANT:
   - READ ONLY.
   - ZERO WRITE.
   - NO ENGINE EXECUTION.
   - NO REAL INTEGRATION.
   - Does NOT create panel.
   - Does NOT create button.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59-REAL-INTEGRATION-GATE-MOBILE-V2';


  const BUTTON_ID =
    'fix03d59-real-integration-gate-mobile-run';


  const OUTPUT_ID =
    'fix03d59-real-integration-gate-mobile-output';


  /* =========================================================
     HELPERS
     ========================================================= */

  function esc(value) {

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


  function yn(value) {

    return value === true
      ? 'YES ✅'
      : 'NO ❌';

  }


  function row(
    label,
    value
  ) {

    return `

      <div style="
        display:flex;
        justify-content:space-between;
        align-items:flex-start;
        gap:14px;
        padding:10px 0;
        border-bottom:1px solid rgba(255,255,255,.10);
      ">

        <span style="
          color:#b9bfdc;
          flex:1;
        ">
          ${esc(label)}
        </span>

        <b style="
          color:#fff;
          text-align:right;
          max-width:58%;
          overflow-wrap:anywhere;
          word-break:break-word;
        ">
          ${esc(
            value === undefined ||
            value === null ||
            value === ''
              ? '—'
              : value
          )}
        </b>

      </div>

    `;

  }


  /* =========================================================
     RUN GATE
     ========================================================= */

  function runGateMobile03D59() {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {

      console.error(
        'REAL Integration Gate Mobile V2: output not found'
      );

      return;

    }


    /*
     * IMPORTANT:
     * Gate consumes the existing Production Readiness V2
     * checkpoint only.
     *
     * It does NOT automatically run Production Readiness.
     */

    if (
      typeof window
        .runRealIntegrationGate03D59 !==
      'function'
    ) {

      output.innerHTML = `

        <div style="
          color:#ff8b8b;
          font-weight:900;
          line-height:1.5;
        ">
          ❌ REAL INTEGRATION GATE V1 NOT LOADED
        </div>

      `;

      return;

    }


    let result;


    try {

      result =
        window
          .runRealIntegrationGate03D59();

    } catch (error) {

      console.error(
        'REAL Integration Gate Mobile V2:',
        error
      );


      output.innerHTML = `

        <div style="
          color:#ff8b8b;
          font-weight:900;
          line-height:1.5;
        ">
          ❌ GATE ERROR:
          ${esc(
            error &&
            error.message
              ? error.message
              : error
          )}
        </div>

      `;

      return;

    }


    if (!result) {

      output.innerHTML = `

        <div style="
          color:#ff8b8b;
          font-weight:900;
        ">
          ❌ GATE RETURNED NO RESULT
        </div>

      `;

      return;

    }


    const authorized =
      result.authorized === true;


    const color =
      authorized
        ? '#68e39b'
        : '#ff8b8b';


    const title =
      authorized
        ? 'REAL INTEGRATION AUTHORIZED ✅'
        : 'REAL INTEGRATION BLOCKED ❌';


    /* =======================================================
       RENDER RESULT
       ======================================================= */

    output.innerHTML = `

      <div style="
        margin-top:16px;
        padding:16px;
        border-radius:16px;
        background:rgba(255,255,255,.055);
      ">

        <div style="
          color:${color};
          font-size:20px;
          font-weight:900;
          margin-bottom:14px;
          line-height:1.4;
        ">
          ${title}
        </div>


        ${row(
          'Reason',
          result.reason
        )}


        ${row(
          'Readiness exists',
          yn(
            result.readiness &&
            result.readiness.exists
          )
        )}


        ${row(
          'Readiness V2 verified',
          yn(
            result.readiness &&
            result.readiness.versionValid
          )
        )}


        ${row(
          'Readiness ready',
          yn(
            result.readiness &&
            result.readiness.ready
          )
        )}


        ${row(
          'Production forecast',
          yn(
            result.production &&
            result.production.forecastExists
          )
        )}


        ${row(
          'Production path ready',
          yn(
            result.production &&
            result.production.pathReady
          )
        )}


        ${row(
          'Production province',
          result.production
            ? result.production.province
            : null
        )}


        ${row(
          'Resolver available',
          yn(
            result.resolver &&
            result.resolver.available
          )
        )}


        ${row(
          'Resolver ready',
          yn(
            result.resolver &&
            result.resolver.ready
          )
        )}


        ${row(
          'Resolver province',
          result.resolver
            ? result.resolver.province
            : null
        )}


        ${row(
          'Preview ready',
          yn(
            result.preview &&
            result.preview.ready
          )
        )}


        ${row(
          'Exactly one match',
          yn(
            result.preview &&
            result.preview.exactlyOneMatch
          )
        )}


        ${row(
          'Identity preserved',
          yn(
            result.preview &&
            result.preview.identityPreserved
          )
        )}


        ${row(
          'Single province',
          yn(
            result.preview &&
            result.preview.singleProvince
          )
        )}


        ${row(
          'Candidate count',
          result.preview
            ? result.preview.candidateCount
            : null
        )}


        ${row(
          'Candidate province',
          result.preview
            ? result.preview.candidateProvince
            : null
        )}


        ${row(
          'Identity pass',
          yn(
            result.identity &&
            result.identity.pass
          )
        )}


        ${row(
          'Safety contract',
          yn(
            result.safety &&
            result.safety.pass
          )
        )}


        <div style="
          margin-top:18px;
          padding:15px;
          border:2px solid ${color};
          border-radius:14px;
          color:${color};
          text-align:center;
          font-size:18px;
          font-weight:900;
          line-height:1.4;
        ">
          ${title}
        </div>

      </div>

    `;

  }


  /* =========================================================
     BIND STATIC HTML BUTTON
     ========================================================= */

  function bindGateButton03D59() {

    const button =
      document.getElementById(
        BUTTON_ID
      );


    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!button) {

      console.warn(
        'REAL Integration Gate Mobile V2: static button not found'
      );

      return false;

    }


    if (!output) {

      console.warn(
        'REAL Integration Gate Mobile V2: static output not found'
      );

      return false;

    }


    /*
     * Prevent duplicate listener if initialization
     * happens more than once.
     */

    if (
      button.dataset
        .fix03d59GateBound ===
      'true'
    ) {

      return true;

    }


    button.addEventListener(
      'click',
      runGateMobile03D59
    );


    button.dataset
      .fix03d59GateBound =
      'true';


    console.log(
      '🔐 FIX-03D5.9 Real Integration Gate static button bound'
    );


    return true;

  }


  /* =========================================================
     INITIALIZE
     ========================================================= */

  function initGateMobile03D59() {

    bindGateButton03D59();

  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      initGateMobile03D59
    );

  } else {

    initGateMobile03D59();

  }


  /* =========================================================
     PUBLIC API
     ========================================================= */

  window
    .runRealIntegrationGateMobile03D59 =
    runGateMobile03D59;


  window
    .bindRealIntegrationGateMobile03D59 =
    bindGateButton03D59;


  window
    .FIX03D59_REAL_INTEGRATION_GATE_MOBILE_LOADED =
    true;


  window
    .FIX03D59_REAL_INTEGRATION_GATE_MOBILE_VERSION =
    VERSION;


  console.log(
    '📱 FIX-03D5.9 Real Integration Gate Mobile V2 loaded / STATIC HTML BINDING'
  );

})();
