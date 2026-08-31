/* =========================================================================
   FIX-03D5.9
   C5.1 G8 FEATURE ABLATION RESEARCH V1

   PURPOSE:
   - Measure contribution of each existing RECENT W60 feature.
   - G8 only.
   - Reference = RECENT W60 with all features.
   - Remove ONE feature at a time.
   - Renormalize remaining weights.
   - Evaluate on late temporal holdout.
   - Cross-province: all registered provinces.

   FEATURES:
   - frequency
   - recent
   - momentum
   - gan
   - cycle
   - headTail
   - stability

   OUTPUT:
   - Reference metrics
   - Metrics for every ablation
   - Delta vs reference
   - Province win/loss/tie
   - Mean / median province Quality delta
   - Best / worst province
   - Feature importance classification

   INTERPRETATION:
   - Removing feature makes performance WORSE:
       feature is useful.
   - Removing feature makes performance BETTER:
       feature may be noisy / harmful.
   - Near-zero change:
       feature may be redundant.

   SAFETY:
   - RESEARCH ONLY.
   - READ ONLY.
   - ZERO STORAGE WRITE.
   - ZERO PRODUCTION WRITE.
   - NO savePrediction().
   - NO LAST_FORECAST MODIFICATION.
   - NO MODEL MODIFICATION.
   - NO PRODUCTION ENGINE MODIFICATION.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_C51_G8_FEATURE_ABLATION_V1';


  const PRIZE =
    'g8';


  const WINDOW_SIZE =
    60;


  const MODEL_ID =
    'RECENT';


  const MINIMUM_TRAINING =
    30;


  const HOLDOUT_SIZE =
    30;


  const FEATURES = [

    'frequency',
    'recent',
    'momentum',
    'gan',
    'cycle',
    'headTail',
    'stability'

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


  function mean(
    values
  ) {

    if (
      !Array.isArray(values) ||
      !values.length
    ) {

      return 0;

    }


    return (
      values.reduce(
        (
          total,
          value
        ) =>
          total +
          safeNumber(value),
        0
      ) /
      values.length
    );

  }


  function median(
    values
  ) {

    if (
      !Array.isArray(values) ||
      !values.length
    ) {

      return 0;

    }


    const sorted =
      values
        .slice()
        .sort(
          (a, b) =>
            a - b
        );


    const middle =
      Math.floor(
        sorted.length /
        2
      );


    if (
      sorted.length %
        2
    ) {

      return sorted[
        middle
      ];

    }


    return (
      sorted[
        middle - 1
      ] +
      sorted[
        middle
      ]
    ) / 2;

  }


  /*
   * =========================================================
   * RECENT CONFIG
   * =========================================================
   */

  function getRecentConfigC51() {

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
        config =>
          config &&
          String(
            config.id
          ).toUpperCase() ===
          MODEL_ID
      ) ||
      null;

  }


  /*
   * =========================================================
   * BUILD ABLATED WEIGHTS
   * =========================================================
   */

  function buildAblatedWeightsC51(
    originalWeights,
    removedFeature
  ) {

    const weights = {};


    let remainingTotal =
      0;


    FEATURES.forEach(
      feature => {

        const value =
          safeNumber(
            originalWeights[
              feature
            ]
          );


        if (
          feature ===
          removedFeature
        ) {

          weights[
            feature
          ] = 0;

          return;

        }


        weights[
          feature
        ] = value;

        remainingTotal +=
          value;

      }
    );


    if (
      remainingTotal <= 0
    ) {

      return null;

    }


    /*
     * Renormalize remaining features to 1.
     */

    FEATURES.forEach(
      feature => {

        if (
          feature ===
          removedFeature
        ) {

          weights[
            feature
          ] = 0;

          return;

        }


        weights[
          feature
        ] =
          weights[
            feature
          ] /
          remainingTotal;

      }
    );


    return weights;

  }


  /*
   * =========================================================
   * METRIC
   * =========================================================
   */

  function createMetricC51() {

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


  function updateMetricC51(
    metric,
    actual,
    ranking
  ) {

    metric.tests++;


    if (
      !Array.isArray(actual) ||
      !Array.isArray(ranking)
    ) {

      return;

    }


    let bestRank =
      Infinity;


    actual.forEach(
      number => {

        const index =
          ranking.indexOf(
            number
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


  function finalizeMetricC51(
    metric
  ) {

    const tests =
      metric.tests;


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


    /*
     * Same Quality philosophy as V2.3.
     */

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


  /*
   * =========================================================
   * RANKING
   * =========================================================
   */

  function buildRankingC51(
    trainingDraws,
    weights
  ) {

    const scores =
      modelLabScoresV23(
        trainingDraws,
        PRIZE,
        WINDOW_SIZE,
        weights
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
   * DELTA
   *
   * Positive delta means ABLATION is better.
   * Negative delta means removing feature hurts.
   * =========================================================
   */

  function metricDeltaC51(
    ablation,
    reference
  ) {

    return {

      quality:
        ablation.quality -
        reference.quality,

      hit1:
        ablation.hit1Rate -
        reference.hit1Rate,

      hit3:
        ablation.hit3Rate -
        reference.hit3Rate,

      hit5:
        ablation.hit5Rate -
        reference.hit5Rate,

      hit10:
        ablation.hit10Rate -
        reference.hit10Rate,

      mrr:
        ablation.mrr -
        reference.mrr,

      /*
       * Positive = ablation rank better.
       */

      averageRank:
        reference.averageRank -
        ablation.averageRank

    };

  }


  /*
   * =========================================================
   * ONE PROVINCE
   * =========================================================
   */

  function evaluateProvinceC51(
    province
  ) {

    const recentConfig =
      getRecentConfigC51();


    if (
      !recentConfig ||
      !recentConfig.weights
    ) {

      return {

        ready:
          false,

        province:
          province.slug,

        provinceName:
          province.name,

        reason:
          'RECENT_CONFIG_NOT_AVAILABLE'

      };

    }


    const draws =
      getAllDrawsForProvince(
        province.slug
      )
        .slice()
        .reverse();


    if (
      draws.length <=
      MINIMUM_TRAINING +
      HOLDOUT_SIZE
    ) {

      return {

        ready:
          false,

        province:
          province.slug,

        provinceName:
          province.name,

        reason:
          'INSUFFICIENT_HISTORY',

        drawCount:
          draws.length

      };

    }


    const holdoutStart =
      draws.length -
      HOLDOUT_SIZE;


    const referenceMetric =
      createMetricC51();


    const ablationMetrics = {};


    FEATURES.forEach(
      feature => {

        ablationMetrics[
          feature
        ] =
          createMetricC51();

      }
    );


    /*
     * ---------------------------------------------------------
     * Late temporal HOLDOUT only.
     *
     * Every target uses all history before target,
     * but never target/future results.
     * ---------------------------------------------------------
     */

    for (
      let targetIndex =
        holdoutStart;
      targetIndex <
        draws.length;
      targetIndex++
    ) {

      const trainingChronological =
        draws.slice(
          0,
          targetIndex
        );


      const trainingDraws =
        trainingChronological
          .slice()
          .reverse();


      const targetDraw =
        draws[
          targetIndex
        ];


      const actual =
        loOfPrize(
          targetDraw,
          PRIZE
        );


      /*
       * Full RECENT W60 reference.
       */

      const referenceRanking =
        buildRankingC51(
          trainingDraws,
          recentConfig.weights
        );


      updateMetricC51(
        referenceMetric,
        actual,
        referenceRanking
      );


      /*
       * Remove each feature separately.
       */

      FEATURES.forEach(
        feature => {

          const weights =
            buildAblatedWeightsC51(
              recentConfig.weights,
              feature
            );


          if (!weights) {

            return;

          }


          const ranking =
            buildRankingC51(
              trainingDraws,
              weights
            );


          updateMetricC51(
            ablationMetrics[
              feature
            ],
            actual,
            ranking
          );

        }
      );

    }


    const reference =
      finalizeMetricC51(
        referenceMetric
      );


    const ablations = {};


    FEATURES.forEach(
      feature => {

        const metric =
          finalizeMetricC51(
            ablationMetrics[
              feature
            ]
          );


        ablations[
          feature
        ] = {

          feature,

          metric,

          delta:
            metricDeltaC51(
              metric,
              reference
            )

        };

      }
    );


    return {

      ready:
        true,

      province:
        province.slug,

      provinceName:
        province.name,

      drawCount:
        draws.length,

      holdoutTests:
        reference.tests,

      reference,

      ablations

    };

  }


  /*
   * =========================================================
   * AGGREGATE METRIC
   * =========================================================
   */

  function aggregateMetricsC51(
    provinceResults,
    getter
  ) {

    let tests =
      0;

    let hit1 =
      0;

    let hit3 =
      0;

    let hit5 =
      0;

    let hit10 =
      0;

    let mrr =
      0;

    let averageRank =
      0;

    let quality =
      0;


    provinceResults.forEach(
      result => {

        const metric =
          getter(
            result
          );


        const count =
          metric.tests;


        tests +=
          count;

        hit1 +=
          metric.hit1Rate *
          count;

        hit3 +=
          metric.hit3Rate *
          count;

        hit5 +=
          metric.hit5Rate *
          count;

        hit10 +=
          metric.hit10Rate *
          count;

        mrr +=
          metric.mrr *
          count;

        averageRank +=
          metric.averageRank *
          count;

        quality +=
          metric.quality *
          count;

      }
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


    return {

      tests,

      hit1Rate:
        hit1 /
        tests,

      hit3Rate:
        hit3 /
        tests,

      hit5Rate:
        hit5 /
        tests,

      hit10Rate:
        hit10 /
        tests,

      mrr:
        mrr /
        tests,

      averageRank:
        averageRank /
        tests,

      quality:
        quality /
        tests

    };

  }


  /*
   * =========================================================
   * FEATURE CLASSIFICATION
   * =========================================================
   *
   * Remember:
   *
   * delta < 0:
   * removing feature makes model worse
   * -> feature contributes useful information.
   *
   * delta > 0:
   * removing feature makes model better
   * -> feature may be noise / harmful.
   * =========================================================
   */

  function classifyFeatureC51(
    item
  ) {

    const q =
      item.delta.quality;


    const medianQ =
      item.medianProvinceQualityDelta;


    const negativeRate =
      item.provinceLossRate;


    /*
     * Strong evidence that removing feature hurts.
     */

    if (
      q <= -0.002 &&
      medianQ < 0 &&
      negativeRate >= 0.60
    ) {

      return 'IMPORTANT';

    }


    if (
      q < 0 &&
      medianQ <= 0 &&
      negativeRate >= 0.50
    ) {

      return 'USEFUL';

    }


    /*
     * Removing feature improves aggregate and
     * improves majority of provinces.
     */

    if (
      q >= 0.002 &&
      medianQ > 0 &&
      item.provinceWinRate >=
        0.60
    ) {

      return 'POSSIBLY_HARMFUL';

    }


    if (
      q > 0 &&
      medianQ >= 0 &&
      item.provinceWinRate >=
        0.50
    ) {

      return 'REDUNDANT_OR_NOISY';

    }


    return 'MIXED';

  }


  /*
   * =========================================================
   * RUN ALL PROVINCES
   * =========================================================
   */

  function runFeatureAblationC51() {

    if (
      typeof PROVINCES ===
        'undefined' ||
      !Array.isArray(
        PROVINCES
      ) ||
      !PROVINCES.length
    ) {

      return {

        ready:
          false,

        reason:
          'PROVINCES_NOT_AVAILABLE'

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


    const allResults =
      PROVINCES.map(
        province =>
          evaluateProvinceC51(
            province
          )
      );


    const valid =
      allResults.filter(
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
          'NO_VALID_PROVINCES',

        results:
          allResults

      };

    }


    const reference =
      aggregateMetricsC51(
        valid,
        result =>
          result.reference
      );


    const featureResults = [];


    FEATURES.forEach(
      feature => {

        const metric =
          aggregateMetricsC51(
            valid,
            result =>
              result
                .ablations[
                  feature
                ]
                .metric
          );


        const delta =
          metricDeltaC51(
            metric,
            reference
          );


        const provinceDeltas =
          valid.map(
            result => ({

              province:
                result.province,

              provinceName:
                result.provinceName,

              delta:
                result
                  .ablations[
                    feature
                  ]
                  .delta
                  .quality

            })
          );


        const wins =
          provinceDeltas.filter(
            item =>
              item.delta > 0
          ).length;


        const losses =
          provinceDeltas.filter(
            item =>
              item.delta < 0
          ).length;


        const ties =
          provinceDeltas.length -
          wins -
          losses;


        const values =
          provinceDeltas.map(
            item =>
              item.delta
          );


        const sorted =
          provinceDeltas
            .slice()
            .sort(
              (a, b) =>
                a.delta -
                b.delta
            );


        const item = {

          feature,

          metric,

          delta,

          provinceWins:
            wins,

          provinceLosses:
            losses,

          provinceTies:
            ties,

          provinceWinRate:
            valid.length
              ? wins /
                valid.length
              : 0,

          provinceLossRate:
            valid.length
              ? losses /
                valid.length
              : 0,

          meanProvinceQualityDelta:
            mean(
              values
            ),

          medianProvinceQualityDelta:
            median(
              values
            ),

          worstProvince:
            sorted[0] ||
            null,

          bestProvince:
            sorted[
              sorted.length -
              1
            ] ||
            null

        };


        item.classification =
          classifyFeatureC51(
            item
          );


        featureResults.push(
          item
        );

      }
    );


    /*
     * Most useful feature first:
     * removing it causes the largest
     * Quality deterioration.
     */

    featureResults.sort(
      (a, b) =>
        a.delta.quality -
        b.delta.quality
    );


    const result = {

      version:
        VERSION,

      ready:
        true,

      reason:
        'C51_FEATURE_ABLATION_READY',

      prize:
        PRIZE,

      model:
        MODEL_ID,

      windowSize:
        WINDOW_SIZE,

      holdoutSize:
        HOLDOUT_SIZE,

      provinceCount:
        valid.length,

      reference,

      features:
        featureResults,

      provinceResults:
        valid,

      rejectedResults:
        allResults.filter(
          result =>
            !result ||
            result.ready !== true
        ),

      interpretation: {

        negativeDelta:
          'REMOVING_FEATURE_HURTS_MODEL',

        positiveDelta:
          'REMOVING_FEATURE_IMPROVES_MODEL'

      },

      importantNote:
        'FEATURE_ABLATION_RESEARCH_ONLY',

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
          false,

        futureLeakage:
          false

      },

      inspectedAt:
        new Date()
          .toISOString()

    };


    window
      .LAST_FIX03D59_C51_FEATURE_ABLATION =
      result;


    return result;

  }


  /*
   * =========================================================
   * PUBLIC API
   * =========================================================
   */

  window
    .runFix03D59C51FeatureAblation =
    runFeatureAblationC51;


  window
    .evaluateProvinceC51FeatureAblation =
    evaluateProvinceC51;


  window
    .FIX03D59_C51_FEATURE_ABLATION_VERSION =
    VERSION;


  window
    .FIX03D59_C51_FEATURE_ABLATION_LOADED =
    true;


  console.log(
    'FIX-03D5.9 C5.1 G8 Feature Ablation V1 loaded / TEMPORAL HOLDOUT / READ ONLY'
  );

})();
