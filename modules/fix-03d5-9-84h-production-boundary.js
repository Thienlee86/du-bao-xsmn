/* =========================================================================
   FIX-03D5.9 STEP 8.4H
   PRODUCTION CANDIDATE BOUNDARY ADAPTER V3

   PURPOSE:
   - Build a canonical Production Candidate Boundary from the
     current Production Forecast scope.
   - Bridge the legacy STEP 8.3B candidate boundary to the
     current Production province.
   - Use the CURRENT runtime Integration Gate whenever available.
   - Preserve original STEP 8.3B candidates unchanged.
   - Produce a NEW read-only RAM boundary for downstream stages.

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
    '84H-PRODUCTION-BOUNDARY-V3';


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


    return (
      normalized ||
      null
    );

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

      sourceCandidateProvinces:
        [],

      productionCandidateProvinces:
        [],

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
     STEP 8.3B SOURCE
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


  /* =========================================================
     SCOPE RESOLVER
     ========================================================= */

  function getScopeResolution84H() {

    /*
     * Prefer CURRENT runtime resolver execution.
     *
     * Resolver is READ ONLY.
     */

    const resolver =
      window
        .resolveStep83BScope03D59;


    if (
      typeof resolver ===
      'function'
    ) {

      try {

        const current =
          resolver();


        if (
          current &&
          current.ready === true
        ) {

          return current;

        }

      } catch (
        error
      ) {

        /*
         * Fall through to cached result.
         */

      }

    }


    /*
     * Fallback only.
     */

    return (
      window
        .LAST_FIX03D59_STEP83B_SCOPE_RESOLUTION ||
      null
    );

  }


  /* =========================================================
     INTEGRATION GATE
     ========================================================= */

  function getIntegrationGate84H() {

    /*
     * IMPORTANT V3 CHANGE
     * ---------------------------------------------------------
     * Run CURRENT Integration Gate first.
     *
     * The mobile test proved the current gate can be:
     *
     *   Integration Ready: YES
     *
     * while an older cached object still contains:
     *
     *   integrationReady: false
     *
     * Therefore current runtime inspection has priority.
     *
     * Inspector is READ ONLY / ZERO WRITE.
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
         * Fail over to cached diagnostic result.
         */

      }

    }


    /*
     * Cached result is fallback only.
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
       * Fall through.
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


  function cloneCandidates84H(
    candidates
  ) {

    const cloned = [];


    for (
      const candidate
      of candidates
    ) {

      const copy =
        cloneCandidate84H(
          candidate
        );


      if (
        copy === null ||
        copy === undefined
      ) {

        return null;

      }


      cloned.push(copy);

    }


    return cloned;

  }


  /* =========================================================
     MAIN BUILDER
     ========================================================= */

  function buildProductionCandidateBoundary84H() {

    /*
     * ---------------------------------------------------------
     * SOURCE 1 — STEP 8.3B
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


    const sourceCandidateProvinces =
      sourceCandidates
        .map(
          getCandidateProvince84H
        )
        .filter(
          Boolean
        );


    /*
     * ---------------------------------------------------------
     * SOURCE 2 — CURRENT PRODUCTION SCOPE
     * ---------------------------------------------------------
     */

    const resolver =
      getScopeResolution84H();


    if (!resolver) {

      return fail84H(
        'STEP83B_SCOPE_RESOLVER_NOT_AVAILABLE',
        {

          sourceCandidateCount:
            sourceCandidates.length,

          sourceCandidateProvinces

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

          sourceCandidateProvinces

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

          sourceCandidateProvinces

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

          sourceCandidateProvinces,

          resolverReady:
            true

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

          sourceCandidateProvinces,

          resolverReady:
            true,

          integrationReady:
            false

        }
      );

    }


    /*
     * ---------------------------------------------------------
     * LEGACY / PRODUCTION COMPARISON
     * ---------------------------------------------------------
     */

    const exactProductionCandidates =
      sourceCandidates.filter(
        candidate =>
          getCandidateProvince84H(
            candidate
          ) ===
          productionProvince
      );


    const exactProductionCandidateExists =
      exactProductionCandidates.length ===
      1;


    const legacyDivergence =
      exactProductionCandidates.length ===
      0;


    /*
     * Integration Gate must explicitly approve the legacy
     * divergence before V3 may construct an adapter boundary.
     */

    const divergenceApproved =
      gate.integrationReady === true &&
      (
        gate.legacyDivergenceConfirmed === true ||
        gate.scopeWouldChange === true ||
        legacyDivergence === false
      );


    if (
      legacyDivergence &&
      !divergenceApproved
    ) {

      return fail84H(
        'LEGACY_DIVERGENCE_NOT_APPROVED',
        {

          productionProvince,

          sourceCandidateCount:
            sourceCandidates.length,

          sourceCandidateProvinces,

          resolverReady:
            true,

          integrationReady:
            true,

          legacyDivergence:
            true

        }
      );

    }


    /*
     * ---------------------------------------------------------
     * CLONE SOURCE
     * ---------------------------------------------------------
     *
     * Never mutate STEP 8.3B.
     * ---------------------------------------------------------
     */

    const clonedCandidates =
      cloneCandidates84H(
        sourceCandidates
      );


    if (!clonedCandidates) {

      return fail84H(
        'PRODUCTION_BOUNDARY_CLONE_FAILED',
        {

          productionProvince,

          sourceCandidateCount:
            sourceCandidates.length,

          sourceCandidateProvinces,

          resolverReady:
            true,

          integrationReady:
            true

        }
      );

    }


    /*
     * ---------------------------------------------------------
     * CANONICAL PRODUCTION BOUNDARY
     * ---------------------------------------------------------
     *
     * V3 does NOT rewrite the province inside any candidate.
     *
     * Production scope lives at the boundary level.
     *
     * Legacy candidate payload is retained as cloned,
     * read-only source evidence.
     * ---------------------------------------------------------
     */

    const productionCandidates =
      exactProductionCandidateExists
        ? [
            cloneCandidate84H(
              exactProductionCandidates[0]
            )
          ]
        : [];


    const result = {

      ready: true,
      passed: true,

      step:
        '8.4H',

      version:
        VERSION_84H,

      reason:
        exactProductionCandidateExists
          ? 'PRODUCTION_CANDIDATE_BOUNDARY_READY'
          : 'PRODUCTION_BOUNDARY_ADAPTED_FROM_LEGACY_SCOPE',

      sourceStep:
        '8.3B',

      productionProvince,

      sourceCandidateCount:
        sourceCandidates.length,

      productionCandidateCount:
        productionCandidates.length,

      sourceCandidateProvinces,

      productionCandidateProvinces:
        productionCandidates
          .map(
            getCandidateProvince84H
          )
          .filter(
            Boolean
          ),

      /*
       * Canonical production-scoped candidates.
       *
       * Empty is valid when Integration Gate explicitly
       * confirmed legacy divergence.
       */

      candidates:
        productionCandidates,

      /*
       * Cloned legacy evidence.
       */

      legacyCandidates:
        clonedCandidates,

      legacyCandidateCount:
        clonedCandidates.length,

      legacyCandidateProvinces:
        clonedCandidates
          .map(
            getCandidateProvince84H
          )
          .filter(
            Boolean
          ),

      exactProductionCandidateExists,

      legacyDivergence,

      legacyDivergenceApproved:
        divergenceApproved,

      scopeMatched:
        true,

      adapterApplied:
        legacyDivergence,

      resolverReady:
        true,

      integrationReady:
        true,

      integrationGateReason:
        gate.reason ||
        gate.gateReason ||
        null,

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
    'FIX-03D5.9 STEP 8.4H loaded — Production Candidate Boundary Adapter V3 / READ ONLY / ZERO WRITE / FAIL CLOSED'
  );

})();
