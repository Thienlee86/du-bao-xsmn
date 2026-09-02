/* =========================================================================
   FIX-03D5.9
   PRODUCTION SHADOW CERTIFICATION MATRIX — MOBILE V2

   PURPOSE:
   - Mobile UI for Production Shadow Certification Matrix V1.
   - Certify CURRENT selected province manually.
   - Display accumulated RAM certification matrix.
   - Reset certification RAM manually.
   - Mobile-safe controls using DIV role="button".
   - Attach directly to #tab-settings.

   IMPORTANT:
   - MANUAL ONLY.
   - RAM ONLY.
   - ZERO PRODUCTION WRITE.
   - ZERO STORAGE WRITE.
   - NO renderForecast().
   - NO savePrediction().
   - NO LAST_FORECAST MODIFICATION.
   - NO AUTOMATIC PROVINCE SWITCHING.
   - NO ACTIVATION.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_PRODUCTION_SHADOW_CERTIFICATION_MATRIX_MOBILE_V2';


  const PANEL_ID =
    'fix03d59-shadow-certification-matrix-mobile-panel';


  const OUTPUT_ID =
    'fix03d59-shadow-certification-matrix-mobile-output';


  const CERTIFY_BUTTON_ID =
    'fix03d59-shadow-certification-certify-button';


  const SUMMARY_BUTTON_ID =
    'fix03d59-shadow-certification-summary-button';


  const RESET_BUTTON_ID =
    'fix03d59-shadow-certification-reset-button';


  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

  function text03D59(
    value
  ) {

    if (
      value === null ||
      value === undefined
    ) {

      return '--';

    }


    return String(
      value
    );

  }


  function yesNo03D59(
    value
  ) {

    return value === true
      ? 'YES ✅'
      : value === false
        ? 'NO ❌'
        : '--';

  }


  function append03D59(
    lines,
    value
  ) {

    lines.push(
      value === undefined
        ? ''
        : String(value)
    );

  }


  function getOutput03D59() {

    return document
      .getElementById(
        OUTPUT_ID
      );

  }


  /*
   * =========================================================
   * CURRENT PROVINCE
   * =========================================================
   */

  function getCurrentProvince03D59() {

    const selector =
      document.getElementById(
        'provinceSelect'
      );


    if (
      selector &&
      typeof selector.value === 'string' &&
      selector.value.trim()
    ) {

      return selector
        .value
        .trim();

    }


    if (
      typeof window
        .readLastForecast03D59 ===
      'function'
    ) {

      try {

        const current =
          window
            .readLastForecast03D59();


        if (
          current &&
          current.forecast &&
          typeof current
            .forecast
            .province === 'string' &&
          current
            .forecast
            .province
            .trim()
        ) {

          return current
            .forecast
            .province
            .trim();

        }

      } catch (error) {

        /*
         * Fail closed.
         */

      }

    }


    return null;

  }


  /*
   * =========================================================
   * FORMAT ONE CERTIFICATION
   * =========================================================
   */

  function formatCertification03D59(
    result
  ) {

    const lines = [];


    append03D59(
      lines,
      'PRODUCTION SHADOW CERTIFICATION'
    );

    append03D59(
      lines,
      '============================'
    );


    if (!result) {

      append03D59(
        lines,
        'NO RESULT'
      );

      return lines.join(
        '\n'
      );

    }


    append03D59(
      lines,
      'Province: ' +
      text03D59(
        result.province
      )
    );


    append03D59(
      lines,
      'Certified: ' +
      yesNo03D59(
        result.certified
      )
    );


    append03D59(
      lines,
      'Reason: ' +
      text03D59(
        result.reason
      )
    );


    append03D59(
      lines,
      ''
    );


    append03D59(
      lines,
      'VALIDATION'
    );

    append03D59(
      lines,
      '----------------------------'
    );


    append03D59(
      lines,
      'Province Matched: ' +
      yesNo03D59(
        result.provinceMatched
      )
    );


    append03D59(
      lines,
      'Mapped Prizes: ' +
      text03D59(
        result.mappedPrizeCount
      ) +
      '/8'
    );


    append03D59(
      lines,
      'Failed Prizes: ' +
      text03D59(
        result.failedPrizeCount
      )
    );


    append03D59(
      lines,
      'LAST_FORECAST Unchanged: ' +
      yesNo03D59(
        result.lastForecastUnchanged
      )
    );


    const aggregate =
      result.aggregate ||
      {};


    append03D59(
      lines,
      ''
    );


    append03D59(
      lines,
      'AGGREGATE'
    );

    append03D59(
      lines,
      '----------------------------'
    );


    append03D59(
      lines,
      'Selected Total: ' +
      text03D59(
        aggregate.selectedNumbersTotal
      )
    );


    append03D59(
      lines,
      'Primary Top1: ' +
      text03D59(
        aggregate.samePrimaryTop1Count
      ) +
      '/8'
    );


    append03D59(
      lines,
      'Selected in Shadow Top1: ' +
      text03D59(
        aggregate.selectedInShadowTop1
      )
    );


    append03D59(
      lines,
      'Selected in Shadow Top3: ' +
      text03D59(
        aggregate.selectedInShadowTop3
      )
    );


    append03D59(
      lines,
      'Selected in Shadow Top5: ' +
      text03D59(
        aggregate.selectedInShadowTop5
      )
    );


    append03D59(
      lines,
      'Selected in Shadow Top10: ' +
      text03D59(
        aggregate.selectedInShadowTop10
      )
    );


    append03D59(
      lines,
      ''
    );


    append03D59(
      lines,
      'SAFETY'
    );

    append03D59(
      lines,
      '----------------------------'
    );


    const safety =
      result.safety ||
      {};


    append03D59(
      lines,
      'Comparison Only: ' +
      yesNo03D59(
        safety.comparisonOnly
      )
    );


    append03D59(
      lines,
      'Shadow Only: ' +
      yesNo03D59(
        safety.shadowOnly
      )
    );


    append03D59(
      lines,
      'Activation Authorized: ' +
      (
        safety.activationAuthorized === false
          ? 'NO ✅'
          : safety.activationAuthorized === true
            ? 'YES ❌'
            : '--'
      )
    );


    append03D59(
      lines,
      'Production Write: ' +
      (
        safety.productionWrite === false
          ? 'NO ✅'
          : safety.productionWrite === true
            ? 'YES ❌'
            : '--'
      )
    );


    append03D59(
      lines,
      'Storage Write: ' +
      (
        safety.storageWrite === false
          ? 'NO ✅'
          : safety.storageWrite === true
            ? 'YES ❌'
            : '--'
      )
    );


    append03D59(
      lines,
      'Activation Performed: ' +
      (
        safety.activationPerformed === false
          ? 'NO ✅'
          : safety.activationPerformed === true
            ? 'YES ❌'
            : '--'
      )
    );


    append03D59(
      lines,
      ''
    );


    append03D59(
      lines,
      result.certified === true
        ? 'CERTIFICATION PASS ✅'
        : 'CERTIFICATION NOT PASSED ❌'
    );


    return lines.join(
      '\n'
    );

  }


  /*
   * =========================================================
   * FORMAT SUMMARY
   * =========================================================
   */

  function formatSummary03D59(
    result
  ) {

    const lines = [];


    append03D59(
      lines,
      'SHADOW CERTIFICATION MATRIX'
    );

    append03D59(
      lines,
      '============================'
    );


    if (!result) {

      append03D59(
        lines,
        'NO RESULT'
      );

      return lines.join(
        '\n'
      );

    }


    append03D59(
      lines,
      'Ready: ' +
      yesNo03D59(
        result.ready
      )
    );


    append03D59(
      lines,
      'Tested Provinces: ' +
      text03D59(
        result.testedProvinceCount
      )
    );


    append03D59(
      lines,
      'Certified Provinces: ' +
      text03D59(
        result.certifiedProvinceCount
      )
    );


    append03D59(
      lines,
      'Failed Provinces: ' +
      text03D59(
        result.failedProvinceCount
      )
    );


    if (
      Number.isFinite(
        Number(
          result.certifiedRate
        )
      )
    ) {

      append03D59(
        lines,
        'Certification Rate: ' +
        (
          Number(
            result.certifiedRate
          ) *
          100
        ).toFixed(
          1
        ) +
        '%'
      );

    }


    append03D59(
      lines,
      ''
    );


    append03D59(
      lines,
      'AGGREGATE'
    );

    append03D59(
      lines,
      '----------------------------'
    );


    append03D59(
      lines,
      'Selected Total: ' +
      text03D59(
        result.selectedNumbersTotal
      )
    );


    append03D59(
      lines,
      'Primary Top1: ' +
      text03D59(
        result.samePrimaryTop1Total
      ) +
      '/' +
      text03D59(
        result.expectedPrimaryTop1Total
      )
    );


    append03D59(
      lines,
      'Selected in Shadow Top1: ' +
      text03D59(
        result.selectedInShadowTop1
      )
    );


    append03D59(
      lines,
      'Selected in Shadow Top3: ' +
      text03D59(
        result.selectedInShadowTop3
      )
    );


    append03D59(
      lines,
      'Selected in Shadow Top5: ' +
      text03D59(
        result.selectedInShadowTop5
      )
    );


    append03D59(
      lines,
      'Selected in Shadow Top10: ' +
      text03D59(
        result.selectedInShadowTop10
      )
    );


    append03D59(
      lines,
      ''
    );


    append03D59(
      lines,
      'CERTIFIED PROVINCES'
    );

    append03D59(
      lines,
      '----------------------------'
    );


    if (
      Array.isArray(
        result.certifiedProvinces
      ) &&
      result.certifiedProvinces.length
    ) {

      result
        .certifiedProvinces
        .forEach(
          province => {

            append03D59(
              lines,
              '✅ ' +
              province
            );

          }
        );

    } else {

      append03D59(
        lines,
        'NONE'
      );

    }


    append03D59(
      lines,
      ''
    );


    append03D59(
      lines,
      'FAILED PROVINCES'
    );

    append03D59(
      lines,
      '----------------------------'
    );


    if (
      Array.isArray(
        result.failedProvinces
      ) &&
      result.failedProvinces.length
    ) {

      result
        .failedProvinces
        .forEach(
          item => {

            append03D59(
              lines,
              '❌ ' +
              text03D59(
                item.province
              ) +
              ' · ' +
              text03D59(
                item.reason
              )
            );

          }
        );

    } else {

      append03D59(
        lines,
        'NONE'
      );

    }


    append03D59(
      lines,
      ''
    );


    append03D59(
      lines,
      'ACTIVATION AUTHORIZED: NO ✅'
    );


    append03D59(
      lines,
      'RAM ONLY · ZERO WRITE'
    );


    return lines.join(
      '\n'
    );

  }


  /*
   * =========================================================
   * ACTIONS
   * =========================================================
   */

  function certifyCurrent03D59() {

    const output =
      getOutput03D59();


    if (!output) {

      return;

    }


    if (
      typeof window
        .certifyCurrentProductionShadowProvince03D59 !==
      'function'
    ) {

      output.textContent =
        'CERTIFICATION MATRIX CORE NOT AVAILABLE ❌';

      return;

    }


    const province =
      getCurrentProvince03D59();


    if (!province) {

      output.textContent =
        'CERTIFICATION NOT RUN ❌\n' +
        'Reason: CURRENT_PROVINCE_NOT_AVAILABLE';

      return;

    }


    output.textContent =
      '⏳ Certifying ' +
      province +
      '...';


    setTimeout(
      function () {

        try {

          const result =
            window
              .certifyCurrentProductionShadowProvince03D59(
                province
              );


          output.textContent =
            formatCertification03D59(
              result
            );

        } catch (error) {

          output.textContent =
            'CERTIFICATION EXECUTION ERROR ❌\n\n' +
            (
              error &&
              error.stack
                ? error.stack
                : String(error)
            );

        }

      },
      50
    );

  }


  function showSummary03D59() {

    const output =
      getOutput03D59();


    if (!output) {

      return;

    }


    if (
      typeof window
        .summarizeProductionShadowCertificationMatrix03D59 !==
      'function'
    ) {

      output.textContent =
        'CERTIFICATION MATRIX SUMMARY API NOT AVAILABLE ❌';

      return;

    }


    try {

      const result =
        window
          .summarizeProductionShadowCertificationMatrix03D59();


      output.textContent =
        formatSummary03D59(
          result
        );

    } catch (error) {

      output.textContent =
        'SUMMARY EXECUTION ERROR ❌\n\n' +
        (
          error &&
          error.stack
            ? error.stack
            : String(error)
        );

    }

  }


  function resetMatrix03D59() {

    const output =
      getOutput03D59();


    if (!output) {

      return;

    }


    if (
      typeof window
        .resetProductionShadowCertificationMatrix03D59 !==
      'function'
    ) {

      output.textContent =
        'CERTIFICATION MATRIX RESET API NOT AVAILABLE ❌';

      return;

    }


    try {

      const result =
        window
          .resetProductionShadowCertificationMatrix03D59();


      output.textContent =
        'SHADOW CERTIFICATION MATRIX\n' +
        '============================\n' +
        'Reset: ' +
        yesNo03D59(
          result &&
          result.reset
        ) +
        '\n' +
        'Reason: ' +
        text03D59(
          result &&
          result.reason
        ) +
        '\n\n' +
        'RAM MATRIX EMPTY.\n' +
        'Production Write: NO ✅\n' +
        'Storage Write: NO ✅';

    } catch (error) {

      output.textContent =
        'RESET ERROR ❌\n\n' +
        (
          error &&
          error.stack
            ? error.stack
            : String(error)
        );

    }

  }


  /*
   * =========================================================
   * MOBILE SAFE CONTROL
   * =========================================================
   */

  function createControl03D59(
    id,
    label,
    background
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
      label;


    control.style.cssText =
      [
        'display:flex',
        'width:100%',
        'min-height:58px',
        'align-items:center',
        'justify-content:center',
        'box-sizing:border-box',
        'padding:15px 14px',
        'margin-top:12px',
        'border-radius:18px',
        'font-size:16px',
        'font-weight:900',
        'cursor:pointer',
        'user-select:none',
        'text-align:center',
        'background:' + background,
        'color:#111827'
      ].join(';');


    return control;

  }


  /*
   * =========================================================
   * PANEL
   * =========================================================
   */

  function installPanel03D59() {

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
        'section'
      );


    panel.id =
      PANEL_ID;


    panel.style.cssText =
      [
        'margin:24px',
        'padding:24px',
        'border:1px solid rgba(52,211,153,.35)',
        'border-radius:26px',
        'background:rgba(20,24,48,.94)',
        'color:#f8fafc',
        'box-sizing:border-box'
      ].join(';');


    const title =
      document.createElement(
        'h2'
      );


    title.textContent =
      '🛡️ Production Shadow Certification Matrix V1';


    title.style.cssText =
      [
        'margin:0 0 10px 0',
        'font-size:24px',
        'line-height:1.25'
      ].join(';');


    const description =
      document.createElement(
        'div'
      );


    description.textContent =
      'Manual province certification · G1→G8 · RAM ONLY · ZERO WRITE · NO ACTIVATION';


    description.style.cssText =
      [
        'opacity:.78',
        'font-size:16px',
        'line-height:1.5',
        'margin-bottom:12px'
      ].join(';');


    const certify =
      createControl03D59(
        CERTIFY_BUTTON_ID,
        '✅ CERTIFY CURRENT PROVINCE',
        'linear-gradient(90deg,#34d399,#67e8f9)'
      );


    const summary =
      createControl03D59(
        SUMMARY_BUTTON_ID,
        '📊 VIEW MATRIX SUMMARY',
        'linear-gradient(90deg,#67e8f9,#a78bfa)'
      );


    const reset =
      createControl03D59(
        RESET_BUTTON_ID,
        '🧹 RESET RAM MATRIX',
        'linear-gradient(90deg,#fbbf24,#fb7185)'
      );


    const output =
      document.createElement(
        'pre'
      );


    output.id =
      OUTPUT_ID;


    output.textContent =
      'Matrix chưa có certification.';


    output.style.cssText =
      [
        'margin:20px 0 0 0',
        'padding:18px',
        'border-radius:18px',
        'background:rgba(5,8,24,.75)',
        'white-space:pre-wrap',
        'overflow-wrap:anywhere',
        'word-break:break-word',
        'font-size:14px',
        'line-height:1.55',
        'max-height:70vh',
        'overflow:auto'
      ].join(';');


    certify.addEventListener(
      'click',
      certifyCurrent03D59
    );


    summary.addEventListener(
      'click',
      showSummary03D59
    );


    reset.addEventListener(
      'click',
      resetMatrix03D59
    );


    panel.appendChild(
      title
    );


    panel.appendChild(
      description
    );


    panel.appendChild(
      certify
    );


    panel.appendChild(
      summary
    );


    panel.appendChild(
      reset
    );


    panel.appendChild(
      output
    );


    settings.appendChild(
      panel
    );


    return true;

  }


  /*
   * =========================================================
   * BOOT
   * =========================================================
   */

  function boot03D59() {

    if (
      installPanel03D59()
    ) {

      return;

    }


    let attempts =
      0;


    const timer =
      setInterval(
        function () {

          attempts++;


          if (
            installPanel03D59() ||
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


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      boot03D59
    );

  } else {

    boot03D59();

  }


  /*
   * =========================================================
   * PUBLIC API
   * =========================================================
   */

  window
    .runProductionShadowCertificationCurrentMobile03D59 =
    certifyCurrent03D59;


  window
    .showProductionShadowCertificationSummaryMobile03D59 =
    showSummary03D59;


  window
    .resetProductionShadowCertificationMatrixMobile03D59 =
    resetMatrix03D59;


  window
    .FIX03D59_PRODUCTION_SHADOW_CERTIFICATION_MATRIX_MOBILE_LOADED =
    true;


  window
    .FIX03D59_PRODUCTION_SHADOW_CERTIFICATION_MATRIX_MOBILE_VERSION =
    VERSION;


  console.log(
    'FIX-03D5.9 Production Shadow Certification Matrix Mobile V2 loaded / MOBILE SAFE CONTROLS'
  );

})();
