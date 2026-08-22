/* =========================================================================
   FIX-03D5.9 — STEP 8.3B SOURCE SHADOW V3
   FILE:
   modules/fix03d59-83b-source-shadow.js

   PURPOSE:
   - Build STEP 8.3B source scope in SHADOW MODE.
   - Reuse the already verified B8 Scope Resolver path.
   - Verify the verified single-province source against the REAL
     Production Candidate Boundary builder.
   - Never modify the real STEP 8.3B result.

   VERIFIED PATH:
   B8 VERIFIED SELECTED PROVINCE
        ↓
   STEP 8.3B SCOPE RESOLVER
        ↓
   SOURCE SHADOW
        ↓
   buildProductionCandidateBoundaryV26()

   SAFETY:
   - MANUAL / DIAGNOSTIC ONLY
   - READ ONLY
   - SHADOW ONLY
   - ZERO WRITE
   - NO PRODUCTION WRITE
   - NO STORAGE WRITE
   - NO AUTO PROMOTION
   - NO savePrediction()
   - NO LAST_FORECAST modification
   - NO canonical candidate modification
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    '83B-SOURCE-SHADOW-V3-REAL-PRODUCTION-BOUNDARY';


  /* =========================================================
     HELPERS
     ========================================================= */

  function safeClone83BSourceShadow(
    value
  ) {

    if (
      value === undefined ||
      value === null
    ) {

      return value;

    }


    try {

      return JSON.parse(
        JSON.stringify(
          value
        )
      );

    } catch (error) {

      return value;

    }

  }


  function normalizeProvince83BSourceShadow(
    value
  ) {

    if (
      value === undefined ||
      value === null
    ) {

      return null;

    }


    if (
      typeof value ===
        'string'
    ) {

      const trimmed =
        value
          .trim()
          .toLowerCase();


      return trimmed || null;

    }


    if (
      typeof value ===
        'object'
    ) {

      const possible =
        value.province ||
        value.provinceSlug ||
        value.slug ||
        value.id ||
        value.value ||
        null;


      if (
        typeof possible ===
          'string'
      ) {

        const trimmed =
          possible
            .trim()
            .toLowerCase();


        return trimmed || null;

      }

    }


    return null;

  }


  /* =========================================================
     RESOLVE VERIFIED B8 SCOPE
     ========================================================= */

  function resolveVerifiedB8Scope83BSourceShadow() {

    const resolverNames = [

      'resolveStep83BScope03D59',

      'resolve83BScope03D59',

      'resolveStep83BScope',

      'resolve83BScope'

    ];


    for (
      const name
      of resolverNames
    ) {

      try {

        if (
          typeof window[name] !==
            'function'
        ) {

          continue;

        }


        const result =
          window[name]();


        if (!result) {

          continue;

        }


        const province =
          normalizeProvince83BSourceShadow(

            result.province ||

            (
              result.resolved &&
              result.resolved.province
            ) ||

            result.resolvedProvince ||

            result.selectedProvince ||

            result.resolvedScope ||

            (
              result.scope &&
              result.scope.province
            )

          );


        const source =
          result.source ||

          (
            result.resolver &&
            result.resolver.source
          ) ||

          null;


        const sourceTrusted =
          result.sourceTrusted === true ||

          (
            result.resolver &&
            result.resolver.sourceTrusted ===
              true
          ) ||

          source ===
            'B8_VERIFIED_SELECTED_PROVINCE';


        const ready =
          result.ready === true ||

          (
            result.resolver &&
            result.resolver.ready ===
              true
          );


        if (
          province &&
          ready &&
          sourceTrusted
        ) {

          return {

            ready: true,

            reason:
              'B8_VERIFIED_SCOPE_RESOLVED',

            resolverName:
              name,

            province:
              province,

            source:
              source ||
              'B8_VERIFIED_SELECTED_PROVINCE',

            sourceTrusted:
              true,

            raw:
              safeClone83BSourceShadow(
                result
              )

          };

        }

      } catch (error) {

        /*
         * FAIL CLOSED.
         * Try next known resolver.
         */

      }

    }


    /*
     * ---------------------------------------------------------
     * FALLBACK:
     * verified Integration Shadow path
     * ---------------------------------------------------------
     */

    try {

      if (
        typeof window
          .buildStep83BIntegrationShadow03D59 ===
        'function'
      ) {

        const integration =
          window
            .buildStep83BIntegrationShadow03D59();


        const resolver =
          integration &&
          integration.resolver
            ? integration.resolver
            : {};


        const resolved =
          integration &&
          integration.resolved
            ? integration.resolved
            : {};


        const shadow =
          integration &&
          integration.shadow
            ? integration.shadow
            : {};


        const province =
          normalizeProvince83BSourceShadow(
            resolved.province
          );


        if (
          resolver.ready === true &&
          resolver.sourceTrusted === true &&
          province &&
          shadow.b8Verified === true
        ) {

          return {

            ready: true,

            reason:
              'B8_VERIFIED_SCOPE_FROM_INTEGRATION_SHADOW',

            resolverName:
              'buildStep83BIntegrationShadow03D59',

            province:
              province,

            source:
              resolver.source ||
              'B8_VERIFIED_SELECTED_PROVINCE',

            sourceTrusted:
              true,

            raw:
              safeClone83BSourceShadow(
                integration
              )

          };

        }

      }

    } catch (error) {

      // FAIL CLOSED

    }


    return {

      ready: false,

      reason:
        'B8_VERIFIED_SCOPE_NOT_AVAILABLE',

      resolverName:
        null,

      province:
        null,

      source:
        'NONE',

      sourceTrusted:
        false,

      raw:
        null

    };

  }


  /* =========================================================
     RESOLVE REAL PRODUCTION BOUNDARY BUILDER
     ========================================================= */

  function resolveBoundaryBuilder83BSourceShadow() {

    /*
     * IMPORTANT:
     *
     * app.js real builder:
     *
     * function buildProductionCandidateBoundaryV26(
     *   sourceResult
     * )
     *
     * This is the FIRST and preferred builder.
     */

    const names = [

      'buildProductionCandidateBoundaryV26',

      'buildStep83Boundary03D59',

      'buildStep83Boundary',

      'build83Boundary03D59',

      'build83Boundary'

    ];


    for (
      const name
      of names
    ) {

      try {

        if (
          typeof window[name] ===
            'function'
        ) {

          return {

            ready: true,

            name:
              name,

            fn:
              window[name]

          };

        }

      } catch (error) {

        // FAIL CLOSED

      }

    }


    return {

      ready: false,

      name: null,

      fn: null

    };

  }


  /* =========================================================
     BUILD SHADOW SOURCE
     ========================================================= */

  function buildShadowInput83BSourceShadow(
    province
  ) {

    /*
     * IMPORTANT:
     *
     * New object only.
     * Never reuse or mutate canonical upstream objects.
     *
     * We provide compatible read-only source shapes
     * for the real boundary builder.
     */

    return {

      ready:
        true,

      passed:
        true,

      province:
        province,

      selectedProvince:
        province,

      resolvedProvince:
        province,

      provinces: [
        province
      ],

      eligible: [
        province
      ],

      candidates: [
        province
      ],

      scope: {

        province:
          province,

        provinces: [
          province
        ],

        eligible: [
          province
        ]

      },

      source:
        'B8_VERIFIED_SELECTED_PROVINCE',

      sourceTrusted:
        true,

      shadow:
        true,

      readOnly:
        true

    };

  }


  /* =========================================================
     EXTRACT BOUNDARY CANDIDATES
     ========================================================= */

  function extractBoundaryCandidates83BSourceShadow(
    boundaryResult
  ) {

    if (!boundaryResult) {

      return [];

    }


    const possibleArrays = [

      boundaryResult.candidates,

      boundaryResult.eligible,

      boundaryResult.provinces,

      boundaryResult.items,

      boundaryResult.results

    ];


    for (
      const value
      of possibleArrays
    ) {

      if (
        Array.isArray(value)
      ) {

        return safeClone83BSourceShadow(
          value
        );

      }

    }


    if (
      Array.isArray(
        boundaryResult.scope
      )
    ) {

      return safeClone83BSourceShadow(
        boundaryResult.scope
      );

    }


    if (
      boundaryResult.scope &&
      Array.isArray(
        boundaryResult
          .scope
          .candidates
      )
    ) {

      return safeClone83BSourceShadow(
        boundaryResult
          .scope
          .candidates
      );

    }


    if (
      boundaryResult.boundary &&
      Array.isArray(
        boundaryResult
          .boundary
          .candidates
      )
    ) {

      return safeClone83BSourceShadow(
        boundaryResult
          .boundary
          .candidates
      );

    }


    return [];

  }


  /* =========================================================
     EXTRACT BOUNDARY COUNT
     ========================================================= */

  function extractBoundaryCount83BSourceShadow(
    boundaryResult,
    boundaryCandidates
  ) {

    if (
      Array.isArray(
        boundaryCandidates
      ) &&
      boundaryCandidates.length > 0
    ) {

      return boundaryCandidates.length;

    }


    const possibleCounts = [

      boundaryResult &&
      boundaryResult.candidateCount,

      boundaryResult &&
      boundaryResult.count,

      boundaryResult &&
      boundaryResult.total,

      boundaryResult &&
      boundaryResult.counts &&
      boundaryResult.counts.candidates,

      boundaryResult &&
      boundaryResult.counts &&
      boundaryResult.counts.eligible,

      boundaryResult &&
      boundaryResult.boundary &&
      boundaryResult.boundary.candidateCount

    ];


    for (
      const value
      of possibleCounts
    ) {

      const number =
        Number(value);


      if (
        Number.isFinite(number) &&
        number >= 0
      ) {

        return number;

      }

    }


    return 0;

  }


  /* =========================================================
     BUILD SOURCE SHADOW
     ========================================================= */

  function build83BSourceShadow() {

    const verified =
      resolveVerifiedB8Scope83BSourceShadow();


    /*
     * FAIL CLOSED:
     * no verified B8 scope = no boundary execution.
     */

    if (!verified.ready) {

      return {

        version:
          VERSION,

        ready:
          false,

        passed:
          false,

        reason:
          verified.reason,

        sourceName:
          verified.source,

        sourceTrusted:
          false,

        resolverName:
          verified.resolverName,

        verifiedProvince:
          null,

        sourceCandidateCount:
          0,

        boundaryCandidateCount:
          0,

        candidateCountMatch:
          false,

        shadowSource: {

          eligible: []

        },

        boundaryBuilderAvailable:
          false,

        boundaryBuilderName:
          null,

        boundaryResult:
          null,

        readOnly:
          true,

        shadowOnly:
          true,

        canonicalWrite:
          false,

        productionWrite:
          false,

        storageWrite:
          false,

        autoPromotion:
          false,

        promotionPerformed:
          false,

        engineExecuted:
          false,

        savePredictionCalled:
          false,

        lastForecastModified:
          false,

        candidatesModified:
          false

      };

    }


    const shadowSource =
      buildShadowInput83BSourceShadow(
        verified.province
      );


    const boundary =
      resolveBoundaryBuilder83BSourceShadow();


    if (!boundary.ready) {

      return {

        version:
          VERSION,

        ready:
          false,

        passed:
          false,

        reason:
          'REAL_STEP83_BOUNDARY_BUILDER_NOT_AVAILABLE',

        sourceName:
          verified.source,

        sourceTrusted:
          verified.sourceTrusted,

        resolverName:
          verified.resolverName,

        verifiedProvince:
          verified.province,

        sourceCandidateCount:
          1,

        boundaryCandidateCount:
          0,

        candidateCountMatch:
          false,

        shadowSource:
          safeClone83BSourceShadow(
            shadowSource
          ),

        boundaryBuilderAvailable:
          false,

        boundaryBuilderName:
          null,

        boundaryResult:
          null,

        readOnly:
          true,

        shadowOnly:
          true,

        canonicalWrite:
          false,

        productionWrite:
          false,

        storageWrite:
          false,

        autoPromotion:
          false,

        promotionPerformed:
          false,

        engineExecuted:
          false,

        savePredictionCalled:
          false,

        lastForecastModified:
          false,

        candidatesModified:
          false

      };

    }


    let boundaryResult;


    try {

      /*
       * Execute ONLY the boundary builder
       * against a newly-created shadow source.
       *
       * This is NOT forecast-engine execution.
       */

      boundaryResult =
        boundary.fn(
          safeClone83BSourceShadow(
            shadowSource
          )
        );

    } catch (error) {

      return {

        version:
          VERSION,

        ready:
          false,

        passed:
          false,

        reason:
          'REAL_STEP83_BOUNDARY_BUILDER_ERROR',

        error:
          error &&
          error.message
            ? error.message
            : String(error),

        sourceName:
          verified.source,

        sourceTrusted:
          verified.sourceTrusted,

        resolverName:
          verified.resolverName,

        verifiedProvince:
          verified.province,

        sourceCandidateCount:
          1,

        boundaryCandidateCount:
          0,

        candidateCountMatch:
          false,

        shadowSource:
          safeClone83BSourceShadow(
            shadowSource
          ),

        boundaryBuilderAvailable:
          true,

        boundaryBuilderName:
          boundary.name,

        boundaryResult:
          null,

        readOnly:
          true,

        shadowOnly:
          true,

        canonicalWrite:
          false,

        productionWrite:
          false,

        storageWrite:
          false,

        autoPromotion:
          false,

        promotionPerformed:
          false,

        engineExecuted:
          false,

        savePredictionCalled:
          false,

        lastForecastModified:
          false,

        candidatesModified:
          false

      };

    }


    const boundaryCandidates =
      extractBoundaryCandidates83BSourceShadow(
        boundaryResult
      );


    const boundaryCandidateCount =
      extractBoundaryCount83BSourceShadow(
        boundaryResult,
        boundaryCandidates
      );


    const countMatches =
      boundaryCandidateCount === 1;


    const passed =
      verified.sourceTrusted === true &&
      shadowSource.eligible.length === 1 &&
      countMatches;


    return {

      version:
        VERSION,

      ready:
        passed,

      passed:
        passed,

      reason:
        passed
          ? 'B8_VERIFIED_SOURCE_SHADOW_READY'
          : 'SOURCE_BOUNDARY_SCOPE_MISMATCH',

      sourceName:
        verified.source,

      sourceTrusted:
        verified.sourceTrusted,

      resolverName:
        verified.resolverName,

      verifiedProvince:
        verified.province,

      sourceCandidateCount:
        shadowSource
          .eligible
          .length,

      boundaryCandidateCount:
        boundaryCandidateCount,

      candidateCountMatch:
        countMatches,

      shadowSource:
        safeClone83BSourceShadow(
          shadowSource
        ),

      boundaryBuilderAvailable:
        true,

      boundaryBuilderName:
        boundary.name,

      boundaryResult:
        safeClone83BSourceShadow(
          boundaryResult
        ),

      readOnly:
        true,

      shadowOnly:
        true,

      canonicalWrite:
        false,

      productionWrite:
        false,

      storageWrite:
        false,

      autoPromotion:
        false,

      promotionPerformed:
        false,

      /*
       * Boundary verification is not
       * Production Forecast Engine execution.
       */

      engineExecuted:
        false,

      savePredictionCalled:
        false,

      lastForecastModified:
        false,

      candidatesModified:
        false

    };

  }


  /* =========================================================
     INSPECTOR
     ========================================================= */

  function inspect83BSourceShadow() {

    const result =
      build83BSourceShadow();


    console.log(
      '=========================================='
    );

    console.log(
      'FIX-03D5.9 STEP 8.3B SOURCE SHADOW V3'
    );

    console.log(
      '=========================================='
    );

    console.log(
      result
    );


    return result;

  }


  /* =========================================================
     PUBLIC API
     ========================================================= */

  window
    .build83BSourceShadow =
      build83BSourceShadow;


  window
    .inspect83BSourceShadow =
      inspect83BSourceShadow;


  window
    .FIX03D59_STEP83B_SOURCE_SHADOW_LOADED =
      true;


  window
    .FIX03D59_STEP83B_SOURCE_SHADOW_VERSION =
      VERSION;


  console.log(
    'FIX-03D5.9 STEP 8.3B Source Shadow V3 loaded / REAL PRODUCTION BOUNDARY / READ ONLY / SHADOW ONLY / ZERO WRITE'
  );

})();

