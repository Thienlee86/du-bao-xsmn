/* =========================================================================
   FIX-03D5.9
   PRODUCTION CONFIG FREEZE V2

   PURPOSE:
   - Freeze the research-validated Production configuration.
   - Keep configuration outside app.js.
   - Provide one immutable runtime source for future Production adapter.
   - Explicitly exclude rejected research branches.

   IMPORTANT:
   - CONFIG ONLY.
   - ZERO ENGINE EXECUTION.
   - ZERO STORAGE WRITE.
   - ZERO PRODUCTION WRITE.
   - NO savePrediction().
   - NO LAST_FORECAST MODIFICATION.
   - FAIL CLOSED if any required prize config is unresolved.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_PRODUCTION_CONFIG_FREEZE_V2';


  /*
   * =========================================================
   * PRIZE CONFIGURATION
   * =========================================================
   *
   * Research-derived winners.
   *
   * G1 intentionally unresolved until its C3.2 winner
   * is confirmed again.
   * =========================================================
   */

  const PRIZE_CONFIG = {

    db: {

      status:
        'PRESERVE_EXISTING_PRODUCTION',

      note:
        'DB Full-6 remains on existing validated Production path.'

    },


g1: {
  status: 'FROZEN',
  model: 'BALANCED',
  window: 20,
  source: 'C3.2_CROSS_PROVINCE_BENCHMARK',
  evidence: {
    provinces: 21,
    quality: 7.23,
    top1: 0.0089,
    top3: 0.0259,
    mrr: 0.0484,
    averageRank: 51.13,
    baseline30Quality: 7.13,
    qualityDeltaVsBaseline30: 0.10
  }
},


    g2: {

      status:
        'FROZEN',

      model:
        'BALANCED',

      window:
        10

    },


    g3: {

      status:
        'FROZEN',

      model:
        'BASELINE',

      window:
        20

    },


    g4: {

      status:
        'FROZEN',

      model:
        'FREQUENCY',

      window:
        30

    },


    g5: {

      status:
        'FROZEN',

      model:
        'CYCLE',

      window:
        20

    },


    g6: {

      status:
        'FROZEN',

      model:
        'BALANCED',

      window:
        20

    },


    g7: {

      status:
        'FROZEN',

      model:
        'BASELINE',

      window:
        30

    },


    g8: {

      status:
        'FROZEN',

      model:
        'RECENT',

      window:
        60,

      featurePolicy:
        'FULL_EXISTING_FEATURE_SET',

      researchChampion:
        true

    }

  };


  /*
   * =========================================================
   * RESEARCH POLICY
   * =========================================================
   */

  const RESEARCH_POLICY = {

    allowedInProduction: {

      c3BenchmarkWinners:
        true,

      g8RecentW60Full:
        true

    },


    excludedFromProduction: {

      equalRankEnsemble:
        true,

      weightedEnsemble:
        true,

      provinceAdaptive:
        true,

      featurePruning:
        true,

      crossPrizeSignal:
        true,

      transitionMarkov:
        true,

      regimeDetection:
        true

    }

  };


  /*
   * =========================================================
   * OUTPUT POLICY
   * =========================================================
   *
   * Prediction UI should treat ranking as probability-oriented
   * statistical prioritization, not certainty.
   * =========================================================
   */

  const OUTPUT_POLICY = {

    rankingMode:
      'TOP_N_PRIORITY',

    recommendedViews: [
      'TOP_3',
      'TOP_5',
      'TOP_10'
    ],

    certaintyClaim:
      false,

    interpretation:
      'STATISTICAL_RANKING_ONLY'

  };


  /*
   * =========================================================
   * VALIDATION
   * =========================================================
   */

  function inspectFreeze03D59V2() {

    const required =
      [
        'g1',
        'g2',
        'g3',
        'g4',
        'g5',
        'g6',
        'g7',
        'g8'
      ];


    const unresolved =
      required.filter(
        key => {

          const item =
            PRIZE_CONFIG[
              key
            ];


          return (
            !item ||
            item.status !==
              'FROZEN' ||
            !item.model ||
            !Number.isFinite(
              Number(
                item.window
              )
            )
          );

        }
      );


    const ready =
      unresolved.length ===
      0;


    return {

      version:
        VERSION,

      ready,

      status:
        ready
          ? 'PRODUCTION_CONFIG_FROZEN'
          : 'PRODUCTION_CONFIG_INCOMPLETE',

      unresolved,

      prizeConfig:
        JSON.parse(
          JSON.stringify(
            PRIZE_CONFIG
          )
        ),

      researchPolicy:
        JSON.parse(
          JSON.stringify(
            RESEARCH_POLICY
          )
        ),

      outputPolicy:
        JSON.parse(
          JSON.stringify(
            OUTPUT_POLICY
          )
        ),

      safety: {

        configOnly:
          true,

        engineExecuted:
          false,

        productionWrite:
          false,

        storageWrite:
          false,

        savePredictionCalled:
          false,

        lastForecastModified:
          false

      }

    };

  }


  /*
   * =========================================================
   * READ-ONLY GETTER
   * =========================================================
   */

  function readProductionConfigFreeze03D59V2() {

    const inspection =
      inspectFreeze03D59V2();


    return JSON.parse(
      JSON.stringify(
        inspection
      )
    );

  }


  /*
   * =========================================================
   * PUBLIC API
   * =========================================================
   */

