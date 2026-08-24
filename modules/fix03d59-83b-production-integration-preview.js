/* =========================================================================
   FIX-03D5.9 — STEP 8.3B PRODUCTION INTEGRATION PREVIEW V1
   FILE:
   modules/fix03d59-83b-production-integration-preview.js

   PURPOSE:
   - Preview the future STEP 8.3B production scope integration.
   - Consume the existing STEP 8.3B Scope Resolver.
   - Require a valid Production Forecast path.
   - Reduce the legacy multi-province candidate scope to the
     resolved Production province.
   - Preserve the original candidate object without mutation.
   - Produce a READ-ONLY preview in RAM only.

   IMPORTANT:
   - READ ONLY.
   - ZERO PRODUCTION WRITE.
   - ZERO STORAGE WRITE.
   - NO ENGINE EXECUTION.
   - Does NOT modify LAST_FIX03D59_STEP83B_RESULT.
   - Does NOT modify STEP 8.3B candidates.
   - Does NOT modify LAST_FORECAST.
   - Does NOT call savePrediction().
   - FAIL CLOSED.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    '83B-PRODUCTION-INTEGRATION-PREVIEW-V1';


  /* =========================================================
     HELPERS
     ========================================================= */

  function normalizeProvince83BPreview(
    value
  ) {

    const normalized =
      String(
        value == null
          ? ''
          : value
      )
        .trim()
        .toLowerCase();


    if (
      !normalized ||
      normalized.length > 40
    ) {

      return '';

    }


    if (
      !/^[a-z0-9-]+$/.test(
        normalized
      )
    ) {

      return '';

    }


    return normalized;

  }


  function clone83BPreview(
    value
  ) {

    if (
      value === undefined
    ) {

      return undefined;

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


  function getCandidateProvince83BPreview(
    candidate
  ) {

    if (
      !candidate ||
      typeof candidate !==
        'object'
    ) {

      return null;

    }


    return (
      normalizeProvince83BPreview(
        candidate.province ||
        candidate.provinceSlug ||
        ''
      ) ||
      null
    );

  }


  /* =========================================================
     READ PRODUCTION FORECAST
     ========================================================= */

  function getProductionForecast83BPreview() {

    try {

      if (
        typeof LAST_FORECAST !==
          'undefined' &&
        LAST_FORECAST
      ) {

        return LAST_FORECAST;

      }

    } catch (error) {

      // Continue to window fallback.

    }


    try {

      return (
        window.LAST_FORECAST ||
        null
      );

    } catch (error) {

      return null;

    }

  }


  function getProductionProvince83BPreview(
    forecast
  ) {

    if (!forecast) {

      return null;

    }


    if (
      forecast.forecast &&
      forecast.forecast.province
    ) {

      return (
        normalizeProvince83BPreview(
          forecast.forecast.province
        ) ||
        null
      );

    }


    if (
      forecast.province
    ) {

      return (
        normalizeProvince83BPreview(
          forecast.province
        ) ||
        null
      );

    }


    return null;

  }


  /* =========================================================
     READ CURRENT STEP 8.3B
     ========================================================= */

  function readCurrent83BPreview() {

    let result = null;


    try {

      result =
        window
          .LAST_FIX03D59_STEP83B_RESULT ||
        null;

    } catch (error) {

      result = null;

    }


    if (!result) {

      return {

        exists: false,

        result: null,

        candidates: []

      };

    }


    const candidates =
      Array.isArray(
        result.candidates
      )
        ? result.candidates
        : [];


    return {

      exists: true,

      result:
        result,

      candidates:
        candidates

    };

  }


  /* =========================================================
     READ SCOPE RESOLVER
     ========================================================= */

  function readScopeResolver83BPreview() {

    if (
      typeof window
        .resolveStep83BScope03D59 !==
      'function'
    ) {

      return {

        available: false,

        ready: false,

        result: null,

        error:
          'STEP_83B_SCOPE_RESOLVER_NOT_AVAILABLE'

      };

    }


    try {

      const result =
        window
          .resolveStep83BScope03D59();


      if (!result) {

        return {

          available: true,

          ready: false,

          result: null,

          error:
            'STEP_83B_SCOPE_RESOLVER_EMPTY'

        };

      }


      return {

        available: true,

        ready:
          result.ready === true,

        result:
          result,

        error: null

      };

    } catch (error) {

      return {

        available: true,

        ready: false,

        result: null,

        error:
          error &&
          error.message
            ? error.message
            : String(error)

      };

    }

  }


  /* =========================================================
     BUILD PRODUCTION INTEGRATION PREVIEW
     ========================================================= */

  function buildStep83BProductionIntegrationPreview03D59() {

    const productionForecast =
      getProductionForecast83BPreview();


    const productionProvince =
      getProductionProvince83BPreview(
        productionForecast
      );


    const resolver =
      readScopeResolver83BPreview();


    const resolverResult =
      resolver.result;


    const resolvedScope =
      resolverResult &&
      Array.isArray(
        resolverResult.resolvedScope
      )
        ? resolverResult
            .resolvedScope
            .map(
              normalizeProvince83BPreview
            )
            .filter(Boolean)
        : [];


    const resolvedProvince =
      resolvedScope.length === 1
        ? resolvedScope[0]
        : null;


    const productionPathReady =
      Boolean(
        productionForecast &&
        productionProvince &&
        resolver.available &&
        resolver.ready &&
        resolvedProvince &&
        productionProvince ===
          resolvedProvince
      );


    const current83B =
      readCurrent83BPreview();


    const currentCandidates =
      current83B.candidates;


    const currentCandidateProvinces =
      currentCandidates
        .map(
          getCandidateProvince83BPreview
        )
        .filter(Boolean);


    /*
     * Locate the existing candidate belonging to the
     * resolved Production province.
     *
     * IMPORTANT:
     * We do NOT remove anything from the real candidates.
     * We only locate and clone the intended candidate.
     */

    const matchingCandidates =
      productionPathReady
        ? currentCandidates.filter(
            function (candidate) {

              return (
                getCandidateProvince83BPreview(
                  candidate
                ) ===
                resolvedProvince
              );

            }
          )
        : [];


    const exactlyOneMatchingCandidate =
      matchingCandidates.length === 1;


    const previewCandidates =
      exactlyOneMatchingCandidate
        ? [
            clone83BPreview(
              matchingCandidates[0]
            )
          ]
        : [];


    const previewCandidateProvinces =
      previewCandidates
        .map(
          getCandidateProvince83BPreview
        )
        .filter(Boolean);


    const candidateIdentityPreserved =
      Boolean(
        exactlyOneMatchingCandidate &&
        previewCandidates.length === 1 &&
        JSON.stringify(
          previewCandidates[0]
        ) ===
        JSON.stringify(
          matchingCandidates[0]
        )
      );


    const singleProvincePreview =
      Boolean(
        previewCandidateProvinces.length ===
          1 &&
        previewCandidateProvinces[0] ===
          resolvedProvince
      );


    const scopeReductionRequired =
      Boolean(
        currentCandidateProvinces.length !==
          previewCandidateProvinces.length ||
        JSON.stringify(
          currentCandidateProvinces
        ) !==
        JSON.stringify(
          previewCandidateProvinces
        )
      );


    const ready =
      Boolean(
        productionPathReady &&
        current83B.exists &&
        exactlyOneMatchingCandidate &&
        candidateIdentityPreserved &&
        singleProvincePreview
      );


    let reason =
      'PRODUCTION_INTEGRATION_PREVIEW_BLOCKED';


    if (!productionForecast) {

      reason =
        'PRODUCTION_FORECAST_NOT_AVAILABLE';

    } else if (!productionProvince) {

      reason =
        'PRODUCTION_PROVINCE_NOT_AVAILABLE';

    } else if (!resolver.available) {

      reason =
        'SCOPE_RESOLVER_NOT_AVAILABLE';

    } else if (!resolver.ready) {

      reason =
        'SCOPE_RESOLVER_NOT_READY';

    } else if (!resolvedProvince) {

      reason =
        'RESOLVED_SCOPE_NOT_SINGLE_PROVINCE';

    } else if (
      productionProvince !==
        resolvedProvince
    ) {

      reason =
        'PRODUCTION_RESOLVED_SCOPE_MISMATCH';

    } else if (!current83B.exists) {

      reason =
        'CURRENT_STEP_83B_NOT_AVAILABLE';

    } else if (
      matchingCandidates.length === 0
    ) {

      reason =
        'RESOLVED_PROVINCE_CANDIDATE_NOT_FOUND';

    } else if (
      matchingCandidates.length > 1
    ) {

      reason =
        'RESOLVED_PROVINCE_CANDIDATE_NOT_UNIQUE';

    } else if (
      !candidateIdentityPreserved
    ) {

      reason =
        'CANDIDATE_IDENTITY_NOT_PRESERVED';

    } else if (
      !singleProvincePreview
    ) {

      reason =
        'PREVIEW_SCOPE_NOT_SINGLE_PROVINCE';

    } else if (ready) {

      reason =
        'PRODUCTION_INTEGRATION_PREVIEW_READY';

    }


    const result = {

      version:
        VERSION,

      timestamp:
        new Date()
          .toISOString(),

      ready:
        ready,

      reason:
        reason,


      production: {

        forecastExists:
          Boolean(
            productionForecast
          ),

        province:
          productionProvince,

        pathReady:
          productionPathReady

      },


      resolver: {

        available:
          resolver.available,

        ready:
          resolver.ready,

        error:
          resolver.error,

        source:
          resolverResult
            ? resolverResult.source
            : null,

        reason:
          resolverResult
            ? resolverResult.reason
            : null,

        resolvedScope:
          resolvedScope.slice(),

        resolvedProvince:
          resolvedProvince

      },


      current83B: {

        exists:
          current83B.exists,

        candidateCount:
          currentCandidates.length,

        candidateProvinces:
          currentCandidateProvinces.slice()

      },


      preview: {

        candidateCount:
          previewCandidates.length,

        candidateProvinces:
          previewCandidateProvinces.slice(),

        candidates:
          previewCandidates,

        exactlyOneMatchingCandidate:
          exactlyOneMatchingCandidate,

        candidateIdentityPreserved:
          candidateIdentityPreserved,

        singleProvince:
          singleProvincePreview,

        scopeReductionRequired:
          scopeReductionRequired

      },


      gate: {

        previewReady:
          ready,

        integrationAuthorized:
          false,

        productionWriteAuthorized:
          false,

        reason:
          reason

      },


      safety: {

        readOnly:
          true,

        previewOnly:
          true,

        engineExecuted:
          false,

        integrationExecuted:
          false,

        writeAuthorized:
          false,

        productionWrite:
          false,

        storageWrite:
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
     * Diagnostic RAM snapshot only.
     *
     * This is a NEW object.
     *
     * It does NOT overwrite STEP 8.3B.
     */

    window
      .LAST_FIX03D59_STEP83B_PRODUCTION_INTEGRATION_PREVIEW =
      clone83BPreview(
        result
      );


    return result;

  }


  /* =========================================================
     CONSOLE PRINT
     ========================================================= */

  function printStep83BProductionIntegrationPreview03D59() {

    const result =
      buildStep83BProductionIntegrationPreview03D59();


    console.log(
      '=========================================='
    );

    console.log(
      'FIX-03D5.9 STEP 8.3B PRODUCTION INTEGRATION PREVIEW V1'
    );

    console.log(
      'READ ONLY · ZERO PRODUCTION WRITE'
    );

    console.log(
      '=========================================='
    );


    console.log(
      'Production:',
      result.production
    );


    console.log(
      'Resolver:',
      result.resolver
    );


    console.log(
      'Current STEP 8.3B:',
      result.current83B
    );


    console.log(
      'Preview:',
      result.preview
    );


    console.log(
      'Ready:',
      result.ready
    );


    console.log(
      'Reason:',
      result.reason
    );


    console.log(
      'Safety:',
      result.safety
    );


    return result;

  }


  /* =========================================================
     PUBLIC API
     ========================================================= */

  window
    .buildStep83BProductionIntegrationPreview03D59 =
    buildStep83BProductionIntegrationPreview03D59;


  window
    .inspectStep83BProductionIntegrationPreview03D59 =
    buildStep83BProductionIntegrationPreview03D59;


  window
    .printStep83BProductionIntegrationPreview03D59 =
    printStep83BProductionIntegrationPreview03D59;


  window
    .FIX03D59_STEP83B_PRODUCTION_INTEGRATION_PREVIEW_LOADED =
    true;


  window
    .FIX03D59_STEP83B_PRODUCTION_INTEGRATION_PREVIEW_VERSION =
    VERSION;


  console.log(
    '🧪 FIX-03D5.9 STEP 8.3B Production Integration Preview V1 loaded / READ ONLY / ZERO WRITE'
  );

})();
