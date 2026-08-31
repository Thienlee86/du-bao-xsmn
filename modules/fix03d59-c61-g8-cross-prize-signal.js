/* =========================================================================
   FIX-03D5.9
   C6.1 G8 CROSS-PRIZE SIGNAL RESEARCH V1

   PURPOSE:
   - Research a NEW signal not currently used by RECENT W60.
   - Use previous draw DB + G1 -> G7 last-two values as context.
   - Learn historical transition:
       previous-draw prize values -> next-draw G8
   - Combine Cross-Prize transition rank with RECENT W60 ranking.
   - Strict walk-forward.
   - Late temporal holdout.
   - 21 provinces.

   REFERENCE:
   - G8 RECENT W60 FULL FEATURES

   BLENDS:
   - 0%  Cross-Prize / 100% RECENT
   - 10% Cross-Prize /  90% RECENT
   - 20% Cross-Prize /  80% RECENT
   - 30% Cross-Prize /  70% RECENT
   - 40% Cross-Prize /  60% RECENT

   IMPORTANT:
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
    'FIX03D59_C61_G8_CROSS_PRIZE_SIGNAL_V1';


  const TARGET_PRIZE =
    'g8';


  const SOURCE_PRIZES = [
    'db',
    'g1',
    'g2',
    'g3',
    'g4',
    'g5',
    'g6',
    'g7'
  ];


  const MODEL_ID =
    'RECENT';


  const WINDOW_SIZE =
    60;


  const HOLDOUT_SIZE =
    30;


  const MINIMUM_TRAINING =
    30;


  const CROSS_WEIGHTS = [
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

  function safeNumberC61(
    value,
    fallback = 0
  ) {

    const n =
      Number(value);


    return Number.isFinite(n)
      ? n
      : fallback;

  }


  function meanC61(
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
          safeNumberC61(value),
        0
      ) /
      values.length
    );

  }


  function medianC61(
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
      sorted.length % 2
    ) {

      return sorted[middle];

    }


    return (
      sorted[middle - 1] +
      sorted[middle]
    ) / 2;

  }


  function pad2C61(
    value
  ) {

    return String(value)
      .padStart(
        2,
        '0'
      )
      .slice(-2);

  }


  /*
   * =========================================================
   * RECENT CONFIG
   * =========================================================
   */

  function getRecentConfigC61() {

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
   * EXTRACT PREVIOUS-DRAW CONTEXT
   * =========================================================
   */

  function getSourceTokensC61(
    draw
  ) {

    const tokens = [];


    SOURCE_PRIZES.forEach(
      prize => {

        let values = [];


        try {

          values =
            loOfPrize(
              draw,
              prize
            );

        } catch (error) {

          values = [];

        }


        if (
          !Array.isArray(values)
        ) {

          return;

        }


        values.forEach(
          value => {

            const token =
              pad2C61(
                value
              );


            tokens.push(
              prize +
              ':' +
              token
            );

          }
        );

      }
    );


    /*
     * Unique token only.
     */

    return Array.from(
      new Set(tokens)
    );

  }


  /*
   * =========================================================
   * BUILD CROSS-PRIZE TRANSITION MODEL
   *
   * trainingChronological:
   * oldest -> newest
   *
   * For transition i-1 -> i:
   * context = DB/G1..G7 of draw i-1
   * target  = G8 of draw i
   * =========================================================
   */

  function buildTransitionModelC61(
    trainingChronological
  ) {

    const tokenCounts = {};

    const tokenTotals = {};


    for (
      let i = 1;
      i <
        trainingChronological.length;
      i++
    ) {

      const previousDraw =
        trainingChronological[
          i - 1
        ];


      const currentDraw =
        trainingChronological[
          i
        ];


      const tokens =
        getSourceTokensC61(
          previousDraw
        );


      let targets = [];


      try {

        targets =
          loOfPrize(
            currentDraw,
            TARGET_PRIZE
          );

      } catch (error) {

        targets = [];

      }


      if (
        !tokens.length ||
        !Array.isArray(targets) ||
        !targets.length
      ) {

        continue;

      }


      const targetNumbers =
        targets.map(
          pad2C61
        );


      tokens.forEach(
        token => {

          if (
            !tokenCounts[token]
          ) {

            tokenCounts[token] = {};

          }


          if (
            !tokenTotals[token]
          ) {

            tokenTotals[token] =
              0;

          }


          targetNumbers.forEach(
            target => {

              tokenCounts[
                token
              ][target] =
                (
                  tokenCounts[
                    token
                  ][target] ||
                  0
                ) +
                1;


              tokenTotals[token]++;

            }
          );

        }
      );

    }


    return {

      tokenCounts,

      tokenTotals

    };

  }


  /*
   * =========================================================
   * CROSS-PRIZE SCORE FOR NEXT G8
   * =========================================================
   */

  function buildCrossPrizeScoresC61(
    trainingChronological
  ) {

    const scores = {};


    for (
      let i = 0;
      i < 100;
      i++
    ) {

      scores[
        pad2C61(i)
      ] = 0;

    }


    if (
      !trainingChronological.length
    ) {

      return scores;

    }


    const model =
      buildTransitionModelC61(
        trainingChronological
      );


    const latestDraw =
      trainingChronological[
        trainingChronological.length -
        1
      ];


    const currentTokens =
      getSourceTokensC61(
        latestDraw
      );


    if (
      !currentTokens.length
    ) {

      return scores;

    }


    let contributingTokens =
      0;


    currentTokens.forEach(
      token => {

        const counts =
          model.tokenCounts[
            token
          ];


        const total =
          safeNumberC61(
            model.tokenTotals[
              token
            ]
          );


        if (
          !counts ||
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
            pad2C61(n);


          /*
           * Laplace-like smoothing.
           */

          const probability =
            (
              safeNumberC61(
                counts[number]
              ) +
              0.5
            ) /
            (
              total +
              50
            );


          scores[number] +=
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

            scores[number] /=
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

  function rankingFromScoresC61(
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

  function buildRecentRankingC61(
    trainingDrawsNewestFirst,
    recentConfig
  ) {

    const scores =
      modelLabScoresV23(
        trainingDrawsNewestFirst,
        TARGET_PRIZE,
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
   * RANK BLEND
   *
   * Weighted Borda:
   * rank1 -> 100
   * rank100 -> 1
   * =========================================================
   */

  function blendRankingsC61(
    recentRanking,
    crossRanking,
    crossWeight
  ) {

    const recentWeight =
      1 -
      crossWeight;


    const scores = {};


    for (
      let i = 0;
      i < 100;
      i++
    ) {

      scores[
        pad2C61(i)
      ] = 0;

    }


    recentRanking.forEach(
      (
        number,
        index
      ) => {

        scores[number] +=
          (
            100 -
            index
          ) *
          recentWeight;

      }
    );


    crossRanking.forEach(
      (
        number,
        index
      ) => {

        scores[number] +=
          (
            100 -
            index
          ) *
          crossWeight;

      }
    );


    return rankingFromScoresC61(
      scores
    );

  }


  /*
   * =========================================================
   * METRIC
   * =========================================================
   */

  function createMetricC61() {

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


  function updateMetricC61(
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
              pad2C61(number)
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


  function finalizeMetricC61(
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
          ? metric.rankSum /
            metric.rankedHits
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

  function benchmarkProvinceC61(
    province
  ) {

    const recentConfig =
      getRecentConfigC61();


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


    CROSS_WEIGHTS.forEach(
      weight => {

        metrics[
          String(weight)
        ] =
          createMetricC61();

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
          TARGET_PRIZE
        );


      const recentRanking =
        buildRecentRankingC61(
          trainingNewestFirst,
          recentConfig
        );


      const crossScores =
        buildCrossPrizeScoresC61(
          trainingChronological
        );


      const crossRanking =
        rankingFromScoresC61(
          crossScores
        );


      CROSS_WEIGHTS.forEach(
        weight => {

          const ranking =
            weight === 0
              ? recentRanking
              : blendRankingsC61(
                  recentRanking,
                  crossRanking,
                  weight
                );


          updateMetricC61(
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


    CROSS_WEIGHTS.forEach(
      weight => {

        results[
          String(weight)
        ] =
          finalizeMetricC61(
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
   * AGGREGATION
   * =========================================================
   */

  function aggregateMetricC61(
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


        tests += n;

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


    return {

      tests,

      hit1Rate:
        hit1 / tests,

      hit3Rate:
        hit3 / tests,

      hit5Rate:
        hit5 / tests,

      hit10Rate:
        hit10 / tests,

      mrr:
        mrr / tests,

      averageRank:
        rank / tests,

      quality:
        quality / tests

    };

  }


  /*
   * =========================================================
   * RUN ALL PROVINCES
   * =========================================================
   */

  function runCrossPrizeC61() {

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
          benchmarkProvinceC61(
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
      aggregateMetricC61(
        valid,
        0
      );


    const candidates =
      CROSS_WEIGHTS
        .map(
          weight => {

            const metric =
              aggregateMetricC61(
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
                        String(weight)
                      ];


                    const base =
                      result.results[
                        '0'
                      ];


                    const delta =
                      candidate.quality -
                      base.quality;


                    if (
                      delta > 1e-12
                    ) {

                      wins++;

                    } else if (
                      delta < -1e-12
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


            return {

              crossWeight:
                weight,

              recentWeight:
                1 - weight,

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
                meanC61(
                  provinceDeltas.map(
                    item =>
                      item.delta
                  )
                ),

              medianProvinceQualityDelta:
                medianC61(
                  provinceDeltas.map(
                    item =>
                      item.delta
                  )
                ),

              worstProvince:
                provinceDeltas[0] ||
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
            item.crossWeight >
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
      challengers[0] ||
      null;


    let classification =
      'NO_CROSS_PRIZE_ADVANTAGE';


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
        'CROSS_PRIZE_CANDIDATE';

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
        'STRONG_CROSS_PRIZE_CANDIDATE';

    }


    const result = {

      version:
        VERSION,

      ready:
        true,

      reason:
        'C61_COMPLETE',

      prize:
        TARGET_PRIZE,

      referenceModel:
        MODEL_ID,

      referenceWindow:
        WINDOW_SIZE,

      holdoutSize:
        HOLDOUT_SIZE,

      provinceCount:
        valid.length,

      sourcePrizes:
        SOURCE_PRIZES.slice(),

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
      .LAST_FIX03D59_C61_CROSS_PRIZE =
      result;


    return result;

  }


  /*
   * =========================================================
   * PUBLIC API
   * =========================================================
   */

  window
    .runFix03D59C61CrossPrize =
    runCrossPrizeC61;


  window
    .FIX03D59_C61_CROSS_PRIZE_VERSION =
    VERSION;


  window
    .FIX03D59_C61_CROSS_PRIZE_LOADED =
    true;


  console.log(
    'FIX-03D5.9 C6.1 G8 Cross-Prize Signal V1 loaded / WALK-FORWARD / READ ONLY'
  );

})();
