/* =========================================================================
   FIX-03D5.9 — REAL INTEGRATION GATE MOBILE V1

   PURPOSE:
   - Run the existing READ-ONLY Real Integration Gate V1.
   - Display gate decision on mobile.
   - ZERO WRITE.
   - NO ENGINE EXECUTION.
   - NO REAL INTEGRATION.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59-REAL-INTEGRATION-GATE-MOBILE-V1';


  const PANEL_ID =
    'fix03d59-real-integration-gate-mobile-panel';


  function esc(value) {

    return String(
      value == null ? '' : value
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
        gap:14px;
        padding:10px 0;
        border-bottom:1px solid rgba(255,255,255,.10);
      ">
        <span style="color:#b9bfdc;">
          ${esc(label)}
        </span>

        <b style="
          color:#fff;
          text-align:right;
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


  function runGateMobile03D59() {

    const output =
      document.getElementById(
        'fix03d59-real-integration-gate-mobile-output'
      );


    if (!output) {

      return;

    }


    /*
     * IMPORTANT:
     * Do NOT run Production Readiness automatically.
     *
     * Gate V1 must consume the checkpoint already created
     * by the user's explicit Readiness V2 inspection.
     */

    if (
      typeof window
        .runRealIntegrationGate03D59 !==
      'function'
    ) {

      output.innerHTML =
        '<b style="color:#ff8b8b;">' +
        '❌ REAL INTEGRATION GATE V1 NOT LOADED' +
        '</b>';

      return;

    }


    let result;


    try {

      result =
        window
          .runRealIntegrationGate03D59();

    } catch (error) {

      output.innerHTML =
        '<b style="color:#ff8b8b;">' +
        '❌ GATE ERROR: ' +
        esc(
          error &&
          error.message
            ? error.message
            : error
        ) +
        '</b>';

      return;

    }


    if (!result) {

      output.innerHTML =
        '<b style="color:#ff8b8b;">' +
        '❌ GATE RETURNED NO RESULT' +
        '</b>';

      return;

    }


    const color =
      result.authorized
        ? '#68e39b'
        : '#ff8b8b';


    const title =
      result.authorized
        ? 'REAL INTEGRATION AUTHORIZED ✅'
        : 'REAL INTEGRATION BLOCKED ❌';


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
        ">
          ${title}
        </div>

      </div>

    `;

  }


  function buildPanel() {

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
        'REAL Integration Gate Mobile: tab-settings not found'
      );

      return;

    }


    const panel =
      document.createElement(
        'section'
      );


    panel.id =
      PANEL_ID;


    panel.style.cssText =
      'margin:24px;' +
      'padding:22px;' +
      'border-radius:22px;' +
      'background:linear-gradient(145deg,#202757,#171c40);' +
      'border:1px solid rgba(104,227,155,.35);' +
      'color:#fff;';


    panel.innerHTML = `

      <div style="
        font-size:22px;
        font-weight:900;
        margin-bottom:8px;
      ">
        🔐 D.5.9 Real Integration Gate
      </div>

      <div style="
        color:#b9bfdc;
        line-height:1.55;
        margin-bottom:18px;
      ">
        Final logical authorization inspection.
        READ ONLY · ZERO WRITE · NO REAL INTEGRATION.
      </div>

      <button
        type="button"
        id="fix03d59-real-integration-gate-mobile-run"
        style="
          width:100%;
          min-height:58px;
          border:0;
          border-radius:16px;
          padding:16px;
          background:linear-gradient(90deg,#68e39b,#63d9ff);
          color:#17192f;
          font-size:17px;
          font-weight:900;
        "
      >
        🔐 CHECK REAL INTEGRATION GATE
      </button>

      <div
        id="fix03d59-real-integration-gate-mobile-output"
        style="
          margin-top:16px;
          color:#d9dcf2;
        "
      >
        Chưa kiểm tra Gate.
      </div>

    `;


    settings.appendChild(
      panel
    );


    document
      .getElementById(
        'fix03d59-real-integration-gate-mobile-run'
      )
      .addEventListener(
        'click',
        runGateMobile03D59
      );

  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      buildPanel
    );

  } else {

    buildPanel();

  }


  window
    .runRealIntegrationGateMobile03D59 =
    runGateMobile03D59;


  window
    .FIX03D59_REAL_INTEGRATION_GATE_MOBILE_LOADED =
    true;


  window
    .FIX03D59_REAL_INTEGRATION_GATE_MOBILE_VERSION =
    VERSION;


  console.log(
    '📱 FIX-03D5.9 Real Integration Gate Mobile V1 loaded'
  );

})();
