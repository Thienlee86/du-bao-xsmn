/* =========================================================================
   FIX-03D5.9
   PRODUCTION SCOPE RESOLVER V1

   PURPOSE:
   - Resolve the certified production candidate that belongs to the
     CURRENT production forecast province.
   - Reuse the existing STEP 8.4F mapping preview result.
   - Convert the existing multi-province certification batch into
     the single-province scope required by LAST_FORECAST.
   - Do NOT modify app.js.
   - Do NOT rebuild the certification pipeline.
   - Do NOT modify source candidates.
   - Do NOT modify LAST_FORECAST.
   - Do NOT call savePrediction().
   - Do NOT write PREDICTIONS / localStorage.

   READ ONLY
   ZERO WRITE
   FAIL CLOSED
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_PRODUCTION_SCOPE_RESOLVER_V1';


  /*
   * =========================================================
   * 1. SAFE HELPERS
   * =========================================================
   */

  function normalizeProvince(
    value
  ) {

    return String(
      value == null
        ? ''
        : value
    )
      .trim()
      .toLowerCase();

  }


  function getCurrentForecast() {

    const lastForecast =
      window.LAST_FORECAST;


    if (
      !lastForecast ||
      typeof lastForecast !==
        'object'
    ) {

      return null;

    }


    const forecast =
      lastForecast.forecast;


    if (
      !forecast ||
      typeof forecast !==
        'object'
    ) {

      return null;

    }


    return forecast;

  }


  function getMappingPreview() {

    const preview =
      window
        .LAST_FIX03D59_STEP84F;


    if (
      !preview ||
      typeof preview !==
        'object'
    ) {

      return null;

    }


    return preview;

  }


  /*
   * =========================================================
   * 2. READ EXISTING 8.4F MAPPINGS
   * =========================================================
   */

  function getMappings(
    preview
  ) {

    if (!preview) {

      return [];

    }


    /*
     * Support the existing mapping containers
     * without changing STEP 8.4F.
     */

    const possibleSources = [

      preview.mappings,

      preview.items,

      preview.mappingPreview,

      preview.mappingItems

    ];


    for (
      const source of
      possibleSources
    ) {

      if (
        Array.isArray(
          source
        )
      ) {

        return source;

      }

    }


    return [];

  }


  /*
   * =========================================================
   * 3. RESOLVE CURRENT PRODUCTION PROVINCE
   * =========================================================
   */

  function resolveProductionScope() {

    const forecast =
      getCurrentForecast();


    /*
     * FAIL CLOSED:
     * Production forecast must already exist.
     */

    if (!forecast) {

      return {

        ready: false,

        passed: false,

        version:
          VERSION,

        reason:
          'PRODUCTION_FORECAST_NOT_AVAILABLE',

        readOnly:
          true,

        writeAuthorized:
          false

      };

    }


    const productionProvince =
      normalizeProvince(
        forecast.province
      );


    if (!productionProvince) {

      return {

        ready: false,

        passed: false,

        version:
          VERSION,

        reason:
          'PRODUCTION_FORECAST_PROVINCE_NOT_AVAILABLE',

        readOnly:
          true,

        writeAuthorized:
          false

      };

    }


    const preview =
      getMappingPreview();


    if (!preview) {

      return {

        ready: false,

        passed: false,

        version:
          VERSION,

        reason:
          'STEP84F_MAPPING_PREVIEW_NOT_AVAILABLE',

        productionProvince,

        readOnly:
          true,

        writeAuthorized:
          false

      };

    }


    const mappings =
      getMappings(
        preview
      );


    if (
      !mappings.length
    ) {

      return {

        ready: false,

        passed: false,

        version:
          VERSION,

        reason:
          'STEP84F_MAPPINGS_NOT_AVAILABLE',

        productionProvince,

        readOnly:
          true,

        writeAuthorized:
          false

      };

    }


    /*
     * =======================================================
     * IMPORTANT ARCHITECTURAL RULE
     *
     * 8.4F may contain certified mappings for several
     * provinces.
     *
     * Production forecast represents ONE province.
     *
     * Therefore resolve ONLY mappings belonging to the
     * current production province.
     * =======================================================
     */

    const matches =
      mappings.filter(
        function (
          mapping
        ) {

          return (
            normalizeProvince(
              mapping &&
              mapping.province
            ) ===
            productionProvince
          );

        }
      );


    /*
     * FAIL CLOSED:
     * Exactly ONE production candidate must resolve.
     */

    if (
      matches.length ===
      0
    ) {

      return {

        ready: false,

        passed: false,

        version:
          VERSION,

        reason:
          'PRODUCTION_SCOPE_NOT_FOUND',

        productionProvince,

        sourceMappingCount:
          mappings.length,

        matchedMappingCount:
          0,

        readOnly:
          true,

        writeAuthorized:
          false

      };

    }


    if (
      matches.length !==
      1
    ) {

      return {

        ready: false,

        passed: false,

        version:
          VERSION,

        reason:
          'PRODUCTION_SCOPE_NOT_UNIQUE',

        productionProvince,

        sourceMappingCount:
          mappings.length,

        matchedMappingCount:
          matches.length,

        readOnly:
          true,

        writeAuthorized:
          false

      };

    }


    const resolved =
      matches[0];


    /*
     * Existing 8.4F mapping itself must be valid.
     */

    const mappingValid =
      resolved.mappingValid ===
        true ||
      resolved.valid ===
        true;


    if (!mappingValid) {

      return {

        ready: false,

        passed: false,

        version:
          VERSION,

        reason:
          'PRODUCTION_SCOPE_MAPPING_INVALID',

        productionProvince,

        sourceMappingCount:
          mappings.length,

        matchedMappingCount:
          1,

        resolvedMapping:
          resolved,

        readOnly:
          true,

        writeAuthorized:
          false

      };

    }


    /*
     * =======================================================
     * SUCCESS
     * =======================================================
     */

    return {

      ready: true,

      passed: true,

      version:
        VERSION,

      reason:
        'PRODUCTION_SCOPE_RESOLVED',

      productionProvince,

      sourceMappingCount:
        mappings.length,

      matchedMappingCount:
        1,

      resolvedMapping:
        resolved,

      /*
       * Safety boundary
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

      lastForecastModified:
        false,

      sourceCandidatesModified:
        false,

      resolvedAt:
        new Date().toISOString()

    };

  }


  /*
   * =========================================================
   * 4. PUBLIC API
   * =========================================================
   */

  function inspectProductionScope() {

    const result =
      resolveProductionScope();


    /*
     * Diagnostic RAM only.
     *
     * NOT canonical state.
     * NOT production persistence.
     */

    window
      .LAST_FIX03D59_PRODUCTION_SCOPE_RESOLVER =
      result;


    return result;

  }


  window
    .resolveFix03D59ProductionScope =
    resolveProductionScope;


  window
    .inspectFix03D59ProductionScope =
    inspectProductionScope;


  window
    .FIX03D59_PRODUCTION_SCOPE_RESOLVER_VERSION =
    VERSION;


  window
    .FIX03D59_PRODUCTION_SCOPE_RESOLVER_LOADED =
    true;


  console.log(
    'FIX-03D5.9 Production Scope Resolver V1 loaded — READ ONLY / ZERO WRITE'
  );

})();
