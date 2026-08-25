/* =========================================================================
   FIX-03D5.9 — REAL INTEGRATION GATE V1

   PURPOSE:
   - Consume the verified Production Readiness V2 checkpoint.
   - Re-validate all critical readiness conditions.
   - Produce a logical REAL Integration authorization decision.
   - FAIL CLOSED.

   IMPORTANT:
   - READ ONLY.
   - ZERO WRITE.
   - NO ENGINE EXECUTION.
   - Does NOT call savePrediction().
   - Does NOT modify LAST_FORECAST.
   - Does NOT modify STEP 8.3B.
   - Does NOT modify candidates.
   - Does NOT execute REAL integration.
   - "authorized" is a gate decision only.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59-REAL-INTEGRATION-GATE-V1';


  /* =========================================================
     HELPERS
     ========================================================= */

  function normalizeProvince(
    value
  ) {

    if (
      value === undefined ||
      value === null
    ) {

      return null;

    }


    const normalized =
      String(value)
        .trim()
        .toLowerCase();


    return normalized || null;

  }


  /* =========================================================
     INSPECT REAL INTEGRATION GATE
     ========================================================= */

  function inspectRealIntegrationGate03D59() {

    /*
     * ---------------------------------------------------------
     * 1. READ EXISTING READINESS CHECKPOINT
     *
     * IMPORTANT:
     * We do NOT run Production Readiness here.
     * We only consume the result already produced by V2.
     * ---------------------------------------------------------
     */

    const readiness =
      window
        .LAST_FIX03D59_PRODUCTION_READINESS ||
      null;


    const readinessExists =
      Boolean(readiness);


    /*
     * ---------------------------------------------------------
     * 2. VERIFY READINESS VERSION
     *
     * Gate V1 only trusts the exact verified V2 contract.
     * ---------------------------------------------------------
     */

    const versionValid =
      Boolean(
        readiness &&
        readiness.version ===
          'FIX03D59-PRODUCTION-READINESS-MOBILE-V2'
      );


    /*
     * ---------------------------------------------------------
     * 3. VERIFY FINAL READINESS DECISION
     * ---------------------------------------------------------
     */

    const readinessReady =
      Boolean(
        readiness &&
        readiness.ready === true
      );


    const readinessReasonValid =
      Boolean(
        readiness &&
        readiness.reason ===
          'PRODUCTION_READINESS_READY'
      );


    /*
     * ---------------------------------------------------------
     * 4. PRODUCTION PATH
     * ---------------------------------------------------------
     */

    const forecastExists =
      Boolean(
        readiness &&
        readiness.forecast &&
        readiness.forecast.exists === true
      );


    const pathReady =
      Boolean(
        readiness &&
        readiness.forecast &&
        readiness.forecast.pathReady === true
      );


    const productionProvince =
      normalizeProvince(
        readiness &&
        readiness.forecast
          ? readiness.forecast.province
          : null
      );


    /*
     * ---------------------------------------------------------
     * 5. SCOPE RESOLVER
     * ---------------------------------------------------------
     */

    const resolverAvailable =
      Boolean(
        readiness &&
        readiness.resolver &&
        readiness.resolver.available === true
      );


    const resolverReady =
      Boolean(
        readiness &&
        readiness.resolver &&
        readiness.resolver.ready === true
      );


    const resolverProvince =
      normalizeProvince(
        readiness &&
        readiness.resolver
          ? readiness.resolver.resolvedProvince
          : null
      );


    /*
     * ---------------------------------------------------------
     * 6. INTEGRATION PREVIEW
     * ---------------------------------------------------------
     */

    const previewReady =
      Boolean(
        readiness &&
        readiness.preview &&
        readiness.preview.ready === true
      );


    const exactlyOneMatch =
      Boolean(
        readiness &&
        readiness.preview &&
        readiness.preview.exactlyOneMatch === true
      );


    const identityPreserved =
      Boolean(
        readiness &&
        readiness.preview &&
        readiness.preview.identityPreserved === true
      );


    const singleProvince =
      Boolean(
        readiness &&
        readiness.preview &&
        readiness.preview.singleProvince === true
      );


    const candidateCount =
      readiness &&
      readiness.preview
        ? Number(
            readiness.preview.candidateCount
          )
        : 0;


    const candidateProvince =
      normalizeProvince(
        readiness &&
        readiness.preview
          ? readiness.preview
              .singleCandidateProvince
          : null
      );


    /*
     * ---------------------------------------------------------
     * 7. INDEPENDENT IDENTITY RE-CHECK
     *
     * Do not merely trust readiness.identity.pass.
     * Recompute identity from the three observed provinces.
     * ---------------------------------------------------------
     */

    const productionResolverMatch =
      Boolean(
        productionProvince &&
        resolverProvince &&
        productionProvince ===
          resolverProvince
      );


    const productionCandidateMatch =
      Boolean(
        productionProvince &&
        candidateProvince &&
        productionProvince ===
          candidateProvince
      );


    const resolverCandidateMatch =
      Boolean(
        resolverProvince &&
        candidateProvince &&
        resolverProvince ===
          candidateProvince
      );


    const identityPass =
      productionResolverMatch &&
      productionCandidateMatch &&
      resolverCandidateMatch;


    /*
     * ---------------------------------------------------------
     * 8. SAFETY CONTRACT
     *
     * Gate must only authorize from a READ-ONLY readiness
     * checkpoint where absolutely no execution/write occurred.
     * ---------------------------------------------------------
     */

    const safety =
      readiness &&
      readiness.safety
        ? readiness.safety
        : {};


    const safetyPass =
      safety.pass === true;


    const noEngineExecution =
      safety.engineExecuted === false;


    const noIntegrationExecution =
      safety.integrationExecuted === false;


    const noWriteAuthorization =
      safety.writeAuthorized === false;


    const noProductionWrite =
      safety.productionWrite === false;


    const noStorageWrite =
      safety.storageWrite === false;


    const noSavePrediction =
      safety.savePredictionCalled === false;


    const noForecastModification =
      safety.lastForecastModified === false;


    const noCandidateModification =
      safety.candidatesModified === false;


    const noStep83BModification =
      safety.step83BModified === false;


    const safetyContractPass =
      safetyPass &&
      noEngineExecution &&
      noIntegrationExecution &&
      noWriteAuthorization &&
      noProductionWrite &&
      noStorageWrite &&
      noSavePrediction &&
      noForecastModification &&
      noCandidateModification &&
      noStep83BModification;


    /*
     * ---------------------------------------------------------
     * 9. FINAL LOGICAL AUTHORIZATION
     *
     * IMPORTANT:
     * This DOES NOT perform integration.
     * This DOES NOT grant a write capability.
     *
     * It only says whether the verified runtime checkpoint
     * satisfies the requirements for the NEXT integration stage.
     * ---------------------------------------------------------
     */

    const authorized =
      readinessExists &&
      versionValid &&
      readinessReady &&
      readinessReasonValid &&
      forecastExists &&
      pathReady &&
      Boolean(productionProvince) &&
      resolverAvailable &&
      resolverReady &&
      Boolean(resolverProvince) &&
      previewReady &&
      exactlyOneMatch &&
      identityPreserved &&
      singleProvince &&
      candidateCount === 1 &&
      Boolean(candidateProvince) &&
      identityPass &&
      safetyContractPass;


    /*
     * ---------------------------------------------------------
     * 10. FAIL-CLOSED REASON
     * ---------------------------------------------------------
     */

    let reason =
      'REAL_INTEGRATION_GATE_AUTHORIZED';


    if (!readinessExists) {

      reason =
        'READINESS_CHECKPOINT_NOT_AVAILABLE';

    } else if (!versionValid) {

      reason =
        'READINESS_VERSION_NOT_VERIFIED';

    } else if (!readinessReady) {

      reason =
        'READINESS_NOT_READY';

    } else if (!readinessReasonValid) {

      reason =
        'READINESS_REASON_INVALID';

    } else if (!forecastExists) {

      reason =
        'PRODUCTION_FORECAST_NOT_AVAILABLE';

    } else if (!pathReady) {

      reason =
        'PRODUCTION_PATH_NOT_READY';

    } else if (!productionProvince) {

      reason =
        'PRODUCTION_PROVINCE_NOT_AVAILABLE';

    } else if (!resolverAvailable) {

      reason =
        'SCOPE_RESOLVER_NOT_AVAILABLE';

    } else if (!resolverReady) {

      reason =
        'SCOPE_RESOLVER_NOT_READY';

    } else if (!resolverProvince) {

      reason =
        'RESOLVER_PROVINCE_NOT_AVAILABLE';

    } else if (!previewReady) {

      reason =
        'INTEGRATION_PREVIEW_NOT_READY';

    } else if (!exactlyOneMatch) {

      reason =
        'NOT_EXACTLY_ONE_MATCH';

    } else if (!identityPreserved) {

      reason =
        'CANDIDATE_IDENTITY_NOT_PRESERVED';

    } else if (!singleProvince) {

      reason =
        'NOT_SINGLE_PROVINCE';

    } else if (candidateCount !== 1) {

      reason =
        'CANDIDATE_COUNT_NOT_ONE';

    } else if (!candidateProvince) {

      reason =
        'CANDIDATE_PROVINCE_NOT_AVAILABLE';

    } else if (!identityPass) {

      reason =
        'PROVINCE_IDENTITY_MISMATCH';

    } else if (!safetyContractPass) {

      reason =
        'SAFETY_CONTRACT_FAILED';

    }


    /*
     * ---------------------------------------------------------
     * 11. RESULT
     * ---------------------------------------------------------
     */

    return {

      version:
        VERSION,

      authorized:
        authorized,

      reason:
        reason,

      readiness: {

        exists:
          readinessExists,

        versionValid:
          versionValid,

        ready:
          readinessReady,

        reasonValid:
          readinessReasonValid

      },

      production: {

        forecastExists:
          forecastExists,

        pathReady:
          pathReady,

        province:
          productionProvince

      },

      resolver: {

        available:
          resolverAvailable,

        ready:
          resolverReady,

        province:
          resolverProvince

      },

      preview: {

        ready:
          previewReady,

        exactlyOneMatch:
          exactlyOneMatch,

        identityPreserved:
          identityPreserved,

        singleProvince:
          singleProvince,

        candidateCount:
          candidateCount,

        candidateProvince:
          candidateProvince

      },

      identity: {

        productionResolverMatch:
          productionResolverMatch,

        productionCandidateMatch:
          productionCandidateMatch,

        resolverCandidateMatch:
          resolverCandidateMatch,

        pass:
          identityPass

      },

      safety: {

        pass:
          safetyContractPass,

        readinessSafetyPass:
          safetyPass,

        noEngineExecution:
          noEngineExecution,

        noIntegrationExecution:
          noIntegrationExecution,

        noWriteAuthorization:
          noWriteAuthorization,

        noProductionWrite:
          noProductionWrite,

        noStorageWrite:
          noStorageWrite,

        noSavePrediction:
          noSavePrediction,

        noForecastModification:
          noForecastModification,

        noCandidateModification:
          noCandidateModification,

        noStep83BModification:
          noStep83BModification

      }

    };

  }


  /* =========================================================
     RUN / DIAGNOSTIC
     ========================================================= */

  function runRealIntegrationGate03D59() {

    try {

      const result =
        inspectRealIntegrationGate03D59();


      /*
       * Diagnostic checkpoint only.
       *
       * This is NOT Production data.
       * This is NOT a write authorization capability.
       */

      window
        .LAST_FIX03D59_REAL_INTEGRATION_GATE =
        result;


      console.log(
        '=========================================='
      );

      console.log(
        'FIX-03D5.9 REAL INTEGRATION GATE V1'
      );

      console.log(
        'Authorized:',
        result.authorized
      );

      console.log(
        'Reason:',
        result.reason
      );

      console.log(
        'Province:',
        result.production.province
      );

      console.log(
        'Identity pass:',
        result.identity.pass
      );

      console.log(
        'Safety contract:',
        result.safety.pass
      );

      console.log(
        '=========================================='
      );


      return result;


    } catch (error) {

      console.error(
        'FIX03D59 Real Integration Gate:',
        error
      );


      return {

        version:
          VERSION,

        authorized:
          false,

        reason:
          'REAL_INTEGRATION_GATE_ERROR',

        error:
          error &&
          error.message
            ? error.message
            : String(error)

      };

    }

  }


  /* =========================================================
     PUBLIC API
     ========================================================= */

  window
    .inspectRealIntegrationGate03D59 =
    inspectRealIntegrationGate03D59;


  window
    .runRealIntegrationGate03D59 =
    runRealIntegrationGate03D59;


  window
    .FIX03D59_REAL_INTEGRATION_GATE_LOADED =
    true;


  window
    .FIX03D59_REAL_INTEGRATION_GATE_VERSION =
    VERSION;


  console.log(
    '🔐 FIX-03D5.9 Real Integration Gate V1 loaded / READ ONLY / ZERO WRITE / FAIL CLOSED'
  );

})();