/*
 * =========================================================
 * MOBILE / CONSOLE FREEZE VALIDATION
 * =========================================================
 */

function validateProductionFreeze03D59V2() {

  const result =
    inspectFreeze03D59V2();


  const expected = {

    g1: ['BALANCED', 20],
    g2: ['BALANCED', 10],
    g3: ['BASELINE', 20],
    g4: ['FREQUENCY', 30],
    g5: ['CYCLE', 20],
    g6: ['BALANCED', 20],
    g7: ['BASELINE', 30],
    g8: ['RECENT', 60]

  };


  const mismatches = [];


  Object
    .entries(expected)
    .forEach(
      ([prize, expectedConfig]) => {

        const actual =
          result.prizeConfig &&
          result.prizeConfig[prize];


        if (
          !actual ||
          actual.status !== 'FROZEN' ||
          actual.model !== expectedConfig[0] ||
          Number(actual.window) !== expectedConfig[1]
        ) {

          mismatches.push({

            prize,

            expected: {
              model: expectedConfig[0],
              window: expectedConfig[1]
            },

            actual:
              actual || null

          });

        }

      }
    );


  const passed =
    result.ready === true &&
    result.unresolved.length === 0 &&
    mismatches.length === 0;


  const validation = {

    version:
      'FIX03D59_PRODUCTION_FREEZE_VALIDATION_V1',

    passed,

    freezeReady:
      result.ready,

    status:
      result.status,

    frozenPrizes:
      passed
        ? 8
        : 8 - mismatches.length,

    unresolved:
      result.unresolved,

    mismatches,

    config: {

      g1: 'BALANCED W20',
      g2: 'BALANCED W10',
      g3: 'BASELINE W20',
      g4: 'FREQUENCY W30',
      g5: 'CYCLE W20',
      g6: 'BALANCED W20',
      g7: 'BASELINE W30',
      g8: 'RECENT W60'

    },

    safety: {

      readOnly: true,
      engineExecuted: false,
      productionWrite: false,
      storageWrite: false,
      lastForecastModified: false,
      savePredictionCalled: false

    }

  };


  window
    .LAST_FIX03D59_PRODUCTION_FREEZE_VALIDATION =
    validation;


  console.log(
    'FIX-03D5.9 Production Freeze Validation',
    validation
  );


  return validation;

}
   
  window
    .inspectProductionConfigFreeze03D59V2 =
    inspectFreeze03D59V2;


  window
    .readProductionConfigFreeze03D59V2 =
    readProductionConfigFreeze03D59V2;

window
  .validateProductionFreeze03D59V2 =
  validateProductionFreeze03D59V2;
   
  window
    .FIX03D59_PRODUCTION_CONFIG_FREEZE_V2_VERSION =
    VERSION;


  window
    .FIX03D59_PRODUCTION_CONFIG_FREEZE_V2_LOADED =
    true;


  console.log(
    'FIX-03D5.9 Production Config Freeze V2 loaded / CONFIG ONLY / FAIL CLOSED'
  );

})();
