/* =========================================================================
   FIX-03D5.9 STEP 8.4F-L
   PRODUCTION FORECAST LIFECYCLE GATE

   PURPOSE:
   - Inspect the current Production Forecast lifecycle.
   - Publish a read-only lifecycle snapshot for downstream observers.
   - Never create or modify LAST_FORECAST.
   - Never modify candidates.
   - Never call savePrediction().
   - Never write production/storage.

   READ ONLY
   ZERO WRITE
   FAIL CLOSED
   ========================================================================= */

(function () {

  'use strict';


  /*
   * ---------------------------------------------------------
   * SAFE RESULT PUBLISHER
   * ---------------------------------------------------------
   */

  function publishLifecycle84FL(
    result
  ) {

    window.LAST_FIX03D59_STEP84FL =
      result;


    /*
     * Read-only bridge for STEP 8.4F-LH.
     *
     * The hook consumes this snapshot instead of reading
     * LAST_FORECAST directly.
     */

    window.LAST_FIX03D59_STEP84FL_BRIDGE = {

      step:
        '8.4F-L',

      lifecycleState:
        result.lifecycleState,

      lifecycleReady:
        result.lifecycleReady,

      forecastExists:
        result.forecastExists,

      forecastValid:
        result.forecastValid,

      forecastProvince:
        result.forecastProvince,

      forecastWindowSize:
        result.forecastWindowSize,

      forecastPrizeCount:
        result.forecastPrizeCount,

      mappingPreviewExists:
        result.mappingPreviewExists,

      mappingReady:
        result.mappingReady,

      readOnly:
        true,

      writeAuthorized:
        false,

      productionWrite:
        false,

      storageWrite:
        false,

      integrationPerformed:
        false

    };


    return result;

  }


  /*
   * ---------------------------------------------------------
   * LIFECYCLE INSPECTOR
   * ---------------------------------------------------------
   */

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
     * This is the ONLY layer in the lifecycle pair allowed
     * to inspect the existing Production Forecast.
     *
     * It never creates or modifies it.
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


    const lifecycleReady =
      lifecycleState ===
      'MAPPING_READY';


    /*
     * ---------------------------------------------------------
     * RESULT
     * ---------------------------------------------------------
     */

    const result = {

      ready:
        true,

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
        forecast
          ? forecast.province || null
          : null,

      forecastWindowSize:
        forecast
          ? forecast.windowSize ?? null
          : null,

      forecastPrizeCount:
        forecast &&
        Array.isArray(
          forecast.items
        )
          ? forecast.items.length
          : 0,

      mappingPreviewExists,

      mappingReady,


      /*
       * -------------------------------------------------------
       * HARD SAFETY LOCKS
       * -------------------------------------------------------
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


    return publishLifecycle84FL(
      result
    );

  }


  /*
   * ---------------------------------------------------------
   * PUBLIC API
   * ---------------------------------------------------------
   */

  window.inspectProductionForecastLifecycle84FL =
    inspectProductionForecastLifecycle84FL;


  window.FIX03D59_STEP84FL_LOADED =
    true;


  /*
   * Do NOT auto-run.
   *
   * Production Forecast may not exist yet when this script
   * first loads. Downstream hook/test explicitly invokes the
   * inspector when required.
   */


  console.log(
    'FIX-03D5.9 STEP 8.4F-L loaded — Lifecycle Gate + Read-Only Bridge / ZERO WRITE / FAIL CLOSED'
  );

})();
