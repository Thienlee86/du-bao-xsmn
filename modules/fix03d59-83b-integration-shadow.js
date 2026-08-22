/* =========================================================================
   FIX-03D5.9 — STEP 8.3B INTEGRATION SHADOW V1
   FILE:
   modules/fix03d59-83b-integration-shadow.js

   PURPOSE:
   - Consume the verified STEP 8.3B scope resolver.
   - Build a READ-ONLY shadow representation of the future 8.3B scope.
   - Prove that legacy multi-province scope can be replaced by the
     B8 verified selected-province path without touching Production.

   IMPORTANT:
   - READ ONLY.
   - ZERO WRITE.
   - NO ENGINE EXECUTION.
   - Does NOT modify STEP 8.3B.
   - Does NOT modify STEP 8.3B candidates.
   - Does NOT modify LAST_FORECAST.
   - Does NOT call savePrediction().
   - Does NOT write storage.
   - Does NOT execute integration.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    '83B-INTEGRATION-SHADOW-V1-B8PATH';


  /* =========================================================
     HELPERS
     ========================================================= */

  function normalizeProvince83BShadow(
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


  function unique83BShadow(
    values
  ) {

    const output = [];


    (Array.isArray(values)
      ? values
      : []
    ).forEach(
      function (value) {

        const normalized =
          normalizeProvince83BShadow(
            value
          );


        if (
          normalized &&
          !output.includes(
            normalized
          )
        ) {

          output.push(
            normalized
          );

        }

      }
    );


    return output;

  }


  function clone83BShadow(
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


  /* =========================================================
     READ SELECTED PROVINCE
     ========================================================= */

  function getSelectedProvince83BShadow() {

    try {

      const select =
        document.getElementById(
          'provinceSelect'
        );


      if (
        select &&
        select.value
      ) {

        return normalizeProvince83BShadow(
          select.value
        );

      }

    } catch (error) {

      // FAIL CLOSED
    }


    try {

      if (
        typeof SELECTED_PROVINCE !==
          'undefined' &&
        SELECTED_PROVINCE
      ) {

        return normalizeProvince83BShadow(
          SELECTED_PROVINCE
        );

      }

    } catch (error) {

      // FAIL CLOSED
    }


    return null;

  }


  /* =========================================================
     READ RESOLVER
     ========================================================= */

  function readResolver83BShadow() {

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
          clone83BShadow(
            result
          ),

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
     EXTRACT RESOLVED SCOPE
     ========================================================= */

  function extractResolvedScope83BShadow(
    resolverResult
  ) {

    if (!resolverResult) {

      return null;

    }


    const possibleValues = [

      resolverResult.resolvedScope,

      resolverResult.resolvedProvince,

      resolverResult.province,

      resolverResult.scope

    ];


    for (
      const value
      of possibleValues
    ) {

      if (
        typeof value ===
          'string' &&
        value.trim()
      ) {

        return normalizeProvince83BShadow(
          value
        );

      }

    }


    if (
      Array.isArray(
        resolverResult.resolvedScope
      ) &&
      resolverResult
        .resolvedScope.length === 1
    ) {

      return normalizeProvince83BShadow(
        resolverResult
          .resolvedScope[0]
      );

    }


    return null;

  }


  /* =========================================================
     SOURCE TRUST
     ========================================================= */

  function inspectSourceTrust83BShadow(
    resolverResult
  ) {

    const source =
      resolverResult &&
      resolverResult.source
        ? String(
            resolverResult.source
          )
        : null;


    const trusted =
      source ===
        'B8_VERIFIED_SELECTED_PROVINCE';


    return {

      source:
        source,

      expectedSource:
        'B8_VERIFIED_SELECTED_PROVINCE',

      trusted:
        trusted

    };

  }


  /* =========================================================
     BUILD SHADOW
     ========================================================= */

  function buildStep83BIntegrationShadow03D59() {

    const selectedProvince =
      getSelectedProvince83BShadow();


    const resolver =
      readResolver83BShadow();


    const resolverResult =
      resolver.result;


    const resolvedProvince =
      extractResolvedScope83BShadow(
        resolverResult
      );


    const sourceTrust =
      inspectSourceTrust83BShadow(
        resolverResult
      );


    const selectedMatchesResolved =
      Boolean(
        selectedProvince &&
        resolvedProvince &&
        selectedProvince ===
          resolvedProvince
      );


    const singleProvinceScope =
      unique83BShadow(
        resolvedProvince
          ? [
              resolvedProvince
            ]
          : []
      );


    const exactlyOneProvince =
      singleProvinceScope.length ===
        1;


    const b8Verified =
      Boolean(
        resolver.available &&
        resolver.ready &&
        sourceTrust.trusted &&
        selectedMatchesResolved &&
        exactlyOneProvince
      );


    /*
     * This is intentionally a SHADOW object only.
     *
     * It describes what the future STEP 8.3B scope
     * SHOULD be if integration is later authorized.
     *
     * It is NOT assigned to STEP 8.3B.
     */

    const shadow =
      {

        version:
          VERSION,

        mode:
          'READ_ONLY_SHADOW',

        selectedProvince:
          selectedProvince,

        resolvedProvince:
          resolvedProvince,

        candidateProvinces:
          singleProvinceScope,

        candidateCount:
          singleProvinceScope.length,

        source:
          sourceTrust.source,

        sourceTrusted:
          sourceTrust.trusted,

        selectedMatchesResolved:
          selectedMatchesResolved,

        exactlyOneProvince:
          exactlyOneProvince,

        b8Verified:
          b8Verified,

        ready:
          b8Verified,

        reason:
          b8Verified
            ? 'B8_VERIFIED_SHADOW_SCOPE_READY'
            : 'B8_VERIFIED_SHADOW_SCOPE_BLOCKED'

      };


    const result =
      {

        version:
          VERSION,

        resolver: {

          available:
            resolver.available,

          ready:
            resolver.ready,

          error:
            resolver.error,

          source:
            sourceTrust.source,

          sourceTrusted:
            sourceTrust.trusted

        },

        selected: {

          province:
            selectedProvince

        },

        resolved: {

          province:
            resolvedProvince,

          matchesSelected:
            selectedMatchesResolved

        },

        shadow:
          shadow,

        gate: {

          shadowReady:
            shadow.ready,

          integrationAuthorized:
            false,

          productionWriteAuthorized:
            false,

          reason:
            shadow.reason

        },

        safety: {

          readOnly:
            true,

          shadowOnly:
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
            false

        }

      };


    /*
     * Diagnostic snapshot only.
     *
     * No Production object is changed.
     */

    window
      .LAST_FIX03D59_STEP83B_INTEGRATION_SHADOW =
      clone83BShadow(
        result
      );


    return result;

  }


  /* =========================================================
     PUBLIC API
     ========================================================= */

  window
    .buildStep83BIntegrationShadow03D59 =
    buildStep83BIntegrationShadow03D59;


  window
    .inspectStep83BIntegrationShadow03D59 =
    buildStep83BIntegrationShadow03D59;


  window
    .FIX03D59_STEP83B_INTEGRATION_SHADOW_LOADED =
    true;


  window
    .FIX03D59_STEP83B_INTEGRATION_SHADOW_VERSION =
    VERSION;


  console.log(
    'FIX-03D5.9 STEP 8.3B Integration Shadow V1 B8PATH loaded / READ ONLY / ZERO PRODUCTION WRITE'
  );

})();
