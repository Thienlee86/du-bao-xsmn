/* =========================================================================
   FIX-03D5.9 STEP 8.4H
   PRODUCTION CANDIDATE BOUNDARY — MOBILE INSPECTOR V2
   DIV CONTROL BUILD

   PURPOSE:
   - Confirm STEP 8.4H module is loaded.
   - Run the READ-ONLY 8.4H Production Candidate Boundary Adapter.
   - Display the current 8.4H result inside the Settings tab.
   - Allow inspection from mobile without DevTools.
   - Avoid native BUTTON elements completely.

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

  const CONTROL_ID =
    'fix03d59-84h-mobile-run';


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
     * STEP 8.4H itself is READ ONLY.
     *
     * Running the builder here only inspects
     * the current runtime boundary state.
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
   * DIV CONTROL
   * =========================================================
   */

  function create84HMobileControl() {

    const control =
      document.createElement(
        'div'
      );


    control.id =
      CONTROL_ID;


    control.setAttribute(
      'role',
      'button'
    );


    control.setAttribute(
      'tabindex',
      '0'
    );


    control.textContent =
      '🔍 INSPECT STEP 8.4H';


    /*
     * Deliberately avoid native BUTTON.
     *
     * This isolates the inspector control
     * from application-level button CSS.
     */

    control.style.cssText = [
      'display:flex',
      'width:100%',
      'min-height:56px',
      'margin-bottom:14px',
      'padding:14px 10px',
      'border-radius:14px',
      'background:linear-gradient(90deg,#ffc13d,#ff963d)',
      'color:#17192f',
      'font-size:15px',
      'font-weight:900',
      'align-items:center',
      'justify-content:center',
      'text-align:center',
      'box-sizing:border-box',
      'cursor:pointer',
      'visibility:visible',
      'opacity:1',
      'position:relative',
      'z-index:100'
    ].join(';');


    control.addEventListener(
      'click',
      render84HMobile
    );


    control.addEventListener(
      'keydown',
      function (
        event
      ) {

        if (
          event.key ===
            'Enter' ||
          event.key ===
            ' '
        ) {

          event.preventDefault();

          render84HMobile();

        }

      }
    );


    return control;

  }


  /*
   * =========================================================
   * BUILD MOBILE PANEL
   * =========================================================
   */

  function build84HMobilePanel() {

    /*
     * Remove previous build if present.
     *
     * This makes rebuild deterministic and
     * avoids retaining an old native-button panel.
     */

    const oldPanel =
      document.getElementById(
        PANEL_ID
      );


    if (
      oldPanel
    ) {

      oldPanel.remove();

    }


    const settings =
      document.getElementById(
        'tab-settings'
      );


    if (
      !settings
    ) {

      console.warn(
        'FIX-03D5.9 STEP 8.4H Mobile: tab-settings not found'
      );

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
      box-sizing:border-box;
    `;


    /*
     * HEADER
     */

    const title =
      document.createElement(
        'div'
      );


    title.textContent =
      '🧭 STEP 8.4H — Production Boundary';


    title.style.cssText = `
      font-size:20px;
      font-weight:800;
      margin-bottom:7px;
    `;


    panel.appendChild(
      title
    );


    const description =
      document.createElement(
        'div'
      );


    description.textContent =
      'Mobile runtime inspector · READ ONLY · ZERO WRITE';


    description.style.cssText = `
      color:rgba(255,255,255,.65);
      font-size:13px;
      line-height:1.5;
      margin-bottom:14px;
    `;


    panel.appendChild(
      description
    );


    /*
     * DIV CONTROL
     */

    const control =
      create84HMobileControl();


    panel.appendChild(
      control
    );


    /*
     * OUTPUT
     */

    const output =
      document.createElement(
        'div'
      );


    output.id =
      OUTPUT_ID;


    panel.appendChild(
      output
    );


    settings.appendChild(
      panel
    );


    /*
     * Initial READ-ONLY inspection.
     */

    render84HMobile();


    /*
     * Runtime DOM diagnostic.
     */

    window
      .FIX03D59_STEP84H_MOBILE_DOM_STATUS = {

        version:
          '84H-MOBILE-DIV-CONTROL-V2',

        panelExists:
          Boolean(
            document.getElementById(
              PANEL_ID
            )
          ),

        controlExists:
          Boolean(
            document.getElementById(
              CONTROL_ID
            )
          ),

        outputExists:
          Boolean(
            document.getElementById(
              OUTPUT_ID
            )
          ),

        controlTag:
          document.getElementById(
            CONTROL_ID
          )
            ?.tagName ||
          null,

        readOnly:
          true,

        writeAuthorized:
          false

      };


    console.log(
      'FIX-03D5.9 STEP 8.4H Mobile DIV CONTROL built',
      window
        .FIX03D59_STEP84H_MOBILE_DOM_STATUS
    );

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
    .rebuild84HMobile =
    build84HMobilePanel;


  window
    .FIX03D59_STEP84H_MOBILE_LOADED =
    true;


  /*
   * =========================================================
   * INIT
   * =========================================================
   */

  function initialize84HMobile() {

    /*
     * Small delay keeps this diagnostic panel
     * isolated from the application's initial
     * Settings UI construction.
     */

    window.setTimeout(
      build84HMobilePanel,
      300
    );

  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      initialize84HMobile,
      {
        once: true
      }
    );

  } else {

    initialize84HMobile();

  }


  console.log(
    'FIX-03D5.9 STEP 8.4H Mobile Inspector V2 loaded — DIV CONTROL / READ ONLY / ZERO WRITE'
  );

})();

