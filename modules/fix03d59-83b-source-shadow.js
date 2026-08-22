/* =========================================================================
   FIX-03D5.9 — STEP 8.3B SOURCE SHADOW V2
   FILE:
   modules/fix03d59-83b-source-shadow.js

   PURPOSE:
   - Build STEP 8.3B source scope in SHADOW MODE.
   - Reuse the already verified B8 Scope Resolver path.
   - Verify that the REAL STEP 8.3 boundary builder can consume
     exactly the same verified province scope.
   - Never modify the real STEP 8.3B result.

   VERIFIED UPSTREAM PATH:
   B8 VERIFIED SELECTED PROVINCE
        ↓
   STEP 8.3B SCOPE RESOLVER
        ↓
   SOURCE SHADOW
        ↓
   REAL STEP 8.3 BOUNDARY BUILDER

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
   - NO candidate modification
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    '83B-SOURCE-SHADOW-V2-RESOLVER';


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
        value.trim();


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
          possible.trim();


        return trimmed || null;

      }

    }


    return null;

  }


  /* =========================================================
     RESOLVE VERIFIED B8 SCOPE
     ========================================================= */

  function resolveVerifiedB8Scope83BSourceShadow() {

    /*
     * IMPORTANT:
     *
     * Do NOT guess old B8 global variables first.
     *
     * Integration Shadow has already verified that
     * the STEP 8.3B Scope Resolver exposes the trusted
     * B8 path:
     *
     * B8_VERIFIED_SELECTED_PROVINCE
     *
     * Therefore Source Shadow V2 must reuse that
     * resolver path.
     */


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


        /*
         * Resolver result shapes may differ
         * slightly between diagnostic versions.
         *
         * Read only.
         * Never mutate resolver result.
         */

        const province =
          normalizeProvince83BSourceShadow(

            result.province ||

            (
              result.resolved &&
              result.resolved.province
            ) ||

            result.selectedProvince ||

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
          );


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
              'B8_VERIFIED_SCOPE_RESOLVER',

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
         * Try next known resolver name.
         */

      }

    }


    /*
     * Fallback:
     *
     * Reuse the already verified Integration Shadow
     * result if available.
     *
     * This remains READ ONLY.
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
              'B8_VERIFIED_SCOPE_RESOLVER',

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
     RESOLVE REAL STEP 8.3 BOUNDARY BUILDER
     ========================================================= */

  function resolveBoundaryBuilder83BSourceShadow() {

    const names = [

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

      boundaryResult.scope,

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

        shadowSource: {

          eligible: []

        },

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


    /*
     * Shadow source contains exactly ONE
     * verified province.
     */

    const shadowSource = {

      eligible: [
        verified.province
      ]

    };


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

        shadowSource:
          shadowSource,

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
       * IMPORTANT:
       *
       * Pass a NEW shadow object.
       * Never pass or mutate the canonical B8 object.
       */

      const input = {

        eligible: [
          verified.province
        ]

      };


      boundaryResult =
        boundary.fn(
          input
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

        shadowSource:
          shadowSource,

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


    /*
     * Some STEP 8.3 boundary versions expose
     * count metadata rather than candidate array.
     */

    let boundaryCandidateCount =
      boundaryCandidates.length;


    if (
      boundaryCandidateCount === 0 &&
      boundaryResult &&
      boundaryResult.counts &&
      Number.isFinite(
        Number(
          boundaryResult
            .counts
            .candidates
        )
      )
    ) {

      boundaryCandidateCount =
        Number(
          boundaryResult
            .counts
            .candidates
        );

    }


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
      'FIX-03D5.9 STEP 8.3B SOURCE SHADOW V2'
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
    'FIX-03D5.9 STEP 8.3B Source Shadow V2 loaded / RESOLVER PATH / READ ONLY / SHADOW ONLY / ZERO WRITE'
  );

})();
