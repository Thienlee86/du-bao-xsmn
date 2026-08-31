/* =========================================================================
   FIX-03D5.9
   C6.3 G8 REGIME DETECTION RESEARCH V1

   PURPOSE:
   - Research whether G8 statistical regimes contain useful information.
   - Reference model: RECENT W60.
   - Detect regime using ONLY information available before each target draw.
   - Late temporal holdout.
   - Cross-province robustness analysis.
   - NO model switching in V1.
   - NO ranking modification in V1.

   REGIME FEATURES:
   1. Entropy
   2. Concentration
   3. Short / Long Divergence
   4. Rank Volatility
   5. Hot / Cold Spread

   REGIMES:
   - STABLE
   - CONCENTRATED
   - VOLATILE
   - SHIFTING

   IMPORTANT:
   - G8 ONLY.
   - RESEARCH ONLY.
   - WALK-FORWARD / ZERO FUTURE LEAKAGE.
   - READ ONLY.
   - ZERO STORAGE WRITE.
   - ZERO PRODUCTION WRITE.
   - NO LAST_FORECAST MODIFICATION.
   - NO savePrediction().
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_C63_G8_REGIME_DETECTION_V1';


  const PRIZE =
    'g8';


  const REFERENCE_MODEL =
    'RECENT';


  const REFERENCE_WINDOW =
    60;


  const HOLDOUT_SIZE =
    30;


  const REGIMES = [
    'STABLE',
    'CONCENTRATED',
    'VOLATILE',
    'SHIFTING'
  ];


  /*
   * =========================================================
   * BASIC HELPERS
   * =========================================================
   */

  function safeNumber(
    value,
    fallback = 0
  ) {

    const n =
      Number(value);


    return Number.isFinite(n)
      ? n
      : fallback;

  }


  function meanC63(
    values
  ) {

    const valid =
      values.filter(
        value =>
          Number.isFinite(
            Number(value)
          )
      );


    if (
      !valid.length
    ) {

      return 0;

    }


    return valid.reduce(
      (
        sum,
        value
      ) =>
        sum +
        Number(value),
      0
    ) /
    valid.length;

  }


  function medianC63(
    values
  ) {

    const valid =
      values
        .map(Number)
        .filter(
          Number.isFinite
        )
        .sort(
          (a, b) =>
            a - b
        );


    if (
      !valid.length
    ) {

      return 0;

    }


    const middle =
      Math.floor(
        valid.length / 2
      );


    if (
      valid.length % 2
    ) {

      return valid[
        middle
      ];

    }


    return (
      valid[
        middle - 1
      ] +
      valid[
        middle
      ]
    ) / 2;

  }


  function stdC63(
    values
  ) {

    if (
      !values.length
    ) {

      return 0;

    }


    const avg =
      meanC63(
        values
      );


    const variance =
      meanC63(
        values.map(
          value => {

            const diff =
              value - avg;


            return (
              diff *
              diff
            );

          }
        )
      );


    return Math.sqrt(
      variance
    );

  }


  function clamp01C63(
    value
  ) {

    return Math.max(
      0,
      Math.min(
        1,
        safeNumber(
          value
        )
      )
    );

  }


  /*
   * =========================================================
   * REFERENCE MODEL CONFIG
   * =========================================================
   */

  function getReferenceConfigC63() {

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
          REFERENCE_MODEL
      ) ||
      null;

  }


  /*
   * =========================================================
   * NUMBER EXTRACTION
   * =========================================================
   */

  function getG8NumbersC63(
    draws
  ) {

    const numbers = [];


    draws.forEach(
      draw => {

        const values =
          loOfPrize(
            draw,
            PRIZE
          );


        if (
          Array.isArray(
            values
          )
        ) {

          values.forEach(
            value => {

              const normalized =
                String(value)
                  .padStart(
                    2,
                    '0'
                  )
                  .slice(
                    -2
                  );


              if (
                /^\d{2}$/
                  .test(
                    normalized
                  )
              ) {

                numbers.push(
                  normalized
                );

              }

            }
          );

        }

      }
    );


    return numbers;

  }


  /*
   * =========================================================
   * DISTRIBUTION
   * =========================================================
   */

  function buildDistributionC63(
    numbers
  ) {

    const counts = {};


    for (
      let i = 0;
      i < 100;
      i++
    ) {

      counts[
        String(i)
          .padStart(
            2,
            '0'
          )
      ] = 0;

    }


    numbers.forEach(
      number => {

        if (
          Object.prototype
            .hasOwnProperty
            .call(
              counts,
              number
            )
        ) {

          counts[number]++;

        }

      }
    );


    const total =
      numbers.length;


    const probabilities = {};


    Object.keys(
      counts
    )
      .forEach(
        key => {

          probabilities[key] =
            total
              ? (
                  counts[key] /
                  total
                )
              : 0;

        }
      );


    return {

      total,

      counts,

      probabilities

    };

  }


  /*
   * =========================================================
   * FEATURE 1 — NORMALIZED ENTROPY
   * =========================================================
   */

  function entropyC63(
    distribution
  ) {

    if (
      !distribution ||
      !distribution.total
    ) {

      return 0;

    }


    let entropy =
      0;


    Object.values(
      distribution
        .probabilities
    )
      .forEach(
        probability => {

          if (
            probability > 0
          ) {

            entropy -=
              probability *
              Math.log(
                probability
              );

          }

        }
      );


    const maxEntropy =
      Math.log(
        100
      );


    return maxEntropy
      ? clamp01C63(
          entropy /
          maxEntropy
        )
      : 0;

  }


  /*
   * =========================================================
   * FEATURE 2 — CONCENTRATION
   *
   * Share of observations represented by top 10 numbers.
   * Normalized relative to uniform expectation.
   * =========================================================
   */

  function concentrationC63(
    distribution
  ) {

    if (
      !distribution ||
      !distribution.total
    ) {

      return 0;

    }


    const sorted =
      Object.values(
        distribution.counts
      )
        .sort(
          (a, b) =>
            b - a
        );


    const top10 =
      sorted
        .slice(
          0,
          10
        )
        .reduce(
          (
            sum,
            value
          ) =>
            sum + value,
          0
        );


    const raw =
      top10 /
      distribution.total;


    /*
     * Uniform top-10 expectation ≈ 0.10.
     * 1.00 is theoretical maximum.
     */

    return clamp01C63(
      (
        raw -
        0.10
      ) /
      0.90
    );

  }


  /*
   * =========================================================
   * FEATURE 3 — SHORT / LONG DIVERGENCE
   *
   * Total variation distance between W10 and W60.
   * =========================================================
   */

  function divergenceC63(
    shortDistribution,
    longDistribution
  ) {

    let distance =
      0;


    for (
      let i = 0;
      i < 100;
      i++
    ) {

      const key =
        String(i)
          .padStart(
            2,
            '0'
          );


      distance +=
        Math.abs(
          safeNumber(
            shortDistribution
              .probabilities[key]
          ) -
          safeNumber(
            longDistribution
              .probabilities[key]
          )
        );

    }


    return clamp01C63(
      distance / 2
    );

  }


  /*
   * =========================================================
   * FEATURE 4 — RANK VOLATILITY
   *
   * Compare frequency ranks of two adjacent recent windows.
   * Normalized mean rank displacement.
   * =========================================================
   */

  function frequencyRankingC63(
    distribution
  ) {

    return Object
      .entries(
        distribution.counts
      )
      .sort(
        (
          a,
          b
        ) => {

          if (
            b[1] !==
            a[1]
          ) {

            return (
              b[1] -
              a[1]
            );

          }


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


  function rankVolatilityC63(
    recentDraws
  ) {

    if (
      recentDraws.length <
      20
    ) {

      return 0;

    }


    const latest10 =
      recentDraws.slice(
        0,
        10
      );


    const previous10 =
      recentDraws.slice(
        10,
        20
      );


    const distA =
      buildDistributionC63(
        getG8NumbersC63(
          latest10
        )
      );


    const distB =
      buildDistributionC63(
        getG8NumbersC63(
          previous10
        )
      );


    const rankA =
      frequencyRankingC63(
        distA
      );


    const rankB =
      frequencyRankingC63(
        distB
      );


    const positionsB = {};


    rankB.forEach(
      (
        number,
        index
      ) => {

        positionsB[number] =
          index;

      }
    );


    const displacement =
      rankA.map(
        (
          number,
          index
        ) =>
          Math.abs(
            index -
            safeNumber(
              positionsB[number],
              99
            )
          )
      );


    return clamp01C63(
      meanC63(
        displacement
      ) /
      99
    );

  }


  /*
   * =========================================================
   * FEATURE 5 — HOT / COLD SPREAD
   *
   * Difference between mean count of top 10 and bottom 10
   * relative to maximum observed count.
   * =========================================================
   */

  function hotColdSpreadC63(
    distribution
  ) {

    if (
      !distribution ||
      !distribution.total
    ) {

      return 0;

    }


    const counts =
      Object.values(
        distribution.counts
      )
        .sort(
          (a, b) =>
            b - a
        );


    const hot =
      meanC63(
        counts.slice(
          0,
          10
        )
      );


    const cold =
      meanC63(
        counts.slice(
          -10
        )
      );


    const maximum =
      counts[0] ||
      1;


    return clamp01C63(
      (
        hot -
        cold
      ) /
      maximum
    );

  }


  /*
   * =========================================================
   * RAW REGIME FEATURES
   * =========================================================
   */

  function extractRegimeFeaturesC63(
    trainingDraws
  ) {

    const longDraws =
      trainingDraws.slice(
        0,
        60
      );


    const shortDraws =
      trainingDraws.slice(
        0,
        10
      );


    const longDistribution =
      buildDistributionC63(
        getG8NumbersC63(
          longDraws
        )
      );


    const shortDistribution =
      buildDistributionC63(
        getG8NumbersC63(
          shortDraws
        )
      );


    return {

      entropy:
        entropyC63(
          longDistribution
        ),

      concentration:
        concentrationC63(
          longDistribution
        ),

      divergence:
        divergenceC63(
          shortDistribution,
          longDistribution
        ),

      volatility:
        rankVolatilityC63(
          trainingDraws
        ),

      hotColdSpread:
        hotColdSpreadC63(
          longDistribution
        )

    };

  }


  /*
   * =========================================================
   * REGIME CLASSIFIER
   *
   * IMPORTANT:
   * Thresholds are fixed ex-ante.
   * They are NOT fitted using holdout outcomes.
   * =========================================================
   */

  function classifyRegimeC63(
    features
  ) {

    /*
     * SHIFTING:
     * short distribution has strongly diverged from W60.
     */

    if (
      features.divergence >=
      0.70
    ) {

      return 'SHIFTING';

    }


    /*
     * VOLATILE:
     * ranking movement is elevated.
     */

    if (
      features.volatility >=
      0.38
    ) {

      return 'VOLATILE';

    }


    /*
     * CONCENTRATED:
     * lower entropy together with concentration/spread.
     */

    if (
      features.entropy <
        0.72 ||
      features.concentration >=
        0.18 ||
      features.hotColdSpread >=
        0.72
    ) {

      return 'CONCENTRATED';

    }


    return 'STABLE';

  }


  /*
   * =========================================================
   * METRIC
   * =========================================================
   */

  function createMetricC63() {

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


  function updateMetricC63(
    metric,
    actual,
    ranking
  ) {

    metric.tests++;


    let bestRank =
      Infinity;


    if (
      Array.isArray(actual) &&
      Array.isArray(ranking)
    ) {

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

    }


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


  function finalizeMetricC63(
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
   * REFERENCE RANKING
   * =========================================================
   */

  function buildReferenceRankingC63(
    trainingDraws,
    config
  ) {

    const scores =
      modelLabScoresV23(
        trainingDraws,
        PRIZE,
        REFERENCE_WINDOW,
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
   * ONE PROVINCE
   * =========================================================
   */

  function analyzeProvinceC63(
    provinceSlug
  ) {

    const config =
      getReferenceConfigC63();


    if (!config) {

      return {

        ready:
          false,

        reason:
          'REFERENCE_MODEL_NOT_AVAILABLE'

      };

    }


    if (
      typeof getAllDrawsForProvince !==
        'function' ||
      typeof loOfPrize !==
        'function' ||
      typeof modelLabScoresV23 !==
        'function' ||
      typeof rankedNumbers !==
        'function'
    ) {

      return {

        ready:
          false,

        reason:
          'RUNTIME_DEPENDENCY_NOT_AVAILABLE'

      };

    }


    const chronological =
      getAllDrawsForProvince(
        provinceSlug
      )
        .slice()
        .reverse();


    /*
     * Need:
     * 60 observations before first holdout target.
     */

    if (
      chronological.length <
      (
        REFERENCE_WINDOW +
        HOLDOUT_SIZE
      )
    ) {

      return {

        ready:
          false,

        reason:
          'INSUFFICIENT_HISTORY'

      };

    }


    const holdoutStart =
      chronological.length -
      HOLDOUT_SIZE;


    const overallMetric =
      createMetricC63();


    const regimeMetrics = {};


    REGIMES.forEach(
      regime => {

        regimeMetrics[
          regime
        ] =
          createMetricC63();

      }
    );


    const observations = [];


    for (
      let targetIndex =
        holdoutStart;
      targetIndex <
        chronological.length;
      targetIndex++
    ) {

      /*
       * ZERO FUTURE LEAKAGE.
       *
       * trainingChronological contains ONLY draws
       * before the target.
       */

      const trainingChronological =
        chronological.slice(
          0,
          targetIndex
        );


      const trainingDraws =
        trainingChronological
          .slice()
          .reverse();


      const targetDraw =
        chronological[
          targetIndex
        ];


      const features =
        extractRegimeFeaturesC63(
          trainingDraws
        );


      const regime =
        classifyRegimeC63(
          features
        );


      const ranking =
        buildReferenceRankingC63(
          trainingDraws,
          config
        );


      const actual =
        loOfPrize(
          targetDraw,
          PRIZE
        );


      updateMetricC63(
        overallMetric,
        actual,
        ranking
      );


      updateMetricC63(
        regimeMetrics[
          regime
        ],
        actual,
        ranking
      );


      observations.push({

        targetIndex,

        regime,

        features

      });

    }


    const finalizedRegimes = {};


    REGIMES.forEach(
      regime => {

        finalizedRegimes[
          regime
        ] =
          finalizeMetricC63(
            regimeMetrics[
              regime
            ]
          );

      }
    );


    const activeQualities =
      REGIMES
        .map(
          regime =>
            finalizedRegimes[
              regime
            ]
        )
        .filter(
          metric =>
            metric.tests >= 3
        )
        .map(
          metric =>
            metric.quality
        );


    const separation =
      activeQualities.length >= 2
        ? (
            Math.max(
              ...activeQualities
            ) -
            Math.min(
              ...activeQualities
            )
          )
        : 0;


    const provinceInfo =
      (
        typeof provinceBySlug ===
          'function'
      )
        ? provinceBySlug(
            provinceSlug
          )
        : null;


    return {

      ready:
        true,

      province:
        provinceSlug,

      provinceName:
        provinceInfo
          ? provinceInfo.name
          : provinceSlug,

      reference:
        finalizeMetricC63(
          overallMetric
        ),

      regimes:
        finalizedRegimes,

      observations,

      separation

    };

  }


  /*
   * =========================================================
   * CROSS-PROVINCE
   * =========================================================
   */

  function runC63() {

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


    const provinceResults =
      PROVINCES
        .map(
          province =>
            analyzeProvinceC63(
              province.slug
            )
        )
        .filter(
          result =>
            result &&
            result.ready === true
        );


    if (
      !provinceResults.length
    ) {

      return {

        ready:
          false,

        reason:
          'NO_VALID_PROVINCES'

      };

    }


    /*
     * ---------------------------------------------------------
     * AGGREGATE RAW METRICS
     * ---------------------------------------------------------
     */

    const globalMetric =
      createMetricC63();


    const globalRegimeMetrics = {};


    REGIMES.forEach(
      regime => {

        globalRegimeMetrics[
          regime
        ] =
          createMetricC63();

      }
    );


    provinceResults.forEach(
      province => {

        province.observations
          .forEach(
            observation => {

              /*
               * Reconstructing from observation would require
               * storing actual/rank.
               *
               * Instead aggregate finalized counts below
               * through weighted metric composition.
               */

            }
          );

      }
    );


    /*
     * Weighted aggregation of finalized province metrics.
     */

    function aggregateMetricsC63(
      metrics
    ) {

      const valid =
        metrics.filter(
          metric =>
            metric &&
            metric.tests > 0
        );


      const tests =
        valid.reduce(
          (
            sum,
            metric
          ) =>
            sum +
            metric.tests,
          0
        );


      if (!tests) {

        return finalizeMetricC63(
          createMetricC63()
        );

      }


      function weighted(
        field
      ) {

        return valid.reduce(
          (
            sum,
            metric
          ) =>
            sum +
            safeNumber(
              metric[field]
            ) *
            metric.tests,
          0
        ) /
        tests;

      }


      return {

        tests,

        hit1Rate:
          weighted(
            'hit1Rate'
          ),

        hit3Rate:
          weighted(
            'hit3Rate'
          ),

        hit5Rate:
          weighted(
            'hit5Rate'
          ),

        hit10Rate:
          weighted(
            'hit10Rate'
          ),

        mrr:
          weighted(
            'mrr'
          ),

        averageRank:
          weighted(
            'averageRank'
          ),

        quality:
          weighted(
            'quality'
          )

      };

    }


    const reference =
      aggregateMetricsC63(
        provinceResults.map(
          province =>
            province.reference
        )
      );


    const regimes = {};


    REGIMES.forEach(
      regime => {

        regimes[
          regime
        ] =
          aggregateMetricsC63(
            provinceResults.map(
              province =>
                province.regimes[
                  regime
                ]
            )
          );

      }
    );


    /*
     * ---------------------------------------------------------
     * REGIME DISTRIBUTION
     * ---------------------------------------------------------
     */

    const regimeDistribution = {};


    REGIMES.forEach(
      regime => {

        regimeDistribution[
          regime
        ] =
          regimes[
            regime
          ].tests;

      }
    );


    /*
     * ---------------------------------------------------------
     * GLOBAL SEPARATION
     * Require reasonable sample size.
     * ---------------------------------------------------------
     */

    const minimumGlobalSample =
      Math.max(
        30,
        Math.floor(
          reference.tests *
          0.05
        )
      );


    const eligibleRegimes =
      REGIMES
        .map(
          regime => ({

            regime,

            metric:
              regimes[
                regime
              ]

          })
        )
        .filter(
          item =>
            item.metric.tests >=
            minimumGlobalSample
        );


    eligibleRegimes.sort(
      (
        a,
        b
      ) =>
        b.metric.quality -
        a.metric.quality
    );


    const bestRegime =
      eligibleRegimes[
        0
      ] ||
      null;


    const worstRegime =
      eligibleRegimes.length
        ? eligibleRegimes[
            eligibleRegimes.length -
            1
          ]
        : null;


    const qualitySpread =
      (
        bestRegime &&
        worstRegime
      )
        ? (
            bestRegime.metric.quality -
            worstRegime.metric.quality
          )
        : 0;


    const hit1Spread =
      (
        bestRegime &&
        worstRegime
      )
        ? (
            bestRegime.metric.hit1Rate -
            worstRegime.metric.hit1Rate
          )
        : 0;


    const mrrSpread =
      (
        bestRegime &&
        worstRegime
      )
        ? (
            bestRegime.metric.mrr -
            worstRegime.metric.mrr
          )
        : 0;


    /*
     * ---------------------------------------------------------
     * PROVINCE ROBUSTNESS
     * ---------------------------------------------------------
     */

    const provinceSeparations =
      provinceResults
        .map(
          province =>
            province.separation
        );


    const positiveProvinces =
      provinceSeparations
        .filter(
          value =>
            value >=
            0.01
        )
        .length;


    const weakPositiveProvinces =
      provinceSeparations
        .filter(
          value =>
            value >
              0 &&
            value <
              0.01
        )
        .length;


    const zeroProvinces =
      provinceSeparations
        .filter(
          value =>
            value === 0
        )
        .length;


    const medianSeparation =
      medianC63(
        provinceSeparations
      );


    const meanSeparation =
      meanC63(
        provinceSeparations
      );


    /*
     * ---------------------------------------------------------
     * FEATURE DISTRIBUTION DIAGNOSTICS
     * ---------------------------------------------------------
     */

    const allObservations =
      provinceResults
        .flatMap(
          province =>
            province.observations
        );


    const featureSummary = {};


    [
      'entropy',
      'concentration',
      'divergence',
      'volatility',
      'hotColdSpread'
    ]
      .forEach(
        feature => {

          const values =
            allObservations
              .map(
                observation =>
                  observation
                    .features[
                      feature
                    ]
              );


          featureSummary[
            feature
          ] = {

            mean:
              meanC63(
                values
              ),

            median:
              medianC63(
                values
              ),

            std:
              stdC63(
                values
              ),

            min:
              values.length
                ? Math.min(
                    ...values
                  )
                : 0,

            max:
              values.length
                ? Math.max(
                    ...values
                  )
                : 0

          };

        }
      );


    /*
     * ---------------------------------------------------------
     * CLASSIFICATION
     *
     * V1 intentionally conservative.
     * ---------------------------------------------------------
     */

    let classification =
      'NO_REGIME_SIGNAL';


    if (
      eligibleRegimes.length >= 2 &&
      qualitySpread >= 0.010 &&
      medianSeparation >= 0.010 &&
      positiveProvinces >=
        Math.ceil(
          provinceResults.length *
          0.50
        )
    ) {

      classification =
        'REGIME_SIGNAL_DETECTED';

    } else if (
      eligibleRegimes.length >= 2 &&
      qualitySpread >= 0.005 &&
      medianSeparation >= 0.005
    ) {

      classification =
        'WEAK_REGIME_SIGNAL';

    }


    const result = {

      version:
        VERSION,

      ready:
        true,

      reason:
        'C63_REGIME_RESEARCH_READY',

      prize:
        PRIZE,

      referenceModel:
        REFERENCE_MODEL,

      referenceWindow:
        REFERENCE_WINDOW,

      holdoutSize:
        HOLDOUT_SIZE,

      provinceCount:
        provinceResults.length,

      reference,

      regimeDistribution,

      regimes,

      eligibleRegimeCount:
        eligibleRegimes.length,

      minimumGlobalSample,

      bestRegime:
        bestRegime
          ? bestRegime.regime
          : null,

      worstRegime:
        worstRegime
          ? worstRegime.regime
          : null,

      qualitySpread,

      hit1Spread,

      mrrSpread,

      classification,

      robustness: {

        positiveProvinces,

        weakPositiveProvinces,

        zeroProvinces,

        positiveProvinceRate:
          provinceResults.length
            ? (
                positiveProvinces /
                provinceResults.length
              )
            : 0,

        meanSeparation,

        medianSeparation

      },

      featureSummary,

      provinceResults,

      interpretation: {

        noRegimeSignal:
          'Do not use regime detection to modify G8 prediction.',

        weakRegimeSignal:
          'Interesting separation exists but evidence is insufficient for adaptive prediction.',

        regimeSignalDetected:
          'Regime separation is sufficiently broad to justify a separate out-of-sample adaptive experiment.'

      },

      nextStepAllowed:
        classification ===
        'REGIME_SIGNAL_DETECTED',

      safety: {

        researchOnly:
          true,

        readOnly:
          true,

        productionWrite:
          false,

        storageWrite:
          false,

        lastForecastModified:
          false,

        savePredictionCalled:
          false,

        modelSwitching:
          false,

        rankingModified:
          false,

        futureLeakage:
          false

      },

      inspectedAt:
        new Date()
          .toISOString()

    };


    /*
     * Diagnostic RAM alias only.
     */

    window
      .LAST_FIX03D59_C63_REGIME_DETECTION =
      result;


    return result;

  }


  /*
   * =========================================================
   * PUBLIC API
   * =========================================================
   */

  window
    .runFix03D59C63RegimeDetection =
    runC63;


  window
    .FIX03D59_C63_REGIME_DETECTION_VERSION =
    VERSION;


  window
    .FIX03D59_C63_REGIME_DETECTION_LOADED =
    true;


  console.log(
    'FIX-03D5.9 C6.3 G8 Regime Detection Research V1 loaded / RESEARCH ONLY / READ ONLY'
  );

})();
