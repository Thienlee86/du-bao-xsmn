/* =========================================================================
   FIX-03D5.9
   FINAL PRODUCTION INTEGRATION GATE — V2

   PURPOSE:
   - Bind STEP 8.4F Mapping Preview to CURRENT LAST_FORECAST.
   - Reject stale / missing / invalid runtime state.
   - Verify mapping belongs to the forecast currently in RAM.
   - Prepare ONE final authorization boundary before Production Adapter.

   IMPORTANT:
   - READ ONLY.
   - ZERO PRODUCTION WRITE.
   - ZERO STORAGE WRITE.
   - Does NOT create LAST_FORECAST.
   - Does NOT modify LAST_FORECAST.
   - Does NOT call savePrediction().
   - Does NOT execute Production Adapter.
   - FAIL CLOSED.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_FINAL_INTEGRATION_V2';


  /*
   * =========================================================
   * 1. SAFE HELPERS
   * =========================================================
   */

  function isObject(
    value
  ) {

    return Boolean(
      value &&
      typeof value === 'object' &&
      !Array.isArray(value)
    );

  }


  function normalizeText(
    value
  ) {

    return String(
      value == null
        ? ''
        : value
    )
      .trim()
      .toLowerCase();

  }


  /*
   * =========================================================
   * 2. CURRENT PRODUCTION FORECAST
   * =========================================================
   */

  function getForecast() {

    const container =
      window.LAST_FORECAST;


    if (
      !isObject(container)
    ) {

      return null;

    }


    /*
     * Production Core in app (27).js:
     *
     * LAST_FORECAST = {
     *   forecast,
     *   pairFormulas
     * }
     */

    if (
      isObject(
        container.forecast
      )
    ) {

      return container.forecast;

    }


    /*
     * Read-only compatibility fallback.
     */

    if (
      container.province &&
      Array.isArray(
        container.items
      )
    ) {

      return container;

    }


    return null;

  }


  /*
   * =========================================================
   * 3. CURRENT 8.4F MAPPING PREVIEW
   * =========================================================
   */

  function getMappingPreview() {

    return (
      window.LAST_FIX03D59_STEP84F ||
      window.LAST_FIX03D59_STEP84F_RESULT ||
      null
    );

  }


  /*
   * =========================================================
   * 4. NUMBER IDENTITY
   *
   * app (27).js forecast number schema:
   *
   * item.numbers = [
   *   {
   *     number: '...',
   *     ...
   *   }
   * ]
   *
   * Compatibility with primitive number/string values
   * is inspection-only.
   * =========================================================
   */

  function getNumberIdentity(
    value
  ) {

    if (
      isObject(value)
    ) {

      return String(
        value.number == null
          ? ''
          : value.number
      );

    }


    return String(
      value == null
        ? ''
        : value
    );

  }


  /*
   * =========================================================
   * 5. FORECAST IDENTITY
   *
   * RAM diagnostic identity only.
   *
   * No persistent ID is created.
   * No mutation.
   * =========================================================
   */

  function buildForecastIdentity(
    forecast
  ) {

    if (
      !isObject(
        forecast
      )
    ) {

      return null;

    }


    const province =
      normalizeText(
        forecast.province
      );


    const targetDrawDate =
      normalizeText(
        forecast.targetDrawDate ||
        forecast.targetDate ||
        forecast.date
      );


    const windowSize =
      Number(
        forecast.windowSize
      ) || 0;


    const items =
      Array.isArray(
        forecast.items
      )
        ? forecast.items
        : [];


    const itemSignature =
      items
        .map(
          function (
            item
          ) {

            if (
              !isObject(
                item
              )
            ) {

              return '';

            }


            const key =
              normalizeText(
                item.key
              );


            const numbers =
              Array.isArray(
                item.numbers
              )
                ? item.numbers
                    .map(
                      getNumberIdentity
                    )
                    .join(',')
                : '';


            return (
              key +
              ':' +
              numbers
            );

          }
        )
        .join('|');


    return [

      province,

      targetDrawDate,

      String(
        windowSize
      ),

      itemSignature

    ].join('::');

  }


  /*
   * =========================================================
   * 6. MAPPING IDENTITY EXTRACTION
   * =========================================================
   */

  function getMappingProvince(
    mapping
  ) {

    if (
      !isObject(
        mapping
      )
    ) {

      return '';

    }


    return normalizeText(

      mapping.productionProvince ||

      mapping.forecastProvince ||

      mapping.province ||

      (
        isObject(
          mapping.forecast
        )
          ? mapping.forecast.province
          : ''
      )

    );

  }


  function getMappingTargetDate(
    mapping
  ) {

    if (
      !isObject(
        mapping
      )
    ) {

      return '';

    }


    return normalizeText(

      mapping.targetDrawDate ||

      mapping.targetDate ||

      mapping.forecastTargetDate ||

      (
        isObject(
          mapping.forecast
        )
          ? (
              mapping.forecast.targetDrawDate ||
              mapping.forecast.targetDate ||
              mapping.forecast.date
            )
          : ''
      )

    );

  }


  /*
   * =========================================================
   * 7. FAIL-CLOSED RESULT
   * =========================================================
   */

  function failFinalIntegration(
    reason,
    extra = {}
  ) {

    const result = {

      ready:
        false,

      passed:
        false,

      authorized:
        false,

      reason,

      version:
        VERSION,

      mode:
        'READ_ONLY_FINAL_GATE',

      ...extra,

      safety: {

        lastForecastModified:
          false,

        mappingModified:
          false,

        productionWrite:
          false,

        storageWrite:
          false,

        savePredictionCalled:
          false,

        adapterExecuted:
          false

      },

      readOnly:
        true,

      failClosed:
        true,

      inspectedAt:
        new Date()
          .toISOString()

    };


    /*
     * Diagnostic RAM only.
     */

    window
      .LAST_FIX03D59_FINAL_INTEGRATION =
      result;


    return result;

  }


  /*
   * =========================================================
   * 8. FINAL INTEGRATION GATE
   * =========================================================
   */

  function inspectFinalIntegration() {

    const forecast =
      getForecast();


    const mapping =
      getMappingPreview();


    /*
     * ---------------------------------------------------------
     * CURRENT FORECAST REQUIRED
     * ---------------------------------------------------------
     */

    if (
      !forecast
    ) {

      return failFinalIntegration(
        'CURRENT_FORECAST_NOT_AVAILABLE'
      );

    }


    const currentForecastIdentity =
      buildForecastIdentity(
        forecast
      );


    /*
     * ---------------------------------------------------------
     * 8.4F REQUIRED
     * ---------------------------------------------------------
     */

    if (
      !isObject(
        mapping
      )
    ) {

      return failFinalIntegration(
        'STEP_84F_MAPPING_NOT_AVAILABLE',
        {
          currentForecastIdentity
        }
      );

    }


    /*
     * ---------------------------------------------------------
     * STRICT 8.4F VALIDATION
     * ---------------------------------------------------------
     *
     * IMPORTANT:
     *
     * app (27).js 8.4F can return ready:true
     * while mappingValid:false.
     *
     * Therefore ready:true alone MUST NEVER authorize
     * the Final Integration boundary.
     * ---------------------------------------------------------
     */

    const mappingPassed =
      Boolean(

        mapping.ready === true &&

        mapping.passed === true &&

        mapping.mappingValid === true &&

        mapping.readOnly === true &&

        mapping.writeAuthorized === false &&

        mapping.productionWrite === false &&

        mapping.storageWrite === false

      );


    if (
      !mappingPassed
    ) {

      return failFinalIntegration(
        'STEP_84F_NOT_STRICTLY_VALID',
        {

          mappingReason:
            mapping.reason ||
            null,

          mappingReady:
            mapping.ready === true,

          mappingPassed:
            mapping.passed === true,

          mappingValid:
            mapping.mappingValid === true,

          currentForecastIdentity

        }
      );

    }


    /*
     * ---------------------------------------------------------
     * FORECAST PROVINCE
     * ---------------------------------------------------------
     */

    const forecastProvince =
      normalizeText(
        forecast.province
      );


    if (
      !forecastProvince
    ) {

      return failFinalIntegration(
        'FORECAST_PROVINCE_NOT_AVAILABLE',
        {
          currentForecastIdentity
        }
      );

    }


    /*
     * ---------------------------------------------------------
     * MAPPING PROVINCE
     * ---------------------------------------------------------
     */

    const mappingProvince =
      getMappingProvince(
        mapping
      );


    /*
     * Fail closed:
     *
     * Final gate requires explicit province identity
     * from STEP 8.4F.
     */

    if (
      !mappingProvince
    ) {

      return failFinalIntegration(
        'MAPPING_PROVINCE_NOT_AVAILABLE',
        {

          forecastProvince,

          currentForecastIdentity

        }
      );

    }


    if (
      mappingProvince !==
      forecastProvince
    ) {

      return failFinalIntegration(
        'STALE_FORECAST_PROVINCE_MISMATCH',
        {

          forecastProvince,

          mappingProvince,

          currentForecastIdentity

        }
      );

    }


    /*
     * ---------------------------------------------------------
     * TARGET DATE BINDING
     * ---------------------------------------------------------
     */

    const forecastTargetDate =
      normalizeText(

        forecast.targetDrawDate ||
        forecast.targetDate ||
        forecast.date

      );


    const mappingTargetDate =
      getMappingTargetDate(
        mapping
      );


    /*
     * Target date comparison is enforced whenever
     * BOTH sides expose a target date.
     *
     * We do not manufacture a missing date.
     */

    if (
      forecastTargetDate &&
      mappingTargetDate &&
      forecastTargetDate !==
        mappingTargetDate
    ) {

      return failFinalIntegration(
        'STALE_FORECAST_TARGET_DATE_MISMATCH',
        {

          forecastProvince,

          mappingProvince,

          forecastTargetDate,

          mappingTargetDate,

          currentForecastIdentity

        }
      );

    }


    /*
     * ---------------------------------------------------------
     * FINAL READ-ONLY AUTHORIZATION
     * ---------------------------------------------------------
     *
     * authorized:true means ONLY:
     *
     * The CURRENT runtime state is approved to enter
     * the NEXT Production Adapter boundary.
     *
     * NO WRITE OCCURS HERE.
     * ---------------------------------------------------------
     */

    const result = {

      ready:
        true,

      passed:
        true,

      authorized:
        true,

      reason:
        'FINAL_INTEGRATION_GATE_PASS',

      version:
        VERSION,

      mode:
        'READ_ONLY_FINAL_GATE',

      forecastProvince,

      forecastTargetDate:
        forecastTargetDate ||
        null,

      mappingProvince,

      mappingTargetDate:
        mappingTargetDate ||
        null,

      currentForecastIdentity,

      mapping: {

        step:
          mapping.step ||
          '8.4F',

        ready:
          mapping.ready === true,

        passed:
          mapping.passed === true,

        mappingValid:
          mapping.mappingValid === true,

        mappingCount:
          mapping.mappingCount ??
          null,

        expectedCount:
          mapping.expectedCount ??
          null,

        countsMatch:
          mapping.countsMatch === true,

        allMappingsValid:
          mapping.allMappingsValid === true

      },

      safety: {

        lastForecastModified:
          false,

        mappingModified:
          false,

        productionWrite:
          false,

        storageWrite:
          false,

        savePredictionCalled:
          false,

        adapterExecuted:
          false

      },

      readOnly:
        true,

      failClosed:
        true,

      inspectedAt:
        new Date()
          .toISOString()

    };


    /*
     * =========================================================
     * DIAGNOSTIC RAM ONLY
     * =========================================================
     *
     * This is NOT:
     *
     * - Production persistence
     * - Prediction persistence
     * - LAST_FORECAST mutation
     * - savePrediction()
     * - localStorage write
     */

    window
      .LAST_FIX03D59_FINAL_INTEGRATION =
      result;


    return result;

  }


  /*
   * =========================================================
   * 9. PUBLIC READ-ONLY API
   * =========================================================
   */

  window
    .inspectFix03D59FinalIntegration =
    inspectFinalIntegration;


  window
    .FIX03D59_FINAL_INTEGRATION_VERSION =
    VERSION;


  window
    .FIX03D59_FINAL_INTEGRATION_LOADED =
    true;


  console.log(
    'FIX-03D5.9 Final Integration V2 loaded — STRICT 8.4F / READ ONLY / ZERO WRITE / FAIL CLOSED'
  );

})();
