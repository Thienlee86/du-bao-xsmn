/* =========================================================================
   FIX-03D5.9 — STEP 8.3B INTEGRATION GATE V1
   FILE:
   modules/fix03d59-83b-integration-gate.js

   PURPOSE:
   - Validate the boundary between Production Forecast,
     STEP 8.3B Scope Resolver, and current STEP 8.3B.
   - Confirm the resolver produces the current Production province.
   - Preserve the existing STEP 8.3B candidates for comparison only.
   - Determine whether STEP 8.3B is ready for a future integration patch.

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
    '83B-INTEGRATION-GATE-V1';


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
     PRODUCTION FORECAST
     ========================================================= */

  function getProductionForecast83BGate() {

    try {

      return (
        window.LAST_FORECAST ||
        null
      );

    } catch (error) {

      return null;

    }

  }


  function getProductionProvince83BGate(
    envelope
  ) {

    if (!envelope) {

      return null;

    }


    /*
     * Current Production schema.
     */

    try {

      if (
        envelope.forecast &&
        envelope.forecast.province
      ) {

        return normalize83BGate(
          envelope.forecast.province
        );

      }

    } catch (error) {

      // FAIL CLOSED
    }


    /*
     * Defensive fallback only.
     */

    try {

      if (envelope.province) {

        return normalize83BGate(
          envelope.province
        );

      }

    } catch (error) {

      // FAIL CLOSED
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
        legacyMatches.length ===
        LEGACY_PROVINCES.length

    };

  }


  /* =========================================================
     RESOLVER
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


    /*
     * Support a single province or array
     * without changing resolver output.
     */

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

          return [normalized];

        }

      }

    }


    return [];

  }


  /* =========================================================
     MAIN GATE
     ========================================================= */

  function inspectStep83BIntegrationGate03D59() {

    const productionForecast =
      getProductionForecast83BGate();


    const productionProvince =
      getProductionProvince83BGate(
        productionForecast
      );


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


    /*
     * FUTURE INTEGRATION MAY PROCEED ONLY WHEN:
     *
     * 1. Production Forecast exists.
     * 2. Production province is observable.
     * 3. Resolver exists.
     * 4. Resolver says ready.
     * 5. Resolver resolves exactly one province.
     * 6. That province equals Production province.
     * 7. Current 8.3B exists.
     *
     * This gate DOES NOT perform that integration.
     */

    const integrationReady =
      Boolean(
        productionForecast &&
        productionProvince &&
        resolverEnvelope.available &&
        !resolverEnvelope.error &&
        resolverReady &&
        resolvedToProduction &&
        current83B.exists
      );


    let reason;


    if (!productionForecast) {

      reason =
        'NO_PRODUCTION_FORECAST';

    } else if (!productionProvince) {

      reason =
        'NO_PRODUCTION_PROVINCE';

    } else if (
      !resolverEnvelope.available
    ) {

      reason =
        'RESOLVER_NOT_AVAILABLE';

    } else if (
      resolverEnvelope.error
    ) {

      reason =
        'RESOLVER_ERROR';

    } else if (!resolverReady) {

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

    } else if (!current83B.exists) {

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
          Boolean(
            productionForecast
          ),

        province:
          productionProvince

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

        scopeWouldChange:
          Boolean(
            productionProvince &&
            !current83BMatchesProduction
          )

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
     * This does not modify Production Forecast,
     * STEP 8.3B, candidates, or storage.
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
    'FIX-03D5.9 STEP 8.3B Integration Gate V1 loaded / READ ONLY / ZERO WRITE / FAIL CLOSED'
  );

})();
