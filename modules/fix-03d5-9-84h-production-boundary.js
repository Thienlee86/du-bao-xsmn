/* =========================================================================
   FIX-03D5.9 STEP 8.4H
   PRODUCTION CANDIDATE BOUNDARY ADAPTER V4-B8SHADOW

   PURPOSE:
   - Consume the VERIFIED STEP 8.3B Source Shadow V4 boundary.
   - Build a NEW read-only Production Candidate Boundary for the
     B8-verified selected province.
   - Use canonical STEP 8.3B only as legacy evidence/comparison.
   - Never rewrite canonical STEP 8.3B candidates.
   - Never modify LAST_FORECAST.
   - Never write Production/storage.

   IMPORTANT:
   - Source Shadow V4 must PASS.
   - Integration Gate V3-B8PATH must have boundaryReady === true.
   - Resolver province must match Source Shadow verified province.
   - Shadow boundary candidates must contain exactly one province.
   - Candidate identities must already be certified by Source Shadow V4.
   - READ ONLY.
   - ZERO WRITE.
   - FAIL CLOSED.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION_84H =
    '84H-PRODUCTION-BOUNDARY-V4-B8SHADOW';


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


    /*
     * Resolver may expose resolvedScope as:
     *
     *   "kien-giang"
     *
     * or:
     *
     *   ["kien-giang"]
     */

    if (
      Array.isArray(value)
    ) {

      if (
        value.length !== 1
      ) {

        return null;

      }


      value =
        value[0];

    }


    const normalized =
      String(value)
        .trim()
        .toLowerCase();


    return normalized || null;

  }


  function clone84H(
    value
  ) {

    if (
      value === undefined
    ) {

      return undefined;

    }


    try {

      if (
        typeof structuredClone ===
        'function'
      ) {

        return structuredClone(
          value
        );

      }

    } catch (error) {

      // Fall through.

    }


    try {

      return JSON.parse(
        JSON.stringify(
          value
        )
      );

    } catch (error) {

      return null;

    }

  }


  function unique84H(
    values
  ) {

    return Array.from(
      new Set(
        (Array.isArray(values)
          ? values
          : []
        )
          .map(
            normalizeProvince84H
          )
          .filter(Boolean)
      )
    );

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


    const record =
      candidate.record &&
      typeof candidate.record ===
        'object'
        ? candidate.record
        : candidate;


    const possibleValues = [

      candidate.province,

      candidate.provinceSlug,

      candidate.provinceId,

      candidate.slug,

      candidate.provinceKey,

      record.province,

      record.provinceSlug,

      record.provinceId,

      record.slug

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
     FAILURE
     ========================================================= */

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

      sourceMode:
        'B8_SOURCE_SHADOW',

      sourceCandidateCount:
        0,

      productionCandidateCount:
        0,

      productionCandidateProvinces:
        [],

      shadowReady:
        false,

      integrationBoundaryReady:
        false,

      resolverReady:
        false,

      scopeMatched:
        false,

      adapterApplied:
        false,

      /*
       * HARD SAFETY LOCKS
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

      canonicalCandidatesModified:
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
     CURRENT RESOLVER
     ========================================================= */

  function getResolver84H() {

    const resolver =
      window
        .resolveStep83BScope03D59;


    if (
      typeof resolver !==
      'function'
    ) {

      return null;

    }


    try {

      return (
        resolver() ||
        null
      );

    } catch (error) {

      return null;

    }

  }


  /* =========================================================
     CURRENT INTEGRATION GATE
     ========================================================= */

  function getIntegrationGate84H() {

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

      } catch (error) {

        // Fallback below.

      }

    }


    return (
      window
        .LAST_FIX03D59_STEP83B_INTEGRATION_GATE ||
      null
    );

  }


  /* =========================================================
     SOURCE SHADOW V4
     ========================================================= */

  function getSourceShadow84H() {

    /*
     * Prefer a fresh manual READ-ONLY build.
     */

    const builder =
      window
        .build83BSourceShadow;


    if (
      typeof builder ===
      'function'
    ) {

      try {

        const current =
          builder();


        if (current) {

          return current;

        }

      } catch (error) {

        return null;

      }

    }


    /*
     * Cached RAM diagnostic is fallback only.
     */

    return (
      window
        .LAST_FIX03D59_STEP83B_SOURCE_SHADOW ||
      null
    );

  }


  /* =========================================================
     LEGACY CANONICAL 8.3B
     EVIDENCE ONLY
     ========================================================= */

  function getLegacy83B84H() {

    return (
      window
        .LAST_FIX03D59_STEP83B_RESULT ||

      window
        .LAST_FIX03D59_STEP83B ||

      null
    );

  }


  function getLegacyCandidates84H(
    legacy
  ) {

    if (
      !legacy ||
      !Array.isArray(
        legacy.candidates
      )
    ) {

      return [];

    }


    return legacy.candidates;

  }


  /* =========================================================
     SHADOW BOUNDARY CANDIDATES
     ========================================================= */

  function getShadowBoundaryCandidates84H(
    shadow
  ) {

    if (
      !shadow ||
      !shadow.boundaryResult ||
      typeof shadow.boundaryResult !==
        'object'
    ) {

      return [];

    }


    const boundary =
      shadow.boundaryResult;


    const possible = [

      boundary.candidates,

      boundary.eligible,

      boundary.items,

      boundary.results,

      boundary.productionCandidates

    ];


    for (
      const value
      of possible
    ) {

      if (
        Array.isArray(value)
      ) {

        return value;

      }

    }


    if (
      boundary.boundary &&
      Array.isArray(
        boundary.boundary.candidates
      )
    ) {

      return boundary
        .boundary
        .candidates;

    }


    return [];

  }


  /* =========================================================
     MAIN BUILDER
     ========================================================= */

  function buildProductionCandidateBoundary84H() {

    /*
     * ---------------------------------------------------------
     * 1. CURRENT RESOLVER
     * ---------------------------------------------------------
     */

    const resolver =
      getResolver84H();


    if (!resolver) {

      return fail84H(
        'STEP83B_SCOPE_RESOLVER_NOT_AVAILABLE'
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
            null

        }
      );

    }


    const resolverProvince =
      normalizeProvince84H(

        resolver.resolvedScope ||

        resolver.resolvedProvince ||

        resolver.productionProvince ||

        resolver.forecastProvince ||

        resolver.province

      );


    if (!resolverProvince) {

      return fail84H(
        'RESOLVER_PROVINCE_NOT_AVAILABLE',
        {

          resolverReady:
            true,

          resolverReason:
            resolver.reason ||
            null

        }
      );

    }


    /*
     * ---------------------------------------------------------
     * 2. CURRENT INTEGRATION GATE V3-B8PATH
     * ---------------------------------------------------------
     */

    const integrationGate =
      getIntegrationGate84H();


    if (!integrationGate) {

      return fail84H(
        'STEP83B_INTEGRATION_GATE_NOT_AVAILABLE',
        {

          productionProvince:
            resolverProvince,

          resolverReady:
            true

        }
      );

    }


    /*
     * IMPORTANT:
     *
     * V3-B8PATH publishes:
     *
     *   gate.boundaryReady
     *
     * NOT:
     *
     *   integrationReady
     */

    const integrationBoundaryReady =
      Boolean(
        integrationGate.gate &&
        integrationGate.gate
          .boundaryReady === true
      );


    if (
      !integrationBoundaryReady
    ) {

      return fail84H(
        'STEP83B_INTEGRATION_BOUNDARY_NOT_READY',
        {

          productionProvince:
            resolverProvince,

          resolverReady:
            true,

          integrationBoundaryReady:
            false,

          integrationGateReason:
            integrationGate.gate
              ? integrationGate
                  .gate
                  .reason ||
                null
              : null

        }
      );

    }


    /*
     * Integration Gate itself must remain ZERO WRITE.
     */

    if (
      !integrationGate.safety ||
      integrationGate.safety
        .readOnly !== true ||
      integrationGate.safety
        .writeAuthorized !== false ||
      integrationGate.safety
        .productionWrite !== false ||
      integrationGate.safety
        .storageWrite !== false
    ) {

      return fail84H(
        'INTEGRATION_GATE_SAFETY_CONTRACT_INVALID',
        {

          productionProvince:
            resolverProvince,

          resolverReady:
            true,

          integrationBoundaryReady:
            true

        }
      );

    }


    /*
     * ---------------------------------------------------------
     * 3. SOURCE SHADOW V4
     * ---------------------------------------------------------
     */

    const shadow =
      getSourceShadow84H();


    if (!shadow) {

      return fail84H(
        'STEP83B_SOURCE_SHADOW_NOT_AVAILABLE',
        {

          productionProvince:
            resolverProvince,

          resolverReady:
            true,

          integrationBoundaryReady:
            true

        }
      );

    }


    if (
      shadow.ready !== true ||
      shadow.passed !== true
    ) {

      return fail84H(
        'STEP83B_SOURCE_SHADOW_NOT_READY',
        {

          productionProvince:
            resolverProvince,

          resolverReady:
            true,

          integrationBoundaryReady:
            true,

          shadowReason:
            shadow.reason ||
            null

        }
      );

    }


    /*
     * Source Shadow safety must remain intact.
     */

    if (
      !shadow.safety ||
      shadow.safety.readOnly !==
        true ||
      shadow.safety.shadowOnly !==
        true ||
      shadow.safety.canonicalWrite !==
        false ||
      shadow.safety.productionWrite !==
        false ||
      shadow.safety.storageWrite !==
        false ||
      shadow.safety.savePredictionCalled !==
        false ||
      shadow.safety.lastForecastModified !==
        false ||
      shadow.safety
        .canonicalCandidatesModified !==
        false
    ) {

      return fail84H(
        'SOURCE_SHADOW_SAFETY_CONTRACT_INVALID',
        {

          productionProvince:
            resolverProvince,

          resolverReady:
            true,

          integrationBoundaryReady:
            true

        }
      );

    }


    /*
     * ---------------------------------------------------------
     * 4. VERIFIED SHADOW PROVINCE
     * ---------------------------------------------------------
     */

    const shadowProvince =
      normalizeProvince84H(
        shadow.verifiedScope &&
        shadow.verifiedScope.province
      );


    if (!shadowProvince) {

      return fail84H(
        'SOURCE_SHADOW_PROVINCE_NOT_AVAILABLE',
        {

          productionProvince:
            resolverProvince,

          resolverReady:
            true,

          integrationBoundaryReady:
            true,

          shadowReady:
            true

        }
      );

    }


    if (
      shadowProvince !==
      resolverProvince
    ) {

      return fail84H(
        'RESOLVER_SHADOW_PROVINCE_MISMATCH',
        {

          productionProvince:
            resolverProvince,

          shadowProvince,

          resolverReady:
            true,

          integrationBoundaryReady:
            true,

          shadowReady:
            true

        }
      );

    }


    /*
     * ---------------------------------------------------------
     * 5. SOURCE SHADOW CERTIFICATION
     * ---------------------------------------------------------
     */

    if (
      !shadow.identity ||
      shadow.identity.preserved !==
        true
    ) {

      return fail84H(
        'SOURCE_SHADOW_IDENTITY_NOT_PRESERVED',
        {

          productionProvince:
            resolverProvince,

          shadowProvince,

          resolverReady:
            true,

          integrationBoundaryReady:
            true,

          shadowReady:
            true

        }
      );

    }


    if (
      !shadow.boundary ||
      shadow.boundary.ready !== true ||
      shadow.boundary.passed !== true ||
      shadow.boundary.rejectedCount !==
        0 ||
      shadow.boundary
        .candidateCountMatch !== true ||
      shadow.boundary
        .countsBalanced !== true ||
      shadow.boundary
        .provinceMatch !== true
    ) {

      return fail84H(
        'SOURCE_SHADOW_BOUNDARY_CERTIFICATION_INVALID',
        {

          productionProvince:
            resolverProvince,

          shadowProvince,

          resolverReady:
            true,

          integrationBoundaryReady:
            true,

          shadowReady:
            true

        }
      );

    }


    /*
     * ---------------------------------------------------------
     * 6. EXTRACT VERIFIED SHADOW CANDIDATES
     * ---------------------------------------------------------
     */

    const shadowCandidates =
      getShadowBoundaryCandidates84H(
        shadow
      );


    if (
      shadowCandidates.length ===
      0
    ) {

      return fail84H(
        'SOURCE_SHADOW_CANDIDATES_NOT_AVAILABLE',
        {

          productionProvince:
            resolverProvince,

          shadowProvince,

          resolverReady:
            true,

          integrationBoundaryReady:
            true,

          shadowReady:
            true

        }
      );

    }


    const shadowCandidateProvinces =
      unique84H(
        shadowCandidates.map(
          getCandidateProvince84H
        )
      );


    if (
      shadowCandidateProvinces.length !==
        1 ||
      shadowCandidateProvinces[0] !==
        resolverProvince
    ) {

      return fail84H(
        'SOURCE_SHADOW_CANDIDATE_SCOPE_INVALID',
        {

          productionProvince:
            resolverProvince,

          shadowProvince,

          shadowCandidateProvinces,

          sourceCandidateCount:
            shadowCandidates.length,

          resolverReady:
            true,

          integrationBoundaryReady:
            true,

          shadowReady:
            true

        }
      );

    }


    /*
     * ---------------------------------------------------------
     * 7. CLONE VERIFIED SHADOW CANDIDATES
     * ---------------------------------------------------------
     *
     * This NEW clone becomes the 8.4H read-only boundary.
     *
     * Nothing is assigned back into STEP 8.3B or Source Shadow.
     * ---------------------------------------------------------
     */

    const productionCandidates =
      clone84H(
        shadowCandidates
      );


    if (
      !Array.isArray(
        productionCandidates
      ) ||
      productionCandidates.length !==
        shadowCandidates.length
    ) {

      return fail84H(
        'PRODUCTION_BOUNDARY_CLONE_FAILED',
        {

          productionProvince:
            resolverProvince,

          shadowProvince,

          sourceCandidateCount:
            shadowCandidates.length,

          resolverReady:
            true,

          integrationBoundaryReady:
            true,

          shadowReady:
            true

        }
      );

    }


    /*
     * ---------------------------------------------------------
     * 8. LEGACY 8.3B — EVIDENCE ONLY
     * ---------------------------------------------------------
     */

    const legacy83B =
      getLegacy83B84H();


    const legacyCandidates =
      getLegacyCandidates84H(
        legacy83B
      );


    const legacyCandidateProvinces =
      unique84H(
        legacyCandidates.map(
          getCandidateProvince84H
        )
      );


    const legacyContainsProductionProvince =
      legacyCandidateProvinces.includes(
        resolverProvince
      );


    const legacyDivergence =
      Boolean(
        legacyCandidates.length > 0 &&
        !legacyContainsProductionProvince
      );


    /*
     * ---------------------------------------------------------
     * 9. FINAL READ-ONLY BOUNDARY
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
        'B8_SOURCE_SHADOW_PRODUCTION_BOUNDARY_READY',

      sourceMode:
        'B8_SOURCE_SHADOW',

      sourceStep:
        '8.3B-SOURCE-SHADOW-V4',

      productionProvince:
        resolverProvince,

      sourceCandidateCount:
        shadowCandidates.length,

      productionCandidateCount:
        productionCandidates.length,

      productionCandidateProvinces:
        shadowCandidateProvinces.slice(),

      candidates:
        productionCandidates,

      /*
       * Legacy canonical evidence only.
       */

      legacyEvidence: {

        available:
          Boolean(
            legacy83B
          ),

        candidateCount:
          legacyCandidates.length,

        candidateProvinces:
          legacyCandidateProvinces,

        containsProductionProvince:
          legacyContainsProductionProvince,

        divergenceObserved:
          legacyDivergence,

        modified:
          false

      },

      resolverReady:
        true,

      integrationBoundaryReady:
        true,

      shadowReady:
        true,

      scopeMatched:
        true,

      adapterApplied:
        true,

      shadowVersion:
        shadow.version ||
        null,

      shadowReason:
        shadow.reason ||
        null,

      integrationGateReason:
        integrationGate.gate
          ? integrationGate
              .gate
              .reason ||
            null
          : null,

      /*
       * HARD SAFETY CONTRACT
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

      canonicalCandidatesModified:
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
     * NEW RAM aliases only.
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


  window
    .FIX03D59_STEP84H_VERSION =
    VERSION_84H;


  console.log(
    'FIX-03D5.9 STEP 8.4H loaded — Production Candidate Boundary Adapter V4-B8SHADOW / READ ONLY / ZERO WRITE / FAIL CLOSED'
  );

})();
