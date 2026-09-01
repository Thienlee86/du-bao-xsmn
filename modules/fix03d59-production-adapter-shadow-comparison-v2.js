/* =========================================================================
   FIX-03D5.9
   PRODUCTION ADAPTER SHADOW COMPARISON V2.1

   PURPOSE:
   - Compare CURRENT LAST_FORECAST with certified Shadow Adapter output.
   - Use REAL CURRENT LAST_FORECAST schema:
       LAST_FORECAST.forecast.province
       LAST_FORECAST.forecast.items[]
       item.key
       item.numbers[]
   - Compare selected CURRENT prediction numbers against
     the full 00-99 Shadow ranking.
   - Measure:
       + selected number shadow rank
       + selected numbers inside Shadow Top1
       + selected numbers inside Shadow Top3
       + selected numbers inside Shadow Top5
       + selected numbers inside Shadow Top10
       + same primary Top1
   - Verify province binding.
   - Verify LAST_FORECAST remains unchanged.

   IMPORTANT:
   - SHADOW COMPARISON ONLY.
   - ENGINE EXECUTION ALLOWED FOR SHADOW SIDE.
   - ZERO PRODUCTION WRITE.
   - ZERO STORAGE WRITE.
   - NO renderForecast().
   - NO savePrediction().
   - NO LAST_FORECAST MODIFICATION.
   - NO ACTIVATION.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_PRODUCTION_ADAPTER_SHADOW_COMPARISON_V21';


  const PRIZES = [
    'g1',
    'g2',
    'g3',
    'g4',
    'g5',
    'g6',
    'g7',
    'g8'
  ];


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


  function normalizeNumber03D59(
    value
  ) {

    if (
      value === null ||
      value === undefined
    ) {

      return null;

    }


    const text =
      String(
        value
      ).trim();


    if (
      /^\d$/.test(
        text
      )
    ) {

      return (
        '0' +
        text
      );

    }


    if (
      /^\d{2}$/.test(
        text
      )
    ) {

      return text;

    }


    const n =
      Number(
        value
      );


    if (
      Number.isFinite(n) &&
      n >= 0 &&
      n <= 99
    ) {

      return String(
        Math.trunc(n)
      )
        .padStart(
          2,
          '0'
        );

    }


    return null;

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


  function unique03D59(
    values
  ) {

    const output = [];

    const seen =
      new Set();


    (
      Array.isArray(values)
        ? values
        : []
    )
      .forEach(
        value => {

          const normalized =
            normalizeNumber03D59(
              value
            );


          if (
            normalized === null ||
            seen.has(
              normalized
            )
          ) {

            return;

          }


          seen.add(
            normalized
          );


          output.push(
            normalized
          );

        }
      );


    return output;

  }


  /*
   * =========================================================
   * CURRENT LAST_FORECAST ACCESS
   * =========================================================
   */

  function readCurrentForecast03D59() {

    if (
      typeof window
        .readLastForecast03D59 !==
      'function'
    ) {

      return {

        ready:
          false,

        reason:
          'LAST_FORECAST_READER_NOT_AVAILABLE'

      };

    }


    let forecast;


    try {

      forecast =
        window
          .readLastForecast03D59();

    } catch (error) {

      return {

        ready:
          false,

        reason:
          'LAST_FORECAST_READ_FAILED',

        error:
          error &&
          error.message
            ? error.message
            : String(error)

      };

    }


    if (
      !forecast ||
      typeof forecast !==
        'object'
    ) {

      return {

        ready:
          false,

        reason:
          'LAST_FORECAST_NOT_AVAILABLE'

      };

    }


    return {

      ready:
        true,

      forecast:
        clone03D59(
          forecast
        )

    };

  }


  /*
   * =========================================================
   * REAL CURRENT FORECAST ROOT
   * =========================================================
   */

  function getCurrentForecastPayload03D59(
    root
  ) {

    if (
      !root ||
      typeof root !==
        'object'
    ) {

      return {

        ready:
          false,

        reason:
          'CURRENT_ROOT_INVALID'

      };

    }


    const payload =
      root.forecast;


    if (
      !payload ||
      typeof payload !==
        'object' ||
      Array.isArray(
        payload
      )
    ) {

      return {

        ready:
          false,

        reason:
          'CURRENT_FORECAST_PAYLOAD_NOT_FOUND'

      };

    }


    return {

      ready:
        true,

      payload

    };

  }


  /*
   * =========================================================
   * PROVINCE
   * =========================================================
   */

  function extractCurrentProvince03D59(
    root
  ) {

    const payloadAccess =
      getCurrentForecastPayload03D59(
        root
      );


    if (
      payloadAccess.ready !==
      true
    ) {

      return {

        ready:
          false,

        reason:
          payloadAccess.reason

      };

    }


    const province =
      payloadAccess
        .payload
        .province;


    if (
      typeof province !==
        'string' ||
      !province.trim()
    ) {

      return {

        ready:
          false,

        reason:
          'CURRENT_FORECAST_PROVINCE_NOT_FOUND'

      };

    }


    return {

      ready:
        true,

      raw:
        province,

      normalized:
        normalizeProvince03D59(
          province
        )

    };

  }


  /*
   * =========================================================
   * REAL PRIZE ITEM
   * =========================================================
   */

  function resolveCurrentPrize03D59(
    root,
    prize
  ) {

    const payloadAccess =
      getCurrentForecastPayload03D59(
        root
      );


    if (
      payloadAccess.ready !==
      true
    ) {

      return {

        ready:
          false,

        prize,

        reason:
          payloadAccess.reason

      };

    }


    const items =
      payloadAccess
        .payload
        .items;


    if (
      !Array.isArray(
        items
      )
    ) {

      return {

        ready:
          false,

        prize,

        reason:
          'CURRENT_FORECAST_ITEMS_NOT_ARRAY'

      };

    }


    const matches =
      items.filter(
        item =>
          item &&
          String(
            item.key || ''
          ).toLowerCase() ===
          String(
            prize
          ).toLowerCase()
      );


    if (
      matches.length !==
      1
    ) {

      return {

        ready:
          false,

        prize,

        reason:
          matches.length === 0
            ? 'CURRENT_PRIZE_ITEM_NOT_FOUND'
            : 'CURRENT_PRIZE_ITEM_AMBIGUOUS',

        matchCount:
          matches.length

      };

    }


    const item =
      matches[0];


    if (
      !Array.isArray(
        item.numbers
      )
    ) {

      return {

        ready:
          false,

        prize,

        reason:
          'CURRENT_PRIZE_NUMBERS_NOT_ARRAY'

      };

    }


    const selected =
      unique03D59(
        item.numbers.map(
          entry => {

            if (
              entry &&
              typeof entry ===
                'object' &&
              entry.number !==
                undefined
            ) {

              return entry.number;

            }


            return entry;

          }
        )
      );


    if (
      !selected.length
    ) {

      return {

        ready:
          false,

        prize,

        reason:
          'CURRENT_PRIZE_NUMBERS_EMPTY'

      };

    }


    return {

      ready:
        true,

      prize,

      source:
        'forecast.items[key=' +
        prize +
        '].numbers',

      label:
        item.label || prize,

      digits:
        item.digits,

      predictionMode:
        item.predictionMode,

      selectedNumbers:
        selected,

      selectedCount:
        selected.length

    };

  }


  /*
   * =========================================================
   * ONE PRIZE COMPARISON
   * =========================================================
   */

  function comparePrize03D59(
    current,
    shadow
  ) {

    if (
      !current ||
      current.ready !==
        true
    ) {

      return {

        ready:
          false,

        reason:
          current &&
          current.reason
            ? current.reason
            : 'CURRENT_NOT_READY'

      };

    }


    if (
      !shadow ||
      shadow.ready !==
        true ||
      !Array.isArray(
        shadow.ranking
      ) ||
      shadow.ranking.length !==
        100
    ) {

      return {

        ready:
          false,

        reason:
          'SHADOW_RANKING_NOT_READY'

      };

    }


    const ranking =
      shadow.ranking;


    const selectedDetails =
      current
        .selectedNumbers
        .map(
          number => {

            const index =
              ranking.indexOf(
                number
              );


            return {

              number,

              shadowRank:
                index >= 0
                  ? index + 1
                  : null,

              inTop1:
                index === 0,

              inTop3:
                index >= 0 &&
                index < 3,

              inTop5:
                index >= 0 &&
                index < 5,

              inTop10:
                index >= 0 &&
                index < 10

            };

          }
        );


    const top1Count =
      selectedDetails.filter(
        item =>
          item.inTop1
      ).length;


    const top3Count =
      selectedDetails.filter(
        item =>
          item.inTop3
      ).length;


    const top5Count =
      selectedDetails.filter(
        item =>
          item.inTop5
      ).length;


    const top10Count =
      selectedDetails.filter(
        item =>
          item.inTop10
      ).length;


    const currentPrimary =
      current
        .selectedNumbers[
          0
        ] ||
      null;


    const shadowPrimary =
      ranking[
        0
      ] ||
      null;


    return {

      ready:
        true,

      currentSource:
        current.source,

      label:
        current.label,

      predictionMode:
        current.predictionMode,

      selectedCount:
        current.selectedCount,

      selectedNumbers:
        current
          .selectedNumbers
          .slice(),

      selectedDetails,

      shadowModel:
        shadow.model,

      shadowWindow:
        shadow.window,

      shadowTop1:
        ranking.slice(
          0,
          1
        ),

      shadowTop3:
        ranking.slice(
          0,
          3
        ),

      shadowTop5:
        ranking.slice(
          0,
          5
        ),

      shadowTop10:
        ranking.slice(
          0,
          10
        ),

      selectedInShadow: {

        top1Count,

        top3Count,

        top5Count,

        top10Count

      },

      samePrimaryTop1:
        (
          currentPrimary !== null &&
          shadowPrimary !== null &&
          currentPrimary ===
            shadowPrimary
        )

    };

  }


  /*
   * =========================================================
   * SAFETY
   * =========================================================
   */

  function safety03D59() {

    return {

      comparisonOnly:
        true,

      shadowOnly:
        true,

      engineExecutionAllowed:
        true,

      productionAuthorized:
        false,

      productionWrite:
        false,

      storageWrite:
        false,

      renderForecastCalled:
        false,

      savePredictionCalled:
        false,

      lastForecastModified:
        false,

      activationPerformed:
        false

    };

  }


  /*
   * =========================================================
   * MAIN
   * =========================================================
   */

  function runProductionShadowComparisonV2(
    provinceSlug
  ) {

    const province =
      String(
        provinceSlug || ''
      ).trim();


    if (
      !province
    ) {

      return {

        version:
          VERSION,

        ready:
          false,

        passed:
          false,

        reason:
          'PROVINCE_NOT_PROVIDED',

        safety:
          safety03D59()

      };

    }


    /*
     * ---------------------------------------------------------
     * CURRENT SNAPSHOT BEFORE
     * ---------------------------------------------------------
     */

    const currentAccess =
      readCurrentForecast03D59();


    if (
      currentAccess.ready !==
      true
    ) {

      return {

        version:
          VERSION,

        ready:
          false,

        passed:
          false,

        reason:
          currentAccess.reason,

        province,

        safety:
          safety03D59()

      };

    }


    const currentForecast =
      currentAccess.forecast;


    const snapshotBefore =
      JSON.stringify(
        currentForecast
      );


    /*
     * ---------------------------------------------------------
     * PROVINCE BINDING
     * ---------------------------------------------------------
     */

    const currentProvince =
      extractCurrentProvince03D59(
        currentForecast
      );


    if (
      currentProvince.ready !==
      true
    ) {

      return {

        version:
          VERSION,

        ready:
          false,

        passed:
          false,

        reason:
          currentProvince.reason,

        province,

        safety:
          safety03D59()

      };

    }


    const requestedNormalized =
      normalizeProvince03D59(
        province
      );


    if (
      requestedNormalized !==
      currentProvince.normalized
    ) {

      return {

        version:
          VERSION,

        ready:
          false,

        passed:
          false,

        reason:
          'CURRENT_FORECAST_PROVINCE_MISMATCH',

        requestedProvince:
          province,

        currentForecastProvince:
          currentProvince.raw,

        provinceMatched:
          false,

        safety:
          safety03D59()

      };

    }


    /*
     * ---------------------------------------------------------
     * SHADOW EXECUTION
     * ---------------------------------------------------------
     */

    if (
      typeof window
        .runProductionForecastAdapterShadow03D59 !==
      'function'
    ) {

      return {

        version:
          VERSION,

        ready:
          false,

        passed:
          false,

        reason:
          'SHADOW_ADAPTER_NOT_AVAILABLE',

        province,

        safety:
          safety03D59()

      };

    }


    const shadow =
      window
        .runProductionForecastAdapterShadow03D59(
          province
        );


    if (
      !shadow ||
      shadow.passed !==
        true
    ) {

      return {

        version:
          VERSION,

        ready:
          false,

        passed:
          false,

        reason:
          'SHADOW_ADAPTER_NOT_READY',

        province,

        shadowReason:
          shadow &&
          shadow.reason
            ? shadow.reason
            : null,

        safety:
          safety03D59()

      };

    }


    /*
     * ---------------------------------------------------------
     * CURRENT SNAPSHOT AFTER
     * ---------------------------------------------------------
     */

    const afterAccess =
      readCurrentForecast03D59();


    if (
      afterAccess.ready !==
      true
    ) {

      return {

        version:
          VERSION,

        ready:
          false,

        passed:
          false,

        reason:
          'CURRENT_FORECAST_AFTER_READ_FAILED',

        province,

        safety:
          safety03D59()

      };

    }


    const snapshotAfter =
      JSON.stringify(
        afterAccess.forecast
      );


    const unchanged =
      snapshotBefore ===
      snapshotAfter;


    if (
      !unchanged
    ) {

      return {

        version:
          VERSION,

        ready:
          false,

        passed:
          false,

        reason:
          'LAST_FORECAST_CHANGED_DURING_COMPARISON',

        province,

        lastForecastUnchanged:
          false,

        safety:
          safety03D59()

      };

    }


    /*
     * ---------------------------------------------------------
     * G1 -> G8
     * ---------------------------------------------------------
     */

    const comparisons = {};

    const schemaDiagnostics = {};


    PRIZES.forEach(
      prize => {

        const currentPrize =
          resolveCurrentPrize03D59(
            currentForecast,
            prize
          );


        schemaDiagnostics[
          prize
        ] =
          clone03D59(
            currentPrize
          );


        comparisons[
          prize
        ] =
          comparePrize03D59(
            currentPrize,
            shadow.prizes[
              prize
            ]
          );

      }
    );


    const failedPrizes =
      PRIZES.filter(
        prize =>
          !comparisons[
            prize
          ] ||
          comparisons[
            prize
          ].ready !==
            true
      );


    const mappedPrizeCount =
      PRIZES.length -
      failedPrizes.length;


    const passed =
      failedPrizes.length ===
      0;


    /*
     * ---------------------------------------------------------
     * AGGREGATE
     * ---------------------------------------------------------
     */

    const aggregate = {

      samePrimaryTop1Count:
        0,

      selectedNumbersTotal:
        0,

      selectedInShadowTop1:
        0,

      selectedInShadowTop3:
        0,

      selectedInShadowTop5:
        0,

      selectedInShadowTop10:
        0

    };


    if (passed) {

      PRIZES.forEach(
        prize => {

          const item =
            comparisons[
              prize
            ];


          aggregate
            .selectedNumbersTotal +=
              item.selectedCount;


          aggregate
            .selectedInShadowTop1 +=
              item
                .selectedInShadow
                .top1Count;


          aggregate
            .selectedInShadowTop3 +=
              item
                .selectedInShadow
                .top3Count;


          aggregate
            .selectedInShadowTop5 +=
              item
                .selectedInShadow
                .top5Count;


          aggregate
            .selectedInShadowTop10 +=
              item
                .selectedInShadow
                .top10Count;


          if (
            item.samePrimaryTop1
          ) {

            aggregate
              .samePrimaryTop1Count++;

          }

        }
      );

    }


    const result = {

      version:
        VERSION,

      ready:
        passed,

      passed,

      reason:
        passed
          ? 'SHADOW_COMPARISON_READY'
          : 'CURRENT_FORECAST_SCHEMA_NOT_FULLY_MAPPED',

      mode:
        'SHADOW_COMPARISON',

      province,

      currentForecastProvince:
        currentProvince.raw,

      provinceMatched:
        true,

      lastForecastUnchanged:
        true,

      currentForecastVersion:
        currentForecast &&
        currentForecast.forecast
          ? currentForecast
              .forecast
              .version ||
            null
          : null,

      currentForecastWindow:
        currentForecast &&
        currentForecast.forecast
          ? currentForecast
              .forecast
              .windowSize ||
            null
          : null,

      shadowVersion:
        shadow.version,

      freezeVersion:
        shadow.freezeVersion,

      mappedPrizeCount,

      failedPrizeCount:
        failedPrizes.length,

      failedPrizes:
        failedPrizes.slice(),

      comparisons,

      schemaDiagnostics,

      aggregate,

      activationAuthorized:
        false,

      safety:
        safety03D59(),

      inspectedAt:
        new Date()
          .toISOString()

    };


    /*
     * Diagnostic RAM only.
     */

    window
      .LAST_FIX03D59_PRODUCTION_SHADOW_COMPARISON_V2 =
      clone03D59(
        result
      );


    return result;

  }


  /*
   * =========================================================
   * PUBLIC API
   * =========================================================
   */

  window
    .runProductionShadowComparisonV2 =
    runProductionShadowComparisonV2;


  window
    .FIX03D59_PRODUCTION_SHADOW_COMPARISON_V2_VERSION =
    VERSION;


  window
    .FIX03D59_PRODUCTION_SHADOW_COMPARISON_V2_LOADED =
    true;


  console.log(
    'FIX-03D5.9 Production Shadow Comparison V2.1 loaded / REAL LAST_FORECAST ITEMS SCHEMA / SHADOW ONLY'
  );

})();
