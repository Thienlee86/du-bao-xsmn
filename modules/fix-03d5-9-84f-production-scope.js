/* =========================================================================
   FIX-03D5.9 — STEP 8.4F PRODUCTION PROVINCE SCOPE PREVIEW V1

   PURPOSE:
   - Read the existing STEP 8.4D Production Integration Boundary.
   - Read the current LAST_FORECAST.
   - Scope certified contract items to CURRENT Production Forecast province.
   - Preview the candidate -> production prize mapping.
   - Prove the province-scope fix before touching Production 8.4F.

   IMPORTANT:
   - Does NOT replace STEP 8.4F.
   - Does NOT modify STEP 8.4D.
   - Does NOT modify LAST_FORECAST.
   - Does NOT modify candidates.
   - Does NOT call savePrediction().
   - Does NOT write storage.

   READ ONLY
   ZERO WRITE
   FAIL CLOSED
   ========================================================================= */

(function () {

  'use strict';


  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

  function normalizeProvince84FScope(
    value
  ) {

    return String(
      value ?? ''
    )
      .trim()
      .toLowerCase();

  }


  function getProductionForecast84FScope() {

    try {

      if (
        typeof LAST_FORECAST !==
          'undefined' &&
        LAST_FORECAST
      ) {

        return LAST_FORECAST;

      }

    } catch (error) {

      // Continue to window fallback.

    }


    try {

      return (
        window.LAST_FORECAST ||
        null
      );

    } catch (error) {

      return null;

    }

  }


  function getProductionProvince84FScope(
    envelope
  ) {

    if (!envelope) {

      return null;

    }


    if (
      envelope.forecast &&
      envelope.forecast.province
    ) {

      return normalizeProvince84FScope(
        envelope.forecast.province
      );

    }


    if (
      envelope.province
    ) {

      return normalizeProvince84FScope(
        envelope.province
      );

    }


    return null;

  }


  /*
   * =========================================================
   * READ STEP 8.4D BOUNDARY
   * =========================================================
   */

  function getBoundary84FScope() {

    try {

      return (
        window.LAST_FIX03D59_STEP84D ||
        null
      );

    } catch (error) {

      return null;

    }

  }


  /*
   * =========================================================
   * BUILD READ-ONLY SCOPE PREVIEW
   * =========================================================
   */

  function inspectProductionScope84F() {

    const boundary =
      getBoundary84FScope();


    const envelope =
      getProductionForecast84FScope();


    const productionProvince =
      getProductionProvince84FScope(
        envelope
      );


    const boundaryExists =
      Boolean(boundary);


    const forecastExists =
      Boolean(envelope);


    const contractItems =
      (
        boundary &&
        Array.isArray(
          boundary.contractItems
        )
      )
        ? boundary.contractItems
        : [];


    /*
     * ---------------------------------------------------------
     * PRODUCTION PROVINCE FILTER
     * ---------------------------------------------------------
     */

    const productionContractItems =
      (
        productionProvince
      )
        ? contractItems.filter(
            function (candidate) {

              return (
                candidate &&
                normalizeProvince84FScope(
                  candidate.province
                ) ===
                  productionProvince
              );

            }
          )
        : [];


    const foreignContractItems =
      (
        productionProvince
      )
        ? contractItems.filter(
            function (candidate) {

              return (
                candidate &&
                normalizeProvince84FScope(
                  candidate.province
                ) !==
                  productionProvince
              );

            }
          )
        : contractItems.slice();


    /*
     * ---------------------------------------------------------
     * OBSERVABLE PRIZE KEYS
     * ---------------------------------------------------------
     *
     * Diagnostic only.
     * We do not modify forecast items.
     * ---------------------------------------------------------
     */

    const scopedCandidates =
      productionContractItems.map(
        function (candidate) {

          return {

            province:
              normalizeProvince84FScope(
                candidate?.province
              ),

            prizeKey:
              candidate?.prizeKey ??
              candidate?.giaiKey ??
              candidate?.prize ??
              null,

            candidate

          };

        }
      );


    const result = {

      version:
        '84F-PRODUCTION-SCOPE-V1',

      timestamp:
        new Date()
          .toISOString(),

      boundaryExists,

      forecastExists,

      productionProvince,

      totalContractCount:
        contractItems.length,

      productionContractCount:
        productionContractItems.length,

      foreignContractCount:
        foreignContractItems.length,

      productionContractItems,

      foreignContractItems,

      scopedCandidates,

      scopeReady:
        Boolean(
          boundaryExists &&
          forecastExists &&
          productionProvince &&
          productionContractItems.length > 0
        ),

      /*
       * Safety proof.
       */

      readOnly:
        true,

      writeAuthorized:
        false,

      productionWrite:
        false,

      storageWrite:
        false,

      savePredictionCalled:
        false,

      forecastModified:
        false,

      candidateModified:
        false

    };


    window
      .LAST_FIX03D59_STEP84F_SCOPE_PREVIEW =
      result;


    return result;

  }


  /*
   * =========================================================
   * PUBLIC READ-ONLY API
   * =========================================================
   */

  window.inspectProductionScope84F =
    inspectProductionScope84F;


  window.FIX03D59_STEP84F_SCOPE_LOADED =
    true;


  console.log(
    'FIX-03D5.9 STEP 8.4F Production Province Scope V1 loaded / READ ONLY / ZERO WRITE'
  );

})();

/* =========================================================================
   FIX-03D5.9 — STEP 8.4F PRODUCTION SCOPE MOBILE CHECK V1

   PURPOSE:
   - Confirm 8.4F Scope module loaded on mobile.
   - Run inspectProductionScope84F() from UI.
   - Display Production / Total / Scoped / Foreign counts.

   READ ONLY
   ZERO WRITE
   NO PRODUCTION MODIFICATION
   ========================================================================= */

