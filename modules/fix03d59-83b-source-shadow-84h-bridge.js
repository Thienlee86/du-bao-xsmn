/* =========================================================================
   FIX-03D5.9
   STEP 8.3B SOURCE SHADOW → STEP 8.4H
   COMPATIBILITY BRIDGE V1

   PURPOSE:
   - Consume existing STEP 8.3B Source Shadow V4.2.
   - Adapt its verified result to the contract expected by STEP 8.4H.
   - Expose window.build83BSourceShadow for STEP 8.4H.
   - Preserve the original Source Shadow module unchanged.
   - Preserve canonical STEP 8.3B unchanged.
   - Preserve LAST_FORECAST unchanged.

   IMPORTANT:
   - NO Production write.
   - NO storage write.
   - NO savePrediction().
   - NO LAST_FORECAST modification.
   - NO canonical candidate modification.
   - NO automatic promotion.
   - FAIL CLOSED.

   NOTE:
   - Existing Source Shadow runner may write its own diagnostic RAM alias.
   - This bridge itself only creates a NEW compatibility diagnostic result.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    '83B-SOURCE-SHADOW-84H-BRIDGE-V1';


  /*
   * =========================================================
   * HELPERS
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


  function safeArray(
    value
  ) {

    return Array.isArray(value)
      ? value
      : [];

  }


  function cloneArray(
    value
  ) {

    return safeArray(value)
      .slice();

  }


  function candidateProvince(
    candidate
  ) {

    if (
      !candidate ||
      typeof candidate !==
        'object'
    ) {

      return '';

    }


    const record =
      candidate.record &&
      typeof candidate.record ===
        'object'
        ? candidate.record
        : candidate;


    return normalizeProvince(

      candidate.province ||

      candidate.provinceSlug ||

      candidate.provinceId ||

      candidate.slug ||

      candidate.provinceKey ||

      record.province ||

      record.provinceSlug ||

      record.provinceId ||

      record.slug ||

      ''

    );

  }


  /*
   * =========================================================
   * FAIL-CLOSED COMPATIBILITY RESULT
   * =========================================================
   */

  function failBridge(
    reason,
    sourceShadow,
    extra
  ) {

    const result =
      Object.assign(
        {

          ready: false,

          passed: false,

          version:
            VERSION,

          reason:
            reason ||
            'SOURCE_SHADOW_84H_BRIDGE_NOT_READY',

          sourceVersion:
            sourceShadow &&
            sourceShadow.version
              ? sourceShadow.version
              : null,

          sourceReason:
            sourceShadow &&
            sourceShadow.reason
              ? sourceShadow.reason
              : null,

          verifiedScope: {

            province:
              null

          },

          identity: {

            preserved:
              false

          },

          boundary: {

            ready:
              false,

            passed:
              false,

            rejectedCount:
              0,

            candidateCountMatch:
              false,

            countsBalanced:
              false,

            provinceMatch:
              false

          },

          boundaryResult: {

            candidates: []

          },

          safety: {

            /*
             * READ ONLY here means:
             *
             * bridge result does not modify canonical /
             * Production / storage state.
             *
             * The upstream Source Shadow runner may still
             * publish its own diagnostic RAM result.
             */

            readOnly:
              true,

            shadowOnly:
              true,

            canonicalWrite:
              false,

            productionWrite:
              false,

            storageWrite:
              false,

            savePredictionCalled:
              false,

            lastForecastModified:
              false,

            canonicalCandidatesModified:
              false

          },

          bridge: {

            adapted:
              false,

            sourceRunnerCalled:
              Boolean(sourceShadow),

            productionPromotion:
              false,

            storageWrite:
              false

          },

          failClosed:
            true,

          adaptedAt:
            new Date()
              .toISOString()

        },

        extra || {}

      );


    window
      .LAST_FIX03D59_STEP83B_SOURCE_SHADOW_84H_BRIDGE =
      result;


    return result;

  }


  /*
   * =========================================================
   * READ EXISTING SOURCE SHADOW V4.2
   * =========================================================
   */

  function getSourceShadowV42() {

    const runner =
      window
        .runStep83BSourceShadow03D59;


    /*
     * Prefer fresh execution of the verified
     * Source Shadow runner.
     */

    if (
      typeof runner ===
      'function'
    ) {

      try {

        const current =
          runner();


        if (
          current &&
          typeof current ===
            'object'
        ) {

          return current;

        }

      } catch (error) {

        return {

          ready: false,

          passed: false,

          version:
            VERSION,

          reason:
            'SOURCE_SHADOW_RUNNER_EXECUTION_FAILED',

          error:
            error &&
            error.message
              ? error.message
              : String(error)

        };

      }

    }


    /*
     * Compatibility fallback:
     * consume existing diagnostic RAM.
     */

    try {

      const cached =
        window
          .LAST_FIX03D59_STEP83B_SOURCE_SHADOW;


      if (
        cached &&
        typeof cached ===
          'object'
      ) {

        return cached;

      }

    } catch (error) {

      /*
       * Fail closed below.
       */

    }


    return null;

  }


  /*
   * =========================================================
   * BUILD 8.4H COMPATIBLE SOURCE SHADOW
   * =========================================================
   */

  function build83BSourceShadow84HBridge() {

    const sourceShadow =
      getSourceShadowV42();


    /*
     * ---------------------------------------------------------
     * SOURCE REQUIRED
     * ---------------------------------------------------------
     */

    if (!sourceShadow) {

      return failBridge(
        'SOURCE_SHADOW_V42_NOT_AVAILABLE',
        null
      );

    }


    /*
     * ---------------------------------------------------------
     * SOURCE MUST PASS
     * ---------------------------------------------------------
     */

    if (
      sourceShadow.ready !==
        true ||
      sourceShadow.passed !==
        true
    ) {

      return failBridge(
        sourceShadow.reason ||
        'SOURCE_SHADOW_V42_NOT_READY',
        sourceShadow
      );

    }


    /*
     * ---------------------------------------------------------
     * EXACTLY ONE TRUSTED PROVINCE
     * ---------------------------------------------------------
     */

    const trustedScope =
      safeArray(
        sourceShadow.trustedScope
      )
        .map(
          normalizeProvince
        )
        .filter(Boolean);


    const uniqueScope =
      Array.from(
        new Set(
          trustedScope
        )
      );


    if (
      uniqueScope.length !==
        1
    ) {

      return failBridge(
        'SOURCE_SHADOW_SCOPE_NOT_SINGLE_PROVINCE',
        sourceShadow,
        {

          trustedScope:
            uniqueScope

        }
      );

    }


    const province =
      uniqueScope[0];


    /*
     * ---------------------------------------------------------
     * SOURCE / BOUNDARY CANDIDATES
     * ---------------------------------------------------------
     */

    const sourceCandidates =
      cloneArray(
        sourceShadow
          .sourceCandidates
      );


    const boundaryCandidates =
      cloneArray(
        sourceShadow
          .boundaryCandidates
      );


    if (
      sourceCandidates.length ===
        0
    ) {

      return failBridge(
        'SOURCE_SHADOW_SOURCE_CANDIDATES_EMPTY',
        sourceShadow,
        {

          verifiedScope: {

            province

          }

        }
      );

    }


    if (
      boundaryCandidates.length ===
        0
    ) {

      return failBridge(
        'SOURCE_SHADOW_BOUNDARY_CANDIDATES_EMPTY',
        sourceShadow,
        {

          verifiedScope: {

            province

          }

        }
      );

    }


    /*
     * ---------------------------------------------------------
     * IDENTITY CERTIFICATION
     * ---------------------------------------------------------
     */

    const identityPreserved =
      Boolean(
        sourceShadow
          .candidateIdentityMatch ===
        true
      );


    const candidateCountMatch =
      Boolean(
        sourceShadow
          .candidateCountMatch ===
        true &&
        sourceCandidates.length ===
          boundaryCandidates.length
      );


    /*
     * ---------------------------------------------------------
     * PROVINCE CERTIFICATION
     * ---------------------------------------------------------
     */

    const sourceProvinces =
      Array.from(
        new Set(
          sourceCandidates
            .map(
              candidateProvince
            )
            .filter(Boolean)
        )
      );


    const boundaryProvinces =
      Array.from(
        new Set(
          boundaryCandidates
            .map(
              candidateProvince
            )
            .filter(Boolean)
        )
      );


    const sourceProvinceMatch =
      (
        sourceProvinces.length ===
          1 &&
        sourceProvinces[0] ===
          province
      );


    const boundaryProvinceMatch =
      (
        boundaryProvinces.length ===
          1 &&
        boundaryProvinces[0] ===
          province
      );


    const provinceMatch =
      Boolean(
        sourceProvinceMatch &&
        boundaryProvinceMatch
      );


    /*
     * ---------------------------------------------------------
     * UPSTREAM SAFETY CERTIFICATION
     * ---------------------------------------------------------
     */

    const sourceSafety =
      sourceShadow.safety &&
      typeof sourceShadow.safety ===
        'object'
        ? sourceShadow.safety
        : {};


    const sourceSafetyPass =
      Boolean(

        sourceSafety.shadowOnly ===
          true &&

        sourceSafety.canonicalWrite ===
          false &&

        sourceSafety.productionWrite ===
          false &&

        sourceSafety.storageWrite ===
          false &&

        sourceSafety.savePredictionCalled ===
          false &&

        sourceSafety.lastForecastModified ===
          false &&

        sourceSafety.candidatesModified ===
          false &&

        sourceSafety.real83BModified ===
          false

      );


    /*
     * ---------------------------------------------------------
     * FINAL BRIDGE CERTIFICATION
     * ---------------------------------------------------------
     */

    const countsBalanced =
      Boolean(
        candidateCountMatch
      );


    const rejectedCount =
      candidateCountMatch &&
      identityPreserved
        ? 0
        : Math.max(
            0,
            sourceCandidates.length -
            boundaryCandidates.length
          );


    const bridgePassed =
      Boolean(

        identityPreserved &&

        candidateCountMatch &&

        countsBalanced &&

        provinceMatch &&

        rejectedCount ===
          0 &&

        sourceSafetyPass

      );


    if (!bridgePassed) {

      let reason =
        'SOURCE_SHADOW_84H_CONTRACT_NOT_VERIFIED';


      if (!identityPreserved) {

        reason =
          'SOURCE_SHADOW_IDENTITY_NOT_PRESERVED';

      } else if (!candidateCountMatch) {

        reason =
          'SOURCE_SHADOW_CANDIDATE_COUNT_MISMATCH';

      } else if (!provinceMatch) {

        reason =
          'SOURCE_SHADOW_PROVINCE_MISMATCH';

      } else if (!sourceSafetyPass) {

        reason =
          'SOURCE_SHADOW_UPSTREAM_SAFETY_INVALID';

      }


      return failBridge(
        reason,
        sourceShadow,
        {

          verifiedScope: {

            province

          },

          identity: {

            preserved:
              identityPreserved

          },

          boundary: {

            ready:
              false,

            passed:
              false,

            rejectedCount,

            candidateCountMatch,

            countsBalanced,

            provinceMatch

          },

          boundaryResult: {

            candidates:
              boundaryCandidates

          },

          diagnostics: {

            sourceCandidateCount:
              sourceCandidates.length,

            boundaryCandidateCount:
              boundaryCandidates.length,

            sourceProvinces,

            boundaryProvinces,

            sourceSafetyPass

          }

        }
      );

    }


    /*
     * =========================================================
     * SUCCESS
     * =========================================================
     *
     * Contract below is intentionally shaped to match exactly
     * what STEP 8.4H expects.
     * =========================================================
     */

    const result = {

      ready:
        true,

      passed:
        true,

      version:
        VERSION,

      reason:
        'SOURCE_SHADOW_84H_BRIDGE_VERIFIED',

      sourceVersion:
        sourceShadow.version ||
        null,

      sourceReason:
        sourceShadow.reason ||
        null,

      /*
       * STEP 8.4H:
       *
       * shadow.verifiedScope.province
       */

      verifiedScope: {

        province

      },

      /*
       * STEP 8.4H:
       *
       * shadow.identity.preserved
       */

      identity: {

        preserved:
          true

      },

      /*
       * STEP 8.4H certification contract.
       */

      boundary: {

        ready:
          true,

        passed:
          true,

        rejectedCount:
          0,

        candidateCountMatch:
          true,

        countsBalanced:
          true,

        provinceMatch:
          true

      },

      /*
       * STEP 8.4H candidate extractor reads:
       *
       * shadow.boundaryResult.candidates
       */

      boundaryResult: {

        candidates:
          boundaryCandidates.slice()

      },

      /*
       * Additional evidence.
       */

      trustedScope:
        uniqueScope.slice(),

      sourceCandidates:
        sourceCandidates.slice(),

      boundaryCandidates:
        boundaryCandidates.slice(),

      sourceCandidateCount:
        sourceCandidates.length,

      boundaryCandidateCount:
        boundaryCandidates.length,

      candidateCountMatch:
        true,

      candidateIdentityMatch:
        true,

      diagnostics: {

        sourceProvinces,

        boundaryProvinces,

        sourceSafetyPass,

        upstreamBuilder:
          sourceShadow.builder &&
          sourceShadow.builder.name
            ? sourceShadow.builder.name
            : null,

        upstreamSource:
          sourceShadow.source ||
          null

      },

      /*
       * =======================================================
       * 8.4H SAFETY CONTRACT
       * =======================================================
       *
       * This compatibility result is read-only with respect to
       * canonical, Production and storage state.
       *
       * Diagnostic RAM publication is not Production mutation.
       */

      safety: {

        readOnly:
          true,

        shadowOnly:
          true,

        canonicalWrite:
          false,

        productionWrite:
          false,

        storageWrite:
          false,

        savePredictionCalled:
          false,

        lastForecastModified:
          false,

        canonicalCandidatesModified:
          false

      },

      bridge: {

        adapted:
          true,

        sourceRunnerCalled:
          true,

        canonicalModified:
          false,

        productionPromotion:
          false,

        productionWrite:
          false,

        storageWrite:
          false

      },

      failClosed:
        true,

      adaptedAt:
        new Date()
          .toISOString()

    };


    /*
     * NEW DIAGNOSTIC RAM ONLY.
     *
     * Do NOT overwrite:
     *
     * LAST_FIX03D59_STEP83B_SOURCE_SHADOW
     */

    window
      .LAST_FIX03D59_STEP83B_SOURCE_SHADOW_84H_BRIDGE =
      result;


    return result;

  }


  /*
   * =========================================================
   * PUBLIC API
   * =========================================================
   */


  /*
   * Exact API expected by STEP 8.4H.
   */

  window
    .build83BSourceShadow =
    build83BSourceShadow84HBridge;


  /*
   * Explicit bridge API for diagnostics.
   */

  window
    .build83BSourceShadow84HBridge03D59 =
    build83BSourceShadow84HBridge;


  window
    .FIX03D59_STEP83B_SOURCE_SHADOW_84H_BRIDGE_LOADED =
    true;


  window
    .FIX03D59_STEP83B_SOURCE_SHADOW_84H_BRIDGE_VERSION =
    VERSION;


  console.log(
    'FIX-03D5.9 8.3B Source Shadow → 8.4H Compatibility Bridge loaded / FAIL CLOSED / ZERO PRODUCTION WRITE'
  );

})();
