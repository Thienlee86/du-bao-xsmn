/* =========================================================================
   FIX-03D5.9
   C4.2 G8 SELECTIVE WEIGHTED ENSEMBLE BENCHMARK MOBILE V1

   PURPOSE:
   - Research G8 only.
   - Compare:
       RECENT W60
       BASELINE W30
       and selective weighted rank ensembles.
   - Weighted Borda / rank consensus.
   - Walk-forward only.
   - 21 provinces.
   - Discovery benchmark only.

   TESTED WEIGHTS:
   RECENT / BASELINE
   - 100 / 0
   -  90 / 10
   -  80 / 20
   -  70 / 30
   -  60 / 40
   -  50 / 50

   METRICS:
   - Hit@1
   - Hit@3
   - Hit@5
   - Hit@10
   - MRR
   - Average Rank
   - Quality
   - Province wins vs RECENT
   - Province wins vs BASELINE
   - Worst province degradation

   IMPORTANT:
   - G8 ONLY.
   - RESEARCH / DISCOVERY ONLY.
   - NOT PRODUCTION CERTIFICATION.
   - READ ONLY.
   - ZERO STORAGE WRITE.
   - ZERO PRODUCTION WRITE.
   - NO LAST_FORECAST MODIFICATION.
   - NO savePrediction().
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_C42_G8_WEIGHTED_ENSEMBLE_MOBILE_V1';


  const PRIZE =
    'g8';


  const PANEL_ID =
    'fix03d59-c42-panel';

  const BUTTON_ID =
    'fix03d59-c42-run';

  const STATUS_ID =
    'fix03d59-c42-status';

  const OUTPUT_ID =
    'fix03d59-c42-output';


  const WEIGHT_PAIRS = [

    {
      recent: 1.00,
      baseline: 0.00
    },

    {
      recent: 0.90,
      baseline: 0.10
    },

    {
      recent: 0.80,
      baseline: 0.20
    },

    {
      recent: 0.70,
      baseline: 0.30
    },

    {
      recent: 0.60,
      baseline: 0.40
    },

    {
      recent: 0.50,
      baseline: 0.50
    }

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


  function pct(
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


  function signedPct(
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


  function num(
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


  function signed(
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


  function pairKey(
    pair
  ) {

    return (
      Math.round(
        pair.recent * 100
      ) +
      '/' +
      Math.round(
        pair.baseline * 100
      )
    );

  }


  /*
   * =========================================================
   * MODEL CONFIG ACCESS
   * =========================================================
   */

  function getModelConfigC42(
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
        config =>
          config &&
          String(
            config.id
          ).toUpperCase() ===
          String(
            modelId
          ).toUpperCase()
      ) ||
      null;

  }


  /*
   * =========================================================
   * METRIC
   * =========================================================
   */

  function createMetricC42() {

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


  function updateMetricC42(
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


  function finalizeMetricC42(
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
   * MODEL RANKINGS
   * =========================================================
   */

  function buildRankingC42(
    trainingDraws,
    config,
    windowSize
  ) {

    const scores =
      modelLabScoresV23(
        trainingDraws,
        PRIZE,
        windowSize,
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
   * WEIGHTED BORDA
   * =========================================================
   */

  function combineRankingsC42(
    recentRanking,
    baselineRanking,
    pair
  ) {

    const scores = {};


    for (
      let i = 0;
      i < 100;
      i++
    ) {

      scores[
        String(i)
          .padStart(
            2,
            '0'
          )
      ] = 0;

    }


    recentRanking.forEach(
      (
        number,
        index
      ) => {

        const rankScore =
          100 -
          index;


        scores[number] +=
          rankScore *
          pair.recent;

      }
    );


    baselineRanking.forEach(
      (
        number,
        index
      ) => {

        const rankScore =
          100 -
          index;


        scores[number] +=
          rankScore *
          pair.baseline;

      }
    );


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
   * ONE PROVINCE
   * =========================================================
   */

  function benchmarkProvinceC42(
    provinceSlug
  ) {

    const recentConfig =
      getModelConfigC42(
        'RECENT'
      );


    const baselineConfig =
      getModelConfigC42(
        'BASELINE'
      );


    if (
      !recentConfig ||
      !baselineConfig
    ) {

      return {

        ready:
          false,

        reason:
          'MODEL_CONFIG_NOT_AVAILABLE'

      };

    }


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
          'INSUFFICIENT_HISTORY'

      };

    }


    const metrics = {};


    WEIGHT_PAIRS.forEach(
      pair => {

        metrics[
          pairKey(pair)
        ] =
          createMetricC42();

      }
    );


    const baselineMetric =
      createMetricC42();


    const recentMetric =
      createMetricC42();


    for (
      let targetIndex =
        minimumTraining;
      targetIndex <
        draws.length;
      targetIndex++
    ) {

      /*
       * NO FUTURE LEAKAGE:
       * only draws before target.
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


      const recentRanking =
        buildRankingC42(
          trainingDraws,
          recentConfig,
          60
        );


      const baselineRanking =
        buildRankingC42(
          trainingDraws,
          baselineConfig,
          30
        );


      updateMetricC42(
        recentMetric,
        actual,
        recentRanking
      );


      updateMetricC42(
        baselineMetric,
        actual,
        baselineRanking
      );


      WEIGHT_PAIRS.forEach(
        pair => {

          const combined =
            combineRankingsC42(
              recentRanking,
              baselineRanking,
              pair
            );


          updateMetricC42(
            metrics[
              pairKey(pair)
            ],
            actual,
            combined
          );

        }
      );

    }


    const combinations = {};


    WEIGHT_PAIRS.forEach(
      pair => {

        combinations[
          pairKey(pair)
        ] =
          finalizeMetricC42(
            metrics[
              pairKey(pair)
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

      baseline:
        finalizeMetricC42(
          baselineMetric
        ),

      recent:
        finalizeMetricC42(
          recentMetric
        ),

      combinations

    };

  }


  /*
   * =========================================================
   * CROSS-PROVINCE AGGREGATION
   * =========================================================
   */

  function runBenchmarkC42() {

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
            benchmarkProvinceC42(
              province.slug
            )
        )
        .filter(
          item =>
            item &&
            item.ready === true
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


    function aggregateSource(
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


    const baseline =
      aggregateSource(
        result =>
          result.baseline
      );


    const recent =
      aggregateSource(
        result =>
          result.recent
      );


    const candidates = [];


    WEIGHT_PAIRS.forEach(
      pair => {

        const key =
          pairKey(
            pair
          );


        const aggregate =
          aggregateSource(
            result =>
              result
                .combinations[key]
          );


        let winsVsRecent =
          0;

        let lossesVsRecent =
          0;

        let winsVsBaseline =
          0;

        let lossesVsBaseline =
          0;


        const provinceQualityDeltaVsRecent =
          [];


        provinceResults.forEach(
          result => {

            const candidate =
              result
                .combinations[key];


            const recentDelta =
              candidate.quality -
              result.recent.quality;


            const baselineDelta =
              candidate.quality -
              result.baseline.quality;


            provinceQualityDeltaVsRecent
              .push(
                {
                  province:
                    result.province,

                  provinceName:
                    result.provinceName,

                  delta:
                    recentDelta
                }
              );


            if (
              recentDelta > 0
            ) {

              winsVsRecent++;

            } else if (
              recentDelta < 0
            ) {

              lossesVsRecent++;

            }


            if (
              baselineDelta > 0
            ) {

              winsVsBaseline++;

            } else if (
              baselineDelta < 0
            ) {

              lossesVsBaseline++;

            }

          }
        );


        provinceQualityDeltaVsRecent
          .sort(
            (a, b) =>
              a.delta -
              b.delta
          );


        const worstVsRecent =
          provinceQualityDeltaVsRecent[
            0
          ] ||
          null;


        const bestVsRecent =
          provinceQualityDeltaVsRecent[
            provinceQualityDeltaVsRecent
              .length - 1
          ] ||
          null;


        candidates.push({

          key,

          recentWeight:
            pair.recent,

          baselineWeight:
            pair.baseline,

          ...aggregate,

          deltaVsRecent: {

            quality:
              aggregate.quality -
              recent.quality,

            hit1:
              aggregate.hit1Rate -
              recent.hit1Rate,

            hit3:
              aggregate.hit3Rate -
              recent.hit3Rate,

            hit5:
              aggregate.hit5Rate -
              recent.hit5Rate,

            hit10:
              aggregate.hit10Rate -
              recent.hit10Rate,

            mrr:
              aggregate.mrr -
              recent.mrr,

            averageRank:
              recent.averageRank -
              aggregate.averageRank

          },

          deltaVsBaseline: {

            quality:
              aggregate.quality -
              baseline.quality,

            hit1:
              aggregate.hit1Rate -
              baseline.hit1Rate,

            hit3:
              aggregate.hit3Rate -
              baseline.hit3Rate,

            hit5:
              aggregate.hit5Rate -
              baseline.hit5Rate,

            hit10:
              aggregate.hit10Rate -
              baseline.hit10Rate,

            mrr:
              aggregate.mrr -
              baseline.mrr,

            averageRank:
              baseline.averageRank -
              aggregate.averageRank

          },

          winsVsRecent,

          lossesVsRecent,

          winsVsBaseline,

          lossesVsBaseline,

          worstVsRecent,

          bestVsRecent

        });

      }
    );


    /*
     * Research discovery ranking:
     *
     * 1. Higher Quality
     * 2. Higher Hit@3
     * 3. Higher MRR
     * 4. Lower Average Rank
     *
     * Same philosophy as current V2.3 / V2.4.
     */

    candidates.sort(
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
      candidates[0] ||
      null;


    const result = {

      version:
        VERSION,

      ready:
        Boolean(
          winner
        ),

      reason:
        winner
          ? 'C42_DISCOVERY_READY'
          : 'C42_NO_WINNER',

      prize:
        PRIZE,

      provinceCount:
        provinceResults.length,

      baseline,

      recent,

      winner,

      candidates,

      provinceResults,

      importantNote:
        'DISCOVERY_WINNER_REQUIRES_FUTURE_OOS_CERTIFICATION',

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
      .LAST_FIX03D59_C42_WEIGHTED_ENSEMBLE =
      result;


    return result;

  }


  /*
   * =========================================================
   * MOBILE REPORT
   * =========================================================
   */

  function buildReportC42(
    result
  ) {

    if (
      !result ||
      result.ready !== true
    ) {

      return (
        'C4.2 NOT READY\n\n' +
        (
          result &&
          result.reason
            ? result.reason
            : 'UNKNOWN'
        )
      );

    }


    const winner =
      result.winner;


    const lines = [];


    lines.push(
      'C4.2 G8 SELECTIVE'
    );

    lines.push(
      'WEIGHTED ENSEMBLE'
    );

    lines.push(
      '========================'
    );

    lines.push(
      'Provinces: ' +
      result.provinceCount
    );


    lines.push('');

    lines.push(
      'RECENT W60'
    );

    lines.push(
      'Hit@1: ' +
      pct(
        result.recent.hit1Rate
      )
    );

    lines.push(
      'Hit@3: ' +
      pct(
        result.recent.hit3Rate
      )
    );

    lines.push(
      'Hit@5: ' +
      pct(
        result.recent.hit5Rate
      )
    );

    lines.push(
      'Hit@10: ' +
      pct(
        result.recent.hit10Rate
      )
    );

    lines.push(
      'MRR: ' +
      num(
        result.recent.mrr
      )
    );

    lines.push(
      'Avg Rank: ' +
      num(
        result.recent.averageRank,
        2
      )
    );

    lines.push(
      'Quality: ' +
      num(
        result.recent.quality,
        4
      )
    );


    lines.push('');

    lines.push(
      'BASELINE W30'
    );

    lines.push(
      'Quality: ' +
      num(
        result.baseline.quality,
        4
      )
    );


    lines.push('');

    lines.push(
      '🏆 DISCOVERY WINNER'
    );

    lines.push(
      'RECENT / BASELINE: ' +
      winner.key
    );

    lines.push(
      'Hit@1: ' +
      pct(
        winner.hit1Rate
      )
    );

    lines.push(
      'Hit@3: ' +
      pct(
        winner.hit3Rate
      )
    );

    lines.push(
      'Hit@5: ' +
      pct(
        winner.hit5Rate
      )
    );

    lines.push(
      'Hit@10: ' +
      pct(
        winner.hit10Rate
      )
    );

    lines.push(
      'MRR: ' +
      num(
        winner.mrr
      )
    );

    lines.push(
      'Avg Rank: ' +
      num(
        winner.averageRank,
        2
      )
    );

    lines.push(
      'Quality: ' +
      num(
        winner.quality,
        4
      )
    );


    lines.push('');

    lines.push(
      'WINNER vs RECENT W60'
    );

    lines.push(
      'Quality Δ: ' +
      signed(
        winner
          .deltaVsRecent
          .quality
      )
    );

    lines.push(
      'Hit@1 Δ: ' +
      signedPct(
        winner
          .deltaVsRecent
          .hit1
      )
    );

    lines.push(
      'Hit@3 Δ: ' +
      signedPct(
        winner
          .deltaVsRecent
          .hit3
      )
    );

    lines.push(
      'Hit@5 Δ: ' +
      signedPct(
        winner
          .deltaVsRecent
          .hit5
      )
    );

    lines.push(
      'Hit@10 Δ: ' +
      signedPct(
        winner
          .deltaVsRecent
          .hit10
      )
    );

    lines.push(
      'MRR Δ: ' +
      signed(
        winner
          .deltaVsRecent
          .mrr
      )
    );

    lines.push(
      'Avg Rank Improvement: ' +
      signed(
        winner
          .deltaVsRecent
          .averageRank,
        2
      )
    );


    lines.push('');

    lines.push(
      'PROVINCE vs RECENT'
    );

    lines.push(
      'Wins: ' +
      winner.winsVsRecent
    );

    lines.push(
      'Losses: ' +
      winner.lossesVsRecent
    );


    if (
      winner.worstVsRecent
    ) {

      lines.push(
        'Worst: ' +
        winner
          .worstVsRecent
          .provinceName +
        ' · Δ ' +
        signed(
          winner
            .worstVsRecent
            .delta
        )
      );

    }


    if (
      winner.bestVsRecent
    ) {

      lines.push(
        'Best: ' +
        winner
          .bestVsRecent
          .provinceName +
        ' · Δ ' +
        signed(
          winner
            .bestVsRecent
            .delta
        )
      );

    }


    lines.push('');

    lines.push(
      'ALL WEIGHTS'
    );


    result
      .candidates
      .forEach(
        (
          item,
          index
        ) => {

          lines.push(
            '#' +
            (index + 1) +
            ' ' +
            item.key +
            ' · Q ' +
            num(
              item.quality,
              4
            ) +
            ' · H1 ' +
            pct(
              item.hit1Rate
            ) +
            ' · H3 ' +
            pct(
              item.hit3Rate
            ) +
            ' · MRR ' +
            num(
              item.mrr
            ) +
            ' · Rank ' +
            num(
              item.averageRank,
              2
            )
          );

        }
      );


    lines.push('');

    lines.push(
      '========================'
    );

    lines.push(
      'DISCOVERY ONLY'
    );

    lines.push(
      'WINNER IS NOT CERTIFIED'
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
   * MOBILE RUN
   * =========================================================
   */

  function runC42Mobile() {

    const button =
      document.getElementById(
        BUTTON_ID
      );

    const status =
      document.getElementById(
        STATUS_ID
      );

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (button) {

      button.style.pointerEvents =
        'none';

      button.style.opacity =
        '.55';

      button.textContent =
        '⏳ Đang chạy C4.2...';

    }


    if (status) {

      status.textContent =
        '⏳ G8 · 21 tỉnh · 6 tỷ trọng...';

    }


    if (output) {

      output.textContent =
        '';

    }


    setTimeout(
      function () {

        try {

          const result =
            runBenchmarkC42();


          if (status) {

            status.textContent =
              result.ready
                ? (
                    '✅ C4.2 hoàn tất · ' +
                    result
                      .provinceCount +
                    ' tỉnh.'
                  )
                : (
                    '❌ C4.2 chưa có kết quả.'
                  );

          }


          if (output) {

            output.textContent =
              buildReportC42(
                result
              );

          }

        } catch (error) {

          if (status) {

            status.textContent =
              '❌ C4.2 lỗi: ' +
              (
                error &&
                error.message
                  ? error.message
                  : String(error)
              );

          }

        } finally {

          if (button) {

            button.style
              .pointerEvents =
              'auto';

            button.style.opacity =
              '1';

            button.textContent =
              '⚖️ Chạy C4.2 Weighted Ensemble';

          }

        }

      },
      50
    );

  }


  /*
   * =========================================================
   * PANEL
   * =========================================================
   */

  function attach() {

    if (
      document.getElementById(
        PANEL_ID
      )
    ) {

      return true;

    }


    const settings =
      document.getElementById(
        'tab-settings'
      );


    if (!settings) {

      return false;

    }


    const panel =
      document.createElement(
        'div'
      );


    panel.id =
      PANEL_ID;


    panel.style.cssText =
      [
        'margin-top:18px',
        'padding:16px',
        'border:1px solid rgba(255,189,60,.35)',
        'border-radius:16px',
        'background:rgba(255,255,255,.05)'
      ].join(';');


    panel.innerHTML = `

      <div
        style="
          font-size:18px;
          font-weight:900;
          margin-bottom:8px;
        "
      >
        ⚖️ C4.2 G8 Weighted Ensemble
      </div>

      <div
        style="
          opacity:.75;
          font-size:13px;
          line-height:1.55;
          margin-bottom:14px;
        "
      >
        RECENT W60 + BASELINE W30
        <br>
        100/0 → 50/50
        <br>
        21 tỉnh · Walk-Forward
        <br>
        Discovery Only · Read Only
      </div>

      <div
        id="${BUTTON_ID}"
        role="button"
        tabindex="0"
        style="
          display:flex;
          width:100%;
          min-height:58px;
          align-items:center;
          justify-content:center;
          padding:13px;
          box-sizing:border-box;
          border-radius:14px;
          background:
            linear-gradient(
              90deg,
              #ffbd3c,
              #a78bfa
            );
          color:#17192f;
          font-size:16px;
          font-weight:900;
          text-align:center;
          cursor:pointer;
          user-select:none;
        "
      >
        ⚖️ Chạy C4.2 Weighted Ensemble
      </div>

      <div
        id="${STATUS_ID}"
        style="
          margin-top:12px;
          font-size:13px;
          line-height:1.5;
        "
      >
        Chưa chạy.
      </div>

      <pre
        id="${OUTPUT_ID}"
        style="
          margin-top:12px;
          padding:12px;
          border-radius:11px;
          background:rgba(0,0,0,.22);
          white-space:pre-wrap;
          word-break:break-word;
          font-size:12px;
          line-height:1.55;
          overflow:auto;
        "
      ></pre>

    `;


    settings.appendChild(
      panel
    );


    const button =
      document.getElementById(
        BUTTON_ID
      );


    if (button) {

      button.addEventListener(
        'click',
        runC42Mobile
      );

    }


    return true;

  }


  if (
    !attach()
  ) {

    let attempts =
      0;


    const timer =
      setInterval(
        function () {

          attempts++;


          if (
            attach() ||
            attempts >= 20
          ) {

            clearInterval(
              timer
            );

          }

        },
        500
      );

  }


  /*
   * =========================================================
   * PUBLIC API
   * =========================================================
   */

  window
    .runFix03D59C42WeightedEnsemble =
    runBenchmarkC42;


  window
    .runFix03D59C42WeightedEnsembleMobile =
    runC42Mobile;


  window
    .FIX03D59_C42_WEIGHTED_ENSEMBLE_VERSION =
    VERSION;


  window
    .FIX03D59_C42_WEIGHTED_ENSEMBLE_LOADED =
    true;


  console.log(
    'FIX-03D5.9 C4.2 G8 Weighted Ensemble Mobile V1 loaded / DISCOVERY ONLY / READ ONLY'
  );

})();
