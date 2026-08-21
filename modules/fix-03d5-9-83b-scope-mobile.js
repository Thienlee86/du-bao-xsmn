/* =========================================================================
   FIX-03D5.9 — STEP 8.3B SCOPE RESOLVER MOBILE V1
   FILE:
   modules/fix-03d5-9-83b-scope-mobile.js

   PURPOSE:
   - Run STEP 8.3B Scope Resolver from mobile.
   - Display Production / Selected / Current 8.3B / Resolved scope.
   - Verify runtime scope resolution before any integration.

   IMPORTANT:
   - READ ONLY
   - ZERO PRODUCTION WRITE
   - ZERO STORAGE WRITE
   - NO ENGINE EXECUTION
   - NO savePrediction()
   - NO LAST_FORECAST MODIFICATION
   - NO CANDIDATE MODIFICATION
   ========================================================================= */

(function () {

  'use strict';


  const PANEL_ID =
    'fix03d59-83b-scope-mobile-panel';

  const OUTPUT_ID =
    'fix03d59-83b-scope-mobile-output';


  /* =========================================================
     HELPERS
     ========================================================= */

  function safeText83BScopeMobile(value) {

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
          value,
          null,
          2
        );

      } catch (error) {

        return '[object]';

      }

    }


    return String(value);

  }


  function escape83BScopeMobile(value) {

    return safeText83BScopeMobile(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  }


  function yesNo83BScopeMobile(value) {

    return value
      ? 'YES ✅'
      : 'NO ❌';

  }


  /* =========================================================
     RESOLVE PUBLIC SCOPE API
     ========================================================= */

  function get83BScopeResolverMobile() {

    try {

      if (
        typeof window
          .resolveStep83BScope03D59 ===
        'function'
      ) {

        return {

          ready: true,

          name:
            'resolveStep83BScope03D59',

          fn:
            window
              .resolveStep83BScope03D59

        };

      }

    } catch (error) {

      // READ ONLY

    }


    return {

      ready: false,

      name: null,

      fn: null

    };

  }


  /* =========================================================
     RESULT ROW
     ========================================================= */

  function row83BScopeMobile(
    label,
    value,
    highlight
  ) {

    return `

      <div
        style="
          margin-top:8px;
          line-height:1.55;
          word-break:break-word;
        "
      >

        <span
          style="
            opacity:.72;
          "
        >
          ${escape83BScopeMobile(label)}:
        </span>

        <br>

        <b
          style="
            color:${
              highlight
                ? '#ffbd3c'
                : '#ffffff'
            };
          "
        >
          ${escape83BScopeMobile(value)}
        </b>

      </div>

    `;

  }


  /* =========================================================
     RENDER
     ========================================================= */

  function render83BScopeMobile(
    result,
    resolverName
  ) {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {

      return;

    }


    const current83B =
      result &&
      result.current83B
        ? result.current83B
        : {};


    const safety =
      result &&
      result.safety
        ? result.safety
        : {};


    let html = `

      <div
        style="
          margin-top:16px;
          padding:16px;
          border-radius:18px;
          background:rgba(0,0,0,.17);
        "
      >

        <div
          style="
            color:#ffbd3c;
            font-size:17px;
            font-weight:900;
          "
        >
          🧭 8.3B SCOPE RESOLUTION
        </div>

        ${row83BScopeMobile(
          'Resolver',
          resolverName
        )}

        ${row83BScopeMobile(
          'Version',
          result.version
        )}

        ${row83BScopeMobile(
          'Production Forecast Exists',
          yesNo83BScopeMobile(
            result.productionForecastExists
          )
        )}

        ${row83BScopeMobile(
          'Production Province',
          result.productionProvince,
          true
        )}

        ${row83BScopeMobile(
          'Selected Province',
          result.selectedProvince
        )}

        ${row83BScopeMobile(
          'Selected = Production',
          yesNo83BScopeMobile(
            result.selectedMatchesProduction
          )
        )}

      </div>


      <div
        style="
          margin-top:14px;
          padding:16px;
          border-radius:18px;
          background:rgba(255,255,255,.055);
        "
      >

        <div
          style="
            color:#ffbd3c;
            font-size:16px;
            font-weight:900;
          "
        >
          🔎 CURRENT STEP 8.3B
        </div>

        ${row83BScopeMobile(
          '8.3B Exists',
          yesNo83BScopeMobile(
            current83B.exists
          )
        )}

        ${row83BScopeMobile(
          'Candidate Count',
          current83B.candidateCount
        )}

        ${row83BScopeMobile(
          'Current 8.3B Scope',
          current83B.provinces,
          true
        )}

        ${row83BScopeMobile(
          'Legacy Scope',
          result.legacyScope
        )}

        ${row83BScopeMobile(
          'Legacy Matches',
          result.legacyMatches
        )}

        ${row83BScopeMobile(
          'Carries Full Legacy Scope',
          yesNo83BScopeMobile(
            result.carriesFullLegacyScope
          )
        )}

      </div>


      <div
        style="
          margin-top:14px;
          padding:16px;
          border-radius:18px;
          background:rgba(255,189,60,.09);
          border:1px solid rgba(255,189,60,.25);
        "
      >

        <div
          style="
            color:#ffbd3c;
            font-size:17px;
            font-weight:900;
          "
        >
          🎯 RESOLVED SCOPE
        </div>

        ${row83BScopeMobile(
          'Resolved Scope',
          result.resolvedScope,
          true
        )}

        ${row83BScopeMobile(
          'Source',
          result.source
        )}

        ${row83BScopeMobile(
          'Ready',
          yesNo83BScopeMobile(
            result.ready
          ),
          true
        )}

        ${row83BScopeMobile(
          'Reason',
          result.reason
        )}

        ${row83BScopeMobile(
          'Scope Changed',
          yesNo83BScopeMobile(
            result.scopeChanged
          )
        )}

      </div>


      <div
        style="
          margin-top:14px;
          padding:14px;
          border-radius:15px;
          background:rgba(52,211,153,.12);
          color:#e5fff2;
          line-height:1.6;
          font-weight:900;
        "
      >
        🔒 SAFETY CONTRACT

        <br>

        Read Only:
        ${yesNo83BScopeMobile(
          safety.readOnly
        )}

        <br>

        Production Write:
        ${
          safety.productionWrite
            ? 'YES ❌'
            : 'NO ✅'
        }

        <br>

        Storage Write:
        ${
          safety.storageWrite
            ? 'YES ❌'
            : 'NO ✅'
        }

        <br>

        Engine Executed:
        ${
          safety.engineExecuted
            ? 'YES ❌'
            : 'NO ✅'
        }

        <br>

        savePrediction Called:
        ${
          safety.savePredictionCalled
            ? 'YES ❌'
            : 'NO ✅'
        }

        <br>

        LAST_FORECAST Modified:
        ${
          safety.lastForecastModified
            ? 'YES ❌'
            : 'NO ✅'
        }

        <br>

        Candidates Modified:
        ${
          safety.candidatesModified
            ? 'YES ❌'
            : 'NO ✅'
        }

      </div>

    `;


    output.innerHTML =
      html;

  }


  /* =========================================================
     RUN
     ========================================================= */

  function run83BScopeMobile03D59() {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {

      return null;

    }


    const resolver =
      get83BScopeResolverMobile();


    if (!resolver.ready) {

      output.innerHTML = `

        <div
          style="
            margin-top:14px;
            padding:14px;
            border-radius:14px;
            background:rgba(248,113,113,.15);
            line-height:1.6;
          "
        >
          ❌ 8.3B SCOPE RESOLVER NOT FOUND

          <br><br>

          Mobile UI đã tải nhưng không tìm thấy
          <b>resolveStep83BScope03D59()</b>.

          <br><br>

          Kiểm tra resolver script đã được load
          trước mobile script trong index.html.
        </div>

      `;


      return null;

    }


    try {

      const result =
        resolver.fn();


      if (
        !result ||
        typeof result !== 'object'
      ) {

        throw new Error(
          'Resolver returned invalid result.'
        );

      }


      render83BScopeMobile(
        result,
        resolver.name
      );


      return result;

    } catch (error) {

      output.innerHTML = `

        <div
          style="
            margin-top:14px;
            padding:14px;
            border-radius:14px;
            background:rgba(248,113,113,.15);
            line-height:1.6;
            word-break:break-word;
          "
        >
          ❌ 8.3B SCOPE RESOLVER ERROR

          <br><br>

          ${escape83BScopeMobile(
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
     BUILD MOBILE PANEL
     ========================================================= */

  function build83BScopeMobile03D59() {

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


    const resolver =
      get83BScopeResolverMobile();


    const panel =
      document.createElement(
        'div'
      );


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
        🧭 8.3B SCOPE RESOLVER
      </div>


      <div
        style="
          margin-top:9px;
          opacity:.78;
          line-height:1.55;
        "
      >
        Kiểm tra scope runtime của STEP 8.3B
        trước khi thực hiện integration.
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

        Resolver Script:

        <b
          style="
            color:${
              resolver.ready
                ? '#9ff0c8'
                : '#ff9b9b'
            };
          "
        >
          ${
            resolver.ready
              ? 'YES ✅'
              : 'NO ❌'
          }
        </b>

        <br>

        Function:

        <b>
          ${escape83BScopeMobile(
            resolver.name
          )}
        </b>

      </div>


      <div
        id="fix03d59-83b-scope-mobile-control"
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
        🧭 RUN 8.3B SCOPE RESOLVER
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
        'fix03d59-83b-scope-mobile-control'
      );


    if (control) {

      control.addEventListener(
        'click',
        run83BScopeMobile03D59
      );


      control.addEventListener(
        'keydown',
        function (event) {

          if (
            event.key === 'Enter' ||
            event.key === ' '
          ) {

            event.preventDefault();

            run83BScopeMobile03D59();

          }

        }
      );

    }

  }


  /* =========================================================
     PUBLIC MOBILE API
     ========================================================= */

  window.run83BScopeMobile03D59 =
    run83BScopeMobile03D59;


  window.rebuild83BScopeMobile03D59 =
    build83BScopeMobile03D59;


  window.FIX03D59_STEP83B_SCOPE_MOBILE_LOADED =
    true;


  /* =========================================================
     INITIALIZE
     ========================================================= */

  function initialize83BScopeMobile03D59() {

    /*
     * Resolver should already be loaded by index.html.
     * Small delay also allows the Settings DOM to settle.
     */

    window.setTimeout(
      build83BScopeMobile03D59,
      500
    );

  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      initialize83BScopeMobile03D59,
      {
        once: true
      }
    );

  } else {

    initialize83BScopeMobile03D59();

  }


  console.log(
    'FIX-03D5.9 STEP 8.3B Scope Resolver Mobile V1 loaded / READ ONLY / ZERO WRITE'
  );

})();

