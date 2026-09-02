/* =========================================================================
   FIX-03D5.9
   PRODUCTION SHADOW CERTIFICATION MATRIX V1

   PURPOSE:
   - Certify CURRENT forecast province-by-province using
     Production Shadow Comparison V2.1.
   - Accumulate certification results in RAM only.
   - One CURRENT LAST_FORECAST at a time.
   - Never generate forecasts automatically.
   - Never switch province automatically.
   - Never modify LAST_FORECAST.
   - Provide cross-province certification summary.

   CERTIFICATION CONDITIONS PER PROVINCE:
   - Comparison V2.1 passed.
   - Province matched.
   - G1 -> G8 mapped 8/8.
   - Failed prizes = 0.
   - LAST_FORECAST unchanged.
   - Same primary Top1 = 8/8.
   - All CURRENT selected numbers inside Shadow Top5.
   - Safety contract remains zero-write.

   IMPORTANT:
   - MANUAL CERTIFICATION.
   - RAM ONLY.
   - ZERO STORAGE WRITE.
   - ZERO PRODUCTION WRITE.
   - NO renderForecast().
   - NO savePrediction().
   - NO LAST_FORECAST MODIFICATION.
   - NO ACTIVATION.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_PRODUCTION_SHADOW_CERTIFICATION_MATRIX_V1';


  const REQUIRED_PRIZES =
    8;


  /*
   * =========================================================
   * RAM STATE
   * =========================================================
   */

  const MATRIX = {

    version:
      VERSION,

    provinces: {},

    order: [],

    createdAt:
      new Date()
        .toISOString(),

    updatedAt:
      null

  };


  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

  function clone03D59(
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


  function normalizeProvince03D59(
    value
  ) {

    return String(
      value || ''
    )
      .trim()
      .toLowerCase()
      .normalize(
        'NFD'
      )
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .replace(
        /đ/g,
        'd'
      )
      .replace(
        /[^a-z0-9]+/g,
        '-'
      )
      .replace(
        /^-+|-+$/g,
        ''
      );

  }


  /*
   * =========================================================
   * SAFETY CHECK
   * =========================================================
   */

  function inspectSafety03D59(
    result
  ) {

    const safety =
      result &&
      result.safety
        ? result.safety
        : {};


    const passed =
      (
        safety.comparisonOnly === true &&
        safety.shadowOnly === true &&
        safety.productionWrite === false &&
        safety.storageWrite === false &&
        safety.renderForecastCalled === false &&
        safety.savePredictionCalled === false &&
        safety.activationPerformed === false &&
        result.activationAuthorized === false
      );


    return {

      passed,

      comparisonOnly:
        safety.comparisonOnly === true,

      shadowOnly:
        safety.shadowOnly === true,

      activationAuthorized:
        result &&
        result.activationAuthorized === true,

      productionWrite:
        safety.productionWrite,

      storageWrite:
        safety.storageWrite,

      renderForecastCalled:
        safety.renderForecastCalled,

      savePredictionCalled:
        safety.savePredictionCalled,

      activationPerformed:
        safety.activationPerformed

    };

  }


  /*
   * =========================================================
   * CLASSIFY ONE COMPARISON
   * =========================================================
   */

  function classifyComparison03D59(
    result
  ) {

    if (
      !result ||
      result.passed !== true
    ) {

      return {

        certified:
          false,

        reason:
          result &&
          result.reason
            ? result.reason
            : 'COMPARISON_NOT_PASSED'

      };

    }


    if (
      result.provinceMatched !==
      true
    ) {

      return {

        certified:
          false,

        reason:
          'PROVINCE_NOT_MATCHED'

      };

    }


    if (
      result.lastForecastUnchanged !==
      true
    ) {

      return {

        certified:
          false,

        reason:
          'LAST_FORECAST_NOT_VERIFIED_UNCHANGED'

      };

    }


    if (
      result.mappedPrizeCount !==
      REQUIRED_PRIZES
    ) {

      return {

        certified:
          false,

        reason:
          'PRIZE_MAPPING_INCOMPLETE'

      };

    }


    if (
      result.failedPrizeCount !==
      0
    ) {

      return {

        certified:
          false,

        reason:
          'FAILED_PRIZES_PRESENT'

      };

    }


    const aggregate =
      result.aggregate ||
      {};


    if (
      aggregate.samePrimaryTop1Count !==
      REQUIRED_PRIZES
    ) {

      return {

        certified:
          false,

        reason:
          'PRIMARY_TOP1_NOT_FULLY_ALIGNED'

      };

    }


    if (
      !Number.isFinite(
        Number(
          aggregate.selectedNumbersTotal
        )
      ) ||
      Number(
        aggregate.selectedNumbersTotal
      ) <= 0
    ) {

      return {

        certified:
          false,

        reason:
          'SELECTED_NUMBER_TOTAL_INVALID'

      };

    }


    if (
      Number(
        aggregate.selectedInShadowTop5
      ) !==
      Number(
        aggregate.selectedNumbersTotal
      )
    ) {

      return {

        certified:
          false,

        reason:
          'SELECTED_NUMBERS_NOT_FULLY_IN_SHADOW_TOP5'

      };

    }


    const safety =
      inspectSafety03D59(
        result
      );


    if (
      safety.passed !== true
    ) {

      return {

        certified:
          false,

        reason:
          'SAFETY_CONTRACT_FAILED',

        safety

      };

    }


    return {

      certified:
        true,

      reason:
        'PROVINCE_SHADOW_CERTIFIED',

      safety

    };

  }


  /*
   * =========================================================
   * CERTIFY CURRENT PROVINCE
   * =========================================================
   */

  function certifyCurrentProvince03D59(
    provinceSlug
  ) {

    const province =
      normalizeProvince03D59(
        provinceSlug
      );


    if (
      !province
    ) {

      return {

        version:
          VERSION,

        ready:
          false,

        certified:
          false,

        reason:
          'PROVINCE_NOT_PROVIDED'

      };

    }


    if (
      typeof window
        .runProductionShadowComparisonV2 !==
      'function'
    ) {

      return {

        version:
          VERSION,

        ready:
          false,

        certified:
          false,

        reason:
          'SHADOW_COMPARISON_V21_NOT_AVAILABLE',

        province

      };

    }


    let comparison;


    try {

      comparison =
        window
          .runProductionShadowComparisonV2(
            province
          );

    } catch (error) {

      return {

        version:
          VERSION,

        ready:
          false,

        certified:
          false,

        reason:
          'SHADOW_COMPARISON_EXECUTION_FAILED',

        province,

        error:
          error &&
          error.message
            ? error.message
            : String(error)

      };

    }


    const classification =
      classifyComparison03D59(
        comparison
      );


    const entry = {

      version:
        VERSION,

      province,

      certified:
        classification.certified ===
        true,

      reason:
        classification.reason,

      comparisonVersion:
        comparison &&
        comparison.version
          ? comparison.version
          : null,

      currentForecastVersion:
        comparison &&
        comparison.currentForecastVersion
          ? comparison.currentForecastVersion
          : null,

      currentForecastWindow:
        comparison &&
        comparison.currentForecastWindow != null
          ? comparison.currentForecastWindow
          : null,

      mappedPrizeCount:
        comparison &&
        comparison.mappedPrizeCount != null
          ? comparison.mappedPrizeCount
          : 0,

      failedPrizeCount:
        comparison &&
        comparison.failedPrizeCount != null
          ? comparison.failedPrizeCount
          : null,

      provinceMatched:
        comparison &&
        comparison.provinceMatched ===
          true,

      lastForecastUnchanged:
        comparison &&
        comparison.lastForecastUnchanged ===
          true,

      aggregate:
        comparison &&
        comparison.aggregate
          ? clone03D59(
              comparison.aggregate
            )
          : null,

      safety:
        classification.safety ||
        inspectSafety03D59(
          comparison
        ),

      comparison:
        clone03D59(
          comparison
        ),

      certifiedAt:
        new Date()
          .toISOString()

    };


    if (
      !Object.prototype
        .hasOwnProperty.call(
          MATRIX.provinces,
          province
        )
    ) {

      MATRIX.order.push(
        province
      );

    }


    MATRIX.provinces[
      province
    ] =
      entry;


    MATRIX.updatedAt =
      new Date()
        .toISOString();


    window
      .LAST_FIX03D59_PRODUCTION_SHADOW_CERTIFICATION_MATRIX =
      clone03D59(
        MATRIX
      );


    return clone03D59(
      entry
    );

  }


  /*
   * =========================================================
   * MATRIX SUMMARY
   * =========================================================
   */

  function summarizeMatrix03D59() {

    const entries =
      MATRIX.order
        .map(
          province =>
            MATRIX
              .provinces[
                province
              ]
        )
        .filter(
          Boolean
        );


    const certified =
      entries.filter(
        item =>
          item.certified ===
          true
      );


    const failed =
      entries.filter(
        item =>
          item.certified !==
          true
      );


    let selectedNumbersTotal =
      0;

    let selectedTop1 =
      0;

    let selectedTop3 =
      0;

    let selectedTop5 =
      0;

    let selectedTop10 =
      0;

    let samePrimaryTop1 =
      0;


    certified.forEach(
      item => {

        const aggregate =
          item.aggregate ||
          {};


        selectedNumbersTotal +=
          Number(
            aggregate.selectedNumbersTotal ||
            0
          );


        selectedTop1 +=
          Number(
            aggregate.selectedInShadowTop1 ||
            0
          );


        selectedTop3 +=
          Number(
            aggregate.selectedInShadowTop3 ||
            0
          );


        selectedTop5 +=
          Number(
            aggregate.selectedInShadowTop5 ||
            0
          );


        selectedTop10 +=
          Number(
            aggregate.selectedInShadowTop10 ||
            0
          );


        samePrimaryTop1 +=
          Number(
            aggregate.samePrimaryTop1Count ||
            0
          );

      }
    );


    const summary = {

      version:
        VERSION,

      ready:
        entries.length > 0,

      testedProvinceCount:
        entries.length,

      certifiedProvinceCount:
        certified.length,

      failedProvinceCount:
        failed.length,

      certifiedRate:
        entries.length
          ? (
              certified.length /
              entries.length
            )
          : 0,

      selectedNumbersTotal,

      selectedInShadowTop1:
        selectedTop1,

      selectedInShadowTop3:
        selectedTop3,

      selectedInShadowTop5:
        selectedTop5,

      selectedInShadowTop10:
        selectedTop10,

      samePrimaryTop1Total:
        samePrimaryTop1,

      expectedPrimaryTop1Total:
        certified.length *
        REQUIRED_PRIZES,

      certifiedProvinces:
        certified.map(
          item =>
            item.province
        ),

      failedProvinces:
        failed.map(
          item => ({

            province:
              item.province,

            reason:
              item.reason

          })
        ),

      activationAuthorized:
        false,

      safety: {

        ramOnly:
          true,

        productionWrite:
          false,

        storageWrite:
          false,

        lastForecastModified:
          false,

        savePredictionCalled:
          false,

        renderForecastCalled:
          false,

        activationPerformed:
          false

      },

      updatedAt:
        MATRIX.updatedAt

    };


    window
      .LAST_FIX03D59_PRODUCTION_SHADOW_CERTIFICATION_SUMMARY =
      clone03D59(
        summary
      );


    return summary;

  }


  /*
   * =========================================================
   * RESET RAM MATRIX
   * =========================================================
   */

  function resetMatrix03D59() {

    MATRIX.provinces =
      {};

    MATRIX.order =
      [];

    MATRIX.createdAt =
      new Date()
        .toISOString();

    MATRIX.updatedAt =
      null;


    window
      .LAST_FIX03D59_PRODUCTION_SHADOW_CERTIFICATION_MATRIX =
      clone03D59(
        MATRIX
      );


    return {

      version:
        VERSION,

      reset:
        true,

      reason:
        'RAM_MATRIX_RESET',

      productionWrite:
        false,

      storageWrite:
        false

    };

  }


  /*
   * =========================================================
   * PUBLIC API
   * =========================================================
   */

  window
    .certifyCurrentProductionShadowProvince03D59 =
    certifyCurrentProvince03D59;


  window
    .summarizeProductionShadowCertificationMatrix03D59 =
    summarizeMatrix03D59;


  window
    .resetProductionShadowCertificationMatrix03D59 =
    resetMatrix03D59;


  window
    .FIX03D59_PRODUCTION_SHADOW_CERTIFICATION_MATRIX_VERSION =
    VERSION;


  window
    .FIX03D59_PRODUCTION_SHADOW_CERTIFICATION_MATRIX_LOADED =
    true;


  window
    .LAST_FIX03D59_PRODUCTION_SHADOW_CERTIFICATION_MATRIX =
    clone03D59(
      MATRIX
    );


  console.log(
    'FIX-03D5.9 Production Shadow Certification Matrix V1 loaded / RAM ONLY / NO ACTIVATION'
  );

})();
