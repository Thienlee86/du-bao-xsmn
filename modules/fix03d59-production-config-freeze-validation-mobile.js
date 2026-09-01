/* =========================================================================
   FIX-03D5.9
   PRODUCTION CONFIG FREEZE VALIDATION MOBILE V1

   PURPOSE:
   - Validate Production Config Freeze V2 from mobile.
   - Confirm G1 -> G8 are fully frozen.
   - Confirm exact verified Model × Window configuration.
   - Display validation result inside Settings.

   IMPORTANT:
   - READ ONLY.
   - ZERO PRODUCTION WRITE.
   - ZERO STORAGE WRITE.
   - NO ENGINE EXECUTION.
   - NO LAST_FORECAST MODIFICATION.
   - NO savePrediction().
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_PRODUCTION_FREEZE_VALIDATION_MOBILE_V1';


  const PANEL_ID =
    'fix03d59-production-freeze-validation-panel';

  const BUTTON_ID =
    'fix03d59-production-freeze-validation-run';

  const OUTPUT_ID =
    'fix03d59-production-freeze-validation-output';


  function buildReport(
    result
  ) {

    if (!result) {

      return (
        'PRODUCTION CONFIG FREEZE V2\n' +
        '========================\n' +
        'RESULT: NOT AVAILABLE ❌'
      );

    }


    const unresolved =
      Array.isArray(
        result.unresolved
      )
        ? result.unresolved
        : [];


    const mismatches =
      Array.isArray(
        result.mismatches
      )
        ? result.mismatches
        : [];


    const lines = [];


    lines.push(
      'PRODUCTION CONFIG FREEZE V2'
    );

    lines.push(
      '========================'
    );

    lines.push(
      'PASSED: ' +
      (
        result.passed
          ? 'YES ✅'
          : 'NO ❌'
      )
    );

    lines.push(
      'FREEZE READY: ' +
      (
        result.freezeReady
          ? 'YES ✅'
          : 'NO ❌'
      )
    );

    lines.push(
      'STATUS: ' +
      (
        result.status ||
        '--'
      )
    );

    lines.push(
      'FROZEN PRIZES: ' +
      Number(
        result.frozenPrizes || 0
      ) +
      '/8'
    );

    lines.push(
      'UNRESOLVED: ' +
      unresolved.length
    );

    lines.push(
      'MISMATCHES: ' +
      mismatches.length
    );


    lines.push('');

    lines.push(
      'VERIFIED PRODUCTION CONFIG'
    );

    lines.push(
      '------------------------'
    );

    lines.push(
      'G1  BALANCED  W20'
    );

    lines.push(
      'G2  BALANCED  W10'
    );

    lines.push(
      'G3  BASELINE  W20'
    );

    lines.push(
      'G4  FREQUENCY W30'
    );

    lines.push(
      'G5  CYCLE     W20'
    );

    lines.push(
      'G6  BALANCED  W20'
    );

    lines.push(
      'G7  BASELINE  W30'
    );

    lines.push(
      'G8  RECENT    W60'
    );


    if (mismatches.length) {

      lines.push('');

      lines.push(
        'MISMATCH DETAILS'
      );

      lines.push(
        '------------------------'
      );


      mismatches.forEach(
        item => {

          lines.push(
            String(
              item.prize ||
              '--'
            ).toUpperCase() +
            ' ❌'
          );

        }
      );

    }


    lines.push('');

    lines.push(
      'SAFETY'
    );

    lines.push(
      '------------------------'
    );

    lines.push(
      'Read Only: YES ✅'
    );

    lines.push(
      'Engine Executed: NO ✅'
    );

    lines.push(
      'Production Write: NO ✅'
    );

    lines.push(
      'Storage Write: NO ✅'
    );

    lines.push(
      'LAST_FORECAST Modified: NO ✅'
    );

    lines.push(
      'savePrediction Called: NO ✅'
    );


    return lines.join(
      '\n'
    );

  }


  function runValidationMobile() {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (
      typeof window
        .validateProductionFreeze03D59V2 !==
      'function'
    ) {

      if (output) {

        output.textContent =
          '❌ validateProductionFreeze03D59V2() NOT AVAILABLE';

      }


      return;

    }


    try {

      const result =
        window
          .validateProductionFreeze03D59V2();


      if (output) {

        output.textContent =
          buildReport(
            result
          );

      }

    } catch (error) {

      if (output) {

        output.textContent =
          '❌ VALIDATION ERROR\n\n' +
          (
            error &&
            error.message
              ? error.message
              : String(error)
          );

      }

    }

  }


  function attach() {

    if (
      document.getElementById(
        PANEL_ID
      )
    ) {

      return true;

    }


    const settings =
      document.getElementById(
        'tab-settings'
      );


    if (!settings) {

      return false;

    }


    const panel =
      document.createElement(
        'div'
      );


    panel.id =
      PANEL_ID;


    panel.style.cssText =
      [
        'margin-top:18px',
        'padding:16px',
        'border:1px solid rgba(104,227,155,.35)',
        'border-radius:16px',
        'background:rgba(255,255,255,.05)'
      ].join(';');


    panel.innerHTML = `

      <div
        style="
          font-size:18px;
          font-weight:900;
          margin-bottom:8px;
        "
      >
        🧊 Production Config Freeze V2
      </div>

      <div
        style="
          opacity:.75;
          font-size:13px;
          line-height:1.55;
          margin-bottom:14px;
        "
      >
        Verified Model × Window · G1→G8
        <br>
        Freeze Validation
        <br>
        Read Only · Zero Write
      </div>

      <div
        id="${BUTTON_ID}"
        role="button"
        tabindex="0"
        style="
          display:flex;
          width:100%;
          min-height:58px;
          align-items:center;
          justify-content:center;
          padding:13px;
          box-sizing:border-box;
          border-radius:14px;
          background:
            linear-gradient(
              90deg,
              #68e39b,
              #63d9ff
            );
          color:#17192f;
          font-size:16px;
          font-weight:900;
          text-align:center;
          cursor:pointer;
          user-select:none;
        "
      >
        🧊 VALIDATE PRODUCTION FREEZE
      </div>

      <pre
        id="${OUTPUT_ID}"
        style="
          margin-top:12px;
          padding:12px;
          border-radius:11px;
          background:rgba(0,0,0,.22);
          white-space:pre-wrap;
          word-break:break-word;
          font-size:12px;
          line-height:1.55;
          overflow:auto;
        "
      >Chưa chạy kiểm tra.</pre>

    `;


    settings.appendChild(
      panel
    );


    const button =
      document.getElementById(
        BUTTON_ID
      );


    if (button) {

      button.addEventListener(
        'click',
        runValidationMobile
      );

    }


    return true;

  }


  if (
    !attach()
  ) {

    let attempts =
      0;


    const timer =
      setInterval(
        function () {

          attempts++;


          if (
            attach() ||
            attempts >= 20
          ) {

            clearInterval(
              timer
            );

          }

        },
        500
      );

  }


  window
    .runProductionFreezeValidationMobile03D59 =
    runValidationMobile;


  window
    .FIX03D59_PRODUCTION_FREEZE_VALIDATION_MOBILE_VERSION =
    VERSION;


  window
    .FIX03D59_PRODUCTION_FREEZE_VALIDATION_MOBILE_LOADED =
    true;


  console.log(
    'FIX-03D5.9 Production Freeze Validation Mobile V1 loaded / READ ONLY'
  );

})();
