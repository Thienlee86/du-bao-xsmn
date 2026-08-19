/* =========================================================================
   FIX-03D5.9 STEP 8.4F-LH
   PRODUCTION FORECAST LIFECYCLE SNAPSHOT HOOK

   SOURCE:
   - STEP 8.4F-L Production Forecast Lifecycle Gate
   - STEP 8.4F-L Read-Only Lifecycle Bridge
   - Existing FIX-03D5.9 certification / preview pipeline

   PURPOSE:
   - Consume the lifecycle snapshot published by STEP 8.4F-L.
   - Never read LAST_FORECAST directly.
   - Never invoke the 8.4F-L inspector from this hook.
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


  /*
   * ---------------------------------------------------------
   * RESULT HELPERS
   * ---------------------------------------------------------
   */

  function fail84FLH(
    reason,
    extra = {}
  ) {

    const result = {

      ready: false,
      passed: false,

      step:
        '8.4F-LH',

      reason,

      writeAuthorized: false,
      productionWrite: false,
      storageWrite: false,
      integrationPerformed: false,

      savePredictionCalled: false,
      forecastCreated: false,
      forecastModified: false,
      candidateModified: false,

      readOnly: true,
      failClosed: true,

      ...extra

    };


    window.LAST_FIX03D59_STEP84FLH =
      result;


    return result;

  }


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

      ready: true,
      passed: true,

      step:
        '8.4F-LH',

      reason:
        'LIFECYCLE_MAPPING_PREVIEW_READY',

      lifecycleState:
        bridge.lifecycleState ||
        null,

      lifecycleReady:
        bridge.lifecycleReady === true,

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
        0,

      mappingReady: true,

      mappingStep:
        mapping.step ||
        null,

      writeAuthorized: false,
      productionWrite: false,
      storageWrite: false,
      integrationPerformed: false,

      savePredictionCalled: false,
      forecastCreated: false,
      forecastModified: false,
      candidateModified: false,

      readOnly: true,
      failClosed: true

    };


    window.LAST_FIX03D59_STEP84FLH =
      result;


    return result;

  }


  /*
   * ---------------------------------------------------------
   * READ PUBLISHED 8.4F-L BRIDGE
   * ---------------------------------------------------------
   *
   * IMPORTANT:
   *
   * This hook does NOT:
   *
   * - read LAST_FORECAST
   * - call inspectProductionForecastLifecycle84FL()
   * - refresh the lifecycle gate
   * - poll Production state
   *
   * It consumes only the snapshot already published by 8.4F-L.
   */

  function getPublishedBridge84FLH() {

    const lifecycle =
      window.LAST_FIX03D59_STEP84FL ||
      null;


    const bridge =
      window.LAST_FIX03D59_STEP84FL_BRIDGE ||
      null;


    if (
      !lifecycle
    ) {

      fail84FLH(
        'LIFECYCLE_RESULT_NOT_AVAILABLE'
      );

      return null;

    }


    if (
      !bridge
    ) {

      fail84FLH(
        'LIFECYCLE_BRIDGE_NOT_AVAILABLE'
      );

      return null;

    }


    /*
     * Verify both snapshots describe the same
     * lifecycle state.
     */

    if (
      lifecycle.forecastExists !==
        bridge.forecastExists ||
      lifecycle.forecastValid !==
        bridge.forecastValid
    ) {

      fail84FLH(
        'LIFECYCLE_BRIDGE_STATE_MISMATCH',
        {
          lifecycleForecastExists:
            lifecycle.forecastExists === true,

          bridgeForecastExists:
            bridge.forecastExists === true,

          lifecycleForecastValid:
            lifecycle.forecastValid === true,

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
   *
   * READ ONLY.
   * Every prerequisite must explicitly PASS.
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
        typeof fn !== 'function'
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
              error?.message ||
              String(error)
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
      typeof mappingFn !== 'function'
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
            error?.message ||
            String(error)
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

      ok: true,
      mapping

    };

  }


  /*
   * ---------------------------------------------------------
   * MAIN SNAPSHOT INSPECTION
   * ---------------------------------------------------------
   */

  function inspectLifecycle84FLH() {

    try {

      const bridge =
        getPublishedBridge84FLH();


      if (
        !bridge
      ) {

        return (
          window.LAST_FIX03D59_STEP84FLH ||
          null
        );

      }


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
            error?.message ||
            String(error)
        }
      );

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
   * IMPORTANT:
   *
   * NO setInterval().
   * NO automatic lifecycle refresh.
   *
   * The test/runtime explicitly invokes this hook
   * after STEP 8.4F-L has published its snapshot.
   */


  console.log(
    'FIX-03D5.9 STEP 8.4F-LH loaded — Snapshot Bridge Hook / READ ONLY / ZERO WRITE / FAIL CLOSED'
  );

})();

