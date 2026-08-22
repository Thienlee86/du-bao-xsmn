/* =========================================================================
   FIX-03D5.9 — STEP 8.3B SCOPE RESOLVER V2
   FILE:
   modules/fix-03d5-9-83b-scope-resolver.js

   PURPOSE:
   - Resolve intended province scope for STEP 8.3B.
   - Read confirmed B8 verified runtime scope.
   - Compare B8 verified scope with Production / selected province.
   - Produce READ-ONLY scope preview for later integration.
   - Do NOT modify STEP 8.3B.
   - Do NOT modify candidates.
   - Do NOT execute forecast/certification engines.

   CONFIRMED B8 PATH:
   window
     .LAST_V26_B8_STARTUP_VERIFY
     ?.verification
     ?.guard
     ?.lifecycle
     ?.verifiedDetails

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


  const VERSION =
    '83B-SCOPE-RESOLVER-V2-B8PATH';


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

  function normalizeProvince83BScope(
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


  function uniqueProvinceScope83B(
    values
  ) {

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

      return (
        normalizeProvince83BScope(
          envelope.forecast.province
        ) ||
        null
      );

    }


    /*
     * Defensive fallback only.
     */

    if (
      envelope.province
    ) {

      return (
        normalizeProvince83BScope(
          envelope.province
        ) ||
        null
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

        return (
          normalizeProvince83BScope(
            select.value
          ) ||
          null
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

        return (
          normalizeProvince83BScope(
            SELECTED_PROVINCE
          ) ||
          null
        );

      }

    } catch (error) {

      // READ ONLY

    }


    return null;

  }


  /*
   * =========================================================
   * VERIFIED B8 RUNTIME SCOPE
   * =========================================================
   *
   * Confirmed by B8PATH diagnostic.
   *
   * Source:
   *
   * LAST_V26_B8_STARTUP_VERIFY
   *   .verification
   *   .guard
   *   .lifecycle
   *   .verifiedDetails
   *
   * IMPORTANT:
   * This function only READS the existing B8 result.
   * It does not run B8 verification.
   * It does not modify B8.
   * =========================================================
   */

  function getVerifiedB8Scope83BScope() {

    let verifiedDetails = null;


    try {

      verifiedDetails =
        window
          .LAST_V26_B8_STARTUP_VERIFY
          ?.verification
          ?.guard
          ?.lifecycle
          ?.verifiedDetails ||
        null;

    } catch (error) {

      verifiedDetails = null;

    }


    if (
      !Array.isArray(
        verifiedDetails
      )
    ) {

      return {

        exists: false,

        recordCount: 0,

        provinceCount: 0,

        provinces: []

      };

    }


    const provinces =
      uniqueProvinceScope83B(
        verifiedDetails.map(
          item => {

            if (
              !item ||
              typeof item !==
                'object'
            ) {

              return null;

            }


            return (
              item.province ||
              null
            );

          }
        )
      );


    return {

      exists: true,

      recordCount:
        verifiedDetails.length,

      provinceCount:
        provinces.length,

      provinces:
        provinces.slice()

    };

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

      provinces:
        provinces.slice()

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


    const verifiedB8 =
      getVerifiedB8Scope83BScope();


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


    const b8MatchesLegacyScope =
      (
        verifiedB8.provinces.length ===
          LEGACY_SCOPE_83B.length
      ) &&
      LEGACY_SCOPE_83B.every(
        province =>
          verifiedB8
            .provinces
            .includes(
              province
            )
      );


    const selectedInB8Scope =
      Boolean(
        selectedProvince &&
        verifiedB8
          .provinces
          .includes(
            selectedProvince
          )
      );


    const productionInB8Scope =
      Boolean(
        productionProvince &&
        verifiedB8
          .provinces
          .includes(
            productionProvince
          )
      );


    /*
     * ---------------------------------------------------------
     * FAIL-CLOSED RESOLUTION
     * ---------------------------------------------------------
     *
     * Priority:
     *
     * 1. Production + selected agree.
     *
     * 2. Production exists and is confirmed by B8.
     *
     * 3. No Production Forecast, but selected province is
     *    already present in VERIFIED B8 runtime scope.
     *
     * 4. B8 verified scope exists, but selected province is
     *    outside it -> expose B8 scope as diagnostic only.
     *
     * 5. Selected province alone -> preview only.
     *
     * Nothing here authorizes Production write.
     * Nothing here modifies STEP 8.3B candidates.
     */


    let resolvedScope = [];

    let source = 'NONE';

    let ready = false;

    let reason =
      'NO_RUNTIME_PROVINCE_AVAILABLE';


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
      productionProvince &&
      productionInB8Scope
    ) {

      resolvedScope = [
        productionProvince
      ];


      source =
        'PRODUCTION_FORECAST_CONFIRMED_BY_B8';


      ready = true;


      reason =
        'PRODUCTION_PROVINCE_VERIFIED_IN_B8';

    } else if (
      productionProvince
    ) {

      /*
       * Production exists, but B8 does not confirm it.
       *
       * FAIL CLOSED:
       * observable, but not ready for integration.
       */

      resolvedScope = [
        productionProvince
      ];


      source =
        'PRODUCTION_FORECAST_UNCONFIRMED_BY_B8';


      ready = false;


      reason =
        'PRODUCTION_PROVINCE_NOT_VERIFIED_IN_B8';

    } else if (
      selectedProvince &&
      selectedInB8Scope
    ) {

      /*
       * Selected province has no current Production Forecast,
       * but B8 has actual verified historical records for it.
       *
       * This makes the scope usable as a READ-ONLY
       * integration preview.
       *
       * It does NOT authorize Production write.
       */

      resolvedScope = [
        selectedProvince
      ];


      source =
        'B8_VERIFIED_SELECTED_PROVINCE';


      ready = true;


      reason =
        'SELECTED_PROVINCE_CONFIRMED_BY_B8';

    } else if (
      verifiedB8.provinces.length > 0
    ) {

      /*
       * B8 scope is known, but selected province is not
       * currently represented in it.
       *
       * Expose B8 scope for diagnostics only.
       */

      resolvedScope =
        verifiedB8
          .provinces
          .slice();


      source =
        'B8_VERIFIED_SCOPE_PREVIEW_ONLY';


      ready = false;


      reason =
        selectedProvince
          ? 'SELECTED_PROVINCE_NOT_IN_B8_VERIFIED_SCOPE'
          : 'B8_SCOPE_AVAILABLE_NO_SELECTED_PROVINCE';

    } else if (
      selectedProvince
    ) {

      resolvedScope = [
        selectedProvince
      ];


      source =
        'SELECTED_PROVINCE_PREVIEW_ONLY';


      ready = false;


      reason =
        'NO_PRODUCTION_OR_B8_VERIFICATION';

    }


    const result = {

      version:
        VERSION,

      timestamp:
        new Date()
          .toISOString(),

      ready,

      reason,

      source,


      /*
       * Production state
       */

      productionForecastExists:
        Boolean(
          productionForecast
        ),

      productionProvince,


      /*
       * UI state
       */

      selectedProvince,

      selectedMatchesProduction:
        Boolean(
          productionProvince &&
          selectedProvince &&
          productionProvince ===
            selectedProvince
        ),


      /*
       * Confirmed B8 runtime state
       */

      verifiedB8: {

        exists:
          verifiedB8.exists,

        recordCount:
          verifiedB8.recordCount,

        provinceCount:
          verifiedB8.provinceCount,

        provinces:
          verifiedB8
            .provinces
            .slice(),

        selectedInScope:
          selectedInB8Scope,

        productionInScope:
          productionInB8Scope,

        matchesLegacyScope:
          b8MatchesLegacyScope

      },


      /*
       * Existing STEP 8.3B state
       */

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


      /*
       * Historical comparison only.
       */

      legacyScope:
        LEGACY_SCOPE_83B.slice(),

      legacyMatches,

      carriesFullLegacyScope,


      /*
       * Proposed READ-ONLY scope.
       */

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
          false,

        b8Modified:
          false

      }

    };


    /*
     * RAM diagnostic result only.
     *
     * NEW diagnostic alias.
     *
     * Does NOT modify:
     * - Production Forecast
     * - STEP 8.3B
     * - candidates
     * - B8 verification
     * - storage
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
      'FIX-03D5.9 STEP 8.3B SCOPE RESOLVER V2 B8PATH'
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
      'B8 Verified Records:',
      result.verifiedB8.recordCount
    );


    console.log(
      'B8 Verified Scope:',
      result.verifiedB8.provinces
    );


    console.log(
      'Selected In B8:',
      result.verifiedB8.selectedInScope
    );


    console.log(
      'Production In B8:',
      result.verifiedB8.productionInScope
    );


    console.log(
      'B8 Matches Legacy:',
      result.verifiedB8.matchesLegacyScope
    );


    console.log(
      'Current 8.3B Scope:',
      result.current83B.provinces
    );


    console.log(
      'Resolved Scope:',
      result.resolvedScope
    );


    console.log(
      'Source:',
      result.source
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

  window.getVerifiedB8Scope83BScope =
    getVerifiedB8Scope83BScope;


  window.resolveStep83BScope03D59 =
    resolveStep83BScope03D59;


  window.printStep83BScope03D59 =
    printStep83BScope03D59;


  window
    .FIX03D59_STEP83B_SCOPE_RESOLVER_LOADED =
    true;


  window
    .FIX03D59_STEP83B_SCOPE_RESOLVER_VERSION =
    VERSION;


  console.log(
    '🧭 FIX-03D5.9 STEP 8.3B Scope Resolver V2 B8PATH loaded / READ ONLY / ZERO WRITE'
  );

})();
