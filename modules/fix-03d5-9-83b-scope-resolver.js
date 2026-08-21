/* =========================================================================
   FIX-03D5.9 — STEP 8.3B SCOPE RESOLVER V1
   FILE:
   modules/fix-03d5-9-83b-scope-resolver.js

   PURPOSE:
   - Resolve the intended province scope for STEP 8.3B.
   - Compare current Production Forecast province with legacy/test scope.
   - Produce a READ-ONLY scope preview for later integration.
   - Do NOT modify STEP 8.3B.
   - Do NOT modify candidates.
   - Do NOT execute forecast/certification engines.

   IMPORTANT:
   - READ ONLY
   - ZERO WRITE TO PRODUCTION
   - ZERO STORAGE WRITE
   - NO ENGINE EXECUTION
   - NO savePrediction()
   - NO LAST_FORECAST MODIFICATION
   - FAIL CLOSED
   ========================================================================= */

(function () {

  'use strict';


  const LEGACY_SCOPE_83B = [
    'tp-hcm',
    'tay-ninh',
    'tien-giang',
    'binh-duong'
  ];


  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

  function normalizeProvince83BScope(value) {

    return String(
      value == null
        ? ''
        : value
    )
      .trim()
      .toLowerCase();

  }


  function uniqueProvinceScope83B(values) {

    return Array.from(
      new Set(
        (values || [])
          .map(
            normalizeProvince83BScope
          )
          .filter(Boolean)
      )
    );

  }


  /*
   * =========================================================
   * PRODUCTION FORECAST
   * =========================================================
   */

  function getProductionForecast83BScope() {

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


  function getProductionProvince83BScope(
    envelope
  ) {

    if (!envelope) {

      return null;

    }


    /*
     * Current observed Production schema:
     *
     * LAST_FORECAST.forecast.province
     */

    if (
      envelope.forecast &&
      envelope.forecast.province
    ) {

      return normalizeProvince83BScope(
        envelope.forecast.province
      );

    }


    /*
     * Defensive fallback only.
     */

    if (
      envelope.province
    ) {

      return normalizeProvince83BScope(
        envelope.province
      );

    }


    return null;

  }


  /*
   * =========================================================
   * SELECTED PROVINCE
   * =========================================================
   */

  function getSelectedProvince83BScope() {

    try {

      const select =
        document.getElementById(
          'provinceSelect'
        );


      if (
        select &&
        select.value
      ) {

        return normalizeProvince83BScope(
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

        return normalizeProvince83BScope(
          SELECTED_PROVINCE
        );

      }

    } catch (error) {

      // READ ONLY

    }


    return null;

  }


  /*
   * =========================================================
   * CURRENT STEP 8.3B SCOPE
   * =========================================================
   */

  function getCurrent83BScope() {

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

        candidateCount: 0,

        provinces: []

      };

    }


    const candidates =
      Array.isArray(
        result.candidates
      )
        ? result.candidates
        : [];


    const provinces =
      uniqueProvinceScope83B(
        candidates.map(
          item => {

            if (!item) {

              return null;

            }


            return (
              item.province ||
              item.provinceSlug ||
              null
            );

          }
        )
      );


    return {

      exists: true,

      candidateCount:
        candidates.length,

      provinces

    };

  }


  /*
   * =========================================================
   * RESOLVE READ-ONLY SCOPE
   * =========================================================
   */

  function resolveStep83BScope03D59() {

    const productionForecast =
      getProductionForecast83BScope();


    const productionProvince =
      getProductionProvince83BScope(
        productionForecast
      );


    const selectedProvince =
      getSelectedProvince83BScope();


    const current83B =
      getCurrent83BScope();


    const legacyMatches =
      LEGACY_SCOPE_83B.filter(
        province =>
          current83B
            .provinces
            .includes(
              province
            )
      );


    const carriesFullLegacyScope =
      LEGACY_SCOPE_83B.every(
        province =>
          current83B
            .provinces
            .includes(
              province
            )
      );


    /*
     * ---------------------------------------------------------
     * FAIL-CLOSED RESOLUTION
     * ---------------------------------------------------------
     *
     * We do NOT manufacture 21 provinces here.
     *
     * V1 only proves that runtime Production province can be
     * resolved independently from the legacy 8.3B test scope.
     */

    let resolvedScope = [];

    let source = null;

    let ready = false;

    let reason = null;


    if (
      productionProvince &&
      selectedProvince &&
      productionProvince ===
        selectedProvince
    ) {

      resolvedScope = [
        productionProvince
      ];


      source =
        'PRODUCTION_FORECAST_MATCHED_SELECTED_PROVINCE';


      ready = true;


      reason =
        'CURRENT_PRODUCTION_PROVINCE_RESOLVED';

    } else if (
      productionProvince
    ) {

      resolvedScope = [
        productionProvince
      ];


      source =
        'PRODUCTION_FORECAST';


      ready = true;


      reason =
        'PRODUCTION_PROVINCE_RESOLVED_SELECTED_MISMATCH';

    } else if (
      selectedProvince
    ) {

      /*
       * Selected province is observable,
       * but without Production Forecast this is NOT
       * authorized for future Production integration.
       */

      resolvedScope = [
        selectedProvince
      ];


      source =
        'SELECTED_PROVINCE_PREVIEW_ONLY';


      ready = false;


      reason =
        'NO_PRODUCTION_FORECAST';

    } else {

      resolvedScope = [];


      source =
        'NONE';


      ready = false;


      reason =
        'NO_RUNTIME_PROVINCE_AVAILABLE';

    }


    const result = {

      version:
        '83B-SCOPE-RESOLVER-V1',

      timestamp:
        new Date()
          .toISOString(),

      ready,

      reason,

      source,

      productionForecastExists:
        Boolean(
          productionForecast
        ),

      productionProvince,

      selectedProvince,

      selectedMatchesProduction:
        Boolean(
          productionProvince &&
          selectedProvince &&
          productionProvince ===
            selectedProvince
        ),

      current83B: {

        exists:
          current83B.exists,

        candidateCount:
          current83B.candidateCount,

        provinces:
          current83B
            .provinces
            .slice()

      },

      legacyScope:
        LEGACY_SCOPE_83B.slice(),

      legacyMatches,

      carriesFullLegacyScope,

      resolvedScope:
        resolvedScope.slice(),

      scopeChanged:
        JSON.stringify(
          current83B.provinces
        ) !==
        JSON.stringify(
          resolvedScope
        ),

      /*
       * Explicit safety contract.
       */

      safety: {

        readOnly:
          true,

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
     * RAM diagnostic result only.
     *
     * This does NOT modify Production Forecast,
     * STEP 8.3B candidates or storage.
     */

    window
      .LAST_FIX03D59_STEP83B_SCOPE_RESOLUTION =
      result;


    return result;

  }


  /*
   * =========================================================
   * CONSOLE PRINT
   * =========================================================
   */

  function printStep83BScope03D59() {

    const result =
      resolveStep83BScope03D59();


    console.log(
      '=========================================='
    );

    console.log(
      'FIX-03D5.9 STEP 8.3B SCOPE RESOLVER V1'
    );

    console.log(
      'READ ONLY · ZERO PRODUCTION WRITE'
    );

    console.log(
      '=========================================='
    );

    console.log(
      'Production Province:',
      result.productionProvince
    );

    console.log(
      'Selected Province:',
      result.selectedProvince
    );

    console.log(
      'Current 8.3B Scope:',
      result.current83B.provinces
    );

    console.log(
      'Legacy Scope:',
      result.legacyScope
    );

    console.log(
      'Resolved Scope:',
      result.resolvedScope
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


  /*
   * =========================================================
   * PUBLIC READ-ONLY API
   * =========================================================
   */

  window.resolveStep83BScope03D59 =
    resolveStep83BScope03D59;


  window.printStep83BScope03D59 =
    printStep83BScope03D59;


  window.FIX03D59_STEP83B_SCOPE_RESOLVER_LOADED =
    true;


  console.log(
    '🧭 FIX-03D5.9 STEP 8.3B Scope Resolver V1 loaded / READ ONLY / ZERO WRITE'
  );

})();

