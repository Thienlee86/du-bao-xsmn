/* =========================================================================
   FIX-03D5.9 STEP 8.4H
   PRODUCTION CANDIDATE BOUNDARY — MOBILE INSPECTOR V1

   PURPOSE:
   - Confirm STEP 8.4H module is loaded.
   - Run the READ-ONLY 8.4H Production Candidate Boundary Adapter.
   - Display the current 8.4H result inside the Settings tab.
   - Allow inspection from mobile without DevTools.

   IMPORTANT:
   - READ ONLY.
   - ZERO PRODUCTION WRITE.
   - ZERO STORAGE WRITE.
   - Does NOT modify LAST_FORECAST.
   - Does NOT modify STEP 8.3B.
   - Does NOT modify source candidates.
   - Does NOT call savePrediction().
   ========================================================================= */

(function () {

  'use strict';


  const PANEL_ID =
    'fix03d59-84h-mobile-panel';

  const OUTPUT_ID =
    'fix03d59-84h-mobile-output';


  /*
   * =========================================================
   * HTML ESCAPE
   * =========================================================
   */

  function escape84HMobile(
    value
  ) {

    return String(
      value === null ||
      value === undefined
        ? ''
        : value
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


  /*
   * =========================================================
   * DISPLAY HELPERS
   * =========================================================
   */

  function yesNo84HMobile(
    value
  ) {

    if (
      value === true
    ) {

      return 'YES ✅';

    }


    if (
      value === false
    ) {

      return 'NO';

    }


    return '--';

  }


  function value84HMobile(
    value
  ) {

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {

      return '--';

    }


    return escape84HMobile(
      value
    );

  }


  function row84HMobile(
    label,
    value
  ) {

    return `
      <div
        style="
          display:flex;
          justify-content:space-between;
          gap:14px;
          padding:9px 0;
          border-bottom:
            1px solid rgba(255,255,255,.08);
        "
      >

        <span
          style="
            color:rgba(255,255,255,.65);
            font-size:13px;
          "
        >
          ${escape84HMobile(label)}
        </span>

        <b
          style="
            color:#fff;
            text-align:right;
            font-size:13px;
            word-break:break-word;
          "
        >
          ${value}
        </b>

      </div>
    `;

  }


  /*
   * =========================================================
   * READ / RUN STEP 8.4H
   * =========================================================
   */

  function inspect84HMobile() {

    const loaded =
      window
        .FIX03D59_STEP84H_LOADED ===
      true;


    const builder =
      window
        .buildProductionCandidateBoundary84H;


    let result =
      window
        .LAST_FIX03D59_STEP84H ||
      null;


    let executionError =
      null;


    /*
     * 8.4H itself is READ ONLY.
     *
     * Run the builder so the mobile panel can inspect
     * the current runtime state.
     */

    if (
      typeof builder ===
      'function'
    ) {

      try {

        result =
          builder();

      } catch (
        error
      ) {

        executionError =
          error &&
          error.message
            ? error.message
            : String(error);

      }

    }


    return {

      loaded,

      builderAvailable:
        typeof builder ===
        'function',

      executionError,

      result

    };

  }


  /*
   * =========================================================
   * RENDER RESULT
   * =========================================================
   */

  function render84HMobile() {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (
      !output
    ) {

      return;

    }


    const inspection =
      inspect84HMobile();


    const result =
      inspection.result;


    if (
      inspection.executionError
    ) {

      output.innerHTML = `

        ${row84HMobile(
          'Module Loaded',
          yesNo84HMobile(
            inspection.loaded
          )
        )}

        ${row84HMobile(
          'Builder Available',
          yesNo84HMobile(
            inspection.builderAvailable
          )
        )}

        ${row84HMobile(
          'Execution',
          'ERROR ❌'
        )}

        ${row84HMobile(
          'Error',
          value84HMobile(
            inspection.executionError
          )
        )}

      `;

      return;

    }


    if (
      !result
    ) {

      output.innerHTML = `

        ${row84HMobile(
          'Module Loaded',
          yesNo84HMobile(
            inspection.loaded
          )
        )}

        ${row84HMobile(
          'Builder Available',
          yesNo84HMobile(
            inspection.builderAvailable
          )
        )}

        ${row84HMobile(
          'Result',
          'NOT AVAILABLE ❌'
        )}

      `;

      return;

    }


    output.innerHTML = `

      ${row84HMobile(
        'Module Loaded',
        yesNo84HMobile(
          inspection.loaded
        )
      )}

      ${row84HMobile(
        'Builder Available',
        yesNo84HMobile(
          inspection.builderAvailable
        )
      )}

      ${row84HMobile(
        'Step',
        value84HMobile(
          result.step
        )
      )}

      ${row84HMobile(
        'Version',
        value84HMobile(
          result.version
        )
      )}

      ${row84HMobile(
        'Ready',
        yesNo84HMobile(
          result.ready
        )
      )}

      ${row84HMobile(
        'Passed',
        yesNo84HMobile(
          result.passed
        )
      )}

      ${row84HMobile(
        'Reason',
        value84HMobile(
          result.reason
        )
      )}

      ${row84HMobile(
        'Production Province',
        value84HMobile(
          result.productionProvince
        )
      )}

      ${row84HMobile(
        'Source Candidate Count',
        value84HMobile(
          result.sourceCandidateCount
        )
      )}

      ${row84HMobile(
        'Production Candidate Count',
        value84HMobile(
          result.productionCandidateCount
        )
      )}

      ${row84HMobile(
        'Source Candidate Provinces',
        value84HMobile(
          Array.isArray(
            result.sourceCandidateProvinces
          )
            ? result
                .sourceCandidateProvinces
                .join(', ')
            : '--'
        )
      )}

      ${row84HMobile(
        'Production Candidate Provinces',
        value84HMobile(
          Array.isArray(
            result.productionCandidateProvinces
          )
            ? result
                .productionCandidateProvinces
                .join(', ')
            : '--'
        )
      )}

      ${row84HMobile(
        'Scope Matched',
        yesNo84HMobile(
          result.scopeMatched
        )
      )}

      ${row84HMobile(
        'Adapter Applied',
        yesNo84HMobile(
          result.adapterApplied
        )
      )}

      ${row84HMobile(
        'Resolver Ready',
        yesNo84HMobile(
          result.resolverReady
        )
      )}

      ${row84HMobile(
        'Integration Ready',
        yesNo84HMobile(
          result.integrationReady
        )
      )}

      ${row84HMobile(
        'Read Only',
        yesNo84HMobile(
          result.readOnly
        )
      )}

      ${row84HMobile(
        'Write Authorized',
        yesNo84HMobile(
          result.writeAuthorized
        )
      )}

      ${row84HMobile(
        'Production Write',
        yesNo84HMobile(
          result.productionWrite
        )
      )}

      ${row84HMobile(
        'Storage Write',
        yesNo84HMobile(
          result.storageWrite
        )
      )}

      ${row84HMobile(
        'Engine Executed',
        yesNo84HMobile(
          result.engineExecuted
        )
      )}

      ${row84HMobile(
        'savePrediction Called',
        yesNo84HMobile(
          result.savePredictionCalled
        )
      )}

      ${row84HMobile(
        'LAST_FORECAST Modified',
        yesNo84HMobile(
          result.lastForecastModified
        )
      )}

      ${row84HMobile(
        'Source Candidates Modified',
        yesNo84HMobile(
          result.sourceCandidatesModified
        )
      )}

    `;

  }


  /*
   * =========================================================
   * BUILD MOBILE PANEL
   * =========================================================
   */

  function build84HMobilePanel() {

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


    if (
      !settings
    ) {

      return;

    }


    const panel =
      document.createElement(
        'div'
      );


    panel.id =
      PANEL_ID;


    panel.style.cssText = `
      margin:18px 0 30px;
      padding:18px;
      border-radius:20px;
      background:rgba(30,36,78,.96);
      border:1px solid rgba(135,145,255,.25);
      color:#fff;
    `;


    panel.innerHTML = `

      <div
        style="
          font-size:20px;
          font-weight:800;
          margin-bottom:7px;
        "
      >
        🧭 STEP 8.4H — Production Boundary
      </div>

      <div
        style="
          color:rgba(255,255,255,.65);
          font-size:13px;
          line-height:1.5;
          margin-bottom:14px;
        "
      >
        Mobile runtime inspector · READ ONLY · ZERO WRITE
      </div>

      <button
        type="button"
        id="fix03d59-84h-mobile-run"
        style="
          width:100%;
          border:0;
          border-radius:14px;
          padding:14px 10px;
          font-size:15px;
          font-weight:800;
          background:#ffbd3c;
          color:#17192f;
          margin-bottom:14px;
        "
      >
        🔍 Inspect STEP 8.4H
      </button>

      <div
        id="${OUTPUT_ID}"
      ></div>

    `;


    settings.appendChild(
      panel
    );


    const button =
      document.getElementById(
        'fix03d59-84h-mobile-run'
      );


    if (
      button
    ) {

      button.addEventListener(
        'click',
        render84HMobile
      );

    }


    /*
     * Initial read.
     */

    render84HMobile();

  }


  /*
   * =========================================================
   * PUBLIC MOBILE API
   * =========================================================
   */

  window
    .inspect84HMobile =
    render84HMobile;


  window
    .FIX03D59_STEP84H_MOBILE_LOADED =
    true;


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
      build84HMobilePanel
    );

  } else {

    build84HMobilePanel();

  }


  console.log(
    'FIX-03D5.9 STEP 8.4H Mobile Inspector V1 loaded — READ ONLY / ZERO WRITE'
  );

})();

