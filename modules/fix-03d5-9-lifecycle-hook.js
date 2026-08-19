/* =========================================================================
   FIX-03D5.9 STEP 8.4F-LH
   PRODUCTION FORECAST LIFECYCLE HOOK

   SOURCE:
   - STEP 8.4F-L Production Forecast Lifecycle Gate
   - STEP 8.4F-L Read-Only Lifecycle Bridge
   - STEP 8.3R Certified Commit Simulation
   - Existing FIX-03D5.9 certification / preview pipeline

   PURPOSE:
   - Observe Production Forecast lifecycle through STEP 8.4F-L.
   - Bootstrap the existing READ-ONLY 8.3R certification when required.
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


  let lastProcessedSnapshotKey84FLH =
    null;


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


    const result = {

      ready:
        mappingReady,

      passed:
        mappingReady,

      step:
        '8.4F-LH',

      reason:
        mappingReady
          ? 'LIFECYCLE_MAPPING_PREVIEW_READY'
          : 'LIFECYCLE_MAPPING_PREVIEW_NOT_READY',

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
        0,

      mappingReady,

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
   * SNAPSHOT KEY
   * ---------------------------------------------------------
   */

  function buildSnapshotKey84FLH(
    bridge
  ) {

    return [
      bridge.lifecycleState || '',
      bridge.forecastExists === true
        ? '1'
        : '0',
      bridge.forecastValid === true
        ? '1'
        : '0',
      bridge.forecastProvince || '',
      bridge.forecastWindowSize ?? '',
      bridge.forecastPrizeCount ?? 0
    ].join('|');

  }


  /*
   * ---------------------------------------------------------
   * READ LIFECYCLE THROUGH 8.4F-L ONLY
   * ---------------------------------------------------------
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
              : String(error)
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


    if (
      lifecycle?.forecastExists !== true ||
      lifecycle?.forecastValid !== true ||
      bridge.forecastExists !== true ||
      bridge.forecastValid !== true
    ) {

      fail84FLH(
        'FORECAST_NOT_VALID_FOR_HOOK',
        {
          lifecycleState:
            lifecycle?.lifecycleState ||
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
   * 8.3R CERTIFICATION BOOTSTRAP
   * ---------------------------------------------------------
   *
   * 8.3R engine can already be loaded while its snapshot
   * has not yet been published to LAST_FIX03D59_STEP83R.
   *
   * Rebuild only the existing READ-ONLY simulation.
   * ZERO PROMOTION.
   * ZERO COMMIT.
   * ZERO PRODUCTION WRITE.
   * ZERO STORAGE WRITE.
   */

  function ensureCertified83R84FLH() {

    let certified83R =
      window.LAST_FIX03D59_STEP83R ||
      null;


    if (
      !certified83R
    ) {

      const builder =
        window
          .buildProductionPromotionCommitSimulation83R;


      if (
        typeof builder !==
        'function'
      ) {

        return fail84FLH(
          'CERTIFIED_83R_ENGINE_NOT_AVAILABLE'
        );

      }


      try {

        certified83R =
          builder();

      } catch (
        error
      ) {

        return fail84FLH(
          'CERTIFIED_83R_EXCEPTION',
          {
            stageReason:
              error &&
              error.message
                ? error.message
                : String(error)
          }
        );

      }


      /*
       * Publish only the existing READ-ONLY
       * certification result expected by 8.4A+.
       */

      window.LAST_FIX03D59_STEP83R =
        certified83R;

    }


    if (
      !certified83R ||
      certified83R.ready !== true ||
      certified83R.passed !== true ||
      certified83R.simulationValid !== true
    ) {

      return fail84FLH(
        'CERTIFIED_83R_NOT_AVAILABLE',
        {
          stageReason:
            certified83R?.reason ||
            null
        }
      );

    }


    /*
     * Explicitly verify the safety boundary
     * before allowing downstream preview stages.
     */

    const safetyValid =
      Boolean(
        certified83R.productionWrite === false &&
        certified83R.storageWrite === false &&
        certified83R.promotionPerformed === false &&
        certified83R.commitPerformed === false &&
        certified83R.dryRun === true &&
        certified83R.readOnly === true
      );


    if (
      !safetyValid
    ) {

      return fail84FLH(
        'CERTIFIED_83R_SAFETY_BOUNDARY_INVALID'
      );

    }


    return {

      ok: true,

      certified83R

    };

  }


  /*
   * ---------------------------------------------------------
   * EXISTING CERTIFIED PREVIEW PIPELINE
   * ---------------------------------------------------------
   */

  function runExistingPipeline84FLH() {

    /*
     * First guarantee that the certified 8.3R snapshot
     * exists before 8.4A+ reads it.
     */

    const certification =
      ensureCertified83R84FLH();


    if (
      !certification ||
      certification.ok !== true
    ) {

      return (
        window.LAST_FIX03D59_STEP84FLH ||
        null
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
                : String(error)
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
              : String(error)
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
   * LIFECYCLE INSPECTION
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


      const snapshotKey =
        buildSnapshotKey84FLH(
          bridge
        );


      if (
        snapshotKey ===
        lastProcessedSnapshotKey84FLH
      ) {

        return (
          window.LAST_FIX03D59_STEP84FLH ||
          null
        );

      }


      lastProcessedSnapshotKey84FLH =
        snapshotKey;


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
              : String(error)
        }
      );


    } finally {

      running84FLH =
        false;

    }

  }


  /*
   * ---------------------------------------------------------
   * PUBLIC READ-ONLY API
   * ---------------------------------------------------------
   */

  window.inspectLifecycle84FLH =
    inspectLifecycle84FLH;


  window.FIX03D59_STEP84FLH_HOOK_LOADED =
    true;


  /*
   * Poll lifecycle only.
   *
   * No interception.
   * No Production mutation.
   * No storage write.
   */

  window.setInterval(
    inspectLifecycle84FLH,
    POLL_INTERVAL_MS_84FLH
  );


  /*
   * Initial inspection.
   */

  inspectLifecycle84FLH();


  console.log(
    'FIX-03D5.9 STEP 8.4F-LH loaded — 8.3R Bootstrap + Snapshot Lifecycle Hook / READ ONLY / ZERO WRITE / FAIL CLOSED'
  );

})();
