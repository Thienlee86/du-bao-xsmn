/* =========================================================================
   FIX-03D5.9 STEP 8.4H
   PRODUCTION CANDIDATE BOUNDARY ADAPTER V2

   PURPOSE:
   - Build a canonical Production Candidate Boundary from the
     current Production Forecast scope.
   - Bridge the legacy STEP 8.3B candidate boundary to the
     current Production province.
   - Preserve the original STEP 8.3B result unchanged.
   - Produce a NEW read-only RAM boundary for downstream stages.
   - Always prefer CURRENT Integration Gate inspection over
     stale cached gate state.

   SOURCE:
   - Current Production Forecast / lifecycle.
   - STEP 8.3B Scope Resolver.
   - STEP 8.3B Integration Gate.
   - Original STEP 8.3B candidate structure.

   IMPORTANT:
   - DO NOT modify buildProductionCandidateBoundaryV26().
   - DO NOT modify LAST_FIX03D59_STEP83B_RESULT.
   - DO NOT modify LAST_FORECAST.
   - DO NOT modify original candidates.
   - DO NOT call savePrediction().
   - DO NOT execute forecast engines.
   - DO NOT write storage.
   - DO NOT write Production.

   READ ONLY
   ZERO WRITE
   FAIL CLOSED
   ========================================================================= */