(function () {

  'use strict';


  const PANEL_ID =
    'fix03d59-84f-scope-mobile-panel';


  function safe84FMobile(value) {

    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {

      return '--';

    }

    return String(value);

  }


  function build84FScopeMobileUI() {

    /*
     * Prevent duplicate panel.
     */

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


    const panel =
      document.createElement('div');


    panel.id =
      PANEL_ID;


    panel.style.cssText = [
      'margin:18px 24px 30px',
      'padding:20px',
      'border-radius:24px',
      'background:linear-gradient(145deg,#203b4a,#192b38)',
      'border:1px solid rgba(82,220,170,.35)',
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
        🟢 8.4F PRODUCTION SCOPE LOADED
      </div>


      <div
        style="
          margin-top:8px;
          opacity:.75;
          line-height:1.55;
        "
      >
        Production Province Scope V1
        đã được trình duyệt tải thành công.
      </div>


      <div
        style="
          margin-top:7px;
          color:#9ff0c8;
          font-size:13px;
          font-weight:800;
        "
      >
        🔒 READ ONLY · ZERO WRITE
      </div>


      <div
        id="fix03d59-84f-scope-run"
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
        "
      >
        🔬 RUN 8.4F SCOPE CHECK
      </div>


      <div
        id="fix03d59-84f-scope-output"
        style="
          margin-top:14px;
        "
      ></div>

    `;


    settings.appendChild(
      panel
    );


    const control =
      document.getElementById(
        'fix03d59-84f-scope-run'
      );


    if (!control) {

      return;

    }


    function runCheck() {

      const output =
        document.getElementById(
          'fix03d59-84f-scope-output'
        );


      if (!output) {

        return;

      }


      /*
       * Confirm inspector API exists.
       */

      if (
        typeof
          window.inspectProductionScope84F !==
        'function'
      ) {

        output.innerHTML = `

          <div
            style="
              padding:14px;
              border-radius:14px;
              background:rgba(248,113,113,.15);
              line-height:1.6;
            "
          >
            ❌ 8.4F Scope Inspector NOT AVAILABLE
          </div>

        `;

        return;

      }


      try {

        const result =
          window.inspectProductionScope84F();


        const scopeReady =
          result &&
          result.scopeReady === true;


        output.innerHTML = `

          <div
            style="
              padding:16px;
              border-radius:16px;
              background:rgba(0,0,0,.17);
              line-height:1.7;
            "
          >

            <div
              style="
                color:#ffbd3c;
                font-size:17px;
                font-weight:900;
                margin-bottom:9px;
              "
            >
              🔬 8.4F SCOPE RESULT
            </div>


            <div>
              Boundary:
              <b>
                ${
                  result.boundaryExists
                    ? 'EXISTS ✅'
                    : 'NOT AVAILABLE ❌'
                }
              </b>
            </div>


            <div>
              Production Forecast:
              <b>
                ${
                  result.forecastExists
                    ? 'EXISTS ✅'
                    : 'NOT AVAILABLE ❌'
                }
              </b>
            </div>


            <div>
              Production Province:
              <b>
                ${safe84FMobile(
                  result.productionProvince
                )}
              </b>
            </div>


            <div
              style="
                margin-top:10px;
              "
            >
              Total Contracts:
              <b>
                ${safe84FMobile(
                  result.totalContractCount
                )}
              </b>
            </div>


            <div>
              Production Contracts:
              <b>
                ${safe84FMobile(
                  result.productionContractCount
                )}
              </b>
            </div>


            <div>
              Foreign Contracts:
              <b>
                ${safe84FMobile(
                  result.foreignContractCount
                )}
              </b>
            </div>


            <div
              style="
                margin-top:12px;
                font-size:18px;
                font-weight:900;
                color:${
                  scopeReady
                    ? '#9ff0c8'
                    : '#ff9f9f'
                };
              "
            >
              Scope Ready:
              ${
                scopeReady
                  ? 'YES ✅'
                  : 'NO ❌'
              }
            </div>

          </div>


          <div
            style="
              margin-top:12px;
              padding:13px;
              border-radius:13px;
              background:rgba(52,211,153,.10);
              color:#caffdf;
              font-size:13px;
              font-weight:800;
              line-height:1.55;
            "
          >
            🔒 LAST_FORECAST NOT MODIFIED
            <br>
            🔒 NO savePrediction()
            <br>
            🔒 NO STORAGE WRITE
          </div>

        `;


      } catch (error) {

        output.innerHTML = `

          <div
            style="
              padding:14px;
              border-radius:14px;
              background:rgba(248,113,113,.15);
              line-height:1.6;
            "
          >
            ❌ 8.4F SCOPE CHECK ERROR
            <br><br>
            ${safe84FMobile(
              error &&
              error.message
                ? error.message
                : error
            )}
          </div>

        `;

      }

    }


    control.addEventListener(
      'click',
      runCheck
    );


    control.addEventListener(
      'keydown',
      function (event) {

        if (
          event.key === 'Enter' ||
          event.key === ' '
        ) {

          event.preventDefault();

          runCheck();

        }

      }
    );

  }


  /*
   * =========================================================
   * INITIALIZE MOBILE UI
   * =========================================================
   */

  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      build84FScopeMobileUI,
      {
        once: true
      }
    );

  } else {

    window.setTimeout(
      build84FScopeMobileUI,
      300
    );

  }


  window.FIX03D59_STEP84F_SCOPE_MOBILE_UI_LOADED =
    true;


  console.log(
    'FIX-03D5.9 STEP 8.4F Scope Mobile Check V1 loaded / READ ONLY / ZERO WRITE'
  );

})();

