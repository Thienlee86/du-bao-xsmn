/* =========================================================================
   FIX-03D5.9 — STEP 8.3B INTEGRATION GATE V2
   FILE:
   modules/fix03d59-83b-integration-gate.js

   PURPOSE:
   - Validate the boundary between Production Forecast,
     STEP 8.3B Scope Resolver, and current STEP 8.3B.
   - Use STEP 8.3B Scope Resolver as the canonical observable
     source for the current Production province.
   - Preserve current STEP 8.3B candidates for comparison only.
   - Determine whether STEP 8.3B is ready for a future
     integration patch.

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
    '83B-INTEGRATION-GATE-V2';


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
          .map(normalize83BGate)
          .filter(Boolean)
      )
    );

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
        legacyMatches.length ===
        LEGACY_PROVINCES.length

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

      if (Array.isArray(value)) {

        const normalized =
          unique83BGate(value);


        if (normalized.length) {

          return normalized;

        }

      }


      if (
        typeof value === 'string' ||
        typeof value === 'number'
      ) {

        const normalized =
          normalize83BGate(value);


        if (normalized) {

          return [
            normalized
          ];

        }

      }

    }


    return [];

  }


  /* =========================================================
     CANONICAL PRODUCTION VIEW
     ========================================================= */

  function getCanonicalProduction83BGate(
    resolverResult
  ) {

    if (!resolverResult) {

      return {

        forecastExists: false,

        province: null,

        source: null,

        trusted: false

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


    const source =
      resolverResult.source ||
      null;


    /*
     * Fail closed:
     *
     * Production is trusted only when the resolver
     * explicitly observed a Production Forecast AND
     * explicitly resolved its province.
     */

    const trusted =
      Boolean(
        forecastExists &&
        province
      );


    return {

      forecastExists,

      province,

      source,

      trusted

    };

  }


  /* =========================================================
     MAIN GATE
     ========================================================= */

  function inspectStep83BIntegrationGate03D59() {

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


    const canonicalProduction =
      getCanonicalProduction83BGate(
        resolverResult
      );


    const productionForecastExists =
      canonicalProduction
        .forecastExists;


    const productionProvince =
      canonicalProduction
        .province;


    const resolverReady =
      Boolean(
        resolverResult &&
        resolverResult.ready === true
      );


    const resolvedToProduction =
      Boolean(
        productionProvince &&
        resolvedScope.length === 1 &&
        resolvedScope[0] ===
          productionProvince
      );


    const current83BMatchesProduction =
      Boolean(
        productionProvince &&
        current83B.provinces.length === 1 &&
        current83B.provinces[0] ===
          productionProvince
      );


    const legacyDivergenceConfirmed =
      Boolean(
        current83B.exists &&
        current83B.carriesFullLegacyScope &&
        productionProvince &&
        !current83B.provinces.includes(
          productionProvince
        )
      );


    const scopeWouldChange =
      Boolean(
        productionProvince &&
        !current83BMatchesProduction
      );


    /*
     * FUTURE INTEGRATION MAY PROCEED ONLY WHEN:
     *
     * 1. Resolver exists.
     * 2. Resolver executes without error.
     * 3. Resolver explicitly observed Production Forecast.
     * 4. Production province is observable.
     * 5. Resolver says ready.
     * 6. Resolver resolves exactly one province.
     * 7. Resolved province equals Production province.
     * 8. Current STEP 8.3B exists.
     *
     * This gate DOES NOT perform integration.
     */

    const integrationReady =
      Boolean(
        resolverEnvelope.available &&
        !resolverEnvelope.error &&
        productionForecastExists &&
        productionProvince &&
        canonicalProduction.trusted &&
        resolverReady &&
        resolvedScope.length === 1 &&
        resolvedToProduction &&
        current83B.exists
      );


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
      !productionForecastExists
    ) {

      reason =
        'NO_PRODUCTION_FORECAST';

    } else if (
      !productionProvince
    ) {

      reason =
        'NO_PRODUCTION_PROVINCE';

    } else if (
      !canonicalProduction.trusted
    ) {

      reason =
        'PRODUCTION_VIEW_NOT_TRUSTED';

    } else if (
      !resolverReady
    ) {

      reason =
        'RESOLVER_NOT_READY';

    } else if (
      resolvedScope.length !== 1
    ) {

      reason =
        'RESOLVED_SCOPE_NOT_SINGLE';

    } else if (
      !resolvedToProduction
    ) {

      reason =
        'RESOLVED_SCOPE_MISMATCH';

    } else if (
      !current83B.exists
    ) {

      reason =
        'STEP83B_NOT_AVAILABLE';

    } else if (
      current83BMatchesProduction
    ) {

      reason =
        'STEP83B_ALREADY_MATCHES_PRODUCTION';

    } else if (
      legacyDivergenceConfirmed
    ) {

      reason =
        'LEGACY_83B_DIVERGENCE_CONFIRMED';

    } else {

      reason =
        'INTEGRATION_BOUNDARY_READY';

    }


    const result = {

      version:
        VERSION,

      timestamp:
        new Date()
          .toISOString(),

      production: {

        forecastExists:
          productionForecastExists,

        province:
          productionProvince,

        trusted:
          canonicalProduction.trusted,

        observationSource:
          'STEP83B_SCOPE_RESOLVER',

        resolverSource:
          canonicalProduction.source

      },

      resolver: {

        available:
          resolverEnvelope.available,

        error:
          resolverEnvelope.error,

        ready:
          resolverReady,

        resolvedScope,

        resolvedToProduction,

        source:
          resolverResult &&
          resolverResult.source
            ? resolverResult.source
            : null,

        reason:
          resolverResult &&
          resolverResult.reason
            ? resolverResult.reason
            : null

      },

      current83B,

      comparison: {

        current83BMatchesProduction,

        legacyDivergenceConfirmed,

        scopeWouldChange

      },

      gate: {

        integrationReady,

        reason

      },

      safety: {

        readOnly: true,

        writeAuthorized: false,

        productionWrite: false,

        storageWrite: false,

        engineExecuted: false,

        savePredictionCalled: false,

        lastForecastModified: false,

        candidatesModified: false

      }

    };


    /*
     * Diagnostic RAM result only.
     *
     * Does NOT modify:
     * - Production Forecast
     * - STEP 8.3B
     * - candidates
     * - storage
     */

    window
      .LAST_FIX03D59_STEP83B_INTEGRATION_GATE =
      result;


    return result;

  }


  /* =========================================================
     PUBLIC API
     ========================================================= */

  window
    .inspectStep83BIntegrationGate03D59 =
    inspectStep83BIntegrationGate03D59;


  window
    .FIX03D59_STEP83B_INTEGRATION_GATE_LOADED =
    true;


  console.log(
    'FIX-03D5.9 STEP 8.3B Integration Gate V2 loaded / CANONICAL RESOLVER VIEW / READ ONLY / ZERO WRITE / FAIL CLOSED'
  );

})();

