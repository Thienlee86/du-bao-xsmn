/* =========================================================================
   FIX-03D5.9
   C4.3 G8 PROVINCE-ADAPTIVE HOLDOUT RESEARCH V1

   PURPOSE:
   - Research whether G8 should use a different Model × Window per province.
   - Reference:
       RECENT W60
   - Candidate space:
       5 V2.3 models × 4 windows = 20 configurations.
   - Selection and evaluation are separated in TIME.
   - Candidate is selected only from earlier historical targets.
   - Selected configuration is then FROZEN.
   - Final evaluation uses later HOLDOUT targets.

   DATA FLOW:
       historical draws
            ↓
       chronological order
            ↓
       SELECTION ZONE
       walk-forward candidate research
            ↓
       Adaptive Guard
            ↓
       freeze decision
            ↓
       HOLDOUT ZONE
       selected candidate vs RECENT W60
            ↓
       cross-province evaluation

   IMPORTANT:
   - G8 ONLY.
   - RESEARCH ONLY.
   - NO PRODUCTION PROMOTION.
   - READ ONLY.
   - ZERO STORAGE WRITE.
   - ZERO PRODUCTION WRITE.
   - NO LAST_FORECAST MODIFICATION.
   - NO savePrediction().
   - NO MODEL WEIGHT MODIFICATION.
   - NO FUTURE LEAKAGE.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_C43_G8_PROVINCE_ADAPTIVE_HOLDOUT_V1';


  const PRIZE =
    'g8';


  /*
   * ---------------------------------------------------------
   * REFERENCE CONFIGURATION
   * ---------------------------------------------------------
   */

  const REFERENCE = {

    model:
      'RECENT',

    window:
      60

  };


  /*
   * ---------------------------------------------------------
   * WINDOWS TO RESEARCH
   * ---------------------------------------------------------
   */

  const WINDOWS = [
    10,
    20,
    30,
    60
  ];


  /*
   * ---------------------------------------------------------
   * TEMPORAL SPLIT
   *
   * With 100 draws:
   *
   * minimum training = 30
   *
   * targets 30..69:
   * selection zone = 40 tests
   *
   * targets 70..99:
   * holdout zone = 30 tests
   *
   * The selected configuration never sees
   * HOLDOUT actual results before being frozen.
   * ---------------------------------------------------------
   */

  const MINIMUM_TRAINING =
    30;


  const HOLDOUT_SIZE =
    30;


  /*
   * ---------------------------------------------------------
   * ADAPTIVE GUARD
   *
   * Candidate must show enough evidence in SELECTION zone.
   *
   * Quality scale is approximately 0 -> 1.
   * +0.003 = +0.30 quality percentage point.
   * ---------------------------------------------------------
   */

  const GUARD = {

    minimumSelectionTests:
      30,

    minimumQualityDelta:
      0.003,

    minimumMetricWins:
      3,

    /*
     * Do not accept a challenger that gains Quality
     * by destroying important ranking metrics.
     */

    maxTop1Degradation:
      0.010,

    maxTop3Degradation:
      0.015,

    maxMRRDegradation:
      0.005,

    maxAverageRankDegradation:
      3.0

  };


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


  function normalizeModelId(
    value
  ) {

    const text =
      String(
        value || ''
      )
        .trim()
        .toUpperCase();


    if (
      text.includes(
        'BASELINE'
      )
    ) {

      return 'BASELINE';

    }


    if (
      text.includes(
        'RECENT'
      )
    ) {

      return 'RECENT';

    }


    if (
      text.includes(
        'FREQUENCY'
      )
    ) {

      return 'FREQUENCY';

    }


    if (
      text.includes(
        'BALANCED'
      )
    ) {

      return 'BALANCED';

    }


    if (
      text.includes(
        'CYCLE'
      )
    ) {

      return 'CYCLE';

    }


    return text;

  }


  function configKey(
    model,
    windowSize
  ) {

    return (
      normalizeModelId(
        model
      ) +
      '|W' +
      Number(
        windowSize
      )
    );

  }


  /*
   * =========================================================
   * MODEL CONFIG ACCESS
   * =========================================================
   */

  function getModelConfigsC43() {

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


  function findModelConfigC43(
    modelId
  ) {

    return getModelConfigsC43()
      .find(
        config =>
          normalizeModelId(
            config.id
          ) ===
          normalizeModelId(
            modelId
          )
      ) ||
      null;

  }


  /*
   * =========================================================
   * METRIC
   * =========================================================
   */

  function createMetricC43() {

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


  function updateMetricC43(
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


  function finalizeMetricC43(
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


    /*
     * Same Quality philosophy used by V2.3.
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


  /*
   * =========================================================
   * RANKING BUILDER
   * =========================================================
   */

  function buildRankingC43(
    trainingDraws,
    modelConfig,
    windowSize
  ) {

    const scores =
      modelLabScoresV23(
        trainingDraws,
        PRIZE,
        windowSize,
        modelConfig.weights
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
   * EVALUATE ONE CONFIG ON ONE TARGET RANGE
   * =========================================================
   *
   * targetStart inclusive
   * targetEnd exclusive
   *
   * Every target still receives only historical data
   * occurring BEFORE that target.
   * =========================================================
   */

  function evaluateConfigRangeC43(
    drawsChronological,
    modelConfig,
    windowSize,
    targetStart,
    targetEnd
  ) {

    const metric =
      createMetricC43();


    for (
      let targetIndex =
        targetStart;
      targetIndex <
        targetEnd;
      targetIndex++
    ) {

      const trainingChronological =
        drawsChronological
          .slice(
            0,
            targetIndex
          );


      const trainingDraws =
        trainingChronological
          .slice()
          .reverse();


      const actualDraw =
        drawsChronological[
          targetIndex
        ];


      const actual =
        loOfPrize(
          actualDraw,
          PRIZE
        );


      const ranking =
        buildRankingC43(
          trainingDraws,
          modelConfig,
          windowSize
        );


      updateMetricC43(
        metric,
        actual,
        ranking
      );

    }


    return finalizeMetricC43(
      metric
    );

  }


  /*
   * =========================================================
   * DELTA
   * =========================================================
   */

  function metricDeltaC43(
    candidate,
    reference
  ) {

    return {

      quality:
        candidate.quality -
        reference.quality,

      hit1:
        candidate.hit1Rate -
        reference.hit1Rate,

      hit3:
        candidate.hit3Rate -
        reference.hit3Rate,

      hit5:
        candidate.hit5Rate -
        reference.hit5Rate,

      hit10:
        candidate.hit10Rate -
        reference.hit10Rate,

      mrr:
        candidate.mrr -
        reference.mrr,

      /*
       * Positive = candidate has LOWER / better rank.
       */

      averageRank:
        reference.averageRank -
        candidate.averageRank

    };

  }


  /*
   * =========================================================
   * ADAPTIVE GUARD
   * =========================================================
   */

  function inspectGuardC43(
    candidate,
    reference
  ) {

    const delta =
      metricDeltaC43(
        candidate,
        reference
      );


    const wins = [

      delta.quality > 0,

      delta.hit1 > 0,

      delta.hit3 > 0,

      delta.mrr > 0,

      delta.averageRank > 0

    ]
      .filter(
        Boolean
      )
      .length;


    const checks = {

      enoughTests:
        candidate.tests >=
        GUARD
          .minimumSelectionTests,

      enoughQuality:
        delta.quality >=
        GUARD
          .minimumQualityDelta,

      enoughMetricWins:
        wins >=
        GUARD
          .minimumMetricWins,

      top1Safe:
        delta.hit1 >=
        -GUARD
          .maxTop1Degradation,

      top3Safe:
        delta.hit3 >=
        -GUARD
          .maxTop3Degradation,

      mrrSafe:
        delta.mrr >=
        -GUARD
          .maxMRRDegradation,

      averageRankSafe:
        delta.averageRank >=
        -GUARD
          .maxAverageRankDegradation

    };


    const passed =
      Object
        .values(
          checks
        )
        .every(
          Boolean
        );


    return {

      passed,

      metricWins:
        wins,

      delta,

      checks

    };

  }


  /*
   * =========================================================
   * SELECT CONFIG FOR ONE PROVINCE
   * =========================================================
   */

  function selectProvinceConfigC43(
    drawsChronological,
    selectionStart,
    selectionEnd
  ) {

    const referenceConfig =
      findModelConfigC43(
        REFERENCE.model
      );


    if (
      !referenceConfig
    ) {

      return {

        ready:
          false,

        reason:
          'REFERENCE_CONFIG_NOT_FOUND'

      };

    }


    const referenceMetric =
      evaluateConfigRangeC43(
        drawsChronological,
        referenceConfig,
        REFERENCE.window,
        selectionStart,
        selectionEnd
      );


    const candidates = [];


    getModelConfigsC43()
      .forEach(
        modelConfig => {

          WINDOWS.forEach(
            windowSize => {

              const metric =
                evaluateConfigRangeC43(
                  drawsChronological,
                  modelConfig,
                  windowSize,
                  selectionStart,
                  selectionEnd
                );


              const guard =
                inspectGuardC43(
                  metric,
                  referenceMetric
                );


              candidates.push({

                model:
                  normalizeModelId(
                    modelConfig.id
                  ),

                window:
                  windowSize,

                key:
                  configKey(
                    modelConfig.id,
                    windowSize
                  ),

                metric,

                guard,

                isReference:
                  (
                    normalizeModelId(
                      modelConfig.id
                    ) ===
                    REFERENCE.model &&
                    windowSize ===
                    REFERENCE.window
                  )

              });

            }
          );

        }
      );


    /*
     * Only challengers passing the guard
     * can replace RECENT W60.
     */

    const eligible =
      candidates
        .filter(
          item =>
            !item.isReference &&
            item.guard.passed
        )
        .sort(
          (a, b) => {

            if (
              b.metric.quality !==
              a.metric.quality
            ) {

              return (
                b.metric.quality -
                a.metric.quality
              );

            }


            if (
              b.metric.hit3Rate !==
              a.metric.hit3Rate
            ) {

              return (
                b.metric.hit3Rate -
                a.metric.hit3Rate
              );

            }


            if (
              b.metric.mrr !==
              a.metric.mrr
            ) {

              return (
                b.metric.mrr -
                a.metric.mrr
              );

            }


            return (
              a.metric.averageRank -
              b.metric.averageRank
            );

          }
        );


    const winner =
      eligible.length
        ? eligible[0]
        : null;


    if (!winner) {

      return {

        ready:
          true,

        decision:
          'KEEP',

        selectedModel:
          REFERENCE.model,

        selectedWindow:
          REFERENCE.window,

        selectedKey:
          configKey(
            REFERENCE.model,
            REFERENCE.window
          ),

        referenceMetric,

        selectedMetric:
          referenceMetric,

        selectionDelta: {

          quality:
            0,

          hit1:
            0,

          hit3:
            0,

          hit5:
            0,

          hit10:
            0,

          mrr:
            0,

          averageRank:
            0

        },

        eligibleCount:
          0,

        candidates

      };

    }


    return {

      ready:
        true,

      decision:
        'SWITCH',

      selectedModel:
        winner.model,

      selectedWindow:
        winner.window,

      selectedKey:
        winner.key,

      referenceMetric,

      selectedMetric:
        winner.metric,

      selectionDelta:
        winner.guard.delta,

      eligibleCount:
        eligible.length,

      candidates

    };

  }


  /*
   * =========================================================
   * ONE PROVINCE
   * =========================================================
   */

  function evaluateProvinceC43(
    province
  ) {

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
      Math.max(
        MINIMUM_TRAINING + 1,
        draws.length -
        HOLDOUT_SIZE
      );


    const selectionStart =
      MINIMUM_TRAINING;


    const selectionEnd =
      holdoutStart;


    if (
      selectionEnd -
      selectionStart <
      GUARD
        .minimumSelectionTests
    ) {

      return {

        ready:
          false,

        province:
          province.slug,

        provinceName:
          province.name,

        reason:
          'INSUFFICIENT_SELECTION_TESTS',

        selectionTests:
          selectionEnd -
          selectionStart

      };

    }


    /*
     * ---------------------------------------------------------
     * STEP 1
     * Use ONLY earlier targets to select config.
     * ---------------------------------------------------------
     */

    const selection =
      selectProvinceConfigC43(
        draws,
        selectionStart,
        selectionEnd
      );


    if (
      !selection ||
      selection.ready !== true
    ) {

      return {

        ready:
          false,

        province:
          province.slug,

        provinceName:
          province.name,

        reason:
          (
            selection &&
            selection.reason
          ) ||
          'SELECTION_FAILED'

      };

    }


    /*
     * ---------------------------------------------------------
     * STEP 2
     * Freeze selected model/window.
     * ---------------------------------------------------------
     */

    const selectedConfig =
      findModelConfigC43(
        selection.selectedModel
      );


    const referenceConfig =
      findModelConfigC43(
        REFERENCE.model
      );


    if (
      !selectedConfig ||
      !referenceConfig
    ) {

      return {

        ready:
          false,

        province:
          province.slug,

        provinceName:
          province.name,

        reason:
          'HOLDOUT_CONFIG_NOT_FOUND'

      };

    }


    /*
     * ---------------------------------------------------------
     * STEP 3
     * Evaluate frozen config on later HOLDOUT only.
     * ---------------------------------------------------------
     */

    const adaptiveHoldout =
      evaluateConfigRangeC43(
        draws,
        selectedConfig,
        selection.selectedWindow,
        holdoutStart,
        draws.length
      );


    const referenceHoldout =
      evaluateConfigRangeC43(
        draws,
        referenceConfig,
        REFERENCE.window,
        holdoutStart,
        draws.length
      );


    const holdoutDelta =
      metricDeltaC43(
        adaptiveHoldout,
        referenceHoldout
      );


    /*
     * Holdout outcome.
     *
     * A SWITCH succeeds if adaptive Quality
     * remains greater than reference Quality.
     *
     * KEEP is naturally a tie because adaptive
     * and reference are identical.
     */

    let holdoutOutcome =
      'TIE';


    if (
      selection.decision ===
      'SWITCH'
    ) {

      if (
        holdoutDelta.quality >
        0
      ) {

        holdoutOutcome =
          'WIN';

      } else if (
        holdoutDelta.quality <
        0
      ) {

        holdoutOutcome =
          'LOSS';

      }

    }


    return {

      ready:
        true,

      province:
        province.slug,

      provinceName:
        province.name,

      drawCount:
        draws.length,

      selectionPeriod: {

        startIndex:
          selectionStart,

        endIndexExclusive:
          selectionEnd,

        tests:
          selectionEnd -
          selectionStart

      },

      holdoutPeriod: {

        startIndex:
          holdoutStart,

        endIndexExclusive:
          draws.length,

        tests:
          draws.length -
          holdoutStart

      },

      decision:
        selection.decision,

      selected: {

        model:
          selection.selectedModel,

        window:
          selection.selectedWindow,

        key:
          selection.selectedKey

      },

      reference: {

        model:
          REFERENCE.model,

        window:
          REFERENCE.window,

        key:
          configKey(
            REFERENCE.model,
            REFERENCE.window
          )

      },

      eligibleCount:
        selection.eligibleCount,

      selectionDelta:
        selection.selectionDelta,

      adaptiveHoldout,

      referenceHoldout,

      holdoutDelta,

      holdoutOutcome

    };

  }


  /*
   * =========================================================
   * CROSS-PROVINCE AGGREGATION
   * =========================================================
   */

  function aggregateMetricC43(
    results,
    source
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


    results.forEach(
      result => {

        const metric =
          result[
            source
          ];


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


  function runProvinceAdaptiveC43() {

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


    const results =
      PROVINCES
        .map(
          province =>
            evaluateProvinceC43(
              province
            )
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
          'NO_VALID_PROVINCES',

        results

      };

    }


    const adaptive =
      aggregateMetricC43(
        valid,
        'adaptiveHoldout'
      );


    const reference =
      aggregateMetricC43(
        valid,
        'referenceHoldout'
      );


    const delta =
      metricDeltaC43(
        adaptive,
        reference
      );


    const switched =
      valid.filter(
        result =>
          result.decision ===
          'SWITCH'
      );


    const kept =
      valid.filter(
        result =>
          result.decision ===
          'KEEP'
      );


    const switchWins =
      switched.filter(
        result =>
          result.holdoutOutcome ===
          'WIN'
      ).length;


    const switchLosses =
      switched.filter(
        result =>
          result.holdoutOutcome ===
          'LOSS'
      ).length;


    const switchTies =
      switched.length -
      switchWins -
      switchLosses;


    const provinceDeltas =
      valid.map(
        result =>
          result.holdoutDelta
            .quality
      );


    const positiveProvinces =
      provinceDeltas.filter(
        value =>
          value > 0
      ).length;


    const negativeProvinces =
      provinceDeltas.filter(
        value =>
          value < 0
      ).length;


    const zeroProvinces =
      valid.length -
      positiveProvinces -
      negativeProvinces;


    const sortedByDelta =
      valid
        .slice()
        .sort(
          (a, b) =>
            a.holdoutDelta
              .quality -
            b.holdoutDelta
              .quality
        );


    const worstProvince =
      sortedByDelta[
        0
      ] ||
      null;


    const bestProvince =
      sortedByDelta[
        sortedByDelta.length -
        1
      ] ||
      null;


    /*
     * ---------------------------------------------------------
     * FINAL RESEARCH CLASSIFICATION
     * ---------------------------------------------------------
     *
     * This still does NOT authorize Production.
     */

    const switchSuccessRate =
      switched.length
        ? switchWins /
          switched.length
        : 0;


    const positiveProvinceRate =
      valid.length
        ? positiveProvinces /
          valid.length
        : 0;


    let classification =
      'NO_ADAPTIVE_ADVANTAGE';


    if (
      switched.length >= 5 &&
      switchSuccessRate >= 0.60 &&
      delta.quality > 0 &&
      delta.mrr >= 0 &&
      median(
        provinceDeltas
      ) >= 0
    ) {

      classification =
        'ADAPTIVE_CANDIDATE';

    } else if (
      switched.length >= 3 &&
      switchSuccessRate >= 0.50 &&
      delta.quality > 0
    ) {

      classification =
        'WATCH';

    }


    const result = {

      version:
        VERSION,

      ready:
        true,

      reason:
        'C43_PROVINCE_ADAPTIVE_READY',

      prize:
        PRIZE,

      reference: {

        model:
          REFERENCE.model,

        window:
          REFERENCE.window

      },

      provinceCount:
        valid.length,

      selectionMethod:
        'EARLY_SELECTION_LATE_HOLDOUT',

      holdoutSize:
        HOLDOUT_SIZE,

      adaptive,

      referenceHoldout:
        reference,

      delta,

      decisions: {

        keep:
          kept.length,

        switch:
          switched.length

      },

      robustness: {

        positiveProvinces,

        negativeProvinces,

        zeroProvinces,

        positiveProvinceRate,

        medianProvinceQualityDelta:
          median(
            provinceDeltas
          ),

        meanProvinceQualityDelta:
          mean(
            provinceDeltas
          ),

        switchWins,

        switchLosses,

        switchTies,

        switchSuccessRate,

        worstProvince,

        bestProvince

      },

      classification,

      provinceResults:
        valid,

      rejectedResults:
        results.filter(
          result =>
            !result ||
            result.ready !==
              true
        ),

      importantNote:
        'RESEARCH_ONLY_NOT_PRODUCTION_CERTIFICATION',

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
      .LAST_FIX03D59_C43_PROVINCE_ADAPTIVE =
      result;


    return result;

  }


  /*
   * =========================================================
   * PUBLIC API
   * =========================================================
   */

  window
    .runFix03D59C43ProvinceAdaptive =
    runProvinceAdaptiveC43;


  window
    .evaluateProvinceC43 =
    evaluateProvinceC43;


  window
    .FIX03D59_C43_PROVINCE_ADAPTIVE_VERSION =
    VERSION;


  window
    .FIX03D59_C43_PROVINCE_ADAPTIVE_LOADED =
    true;


  console.log(
    'FIX-03D5.9 C4.3 G8 Province-Adaptive Holdout Research V1 loaded / READ ONLY / TEMPORAL HOLDOUT'
  );

})();
