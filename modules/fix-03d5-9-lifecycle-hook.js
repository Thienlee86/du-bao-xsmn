/* =========================================================================
   FIX-03D5.9 STEP 8.4F-LH
   RUNTIME CERTIFICATION REBUILD + LIFECYCLE HOOK

   PURPOSE:
   - Restore READ-ONLY RAM certification after page reload.
   - Rebuild the already-certified 8.2A -> 8.3R chain.
   - Publish RAM aliases required by downstream stages.
   - Continue existing 8.4A -> 8.4F preview pipeline.
   - Observe Production Forecast lifecycle through 8.4F-L.

   IMPORTANT:
   - NO UI restoration.
   - NO reporter calls.
   - NO production write.
   - NO storage write.
   - NO promotion.
   - NO transaction execution.
   - NO commit.
   - NO savePrediction().
   - NO LAST_FORECAST mutation.

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
   * =========================================================
   * RESULT HELPERS
   * =========================================================
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

      promotionPerformed: false,
      transactionExecuted: false,
      commitPerformed: false,

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

      certificationRebuilt:
        true,

      certified83R:
        true,

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

      promotionPerformed: false,
      transactionExecuted: false,
      commitPerformed: false,

      readOnly: true,
      failClosed: true

    };


    window.LAST_FIX03D59_STEP84FLH =
      result;


    return result;

  }


  /*
   * =========================================================
   * FUNCTION RESOLUTION
   * =========================================================
   */

  function requireFunction84FLH(
    name
  ) {

    const fn =
      window[name];


    if (
      typeof fn !==
      'function'
    ) {

      fail84FLH(
        'CERTIFICATION_ENGINE_NOT_AVAILABLE',
        {
          missingStage:
            name
        }
      );

      return null;

    }


    return fn;

  }


  /*
   * =========================================================
   * SAFE STAGE EXECUTION
   * =========================================================
   */

  function executeStage84FLH(
    stage,
    functionName,
    publishName,
    args = []
  ) {

    const fn =
      requireFunction84FLH(
        functionName
      );


    if (
      !fn
    ) {

      return null;

    }


    let result;


    try {

      result =
        fn(
          ...args
        );

    } catch (
      error
    ) {

      fail84FLH(
        'CERTIFICATION_STAGE_EXCEPTION',
        {
          failedStage:
            stage,

          failedFunction:
            functionName,

          stageReason:
            error &&
            error.message
              ? error.message
              : String(error)
        }
      );

      return null;

    }


    if (
      !result ||
      result.ready !== true
    ) {

      fail84FLH(
        'CERTIFICATION_STAGE_NOT_READY',
        {
          failedStage:
            stage,

          failedFunction:
            functionName,

          stageReason:
            result?.reason ||
            null
        }
      );

      return null;

    }


    /*
     * Some historical engines publish their own LAST_* alias.
     * Others relied on reporter/UI wrappers.
     *
     * Bootstrap publishes RAM only.
     */

    if (
      publishName
    ) {

      window[publishName] =
        result;

    }


    return result;

  }


  /*
   * =========================================================
   * 8.2A -> 8.3R RAM CERTIFICATION REBUILD
   * =========================================================
   */

  function rebuildRuntimeCertification84FLH() {

    /*
     * ---------------------------------------------------------
     * FAST PATH
     * ---------------------------------------------------------
     *
     * If a valid 8.3R certification already exists,
     * do not rebuild anything.
     */

    const existing83R =
      window.LAST_FIX03D59_STEP83R ||
      null;


    if (
      existing83R &&
      existing83R.ready === true &&
      existing83R.passed === true &&
      existing83R.simulationValid === true
    ) {

      return {

        ok: true,
        rebuilt: false,
        result:
          existing83R

      };

    }


    /*
     * ---------------------------------------------------------
     * STEP 8.2A
     * CANONICAL ELIGIBILITY CONTRACT AUDIT
     * ---------------------------------------------------------
     */

    const step82A =
      executeStage84FLH(
        '8.2A',
        'runFix03D59Step82EligibilityAuditV26',
        'LAST_FIX03D59_STEP82A_RESULT'
      );


    if (
      !step82A
    ) {

      return null;

    }


    /*
     * ---------------------------------------------------------
     * STEP 8.2C
     * ELIGIBILITY DIAGNOSTIC
     * ---------------------------------------------------------
     */

    const step82C =
      executeStage84FLH(
        '8.2C',
        'runFix03D59Step82CEligibilityDiagnosticV26',
        'LAST_FIX03D59_STEP82C_RESULT'
      );


    if (
      !step82C
    ) {

      return null;

    }


    /*
     * ---------------------------------------------------------
     * STEP 8.3B
     * PRODUCTION CANDIDATE BOUNDARY
     *
     * Call the pure builder directly.
     * Do NOT call the historical reporter/button wrapper.
     * ---------------------------------------------------------
     */

    const step83B =
      executeStage84FLH(
        '8.3B',
        'buildProductionCandidateBoundaryV26',
        'LAST_FIX03D59_STEP83B_RESULT',
        [
          step82C
        ]
      );


    if (
      !step83B
    ) {

      return null;

    }


    /*
     * ---------------------------------------------------------
     * STEP 8.3C
     * CANDIDATE BOUNDARY VERIFICATION
     * ---------------------------------------------------------
     */

    const step83C =
      executeStage84FLH(
        '8.3C',
        'verifyProductionCandidateBoundary83C',
        'LAST_FIX03D59_STEP83C_RESULT'
      );


    if (
      !step83C
    ) {

      return null;

    }


    /*
     * ---------------------------------------------------------
     * STEP 8.3D
     * CANDIDATE LINEAGE AUDIT
     * ---------------------------------------------------------
     */

    const step83D =
      executeStage84FLH(
        '8.3D',
        'auditProductionCandidateLineage83D',
        'LAST_FIX03D59_STEP83D_RESULT'
      );


    if (
      !step83D
    ) {

      return null;

    }


    /*
     * ---------------------------------------------------------
     * STEP 8.3E
     * CANDIDATE PAYLOAD VERIFICATION
     * ---------------------------------------------------------
     */

    const step83E =
      executeStage84FLH(
        '8.3E',
        'verifyProductionCandidatePayload83E',
        'LAST_FIX03D59_STEP83E_RESULT'
      );


    if (
      !step83E
    ) {

      return null;

    }


    /*
     * ---------------------------------------------------------
     * STEP 8.3F
     * CANDIDATE FINAL GATE
     * ---------------------------------------------------------
     */

    const step83F =
      executeStage84FLH(
        '8.3F',
        'verifyProductionCandidateFinalGate83F',
        'LAST_FIX03D59_STEP83F_RESULT'
      );


    if (
      !step83F
    ) {

      return null;

    }


    /*
     * ---------------------------------------------------------
     * STEP 8.3G
     * FINAL GATE REPORT
     * ---------------------------------------------------------
     */

    const step83G =
      executeStage84FLH(
        '8.3G',
        'buildProductionCandidateFinalGateReport83G',
        'LAST_FIX03D59_STEP83G'
      );


    if (
      !step83G
    ) {

      return null;

    }


    /*
     * ---------------------------------------------------------
     * STEP 8.3H
     * RELEASE READINESS
     * ---------------------------------------------------------
     */

    const step83H =
      executeStage84FLH(
        '8.3H',
        'buildProductionCandidateReleaseReadiness83H',
        'LAST_FIX03D59_STEP83H'
      );


    if (
      !step83H
    ) {

      return null;

    }


    /*
     * ---------------------------------------------------------
     * STEP 8.3I
     * PROMOTION GUARD
     * ---------------------------------------------------------
     */

    const step83I =
      executeStage84FLH(
        '8.3I',
        'buildProductionPromotionGuard83I',
        'LAST_FIX03D59_STEP83I'
      );


    if (
      !step83I
    ) {

      return null;

    }


    /*
     * ---------------------------------------------------------
     * STEP 8.3J
     * PAYLOAD PREVIEW
     * ---------------------------------------------------------
     */

    const step83J =
      executeStage84FLH(
        '8.3J',
        'buildProductionPromotionPayloadPreview83J',
        'LAST_FIX03D59_STEP83J'
      );


    if (
      !step83J
    ) {

      return null;

    }


    /*
     * ---------------------------------------------------------
     * STEP 8.3K
     * FINAL PROMOTION GATE
     * ---------------------------------------------------------
     */

    const step83K =
      executeStage84FLH(
        '8.3K',
        'validateProductionPromotionFinalGate83K',
        'LAST_FIX03D59_STEP83K'
      );


    if (
      !step83K
    ) {

      return null;

    }


    /*
     * ---------------------------------------------------------
     * STEP 8.3L
     * COMMIT PLAN
     * ---------------------------------------------------------
     */

    const step83L =
      executeStage84FLH(
        '8.3L',
        'buildProductionPromotionCommitPlan83L',
        'LAST_FIX03D59_STEP83L'
      );


    if (
      !step83L
    ) {

      return null;

    }


    /*
     * ---------------------------------------------------------
     * STEP 8.3M
     * TRANSACTION PREFLIGHT
     * ---------------------------------------------------------
     */

    const step83M =
      executeStage84FLH(
        '8.3M',
        'buildProductionPromotionTransactionPreflight83M',
        'LAST_FIX03D59_STEP83M'
      );


    if (
      !step83M
    ) {

      return null;

    }


    /*
     * ---------------------------------------------------------
     * STEP 8.3N
     * TRANSACTION FINAL GATE
     * ---------------------------------------------------------
     */

    const step83N =
      executeStage84FLH(
        '8.3N',
        'buildProductionPromotionTransactionFinalGate83N',
        'LAST_FIX03D59_STEP83N'
      );


    if (
      !step83N
    ) {

      return null;

    }


    /*
     * ---------------------------------------------------------
     * STEP 8.3O
     * EXECUTION MANIFEST
     * DRY RUN ONLY
     * ---------------------------------------------------------
     */

    const step83O =
      executeStage84FLH(
        '8.3O',
        'buildProductionPromotionExecutionManifest83O',
        'LAST_FIX03D59_STEP83O'
      );


    if (
      !step83O
    ) {

      return null;

    }


    /*
     * ---------------------------------------------------------
     * STEP 8.3P
     * EXECUTION AUTHORIZATION GATE
     * ZERO EXECUTION
     * ---------------------------------------------------------
     */

    const step83P =
      executeStage84FLH(
        '8.3P',
        'buildProductionPromotionExecutionAuthorizationGate83P',
        'LAST_FIX03D59_STEP83P'
      );


    if (
      !step83P
    ) {

      return null;

    }


    /*
     * ---------------------------------------------------------
     * STEP 8.3Q
     * EXECUTION COMMIT GUARD
     * ZERO WRITE
     * ---------------------------------------------------------
     */

    const step83Q =
      executeStage84FLH(
        '8.3Q',
        'buildProductionPromotionExecutionCommitGuard83Q',
        'LAST_FIX03D59_STEP83Q'
      );


    if (
      !step83Q
    ) {

      return null;

    }


    /*
     * ---------------------------------------------------------
     * STEP 8.3R
     * COMMIT SIMULATION
     * DRY RUN / ZERO COMMIT
     * ---------------------------------------------------------
     */

    const step83R =
      executeStage84FLH(
        '8.3R',
        'buildProductionPromotionCommitSimulation83R',
        'LAST_FIX03D59_STEP83R'
      );


    if (
      !step83R
    ) {

      return null;

    }


    /*
     * ---------------------------------------------------------
     * FINAL 8.3R SAFETY CERTIFICATION
     * ---------------------------------------------------------
     */

    const certified =
      Boolean(
        step83R.ready === true &&
        step83R.passed === true &&
        step83R.simulationValid === true &&
        step83R.dryRun === true &&
        step83R.readOnly === true &&
        step83R.productionWrite === false &&
        step83R.storageWrite === false &&
        step83R.promotionPerformed === false &&
        step83R.commitPerformed === false
      );


    if (
      !certified
    ) {

      return fail84FLH(
        'CERTIFIED_83R_SAFETY_BOUNDARY_INVALID',
        {
          failedStage:
            '8.3R',

          stageReason:
            step83R.reason ||
            null
        }
      );

    }


    window.LAST_FIX03D59_RUNTIME_CERTIFICATION =
      {

        ready: true,
        passed: true,

        step:
          '8.2A→8.3R',

        reason:
          'RUNTIME_CERTIFICATION_REBUILT',

        finalStep:
          '8.3R',

        readOnly: true,

        writeAuthorized: false,
        productionWrite: false,
        storageWrite: false,

        promotionPerformed: false,
        transactionExecuted: false,
        commitPerformed: false

      };


    return {

      ok: true,
      rebuilt: true,
      result:
        step83R

    };

  }


  /*
   * =========================================================
   * LIFECYCLE BRIDGE
   * =========================================================
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
   * =========================================================
   * SNAPSHOT KEY
   * =========================================================
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
   * =========================================================
   * EXISTING 8.4A -> 8.4F PIPELINE
   * =========================================================
   */

  function runExistingPipeline84FLH() {

    /*
     * Restore RAM certification first.
     */

    const certification =
      rebuildRuntimeCertification84FLH();


    if (
      !certification ||
      certification.ok !== true
    ) {

      return null;

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
        requireFunction84FLH(
          name
        );


      if (
        !fn
      ) {

        return null;

      }


      let result;


      try {

        result =
          fn();

      } catch (
        error
      ) {

        fail84FLH(
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

        return null;

      }


      if (
        !result ||
        result.ready !== true ||
        result.passed !== true
      ) {

        fail84FLH(
          'PIPELINE_STAGE_FAILED',
          {
            failedStage:
              name,

            stageReason:
              result?.reason ||
              null
          }
        );

        return null;

      }

    }


    const mappingFn =
      requireFunction84FLH(
        'buildProductionForecastMappingPreview84F'
      );


    if (
      !mappingFn
    ) {

      return null;

    }


    let mapping;


    try {

      mapping =
        mappingFn();

    } catch (
      error
    ) {

      fail84FLH(
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

      return null;

    }


    if (
      !mapping ||
      mapping.ready !== true ||
      mapping.passed !== true ||
      mapping.mappingValid !== true
    ) {

      fail84FLH(
        'MAPPING_STAGE_FAILED',
        {
          failedStage:
            'buildProductionForecastMappingPreview84F',

          stageReason:
            mapping?.reason ||
            null
        }
      );

      return null;

    }


    return {

      ok: true,
      mapping

    };

  }


  /*
   * =========================================================
   * MAIN LIFECYCLE INSPECTION
   * =========================================================
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


      /*
       * If this lifecycle snapshot already passed,
       * do not rebuild repeatedly.
       */

      if (
        snapshotKey ===
          lastProcessedSnapshotKey84FLH &&
        window
          .LAST_FIX03D59_STEP84FLH
          ?.passed === true
      ) {

        return (
          window.LAST_FIX03D59_STEP84FLH ||
          null
        );

      }


      /*
       * IMPORTANT:
       *
       * Do not lock a failed snapshot.
       * A later poll may succeed after all app engines
       * finish loading.
       */

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


      const result =
        success84FLH(
          bridge,
          pipeline.mapping
        );


      if (
        result &&
        result.passed === true
      ) {

        lastProcessedSnapshotKey84FLH =
          snapshotKey;

      }


      return result;


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
   * =========================================================
   * PUBLIC READ-ONLY API
   * =========================================================
   */

  window.rebuildRuntimeCertification84FLH =
    rebuildRuntimeCertification84FLH;


  window.inspectLifecycle84FLH =
    inspectLifecycle84FLH;


  window.FIX03D59_STEP84FLH_HOOK_LOADED =
    true;


  /*
   * Poll lifecycle only.
   *
   * A failed early attempt is allowed to retry because
   * app.js engines may still be loading.
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
    'FIX-03D5.9 STEP 8.4F-LH loaded — Runtime Certification Rebuild + Lifecycle Hook / READ ONLY / ZERO WRITE / FAIL CLOSED'
  );

})();
