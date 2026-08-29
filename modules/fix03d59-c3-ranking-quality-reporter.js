/* =========================================================================
   FIX-03D5.9
   C3 RANKING QUALITY REPORTER V1

   FILE:
   modules/fix03d59-c3-ranking-quality-reporter.js

   PURPOSE:
   - Reuse existing V2.2 walk-forward backtest.
   - Analyze actual-rank quality for G1 -> G8.
   - Report:
       + Tested
       + Hit@1
       + Hit@3
       + Hit@5
       + Hit@10
       + Average Rank
       + MRR
       + Rank buckets
   - Keep DB separate from legacy 00 -> 99 ranking.
   - Never modify Production Engine.
   - Never modify LAST_FORECAST.
   - Never call savePrediction().
   - Never write storage.

   READ ONLY
   ZERO PRODUCTION WRITE
   ZERO STORAGE WRITE
   NO ENGINE MODIFICATION
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_C3_RANKING_QUALITY_REPORTER_V1';


  /*
   * =========================================================
   * 1. HELPERS
   * =========================================================
   */

  function safeNumberC3(
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


  function percentC3(
    count,
    total
  ) {

    if (!total) {

      return '0.0%';

    }


    return (
      count /
      total *
      100
    ).toFixed(1) + '%';

  }


  function averageC3(
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
        (sum, value) =>
          sum +
          safeNumberC3(
            value
          ),
        0
      ) /
      values.length
    );

  }


  /*
   * =========================================================
   * 2. ANALYZE ONE PRIZE
   * =========================================================
   */

  function analyzePrizeC3(
    backtestResult,
    prizeKey
  ) {

    if (
      !backtestResult ||
      !Array.isArray(
        backtestResult.cases
      )
    ) {

      return {

        ready:
          false,

        reason:
          'BACKTEST_CASES_NOT_AVAILABLE'

      };

    }


    const ranks = [];


    backtestResult
      .cases
      .forEach(
        testCase => {

          if (
            !testCase ||
            !testCase.prizes ||
            !testCase.prizes[
              prizeKey
            ]
          ) {

            return;

          }


          const rank =
            Number(
              testCase
                .prizes[
                  prizeKey
                ]
                .bestActualRank
            );


          if (
            Number.isFinite(
              rank
            ) &&
            rank >= 1 &&
            rank <= 100
          ) {

            ranks.push(
              rank
            );

          }

        }
      );


    const tested =
      ranks.length;


    const hit1 =
      ranks.filter(
        rank =>
          rank <= 1
      ).length;


    const hit3 =
      ranks.filter(
        rank =>
          rank <= 3
      ).length;


    const hit5 =
      ranks.filter(
        rank =>
          rank <= 5
      ).length;


    const hit10 =
      ranks.filter(
        rank =>
          rank <= 10
      ).length;


    const bucket1to3 =
      ranks.filter(
        rank =>
          rank >= 1 &&
          rank <= 3
      ).length;


    const bucket4to5 =
      ranks.filter(
        rank =>
          rank >= 4 &&
          rank <= 5
      ).length;


    const bucket6to10 =
      ranks.filter(
        rank =>
          rank >= 6 &&
          rank <= 10
      ).length;


    const bucket11to20 =
      ranks.filter(
        rank =>
          rank >= 11 &&
          rank <= 20
      ).length;


    const bucket21to50 =
      ranks.filter(
        rank =>
          rank >= 21 &&
          rank <= 50
      ).length;


    const bucket51to100 =
      ranks.filter(
        rank =>
          rank >= 51 &&
          rank <= 100
      ).length;


    const mrr =
      tested
        ? ranks.reduce(
            (sum, rank) =>
              sum +
              (
                1 /
                rank
              ),
            0
          ) /
          tested
        : 0;


    const averageRank =
      averageC3(
        ranks
      );


    return {

      ready:
        true,

      prizeKey,

      tested,

      hit1,

      hit3,

      hit5,

      hit10,

      hit1Rate:
        tested
          ? hit1 /
            tested
          : 0,

      hit3Rate:
        tested
          ? hit3 /
            tested
          : 0,

      hit5Rate:
        tested
          ? hit5 /
            tested
          : 0,

      hit10Rate:
        tested
          ? hit10 /
            tested
          : 0,

      averageRank,

      mrr,

      rankBuckets: {

        rank1to3:
          bucket1to3,

        rank4to5:
          bucket4to5,

        rank6to10:
          bucket6to10,

        rank11to20:
          bucket11to20,

        rank21to50:
          bucket21to50,

        rank51to100:
          bucket51to100

      },

      ranks

    };

  }


  /*
   * =========================================================
   * 3. ANALYZE ONE PROVINCE
   * =========================================================
   */

  function analyzeProvinceRankingQualityC3(
    provinceSlug =
      (
        typeof SELECTED_PROVINCE !==
          'undefined'
          ? SELECTED_PROVINCE
          : null
      ),
    windowSize =
      (
        typeof WINDOW_SIZE !==
          'undefined'
          ? WINDOW_SIZE
          : 30
      )
  ) {

    if (
      typeof backtestProvinceV22 !==
        'function'
    ) {

      return {

        ready:
          false,

        reason:
          'BACKTEST_V22_NOT_AVAILABLE'

      };

    }


    if (!provinceSlug) {

      return {

        ready:
          false,

        reason:
          'PROVINCE_NOT_AVAILABLE'

      };

    }


    let backtest = null;


    try {

      backtest =
        backtestProvinceV22(
          provinceSlug,
          windowSize
        );

    } catch (error) {

      return {

        ready:
          false,

        reason:
          'BACKTEST_EXECUTION_FAILED',

        error:
          String(
            error &&
            error.message
              ? error.message
              : error
          )

      };

    }


    if (
      !backtest ||
      !Array.isArray(
        backtest.cases
      )
    ) {

      return {

        ready:
          false,

        reason:
          'BACKTEST_RESULT_INVALID'

      };

    }


    const prizeKeys = [

      'g1',
      'g2',
      'g3',
      'g4',
      'g5',
      'g6',
      'g7',
      'g8'

    ];


    const prizes = {};


    prizeKeys.forEach(
      key => {

        prizes[key] =
          analyzePrizeC3(
            backtest,
            key
          );

      }
    );


    const result = {

      version:
        VERSION,

      ready:
        true,

      reason:
        'C3_RANKING_QUALITY_READY',

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

      windowSize:
        safeNumberC3(
          windowSize,
          30
        ),

      testedDraws:
        safeNumberC3(
          backtest.testedDraws,
          0
        ),

      testFrom:
        backtest.testFrom ||
        null,

      testTo:
        backtest.testTo ||
        null,

      /*
       * DB intentionally excluded from legacy 00 -> 99 rank quality.
       */

      db: {

        mode:
          'SEPARATE',

        reason:
          'DB_FULL6_NOT_EVALUATED_BY_LEGACY_00_99_RANK'

      },

      prizes,

      readOnly:
        true,

      productionModified:
        false,

      storageWrite:
        false,

      inspectedAt:
        new Date()
          .toISOString()

    };


    window
      .LAST_FIX03D59_C3_RANKING_QUALITY =
      result;


    return result;

  }


  /*
   * =========================================================
   * 4. CONSOLE REPORT
   * =========================================================
   */

  function printProvinceRankingQualityC3(
    provinceSlug,
    windowSize
  ) {

    const result =
      analyzeProvinceRankingQualityC3(
        provinceSlug,
        windowSize
      );


    if (
      !result ||
      result.ready !== true
    ) {

      console.log(
        'C3 NOT READY:',
        result
      );

      return result;

    }


    console.log(
      '=========================================='
    );

    console.log(
      'FIX-03D5.9 C3 — RANKING QUALITY'
    );

    console.log(
      result.provinceName
    );

    console.log(
      `Window: ${result.windowSize}`
    );

    console.log(
      `Tested Draws: ${result.testedDraws}`
    );

    console.log(
      `Period: ${result.testFrom} -> ${result.testTo}`
    );

    console.log(
      '=========================================='
    );


    const rows = [];


    Object.keys(
      result.prizes
    )
    .forEach(
      key => {

        const item =
          result.prizes[
            key
          ];


        rows.push({

          Prize:
            key.toUpperCase(),

          Tested:
            item.tested,

          Hit1:
            percentC3(
              item.hit1,
              item.tested
            ),

          Hit3:
            percentC3(
              item.hit3,
              item.tested
            ),

          Hit5:
            percentC3(
              item.hit5,
              item.tested
            ),

          Hit10:
            percentC3(
              item.hit10,
              item.tested
            ),

          AvgRank:
            item.averageRank
              .toFixed(
                2
              ),

          MRR:
            item.mrr
              .toFixed(
                4
              )

        });

      }
    );


    console.table(
      rows
    );


    console.log(
      'DB:',
      'SEPARATE — Full 6-digit rank not mixed with legacy 00-99.'
    );


    return result;

  }


  /*
   * =========================================================
   * 5. ALL PROVINCES SUMMARY
   * =========================================================
   */

  function summarizeAllProvincesRankingQualityC3(
    windowSize = 30
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

        const result =
          analyzeProvinceRankingQualityC3(
            province.slug,
            windowSize
          );


        results.push(
          result
        );

      }
    );


    return {

      version:
        VERSION,

      ready:
        true,

      windowSize,

      provinceCount:
        results.length,

      results,

      readOnly:
        true,

      productionModified:
        false,

      storageWrite:
        false,

      inspectedAt:
        new Date()
          .toISOString()

    };

  }


  /*
   * =========================================================
   * 6. PUBLIC API
   * =========================================================
   */

  window
    .analyzeProvinceRankingQualityC3 =
    analyzeProvinceRankingQualityC3;


  window
    .printProvinceRankingQualityC3 =
    printProvinceRankingQualityC3;


  window
    .summarizeAllProvincesRankingQualityC3 =
    summarizeAllProvincesRankingQualityC3;


  window
    .FIX03D59_C3_RANKING_QUALITY_REPORTER_VERSION =
    VERSION;


  window
    .FIX03D59_C3_RANKING_QUALITY_REPORTER_LOADED =
    true;


  console.log(
    'FIX-03D5.9 C3 Ranking Quality Reporter V1 loaded / READ ONLY / V2.2 BACKTEST REUSE'
  );

})();
