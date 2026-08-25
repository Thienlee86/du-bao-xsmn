/* =========================================================================
   FIX-03D5.9 — STEP 8.3B SOURCE SHADOW V4.1
   FILE:
   modules/fix03d59-83b-source-shadow.js

   PURPOSE:
   - Resolve the currently trusted STEP 8.3B province scope.
   - Support resolver.resolvedScope as ARRAY or scalar.
   - Accept the current Production = Selected resolver result when READY.
   - Preserve support for B8_VERIFIED_SELECTED_PROVINCE.
   - Read the REAL STEP 8.2C RAM result.
   - Filter REAL 8.2C eligible records to exactly the resolved province.
   - Preserve canonical identity:
       index
       province
       prize
   - Feed a NEW READ-ONLY shadow source into the REAL STEP 8.3
     boundary builder:
       buildProductionCandidateBoundaryV26()
   - Verify count / identity / province isolation.
   - Never replace or modify REAL STEP 8.2C / STEP 8.3B.

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
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    '83B-SOURCE-SHADOW-V4.1-RESOLVER-COMPAT';


  /* =========================================================
     HELPERS
     ========================================================= */

  function clone83BSourceShadowV41(
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


  function normalizeProvince83BSourceShadowV41(
    value
  ) {

    if (
      value === undefined ||
      value === null
    ) {

      return null;

    }


    /*
     * Resolver V2 returns:
     *
     * resolvedScope: ['ben-tre']
     *
     * Accept exactly one province from a single-item array.
     * Multi-province arrays FAIL CLOSED.
     */

    if (
      Array.isArray(
        value
      )
    ) {

      if (
        value.length !== 1
      ) {

        return null;

      }


      value =
        value[0];

    }


    if (
      value &&
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


    if (
      !normalized ||
      normalized.length > 40
    ) {

      return null;

    }


    if (
      !/^[a-z0-9-]+$/.test(
        normalized
      )
    ) {

      return null;

    }


    return normalized;

  }


  function normalizePrize83BSourceShadowV41(
    value
  ) {

    if (
      value === undefined ||
      value === null
    ) {

      return null;

    }


    const normalized =
      String(
        value
      )
        .trim()
        .toLowerCase();


    return normalized || null;

  }


  function unique83BSourceShadowV41(
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


  function identity83BSourceShadowV41(
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
      normalizeProvince83BSourceShadowV41(
        record.province
      );


    const prize =
      normalizePrize83BSourceShadowV41(
        record.prize
      );


    if (
      !Number.isFinite(
        index
      ) ||
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
     RESOLVER SOURCE TRUST
     ========================================================= */

  function isTrustedResolverSource83BSourceShadowV41(
    source,
    result
  ) {

    /*
     * Explicit trusted resolver sources.
     *
     * IMPORTANT:
     * "trusted" here means trusted for this READ-ONLY
     * shadow diagnostic only.
     *
     * It does NOT authorize Production write.
     */

    const trustedSources = [

      'B8_VERIFIED_SELECTED_PROVINCE',

      'PRODUCTION_FORECAST_MATCHED_SELECTED_PROVINCE',

      'PRODUCTION_FORECAST_CONFIRMED_BY_B8'

    ];


    if (
      trustedSources.includes(
        source
      )
    ) {

      return true;

    }


    /*
     * Defensive compatibility with another resolver wrapper.
     */

    if (
      result &&
      result.sourceTrusted === true
    ) {

      return true;

    }


    if (
      result &&
      result.resolver &&
      result.resolver.sourceTrusted ===
        true
    ) {

      return true;

    }


    return false;

  }


  /* =========================================================
     VERIFIED / RESOLVED PROVINCE
     ========================================================= */

  function resolveVerifiedProvince83BSourceShadowV41() {

    /*
     * ---------------------------------------------------------
     * PRIMARY PATH
     * ---------------------------------------------------------
     *
     * STEP 8.3B Scope Resolver V2.
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


        if (
          result &&
          typeof result ===
            'object'
        ) {

          const province =
            normalizeProvince83BSourceShadowV41(
              result.resolvedScope
            ) ||

            normalizeProvince83BSourceShadowV41(
              result.resolvedProvince
            ) ||

            normalizeProvince83BSourceShadowV41(
              result.province
            ) ||

            normalizeProvince83BSourceShadowV41(
              result.resolved &&
              result.resolved.province
            ) ||

            normalizeProvince83BSourceShadowV41(
              result.scope &&
              result.scope.province
            );


          const source =
            result.source ||
            (
              result.resolver &&
              result.resolver.source
            ) ||
            null;


          const trusted =
            isTrustedResolverSource83BSourceShadowV41(
              source,
              result
            );


          /*
           * Additional consistency guard.
           *
           * If Production + Selected both exist,
           * they must agree with the resolved province.
           */

          const productionProvince =
            normalizeProvince83BSourceShadowV41(
              result.productionProvince
            );


          const selectedProvince =
            normalizeProvince83BSourceShadowV41(
              result.selectedProvince
            );


          const productionSelectedConflict =
            Boolean(
              productionProvince &&
              selectedProvince &&
              productionProvince !==
                selectedProvince
            );


          const resolvedProductionConflict =
            Boolean(
              productionProvince &&
              province &&
              productionProvince !==
                province
            );


          const resolvedSelectedConflict =
            Boolean(
              selectedProvince &&
              province &&
              selectedProvince !==
                province
            );


          const consistent =
            !productionSelectedConflict &&
            !resolvedProductionConflict &&
            !resolvedSelectedConflict;


          if (
            result.ready === true &&
            province &&
            trusted &&
            consistent
          ) {

            return {

              ready:
                true,

              province,

              source:
                source ||
                'RESOLVER_READY',

              resolverName:
                'resolveStep83BScope03D59',

              sourceTrusted:
                true,

              consistent:
                true,

              raw:
                clone83BSourceShadowV41(
                  result
                )

            };

          }


          /*
           * Resolver existed but was not acceptable.
           *
           * Continue to secondary path instead of throwing.
           */

        }

      }

    } catch (error) {

      // FAIL CLOSED

    }


    /*
     * ---------------------------------------------------------
     * SECONDARY PATH
     * ---------------------------------------------------------
     *
     * Existing Integration Shadow.
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
          normalizeProvince83BSourceShadowV41(
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

            ready:
              true,

            province,

            source:
              resolver.source ||
              'B8_VERIFIED_SELECTED_PROVINCE',

            resolverName:
              'buildStep83BIntegrationShadow03D59',

            sourceTrusted:
              true,

            consistent:
              true,

            raw:
              clone83BSourceShadowV41(
                integration
              )

          };

        }

      }

    } catch (error) {

      // FAIL CLOSED

    }


    return {

      ready:
        false,

      province:
        null,

      source:
        'NONE',

      resolverName:
        null,

      sourceTrusted:
        false,

      consistent:
        false,

      raw:
        null

    };

  }


  /* =========================================================
     READ REAL STEP 8.2C
     ========================================================= */

  function readReal82C83BSourceShadowV41() {

    let source = null;


    try {

      source =
        window
          .LAST_FIX03D59_STEP82C_RESULT ||
        null;

    } catch (error) {

      source = null;

    }


    if (
      !source ||
      typeof source !==
        'object'
    ) {

      return {

        available:
          false,

        validated:
          false,

        reason:
          'REAL_STEP82C_NOT_AVAILABLE',

        source:
          null

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

      available:
        true,

      validated,

      reason:
        validated
          ? 'REAL_STEP82C_VALIDATED'
          : 'REAL_STEP82C_NOT_VALIDATED',

      source

    };

  }


  /* =========================================================
     FILTER REAL STEP 8.2C
     ========================================================= */

  function buildFiltered82CSource83BSourceShadowV41(
    real82C,
    verifiedProvince
  ) {

    const eligible =
      Array.isArray(
        real82C &&
        real82C.eligible
      )
        ? real82C.eligible
        : [];


    const filtered =
      eligible.filter(
        function (record) {

          return (
            normalizeProvince83BSourceShadowV41(
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
            normalizeProvince83BSourceShadowV41(
              record &&
              record.province
            ) !==
            verifiedProvince
          );

        }
      );


    const identities =
      filtered.map(
        identity83BSourceShadowV41
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
      unique83BSourceShadowV41(
        validIdentities
      ).length ===
        validIdentities.length;


    /*
     * NEW OBJECT ONLY.
     *
     * Never mutate:
     * window.LAST_FIX03D59_STEP82C_RESULT
     */

    const shadowSource = {

      ready:
        true,

      passed:
        true,

      eligible:
        clone83BSourceShadowV41(
          filtered
        ) || [],

      ineligible:
        []

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

  function resolveBoundaryBuilder83BSourceShadowV41() {

    try {

      if (
        typeof window
          .buildProductionCandidateBoundaryV26 ===
        'function'
      ) {

        return {

          ready:
            true,

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

      ready:
        false,

      name:
        null,

      fn:
        null

    };

  }


  /* =========================================================
     EXTRACT BOUNDARY OUTPUT
     ========================================================= */

  function extractBoundaryCandidates83BSourceShadowV41(
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
        Array.isArray(
          value
        )
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


  function extractRejected83BSourceShadowV41(
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

      result.invalid,

      result.ineligible

    ];


    for (
      const value
      of possible
    ) {

      if (
        Array.isArray(
          value
        )
      ) {

        return value;

      }

    }


    return [];

  }


  function candidateIdentity83BSourceShadowV41(
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
      normalizeProvince83BSourceShadowV41(
        provinceValue
      );


    const prize =
      normalizePrize83BSourceShadowV41(
        prizeValue
      );


    if (
      !Number.isFinite(
        index
      ) ||
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
     FAILURE RESULT
     ========================================================= */

  function buildFailure83BSourceShadowV41(
    reason,
    verified,
    extra
  ) {

    extra =
      extra &&
      typeof extra ===
        'object'
        ? extra
        : {};


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
            : null,

        sourceTrusted:
          Boolean(
            verified &&
            verified.sourceTrusted
          ),

        consistent:
          Boolean(
            verified &&
            verified.consistent
          )

      },

      real82C: {

        available:
          extra.real82CAvailable ===
            true,

        validated:
          extra.real82CValidated ===
            true

      },

      provinceFilter: {

        province:
          verified
            ? verified.province
            : null,

        shadowEligibleCount:
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
          Number.isFinite(
            Number(
              extra.foreignProvinceLeakage
            )
          )
            ? Number(
                extra.foreignProvinceLeakage
              )
            : 0,

        passed:
          false

      },

      identity: {

        sourceIdentityComplete:
          extra.identityComplete ===
            true,

        sourceIdentityUnique:
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
            extra.boundaryBuilderName
          ),

        builderName:
          extra.boundaryBuilderName ||
          null,

        ready:
          false,

        passed:
          false,

        sourceCount:
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
        extra.error ||
        null,

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
          false,

        real83BModified:
          false

      }

    };


    window
      .LAST_FIX03D59_STEP83B_SOURCE_SHADOW =
      clone83BSourceShadowV41(
        result
      );


    return result;

  }


  /* =========================================================
     MAIN BUILD
     ========================================================= */

  function build83BSourceShadow() {

    const verified =
      resolveVerifiedProvince83BSourceShadowV41();


    if (
      !verified.ready ||
      !verified.province ||
      !verified.sourceTrusted ||
      !verified.consistent
    ) {

      return buildFailure83BSourceShadowV41(
        'TRUSTED_RESOLVED_SCOPE_NOT_AVAILABLE',
        verified
      );

    }


    const real82C =
      readReal82C83BSourceShadowV41();


    if (
      !real82C.available
    ) {

      return buildFailure83BSourceShadowV41(
        'REAL_STEP82C_NOT_AVAILABLE',
        verified
      );

    }


    if (
      !real82C.validated
    ) {

      return buildFailure83BSourceShadowV41(
        'REAL_STEP82C_NOT_VALIDATED',
        verified,
        {

          real82CAvailable:
            true,

          real82CValidated:
            false

        }
      );

    }


    const filtered =
      buildFiltered82CSource83BSourceShadowV41(
        real82C.source,
        verified.province
      );


    const shadowEligibleCount =
      filtered.filtered.length;


    if (
      shadowEligibleCount === 0
    ) {

      return buildFailure83BSourceShadowV41(
        'NO_REAL82C_ELIGIBLE_RECORDS_FOR_RESOLVED_PROVINCE',
        verified,
        {

          real82CAvailable:
            true,

          real82CValidated:
            true,

          shadowEligibleCount:
            0

        }
      );

    }


    if (
      filtered.foreign.length !==
        0
    ) {

      return buildFailure83BSourceShadowV41(
        'FOREIGN_PROVINCE_LEAKAGE',
        verified,
        {

          real82CAvailable:
            true,

          real82CValidated:
            true,

          shadowEligibleCount,

          foreignProvinceLeakage:
            filtered.foreign.length

        }
      );

    }


    if (
      !filtered.identityComplete ||
      !filtered.identityUnique
    ) {

      return buildFailure83BSourceShadowV41(
        'SHADOW_IDENTITY_INVALID',
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


    const boundary =
      resolveBoundaryBuilder83BSourceShadowV41();


    if (
      !boundary.ready
    ) {

      return buildFailure83BSourceShadowV41(
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


    let boundaryResult = null;


    try {

      /*
       * REAL boundary builder receives a NEW clone.
       *
       * Canonical STEP 8.2C object remains untouched.
       */

      boundaryResult =
        boundary.fn(
          clone83BSourceShadowV41(
            filtered.shadowSource
          )
        );

    } catch (error) {

      return buildFailure83BSourceShadowV41(
        'REAL_STEP83_BOUNDARY_BUILDER_ERROR',
        verified,
        {

          error:
            error &&
            error.message
              ? error.message
              : String(
                  error
                ),

          real82CAvailable:
            true,

          real82CValidated:
            true,

          shadowEligibleCount,

          boundaryBuilderName:
            boundary.name,

          identityComplete:
            filtered.identityComplete,

          identityUnique:
            filtered.identityUnique

        }
      );

    }


    const boundaryCandidates =
      extractBoundaryCandidates83BSourceShadowV41(
        boundaryResult
      );


    const rejected =
      extractRejected83BSourceShadowV41(
        boundaryResult
      );


    const sourceIdentities =
      filtered.identities;


    const boundaryIdentities =
      boundaryCandidates
        .map(
          candidateIdentity83BSourceShadowV41
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
      unique83BSourceShadowV41(
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


    const boundaryIdentitySet =
      new Set(
        boundaryIdentities
      );


    const everySourceIdentityInBoundary =
      boundaryIdentityComplete &&
      sourceIdentities.every(
        function (identity) {

          return boundaryIdentitySet.has(
            identity
          );

        }
      );


    const exactIdentitySetMatch =
      everyBoundaryIdentityFromSource &&
      everySourceIdentityInBoundary &&
      sourceIdentities.length ===
        boundaryIdentities.length;


    const provinceMatch =
      boundaryCandidates.length > 0 &&
      boundaryCandidates.every(
        function (candidate) {

          const record =
            candidate &&
            candidate.record &&
            typeof candidate.record ===
              'object'
              ? candidate.record
              : candidate;


          const province =
            normalizeProvince83BSourceShadowV41(
              candidate &&
              candidate.province
                ? candidate.province
                : record &&
                  record.province
            );


          return (
            province ===
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


    const candidateCountMatch =
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
      verified.sourceTrusted === true &&
      verified.consistent === true &&
      real82C.validated === true &&
      sourceCount > 0 &&
      filtered.foreign.length === 0 &&
      filtered.identityComplete === true &&
      filtered.identityUnique === true &&
      boundaryPassed === true &&
      rejectedCount === 0 &&
      countsBalanced === true &&
      candidateCountMatch === true &&
      boundaryIdentityComplete === true &&
      boundaryIdentityUnique === true &&
      everyBoundaryIdentityFromSource ===
        true &&
      everySourceIdentityInBoundary ===
        true &&
      exactIdentitySetMatch === true &&
      provinceMatch === true;


    const result = {

      version:
        VERSION,

      ready:
        passed,

      passed,

      reason:
        passed
          ? 'RESOLVED_REAL82C_SOURCE_BOUNDARY_SHADOW_READY'
          : 'SOURCE_BOUNDARY_SCOPE_MISMATCH',

      verifiedScope: {

        ready:
          verified.ready,

        province:
          verified.province,

        source:
          verified.source,

        resolverName:
          verified.resolverName,

        sourceTrusted:
          verified.sourceTrusted,

        consistent:
          verified.consistent

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

        everySourceIdentityInBoundary,

        exactIdentitySetMatch,

        preserved:
          filtered.identityComplete &&
          filtered.identityUnique &&
          boundaryIdentityComplete &&
          boundaryIdentityUnique &&
          exactIdentitySetMatch

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

        candidateCountMatch,

        provinceMatch

      },

      shadowSource:
        clone83BSourceShadowV41(
          filtered.shadowSource
        ),

      boundaryResult:
        clone83BSourceShadowV41(
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
          false,

        real83BModified:
          false

      }

    };


    /*
     * Diagnostic RAM alias only.
     */

    window
      .LAST_FIX03D59_STEP83B_SOURCE_SHADOW =
      clone83BSourceShadowV41(
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
      'FIX-03D5.9 STEP 8.3B SOURCE SHADOW V4.1'
    );

    console.log(
      'RESOLVER COMPAT / REAL 8.2C / REAL 8.3 BOUNDARY'
    );

    console.log(
      'READ ONLY / SHADOW ONLY / ZERO WRITE'
    );

    console.log(
      '=========================================='
    );


    console.log(
      'Result:',
      result
    );


    console.log(
      'Resolved Province:',
      result &&
      result.verifiedScope
        ? result
            .verifiedScope
            .province
        : null
    );


    console.log(
      'Resolver Source:',
      result &&
      result.verifiedScope
        ? result
            .verifiedScope
            .source
        : null
    );


    console.log(
      'Source Trusted:',
      result &&
      result.verifiedScope
        ? result
            .verifiedScope
            .sourceTrusted
        : false
    );


    console.log(
      'Real 8.2C:',
      result
        ? result.real82C
        : null
    );


    console.log(
      'Province Filter:',
      result
        ? result.provinceFilter
        : null
    );


    console.log(
      'Identity:',
      result
        ? result.identity
        : null
    );


    console.log(
      'Boundary:',
      result
        ? result.boundary
        : null
    );


    console.log(
      'Safety:',
      result
        ? result.safety
        : null
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
    'FIX-03D5.9 STEP 8.3B Source Shadow V4.1 loaded / RESOLVER COMPAT / REAL 8.2C FILTER / REAL 8.3 BOUNDARY / READ ONLY / ZERO WRITE'
  );

})();
