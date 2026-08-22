/* =========================================================================
   FIX-03D5.9 — STEP 8.3B INTEGRATION GATE V3-B8PATH
   FILE:
   modules/fix03d59-83b-integration-gate.js

   PURPOSE:
   - Validate the boundary:
       B8 Verification Path
         -> STEP 8.3B Scope Resolver V2-B8PATH
         -> future STEP 8.3B integration.
   - Accept B8-verified selected province as a valid PRE-PRODUCTION
     boundary source even when LAST_FORECAST does not yet exist.
   - Keep Production Forecast observation available when present.
   - Keep current STEP 8.3B candidates for comparison only.
   - NEVER interpret boundaryReady as write authorization.

   IMPORTANT:
   - READ ONLY.
   - ZERO WRITE.
   - NO ENGINE EXECUTION.
   - Does NOT rebuild STEP 8.3B.
   - Does NOT modify STEP 8.3B candidates.
   - Does NOT modify LAST_FORECAST.
   - Does NOT call savePrediction().
   - Does NOT write storage.
   - FAIL CLOSED.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    '83B-INTEGRATION-GATE-V3-B8PATH';


  const TRUSTED_B8_SOURCE =
    'B8_VERIFIED_SELECTED_PROVINCE';


  const LEGACY_PROVINCES = [
    'tp-hcm',
    'tay-ninh',
    'tien-giang',
    'binh-duong'
  ];


  /* =========================================================
     HELPERS
     ========================================================= */

  function normalize83BGate(value) {

    return String(
      value == null
        ? ''
        : value
    )
      .trim()
      .toLowerCase();

  }


  function unique83BGate(values) {

    return Array.from(
      new Set(
        (values || [])
          .map(
            normalize83BGate
          )
          .filter(Boolean)
      )
    );

  }


  /* =========================================================
     SELECTED PROVINCE
     ========================================================= */

  function getSelectedProvince83BGate() {

    try {

      const select =
        document.getElementById(
          'provinceSelect'
        );


      if (
        select &&
        select.value
      ) {

        return normalize83BGate(
          select.value
        );

      }

    } catch (error) {

      // READ ONLY

    }


    try {

      if (
        typeof SELECTED_PROVINCE !==
          'undefined' &&
        SELECTED_PROVINCE
      ) {

        return normalize83BGate(
          SELECTED_PROVINCE
        );

      }

    } catch (error) {

      // READ ONLY

    }


    return null;

  }


  /* =========================================================
     CURRENT STEP 8.3B
     ========================================================= */

  function inspectCurrent83BGate() {

    let step83B = null;


    try {

      step83B =
        window
          .LAST_FIX03D59_STEP83B_RESULT ||
        null;

    } catch (error) {

      step83B = null;

    }


    const candidates =
      step83B &&
      Array.isArray(
        step83B.candidates
      )
        ? step83B.candidates
        : [];


    const provinces =
      unique83BGate(
        candidates.map(
          function (candidate) {

            if (!candidate) {

              return null;

            }


            return (
              candidate.province ||
              candidate.provinceSlug ||
              null
            );

          }
        )
      );


    const legacyMatches =
      LEGACY_PROVINCES.filter(
        function (province) {

          return provinces.includes(
            province
          );

        }
      );


    return {

      exists:
        Boolean(step83B),

      candidateCount:
        candidates.length,

      provinces,

      legacyMatches,

      carriesFullLegacyScope:
        LEGACY_PROVINCES.every(
          function (province) {

            return provinces.includes(
              province
            );

          }
        )

    };

  }


  /* =========================================================
     SCOPE RESOLVER
     ========================================================= */

  function resolveScope83BGate() {

    let resolver = null;


    try {

      if (
        typeof window
          .resolveStep83BScope03D59 ===
        'function'
      ) {

        resolver =
          window
            .resolveStep83BScope03D59;

      }

    } catch (error) {

      resolver = null;

    }


    if (!resolver) {

      return {

        available: false,

        result: null,

        error:
          'RESOLVER_NOT_AVAILABLE'

      };

    }


    try {

      const result =
        resolver();


      return {

        available: true,

        result:
          result || null,

        error: null

      };

    } catch (error) {

      return {

        available: true,

        result: null,

        error:
          error &&
          error.message
            ? error.message
            : String(error)

      };

    }

  }


  function getResolvedScope83BGate(
    resolverResult
  ) {

    if (!resolverResult) {

      return [];

    }


    const possibleValues = [
      resolverResult.resolvedScope,
      resolverResult.scope,
      resolverResult.provinces,
      resolverResult.province
    ];


    for (
      const value
      of possibleValues
    ) {

      if (
        Array.isArray(value)
      ) {

        const normalized =
          unique83BGate(
            value
          );


        if (
          normalized.length
        ) {

          return normalized;

        }

      }


      if (
        typeof value === 'string' ||
        typeof value === 'number'
      ) {

        const normalized =
          normalize83BGate(
            value
          );


        if (
          normalized
        ) {

          return [
            normalized
          ];

        }

      }

    }


    return [];

  }


  /* =========================================================
     PRODUCTION OBSERVATION
     ========================================================= */

  function getProductionView83BGate(
    resolverResult
  ) {

    if (!resolverResult) {

      return {

        forecastExists: false,

        province: null,

        selectedMatchesProduction:
          false

      };

    }


    const forecastExists =
      resolverResult
        .productionForecastExists ===
      true;


    const province =
      normalize83BGate(
        resolverResult
          .productionProvince
      ) || null;


    const selectedMatchesProduction =
      resolverResult
        .selectedMatchesProduction ===
      true;


    return {

      forecastExists,

      province,

      selectedMatchesProduction

    };

  }


  /* =========================================================
     B8 VERIFIED RESOLVER VIEW
     ========================================================= */

  function inspectB8ResolverView83BGate(
    resolverResult,
    selectedProvince,
    resolvedScope
  ) {

    const resolverReady =
      Boolean(
        resolverResult &&
        resolverResult.ready === true
      );


    const resolverSource =
      resolverResult &&
      resolverResult.source
        ? String(
            resolverResult.source
          )
        : null;


    const sourceTrusted =
      resolverSource ===
      TRUSTED_B8_SOURCE;


    const singleResolvedProvince =
      resolvedScope.length === 1
        ? resolvedScope[0]
        : null;


    const selectedMatchesResolved =
      Boolean(
        selectedProvince &&
        singleResolvedProvince &&
        selectedProvince ===
          singleResolvedProvince
      );


    /*
     * IMPORTANT:
     *
     * We trust B8 only through the Scope Resolver's
     * explicit READY + SOURCE contract.
     *
     * We do NOT independently manufacture or infer
     * a B8 verified province here.
     */

    const verified =
      Boolean(
        resolverReady &&
        sourceTrusted &&
        selectedMatchesResolved
      );


    return {

      resolverReady,

      resolverSource,

      sourceTrusted,

      singleResolvedProvince,

      selectedMatchesResolved,

      verified

    };

  }


  /* =========================================================
     MAIN GATE
     ========================================================= */

  function inspectStep83BIntegrationGate03D59() {

    const selectedProvince =
      getSelectedProvince83BGate();


    const current83B =
      inspectCurrent83BGate();


    const resolverEnvelope =
      resolveScope83BGate();


    const resolverResult =
      resolverEnvelope.result;


    const resolvedScope =
      getResolvedScope83BGate(
        resolverResult
      );


    const production =
      getProductionView83BGate(
        resolverResult
      );


    const b8View =
      inspectB8ResolverView83BGate(
        resolverResult,
        selectedProvince,
        resolvedScope
      );


    /*
     * ---------------------------------------------------------
     * PRODUCTION PATH
     * ---------------------------------------------------------
     *
     * If Production Forecast exists, we preserve the stricter
     * Production comparison.
     */

    const resolvedToProduction =
      Boolean(
        production.province &&
        resolvedScope.length === 1 &&
        resolvedScope[0] ===
          production.province
      );


    const productionPathReady =
      Boolean(
        production.forecastExists &&
        production.province &&
        resolverResult &&
        resolverResult.ready === true &&
        resolvedToProduction
      );


    /*
     * ---------------------------------------------------------
     * B8 PRE-PRODUCTION PATH
     * ---------------------------------------------------------
     *
     * LAST_FORECAST is NOT required here.
     *
     * The selected province must have already passed the
     * Scope Resolver's B8 verified contract.
     */

    const b8PreProductionPathReady =
      Boolean(
        !production.forecastExists &&
        b8View.verified
      );


    /*
     * ---------------------------------------------------------
     * BOUNDARY READY
     * ---------------------------------------------------------
     *
     * This means ONLY:
     *
     * "The observed scope boundary is internally consistent
     *  enough for us to design/test a future integration patch."
     *
     * It NEVER means:
     * - write is authorized
     * - candidates may be changed
     * - STEP 8.3B may be rebuilt
     * - LAST_FORECAST may be modified
     */

    const boundaryReady =
      Boolean(
        resolverEnvelope.available &&
        !resolverEnvelope.error &&
        resolverResult &&
        resolvedScope.length === 1 &&
        (
          productionPathReady ||
          b8PreProductionPathReady
        )
      );


    const current83BMatchesResolved =
      Boolean(
        resolvedScope.length === 1 &&
        current83B.provinces.length === 1 &&
        current83B.provinces[0] ===
          resolvedScope[0]
      );


    const current83BContainsResolved =
      Boolean(
        resolvedScope.length === 1 &&
        current83B.provinces.includes(
          resolvedScope[0]
        )
      );


    const legacyDivergenceObserved =
      Boolean(
        current83B.exists &&
        current83B.carriesFullLegacyScope &&
        resolvedScope.length === 1 &&
        !current83BContainsResolved
      );


    const scopeWouldChange =
      Boolean(
        resolvedScope.length === 1 &&
        !current83BMatchesResolved
      );


    /*
     * ---------------------------------------------------------
     * FAIL-CLOSED REASON
     * ---------------------------------------------------------
     */

    let reason;


    if (
      !resolverEnvelope.available
    ) {

      reason =
        'RESOLVER_NOT_AVAILABLE';

    } else if (
      resolverEnvelope.error
    ) {

      reason =
        'RESOLVER_ERROR';

    } else if (
      !resolverResult
    ) {

      reason =
        'NO_RESOLVER_RESULT';

    } else if (
      resolverResult.ready !== true
    ) {

      reason =
        resolverResult.reason ||
        'RESOLVER_NOT_READY';

    } else if (
      resolvedScope.length !== 1
    ) {

      reason =
        'RESOLVED_SCOPE_NOT_SINGLE';

    } else if (
      production.forecastExists &&
      !production.province
    ) {

      reason =
        'NO_PRODUCTION_PROVINCE';

    } else if (
      production.forecastExists &&
      !resolvedToProduction
    ) {

      reason =
        'RESOLVED_SCOPE_PRODUCTION_MISMATCH';

    } else if (
      !production.forecastExists &&
      !b8View.sourceTrusted
    ) {

      reason =
        'B8_VERIFIED_SOURCE_REQUIRED';

    } else if (
      !production.forecastExists &&
      !b8View.selectedMatchesResolved
    ) {

      reason =
        'SELECTED_PROVINCE_RESOLVED_SCOPE_MISMATCH';

    } else if (
      !production.forecastExists &&
      !b8View.verified
    ) {

      reason =
        'B8_VERIFICATION_NOT_CONFIRMED';

    } else if (
      productionPathReady
    ) {

      reason =
        current83BMatchesResolved
          ? 'PRODUCTION_BOUNDARY_ALREADY_MATCHED'
          : 'PRODUCTION_BOUNDARY_READY';

    } else if (
      b8PreProductionPathReady
    ) {

      reason =
        current83BMatchesResolved
          ? 'B8_BOUNDARY_ALREADY_MATCHED'
          : 'B8_PREPRODUCTION_BOUNDARY_READY';

    } else {

      reason =
        'BOUNDARY_NOT_READY';

    }


    const result = {

      version:
        VERSION,

      timestamp:
        new Date()
          .toISOString(),

      selectedProvince,

      production: {

        forecastExists:
          production.forecastExists,

        province:
          production.province,

        selectedMatchesProduction:
          production
            .selectedMatchesProduction,

        pathReady:
          productionPathReady

      },

      resolver: {

        available:
          resolverEnvelope.available,

        error:
          resolverEnvelope.error,

        version:
          resolverResult &&
          resolverResult.version
            ? resolverResult.version
            : null,

        ready:
          Boolean(
            resolverResult &&
            resolverResult.ready === true
          ),

        source:
          resolverResult &&
          resolverResult.source
            ? resolverResult.source
            : null,

        reason:
          resolverResult &&
          resolverResult.reason
            ? resolverResult.reason
            : null,

        resolvedScope:
          resolvedScope.slice()

      },

      b8Path: {

        trustedSource:
          TRUSTED_B8_SOURCE,

        resolverSource:
          b8View.resolverSource,

        sourceTrusted:
          b8View.sourceTrusted,

        selectedProvince,

        resolvedProvince:
          b8View.singleResolvedProvince,

        selectedMatchesResolved:
          b8View.selectedMatchesResolved,

        verified:
          b8View.verified,

        preProductionPathReady:
          b8PreProductionPathReady

      },

      current83B,

      comparison: {

        current83BMatchesResolved,

        current83BContainsResolved,

        legacyDivergenceObserved,

        scopeWouldChange

      },

      gate: {

        boundaryReady,

        reason,

        /*
         * Explicitly FALSE.
         *
         * boundaryReady is diagnostic readiness only.
         */

        integrationExecuted:
          false,

        writeAuthorized:
          false

      },

      safety: {

        readOnly:
          true,

        boundaryOnly:
          true,

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

        candidatesModified:
          false,

        step83BModified:
          false

      }

    };


    /*
     * RAM DIAGNOSTIC RESULT ONLY.
     *
     * This is the ONLY assignment performed by this module.
     *
     * It does NOT modify:
     * - LAST_FORECAST
     * - STEP 8.3B
     * - candidates
     * - localStorage
     * - Production Forecast
     */

    window
      .LAST_FIX03D59_STEP83B_INTEGRATION_GATE =
      result;


    return result;

  }


  /* =========================================================
     CONSOLE PRINT
     ========================================================= */

  function printStep83BIntegrationGate03D59() {

    const result =
      inspectStep83BIntegrationGate03D59();


    console.log(
      '=========================================='
    );

    console.log(
      'FIX-03D5.9 STEP 8.3B INTEGRATION GATE V3-B8PATH'
    );

    console.log(
      'READ ONLY · ZERO WRITE · BOUNDARY ONLY'
    );

    console.log(
      '=========================================='
    );


    console.log(
      'Selected Province:',
      result.selectedProvince
    );


    console.log(
      'Production Forecast Exists:',
      result.production
        .forecastExists
    );


    console.log(
      'Production Province:',
      result.production
        .province
    );


    console.log(
      'Resolver Version:',
      result.resolver.version
    );


    console.log(
      'Resolver Source:',
      result.resolver.source
    );


    console.log(
      'Resolved Scope:',
      result.resolver
        .resolvedScope
    );


    console.log(
      'B8 Source Trusted:',
      result.b8Path
        .sourceTrusted
    );


    console.log(
      'B8 Verified:',
      result.b8Path
        .verified
    );


    console.log(
      'B8 Pre-Production Path Ready:',
      result.b8Path
        .preProductionPathReady
    );


    console.log(
      'Boundary Ready:',
      result.gate
        .boundaryReady
    );


    console.log(
      'Reason:',
      result.gate.reason
    );


    console.log(
      'Write Authorized:',
      result.gate
        .writeAuthorized
    );


    console.log(
      'Safety:',
      result.safety
    );


    return result;

  }


  /* =========================================================
     PUBLIC READ-ONLY API
     ========================================================= */

  window
    .inspectStep83BIntegrationGate03D59 =
    inspectStep83BIntegrationGate03D59;


  window
    .printStep83BIntegrationGate03D59 =
    printStep83BIntegrationGate03D59;


  window
    .FIX03D59_STEP83B_INTEGRATION_GATE_LOADED =
    true;


  console.log(
    '🛡️ FIX-03D5.9 STEP 8.3B Integration Gate V3-B8PATH loaded / READ ONLY / ZERO WRITE / BOUNDARY ONLY / FAIL CLOSED'
  );

})();
