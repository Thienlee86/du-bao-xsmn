/* =========================================================================
   FIX-03D5.9
   C6.2 G8 TRANSITION / MARKOV SIGNAL RESEARCH V1

   PURPOSE:
   - Research a NEW G8-specific sequential signal.
   - Learn transitions from previous G8 STATE -> next G8 number.
   - Blend Markov ranking with RECENT W60 FULL.
   - Strict walk-forward.
   - Late temporal holdout.
   - Cross-province benchmark.

   PREVIOUS G8 STATE TOKENS:
   - QUARTER:
       Q0 = 00-24
       Q1 = 25-49
       Q2 = 50-74
       Q3 = 75-99
   - DECADE:
       D0 ... D9
   - PARITY:
       EVEN / ODD

   REFERENCE:
   - G8 RECENT W60 FULL

   BLENDS:
   - 0%  Markov / 100% RECENT
   - 10% Markov /  90% RECENT
   - 20% Markov /  80% RECENT
   - 30% Markov /  70% RECENT
   - 40% Markov /  60% RECENT

   IMPORTANT:
   - G8 ONLY.
   - DISCOVERY RESEARCH ONLY.
   - NO PRODUCTION CHANGE.
   - READ ONLY.
   - ZERO STORAGE WRITE.
   - ZERO PRODUCTION WRITE.
   - NO savePrediction().
   - NO LAST_FORECAST MODIFICATION.
   - NO FUTURE LEAKAGE.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_C62_G8_TRANSITION_MARKOV_V1';


  const PRIZE =
    'g8';

  const MODEL_ID =
    'RECENT';

  const WINDOW_SIZE =
    60;

  const HOLDOUT_SIZE =
    30;

  const MINIMUM_TRAINING =
    30;


  const MARKOV_WEIGHTS = [
    0.00,
    0.10,
    0.20,
    0.30,
    0.40
  ];


  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

  function safeNumberC62(
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


  function pad2C62(
    value
  ) {

    return String(
      value
    )
      .padStart(
        2,
        '0'
      )
      .slice(
        -2
      );

  }


  function meanC62(
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
          safeNumberC62(
            value
          ),
        0
      ) /
      values.length
    );

  }


  function medianC62(
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

  function getRecentConfigC62() {

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
   * READ ONE G8 VALUE
   * =========================================================
   */

  function getG8NumberC62(
    draw
  ) {

    let values;


    try {

      values =
        loOfPrize(
          draw,
          PRIZE
        );

    } catch (
      error
    ) {

      return null;

    }


    if (
      !Array.isArray(
        values
      ) ||
      !values.length
    ) {

      return null;

    }


    return pad2C62(
      values[0]
    );

  }


  /*
   * =========================================================
   * G8 STATE TOKENS
   * =========================================================
   */

  function stateTokensC62(
    number
  ) {

    const n =
      Number(
        number
      );


    if (
      !Number.isFinite(n) ||
      n < 0 ||
      n > 99
    ) {

      return [];

    }


    const quarter =
      Math.min(
        3,
        Math.floor(
          n /
          25
        )
      );


    const decade =
      Math.floor(
        n /
        10
      );


    const parity =
      (
        n %
        2 ===
        0
      )
        ? 'EVEN'
        : 'ODD';


    return [

      'Q:' +
      quarter,

      'D:' +
      decade,

      'P:' +
      parity

    ];

  }


  /*
   * =========================================================
   * BUILD HISTORICAL MARKOV MODEL
   *
   * For each historical transition:
   *
   * G8(t-1) state tokens
   *           ↓
   *       G8(t)
   *
   * Only training history is used.
   * =========================================================
   */

  function buildMarkovModelC62(
    trainingChronological
  ) {

    const counts = {};

    const totals = {};


    for (
      let i = 1;
      i <
        trainingChronological.length;
      i++
    ) {

      const previous =
        getG8NumberC62(
          trainingChronological[
            i - 1
          ]
        );


      const current =
        getG8NumberC62(
          trainingChronological[
            i
          ]
        );


      if (
        previous === null ||
        current === null
      ) {

        continue;

      }


      const tokens =
        stateTokensC62(
          previous
        );


      tokens.forEach(
        token => {

          if (
            !counts[
              token
            ]
          ) {

            counts[
              token
            ] = {};

          }


          if (
            !totals[
              token
            ]
          ) {

            totals[
              token
            ] = 0;

          }


          counts[
            token
          ][
            current
          ] =
            (
              counts[
                token
              ][
                current
              ] ||
              0
            ) +
            1;


          totals[
            token
          ]++;

        }
      );

    }


    return {

      counts,

      totals

    };

  }


  /*
   * =========================================================
   * MARKOV SCORE 00 -> 99
   * =========================================================
   */

  function buildMarkovScoresC62(
    trainingChronological
  ) {

    const scores = {};


    for (
      let i = 0;
      i < 100;
      i++
    ) {

      scores[
        pad2C62(i)
      ] = 0;

    }


    if (
      !Array.isArray(
        trainingChronological
      ) ||
      !trainingChronological.length
    ) {

      return scores;

    }


    const latestG8 =
      getG8NumberC62(
        trainingChronological[
          trainingChronological.length -
          1
        ]
      );


    if (
      latestG8 === null
    ) {

      return scores;

    }


    const currentTokens =
      stateTokensC62(
        latestG8
      );


    const model =
      buildMarkovModelC62(
        trainingChronological
      );


    let contributingTokens =
      0;


    currentTokens.forEach(
      token => {

        const tokenCounts =
          model.counts[
            token
          ];


        const total =
          safeNumberC62(
            model.totals[
              token
            ]
          );


        if (
          !tokenCounts ||
          total <= 0
        ) {

          return;

        }


        contributingTokens++;


        for (
          let n = 0;
          n < 100;
          n++
        ) {

          const number =
            pad2C62(n);


          /*
           * Smoothed conditional probability.
           */

          const probability =
            (
              safeNumberC62(
                tokenCounts[
                  number
                ]
              ) +
              0.5
            ) /
            (
              total +
              50
            );


          scores[
            number
          ] +=
            probability;

        }

      }
    );


    if (
      contributingTokens >
      0
    ) {

      Object.keys(
        scores
      )
        .forEach(
          number => {

            scores[
              number
            ] /=
              contributingTokens;

          }
        );

    }


    return scores;

  }


  /*
   * =========================================================
   * SCORE -> RANKING
   * =========================================================
   */

  function rankingFromScoresC62(
    scores
  ) {

    return Object
      .entries(
        scores
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
   * RECENT W60 RANKING
   * =========================================================
   */

  function buildRecentRankingC62(
    trainingNewestFirst,
    recentConfig
  ) {

    const scores =
      modelLabScoresV23(
        trainingNewestFirst,
        PRIZE,
        WINDOW_SIZE,
        recentConfig.weights
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
   * BLEND RANKINGS
   * =========================================================
   *
   * Weighted Borda consensus.
   * =========================================================
   */

  function blendRankingsC62(
    recentRanking,
    markovRanking,
    markovWeight
  ) {

    const recentWeight =
      1 -
      markovWeight;


    const scores = {};


    for (
      let i = 0;
      i < 100;
      i++
    ) {

      scores[
        pad2C62(i)
      ] = 0;

    }


    recentRanking.forEach(
      (
        number,
        index
      ) => {

        scores[
          number
        ] +=
          (
            100 -
            index
          ) *
          recentWeight;

      }
    );


    markovRanking.forEach(
      (
        number,
        index
      ) => {

        scores[
          number
        ] +=
          (
            100 -
            index
          ) *
          markovWeight;

      }
    );


    return rankingFromScoresC62(
      scores
    );

  }


  /*
   * =========================================================
   * METRIC
   * =========================================================
   */

  function createMetricC62() {

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


  function updateMetricC62(
    metric,
    actual,
    ranking
  ) {

    metric.tests++;


    let bestRank =
      Infinity;


    if (
      Array.isArray(
        actual
      ) &&
      Array.isArray(
        ranking
      )
    ) {

      actual.forEach(
        value => {

          const number =
            pad2C62(
              value
            );


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
      bestRank <=
      1
    ) {

      metric.hit1++;

    }


    if (
      bestRank <=
      3
    ) {

      metric.hit3++;

    }


    if (
      bestRank <=
      5
    ) {

      metric.hit5++;

    }


    if (
      bestRank <=
      10
    ) {

      metric.hit10++;

    }

  }


  function finalizeMetricC62(
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
   * ONE PROVINCE
   * =========================================================
   */

  function benchmarkProvinceC62(
    province
  ) {

    const recentConfig =
      getRecentConfigC62();


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
          'INSUFFICIENT_HISTORY'

      };

    }


    const holdoutStart =
      draws.length -
      HOLDOUT_SIZE;


    const metrics = {};


    MARKOV_WEIGHTS.forEach(
      weight => {

        metrics[
          String(weight)
        ] =
          createMetricC62();

      }
    );


    for (
      let targetIndex =
        holdoutStart;
      targetIndex <
        draws.length;
      targetIndex++
    ) {

      /*
       * STRICT WALK-FORWARD.
       *
       * No target/future draw is visible.
       */

      const trainingChronological =
        draws.slice(
          0,
          targetIndex
        );


      const trainingNewestFirst =
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


      const recentRanking =
        buildRecentRankingC62(
          trainingNewestFirst,
          recentConfig
        );


      const markovScores =
        buildMarkovScoresC62(
          trainingChronological
        );


      const markovRanking =
        rankingFromScoresC62(
          markovScores
        );


      MARKOV_WEIGHTS.forEach(
        weight => {

          const ranking =
            weight ===
              0
              ? recentRanking
              : blendRankingsC62(
                  recentRanking,
                  markovRanking,
                  weight
                );


          updateMetricC62(
            metrics[
              String(weight)
            ],
            actual,
            ranking
          );

        }
      );

    }


    const results = {};


    MARKOV_WEIGHTS.forEach(
      weight => {

        results[
          String(weight)
        ] =
          finalizeMetricC62(
            metrics[
              String(weight)
            ]
          );

      }
    );


    return {

      ready:
        true,

      province:
        province.slug,

      provinceName:
        province.name,

      results

    };

  }


  /*
   * =========================================================
   * AGGREGATE
   * =========================================================
   */

  function aggregateMetricC62(
    provinceResults,
    weight
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

    let rank =
      0;

    let quality =
      0;


    provinceResults.forEach(
      result => {

        const metric =
          result.results[
            String(weight)
          ];


        const n =
          metric.tests;


        tests +=
          n;

        hit1 +=
          metric.hit1Rate *
          n;

        hit3 +=
          metric.hit3Rate *
          n;

        hit5 +=
          metric.hit5Rate *
          n;

        hit10 +=
          metric.hit10Rate *
          n;

        mrr +=
          metric.mrr *
          n;

        rank +=
          metric.averageRank *
          n;

        quality +=
          metric.quality *
          n;

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
        rank /
        tests,

      quality:
        quality /
        tests

    };

  }


  /*
   * =========================================================
   * RUN CROSS-PROVINCE
   * =========================================================
   */

  function runTransitionMarkovC62() {

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
          benchmarkProvinceC62(
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
      aggregateMetricC62(
        valid,
        0
      );


    const candidates =
      MARKOV_WEIGHTS
        .map(
          weight => {

            const metric =
              aggregateMetricC62(
                valid,
                weight
              );


            let wins =
              0;

            let losses =
              0;

            let ties =
              0;


            const provinceDeltas =
              valid
                .map(
                  result => {

                    const candidate =
                      result.results[
                        String(
                          weight
                        )
                      ];


                    const base =
                      result.results[
                        '0'
                      ];


                    const delta =
                      candidate.quality -
                      base.quality;


                    if (
                      delta >
                      1e-12
                    ) {

                      wins++;

                    } else if (
                      delta <
                      -1e-12
                    ) {

                      losses++;

                    } else {

                      ties++;

                    }


                    return {

                      province:
                        result.province,

                      provinceName:
                        result.provinceName,

                      delta

                    };

                  }
                )
                .sort(
                  (a, b) =>
                    a.delta -
                    b.delta
                );


            const deltaValues =
              provinceDeltas
                .map(
                  item =>
                    item.delta
                );


            return {

              markovWeight:
                weight,

              recentWeight:
                1 -
                weight,

              ...metric,

              delta: {

                quality:
                  metric.quality -
                  reference.quality,

                hit1:
                  metric.hit1Rate -
                  reference.hit1Rate,

                hit3:
                  metric.hit3Rate -
                  reference.hit3Rate,

                hit5:
                  metric.hit5Rate -
                  reference.hit5Rate,

                hit10:
                  metric.hit10Rate -
                  reference.hit10Rate,

                mrr:
                  metric.mrr -
                  reference.mrr,

                averageRank:
                  reference.averageRank -
                  metric.averageRank

              },

              wins,

              losses,

              ties,

              positiveRate:
                wins /
                valid.length,

              meanProvinceQualityDelta:
                meanC62(
                  deltaValues
                ),

              medianProvinceQualityDelta:
                medianC62(
                  deltaValues
                ),

              worstProvince:
                provinceDeltas[
                  0
                ] ||
                null,

              bestProvince:
                provinceDeltas[
                  provinceDeltas.length -
                  1
                ] ||
                null

            };

          }
        );


    const challengers =
      candidates
        .filter(
          item =>
            item.markovWeight >
            0
        )
        .slice()
        .sort(
          (a, b) => {

            if (
              b.quality !==
              a.quality
            ) {

              return (
                b.quality -
                a.quality
              );

            }


            if (
              b.hit3Rate !==
              a.hit3Rate
            ) {

              return (
                b.hit3Rate -
                a.hit3Rate
              );

            }


            if (
              b.mrr !==
              a.mrr
            ) {

              return (
                b.mrr -
                a.mrr
              );

            }


            return (
              a.averageRank -
              b.averageRank
            );

          }
        );


    const winner =
      challengers[
        0
      ] ||
      null;


    let classification =
      'NO_MARKOV_ADVANTAGE';


    if (
      winner &&
      winner.delta.quality >
        0 &&
      winner.wins >
        winner.losses &&
      winner
        .medianProvinceQualityDelta >=
        0
    ) {

      classification =
        'MARKOV_CANDIDATE';

    }


    if (
      winner &&
      winner.delta.quality >=
        0.002 &&
      winner.positiveRate >=
        0.60 &&
      winner.delta.mrr >=
        0 &&
      winner.delta.hit3 >=
        0
    ) {

      classification =
        'STRONG_MARKOV_CANDIDATE';

    }


    const result = {

      version:
        VERSION,

      ready:
        true,

      reason:
        'C62_COMPLETE',

      prize:
        PRIZE,

      referenceModel:
        MODEL_ID,

      referenceWindow:
        WINDOW_SIZE,

      holdoutSize:
        HOLDOUT_SIZE,

      provinceCount:
        valid.length,

      stateFeatures: [
        'QUARTER',
        'DECADE',
        'PARITY'
      ],

      reference,

      winner,

      candidates,

      classification,

      provinceResults:
        valid,

      importantNote:
        'DISCOVERY_ONLY_REQUIRES_INDEPENDENT_CONFIRMATION',

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
      .LAST_FIX03D59_C62_TRANSITION_MARKOV =
      result;


    return result;

  }


  /*
   * =========================================================
   * PUBLIC API
   * =========================================================
   */

  window
    .runFix03D59C62TransitionMarkov =
    runTransitionMarkovC62;


  window
    .FIX03D59_C62_TRANSITION_MARKOV_VERSION =
    VERSION;


  window
    .FIX03D59_C62_TRANSITION_MARKOV_LOADED =
    true;


  console.log(
    'FIX-03D5.9 C6.2 G8 Transition Markov V1 loaded / WALK-FORWARD / READ ONLY'
  );

})();
