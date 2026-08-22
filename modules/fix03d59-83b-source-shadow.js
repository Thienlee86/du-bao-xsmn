/* =========================================================================
   FIX-03D5.9 — STEP 8.3B SOURCE SHADOW

   PURPOSE:
   - Inspect whether B8 Verified Scope can safely feed the existing
     STEP 8.3 production candidate boundary engine.
   - Reuse the REAL buildProductionCandidateBoundaryV26() engine.
   - DO NOT replace or modify the existing STEP 8.3B runner.
   - DO NOT modify LAST_FIX03D59_STEP83B_RESULT.

   SAFETY:
   - MANUAL RUN ONLY
   - READ ONLY
   - ZERO WRITE
   - NO PRODUCTION WRITE
   - NO STORAGE WRITE
   - NO AUTO PROMOTION
   - NO savePrediction()
   - NO LAST_FORECAST modification
   ========================================================================= */

(function () {

  'use strict';


  function getVerifiedScope83BShadow() {

    /*
     * ---------------------------------------------------------
     * 1. RESOLVE B8 VERIFIED SCOPE
     * ---------------------------------------------------------
     */

    const candidates = [

      {
        name:
          'LAST_FIX03D59_STEP84FLH_B8_VERIFIED_SCOPE',

        value:
          window
            .LAST_FIX03D59_STEP84FLH_B8_VERIFIED_SCOPE
      },

      {
        name:
          'LAST_FIX03D59_B8_VERIFIED_SCOPE',

        value:
          window
            .LAST_FIX03D59_B8_VERIFIED_SCOPE
      },

      {
        name:
          'FIX03D59_B8_VERIFIED_SCOPE',

        value:
          window
            .FIX03D59_B8_VERIFIED_SCOPE
      }

    ];


    for (
      const candidate of
      candidates
    ) {

      if (
        candidate.value &&
        typeof candidate.value ===
          'object'
      ) {

        return {
          ready: true,
          sourceName:
            candidate.name,
          source:
            candidate.value
        };

      }

    }


    return {
      ready: false,
      sourceName:
        'NONE',
      source:
        null
    };

  }


  function build83BSourceShadow() {

    /*
     * ---------------------------------------------------------
     * 2. ENGINE MUST EXIST
     * ---------------------------------------------------------
     */

    if (
      typeof
        window
          .buildProductionCandidateBoundaryV26 !==
        'function' &&
      typeof
        buildProductionCandidateBoundaryV26 !==
        'function'
    ) {

      return {
        ready: false,
        passed: false,

        reason:
          'STEP_83_BOUNDARY_ENGINE_NOT_AVAILABLE',

        readOnly: true,
        productionWrite: false,
        storageWrite: false,
        promotionPerformed: false
      };

    }


    /*
     * ---------------------------------------------------------
     * 3. GET VERIFIED SCOPE
     * ---------------------------------------------------------
     */

    const resolved =
      getVerifiedScope83BShadow();


    if (
      resolved.ready !== true ||
      !resolved.source
    ) {

      return {
        ready: false,
        passed: false,

        reason:
          'B8_VERIFIED_SCOPE_NOT_AVAILABLE',

        sourceName:
          resolved.sourceName,

        readOnly: true,
        productionWrite: false,
        storageWrite: false,
        promotionPerformed: false
      };

    }


    const scope =
      resolved.source;


    /*
     * ---------------------------------------------------------
     * 4. NORMALIZE SHADOW SOURCE
     * ---------------------------------------------------------
     *
     * Existing 8.3 boundary expects the 8.2C contract:
     *
     * {
     *   ready: true,
     *   passed: true,
     *   eligible: [],
     *   ineligible: []
     * }
     *
     * This adapter exists ONLY IN RAM.
     * It does not modify B8 or 8.2C.
     * ---------------------------------------------------------
     */

    const rawCandidates =
      Array.isArray(
        scope.candidates
      )
        ? scope.candidates
        : (
            Array.isArray(
              scope.eligible
            )
              ? scope.eligible
              : []
          );


    const eligible =
      rawCandidates.map(
        function (
          item,
          index
        ) {

          const record =
            (
              item &&
              typeof item ===
                'object' &&
              item.record &&
              typeof item.record ===
                'object'
            )
              ? item.record
              : item;


          const canonicalIndex =
            Number.isInteger(
              item &&
              item.canonicalIndex
            )
              ? item.canonicalIndex
              : (
                  Number.isInteger(
                    item &&
                    item.index
                  )
                    ? item.index
                    : index
                );


          const province =
            item &&
            (
              item.province ||
              item.provinceSlug
            );


          const prize =
            item &&
            (
              item.prize ||
              item.prizeKey
            );


          return {

            index:
              canonicalIndex,

            province:
              province || null,

            prize:
              prize || null,

            record,

            eligible: true,

            source:
              'B8_VERIFIED_SCOPE_SHADOW',

            shadowOnly:
              true

          };

        }
      );


    const shadowSource = {

      ready: true,

      passed:
        eligible.length > 0,

      eligible,

      ineligible: [],

      source:
        'B8_VERIFIED_SCOPE_SHADOW',

      sourceName:
        resolved.sourceName,

      shadowOnly:
        true,

      readOnly:
        true

    };


    if (
      shadowSource.passed !== true
    ) {

      return {
        ready: true,
        passed: false,

        reason:
          'B8_VERIFIED_SCOPE_EMPTY',

        sourceName:
          resolved.sourceName,

        candidateCount: 0,

        shadowSource,

        boundaryResult:
          null,

        readOnly: true,
        productionWrite: false,
        storageWrite: false,
        promotionPerformed: false
      };

    }


    /*
     * ---------------------------------------------------------
     * 5. RUN REAL 8.3 BOUNDARY ENGINE AGAINST SHADOW SOURCE
     * ---------------------------------------------------------
     *
     * IMPORTANT:
     * We call ONLY the read-only boundary builder.
     *
     * We DO NOT call:
     * runFix03D59Step83BProductionCandidateBoundaryV26()
     *
     * Therefore the real:
     * LAST_FIX03D59_STEP83B_RESULT
     *
     * remains untouched.
     * ---------------------------------------------------------
     */

    let boundaryResult = null;


    try {

      boundaryResult =
        buildProductionCandidateBoundaryV26(
          shadowSource
        );

    } catch (error) {

      return {
        ready: true,
        passed: false,

        reason:
          'STEP_83_SHADOW_ENGINE_EXCEPTION',

        error:
          String(
            error &&
            error.message
              ? error.message
              : error
          ),

        sourceName:
          resolved.sourceName,

        shadowSource,

        boundaryResult:
          null,

        readOnly: true,
        productionWrite: false,
        storageWrite: false,
        promotionPerformed: false
      };

    }


    /*
     * ---------------------------------------------------------
     * 6. FINAL SHADOW VERDICT
     * ---------------------------------------------------------
     */

    const passed =
      Boolean(
        boundaryResult &&
        boundaryResult.ready === true &&
        boundaryResult.passed === true
      );


    return {

      ready: true,

      passed,

      reason:
        passed
          ? 'B8_TO_STEP83_BOUNDARY_SHADOW_VALID'
          : 'B8_TO_STEP83_BOUNDARY_SHADOW_INVALID',

      sourceName:
        resolved.sourceName,

      sourceCandidateCount:
        eligible.length,

      boundaryCandidateCount:
        boundaryResult &&
        boundaryResult.counts &&
        Number.isFinite(
          boundaryResult.counts.candidates
        )
          ? boundaryResult.counts.candidates
          : 0,

      shadowSource,

      boundaryResult,

      readOnly: true,

      canonicalWrite: false,
      productionWrite: false,
      storageWrite: false,
      promotionPerformed: false,
      autoPromotion: false

    };

  }


  /*
   * ---------------------------------------------------------
   * 7. MANUAL INSPECTOR
   * ---------------------------------------------------------
   */

  function inspect83BSourceShadow() {

    const result =
      build83BSourceShadow();


    window
      .LAST_FIX03D59_STEP83B_SOURCE_SHADOW =
        result;


    const yesNo =
      function (value) {

        return value === true
          ? 'YES ✅'
          : 'NO ❌';

      };


    const lines = [

      'FIX-03D5.9',
      'STEP 8.3B SOURCE SHADOW',
      '',

      'Ready: ' +
        yesNo(
          result.ready
        ),

      'Passed: ' +
        yesNo(
          result.passed
        ),

      'Reason:',
      result.reason ||
        'UNKNOWN',

      '',

      'Source:',
      result.sourceName ||
        'NONE',

      '',

      'Source Candidates: ' +
        (
          Number.isFinite(
            result.sourceCandidateCount
          )
            ? result.sourceCandidateCount
            : '-'
        ),

      'Boundary Candidates: ' +
        (
          Number.isFinite(
            result.boundaryCandidateCount
          )
            ? result.boundaryCandidateCount
            : '-'
        ),

      '',

      '====================',
      'SHADOW ONLY',
      'READ ONLY',
      'Canonical Write: NO',
      'Production Write: NO',
      'Storage Write: NO',
      'Promotion: NO'

    ];


    alert(
      lines.join('\n')
    );


    console.log(
      'FIX-03D5.9 STEP 8.3B SOURCE SHADOW',
      result
    );


    return result;

  }


  /*
   * ---------------------------------------------------------
   * 8. EXPORT
   * ---------------------------------------------------------
   */

  window
    .build83BSourceShadow =
      build83BSourceShadow;


  window
    .inspect83BSourceShadow =
      inspect83BSourceShadow;


  window
    .FIX03D59_STEP83B_SOURCE_SHADOW_LOADED =
      true;


  console.log(
    'FIX-03D5.9 STEP 8.3B Source Shadow loaded — READ ONLY / ZERO WRITE'
  );

})();

