/* =========================================================================
   FIX-03D5.9 STEP 8.4F-L
   PRODUCTION FORECAST LIFECYCLE GATE

   SOURCE:
   - STEP 8.4F Production Forecast Mapping Preview
   - Current LAST_FORECAST production lifecycle

   PURPOSE:
   - Determine whether the current runtime has a valid Production Forecast.
   - Classify lifecycle state before any future Production write stage.
   - Never create or modify LAST_FORECAST.
   - Never modify candidates.
   - Never call savePrediction().

   READ ONLY
   ZERO WRITE
   FAIL CLOSED
   ========================================================================= */

(function () {

  'use strict';


  function inspectProductionForecastLifecycle84FL() {

    /*
     * ---------------------------------------------------------
     * UPSTREAM 8.4F RESULT
     * ---------------------------------------------------------
     */

    const mappingPreview =
      window.LAST_FIX03D59_STEP84F ||
      null;


    /*
     * ---------------------------------------------------------
     * SAFE PRODUCTION FORECAST LOOKUP
     * ---------------------------------------------------------
     *
     * Do not directly evaluate LAST_FORECAST unless it exists.
     * Lifecycle inspection must never create Production state.
     */

    const productionEnvelope =
      typeof LAST_FORECAST !== 'undefined'
        ? LAST_FORECAST
        : null;


    const forecast =
      productionEnvelope &&
      productionEnvelope.forecast
        ? productionEnvelope.forecast
        : null;


    const forecastExists =
      Boolean(
        productionEnvelope &&
        forecast
      );


    /*
     * ---------------------------------------------------------
     * FORECAST SCHEMA VALIDATION
     * ---------------------------------------------------------
     */

    const forecastValid =
      Boolean(
        forecastExists &&
        forecast.empty !== true &&
        forecast.province &&
        Number.isInteger(
          forecast.windowSize
        ) &&
        Array.isArray(
          forecast.items
        ) &&
        forecast.items.length > 0
      );


    /*
     * ---------------------------------------------------------
     * 8.4F MAPPING STATE
     * ---------------------------------------------------------
     */

    const mappingPreviewExists =
      Boolean(
        mappingPreview
      );


    const mappingReady =
      Boolean(
        mappingPreviewExists &&
        mappingPreview.ready === true &&
        mappingPreview.passed === true &&
        mappingPreview.mappingValid === true &&
        mappingPreview.readOnly === true &&
        mappingPreview.writeAuthorized === false &&
        mappingPreview.productionWrite === false &&
        mappingPreview.storageWrite === false &&
        mappingPreview.integrationPerformed === false
      );


    /*
     * ---------------------------------------------------------
     * LIFECYCLE CLASSIFICATION
     * ---------------------------------------------------------
     */

    let lifecycleState =
      'UNKNOWN';


    let reason =
      'PRODUCTION_FORECAST_LIFECYCLE_UNKNOWN';


    if (
      !forecastExists
    ) {

      lifecycleState =
        'NO_FORECAST';

      reason =
        'NO_PRODUCTION_FORECAST_YET';

    } else if (
      !forecastValid
    ) {

      lifecycleState =
        'INVALID_FORECAST';

      reason =
        'PRODUCTION_FORECAST_SCHEMA_INVALID';

    } else if (
      !mappingPreviewExists
    ) {

      lifecycleState =
        'MAPPING_NOT_RUN';

      reason =
        'PRODUCTION_MAPPING_PREVIEW_NOT_AVAILABLE';

    } else if (
      !mappingReady
    ) {

      lifecycleState =
        'TARGET_NOT_READY';

      reason =
        'PRODUCTION_MAPPING_TARGET_NOT_READY';

    } else {

      lifecycleState =
        'MAPPING_READY';

      reason =
        'PRODUCTION_FORECAST_LIFECYCLE_READY';

    }


    /*
     * ---------------------------------------------------------
     * FUTURE-STAGE GATE
     * ---------------------------------------------------------
     *
     * This does NOT authorize a write.
     * It only states whether lifecycle prerequisites are ready
     * for another explicitly guarded stage.
     */

    const lifecycleReady =
      lifecycleState ===
      'MAPPING_READY';


    const result = {

      ready: true,

      passed:
        lifecycleReady,

      reason,

      step:
        '8.4F-L',

      sourceStep:
        '8.4F',

      lifecycleState,

      lifecycleReady,

      forecastExists,

      forecastValid,

      forecastProvince:
        forecast?.province ||
        null,

      forecastWindowSize:
        forecast?.windowSize ??
        null,

      forecastPrizeCount:
        Array.isArray(
          forecast?.items
        )
          ? forecast.items.length
          : 0,

      mappingPreviewExists,

      mappingReady,

      /*
       * HARD SAFETY LOCKS
       */

      productionIntegrationEnabled:
        false,

      promotionEnabled:
        false,

      writeAuthorized:
        false,

      canonicalWrite:
        false,

      productionWrite:
        false,

      storageWrite:
        false,

      integrationPerformed:
        false,

      savePredictionCalled:
        false,

      forecastCreated:
        false,

      forecastModified:
        false,

      candidateModified:
        false,

      dryRun:
        true,

      readOnly:
        true,

      failClosed:
        true

    };


    window.LAST_FIX03D59_STEP84FL =
      result;


    return result;

  }


  /*
   * Expose inspector only.
   *
   * IMPORTANT:
   * Do not auto-run here.
   * 8.4F itself depends on runtime state produced elsewhere.
   */

  window.inspectProductionForecastLifecycle84FL =
    inspectProductionForecastLifecycle84FL;


  console.log(
    'FIX-03D5.9 STEP 8.4F-L loaded — Production Forecast Lifecycle Gate / READ ONLY / ZERO WRITE / FAIL CLOSED'
  );

})();
