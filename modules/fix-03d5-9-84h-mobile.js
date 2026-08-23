/* =========================================================================
   FIX-03D5.9 STEP 8.4H
   MOBILE RUNTIME CONTROL V4

   PURPOSE:
   - Keep STEP 8.4H inspector.
   - Keep Production Bootstrap inspector.
   - Add verified manual runner:
       STEP 8.2C -> STEP 8.3B
   - Stop immediately if an upstream stage cannot produce RAM.
   - Display the exact runtime result on mobile.

   SAFETY:
   - MANUAL ONLY.
   - FAIL CLOSED.
   - NO AUTO PROMOTION.
   - NO savePrediction().
   - This mobile layer does not directly modify LAST_FORECAST.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    '84H-MOBILE-RUNTIME-CONTROL-V4';


  const PANEL_ID =
    'fix03d59-84h-mobile-panel';


  const OUTPUT_ID =
    'fix03d59-84h-mobile-output';


  const CONTROL_84H_ID =
    'fix03d59-84h-mobile-run';


  const CONTROL_BOOTSTRAP_ID =
    'fix03d59-bootstrap-mobile-run';


  const CONTROL_RUNNER_ID =
    'fix03d59-82c-83b-mobile-run';


  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

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


  function yesNo(
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

      return 'NO ❌';

    }


    return '--';

  }


  function displayValue(
    value
  ) {

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {

      return '--';

    }


    if (
      typeof value ===
      'object'
    ) {

      try {

        return escapeHtml(
          JSON.stringify(
            value
          )
        );

      } catch (
        error
      ) {

        return '[OBJECT]';

      }

    }


    return escapeHtml(
      value
    );

  }


  function row(
    label,
    value
  ) {

    return `

      <div
        style="
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
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
            flex:0 0 43%;
          "
        >
          ${escapeHtml(label)}
        </span>

        <b
          style="
            color:#fff;
            text-align:right;
            font-size:13px;
            word-break:break-word;
            flex:1;
          "
        >
          ${value}
        </b>

      </div>

    `;

  }


  function sectionTitle(
    text,
    color
  ) {

    return `

      <div
        style="
          margin-top:20px;
          margin-bottom:7px;
          color:${color || '#ffc13d'};
          font-size:16px;
          font-weight:900;
        "
      >
        ${escapeHtml(text)}
      </div>

    `;

  }


  function reasonOf(
    result
  ) {

    if (
      !result ||
      typeof result !==
      'object'
    ) {

      return '--';

    }


    return (
      result.reason ||
      result.error ||
      result.status ||
      '--'
    );

  }


  /*
   * =========================================================
   * GENERIC DIV CONTROL
   * =========================================================
   */

  function createControl(
    id,
    text,
    handler,
    variant
  ) {

    const control =
      document.createElement(
        'div'
      );


    control.id =
      id;


    control.setAttribute(
      'role',
      'button'
    );


    control.setAttribute(
      'tabindex',
      '0'
    );


    control.textContent =
      text;


    let background =
      'linear-gradient(90deg,#ffc13d,#ff963d)';


    let color =
      '#17192f';


    if (
      variant ===
      'runner'
    ) {

      background =
        'linear-gradient(90deg,#72e6ae,#46cfa0)';

      color =
        '#10251d';

    }


    control.style.cssText = [
      'display:flex',
      'width:100%',
      'min-height:58px',
      'margin-top:12px',
      'padding:15px 12px',
      'border-radius:16px',
      'background:' + background,
      'color:' + color,
      'font-size:16px',
      'font-weight:900',
      'align-items:center',
      'justify-content:center',
      'text-align:center',
      'box-sizing:border-box',
      'cursor:pointer',
      'visibility:visible',
      'opacity:1',
      'position:relative',
      'z-index:100',
      'user-select:none'
    ].join(';');


    control.addEventListener(
      'click',
      handler
    );


    control.addEventListener(
      'keydown',
      function (
        event
      ) {

        if (
          event.key === 'Enter' ||
          event.key === ' '
        ) {

          event.preventDefault();

          handler();

        }

      }
    );


    return control;

  }


  /*
   * =========================================================
   * STEP 8.4H
   * =========================================================
   */

  function render84H() {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {

      return;

    }


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


    if (
      executionError
    ) {

      output.innerHTML = `

        ${sectionTitle(
          'STEP 8.4H RESULT'
        )}

        ${row(
          'Module Loaded',
          yesNo(
            loaded
          )
        )}

        ${row(
          'Builder Available',
          yesNo(
            typeof builder ===
            'function'
          )
        )}

        ${row(
          'Execution',
          'ERROR ❌'
        )}

        ${row(
          'Error',
          displayValue(
            executionError
          )
        )}

      `;

      return;

    }


    if (!result) {

      output.innerHTML = `

        ${sectionTitle(
          'STEP 8.4H RESULT'
        )}

        ${row(
          'Module Loaded',
          yesNo(
            loaded
          )
        )}

        ${row(
          'Builder Available',
          yesNo(
            typeof builder ===
            'function'
          )
        )}

        ${row(
          'Result',
          'NOT AVAILABLE ❌'
        )}

      `;

      return;

    }


    output.innerHTML = `

      ${sectionTitle(
        'STEP 8.4H RESULT'
      )}

      ${row(
        'Module Loaded',
        yesNo(
          loaded
        )
      )}

      ${row(
        'Builder Available',
        yesNo(
          typeof builder ===
          'function'
        )
      )}

      ${row(
        'Step',
        displayValue(
          result.step
        )
      )}

      ${row(
        'Version',
        displayValue(
          result.version
        )
      )}

      ${row(
        'Ready',
        yesNo(
          result.ready
        )
      )}

      ${row(
        'Passed',
        yesNo(
          result.passed
        )
      )}

      ${row(
        'Reason',
        displayValue(
          result.reason
        )
      )}

      ${row(
        'Production Province',
        displayValue(
          result.productionProvince
        )
      )}

      ${row(
        'Source Candidate Count',
        displayValue(
          result.sourceCandidateCount
        )
      )}

      ${row(
        'Production Candidate Count',
        displayValue(
          result.productionCandidateCount
        )
      )}

      ${row(
        'Scope Matched',
        yesNo(
          result.scopeMatched
        )
      )}

      ${row(
        'Adapter Applied',
        yesNo(
          result.adapterApplied
        )
      )}

      ${row(
        'Resolver Ready',
        yesNo(
          result.resolverReady
        )
      )}

      ${row(
        'Integration Ready',
        yesNo(
          result.integrationReady
        )
      )}


      ${sectionTitle(
        'SAFETY',
        '#72e6ae'
      )}

      ${row(
        'Read Only',
        yesNo(
          result.readOnly
        )
      )}

      ${row(
        'Write Authorized',
        yesNo(
          result.writeAuthorized
        )
      )}

      ${row(
        'Production Write',
        yesNo(
          result.productionWrite
        )
      )}

      ${row(
        'Storage Write',
        yesNo(
          result.storageWrite
        )
      )}

      ${row(
        'Engine Executed',
        yesNo(
          result.engineExecuted
        )
      )}

      ${row(
        'savePrediction Called',
        yesNo(
          result.savePredictionCalled
        )
      )}

      ${row(
        'LAST_FORECAST Modified',
        yesNo(
          result.lastForecastModified
        )
      )}

    `;

  }


  /*
   * =========================================================
   * BOOTSTRAP INSPECTOR
   * =========================================================
   */

  function renderBootstrap() {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {

      return;

    }


    const inspector =
      window
        .inspectFix03D59ProductionBootstrap;


    if (
      typeof inspector !==
      'function'
    ) {

      output.innerHTML = `

        ${sectionTitle(
          'PRODUCTION BOOTSTRAP'
        )}

        ${row(
          'Bootstrap Inspector',
          'NOT LOADED ❌'
        )}

      `;

      return;

    }


    let result;


    try {

      result =
        inspector();

    } catch (
      error
    ) {

      output.innerHTML = `

        ${sectionTitle(
          'PRODUCTION BOOTSTRAP'
        )}

        ${row(
          'Inspector',
          'ERROR ❌'
        )}

        ${row(
          'Error',
          displayValue(
            error &&
            error.message
              ? error.message
              : error
          )
        )}

      `;

      return;

    }


    const f =
      result &&
      result.functions
        ? result.functions
        : {};


    const r =
      result &&
      result.ram
        ? result.ram
        : {};


    const s =
      result &&
      result.safety
        ? result.safety
        : {};


    output.innerHTML = `

      ${sectionTitle(
        'PRODUCTION BOOTSTRAP'
      )}

      ${row(
        'Inspector',
        'LOADED ✅'
      )}

      ${row(
        'Mode',
        displayValue(
          result &&
          result.mode
        )
      )}


      ${sectionTitle(
        'FUNCTION CHAIN'
      )}

      ${row('8.3B', yesNo(f.step83B))}
      ${row('8.3C', yesNo(f.step83C))}
      ${row('8.3D', yesNo(f.step83D))}
      ${row('8.3E', yesNo(f.step83E))}
      ${row('8.3F', yesNo(f.step83F))}
      ${row('8.3R', yesNo(f.step83R))}
      ${row('8.4A', yesNo(f.step84A))}
      ${row('8.4B', yesNo(f.step84B))}
      ${row('8.4C', yesNo(f.step84C))}
      ${row('8.4D', yesNo(f.step84D))}
      ${row('8.4F', yesNo(f.step84F))}


      ${sectionTitle(
        'RAM STATE'
      )}

      ${row('RAM 8.2C', yesNo(r.step82C))}
      ${row('RAM 8.3B', yesNo(r.step83B))}
      ${row('RAM 8.3C', yesNo(r.step83C))}
      ${row('RAM 8.3Q', yesNo(r.step83Q))}
      ${row('RAM 8.3R', yesNo(r.step83R))}
      ${row('RAM 8.4A', yesNo(r.step84A))}
      ${row('RAM 8.4B', yesNo(r.step84B))}
      ${row('RAM 8.4C', yesNo(r.step84C))}
      ${row('RAM 8.4D', yesNo(r.step84D))}
      ${row('RAM 8.4E', yesNo(r.step84E))}
      ${row('RAM 8.4F', yesNo(r.step84F))}


      ${sectionTitle(
        'SAFETY',
        '#72e6ae'
      )}

      ${row(
        'Execution Performed',
        yesNo(
          s.executionPerformed
        )
      )}

      ${row(
        'Candidate Created',
        yesNo(
          s.candidateCreated
        )
      )}

      ${row(
        'Production Write',
        yesNo(
          s.productionWrite
        )
      )}

      ${row(
        'Storage Write',
        yesNo(
          s.storageWrite
        )
      )}

      ${row(
        'LAST_FORECAST Modified',
        yesNo(
          s.forecastModified
        )
      )}

      ${row(
        'savePrediction Called',
        yesNo(
          s.savePredictionCalled
        )
      )}

    `;

  }


  /*
   * =========================================================
   * VERIFIED RUNNER:
   * STEP 8.2C -> STEP 8.3B
   * =========================================================
   */

  function run82C83B() {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {

      return;

    }


    const runner82C =
      window
        .runFix03D59Step82CEligibilityDiagnosticV26;


    const runner83B =
      window
        .runFix03D59Step83BProductionCandidateBoundaryV26;


    /*
     * ---------------------------------------------------------
     * PRE-FLIGHT
     * ---------------------------------------------------------
     */

    if (
      typeof runner82C !==
      'function'
    ) {

      output.innerHTML = `

        ${sectionTitle(
          'RUNTIME RUNNER 8.2C → 8.3B'
        )}

        ${row(
          'STEP 8.2C Runner',
          'NOT AVAILABLE ❌'
        )}

        ${row(
          'Expected Function',
          'runFix03D59Step82CEligibilityDiagnosticV26'
        )}

        ${row(
          '8.3B Executed',
          'NO ❌'
        )}

        ${row(
          'STOP',
          'FAIL CLOSED 🔒'
        )}

      `;

      return;

    }


    if (
      typeof runner83B !==
      'function'
    ) {

      output.innerHTML = `

        ${sectionTitle(
          'RUNTIME RUNNER 8.2C → 8.3B'
        )}

        ${row(
          'STEP 8.2C Runner',
          'AVAILABLE ✅'
        )}

        ${row(
          'STEP 8.3B Runner',
          'NOT AVAILABLE ❌'
        )}

        ${row(
          'Expected Function',
          'runFix03D59Step83BProductionCandidateBoundaryV26'
        )}

        ${row(
          'Execution',
          'NOT STARTED'
        )}

        ${row(
          'STOP',
          'FAIL CLOSED 🔒'
        )}

      `;

      return;

    }


    /*
     * ---------------------------------------------------------
     * RUN STEP 8.2C
     * ---------------------------------------------------------
     */

    let returned82C =
      null;


    let error82C =
      null;


    try {

      returned82C =
        runner82C();

    } catch (
      error
    ) {

      error82C =
        error &&
        error.message
          ? error.message
          : String(error);

    }


    const ram82C =
      window
        .LAST_FIX03D59_STEP82C_RESULT ||
      null;


    if (
      error82C
    ) {

      output.innerHTML = `

        ${sectionTitle(
          'RUNTIME RUNNER 8.2C → 8.3B'
        )}

        ${row(
          'STEP 8.2C',
          'ERROR ❌'
        )}

        ${row(
          'Error',
          displayValue(
            error82C
          )
        )}

        ${row(
          'RAM 8.2C Created',
          yesNo(
            Boolean(
              ram82C
            )
          )
        )}

        ${row(
          'STEP 8.3B Executed',
          'NO ❌'
        )}

        ${row(
          'STOP',
          'FAIL CLOSED 🔒'
        )}

      `;

      return;

    }


    /*
     * The RAM object is the authoritative hand-off.
     *
     * Do not fabricate or substitute an upstream object
     * when 8.2C did not publish one.
     */

    if (!ram82C) {

      output.innerHTML = `

        ${sectionTitle(
          'RUNTIME RUNNER 8.2C → 8.3B'
        )}

        ${row(
          'STEP 8.2C Function',
          'EXECUTED ✅'
        )}

        ${row(
          'Returned Result',
          yesNo(
            Boolean(
              returned82C
            )
          )
        )}

        ${row(
          'Return Reason',
          displayValue(
            reasonOf(
              returned82C
            )
          )
        )}

        ${row(
          'RAM 8.2C Created',
          'NO ❌'
        )}

        ${row(
          'STEP 8.3B Executed',
          'NO ❌'
        )}

        ${row(
          'STOP',
          '8.2C RAM NOT AVAILABLE 🔒'
        )}

      `;


      window
        .LAST_FIX03D59_MOBILE_RUNNER_82C83B =
        {

          version:
            VERSION,

          stoppedAt:
            '8.2C',

          reason:
            'STEP82C_RAM_NOT_AVAILABLE',

          returned82C:
            returned82C,

          ram82C:
            null,

          ran83B:
            false

        };


      return;

    }


    /*
     * ---------------------------------------------------------
     * RUN STEP 8.3B
     * ---------------------------------------------------------
     */

    let returned83B =
      null;


    let error83B =
      null;


    try {

      returned83B =
        runner83B();

    } catch (
      error
    ) {

      error83B =
        error &&
        error.message
          ? error.message
          : String(error);

    }


    const ram83B =
      window
        .LAST_FIX03D59_STEP83B_RESULT ||
      window
        .LAST_FIX03D59_STEP83_RESULT ||
      null;


    /*
     * ---------------------------------------------------------
     * SAVE DIAGNOSTIC RESULT ONLY
     * ---------------------------------------------------------
     */

    window
      .LAST_FIX03D59_MOBILE_RUNNER_82C83B =
      {

        version:
          VERSION,

        returned82C:
          returned82C,

        ram82C:
          ram82C,

        returned83B:
          returned83B,

        ram83B:
          ram83B,

        error83B:
          error83B,

        stoppedAt:
          error83B ||
          !ram83B
            ? '8.3B'
            : null,

        completed:
          Boolean(
            !error83B &&
            ram83B
          ),

        executedAt:
          new Date()
            .toISOString()

      };


    output.innerHTML = `

      ${sectionTitle(
        'RUNTIME RUNNER 8.2C → 8.3B'
      )}


      ${sectionTitle(
        'STEP 8.2C',
        '#72e6ae'
      )}

      ${row(
        'Runner',
        'EXECUTED ✅'
      )}

      ${row(
        'RAM Created',
        'YES ✅'
      )}

      ${row(
        'Ready',
        yesNo(
          ram82C.ready
        )
      )}

      ${row(
        'Passed',
        yesNo(
          ram82C.passed
        )
      )}

      ${row(
        'Reason',
        displayValue(
          reasonOf(
            ram82C
          )
        )
      )}


      ${sectionTitle(
        'STEP 8.3B',
        error83B
          ? '#ff7185'
          : '#72e6ae'
      )}

      ${row(
        'Runner',
        error83B
          ? 'ERROR ❌'
          : 'EXECUTED ✅'
      )}

      ${row(
        'Error',
        displayValue(
          error83B
        )
      )}

      ${row(
        'RAM Created',
        yesNo(
          Boolean(
            ram83B
          )
        )
      )}

      ${row(
        'Ready',
        ram83B
          ? yesNo(
              ram83B.ready
            )
          : '--'
      )}

      ${row(
        'Passed',
        ram83B
          ? yesNo(
              ram83B.passed
            )
          : '--'
      )}

      ${row(
        'Reason',
        displayValue(
          ram83B
            ? reasonOf(
                ram83B
              )
            : reasonOf(
                returned83B
              )
        )
      )}


      ${sectionTitle(
        'RUNNER RESULT'
      )}

      ${row(
        '8.2C RAM',
        'AVAILABLE ✅'
      )}

      ${row(
        '8.3B RAM',
        yesNo(
          Boolean(
            ram83B
          )
        )
      )}

      ${row(
        'Next Stage',
        ram83B
          ? 'READY FOR 8.3C INSPECTION'
          : 'STOP AT 8.3B 🔒'
      )}

    `;

  }


  /*
   * =========================================================
   * BUILD PANEL
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


    const settings =
      document.getElementById(
        'tab-settings'
      );


    if (!settings) {

      console.warn(
        '84H Mobile V4: tab-settings not found'
      );

      return;

    }


    const panel =
      document.createElement(
        'section'
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


    const title =
      document.createElement(
        'div'
      );


    title.textContent =
      '🧭 FIX-03D5.9 — Runtime Control V4';


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


    description.innerHTML = `

      Mobile runtime inspection +
      verified 8.2C → 8.3B runner.

      <br>

      <b style="color:#72e6ae;">
        MANUAL · FAIL CLOSED
      </b>

    `;


    description.style.cssText = `
      color:rgba(255,255,255,.65);
      font-size:13px;
      line-height:1.6;
      margin-bottom:14px;
    `;


    panel.appendChild(
      description
    );


    panel.appendChild(
      createControl(
        CONTROL_84H_ID,
        '🔍 INSPECT STEP 8.4H',
        render84H
      )
    );


    panel.appendChild(
      createControl(
        CONTROL_BOOTSTRAP_ID,
        '🧬 INSPECT PRODUCTION CHAIN',
        renderBootstrap
      )
    );


    panel.appendChild(
      createControl(
        CONTROL_RUNNER_ID,
        '▶ RUN STEP 8.2C → 8.3B',
        run82C83B,
        'runner'
      )
    );


    const output =
      document.createElement(
        'div'
      );


    output.id =
      OUTPUT_ID;


    output.style.cssText =
      'margin-top:18px;';


    panel.appendChild(
      output
    );


    settings.appendChild(
      panel
    );


    /*
     * Initial screen remains inspection only.
     */

    render84H();


    window
      .FIX03D59_STEP84H_MOBILE_DOM_STATUS =
      {

        version:
          VERSION,

        panelExists:
          Boolean(
            document.getElementById(
              PANEL_ID
            )
          ),

        inspect84HExists:
          Boolean(
            document.getElementById(
              CONTROL_84H_ID
            )
          ),

        inspectBootstrapExists:
          Boolean(
            document.getElementById(
              CONTROL_BOOTSTRAP_ID
            )
          ),

        runner82C83BExists:
          Boolean(
            document.getElementById(
              CONTROL_RUNNER_ID
            )
          ),

        runner82C:
          typeof window
            .runFix03D59Step82CEligibilityDiagnosticV26 ===
          'function',

        runner83B:
          typeof window
            .runFix03D59Step83BProductionCandidateBoundaryV26 ===
          'function'

      };

  }


  /*
   * =========================================================
   * PUBLIC API
   * =========================================================
   */

  window
    .inspect84HMobile =
    render84H;


  window
    .inspectProductionBootstrapMobile =
    renderBootstrap;


  window
    .runFix03D59Mobile82C83B =
    run82C83B;


  window
    .rebuild84HMobile =
    buildPanel;


  window
    .FIX03D59_STEP84H_MOBILE_LOADED =
    true;


  window
    .FIX03D59_STEP84H_MOBILE_VERSION =
    VERSION;


  /*
   * =========================================================
   * INIT
   * =========================================================
   */

  function initialize() {

    window.setTimeout(
      buildPanel,
      300
    );

  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      initialize,
      {
        once: true
      }
    );

  } else {

    initialize();

  }


  console.log(
    'FIX-03D5.9 84H Mobile Runtime Control V4 loaded'
  );

})();
