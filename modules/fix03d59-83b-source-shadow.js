/* =========================================================================
   FIX-03D5.9 — STEP 8.3B SOURCE SHADOW V4
   FILE:
   modules/fix03d59-83b-source-shadow.js

   PURPOSE:
   - Reuse the verified B8 selected-province scope.
   - Read the REAL STEP 8.2C RAM result.
   - Filter REAL 8.2C eligible records to exactly the verified province.
   - Preserve canonical identity:
       index
       province
       prize
   - Feed the filtered READ-ONLY shadow source into the REAL
     STEP 8.3 boundary builder:
       buildProductionCandidateBoundaryV26()
   - Verify boundary count / identity / province isolation.
   - Never replace or modify the REAL STEP 8.2C / STEP 8.3B result.

   SAFETY:
   - MANUAL / DIAGNOSTIC ONLY
   - READ ONLY
   - SHADOW ONLY
   - ZERO CANONICAL WRITE
   - ZERO PRODUCTION WRITE
   - ZERO STORAGE WRITE
   - ZERO PROMOTION
   - NO savePrediction()
   - NO LAST_FORECAST modification
   - NO canonical candidate modification

   PATCH:
   - V4 ARRAY FIX:
     resolveStep83BScope03D59().resolvedScope is an ARRAY.
   - Accept exactly ONE resolved province.
   - Multiple provinces fail closed.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    '83B-SOURCE-SHADOW-V4-REAL82C-FILTER-ARRAYFIX1';


  /* =========================================================
     HELPERS
     ========================================================= */

  function clone83BSourceShadowV4(
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

      return null;

    }

  }


  function normalizeProvince83BSourceShadowV4(
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
        'object'
    ) {

      value =
        value.province ||
        value.provinceSlug ||
        value.slug ||
        value.id ||
        value.value ||
        null;

    }


    if (
      typeof value !==
        'string'
    ) {

      return null;

    }


    const normalized =
      value
        .trim()
        .toLowerCase();


    return normalized || null;

  }


  function normalizePrize83BSourceShadowV4(
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


  function identity83BSourceShadowV4(
    record
  ) {

    if (
      !record ||
      typeof record !==
        'object'
    ) {

      return null;

    }


    const index =
      Number(
        record.index
      );


    const province =
      normalizeProvince83BSourceShadowV4(
        record.province
      );


    const prize =
      normalizePrize83BSourceShadowV4(
        record.prize
      );


    if (
      !Number.isFinite(index) ||
      !province ||
      !prize
    ) {

      return null;

    }


    return (
      String(index) +
      '|' +
      province +
      '|' +
      prize
    );

  }


  function unique83BSourceShadowV4(
    values
  ) {

    return Array.from(
      new Set(
        Array.isArray(values)
          ? values
          : []
      )
    );

  }


  /* =========================================================
     VERIFIED B8 PROVINCE
     ========================================================= */

  function resolveVerifiedProvince83BSourceShadowV4() {

    /*
     * PRIMARY PATH:
     * existing STEP 8.3B scope resolver.
     *
     * IMPORTANT:
     * resolveStep83BScope03D59() returns:
     *
     * resolvedScope: [ 'kien-giang' ]
     *
     * Therefore resolvedScope must be unpacked before
     * province normalization.
     *
     * FAIL CLOSED:
     * exactly ONE province is accepted.
     */

    try {

      if (
        typeof window
          .resolveStep83BScope03D59 ===
        'function'
      ) {

        const result =
          window
            .resolveStep83BScope03D59();


        if (result) {

          const resolvedScopeProvince =
            Array.isArray(
              result.resolvedScope
            )
              ? (
                  result.resolvedScope.length === 1
                    ? result.resolvedScope[0]
                    : null
                )
              : result.resolvedScope;


          const resolvedScope =
  Array.isArray(
    result.resolvedScope
  )
    ? result.resolvedScope
    : [];


const province =
  normalizeProvince83BSourceShadowV4(

    resolvedScope.length === 1
      ? resolvedScope[0]
      : (

          result.resolvedProvince ||

          result.province ||

          (
            result.resolved &&
            result.resolved.province
          ) ||

          (
            result.scope &&
            result.scope.province
          ) ||

          null

        )

  );


          const source =
            result.source ||
            (
              result.resolver &&
              result.resolver.source
            ) ||
            null;


          const resolvedScope =
  Array.isArray(
    result.resolvedScope
  )
    ? result.resolvedScope
    : [];


const provinceInResolvedScope =
  Boolean(
    province &&
    resolvedScope.includes(
      province
    )
  );


const b8SelectedVerified =
  Boolean(
    result.verifiedB8 &&
    result.verifiedB8.exists === true &&
    result.verifiedB8.selectedInScope === true &&
    Array.isArray(
      result.verifiedB8.provinces
    ) &&
    result.verifiedB8.provinces.includes(
      province
    )
  );


const productionSelectedMatched =
  Boolean(
    result.productionForecastExists === true &&
    result.productionProvince ===
      province &&
    result.selectedProvince ===
      province &&
    result.selectedMatchesProduction ===
      true
  );


const trusted =
  Boolean(
    result.ready === true &&
    provinceInResolvedScope &&
    (
      b8SelectedVerified ||
      productionSelectedMatched
    )
  );


          if (
            result.ready === true &&
            province &&
            trusted
          ) {

            return {

              ready: true,

              province,

              source:
                source ||
                'B8_VERIFIED_SELECTED_PROVINCE',

              resolverName:
                'resolveStep83BScope03D59',

              raw:
                clone83BSourceShadowV4(
                  result
                )

            };

          }

        }

      }

    } catch (error) {

      // FAIL CLOSED

    }


    /*
     * SECONDARY PATH:
     * already verified Integration Shadow.
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


        const province =
          normalizeProvince83BSourceShadowV4(
            integration &&
            integration.resolved
              ? integration
                  .resolved
                  .province
              : null
          );


        const resolver =
          integration &&
          integration.resolver
            ? integration.resolver
            : {};


        const shadow =
          integration &&
          integration.shadow
            ? integration.shadow
            : {};


        if (
          resolver.ready === true &&
          resolver.sourceTrusted === true &&
          shadow.b8Verified === true &&
          province
        ) {

          return {

            ready: true,

            province,

            source:
              resolver.source ||
              'B8_VERIFIED_SELECTED_PROVINCE',

            resolverName:
              'buildStep83BIntegrationShadow03D59',

            raw:
              clone83BSourceShadowV4(
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

      province: null,

      source: 'NONE',

      resolverName: null,

      raw: null

    };

  }


  /* =========================================================
     READ REAL STEP 8.2C
     ========================================================= */

  function readReal82C83BSourceShadowV4() {

    let source;


    try {

      source =
        window
          .LAST_FIX03D59_STEP82C_RESULT;

    } catch (error) {

      source = null;

    }


    if (
      !source ||
      typeof source !==
        'object'
    ) {

      return {

        available: false,

        validated: false,

        reason:
          'REAL_STEP82C_NOT_AVAILABLE',

        source: null

      };

    }


    const eligible =
      Array.isArray(
        source.eligible
      )
        ? source.eligible
        : null;


    const ineligible =
      Array.isArray(
        source.ineligible
      )
        ? source.ineligible
        : null;


    const validated =
      source.ready === true &&
      source.passed === true &&
      eligible !== null &&
      ineligible !== null;


    return {

      available: true,

      validated,

      reason:
        validated
          ? 'REAL_STEP82C_VALIDATED'
          : 'REAL_STEP82C_NOT_VALIDATED',

      source

    };

  }


  /* =========================================================
     FILTER REAL 8.2C ELIGIBLE RECORDS
     ========================================================= */

  function buildFiltered82CSource83BSourceShadowV4(
    real82C,
    verifiedProvince
  ) {

    const eligible =
      Array.isArray(
        real82C.eligible
      )
        ? real82C.eligible
        : [];


    const filtered =
      eligible.filter(
        function (record) {

          return (
            normalizeProvince83BSourceShadowV4(
              record &&
              record.province
            ) ===
            verifiedProvince
          );

        }
      );


    const foreign =
      filtered.filter(
        function (record) {

          return (
            normalizeProvince83BSourceShadowV4(
              record &&
              record.province
            ) !==
            verifiedProvince
          );

        }
      );


    const identities =
      filtered.map(
        identity83BSourceShadowV4
      );


    const validIdentities =
      identities.filter(
        Boolean
      );


    const identityComplete =
      filtered.length > 0 &&
      validIdentities.length ===
        filtered.length;


    const identityUnique =
      identityComplete &&
      unique83BSourceShadowV4(
        validIdentities
      ).length ===
        validIdentities.length;


    /*
     * Build a NEW object.
     * Never mutate LAST_FIX03D59_STEP82C_RESULT.
     */

    const shadowSource = {

      ready: true,

      passed: true,

      eligible:
        clone83BSourceShadowV4(
          filtered
        ) || [],

      ineligible: []

    };


    return {

      filtered,

      foreign,

      identities:
        validIdentities,

      identityComplete,

      identityUnique,

      shadowSource

    };

  }


  /* =========================================================
     REAL STEP 8.3 BOUNDARY BUILDER
     ========================================================= */

  function resolveBoundaryBuilder83BSourceShadowV4() {

    try {

      if (
        typeof window
          .buildProductionCandidateBoundaryV26 ===
        'function'
      ) {

        return {

          ready: true,

          name:
            'buildProductionCandidateBoundaryV26',

          fn:
            window
              .buildProductionCandidateBoundaryV26

        };

      }

    } catch (error) {

      // FAIL CLOSED

    }


    return {

      ready: false,

      name: null,

      fn: null

    };

  }


  /* =========================================================
     BOUNDARY CANDIDATES
     ========================================================= */

  function extractBoundaryCandidates83BSourceShadowV4(
    result
  ) {

    if (
      !result ||
      typeof result !==
        'object'
    ) {

      return [];

    }


    const possible = [

      result.candidates,

      result.eligible,

      result.items,

      result.results,

      result.productionCandidates

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
      result.boundary &&
      Array.isArray(
        result.boundary.candidates
      )
    ) {

      return result
        .boundary
        .candidates;

    }


    return [];

  }


  function extractRejected83BSourceShadowV4(
    result
  ) {

    if (
      !result ||
      typeof result !==
        'object'
    ) {

      return [];

    }


    const possible = [

      result.rejected,

      result.rejectedCandidates,

      result.invalid

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


    return [];

  }


  function candidateIdentity83BSourceShadowV4(
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


    const indexValue =
      candidate.canonicalIndex !==
        undefined
        ? candidate.canonicalIndex
        : record.index;


    const provinceValue =
      candidate.province ||
      record.province;


    const prizeValue =
      candidate.prize ||
      record.prize;


    const index =
      Number(
        indexValue
      );


    const province =
      normalizeProvince83BSourceShadowV4(
        provinceValue
      );


    const prize =
      normalizePrize83BSourceShadowV4(
        prizeValue
      );


    if (
      !Number.isFinite(index) ||
      !province ||
      !prize
    ) {

      return null;

    }


    return (
      String(index) +
      '|' +
      province +
      '|' +
      prize
    );

  }


  /* =========================================================
     MAIN BUILD
     ========================================================= */

  function build83BSourceShadow() {

    const verified =
      resolveVerifiedProvince83BSourceShadowV4();


    if (!verified.ready) {

      return buildFailure83BSourceShadowV4(
        'B8_VERIFIED_SCOPE_NOT_AVAILABLE',
        verified
      );

    }


    const real82C =
      readReal82C83BSourceShadowV4();


    if (!real82C.available) {

      return buildFailure83BSourceShadowV4(
        'REAL_STEP82C_NOT_AVAILABLE',
        verified
      );

    }


    if (!real82C.validated) {

      return buildFailure83BSourceShadowV4(
        'REAL_STEP82C_NOT_VALIDATED',
        verified
      );

    }


    const filtered =
      buildFiltered82CSource83BSourceShadowV4(
        real82C.source,
        verified.province
      );


    const shadowEligibleCount =
      filtered.filtered.length;


    if (
      shadowEligibleCount === 0
    ) {

      return buildFailure83BSourceShadowV4(
        'NO_REAL82C_ELIGIBLE_RECORDS_FOR_VERIFIED_PROVINCE',
        verified,
        {

          real82CAvailable:
            true,

          real82CValidated:
            true,

          real82CEligibleCount:
            real82C
              .source
              .eligible
              .length,

          shadowEligibleCount:
            0

        }
      );

    }


    if (
      filtered.foreign.length !==
        0
    ) {

      return buildFailure83BSourceShadowV4(
        'FOREIGN_PROVINCE_LEAKAGE',
        verified
      );

    }


    if (
      !filtered.identityComplete ||
      !filtered.identityUnique
    ) {

      return buildFailure83BSourceShadowV4(
        'SHADOW_IDENTITY_INVALID',
        verified,
        {

          shadowEligibleCount,

          identityComplete:
            filtered.identityComplete,

          identityUnique:
            filtered.identityUnique

        }
      );

    }


    const boundary =
      resolveBoundaryBuilder83BSourceShadowV4();


    if (!boundary.ready) {

      return buildFailure83BSourceShadowV4(
        'REAL_STEP83_BOUNDARY_BUILDER_NOT_AVAILABLE',
        verified,
        {

          real82CAvailable:
            true,

          real82CValidated:
            true,

          shadowEligibleCount,

          identityComplete:
            filtered.identityComplete,

          identityUnique:
            filtered.identityUnique

        }
      );

    }


    let boundaryResult;


    try {

      boundaryResult =
        boundary.fn(
          clone83BSourceShadowV4(
            filtered.shadowSource
          )
        );

    } catch (error) {

      return buildFailure83BSourceShadowV4(
        'REAL_STEP83_BOUNDARY_BUILDER_ERROR',
        verified,
        {

          error:
            error &&
            error.message
              ? error.message
              : String(error),

          real82CAvailable:
            true,

          real82CValidated:
            true,

          shadowEligibleCount,

          boundaryBuilderName:
            boundary.name

        }
      );

    }


    const boundaryCandidates =
      extractBoundaryCandidates83BSourceShadowV4(
        boundaryResult
      );


    const rejected =
      extractRejected83BSourceShadowV4(
        boundaryResult
      );


    const sourceIdentities =
      filtered.identities;


    const boundaryIdentities =
      boundaryCandidates
        .map(
          candidateIdentity83BSourceShadowV4
        )
        .filter(
          Boolean
        );


    const boundaryIdentityComplete =
      boundaryCandidates.length > 0 &&
      boundaryIdentities.length ===
        boundaryCandidates.length;


    const boundaryIdentityUnique =
      boundaryIdentityComplete &&
      unique83BSourceShadowV4(
        boundaryIdentities
      ).length ===
        boundaryIdentities.length;


    const sourceIdentitySet =
      new Set(
        sourceIdentities
      );


    const everyBoundaryIdentityFromSource =
      boundaryIdentityComplete &&
      boundaryIdentities.every(
        function (identity) {

          return sourceIdentitySet.has(
            identity
          );

        }
      );


    const provinceMatch =
      boundaryCandidates.every(
        function (candidate) {

          const record =
            candidate &&
            candidate.record
              ? candidate.record
              : candidate;


          return (
            normalizeProvince83BSourceShadowV4(
              candidate &&
              candidate.province
                ? candidate.province
                : record &&
                  record.province
            ) ===
            verified.province
          );

        }
      );


    const sourceCount =
      shadowEligibleCount;


    const boundaryCount =
      boundaryCandidates.length;


    const rejectedCount =
      rejected.length;


    const countsBalanced =
      boundaryCount +
      rejectedCount ===
      sourceCount;


    const countMatches =
      boundaryCount ===
        sourceCount;


    const boundaryPassed =
      Boolean(
        boundaryResult &&
        boundaryResult.ready === true &&
        boundaryResult.passed === true
      );


    const passed =
      verified.ready === true &&
      real82C.validated === true &&
      sourceCount > 0 &&
      filtered.foreign.length === 0 &&
      filtered.identityComplete === true &&
      filtered.identityUnique === true &&
      boundaryPassed === true &&
      rejectedCount === 0 &&
      countsBalanced === true &&
      countMatches === true &&
      boundaryIdentityComplete === true &&
      boundaryIdentityUnique === true &&
      everyBoundaryIdentityFromSource === true &&
      provinceMatch === true;


    const result = {

      version:
        VERSION,

      ready:
        passed,

      passed,

      reason:
        passed
          ? 'B8_REAL82C_SOURCE_BOUNDARY_SHADOW_READY'
          : 'SOURCE_BOUNDARY_SCOPE_MISMATCH',

      verifiedScope: {

        ready:
          verified.ready,

        province:
          verified.province,

        source:
          verified.source,

        resolverName:
          verified.resolverName

      },

      real82C: {

        available:
          true,

        validated:
          real82C.validated,

        ready:
          real82C.source.ready ===
            true,

        passed:
          real82C.source.passed ===
            true,

        eligibleCount:
          real82C
            .source
            .eligible
            .length,

        ineligibleCount:
          real82C
            .source
            .ineligible
            .length

      },

      provinceFilter: {

        province:
          verified.province,

        shadowEligibleCount:
          sourceCount,

        foreignProvinceLeakage:
          filtered.foreign.length,

        passed:
          filtered.foreign.length ===
            0 &&
          sourceCount > 0

      },

      identity: {

        sourceIdentityComplete:
          filtered.identityComplete,

        sourceIdentityUnique:
          filtered.identityUnique,

        boundaryIdentityComplete,

        boundaryIdentityUnique,

        everyBoundaryIdentityFromSource,

        preserved:
          filtered.identityComplete &&
          filtered.identityUnique &&
          boundaryIdentityComplete &&
          boundaryIdentityUnique &&
          everyBoundaryIdentityFromSource

      },

      boundary: {

        builderAvailable:
          true,

        builderName:
          boundary.name,

        ready:
          Boolean(
            boundaryResult &&
            boundaryResult.ready ===
              true
          ),

        passed:
          Boolean(
            boundaryResult &&
            boundaryResult.passed ===
              true
          ),

        sourceCount,

        candidateCount:
          boundaryCount,

        rejectedCount,

        countsBalanced,

        candidateCountMatch:
          countMatches,

        provinceMatch

      },

      shadowSource:
        clone83BSourceShadowV4(
          filtered.shadowSource
        ),

      boundaryResult:
        clone83BSourceShadowV4(
          boundaryResult
        ),

      safety: {

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

        forecastEngineExecuted:
          false,

        savePredictionCalled:
          false,

        lastForecastModified:
          false,

        canonicalCandidatesModified:
          false

      }

    };


    /*
     * Diagnostic RAM alias only.
     */

    window
      .LAST_FIX03D59_STEP83B_SOURCE_SHADOW =
      clone83BSourceShadowV4(
        result
      );


    return result;

  }


  /* =========================================================
     FAILURE RESULT
     ========================================================= */

  function buildFailure83BSourceShadowV4(
    reason,
    verified,
    extra
  ) {

    const result = {

      version:
        VERSION,

      ready:
        false,

      passed:
        false,

      reason,

      verifiedScope: {

        ready:
          Boolean(
            verified &&
            verified.ready
          ),

        province:
          verified
            ? verified.province
            : null,

        source:
          verified
            ? verified.source
            : 'NONE',

        resolverName:
          verified
            ? verified.resolverName
            : null

      },

      real82C: {

        available:
          extra &&
          extra.real82CAvailable ===
            true,

        validated:
          extra &&
          extra.real82CValidated ===
            true

      },

      provinceFilter: {

        shadowEligibleCount:
          extra &&
          Number.isFinite(
            Number(
              extra.shadowEligibleCount
            )
          )
            ? Number(
                extra.shadowEligibleCount
              )
            : 0,

        foreignProvinceLeakage:
          0,

        passed:
          false

      },

      identity: {

        sourceIdentityComplete:
          extra &&
          extra.identityComplete ===
            true,

        sourceIdentityUnique:
          extra &&
          extra.identityUnique ===
            true,

        boundaryIdentityComplete:
          false,

        boundaryIdentityUnique:
          false,

        everyBoundaryIdentityFromSource:
          false,

        preserved:
          false

      },

      boundary: {

        builderAvailable:
          Boolean(
            extra &&
            extra.boundaryBuilderName
          ),

        builderName:
          extra &&
          extra.boundaryBuilderName
            ? extra.boundaryBuilderName
            : null,

        ready:
          false,

        passed:
          false,

        sourceCount:
          extra &&
          Number.isFinite(
            Number(
              extra.shadowEligibleCount
            )
          )
            ? Number(
                extra.shadowEligibleCount
              )
            : 0,

        candidateCount:
          0,

        rejectedCount:
          0,

        countsBalanced:
          false,

        candidateCountMatch:
          false,

        provinceMatch:
          false

      },

      error:
        extra &&
        extra.error
          ? extra.error
          : null,

      safety: {

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

        forecastEngineExecuted:
          false,

        savePredictionCalled:
          false,

        lastForecastModified:
          false,

        canonicalCandidatesModified:
          false

      }

    };


    window
      .LAST_FIX03D59_STEP83B_SOURCE_SHADOW =
      clone83BSourceShadowV4(
        result
      );


    return result;

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
      'FIX-03D5.9 STEP 8.3B SOURCE SHADOW V4 ARRAY FIX'
    );

    console.log(
      'REAL 8.2C FILTERED SOURCE'
    );

    console.log(
      '=========================================='
    );

    console.log(
      result
    );


    if (
      result &&
      result.boundaryResult
    ) {

      console.log(
        'REAL STEP 8.3 BOUNDARY RESULT:'
      );

      console.log(
        result.boundaryResult
      );

    }


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
    'FIX-03D5.9 STEP 8.3B Source Shadow V4 ARRAY FIX loaded / REAL 8.2C FILTER / REAL 8.3 BOUNDARY / READ ONLY / ZERO WRITE'
  );

})();
