/* =========================================================================
   FIX-03D5.9
   PRODUCTION FORECAST ADAPTER V1 — SHADOW EXECUTION

   PURPOSE:
   - Read verified Production Config Freeze V2.
   - Execute the frozen Model × Window for G1 -> G8.
   - Build normalized 00-99 rankings.
   - Return TOP 3 / TOP 5 / TOP 10 for inspection.
   - Prepare a clean boundary for future REAL Production integration.

   FROZEN CONFIG:
   - G1 BALANCED  W20
   - G2 BALANCED  W10
   - G3 BASELINE  W20
   - G4 FREQUENCY W30
   - G5 CYCLE     W20
   - G6 BALANCED  W20
   - G7 BASELINE  W30
   - G8 RECENT    W60

   DB:
   - NOT modified here.
   - Existing DB Full-6 Production path is preserved.

   IMPORTANT:
   - SHADOW EXECUTION ONLY.
   - ENGINE EXECUTION ALLOWED.
   - ZERO PRODUCTION WRITE.
   - ZERO STORAGE WRITE.
   - NO renderForecast().
   - NO savePrediction().
   - NO LAST_FORECAST MODIFICATION.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_PRODUCTION_FORECAST_ADAPTER_V1_SHADOW';


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


  const LABELS = {

    g1:
      'Giải Nhất',

    g2:
      'Giải Nhì',

    g3:
      'Giải Ba',

    g4:
      'Giải Tư',

    g5:
      'Giải Năm',

    g6:
      'Giải Sáu',

    g7:
      'Giải Bảy',

    g8:
      'Giải Tám'

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


    return JSON.parse(
      JSON.stringify(
        value
      )
    );

  }


  function normalizeNumber03D59(
    value
  ) {

    const text =
      String(
        value
      );


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


  function uniqueRanking03D59(
    ranking
  ) {

    const output = [];

    const seen =
      new Set();


    (
      Array.isArray(ranking)
        ? ranking
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
   * MODEL CONFIG
   * =========================================================
   */

  function getModelConfig03D59(
    modelId
  ) {

    if (
      typeof MODEL_LAB_V23_CONFIGS ===
        'undefined' ||
      !Array.isArray(
        MODEL_LAB_V23_CONFIGS
      )
    ) {

      return null;

    }


    return MODEL_LAB_V23_CONFIGS
      .find(
        item =>
          item &&
          String(
            item.id
          ).toUpperCase() ===
          String(
            modelId
          ).toUpperCase()
      ) ||
      null;

  }


  /*
   * =========================================================
   * FREEZE ACCESS
   * =========================================================
   */

  function readFreeze03D59() {

    if (
      typeof window
        .readProductionConfigFreeze03D59V2 !==
      'function'
    ) {

      return {

        ready:
          false,

        reason:
          'FREEZE_READER_NOT_AVAILABLE'

      };

    }


    const freeze =
      window
        .readProductionConfigFreeze03D59V2();


    if (
      !freeze ||
      freeze.ready !== true
    ) {

      return {

        ready:
          false,

        reason:
          'PRODUCTION_FREEZE_NOT_READY',

        freeze:
          freeze || null

      };

    }


    if (
      freeze.status !==
      'PRODUCTION_CONFIG_FROZEN'
    ) {

      return {

        ready:
          false,

        reason:
          'PRODUCTION_FREEZE_STATUS_INVALID',

        freeze

      };

    }


    if (
      Array.isArray(
        freeze.unresolved
      ) &&
      freeze.unresolved.length
    ) {

      return {

        ready:
          false,

        reason:
          'PRODUCTION_FREEZE_HAS_UNRESOLVED_PRIZES',

        freeze

      };

    }


    return {

      ready:
        true,

      freeze

    };

  }


  /*
   * =========================================================
   * RUNTIME DEPENDENCY CHECK
   * =========================================================
   */

  function inspectDependencies03D59() {

    const missing = [];


    if (
      typeof getAllDrawsForProvince !==
      'function'
    ) {

      missing.push(
        'getAllDrawsForProvince'
      );

    }


    if (
      typeof modelLabScoresV23 !==
      'function'
    ) {

      missing.push(
        'modelLabScoresV23'
      );

    }


    if (
      typeof rankedNumbers !==
      'function'
    ) {

      missing.push(
        'rankedNumbers'
      );

    }


    if (
      typeof MODEL_LAB_V23_CONFIGS ===
        'undefined'
    ) {

      missing.push(
        'MODEL_LAB_V23_CONFIGS'
      );

    }


    return {

      ready:
        missing.length === 0,

      missing

    };

  }


  /*
   * =========================================================
   * ONE PRIZE SHADOW EXECUTION
   * =========================================================
   */

  function executePrize03D59(
    prize,
    frozenConfig,
    draws
  ) {

    if (
      !frozenConfig ||
      frozenConfig.status !==
        'FROZEN'
    ) {

      return {

        ready:
          false,

        prize,

        reason:
          'PRIZE_CONFIG_NOT_FROZEN'

      };

    }


    const model =
      String(
        frozenConfig.model ||
        ''
      ).toUpperCase();


    const windowSize =
      Number(
        frozenConfig.window
      );


    if (
      !model ||
      !Number.isFinite(
        windowSize
      ) ||
      windowSize <= 0
    ) {

      return {

        ready:
          false,

        prize,

        reason:
          'PRIZE_CONFIG_INVALID'

      };

    }


    const modelConfig =
      getModelConfig03D59(
        model
      );


    if (
      !modelConfig ||
      !modelConfig.weights
    ) {

      return {

        ready:
          false,

        prize,

        model,

        window:
          windowSize,

        reason:
          'MODEL_CONFIG_NOT_AVAILABLE'

      };

    }


    if (
      !Array.isArray(draws) ||
      draws.length <
        Math.min(
          windowSize,
          10
        )
    ) {

      return {

        ready:
          false,

        prize,

        model,

        window:
          windowSize,

        reason:
          'INSUFFICIENT_DRAW_DATA',

        drawCount:
          Array.isArray(draws)
            ? draws.length
            : 0

      };

    }


    let scores;


    try {

      scores =
        modelLabScoresV23(
          draws,
          prize,
          windowSize,
          modelConfig.weights
        );

    } catch (error) {

      return {

        ready:
          false,

        prize,

        model,

        window:
          windowSize,

        reason:
          'MODEL_EXECUTION_FAILED',

        error:
          error &&
          error.message
            ? error.message
            : String(error)

      };

    }


    let rawRanking;


    try {

      rawRanking =
        rankedNumbers(
          scores
        )
          .map(
            item =>
              Array.isArray(item)
                ? item[0]
                : item
          );

    } catch (error) {

      return {

        ready:
          false,

        prize,

        model,

        window:
          windowSize,

        reason:
          'RANKING_BUILD_FAILED',

        error:
          error &&
          error.message
            ? error.message
            : String(error)

      };

    }


    const ranking =
      uniqueRanking03D59(
        rawRanking
      );


    if (
      ranking.length !== 100
    ) {

      return {

        ready:
          false,

        prize,

        model,

        window:
          windowSize,

        reason:
          'RANKING_NOT_COMPLETE',

        rankingCount:
          ranking.length

      };

    }


    return {

      ready:
        true,

      prize,

      label:
        LABELS[
          prize
        ] ||
        prize,

      model,

      window:
        windowSize,

      featurePolicy:
        frozenConfig
          .featurePolicy ||
        'MODEL_DEFAULT',

      drawCount:
        draws.length,

      rankingCount:
        ranking.length,

      top1:
        ranking.slice(
          0,
          1
        ),

      top3:
        ranking.slice(
          0,
          3
        ),

      top5:
        ranking.slice(
          0,
          5
        ),

      top10:
        ranking.slice(
          0,
          10
        ),

      ranking:
        ranking.slice(),

      /*
       * Scores are intentionally not exposed as a
       * Production forecast contract in V1.
       */

      shadowOnly:
        true

    };

  }


  /*
   * =========================================================
   * COMPLETE G1 -> G8 SHADOW
   * =========================================================
   */

  function runProductionForecastAdapterShadow03D59(
    provinceSlug
  ) {

    const requestedProvince =
      String(
        provinceSlug ||
        ''
      ).trim();


    if (
      !requestedProvince
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
          buildSafety03D59()

      };

    }


    /*
     * ---------------------------------------------------------
     * FREEZE
     * ---------------------------------------------------------
     */

    const freezeAccess =
      readFreeze03D59();


    if (
      freezeAccess.ready !==
      true
    ) {

      return {

        version:
          VERSION,

        ready:
          false,

        passed:
          false,

        province:
          requestedProvince,

        reason:
          freezeAccess.reason,

        safety:
          buildSafety03D59()

      };

    }


    /*
     * ---------------------------------------------------------
     * DEPENDENCIES
     * ---------------------------------------------------------
     */

    const dependencies =
      inspectDependencies03D59();


    if (
      dependencies.ready !==
      true
    ) {

      return {

        version:
          VERSION,

        ready:
          false,

        passed:
          false,

        province:
          requestedProvince,

        reason:
          'RUNTIME_DEPENDENCY_NOT_READY',

        missingDependencies:
          dependencies.missing,

        safety:
          buildSafety03D59()

      };

    }


    /*
     * ---------------------------------------------------------
     * PROVINCE DATA
     * ---------------------------------------------------------
     */

    let draws;


    try {

      draws =
        getAllDrawsForProvince(
          requestedProvince
        );

    } catch (error) {

      return {

        version:
          VERSION,

        ready:
          false,

        passed:
          false,

        province:
          requestedProvince,

        reason:
          'PROVINCE_DATA_READ_FAILED',

        error:
          error &&
          error.message
            ? error.message
            : String(error),

        safety:
          buildSafety03D59()

      };

    }


    if (
      !Array.isArray(draws) ||
      !draws.length
    ) {

      return {

        version:
          VERSION,

        ready:
          false,

        passed:
          false,

        province:
          requestedProvince,

        reason:
          'PROVINCE_DATA_NOT_AVAILABLE',

        safety:
          buildSafety03D59()

      };

    }


    /*
     * ---------------------------------------------------------
     * EXECUTE EXACT FROZEN CONFIG
     * ---------------------------------------------------------
     */

    const freeze =
      freezeAccess.freeze;


    const prizeResults = {};


    PRIZES.forEach(
      prize => {

        prizeResults[
          prize
        ] =
          executePrize03D59(
            prize,
            freeze
              .prizeConfig[
                prize
              ],
            draws
          );

      }
    );


    const failedPrizes =
      PRIZES.filter(
        prize =>
          !prizeResults[
            prize
          ] ||
          prizeResults[
            prize
          ].ready !== true
      );


    const passed =
      failedPrizes.length ===
      0;


    const provinceInfo =
      (
        typeof provinceBySlug ===
          'function'
      )
        ? provinceBySlug(
            requestedProvince
          )
        : null;


    const result = {

      version:
        VERSION,

      ready:
        passed,

      passed,

      reason:
        passed
          ? 'SHADOW_FORECAST_READY'
          : 'ONE_OR_MORE_PRIZES_FAILED',

      mode:
        'SHADOW_EXECUTION',

      province:
        requestedProvince,

      provinceName:
        provinceInfo &&
        provinceInfo.name
          ? provinceInfo.name
          : requestedProvince,

      drawCount:
        draws.length,

      freezeVersion:
        freeze.version,

      freezeStatus:
        freeze.status,

      db: {

        executed:
          false,

        policy:
          'PRESERVE_EXISTING_DB_FULL6_PRODUCTION_PATH'

      },

      prizes:
        prizeResults,

      successfulPrizeCount:
        PRIZES.length -
        failedPrizes.length,

      failedPrizeCount:
        failedPrizes.length,

      failedPrizes:
        failedPrizes.slice(),

      /*
       * Future adapter activation must NOT treat
       * this field alone as write authorization.
       */

      productionAuthorized:
        false,

      safety:
        buildSafety03D59(),

      executedAt:
        new Date()
          .toISOString()

    };


    /*
     * Diagnostic RAM only.
     *
     * This alias is NOT LAST_FORECAST.
     */

    window
      .LAST_FIX03D59_PRODUCTION_ADAPTER_SHADOW =
      clone03D59(
        result
      );


    return result;

  }


  /*
   * =========================================================
   * SAFETY CONTRACT
   * =========================================================
   */

  function buildSafety03D59() {

    return {

      shadowOnly:
        true,

      engineExecutionAllowed:
        true,

      engineExecuted:
        true,

      readOnlyProductionState:
        true,

      productionWrite:
        false,

      storageWrite:
        false,

      renderForecastCalled:
        false,

      savePredictionCalled:
        false,

      lastForecastModified:
        false

    };

  }


  /*
   * =========================================================
   * PUBLIC API
   * =========================================================
   */

  window
    .runProductionForecastAdapterShadow03D59 =
    runProductionForecastAdapterShadow03D59;


  window
    .FIX03D59_PRODUCTION_FORECAST_ADAPTER_V1_VERSION =
    VERSION;


  window
    .FIX03D59_PRODUCTION_FORECAST_ADAPTER_V1_LOADED =
    true;


  console.log(
    'FIX-03D5.9 Production Forecast Adapter V1 loaded / SHADOW EXECUTION / ZERO PRODUCTION WRITE'
  );

})();
