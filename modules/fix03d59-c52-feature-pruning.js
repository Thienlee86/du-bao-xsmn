/* =========================================================================
   FIX-03D5.9
   C5.2 G8 FEATURE PRUNING BENCHMARK V1

   PURPOSE:
   - Test whether RECENT W60 can be improved by removing
     weak / redundant features discovered by C5.1.
   - Compare FULL RECENT against several pruned feature sets.
   - Use late holdout only.
   - 21 provinces.
   - G8 only.

   CANDIDATES:
   A FULL
   B CORE3
   C CORE4
   D NO_HEADTAIL
   E NO_FREQUENCY
   F NO_HEADTAIL_FREQUENCY
   G CORE3_STABILITY

   IMPORTANT:
   - RESEARCH ONLY.
   - G8 ONLY.
   - READ ONLY.
   - ZERO STORAGE WRITE.
   - ZERO PRODUCTION WRITE.
   - NO LAST_FORECAST MODIFICATION.
   - NO savePrediction().
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_C52_FEATURE_PRUNING_V1';


  const PRIZE =
    'g8';

  const MODEL_ID =
    'RECENT';

  const WINDOW_SIZE =
    60;

  const HOLDOUT_SIZE =
    30;


  /*
   * =========================================================
   * FEATURE SETS
   * =========================================================
   */

  const FEATURE_SETS = [

    {
      id:
        'FULL',

      label:
        'FULL',

      keep: [
        'frequency',
        'recent',
        'gan',
        'headTail',
        'cycle',
        'momentum',
        'stability'
      ]
    },

    {
      id:
        'CORE3',

      label:
        'CORE3',

      keep: [
        'recent',
        'momentum',
        'cycle'
      ]
    },

    {
      id:
        'CORE4',

      label:
        'CORE4 + GAN',

      keep: [
        'recent',
        'momentum',
        'cycle',
        'gan'
      ]
    },

    {
      id:
        'NO_HEADTAIL',

      label:
        'NO HEADTAIL',

      remove: [
        'headTail'
      ]
    },

    {
      id:
        'NO_FREQUENCY',

      label:
        'NO FREQUENCY',

      remove: [
        'frequency'
      ]
    },

    {
      id:
        'NO_HEADTAIL_FREQUENCY',

      label:
        'NO HEADTAIL + FREQUENCY',

      remove: [
        'headTail',
        'frequency'
      ]
    },

    {
      id:
        'CORE3_STABILITY',

      label:
        'CORE3 + STABILITY',

      keep: [
        'recent',
        'momentum',
        'cycle',
        'stability'
      ]
    }

  ];


  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

  function cloneC52(
    value
  ) {

    return JSON.parse(
      JSON.stringify(
        value
      )
    );

  }


  function pctC52(
    value
  ) {

    const n =
      Number(value);


    return Number.isFinite(n)
      ? (
          n * 100
        ).toFixed(2) + '%'
      : '--';

  }


  function signedPctC52(
    value
  ) {

    const n =
      Number(value);


    if (
      !Number.isFinite(n)
    ) {

      return '--';

    }


    return (
      n >= 0
        ? '+'
        : ''
    ) +
    (
      n * 100
    ).toFixed(2) +
    ' pp';

  }


  function numC52(
    value,
    digits = 4
  ) {

    const n =
      Number(value);


    return Number.isFinite(n)
      ? n.toFixed(
          digits
        )
      : '--';

  }


  function signedC52(
    value,
    digits = 4
  ) {

    const n =
      Number(value);


    if (
      !Number.isFinite(n)
    ) {

      return '--';

    }


    return (
      n >= 0
        ? '+'
        : ''
    ) +
    n.toFixed(
      digits
    );

  }


  function provinceNameC52(
    slug
  ) {

    try {

      if (
        typeof provinceBySlug ===
          'function'
      ) {

        const p =
          provinceBySlug(
            slug
          );


        if (
          p &&
          p.name
        ) {

          return p.name;

        }

      }

    } catch (
      error
    ) {

      // READ ONLY fallback

    }


    return slug;

  }


  /*
   * =========================================================
   * RECENT CONFIG
   * =========================================================
   */

  function getRecentConfigC52() {

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
          MODEL_ID
      ) ||
      null;

  }


  /*
   * =========================================================
   * WEIGHT PRUNING + RENORMALIZATION
   * =========================================================
   */

  function buildWeightsC52(
    baseWeights,
    featureSet
  ) {

    const weights =
      cloneC52(
        baseWeights
      );


    const keys =
      Object.keys(
        weights
      );


    keys.forEach(
      key => {

        let keep =
          true;


        if (
          Array.isArray(
            featureSet.keep
          )
        ) {

          keep =
            featureSet.keep
              .includes(
                key
              );

        }


        if (
          Array.isArray(
            featureSet.remove
          ) &&
          featureSet.remove
            .includes(
              key
            )
        ) {

          keep =
            false;

        }


        if (!keep) {

          weights[key] =
            0;

        }

      }
    );


    let total =
      Object.values(
        weights
      )
        .reduce(
          (
            sum,
            value
          ) =>
            sum +
            Math.max(
              0,
              Number(value) || 0
            ),
          0
        );


    if (
      total <= 0
    ) {

      return null;

    }


    Object.keys(
      weights
    )
      .forEach(
        key => {

          weights[key] =
            (
              Math.max(
                0,
                Number(
                  weights[key]
                ) || 0
              ) /
              total
            );

        }
      );


    return weights;

  }


  /*
   * =========================================================
   * METRICS
   * =========================================================
   */

  function createMetricC52() {

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


  function updateMetricC52(
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


  function finalizeMetricC52(
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
   * BUILD RANKING
   * =========================================================
   */

  function buildRankingC52(
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
   * ONE PROVINCE
   * =========================================================
   */

  function benchmarkProvinceC52(
    provinceSlug
  ) {

    const config =
      getRecentConfigC52();


    if (
      !config ||
      !config.weights
    ) {

      return {

        ready:
          false,

        reason:
          'RECENT_CONFIG_NOT_AVAILABLE'

      };

    }


    const featureWeights = {};


    FEATURE_SETS.forEach(
      featureSet => {

        featureWeights[
          featureSet.id
        ] =
          buildWeightsC52(
            config.weights,
            featureSet
          );

      }
    );


    if (
      Object.values(
        featureWeights
      )
        .some(
          weights =>
            !weights
        )
    ) {

      return {

        ready:
          false,

        reason:
          'INVALID_PRUNED_WEIGHTS'

      };

    }


    const draws =
      getAllDrawsForProvince(
        provinceSlug
      )
        .slice()
        .reverse();


    if (
      draws.length <=
      HOLDOUT_SIZE
    ) {

      return {

        ready:
          false,

        reason:
          'INSUFFICIENT_HISTORY'

      };

    }


    const holdoutStart =
      draws.length -
      HOLDOUT_SIZE;


    const metrics = {};


    FEATURE_SETS.forEach(
      featureSet => {

        metrics[
          featureSet.id
        ] =
          createMetricC52();

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
       * Strict walk-forward:
       * only history before target.
       */

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


      FEATURE_SETS.forEach(
        featureSet => {

          const ranking =
            buildRankingC52(
              trainingDraws,
              featureWeights[
                featureSet.id
              ]
            );


          updateMetricC52(
            metrics[
              featureSet.id
            ],
            actual,
            ranking
          );

        }
      );

    }


    const results = {};


    FEATURE_SETS.forEach(
      featureSet => {

        results[
          featureSet.id
        ] =
          finalizeMetricC52(
            metrics[
              featureSet.id
            ]
          );

      }
    );


    return {

      ready:
        true,

      province:
        provinceSlug,

      provinceName:
        provinceNameC52(
          provinceSlug
        ),

      results

    };

  }


  /*
   * =========================================================
   * CROSS PROVINCE
   * =========================================================
   */

  function runC52() {

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
            benchmarkProvinceC52(
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


    function aggregateC52(
      featureId
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
        province => {

          const metric =
            province
              .results[
                featureId
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


    const reference =
      aggregateC52(
        'FULL'
      );


    const candidates =
      FEATURE_SETS
        .map(
          featureSet => {

            const metric =
              aggregateC52(
                featureSet.id
              );


            let wins =
              0;

            let losses =
              0;

            let ties =
              0;


            const provinceDeltas =
              provinceResults
                .map(
                  province => {

                    const candidate =
                      province
                        .results[
                          featureSet.id
                        ];


                    const full =
                      province
                        .results
                        .FULL;


                    const delta =
                      candidate.quality -
                      full.quality;


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
                        province.province,

                      provinceName:
                        province.provinceName,

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

              id:
                featureSet.id,

              label:
                featureSet.label,

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
                provinceResults.length,

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


    /*
     * FULL remains in the table as reference,
     * but discovery winner must be a PRUNED candidate.
     */

    const pruned =
      candidates
        .filter(
          candidate =>
            candidate.id !==
            'FULL'
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
      pruned[0] ||
      null;


    let classification =
      'NO_PRUNING_ADVANTAGE';


    if (winner) {

      if (
        winner.delta.quality > 0 &&
        winner.wins >
          winner.losses &&
        winner.positiveRate >=
          0.55
      ) {

        classification =
          'PRUNED_CANDIDATE';

      }


      if (
        winner.delta.quality >=
          0.002 &&
        winner.positiveRate >=
          0.60 &&
        winner.delta.hit3 >=
          0
      ) {

        classification =
          'STRONG_PRUNED_CANDIDATE';

      }

    }


    const result = {

      version:
        VERSION,

      ready:
        true,

      reason:
        'C52_COMPLETE',

      prize:
        PRIZE,

      model:
        MODEL_ID,

      window:
        WINDOW_SIZE,

      holdoutSize:
        HOLDOUT_SIZE,

      provinceCount:
        provinceResults.length,

      reference,

      winner,

      candidates,

      classification,

      provinceResults,

      safety: {

        readOnly:
          true,

        productionWrite:
          false,

        storageWrite:
          false,

        lastForecastModified:
          false,

        savePredictionCalled:
          false

      },

      inspectedAt:
        new Date()
          .toISOString()

    };


    window
      .LAST_FIX03D59_C52_FEATURE_PRUNING =
      result;


    return result;

  }


  /*
   * =========================================================
   * REPORT
   * =========================================================
   */

  function buildReportC52(
    result
  ) {

    if (
      !result ||
      result.ready !== true
    ) {

      return (
        'C5.2 NOT READY\n\n' +
        (
          result &&
          result.reason
            ? result.reason
            : 'UNKNOWN'
        )
      );

    }


    const lines = [];


    lines.push(
      'C5.2 FEATURE PRUNING'
    );

    lines.push(
      'HOLDOUT BENCHMARK'
    );

    lines.push(
      '========================'
    );

    lines.push(
      'Prize: G8'
    );

    lines.push(
      'Model: RECENT'
    );

    lines.push(
      'Window: 60'
    );

    lines.push(
      'Provinces: ' +
      result.provinceCount
    );

    lines.push(
      'Holdout Size: ' +
      result.holdoutSize
    );


    lines.push('');

    lines.push(
      'REFERENCE — FULL FEATURES'
    );

    lines.push(
      'Tests: ' +
      result.reference.tests
    );

    lines.push(
      'Hit@1: ' +
      pctC52(
        result.reference.hit1Rate
      )
    );

    lines.push(
      'Hit@3: ' +
      pctC52(
        result.reference.hit3Rate
      )
    );

    lines.push(
      'Hit@5: ' +
      pctC52(
        result.reference.hit5Rate
      )
    );

    lines.push(
      'Hit@10: ' +
      pctC52(
        result.reference.hit10Rate
      )
    );

    lines.push(
      'MRR: ' +
      numC52(
        result.reference.mrr
      )
    );

    lines.push(
      'Avg Rank: ' +
      numC52(
        result.reference.averageRank,
        2
      )
    );

    lines.push(
      'Quality: ' +
      numC52(
        result.reference.quality
      )
    );


    lines.push('');

    lines.push(
      'CLASSIFICATION'
    );

    lines.push(
      result.classification
    );


    if (
      result.winner
    ) {

      const w =
        result.winner;


      lines.push('');

      lines.push(
        '🏆 BEST PRUNED CANDIDATE'
      );

      lines.push(
        w.label
      );

      lines.push(
        'Quality: ' +
        numC52(
          w.quality
        )
      );

      lines.push(
        'Quality Δ: ' +
        signedC52(
          w.delta.quality
        )
      );

      lines.push(
        'Hit@1: ' +
        pctC52(
          w.hit1Rate
        ) +
        ' · Δ ' +
        signedPctC52(
          w.delta.hit1
        )
      );

      lines.push(
        'Hit@3: ' +
        pctC52(
          w.hit3Rate
        ) +
        ' · Δ ' +
        signedPctC52(
          w.delta.hit3
        )
      );

      lines.push(
        'Hit@5: ' +
        pctC52(
          w.hit5Rate
        ) +
        ' · Δ ' +
        signedPctC52(
          w.delta.hit5
        )
      );

      lines.push(
        'Hit@10: ' +
        pctC52(
          w.hit10Rate
        ) +
        ' · Δ ' +
        signedPctC52(
          w.delta.hit10
        )
      );

      lines.push(
        'MRR: ' +
        numC52(
          w.mrr
        ) +
        ' · Δ ' +
        signedC52(
          w.delta.mrr
        )
      );

      lines.push(
        'Avg Rank: ' +
        numC52(
          w.averageRank,
          2
        ) +
        ' · Improvement ' +
        signedC52(
          w.delta.averageRank,
          2
        )
      );

      lines.push(
        'Province Win / Loss / Tie: ' +
        w.wins +
        ' / ' +
        w.losses +
        ' / ' +
        w.ties
      );

      lines.push(
        'Positive Rate: ' +
        pctC52(
          w.positiveRate
        )
      );


      if (
        w.worstProvince
      ) {

        lines.push(
          'Worst Province: ' +
          w.worstProvince
            .provinceName +
          ' · Δ ' +
          signedC52(
            w.worstProvince
              .delta
          )
        );

      }


      if (
        w.bestProvince
      ) {

        lines.push(
          'Best Province: ' +
          w.bestProvince
            .provinceName +
          ' · Δ ' +
          signedC52(
            w.bestProvince
              .delta
          )
        );

      }

    }


    lines.push('');

    lines.push(
      '========================'
    );

    lines.push(
      'ALL FEATURE SETS'
    );


    result
      .candidates
      .slice()
      .sort(
        (a, b) =>
          b.quality -
          a.quality
      )
      .forEach(
        (
          item,
          index
        ) => {

          lines.push('');

          lines.push(
            '#' +
            (index + 1) +
            ' ' +
            item.label
          );

          lines.push(
            'Q ' +
            numC52(
              item.quality
            ) +
            ' · Δ ' +
            signedC52(
              item.delta.quality
            )
          );

          lines.push(
            'H1 ' +
            pctC52(
              item.hit1Rate
            ) +
            ' · H3 ' +
            pctC52(
              item.hit3Rate
            ) +
            ' · H5 ' +
            pctC52(
              item.hit5Rate
            ) +
            ' · H10 ' +
            pctC52(
              item.hit10Rate
            )
          );

          lines.push(
            'MRR ' +
            numC52(
              item.mrr
            ) +
            ' · Rank ' +
            numC52(
              item.averageRank,
              2
            )
          );

          lines.push(
            'Province W/L/T ' +
            item.wins +
            '/' +
            item.losses +
            '/' +
            item.ties
          );

        }
      );


    lines.push('');

    lines.push(
      '========================'
    );

    lines.push(
      'RESEARCH ONLY'
    );

    lines.push(
      'NO PRODUCTION CHANGE'
    );

    lines.push(
      'READ ONLY / ZERO WRITE'
    );


    return lines.join(
      '\n'
    );

  }


  /*
   * =========================================================
   * PUBLIC API
   * =========================================================
   */

  window
    .runFix03D59C52FeaturePruning =
    runC52;


  window
    .buildFix03D59C52FeaturePruningReport =
    buildReportC52;


  window
    .FIX03D59_C52_FEATURE_PRUNING_VERSION =
    VERSION;


  window
    .FIX03D59_C52_FEATURE_PRUNING_LOADED =
    true;


  console.log(
    'FIX-03D5.9 C5.2 Feature Pruning V1 loaded / RESEARCH ONLY / READ ONLY'
  );

})();