(function () {

  'use strict';


  const VERSION_84H =
    '84H-PRODUCTION-BOUNDARY-V2';


  /* =========================================================
     HELPERS
     ========================================================= */

  function normalizeProvince84H(
    value
  ) {

    if (
      value === null ||
      value === undefined
    ) {

      return null;

    }


    const normalized =
      String(value)
        .trim()
        .toLowerCase();


    return normalized || null;

  }


  function fail84H(
    reason,
    extra = {}
  ) {

    const result = {

      ready: false,
      passed: false,

      step:
        '8.4H',

      version:
        VERSION_84H,

      reason,

      productionProvince:
        null,

      sourceCandidateCount:
        0,

      productionCandidateCount:
        0,

      scopeMatched:
        false,

      adapterApplied:
        false,

      resolverReady:
        false,

      integrationReady:
        false,

      writeAuthorized:
        false,

      productionWrite:
        false,

      storageWrite:
        false,

      engineExecuted:
        false,

      savePredictionCalled:
        false,

      lastForecastModified:
        false,

      sourceCandidatesModified:
        false,

      promotionPerformed:
        false,

      transactionExecuted:
        false,

      commitPerformed:
        false,

      readOnly:
        true,

      failClosed:
        true,

      ...extra

    };


    window
      .LAST_FIX03D59_STEP84H =
      result;


    return result;

  }


  /* =========================================================
     SOURCE READERS
     ========================================================= */

  function get83BResult84H() {

    return (
      window
        .LAST_FIX03D59_STEP83B_RESULT ||
      window
        .LAST_FIX03D59_STEP83B ||
      null
    );

  }


  function getScopeResolution84H() {

    /*
     * First accept a READY cached resolver result.
     */

    const existing =
      window
        .LAST_FIX03D59_STEP83B_SCOPE_RESOLUTION ||
      null;


    if (
      existing &&
      existing.ready === true
    ) {

      return existing;

    }


    /*
     * Otherwise obtain CURRENT resolver state.
     *
     * Resolver is READ ONLY.
     */

    const resolver =
      window
        .resolveStep83BScope03D59;


    if (
      typeof resolver !==
      'function'
    ) {

      return existing;

    }


    try {

      const current =
        resolver();


      if (current) {

        return current;

      }

    } catch (
      error
    ) {

      /*
       * Fail closed below.
       */

    }


    return existing;

  }


  function getIntegrationGate84H() {

    /*
     * IMPORTANT V2 FIX
     * ---------------------------------------------------------
     * Do NOT immediately return an existing cached gate.
     *
     * The cached result may have been created BEFORE the
     * Production Forecast existed and can therefore contain:
     *
     *   integrationReady: false
     *
     * even though the CURRENT runtime Integration Gate is now
     * READY.
     *
     * The inspector is READ ONLY, so prefer a fresh inspection.
     * ---------------------------------------------------------
     */

    const inspector =
      window
        .inspectStep83BIntegrationGate03D59;


    if (
      typeof inspector ===
      'function'
    ) {

      try {

        const current =
          inspector();


        if (current) {

          return current;

        }

      } catch (
        error
      ) {

        /*
         * Do not guess.
         * Fall back to published RAM result.
         */

      }

    }


    /*
     * Fallback only.
     */

    return (
      window
        .LAST_FIX03D59_STEP83B_INTEGRATION_GATE ||
      null
    );

  }


  /* =========================================================
     CANDIDATE HELPERS
     ========================================================= */

  function getCandidates84H(
    step83B
  ) {

    if (
      !step83B ||
      !Array.isArray(
        step83B.candidates
      )
    ) {

      return [];

    }


    return step83B.candidates;

  }


  function getCandidateProvince84H(
    candidate
  ) {

    if (
      !candidate ||
      typeof candidate !==
        'object'
    ) {

      return null;

    }


    const possibleValues = [

      candidate.province,

      candidate.provinceSlug,

      candidate.provinceId,

      candidate.slug,

      candidate.scope,

      candidate.provinceKey

    ];


    for (
      const value
      of possibleValues
    ) {

      const normalized =
        normalizeProvince84H(
          value
        );


      if (normalized) {

        return normalized;

      }

    }


    return null;

  }


  /* =========================================================
     SAFE CLONE
     ========================================================= */

  function cloneCandidate84H(
    candidate
  ) {

    if (
      !candidate ||
      typeof candidate !==
        'object'
    ) {

      return candidate;

    }


    try {

      if (
        typeof structuredClone ===
        'function'
      ) {

        return structuredClone(
          candidate
        );

      }

    } catch (
      error
    ) {

      /*
       * Fall through to JSON clone.
       */

    }


    try {

      return JSON.parse(
        JSON.stringify(
          candidate
        )
      );

    } catch (
      error
    ) {

      return null;

    }

  }


  /* =========================================================
     MAIN BUILDER
     ========================================================= */

  function buildProductionCandidateBoundary84H() {

    /*
     * ---------------------------------------------------------
     * SOURCE 1 — ORIGINAL STEP 8.3B
     * ---------------------------------------------------------
     */

    const step83B =
      get83BResult84H();


    if (!step83B) {

      return fail84H(
        'STEP83B_RESULT_NOT_AVAILABLE'
      );

    }


    const sourceCandidates =
      getCandidates84H(
        step83B
      );


    if (
      sourceCandidates.length ===
      0
    ) {

      return fail84H(
        'STEP83B_CANDIDATES_NOT_AVAILABLE'
      );

    }


    /*
     * ---------------------------------------------------------
     * SOURCE 2 — SCOPE RESOLVER
     * ---------------------------------------------------------
     */

    const resolver =
      getScopeResolution84H();


    if (!resolver) {

      return fail84H(
        'STEP83B_SCOPE_RESOLVER_NOT_AVAILABLE',
        {
          sourceCandidateCount:
            sourceCandidates.length
        }
      );

    }


    if (
      resolver.ready !== true
    ) {

      return fail84H(
        'STEP83B_SCOPE_RESOLVER_NOT_READY',
        {
          resolverReason:
            resolver.reason ||
            null,

          sourceCandidateCount:
            sourceCandidates.length,

          resolverReady:
            false
        }
      );

    }


    const productionProvince =
      normalizeProvince84H(
        resolver.resolvedScope ||
        resolver.productionProvince ||
        resolver.forecastProvince
      );


    if (!productionProvince) {

      return fail84H(
        'PRODUCTION_SCOPE_NOT_RESOLVED',
        {
          resolverReason:
            resolver.reason ||
            null,

          sourceCandidateCount:
            sourceCandidates.length,

          resolverReady:
            true
        }
      );

    }


    /*
     * ---------------------------------------------------------
     * SOURCE 3 — CURRENT INTEGRATION GATE
     * ---------------------------------------------------------
     */

    const gate =
      getIntegrationGate84H();


    if (!gate) {

      return fail84H(
        'STEP83B_INTEGRATION_GATE_NOT_AVAILABLE',
        {
          productionProvince,

          sourceCandidateCount:
            sourceCandidates.length,

          resolverReady:
            true,

          integrationReady:
            false
        }
      );

    }


    if (
      gate.integrationReady !==
      true
    ) {

      return fail84H(
        'STEP83B_INTEGRATION_NOT_READY',
        {
          productionProvince,

          gateReason:
            gate.reason ||
            gate.gateReason ||
            null,

          sourceCandidateCount:
            sourceCandidates.length,

          resolverReady:
            true,

          integrationReady:
            false
        }
      );

    }


    /*
     * ---------------------------------------------------------
     * FIND PRODUCTION CANDIDATE
     * ---------------------------------------------------------
     *
     * SAFETY:
     *
     * Do NOT rewrite any legacy candidate province.
     *
     * Only select an existing candidate whose own province
     * already equals the canonical Production province.
     *
     * If none exists:
     * FAIL CLOSED.
     * ---------------------------------------------------------
     */

    const matchingCandidates =
      sourceCandidates.filter(
        candidate =>
          getCandidateProvince84H(
            candidate
          ) ===
          productionProvince
      );


    if (
      matchingCandidates.length ===
      0
    ) {

      return fail84H(
        'PRODUCTION_CANDIDATE_NOT_FOUND_IN_STEP83B',
        {
          productionProvince,

          sourceCandidateCount:
            sourceCandidates.length,

          sourceCandidateProvinces:
            sourceCandidates
              .map(
                getCandidateProvince84H
              )
              .filter(
                Boolean
              ),

          resolverReady:
            true,

          integrationReady:
            true
        }
      );

    }


    if (
      matchingCandidates.length !==
      1
    ) {

      return fail84H(
        'PRODUCTION_CANDIDATE_NOT_UNIQUE',
        {
          productionProvince,

          sourceCandidateCount:
            sourceCandidates.length,

          matchingCandidateCount:
            matchingCandidates.length,

          sourceCandidateProvinces:
            sourceCandidates
              .map(
                getCandidateProvince84H
              )
              .filter(
                Boolean
              ),

          resolverReady:
            true,

          integrationReady:
            true
        }
      );

    }


    /*
     * ---------------------------------------------------------
     * CLONE ONLY
     * ---------------------------------------------------------
     */

    const productionCandidate =
      cloneCandidate84H(
        matchingCandidates[0]
      );


    if (!productionCandidate) {

      return fail84H(
        'PRODUCTION_CANDIDATE_CLONE_FAILED',
        {
          productionProvince,

          sourceCandidateCount:
            sourceCandidates.length,

          resolverReady:
            true,

          integrationReady:
            true
        }
      );

    }


    const productionCandidates = [
      productionCandidate
    ];


    /*
     * ---------------------------------------------------------
     * FINAL READ-ONLY RESULT
     * ---------------------------------------------------------
     */

    const result = {

      ready: true,
      passed: true,

      step:
        '8.4H',

      version:
        VERSION_84H,

      reason:
        'PRODUCTION_CANDIDATE_BOUNDARY_READY',

      sourceStep:
        '8.3B',

      productionProvince,

      sourceCandidateCount:
        sourceCandidates.length,

      productionCandidateCount:
        productionCandidates.length,

      sourceCandidateProvinces:
        sourceCandidates
          .map(
            getCandidateProvince84H
          )
          .filter(
            Boolean
          ),

      productionCandidateProvinces:
        productionCandidates
          .map(
            getCandidateProvince84H
          )
          .filter(
            Boolean
          ),

      candidates:
        productionCandidates,

      scopeMatched:
        true,

      adapterApplied:
        true,

      resolverReady:
        true,

      integrationReady:
        true,

      /*
       * SAFETY CONTRACT
       */

      writeAuthorized:
        false,

      productionWrite:
        false,

      storageWrite:
        false,

      engineExecuted:
        false,

      savePredictionCalled:
        false,

      lastForecastModified:
        false,

      sourceCandidatesModified:
        false,

      promotionPerformed:
        false,

      transactionExecuted:
        false,

      commitPerformed:
        false,

      readOnly:
        true,

      failClosed:
        true

    };


    /*
     * Publish NEW RAM aliases only.
     *
     * DO NOT overwrite STEP 8.3B.
     */

    window
      .LAST_FIX03D59_STEP84H =
      result;


    window
      .LAST_FIX03D59_PRODUCTION_CANDIDATE_BOUNDARY =
      result;


    return result;

  }


  /* =========================================================
     PUBLIC READ-ONLY API
     ========================================================= */

  window
    .buildProductionCandidateBoundary84H =
    buildProductionCandidateBoundary84H;


  window
    .FIX03D59_STEP84H_LOADED =
    true;


  console.log(
    'FIX-03D5.9 STEP 8.4H loaded — Production Candidate Boundary Adapter V2 / CURRENT GATE LOOKUP / READ ONLY / ZERO WRITE / FAIL CLOSED'
  );

})();

