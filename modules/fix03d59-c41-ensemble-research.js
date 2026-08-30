/* =========================================================================
   FIX-03D5.9
   C4.1 EQUAL-RANK ENSEMBLE RESEARCH V1

   PURPOSE:
   - Research whether consensus across the existing V2.3 models
     improves ranking quality over BASELINE W30.
   - Use ALL existing research models:
       BASELINE
       RECENT
       FREQUENCY
       BALANCED
       CYCLE
   - Convert every model to a 00 -> 99 ranking.
   - Combine rankings using equal-weight Borda consensus.
   - Walk-forward only.
   - No future leakage.

   METRICS:
   - Hit@1
   - Hit@3
   - Hit@5
   - Hit@10
   - MRR
   - Average Rank
   - Quality
   - Per-province comparison vs BASELINE W30

   IMPORTANT:
   - G1 -> G8 ONLY.
   - DB Full-6 is NOT evaluated here.
   - READ ONLY.
   - ZERO PRODUCTION WRITE.
   - ZERO STORAGE WRITE.
   - NO savePrediction().
   - NO LAST_FORECAST MODIFICATION.
   - NO MODEL MODIFICATION.
   - NO PRODUCTION ENGINE MODIFICATION.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_C41_EQUAL_RANK_ENSEMBLE_RESEARCH_V1';


  const WINDOW_SIZE =
    30;


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

  function safeNumber(
    value,
    fallback = 0
  ) {

    const n =
      Number(
        value
      );


    return Number.isFinite(n)
      ? n
      : fallback;

  }


  function createMetric() {

    return {

      tests:
        0,

      hit1:
        0,

      hit3:
        0,

      hit5:
        0,

      hit10:
        0,

      reciprocalRank:
        0,

      rankSum:
        0,

      rankedHits:
        0

    };

  }


  function updateMetric(
    metric,
    actualNumbers,
    ranking
  ) {

    metric.tests++;


    if (
      !Array.isArray(
        actualNumbers
      ) ||
      !actualNumbers.length ||
      !Array.isArray(
        ranking
      ) ||
      !ranking.length
    ) {

      return;

    }


    let bestRank =
      Infinity;


    actualNumbers.forEach(
      actual => {

        const index =
          ranking.indexOf(
            actual
          );


        if (
          index >= 0
        ) {

          bestRank =
            Math.min(
              bestRank,
              index + 1
            );

        }

      }
    );


    if (
      bestRank ===
      Infinity
    ) {

      return;

    }


    metric.rankedHits++;

    metric.rankSum +=
      bestRank;

    metric.reciprocalRank +=
      1 /
      bestRank;


    if (
      bestRank <= 1
    ) {

      metric.hit1++;

    }


    if (
      bestRank <= 3
    ) {

      metric.hit3++;

    }


    if (
      bestRank <= 5
    ) {

      metric.hit5++;

    }


    if (
      bestRank <= 10
    ) {

      metric.hit10++;

    }

  }


  function finalizeMetric(
    metric
  ) {

    const tests =
      safeNumber(
        metric.tests
      );


    if (!tests) {

      return {

        tests:
          0,

        hit1Rate:
          0,

        hit3Rate:
          0,

        hit5Rate:
          0,

        hit10Rate:
          0,

        mrr:
          0,

        averageRank:
          100,

        quality:
          0

      };

    }


    const result = {

      tests,

      hit1:
        metric.hit1,

      hit3:
        metric.hit3,

      hit5:
        metric.hit5,

      hit10:
        metric.hit10,

      hit1Rate:
        metric.hit1 /
        tests,

      hit3Rate:
        metric.hit3 /
        tests,

      hit5Rate:
        metric.hit5 /
        tests,

      hit10Rate:
        metric.hit10 /
        tests,

      mrr:
        metric.reciprocalRank /
        tests,

      averageRank:
        metric.rankedHits
          ? (
              metric.rankSum /
              metric.rankedHits
            )
          : 100

    };


    /*
     * Same Quality philosophy as V2.3:
     * Top1 + Top3 + MRR + Rank Quality.
     */

    const rankQuality =
      Math.max(
        0,
        Math.min(
          1,
          1 -
          (
            result.averageRank -
            1
          ) /
          99
        )
      );


    result.quality =

      result.hit1Rate *
        0.35 +

      result.hit3Rate *
        0.30 +

      result.mrr *
        0.25 +

      rankQuality *
        0.10;


    return result;

  }


  function getModelConfigs() {

    if (
      typeof MODEL_LAB_V23_CONFIGS ===
        'undefined' ||
      !Array.isArray(
        MODEL_LAB_V23_CONFIGS
      )
    ) {

      return [];

    }


    return MODEL_LAB_V23_CONFIGS
      .filter(
        config =>
          config &&
          config.id &&
          config.weights
      );

  }


  function baselineConfig() {

    return getModelConfigs()
      .find(
        config =>
          String(
            config.id
          ).toUpperCase() ===
          'BASELINE'
      ) ||
      null;

  }


  /*
   * =========================================================
   * BUILD ONE MODEL RANKING
   * =========================================================
   */

  function buildModelRanking(
    trainingDraws,
    prize,
    config
  ) {

    const scores =
      modelLabScoresV23(
        trainingDraws,
        prize,
        WINDOW_SIZE,
        config.weights
      );


    return rankedNumbers(
      scores
    )
      .map(
        item =>
          item[0]
      );

  }


  /*
   * =========================================================
   * EQUAL-WEIGHT BORDA ENSEMBLE
   * =========================================================
   *
   * Rank 1   -> 100 points
   * Rank 2   ->  99 points
   * ...
   * Rank 100 ->   1 point
   *
   * All models receive equal voting power.
   * =========================================================
   */

  function buildEnsembleRanking(
    trainingDraws,
    prize
  ) {

    const configs =
      getModelConfigs();


    if (
      !configs.length
    ) {

      return [];

    }


    const consensus = {};


    for (
      let i = 0;
      i < 100;
      i++
    ) {

      const number =
        String(i)
          .padStart(
            2,
            '0'
          );


      consensus[number] =
        0;

    }


    configs.forEach(
      config => {

        const ranking =
          buildModelRanking(
            trainingDraws,
            prize,
            config
          );


        ranking.forEach(
          (
            number,
            index
          ) => {

            /*
             * index 0 -> 100
             * index 99 -> 1
             */

            const points =
              100 -
              index;


            consensus[number] +=
              points;

          }
        );

      }
    );


    return Object
      .entries(
        consensus
      )
      .sort(
        (a, b) => {

          if (
            b[1] !==
            a[1]
          ) {

            return (
              b[1] -
              a[1]
            );

          }


          /*
           * Deterministic tie-break.
           */

          return a[0]
            .localeCompare(
              b[0]
            );

        }
      )
      .map(
        item =>
          item[0]
      );

  }


  /*
   * =========================================================
   * WALK-FORWARD ONE PROVINCE / ONE PRIZE
   * =========================================================
   */

  function backtestProvincePrizeC41(
    provinceSlug,
    prize
  ) {

    if (
      !PRIZES.includes(
        prize
      )
    ) {

      return {

        ready:
          false,

        reason:
          'INVALID_PRIZE'

      };

    }


    if (
      typeof getAllDrawsForProvince !==
        'function' ||
      typeof modelLabScoresV23 !==
        'function' ||
      typeof rankedNumbers !==
        'function' ||
      typeof loOfPrize !==
        'function'
    ) {

      return {

        ready:
          false,

        reason:
          'DEPENDENCY_NOT_AVAILABLE'

      };

    }


    const baseline =
      baselineConfig();


    if (!baseline) {

      return {

        ready:
          false,

        reason:
          'BASELINE_CONFIG_NOT_AVAILABLE'

      };

    }


    /*
     * getAllDrawsForProvince:
     * newest -> oldest.
     *
     * Walk-forward:
     * oldest -> newest.
     */

    const draws =
      getAllDrawsForProvince(
        provinceSlug
      )
        .slice()
        .reverse();


    const minimumTraining =
      30;


    if (
      draws.length <=
      minimumTraining
    ) {

      return {

        ready:
          false,

        reason:
          'INSUFFICIENT_HISTORY',

        drawCount:
          draws.length

      };

    }


    const baselineMetric =
      createMetric();


    const ensembleMetric =
      createMetric();


    const cases = [];


    for (
      let targetIndex =
        minimumTraining;
      targetIndex <
        draws.length;
      targetIndex++
    ) {

      /*
       * Absolutely no future leakage.
       */

      const trainingChronological =
        draws.slice(
          0,
          targetIndex
        );


      /*
       * Existing scoring engine expects
       * newest -> oldest.
       */

      const trainingDraws =
        trainingChronological
          .slice()
          .reverse();


      const actualDraw =
        draws[
          targetIndex
        ];


      const actual =
        loOfPrize(
          actualDraw,
          prize
        );


      /*
       * BASELINE W30
       */

      const baselineRanking =
        buildModelRanking(
          trainingDraws,
          prize,
          baseline
        );


      /*
       * 5-model equal-rank consensus.
       */

      const ensembleRanking =
        buildEnsembleRanking(
          trainingDraws,
          prize
        );


      updateMetric(
        baselineMetric,
        actual,
        baselineRanking
      );


      updateMetric(
        ensembleMetric,
        actual,
        ensembleRanking
      );


      /*
       * Diagnostic case data only.
       */

      let baselineBestRank =
        Infinity;

      let ensembleBestRank =
        Infinity;


      actual.forEach(
        number => {

          const baselineIndex =
            baselineRanking.indexOf(
              number
            );


          if (
            baselineIndex >= 0
          ) {

            baselineBestRank =
              Math.min(
                baselineBestRank,
                baselineIndex + 1
              );

          }


          const ensembleIndex =
            ensembleRanking.indexOf(
              number
            );


          if (
            ensembleIndex >= 0
          ) {

            ensembleBestRank =
              Math.min(
                ensembleBestRank,
                ensembleIndex + 1
              );

          }

        }
      );


      cases.push({

        date:
          actualDraw.date,

        baselineRank:
          baselineBestRank ===
            Infinity
              ? null
              : baselineBestRank,

        ensembleRank:
          ensembleBestRank ===
            Infinity
              ? null
              : ensembleBestRank

      });

    }


    const baselineResult =
      finalizeMetric(
        baselineMetric
      );


    const ensembleResult =
      finalizeMetric(
        ensembleMetric
      );


    return {

      ready:
        true,

      province:
        provinceSlug,

      provinceName:
        (
          typeof provinceBySlug ===
            'function' &&
          provinceBySlug(
            provinceSlug
          )
        )
          ? provinceBySlug(
              provinceSlug
            ).name
          : provinceSlug,

      prize,

      windowSize:
        WINDOW_SIZE,

      tested:
        ensembleResult.tests,

      baseline:
        baselineResult,

      ensemble:
        ensembleResult,

      delta: {

        quality:
          ensembleResult.quality -
          baselineResult.quality,

        hit1:
          ensembleResult.hit1Rate -
          baselineResult.hit1Rate,

        hit3:
          ensembleResult.hit3Rate -
          baselineResult.hit3Rate,

        hit5:
          ensembleResult.hit5Rate -
          baselineResult.hit5Rate,

        hit10:
          ensembleResult.hit10Rate -
          baselineResult.hit10Rate,

        mrr:
          ensembleResult.mrr -
          baselineResult.mrr,

        averageRank:
          baselineResult.averageRank -
          ensembleResult.averageRank

      },

      cases

    };

  }


  /*
   * =========================================================
   * AGGREGATE ALL PROVINCES — ONE PRIZE
   * =========================================================
   */

  function benchmarkPrizeAllProvincesC41(
    prize
  ) {

    if (
      typeof PROVINCES ===
        'undefined' ||
      !Array.isArray(
        PROVINCES
      )
    ) {

      return {

        ready:
          false,

        reason:
          'PROVINCES_NOT_AVAILABLE'

      };

    }


    const results = [];


    PROVINCES.forEach(
      province => {

        results.push(
          backtestProvincePrizeC41(
            province.slug,
            prize
          )
        );

      }
    );


    const valid =
      results.filter(
        result =>
          result &&
          result.ready === true
      );


    if (
      !valid.length
    ) {

      return {

        ready:
          false,

        reason:
          'NO_VALID_RESULTS',

        results

      };

    }


    function weightedMetric(
      source,
      key
    ) {

      let total =
        0;

      let tested =
        0;


      valid.forEach(
        result => {

          const count =
            safeNumber(
              result[source].tests
            );


          total +=
            safeNumber(
              result[source][key]
            ) *
            count;


          tested +=
            count;

        }
      );


      return tested
        ? total /
          tested
        : 0;

    }


    const baseline = {

      tests:
        valid.reduce(
          (
            sum,
            result
          ) =>
            sum +
            result.baseline.tests,
          0
        ),

      hit1Rate:
        weightedMetric(
          'baseline',
          'hit1Rate'
        ),

      hit3Rate:
        weightedMetric(
          'baseline',
          'hit3Rate'
        ),

      hit5Rate:
        weightedMetric(
          'baseline',
          'hit5Rate'
        ),

      hit10Rate:
        weightedMetric(
          'baseline',
          'hit10Rate'
        ),

      mrr:
        weightedMetric(
          'baseline',
          'mrr'
        ),

      averageRank:
        weightedMetric(
          'baseline',
          'averageRank'
        ),

      quality:
        weightedMetric(
          'baseline',
          'quality'
        )

    };


    const ensemble = {

      tests:
        valid.reduce(
          (
            sum,
            result
          ) =>
            sum +
            result.ensemble.tests,
          0
        ),

      hit1Rate:
        weightedMetric(
          'ensemble',
          'hit1Rate'
        ),

      hit3Rate:
        weightedMetric(
          'ensemble',
          'hit3Rate'
        ),

      hit5Rate:
        weightedMetric(
          'ensemble',
          'hit5Rate'
        ),

      hit10Rate:
        weightedMetric(
          'ensemble',
          'hit10Rate'
        ),

      mrr:
        weightedMetric(
          'ensemble',
          'mrr'
        ),

      averageRank:
        weightedMetric(
          'ensemble',
          'averageRank'
        ),

      quality:
        weightedMetric(
          'ensemble',
          'quality'
        )

    };


    const provinceWins =
      valid.filter(
        result =>
          result.delta.quality >
          0
      ).length;


    const provinceLosses =
      valid.filter(
        result =>
          result.delta.quality <
          0
      ).length;


    const provinceTies =
      valid.length -
      provinceWins -
      provinceLosses;


    const finalResult = {

      version:
        VERSION,

      ready:
        true,

      reason:
        'C41_ENSEMBLE_BENCHMARK_READY',

      prize,

      windowSize:
        WINDOW_SIZE,

      provinceCount:
        valid.length,

      baseline,

      ensemble,

      delta: {

        quality:
          ensemble.quality -
          baseline.quality,

        hit1:
          ensemble.hit1Rate -
          baseline.hit1Rate,

        hit3:
          ensemble.hit3Rate -
          baseline.hit3Rate,

        hit5:
          ensemble.hit5Rate -
          baseline.hit5Rate,

        hit10:
          ensemble.hit10Rate -
          baseline.hit10Rate,

        mrr:
          ensemble.mrr -
          baseline.mrr,

        averageRank:
          baseline.averageRank -
          ensemble.averageRank

      },

      provinceQualityWins:
        provinceWins,

      provinceQualityLosses:
        provinceLosses,

      provinceQualityTies:
        provinceTies,

      results,

      safety: {

        readOnly:
          true,

        productionWrite:
          false,

        storageWrite:
          false,

        savePredictionCalled:
          false,

        lastForecastModified:
          false

      },

      inspectedAt:
        new Date()
          .toISOString()

    };


    window
      .LAST_FIX03D59_C41_ENSEMBLE =
      finalResult;


    return finalResult;

  }


  /*
   * =========================================================
   * PUBLIC API
   * =========================================================
   */

  window
    .backtestProvincePrizeC41 =
    backtestProvincePrizeC41;


  window
    .benchmarkPrizeAllProvincesC41 =
    benchmarkPrizeAllProvincesC41;


  window
    .FIX03D59_C41_ENSEMBLE_RESEARCH_VERSION =
    VERSION;


  window
    .FIX03D59_C41_ENSEMBLE_RESEARCH_LOADED =
    true;


  console.log(
    'FIX-03D5.9 C4.1 Equal-Rank Ensemble Research V1 loaded / READ ONLY'
  );

})();
