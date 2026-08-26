/* =========================================================================
   FIX-03D5.9
   PRODUCTION BRIDGE — STEP 3.3
   PRODUCTION METHOD RESOLVER — MOBILE VERIFICATION V1

   PURPOSE:
   - Verify Step 3.3 directly on mobile.
   - Inspect the current selected province.
   - Scan the existing 21-province Decision Layer.
   - Verify PRODUCTION and ADAPTIVE routing when available.
   - NEVER execute a forecast engine.

   SAFETY:
   - READ ONLY.
   - ZERO PRODUCTION WRITE.
   - ZERO STORAGE WRITE.
   - NO LAST_FORECAST MODIFICATION.
   - NO savePrediction().
   - NO Decision Layer execution.
   - NO Shadow execution.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'PRODUCTION-METHOD-RESOLVER-MOBILE-V1';

  const PANEL_ID =
    'fix03d59-method-resolver-mobile-panel';

  const OUTPUT_ID =
    'fix03d59-method-resolver-mobile-output';


  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

  function esc(value) {

    return String(
      value === null ||
      value === undefined ||
      value === ''
        ? '--'
        : value
    )
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  }


  function yesNo(value) {

    if (value === true) {
      return 'YES ✅';
    }

    if (value === false) {
      return 'NO ❌';
    }

    return '--';

  }


  function row(label, value) {

    return `
      <div style="
        display:flex;
        justify-content:space-between;
        align-items:flex-start;
        gap:14px;
        padding:9px 0;
        border-bottom:1px solid rgba(255,255,255,.08);
      ">
        <span style="
          color:rgba(255,255,255,.65);
          font-size:13px;
          flex:0 0 44%;
        ">
          ${esc(label)}
        </span>

        <b style="
          color:#fff;
          text-align:right;
          font-size:13px;
          word-break:break-word;
          flex:1;
        ">
          ${value}
        </b>
      </div>
    `;

  }


  function title(text, color) {

    return `
      <div style="
        margin-top:20px;
        margin-bottom:6px;
        color:${color || '#ffc13d'};
        font-size:16px;
        font-weight:900;
      ">
        ${esc(text)}
      </div>
    `;

  }


  function normalizeSlug(value) {

    if (typeof value !== 'string') {
      return null;
    }

    const slug =
      value.trim().toLowerCase();

    if (
      !slug ||
      !/^[a-z0-9-]+$/.test(slug)
    ) {
      return null;
    }

    return slug;

  }


  function currentProvince() {

    const direct =
      normalizeSlug(
        window.SELECTED_PROVINCE
      );

    if (direct) {
      return direct;
    }


    const select =
      document.getElementById(
        'provinceSelect'
      );

    if (select) {

      const value =
        normalizeSlug(
          select.value
        );

      if (value) {
        return value;
      }

    }


    return null;

  }


  function decisionRows() {

    const layer =
      window.LAST_PROVINCE_DECISION_V26;

    if (
      !layer ||
      typeof layer !== 'object'
    ) {
      return [];
    }


    if (
      Array.isArray(layer.decisions)
    ) {
      return layer.decisions;
    }


    if (
      Array.isArray(layer.results)
    ) {
      return layer.results;
    }


    return [];

  }


  function provinceOfDecision(item) {

    if (!item) {
      return null;
    }


    const candidates = [

      item.provinceSlug,
      item.slug,
      item.provinceId,
      item.id,
      item.province

    ];


    for (
      const candidate of candidates
    ) {

      const slug =
        normalizeSlug(candidate);

      if (slug) {
        return slug;
      }

    }


    return null;

  }


  /*
   * =========================================================
   * VERIFY ALL EXISTING DECISIONS
   * =========================================================
   */

  function scanRoutes(resolver) {

    const rows =
      decisionRows();


    const results = [];


    rows.forEach(
      item => {

        const province =
          provinceOfDecision(item);


        if (!province) {
          return;
        }


        let resolved = null;
        let error = null;


        try {

          resolved =
            resolver(
              province,
              'db',
              null
            );

        } catch (err) {

          error =
            err && err.message
              ? err.message
              : String(err);

        }


        results.push({

          province,

          decision:
            item.decision ||
            item.action ||
            item.recommendation ||
            null,

          route:
            resolved
              ? resolved.route
              : null,

          strategy:
            resolved
              ? resolved.strategy
              : null,

          model:
            resolved
              ? resolved.model
              : null,

          window:
            resolved
              ? resolved.window
              : null,

          reason:
            resolved
              ? resolved.reason
              : null,

          error

        });

      }
    );


    return results;

  }


  /*
   * =========================================================
   * MAIN VERIFICATION
   * =========================================================
   */

  function runVerification() {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {
      return;
    }


    const resolver =
      window.resolveProductionMethod03D59;


    const inspector =
      window.inspectProductionMethodResolver03D59;


    const loaded =
      window
        .FIX03D59_PRODUCTION_METHOD_RESOLVER_LOADED ===
      true;


    if (
      typeof resolver !== 'function'
    ) {

      output.innerHTML = `

        ${title(
          'STEP 3.3 MODULE'
        )}

        ${row(
          'Module Loaded',
          yesNo(loaded)
        )}

        ${row(
          'Resolver Available',
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
     * ---------------------------------------------------------
     * CURRENT PROVINCE
     * ---------------------------------------------------------
     */

    const selected =
      currentProvince();


    let currentResult = null;
    let currentError = null;


    if (selected) {

      try {

        currentResult =
          resolver(
            selected,
            'db',
            window.WINDOW_SIZE || null
          );

      } catch (error) {

        currentError =
          error && error.message
            ? error.message
            : String(error);

      }

    }


    /*
     * ---------------------------------------------------------
     * 21-PROVINCE SCAN
     * ---------------------------------------------------------
     */

    const scan =
      scanRoutes(
        resolver
      );


    const production =
      scan.filter(
        item =>
          item.route ===
          'PRODUCTION'
      );


    const adaptive =
      scan.filter(
        item =>
          item.route ===
          'ADAPTIVE'
      );


    const failed =
      scan.filter(
        item =>
          Boolean(item.error) ||
          (
            item.route !== 'PRODUCTION' &&
            item.route !== 'ADAPTIVE'
          )
      );


    const productionSample =
      production.length
        ? production[0]
        : null;


    const adaptiveSample =
      adaptive.length
        ? adaptive[0]
        : null;


    /*
     * ---------------------------------------------------------
     * FAIL-CLOSED TEST
     *
     * Deliberately ask for a valid-format province slug that
     * should not have a Decision entry.
     *
     * Resolver must return PRODUCTION.
     * ---------------------------------------------------------
     */

    let fallbackTest = null;
    let fallbackError = null;


    try {

      fallbackTest =
        resolver(
          'resolver-safety-test',
          'db',
          window.WINDOW_SIZE || null
        );

    } catch (error) {

      fallbackError =
        error && error.message
          ? error.message
          : String(error);

    }


    const fallbackPassed =
      Boolean(
        !fallbackError &&
        fallbackTest &&
        fallbackTest.route ===
          'PRODUCTION' &&
        fallbackTest.adaptiveApproved ===
          false
      );


    /*
     * ---------------------------------------------------------
     * OVERALL VERDICT
     * ---------------------------------------------------------
     */

    const selectedPassed =
      Boolean(
        selected &&
        currentResult &&
        (
          currentResult.route ===
            'PRODUCTION' ||
          currentResult.route ===
            'ADAPTIVE'
        ) &&
        !currentError
      );


    const scanPassed =
      Boolean(
        scan.length > 0 &&
        failed.length === 0
      );


    const overallPassed =
      Boolean(
        loaded &&
        selectedPassed &&
        scanPassed &&
        fallbackPassed
      );


    let html = `

      ${title(
        'STEP 3.3 MODULE'
      )}

      ${row(
        'Module Loaded',
        yesNo(loaded)
      )}

      ${row(
        'Resolver Available',
        yesNo(
          typeof resolver ===
            'function'
        )
      )}

      ${row(
        'Inspector Available',
        yesNo(
          typeof inspector ===
            'function'
        )
      )}


      ${title(
        'CURRENT PROVINCE'
      )}

      ${row(
        'Province',
        esc(selected)
      )}

      ${row(
        'Execution Error',
        esc(currentError)
      )}

      ${row(
        'Ready',
        currentResult
          ? yesNo(
              currentResult.ready
            )
          : '--'
      )}

      ${row(
        'Route',
        currentResult
          ? esc(
              currentResult.route
            )
          : '--'
      )}

      ${row(
        'Strategy',
        currentResult
          ? esc(
              currentResult.strategy
            )
          : '--'
      )}

      ${row(
        'Model',
        currentResult
          ? esc(
              currentResult.model
            )
          : '--'
      )}

      ${row(
        'Window',
        currentResult
          ? esc(
              currentResult.window
            )
          : '--'
      )}

      ${row(
        'Reason',
        currentResult
          ? esc(
              currentResult.reason
            )
          : '--'
      )}


      ${title(
        'DECISION LAYER SCAN',
        '#72e6ae'
      )}

      ${row(
        'Decision Rows',
        esc(scan.length)
      )}

      ${row(
        'PRODUCTION Routes',
        esc(production.length)
      )}

      ${row(
        'ADAPTIVE Routes',
        esc(adaptive.length)
      )}

      ${row(
        'Failed / Unknown',
        esc(failed.length)
      )}

    `;


    if (productionSample) {

      html += `

        ${title(
          'PRODUCTION SAMPLE',
          '#ffb85c'
        )}

        ${row(
          'Province',
          esc(
            productionSample.province
          )
        )}

        ${row(
          'Decision',
          esc(
            productionSample.decision
          )
        )}

        ${row(
          'Route',
          esc(
            productionSample.route
          )
        )}

        ${row(
          'Reason',
          esc(
            productionSample.reason
          )
        )}

      `;

    }


    if (adaptiveSample) {

      html += `

        ${title(
          'ADAPTIVE SAMPLE',
          '#72e6ae'
        )}

        ${row(
          'Province',
          esc(
            adaptiveSample.province
          )
        )}

        ${row(
          'Decision',
          esc(
            adaptiveSample.decision
          )
        )}

        ${row(
          'Route',
          esc(
            adaptiveSample.route
          )
        )}

        ${row(
          'Model',
          esc(
            adaptiveSample.model
          )
        )}

        ${row(
          'Window',
          esc(
            adaptiveSample.window
          )
        )}

        ${row(
          'Reason',
          esc(
            adaptiveSample.reason
          )
        )}

      `;

    } else {

      html += `

        ${title(
          'ADAPTIVE SAMPLE',
          '#ffc13d'
        )}

        ${row(
          'Current Decision Layer',
          'NO ADAPTIVE ROUTE FOUND'
        )}

        ${row(
          'Interpretation',
          'NOT A MODULE FAILURE'
        )}

      `;

    }


    html += `

      ${title(
        'FAIL-CLOSED TEST'
      )}

      ${row(
        'Unknown Province',
        'resolver-safety-test'
      )}

      ${row(
        'Fallback Route',
        fallbackTest
          ? esc(
              fallbackTest.route
            )
          : '--'
      )}

      ${row(
        'Adaptive Approved',
        fallbackTest
          ? yesNo(
              fallbackTest
                .adaptiveApproved
            )
          : '--'
      )}

      ${row(
        'Test Passed',
        yesNo(
          fallbackPassed
        )
      )}


      ${title(
        'SAFETY',
        '#72e6ae'
      )}

      ${row(
        'Engine Executed',
        'NO ❌'
      )}

      ${row(
        'Forecast Generated',
        'NO ❌'
      )}

      ${row(
        'Production Write',
        'NO ❌'
      )}

      ${row(
        'Storage Write',
        'NO ❌'
      )}

      ${row(
        'LAST_FORECAST Modified',
        'NO ❌'
      )}

      ${row(
        'savePrediction Called',
        'NO ❌'
      )}


      ${title(
        'VERDICT',
        overallPassed
          ? '#72e6ae'
          : '#ff7185'
      )}

      ${row(
        'Selected Province',
        yesNo(
          selectedPassed
        )
      )}

      ${row(
        'Decision Scan',
        yesNo(
          scanPassed
        )
      )}

      ${row(
        'Fail Closed',
        yesNo(
          fallbackPassed
        )
      )}

      ${row(
        'STEP 3.3',
        overallPassed
          ? 'PASS ✅'
          : 'CHECK REQUIRED ⚠️'
      )}

    `;


    output.innerHTML =
      html;


    window
      .LAST_FIX03D59_METHOD_RESOLVER_MOBILE_VERIFY =
      {

        version:
          VERSION,

        selected,

        currentResult,

        scan,

        productionCount:
          production.length,

        adaptiveCount:
          adaptive.length,

        failedCount:
          failed.length,

        productionSample,

        adaptiveSample,

        fallbackTest,

        fallbackPassed,

        overallPassed,

        checkedAt:
          new Date()
            .toISOString(),

        readOnly:
          true

      };

  }


  /*
   * =========================================================
   * PANEL
   * =========================================================
   */

  function buildPanel() {

    const old =
      document.getElementById(
        PANEL_ID
      );


    if (old) {
      old.remove();
    }


    const settings =
      document.getElementById(
        'tab-settings'
      );


    if (!settings) {

      console.warn(
        'Step 3.3 Mobile Verify: tab-settings not found'
      );

      return;

    }


    const panel =
      document.createElement(
        'section'
      );


    panel.id =
      PANEL_ID;


    panel.style.cssText = [
      'margin:18px 0 30px',
      'padding:18px',
      'border-radius:20px',
      'background:#20264f',
      'border:1px solid rgba(135,145,255,.25)',
      'color:#fff',
      'box-sizing:border-box'
    ].join(';');


    panel.innerHTML = `

      <div style="
        font-size:21px;
        font-weight:900;
        margin-bottom:7px;
      ">
        🧭 Production Method Resolver
      </div>

      <div style="
        opacity:.7;
        font-size:13px;
        line-height:1.55;
      ">
        Step 3.3 Mobile Verification

        <br>

        Current Province + Decision Layer Scan

        <br>

        <b style="color:#72e6ae;">
          READ ONLY · ZERO WRITE
        </b>
      </div>


      <div
        id="fix03d59-method-resolver-mobile-run"
        role="button"
        tabindex="0"
        style="
          display:flex;
          width:100%;
          min-height:60px;
          margin-top:16px;
          padding:15px;
          border-radius:16px;
          background:
            linear-gradient(
              90deg,
              #72e6ae,
              #46cfa0
            );
          color:#10251d;
          font-size:16px;
          font-weight:900;
          align-items:center;
          justify-content:center;
          text-align:center;
          box-sizing:border-box;
          cursor:pointer;
          position:relative;
          z-index:100;
        "
      >
        🧪 VERIFY METHOD RESOLVER
      </div>


      <div
        id="${OUTPUT_ID}"
        style="margin-top:17px;"
      ></div>

    `;


    settings.appendChild(
      panel
    );


    const control =
      document.getElementById(
        'fix03d59-method-resolver-mobile-run'
      );


    if (control) {

      control.addEventListener(
        'click',
        runVerification
      );


      control.addEventListener(
        'keydown',
        function (event) {

          if (
            event.key === 'Enter' ||
            event.key === ' '
          ) {

            event.preventDefault();

            runVerification();

          }

        }
      );

    }

  }


  /*
   * =========================================================
   * PUBLIC API
   * =========================================================
   */

  window
    .verifyProductionMethodResolverMobile =
    runVerification;


  window
    .rebuildProductionMethodResolverMobile =
    buildPanel;


  window
    .FIX03D59_PRODUCTION_METHOD_RESOLVER_MOBILE_LOADED =
    true;


  /*
   * =========================================================
   * INIT
   * =========================================================
   */

  function init() {

    window.setTimeout(
      buildPanel,
      350
    );

  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      init,
      {
        once: true
      }
    );

  } else {

    init();

  }


  console.log(
    'FIX-03D5.9 Step 3.3 Method Resolver Mobile Verification loaded'
  );

})();
