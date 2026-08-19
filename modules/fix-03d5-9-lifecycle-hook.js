/* =========================================================================
   FIX-03D5.9 STEP 8.4F-LH
   PRODUCTION FORECAST LIFECYCLE HOOK

   SOURCE:
   - STEP 8.4F-L Production Forecast Lifecycle Gate
   - STEP 8.4F-L Read-Only Lifecycle Bridge
   - Existing FIX-03D5.9 certification / preview pipeline

   PURPOSE:
   - Observe Production Forecast lifecycle through STEP 8.4F-L.
   - Never read LAST_FORECAST directly.
   - Never create or modify LAST_FORECAST.
   - Never modify candidates.
   - Never call savePrediction().
   - Never write production/storage.
   - Fail closed whenever an upstream prerequisite is unavailable.

   READ ONLY
   ZERO WRITE
   FAIL CLOSED
   ========================================================================= */

(function () {

  'use strict';


  const POLL_INTERVAL_MS_84FLH =
    500;


  let running84FLH =
    false;


  let lastProcessedBridge84FLH =
    null;


  /*
   * ---------------------------------------------------------
   * FAIL RESULT
   * ---------------------------------------------------------
   */

  function fail84FLH(
    reason,
    extra = {}
  ) {

    const result = {

      ready:
        false,

      passed:
        false,

      step:
        '8.4F-LH',

      reason,

      writeAuthorized:
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

      readOnly:
        true,

      failClosed:
        true,

      ...extra

    };


    window.LAST_FIX03D59_STEP84FLH =
      result;


    return result;

  }


  /*
   * ---------------------------------------------------------
   * SUCCESS RESULT
   * ---------------------------------------------------------
   */

  function success84FLH(
    bridge,
    mapping
  ) {

    const mappingReady =
      Boolean(
        mapping &&
        mapping.ready === true &&
        mapping.passed === true &&
        mapping.mappingValid === true &&
        mapping.readOnly === true &&
        mapping.writeAuthorized === false &&
        mapping.productionWrite === false &&
        mapping.storageWrite === false &&
        mapping.integrationPerformed === false
      );


    if (
      !mappingReady
    ) {

      return fail84FLH(
        'LIFECYCLE_MAPPING_PREVIEW_NOT_READY',
        {
          lifecycleState:
            bridge?.lifecycleState ||
            null,

          forecastExists:
            bridge?.forecastExists === true,

          forecastValid:
            bridge?.forecastValid === true,

          mappingReady:
            false
        }
      );

    }


    const result = {

      ready:
        true,

      passed:
        true,

      step:
        '8.4F-LH',

      reason:
        'LIFECYCLE_MAPPING_PREVIEW_READY',

      lifecycleState:
        bridge?.lifecycleState ||
        null,

      lifecycleReady:
        bridge?.lifecycleReady === true,

      forecastExists:
        bridge?.forecastExists === true,

      forecastValid:
        bridge?.forecastValid === true,

      forecastProvince:
        bridge?.forecastProvince ||
        null,

      forecastWindowSize:
        bridge?.forecastWindowSize ??
        null,

      forecastPrizeCount:
        bridge?.forecastPrizeCount ??
        0,

      mappingReady:
        true,

      mappingStep:
        mapping?.step ||
        null,

      writeAuthorized:
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

      readOnly:
        true,

      failClosed:
        true

    };


    window.LAST_FIX03D59_STEP84FLH =
      result;


    return result;

  }


  /*
   * ---------------------------------------------------------
   * REFRESH 8.4F-L + READ BRIDGE
   * ---------------------------------------------------------
   *
   * 8.4F-L is the only component that reads the
   * Production Forecast.
   *
   * This hook consumes metadata only.
   */

  function getLifecycleBridge84FLH() {

    const inspector =
      window
        .inspectProductionForecastLifecycle84FL;


    if (
      typeof inspector !==
      'function'
    ) {

      fail84FLH(
        'LIFECYCLE_GATE_NOT_AVAILABLE'
      );

      return null;

    }


    let lifecycle;


    try {

      lifecycle =
        inspector();

    } catch (
      error
    ) {

      fail84FLH(
        'LIFECYCLE_GATE_EXCEPTION',
        {
          stageReason:
            error &&
            error.message
              ? error.message
              : String(
                  error
                )
        }
      );

      return null;

    }


    const bridge =
      window
        .LAST_FIX03D59_STEP84FL_BRIDGE ||
      null;


    if (
      !bridge
    ) {

      fail84FLH(
        'LIFECYCLE_BRIDGE_NOT_AVAILABLE'
      );

      return null;

    }


    /*
     * Verify gate and bridge agree.
     */

    if (
      lifecycle?.forecastExists !==
        bridge.forecastExists ||
      lifecycle?.forecastValid !==
        bridge.forecastValid
    ) {

      fail84FLH(
        'LIFECYCLE_BRIDGE_STATE_MISMATCH',
        {
          lifecycleForecastExists:
            lifecycle?.forecastExists === true,

          bridgeForecastExists:
            bridge.forecastExists === true,

          lifecycleForecastValid:
            lifecycle?.forecastValid === true,

          bridgeForecastValid:
            bridge.forecastValid === true
        }
      );

      return null;

    }


    if (
      bridge.forecastExists !== true ||
      bridge.forecastValid !== true
    ) {

      fail84FLH(
        'FORECAST_NOT_VALID_FOR_HOOK',
        {
          lifecycleState:
            bridge.lifecycleState ||
            null,

          forecastExists:
            bridge.forecastExists === true,

          forecastValid:
            bridge.forecastValid === true,

          forecastProvince:
            bridge.forecastProvince ||
            null,

          forecastWindowSize:
            bridge.forecastWindowSize ??
            null,

          forecastPrizeCount:
            bridge.forecastPrizeCount ??
            0
        }
      );

      return null;

    }


    return bridge;

  }


  /*
   * ---------------------------------------------------------
   * EXISTING CERTIFIED PREVIEW PIPELINE
   * ---------------------------------------------------------
   */

  function runExistingPipeline84FLH() {

    const certified83R =
      window.LAST_FIX03D59_STEP83R ||
      null;


    if (
      !certified83R ||
      certified83R.ready !== true ||
      certified83R.passed !== true
    ) {

      return fail84FLH(
        'CERTIFIED_83R_NOT_AVAILABLE'
      );

    }


    const stageNames = [

      'buildProductionIntegrationBaseline84A',

      'buildProductionIntegrationReadinessGate84B',

      'buildProductionIntegrationCandidateSnapshot84C',

      'buildProductionIntegrationBoundaryContract84D',

      'buildProductionWriteAdapterContract84E'

    ];


    for (
      const name
      of stageNames
    ) {

      const fn =
        window[name];


      if (
        typeof fn !==
        'function'
      ) {

        return fail84FLH(
          'PIPELINE_STAGE_NOT_AVAILABLE',
          {
            missingStage:
              name
          }
        );

      }


      let stageResult;


      try {

        stageResult =
          fn();

      } catch (
        error
      ) {

        return fail84FLH(
          'PIPELINE_STAGE_EXCEPTION',
          {
            failedStage:
              name,

            stageReason:
              error &&
              error.message
                ? error.message
                : String(
                    error
                  )
          }
        );

      }


      if (
        !stageResult ||
        stageResult.ready !== true ||
        stageResult.passed !== true
      ) {

        return fail84FLH(
          'PIPELINE_STAGE_FAILED',
          {
            failedStage:
              name,

            stageReason:
              stageResult?.reason ||
              null
          }
        );

      }

    }


    const mappingFn =
      window
        .buildProductionForecastMappingPreview84F;


    if (
      typeof mappingFn !==
      'function'
    ) {

      return fail84FLH(
        'MAPPING_STAGE_NOT_AVAILABLE'
      );

    }


    let mapping;


    try {

      mapping =
        mappingFn();

    } catch (
      error
    ) {

      return fail84FLH(
        'MAPPING_STAGE_EXCEPTION',
        {
          failedStage:
            'buildProductionForecastMappingPreview84F',

          stageReason:
            error &&
            error.message
              ? error.message
              : String(
                  error
                )
        }
      );

    }


    if (
      !mapping ||
      mapping.ready !== true ||
      mapping.passed !== true ||
      mapping.mappingValid !== true
    ) {

      return fail84FLH(
        'MAPPING_STAGE_FAILED',
        {
          failedStage:
            'buildProductionForecastMappingPreview84F',

          stageReason:
            mapping?.reason ||
            null
        }
      );

    }


    return {

      ok:
        true,

      mapping

    };

  }


  /*
   * ---------------------------------------------------------
   * MAIN LIFECYCLE INSPECTION
   * ---------------------------------------------------------
   */

  function inspectLifecycle84FLH() {

    if (
      running84FLH
    ) {

      return (
        window.LAST_FIX03D59_STEP84FLH ||
        null
      );

    }


    running84FLH =
      true;


    try {

      const bridge =
        getLifecycleBridge84FLH();


      if (
        !bridge
      ) {

        return (
          window.LAST_FIX03D59_STEP84FLH ||
          null
        );

      }


      /*
       * Every 8.4F-L inspection creates a fresh,
       * metadata-only bridge object.
       *
       * If the exact same bridge object reaches here
       * again, do not execute the pipeline twice.
       */

      if (
        bridge ===
        lastProcessedBridge84FLH
      ) {

        return (
          window.LAST_FIX03D59_STEP84FLH ||
          null
        );

      }


      lastProcessedBridge84FLH =
        bridge;


      const pipeline =
        runExistingPipeline84FLH();


      if (
        !pipeline ||
        pipeline.ok !== true
      ) {

        return (
          window.LAST_FIX03D59_STEP84FLH ||
          null
        );

      }


      return success84FLH(
        bridge,
        pipeline.mapping
      );


    } catch (
      error
    ) {

      return fail84FLH(
        'LIFECYCLE_HOOK_EXCEPTION',
        {
          stageReason:
            error &&
            error.message
              ? error.message
              : String(
                  error
                )
        }
      );


    } finally {

      running84FLH =
        false;

    }

  }


  /*
   * ---------------------------------------------------------
   * PUBLIC READ-ONLY ENTRY
   * ---------------------------------------------------------
   */

  window.inspectLifecycle84FLH =
    inspectLifecycle84FLH;


  window.FIX03D59_STEP84FLH_HOOK_LOADED =
    true;


  /*
   * Observe lifecycle without intercepting Production.
   */

  window.setInterval(
    inspectLifecycle84FLH,
    POLL_INTERVAL_MS_84FLH
  );


  /*
   * Safe initial inspection.
   */

  inspectLifecycle84FLH();


  console.log(
    'FIX-03D5.9 STEP 8.4F-LH loaded — Lifecycle Bridge Hook / READ ONLY / ZERO WRITE / FAIL CLOSED'
  );

})();

