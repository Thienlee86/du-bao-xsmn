/* =========================================================================
   FIX-03D5.9
   FINAL PRODUCTION INTEGRATION GATE — V1

   PURPOSE:
   - Bind STEP 8.4F Mapping Preview to the CURRENT LAST_FORECAST.
   - Reject stale / missing / invalid runtime state.
   - Verify that certification belongs to the forecast currently in RAM.
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
    'FIX03D59_FINAL_INTEGRATION_V1';


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


  function getForecast() {

    const container =
      window.LAST_FORECAST;


    if (
      !isObject(container)
    ) {

      return null;

    }


    /*
     * Existing Production Core stores:
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
     * Fail-safe compatibility only.
     *
     * If a runtime exposes the forecast object
     * directly, allow inspection without mutation.
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


  function getMappingPreview() {

    return (
      window.LAST_FIX03D59_STEP84F ||
      window.LAST_FIX03D59_STEP84F_RESULT ||
      null
    );

  }


  /*
   * =========================================================
   * 2. FORECAST IDENTITY
   *
   * No new persistent ID is created.
   *
   * Identity is derived only from immutable-looking
   * fields already present in the current forecast.
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
                      function (
                        number
                      ) {

                        return String(
                          number
                        );

                      }
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
      String(windowSize),
      itemSignature
    ].join('::');

  }


  /*
   * =========================================================
   * 3. MAPPING IDENTITY EXTRACTION
   *
   * STEP 8.4F has evolved through several read-only builds.
   * We inspect known fields only.
   *
   * No mutation.
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
   * 4. FINAL INTEGRATION GATE
   * =========================================================
   */

  function inspectFinalIntegration() {

    const forecast =
      getForecast();


    const mapping =
      getMappingPreview();


    /*
     * ---------------------------------------------------------
     * FAIL CLOSED — CURRENT FORECAST
     * ---------------------------------------------------------
     */

    if (!forecast) {

      return {

        ready: false,

        passed: false,

        authorized: false,

        reason:
          'CURRENT_FORECAST_NOT_AVAILABLE',

        version:
          VERSION,

        readOnly:
          true,

        productionWrite:
          false,

        storageWrite:
          false,

        savePredictionCalled:
          false

      };

    }


    /*
     * ---------------------------------------------------------
     * FAIL CLOSED — 8.4F
     * ---------------------------------------------------------
     */

    if (
      !isObject(
        mapping
      )
    ) {

      return {

        ready: false,

        passed: false,

        authorized: false,

        reason:
          'STEP_84F_MAPPING_NOT_AVAILABLE',

        version:
          VERSION,

        currentForecastIdentity:
          buildForecastIdentity(
            forecast
          ),

        readOnly:
          true,

        productionWrite:
          false,

        storageWrite:
          false,

        savePredictionCalled:
          false

      };

    }


    /*
     * 8.4F itself must already consider its
     * mapping usable.
     */

    const mappingPassed =
      (
        mapping.passed === true ||
        mapping.ready === true ||
        mapping.mappingReady === true
      );


    if (!mappingPassed) {

      return {

        ready: false,

        passed: false,

        authorized: false,

        reason:
          'STEP_84F_NOT_READY',

        version:
          VERSION,

        mappingReason:
          mapping.reason || null,

        currentForecastIdentity:
          buildForecastIdentity(
            forecast
          ),

        readOnly:
          true,

        productionWrite:
          false,

        storageWrite:
          false,

        savePredictionCalled:
          false

      };

    }


    /*
     * ---------------------------------------------------------
     * PROVINCE BINDING
     * ---------------------------------------------------------
     */

    const forecastProvince =
      normalizeText(
        forecast.province
      );


    const mappingProvince =
      getMappingProvince(
        mapping
      );


    if (
      !forecastProvince
    ) {

      return {

        ready: false,

        passed: false,

        authorized: false,

        reason:
          'FORECAST_PROVINCE_NOT_AVAILABLE',

        version:
          VERSION,

        readOnly:
          true,

        productionWrite:
          false,

        storageWrite:
          false,

        savePredictionCalled:
          false

      };

    }


    if (
      mappingProvince &&
      mappingProvince !==
        forecastProvince
    ) {

      return {

        ready: false,

        passed: false,

        authorized: false,

        reason:
          'STALE_FORECAST_PROVINCE_MISMATCH',

        version:
          VERSION,

        forecastProvince:
          forecastProvince,

        mappingProvince:
          mappingProvince,

        currentForecastIdentity:
          buildForecastIdentity(
            forecast
          ),

        readOnly:
          true,

        productionWrite:
          false,

        storageWrite:
          false,

        savePredictionCalled:
          false

      };

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


    if (
      forecastTargetDate &&
      mappingTargetDate &&
      forecastTargetDate !==
        mappingTargetDate
    ) {

      return {

        ready: false,

        passed: false,

        authorized: false,

        reason:
          'STALE_FORECAST_TARGET_DATE_MISMATCH',

        version:
          VERSION,

        forecastProvince:
          forecastProvince,

        forecastTargetDate:
          forecastTargetDate,

        mappingTargetDate:
          mappingTargetDate,

        currentForecastIdentity:
          buildForecastIdentity(
            forecast
          ),

        readOnly:
          true,

        productionWrite:
          false,

        storageWrite:
          false,

        savePredictionCalled:
          false

      };

    }


    /*
     * ---------------------------------------------------------
     * FINAL READ-ONLY AUTHORIZATION
     * ---------------------------------------------------------
     *
     * "authorized" means:
     *
     * authorized for the NEXT adapter boundary.
     *
     * It does NOT mean a write occurred.
     * ---------------------------------------------------------
     */

    const result = {

      ready: true,

      passed: true,

      authorized: true,

      reason:
        'FINAL_INTEGRATION_GATE_PASS',

      version:
        VERSION,

      mode:
        'READ_ONLY_FINAL_GATE',

      forecastProvince:
        forecastProvince,

      forecastTargetDate:
        forecastTargetDate || null,

      mappingProvince:
        mappingProvince || null,

      mappingTargetDate:
        mappingTargetDate || null,

      currentForecastIdentity:
        buildForecastIdentity(
          forecast
        ),

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
          false

      },

      inspectedAt:
        new Date().toISOString()

    };


    /*
     * Diagnostic RAM only.
     *
     * NOT production persistence.
     */

    window
      .LAST_FIX03D59_FINAL_INTEGRATION =
      result;


    return result;

  }


  /*
   * =========================================================
   * 5. PUBLIC READ-ONLY API
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
    'FIX-03D5.9 Final Integration V1 loaded — READ ONLY / ZERO WRITE'
  );

})();
