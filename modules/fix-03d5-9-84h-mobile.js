/* =========================================================================
   FIX-03D5.9 STEP 8.4H
   PRODUCTION BOUNDARY + BOOTSTRAP — MOBILE V3
   STABLE HOST INTEGRATION

   PURPOSE:
   - Keep STEP 8.4H mobile inspector.
   - Host Production Bootstrap Inspector inside the stable 8.4H panel.
   - Avoid separate Bootstrap mobile panels.
   - Inspect Production runtime chain from mobile.
   - Avoid native BUTTON elements.

   IMPORTANT:
   - READ ONLY.
   - ZERO PRODUCTION WRITE.
   - ZERO STORAGE WRITE.
   - ZERO PROMOTION.
   - Does NOT modify LAST_FORECAST.
   - Does NOT modify candidates.
   - Does NOT call savePrediction().
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    '84H-MOBILE-BOOTSTRAP-HOST-V3';


  const PANEL_ID =
    'fix03d59-84h-mobile-panel';

  const OUTPUT_ID =
    'fix03d59-84h-mobile-output';

  const CONTROL_84H_ID =
    'fix03d59-84h-mobile-run';

  const CONTROL_BOOTSTRAP_ID =
    'fix03d59-bootstrap-mobile-run';


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
          ${escapeHtml(label)}
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


  /*
   * =========================================================
   * GENERIC DIV CONTROL
   * =========================================================
   */

  function createControl(
    id,
    text,
    handler
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


    control.style.cssText = [
      'display:flex',
      'width:100%',
      'min-height:58px',
      'margin-top:12px',
      'padding:15px 12px',
      'border-radius:16px',
      'background:linear-gradient(90deg,#ffc13d,#ff963d)',
      'color:#17192f',
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
      'z-index:100'
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
   * STEP 8.4H INSPECTOR
   * =========================================================
   */

  function inspect84H() {

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

        /*
         * STEP 8.4H is a READ-ONLY boundary adapter.
         */

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


  function render84H() {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {

      return;

    }


    const inspection =
      inspect84H();


    if (
      inspection.executionError
    ) {

      output.innerHTML = `

        ${sectionTitle(
          'STEP 8.4H RESULT'
        )}

        ${row(
          'Module Loaded',
          yesNo(
            inspection.loaded
          )
        )}

        ${row(
          'Builder Available',
          yesNo(
            inspection.builderAvailable
          )
        )}

        ${row(
          'Execution',
          'ERROR ❌'
        )}

        ${row(
          'Error',
          displayValue(
            inspection.executionError
          )
        )}

      `;

      return;

    }


    const result =
      inspection.result;


    if (!result) {

      output.innerHTML = `

        ${sectionTitle(
          'STEP 8.4H RESULT'
        )}

        ${row(
          'Module Loaded',
          yesNo(
            inspection.loaded
          )
        )}

        ${row(
          'Builder Available',
          yesNo(
            inspection.builderAvailable
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
          inspection.loaded
        )
      )}

      ${row(
        'Builder Available',
        yesNo(
          inspection.builderAvailable
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
        'Source Candidate Provinces',
        displayValue(
          Array.isArray(
            result.sourceCandidateProvinces
          )
            ? result
                .sourceCandidateProvinces
                .join(', ')
            : '--'
        )
      )}

      ${row(
        'Production Candidate Provinces',
        displayValue(
          Array.isArray(
            result.productionCandidateProvinces
          )
            ? result
                .productionCandidateProvinces
                .join(', ')
            : '--'
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

      ${row(
        'Source Candidates Modified',
        yesNo(
          result.sourceCandidatesModified
        )
      )}

    `;

  }


  /*
   * =========================================================
   * PRODUCTION BOOTSTRAP INSPECTOR
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

        ${row(
          'Expected Function',
          'inspectFix03D59ProductionBootstrap'
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
          'Bootstrap Inspector',
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


    if (!result) {

      output.innerHTML = `

        ${sectionTitle(
          'PRODUCTION BOOTSTRAP'
        )}

        ${row(
          'Result',
          'NO RESULT ❌'
        )}

      `;

      return;

    }


    const f =
      result.functions ||
      {};


    const r =
      result.ram ||
      {};


    const s =
      result.safety ||
      {};


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
          result.mode
        )
      )}

      ${row(
        'Version',
        displayValue(
          result.version
        )
      )}


      ${sectionTitle(
        'FUNCTION CHAIN'
      )}

      ${row(
        '8.3B',
        yesNo(
          f.step83B
        )
      )}

      ${row(
        '8.3C',
        yesNo(
          f.step83C
        )
      )}

      ${row(
        '8.3D',
        yesNo(
          f.step83D
        )
      )}

      ${row(
        '8.3E',
        yesNo(
          f.step83E
        )
      )}

      ${row(
        '8.3F',
        yesNo(
          f.step83F
        )
      )}

      ${row(
        '8.3R',
        yesNo(
          f.step83R
        )
      )}

      ${row(
        '8.4A',
        yesNo(
          f.step84A
        )
      )}

      ${row(
        '8.4B',
        yesNo(
          f.step84B
        )
      )}

      ${row(
        '8.4C',
        yesNo(
          f.step84C
        )
      )}

      ${row(
        '8.4D',
        yesNo(
          f.step84D
        )
      )}

      ${row(
        '8.4F',
        yesNo(
          f.step84F
        )
      )}


      ${sectionTitle(
        'RAM STATE'
      )}

      ${row(
        'RAM 8.2C',
        yesNo(
          r.step82C
        )
      )}

      ${row(
        'RAM 8.3B',
        yesNo(
          r.step83B
        )
      )}

      ${row(
        'RAM 8.3C',
        yesNo(
          r.step83C
        )
      )}

      ${row(
        'RAM 8.3Q',
        yesNo(
          r.step83Q
        )
      )}

      ${row(
        'RAM 8.3R',
        yesNo(
          r.step83R
        )
      )}

      ${row(
        'RAM 8.4A',
        yesNo(
          r.step84A
        )
      )}

      ${row(
        'RAM 8.4B',
        yesNo(
          r.step84B
        )
      )}

      ${row(
        'RAM 8.4C',
        yesNo(
          r.step84C
        )
      )}

      ${row(
        'RAM 8.4D',
        yesNo(
          r.step84D
        )
      )}

      ${row(
        'RAM 8.4E',
        yesNo(
          r.step84E
        )
      )}

      ${row(
        'RAM 8.4F',
        yesNo(
          r.step84F
        )
      )}


      ${sectionTitle(
        'BOOTSTRAP SAFETY',
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
        'Canonical Write',
        yesNo(
          s.canonicalWrite
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


    window
      .LAST_FIX03D59_BOOTSTRAP_MOBILE_HOST_RESULT =
      result;

  }


  /*
   * =========================================================
   * BUILD STABLE HOST PANEL
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
        'FIX-03D5.9 8.4H Mobile V3: tab-settings not found'
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


    description.innerHTML = `

      Stable Mobile Runtime Inspector

      <br>

      <b style="color:#72e6ae;">
        READ ONLY · ZERO WRITE
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


    /*
     * 8.4H CONTROL
     */

    const control84H =
      createControl(
        CONTROL_84H_ID,
        '🔍 INSPECT STEP 8.4H',
        render84H
      );


    panel.appendChild(
      control84H
    );


    /*
     * BOOTSTRAP CONTROL
     */

    const bootstrapControl =
      createControl(
        CONTROL_BOOTSTRAP_ID,
        '🧬 INSPECT PRODUCTION CHAIN',
        renderBootstrap
      );


    panel.appendChild(
      bootstrapControl
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


    output.style.cssText = `
      margin-top:18px;
    `;


    panel.appendChild(
      output
    );


    settings.appendChild(
      panel
    );


    /*
     * Initial view remains 8.4H.
     */

    render84H();


    /*
     * Diagnostic only.
     */

    window
      .FIX03D59_STEP84H_MOBILE_DOM_STATUS = {

        version:
          VERSION,

        panelExists:
          Boolean(
            document.getElementById(
              PANEL_ID
            )
          ),

        control84HExists:
          Boolean(
            document.getElementById(
              CONTROL_84H_ID
            )
          ),

        bootstrapControlExists:
          Boolean(
            document.getElementById(
              CONTROL_BOOTSTRAP_ID
            )
          ),

        outputExists:
          Boolean(
            document.getElementById(
              OUTPUT_ID
            )
          ),

        control84HTag:
          document.getElementById(
            CONTROL_84H_ID
          )
            ?.tagName ||
          null,

        bootstrapControlTag:
          document.getElementById(
            CONTROL_BOOTSTRAP_ID
          )
            ?.tagName ||
          null,

        readOnly:
          true,

        writeAuthorized:
          false

      };


    console.log(
      'FIX-03D5.9 8.4H Mobile V3 built',
      window
        .FIX03D59_STEP84H_MOBILE_DOM_STATUS
    );

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
    'FIX-03D5.9 8.4H Mobile V3 loaded — STABLE BOOTSTRAP HOST / READ ONLY / ZERO WRITE'
  );

})();
