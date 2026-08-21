/* =========================================================================
   FIX-03D5.9 — STEP 8.4F PRODUCTION PROVINCE SCOPE PREVIEW V1

   PURPOSE:
   - Read the existing STEP 8.4D Production Integration Boundary.
   - Read the current LAST_FORECAST.
   - Scope certified contract items to CURRENT Production Forecast province.
   - Preview the candidate -> production prize mapping.
   - Prove the province-scope fix before touching Production 8.4F.

   IMPORTANT:
   - Does NOT replace STEP 8.4F.
   - Does NOT modify STEP 8.4D.
   - Does NOT modify LAST_FORECAST.
   - Does NOT modify candidates.
   - Does NOT call savePrediction().
   - Does NOT write storage.

   READ ONLY
   ZERO WRITE
   FAIL CLOSED
   ========================================================================= */

(function () {

  'use strict';


  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

  function normalizeProvince84FScope(
    value
  ) {

    return String(
      value ?? ''
    )
      .trim()
      .toLowerCase();

  }


  function getProductionForecast84FScope() {

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


  function getProductionProvince84FScope(
    envelope
  ) {

    if (!envelope) {

      return null;

    }


    if (
      envelope.forecast &&
      envelope.forecast.province
    ) {

      return normalizeProvince84FScope(
        envelope.forecast.province
      );

    }


    if (
      envelope.province
    ) {

      return normalizeProvince84FScope(
        envelope.province
      );

    }


    return null;

  }


  /*
   * =========================================================
   * READ STEP 8.4D BOUNDARY
   * =========================================================
   */

  function getBoundary84FScope() {

    try {

      return (
        window.LAST_FIX03D59_STEP84D ||
        null
      );

    } catch (error) {

      return null;

    }

  }


  /*
   * =========================================================
   * BUILD READ-ONLY SCOPE PREVIEW
   * =========================================================
   */

  function inspectProductionScope84F() {

    const boundary =
      getBoundary84FScope();


    const envelope =
      getProductionForecast84FScope();


    const productionProvince =
      getProductionProvince84FScope(
        envelope
      );


    const boundaryExists =
      Boolean(boundary);


    const forecastExists =
      Boolean(envelope);


    const contractItems =
      (
        boundary &&
        Array.isArray(
          boundary.contractItems
        )
      )
        ? boundary.contractItems
        : [];


    /*
     * ---------------------------------------------------------
     * PRODUCTION PROVINCE FILTER
     * ---------------------------------------------------------
     */

    const productionContractItems =
      (
        productionProvince
      )
        ? contractItems.filter(
            function (candidate) {

              return (
                candidate &&
                normalizeProvince84FScope(
                  candidate.province
                ) ===
                  productionProvince
              );

            }
          )
        : [];


    const foreignContractItems =
      (
        productionProvince
      )
        ? contractItems.filter(
            function (candidate) {

              return (
                candidate &&
                normalizeProvince84FScope(
                  candidate.province
                ) !==
                  productionProvince
              );

            }
          )
        : contractItems.slice();


    /*
     * ---------------------------------------------------------
     * OBSERVABLE PRIZE KEYS
     * ---------------------------------------------------------
     *
     * Diagnostic only.
     * We do not modify forecast items.
     * ---------------------------------------------------------
     */

    const scopedCandidates =
      productionContractItems.map(
        function (candidate) {

          return {

            province:
              normalizeProvince84FScope(
                candidate?.province
              ),

            prizeKey:
              candidate?.prizeKey ??
              candidate?.giaiKey ??
              candidate?.prize ??
              null,

            candidate

          };

        }
      );


    const result = {

      version:
        '84F-PRODUCTION-SCOPE-V1',

      timestamp:
        new Date()
          .toISOString(),

      boundaryExists,

      forecastExists,

      productionProvince,

      totalContractCount:
        contractItems.length,

      productionContractCount:
        productionContractItems.length,

      foreignContractCount:
        foreignContractItems.length,

      productionContractItems,

      foreignContractItems,

      scopedCandidates,

      scopeReady:
        Boolean(
          boundaryExists &&
          forecastExists &&
          productionProvince &&
          productionContractItems.length > 0
        ),

      /*
       * Safety proof.
       */

      readOnly:
        true,

      writeAuthorized:
        false,

      productionWrite:
        false,

      storageWrite:
        false,

      savePredictionCalled:
        false,

      forecastModified:
        false,

      candidateModified:
        false

    };


    window
      .LAST_FIX03D59_STEP84F_SCOPE_PREVIEW =
      result;


    return result;

  }


  /*
   * =========================================================
   * PUBLIC READ-ONLY API
   * =========================================================
   */

  window.inspectProductionScope84F =
    inspectProductionScope84F;


  window.FIX03D59_STEP84F_SCOPE_LOADED =
    true;


  console.log(
    'FIX-03D5.9 STEP 8.4F Production Province Scope V1 loaded / READ ONLY / ZERO WRITE'
  );

})();

