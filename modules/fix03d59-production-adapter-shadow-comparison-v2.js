/* =========================================================================
   FIX-03D5.9
   PRODUCTION ADAPTER SHADOW COMPARISON V2

   PURPOSE:
   - Compare CURRENT LAST_FORECAST with certified Shadow Adapter output.
   - Compare G1 -> G8 without modifying either side.
   - Detect current forecast schema conservatively.
   - Measure:
       + Top1 overlap
       + Top3 overlap
       + Top5 overlap
       + Top10 overlap
       + current predicted-number rank inside shadow ranking
   - Verify province binding.
   - Fail closed on ambiguous / unavailable current forecast schema.

   INPUT:
   - readLastForecast03D59()
   - runProductionForecastAdapterShadow03D59(provinceSlug)

   IMPORTANT:
   - SHADOW COMPARISON ONLY.
   - ENGINE EXECUTION ALLOWED FOR SHADOW SIDE.
   - ZERO PRODUCTION WRITE.
   - ZERO STORAGE WRITE.
   - NO renderForecast().
   - NO savePrediction().
   - NO LAST_FORECAST MODIFICATION.
   - NO ACTIVATION.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_PRODUCTION_ADAPTER_SHADOW_COMPARISON_V2';


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

  function clone03D59(
    value
  ) {

    if (
      value === undefined
    ) {

      return undefined;

    }


    try {

      return JSON.parse(
        JSON.stringify(
          value
        )
      );

    } catch (error) {

      return null;

    }

  }


  function normalizeNumber03D59(
    value
  ) {

    if (
      value === null ||
      value === undefined
    ) {

      return null;

    }


    const text =
      String(
        value
      )
        .trim();


    if (
      /^\d$/.test(
        text
      )
    ) {

      return (
        '0' +
        text
      );

    }


    if (
      /^\d{2}$/.test(
        text
      )
    ) {

      return text;

    }


    const n =
      Number(
        value
      );


    if (
      Number.isFinite(n) &&
      n >= 0 &&
      n <= 99
    ) {

      return String(
        Math.trunc(n)
      )
        .padStart(
          2,
          '0'
        );

    }


    return null;

  }


  function normalizeArray03D59(
    input
  ) {

    if (
      !Array.isArray(
        input
      )
    ) {

      return [];

    }


    const output = [];

    const seen =
      new Set();


    input.forEach(
      value => {

        let candidate =
          value;


        /*
         * Common ranking element shapes:
         * [number, score]
         * { number: '27' }
         * { value: '27' }
         * { num: '27' }
         */

        if (
          Array.isArray(value)
        ) {

          candidate =
            value[0];

        } else if (
          value &&
          typeof value ===
            'object'
        ) {

          if (
            value.number !==
            undefined
          ) {

            candidate =
              value.number;

          } else if (
            value.value !==
            undefined
          ) {

            candidate =
              value.value;

          } else if (
            value.num !==
            undefined
          ) {

            candidate =
              value.num;

          } else if (
            value.number2 !==
            undefined
          ) {

            candidate =
              value.number2;

          }

        }


        const normalized =
          normalizeNumber03D59(
            candidate
          );


        if (
          normalized === null ||
          seen.has(
            normalized
          )
        ) {

          return;

        }


        seen.add(
          normalized
        );


        output.push(
          normalized
        );

      }
    );


    return output;

  }


  function normalizeProvince03D59(
    value
  ) {

    return String(
      value ||
      ''
    )
      .trim()
      .toLowerCase()
      .normalize(
        'NFD'
      )
      .replace(
        /[\u0300-\u036f]/g,
        ''
      )
      .replace(
        /đ/g,
        'd'
      )
      .replace(
        /[^a-z0-9]+/g,
        '-'
      )
      .replace(
        /^-+|-+$/g,
        ''
      );

  }


  function intersection03D59(
    a,
    b
  ) {

    const setB =
      new Set(
        b
      );


    return a.filter(
      value =>
        setB.has(
          value
        )
    );

  }


  /*
   * =========================================================
   * CURRENT FORECAST ACCESS
   * =========================================================
   */

  function readCurrentForecast03D59() {

    if (
      typeof window
        .readLastForecast03D59 !==
      'function'
    ) {

      return {

        ready:
          false,

        reason:
          'LAST_FORECAST_READER_NOT_AVAILABLE'

      };

    }


    let forecast;


    try {

      forecast =
        window
          .readLastForecast03D59();

    } catch (error) {

      return {

        ready:
          false,

        reason:
          'LAST_FORECAST_READ_FAILED',

        error:
          error &&
          error.message
            ? error.message
            : String(error)

      };

    }


    if (
      !forecast ||
      typeof forecast !==
        'object'
    ) {

      return {

        ready:
          false,

        reason:
          'LAST_FORECAST_NOT_AVAILABLE',

        forecast:
          forecast || null

      };

    }


    return {

      ready:
        true,

      forecast:
        clone03D59(
          forecast
        )

    };

  }


  /*
   * =========================================================
   * PROVINCE EXTRACTION
   * =========================================================
   */

  function extractForecastProvince03D59(
    forecast
  ) {

    const candidates = [

      forecast &&
      forecast.province,

      forecast &&
      forecast.provinceSlug,

      forecast &&
      forecast.provinceId,

      forecast &&
      forecast.slug,

      forecast &&
      forecast.meta &&
      forecast.meta.province,

      forecast &&
      forecast.meta &&
      forecast.meta.provinceSlug,

      forecast &&
      forecast.context &&
      forecast.context.province

    ];


    const usable =
      candidates
        .filter(
          value =>
            typeof value ===
              'string' &&
            value.trim()
        );


    if (
      !usable.length
    ) {

      return {

        ready:
          false,

        reason:
          'CURRENT_FORECAST_PROVINCE_NOT_FOUND'

      };

    }


    const normalized =
      Array.from(
        new Set(
          usable.map(
            normalizeProvince03D59
          )
        )
      );


    if (
      normalized.length !==
      1
    ) {

      return {

        ready:
          false,

        reason:
          'CURRENT_FORECAST_PROVINCE_AMBIGUOUS',

        candidates:
          usable

      };

    }


    return {

      ready:
        true,

      raw:
        usable[0],

      normalized:
        normalized[0]

    };

  }


  /*
   * =========================================================
   * PRIZE NODE DISCOVERY
   *
   * Conservative only.
   * Do not recursively guess arbitrary structures.
   * =========================================================
   */

  function getPrizeNodes03D59(
    forecast,
    prize
  ) {

    const nodes = [];


    const containers = [

      {
        source:
          'forecast',
        value:
          forecast
      },

      {
        source:
          'forecast.prizes',
        value:
          forecast &&
          forecast.prizes
      },

      {
        source:
          'forecast.predictions',
        value:
          forecast &&
          forecast.predictions
      },

      {
        source:
          'forecast.results',
        value:
          forecast &&
          forecast.results
      },

      {
        source:
          'forecast.forecast',
        value:
          forecast &&
          forecast.forecast
      },

      {
        source:
          'forecast.ranking',
        value:
          forecast &&
          forecast.ranking
      },

      {
        source:
          'forecast.rankings',
        value:
          forecast &&
          forecast.rankings
      }

    ];


    containers.forEach(
      container => {

        const object =
          container.value;


        if (
          !object ||
          typeof object !==
            'object' ||
          Array.isArray(
            object
          )
        ) {

          return;

        }


        if (
          Object.prototype
            .hasOwnProperty.call(
              object,
              prize
            )
        ) {

          nodes.push({

            source:
              container.source +
              '.' +
              prize,

            value:
              object[
                prize
              ]

          });

        }

      }
    );


    return nodes;

  }


  /*
   * =========================================================
   * EXTRACT RANKING FROM ONE PRIZE NODE
   * =========================================================
   */

  function extractArraysFromPrizeNode03D59(
    node
  ) {

    const candidates = [];


    if (
      Array.isArray(
        node
      )
    ) {

      const normalized =
        normalizeArray03D59(
          node
        );


      if (
        normalized.length
      ) {

        candidates.push({

          source:
            'DIRECT_ARRAY',

          ranking:
            normalized

        });

      }


      return candidates;

    }


    if (
      !node ||
      typeof node !==
        'object'
    ) {

      const single =
        normalizeNumber03D59(
          node
        );


      if (
        single !== null
      ) {

        candidates.push({

          source:
            'DIRECT_VALUE',

          ranking: [
            single
          ]

        });

      }


      return candidates;

    }


    const keys = [
      'ranking',
      'ranked',
      'numbers',
      'predictions',
      'candidates',
      'top',
      'top10',
      'values',
      'forecast'
    ];


    keys.forEach(
      key => {

        if (
          !Object.prototype
            .hasOwnProperty.call(
              node,
              key
            )
        ) {

          return;

        }


        const value =
          node[key];


        if (
          Array.isArray(
            value
          )
        ) {

          const normalized =
            normalizeArray03D59(
              value
            );


          if (
            normalized.length
          ) {

            candidates.push({

              source:
                key,

              ranking:
                normalized

            });

          }

        } else {

          const single =
            normalizeNumber03D59(
              value
            );


          if (
            single !== null
          ) {

            candidates.push({

              source:
                key,

              ranking: [
                single
              ]

            });

          }

        }

      }
    );


    /*
     * Common explicit TOP groups.
     */

    [
      'top1',
      'top2',
      'top3',
      'top5',
      'top10'
    ]
      .forEach(
        key => {

          if (
            !Object.prototype
              .hasOwnProperty.call(
                node,
                key
              )
          ) {

            return;

          }


          const value =
            node[key];


          const normalized =
            Array.isArray(value)
              ? normalizeArray03D59(
                  value
                )
              : (
                  normalizeNumber03D59(
                    value
                  ) !== null
                    ? [
                        normalizeNumber03D59(
                          value
                        )
                      ]
                    : []
                );


          if (
            normalized.length
          ) {

            candidates.push({

              source:
                key,

              ranking:
                normalized

            });

          }

        }
      );


    return candidates;

  }


  /*
   * =========================================================
   * RESOLVE CURRENT PRIZE FORECAST
   *
   * Fail closed if two materially different candidate rankings
   * are found for the same prize.
   * =========================================================
   */

  function resolveCurrentPrize03D59(
    forecast,
    prize
  ) {

    const prizeNodes =
      getPrizeNodes03D59(
        forecast,
        prize
      );


    if (
      !prizeNodes.length
    ) {

      return {

        ready:
          false,

        prize,

        reason:
          'CURRENT_PRIZE_NODE_NOT_FOUND'

      };

    }


    const extracted = [];


    prizeNodes.forEach(
      nodeEntry => {

        const arrays =
          extractArraysFromPrizeNode03D59(
            nodeEntry.value
          );


        arrays.forEach(
          item => {

            extracted.push({

              source:
                nodeEntry.source +
                ':' +
                item.source,

              ranking:
                item.ranking

            });

          }
        );

      }
    );


    if (
      !extracted.length
    ) {

      return {

        ready:
          false,

        prize,

        reason:
          'CURRENT_PRIZE_RANKING_NOT_FOUND',

        nodeSources:
          prizeNodes.map(
            item =>
              item.source
          )

      };

    }


    /*
     * Remove duplicate equivalent candidates.
     */

    const unique = [];


    const signatures =
      new Set();


    extracted.forEach(
      item => {

        const signature =
          JSON.stringify(
            item.ranking
          );


        if (
          signatures.has(
            signature
          )
        ) {

          return;

        }


        signatures.add(
          signature
        );


        unique.push(
          item
        );

      }
    );


    /*
     * Prefer the longest ranking only when all shorter candidates
     * are exact prefixes of it.
     */

    unique.sort(
      (
        a,
        b
      ) =>
        b.ranking.length -
        a.ranking.length
    );


    const longest =
      unique[0];


    const compatible =
      unique.every(
        item => {

          return item.ranking
            .every(
              (
                value,
                index
              ) =>
                longest.ranking[
                  index
                ] ===
                value
            );

        }
      );


    if (
      !compatible
    ) {

      return {

        ready:
          false,

        prize,

        reason:
          'CURRENT_PRIZE_RANKING_AMBIGUOUS',

        candidates:
          unique.map(
            item => ({

              source:
                item.source,

              count:
                item.ranking.length,

              preview:
                item.ranking.slice(
                  0,
                  10
                )

            })
          )

      };

    }


    return {

      ready:
        true,

      prize,

      source:
        longest.source,

      ranking:
        longest.ranking.slice(),

      rankingCount:
        longest.ranking.length

    };

  }


  /*
   * =========================================================
   * ONE PRIZE COMPARISON
   * =========================================================
   */

  function comparePrize03D59(
    current,
    shadow
  ) {

    if (
      !current ||
      current.ready !==
        true
    ) {

      return {

        ready:
          false,

        reason:
          current &&
          current.reason
            ? current.reason
            : 'CURRENT_NOT_READY'

      };

    }


    if (
      !shadow ||
      shadow.ready !==
        true ||
      !Array.isArray(
        shadow.ranking
      )
    ) {

      return {

        ready:
          false,

        reason:
          'SHADOW_NOT_READY'

      };

    }


    const currentRanking =
      current.ranking;


    const shadowRanking =
      shadow.ranking;


    const currentTop1 =
      currentRanking.slice(
        0,
        1
      );

    const currentTop3 =
      currentRanking.slice(
        0,
        3
      );

    const currentTop5 =
      currentRanking.slice(
        0,
        5
      );

    const currentTop10 =
      currentRanking.slice(
        0,
        10
      );


    const shadowTop1 =
      shadowRanking.slice(
        0,
        1
      );

    const shadowTop3 =
      shadowRanking.slice(
        0,
        3
      );

    const shadowTop5 =
      shadowRanking.slice(
        0,
        5
      );

    const shadowTop10 =
      shadowRanking.slice(
        0,
        10
      );


    const primaryCurrentNumber =
      currentTop1[
        0
      ] ||
      null;


    const primaryShadowRank =
      primaryCurrentNumber !==
        null
        ? (
            shadowRanking.indexOf(
              primaryCurrentNumber
            ) + 1
          )
        : 0;


    return {

      ready:
        true,

      currentSource:
        current.source,

      currentRankingCount:
        currentRanking.length,

      shadowRankingCount:
        shadowRanking.length,

      current: {

        top1:
          currentTop1,

        top3:
          currentTop3,

        top5:
          currentTop5,

        top10:
          currentTop10

      },

      shadow: {

        top1:
          shadowTop1,

        top3:
          shadowTop3,

        top5:
          shadowTop5,

        top10:
          shadowTop10

      },

      overlap: {

        top1:
          intersection03D59(
            currentTop1,
            shadowTop1
          ),

        top3:
          intersection03D59(
            currentTop3,
            shadowTop3
          ),

        top5:
          intersection03D59(
            currentTop5,
            shadowTop5
          ),

        top10:
          intersection03D59(
            currentTop10,
            shadowTop10
          )

      },

      overlapCount: {

        top1:
          intersection03D59(
            currentTop1,
            shadowTop1
          ).length,

        top3:
          intersection03D59(
            currentTop3,
            shadowTop3
          ).length,

        top5:
          intersection03D59(
            currentTop5,
            shadowTop5
          ).length,

        top10:
          intersection03D59(
            currentTop10,
            shadowTop10
          ).length

      },

      currentTop1ShadowRank:
        primaryShadowRank > 0
          ? primaryShadowRank
          : null,

      sameTop1:
        (
          currentTop1.length ===
            1 &&
          shadowTop1.length ===
            1 &&
          currentTop1[0] ===
            shadowTop1[0]
        )

    };

  }


  /*
   * =========================================================
   * SAFETY
   * =========================================================
   */

  function safety03D59() {

    return {

      comparisonOnly:
        true,

      shadowOnly:
        true,

      engineExecutionAllowed:
        true,

      productionAuthorized:
        false,

      productionWrite:
        false,

      storageWrite:
        false,

      renderForecastCalled:
        false,

      savePredictionCalled:
        false,

      lastForecastModified:
        false,

      activationPerformed:
        false

    };

  }


  /*
   * =========================================================
   * MAIN
   * =========================================================
   */

  function runProductionShadowComparisonV2(
    provinceSlug
  ) {

    const province =
      String(
        provinceSlug ||
        ''
      ).trim();


    if (
      !province
    ) {

      return {

        version:
          VERSION,

        ready:
          false,

        passed:
          false,

        reason:
          'PROVINCE_NOT_PROVIDED',

        safety:
          safety03D59()

      };

    }


    /*
     * ---------------------------------------------------------
     * SNAPSHOT CURRENT FORECAST BEFORE SHADOW EXECUTION
     * ---------------------------------------------------------
     */

    const currentAccess =
      readCurrentForecast03D59();


    if (
      currentAccess.ready !==
      true
    ) {

      return {

        version:
          VERSION,

        ready:
          false,

        passed:
          false,

        reason:
          currentAccess.reason,

        province,

        safety:
          safety03D59()

      };

    }


    const currentForecast =
      currentAccess.forecast;


    const currentSnapshotBefore =
      JSON.stringify(
        currentForecast
      );


    /*
     * ---------------------------------------------------------
     * PROVINCE BINDING
     * ---------------------------------------------------------
     */

    const currentProvince =
      extractForecastProvince03D59(
        currentForecast
      );


    if (
      currentProvince.ready !==
      true
    ) {

      return {

        version:
          VERSION,

        ready:
          false,

        passed:
          false,

        reason:
          currentProvince.reason,

        province,

        provinceDiagnostic:
          currentProvince,

        safety:
          safety03D59()

      };

    }


    const requestedNormalized =
      normalizeProvince03D59(
        province
      );


    if (
      currentProvince.normalized !==
      requestedNormalized
    ) {

      return {

        version:
          VERSION,

        ready:
          false,

        passed:
          false,

        reason:
          'CURRENT_FORECAST_PROVINCE_MISMATCH',

        requestedProvince:
          province,

        currentForecastProvince:
          currentProvince.raw,

        safety:
          safety03D59()

      };

    }


    /*
     * ---------------------------------------------------------
     * SHADOW EXECUTION
     * ---------------------------------------------------------
     */

    if (
      typeof window
        .runProductionForecastAdapterShadow03D59 !==
      'function'
    ) {

      return {

        version:
          VERSION,

        ready:
          false,

        passed:
          false,

        reason:
          'SHADOW_ADAPTER_NOT_AVAILABLE',

        province,

        safety:
          safety03D59()

      };

    }


    const shadow =
      window
        .runProductionForecastAdapterShadow03D59(
          province
        );


    if (
      !shadow ||
      shadow.passed !==
        true
    ) {

      return {

        version:
          VERSION,

        ready:
          false,

        passed:
          false,

        reason:
          'SHADOW_ADAPTER_NOT_READY',

        province,

        shadowReason:
          shadow &&
          shadow.reason
            ? shadow.reason
            : null,

        safety:
          safety03D59()

      };

    }


    /*
     * ---------------------------------------------------------
     * CURRENT FORECAST MUST REMAIN UNCHANGED
     * ---------------------------------------------------------
     */

    const currentAccessAfter =
      readCurrentForecast03D59();


    if (
      currentAccessAfter.ready !==
      true
    ) {

      return {

        version:
          VERSION,

        ready:
          false,

        passed:
          false,

        reason:
          'CURRENT_FORECAST_AFTER_READ_FAILED',

        province,

        safety:
          safety03D59()

      };

    }


    const currentSnapshotAfter =
      JSON.stringify(
        currentAccessAfter.forecast
      );


    const lastForecastUnchanged =
      currentSnapshotBefore ===
      currentSnapshotAfter;


    if (
      !lastForecastUnchanged
    ) {

      return {

        version:
          VERSION,

        ready:
          false,

        passed:
          false,

        reason:
          'LAST_FORECAST_CHANGED_DURING_COMPARISON',

        province,

        lastForecastUnchanged:
          false,

        safety:
          safety03D59()

      };

    }


    /*
     * ---------------------------------------------------------
     * G1 -> G8 SCHEMA RESOLUTION + COMPARISON
     * ---------------------------------------------------------
     */

    const comparisons = {};

    const schemaDiagnostics = {};


    PRIZES.forEach(
      prize => {

        const currentPrize =
          resolveCurrentPrize03D59(
            currentForecast,
            prize
          );


        schemaDiagnostics[
          prize
        ] =
          clone03D59(
            currentPrize
          );


        comparisons[
          prize
        ] =
          comparePrize03D59(
            currentPrize,
            shadow.prizes[
              prize
            ]
          );

      }
    );


    const failedPrizes =
      PRIZES.filter(
        prize =>
          !comparisons[
            prize
          ] ||
          comparisons[
            prize
          ].ready !==
            true
      );


    const mappedPrizeCount =
      PRIZES.length -
      failedPrizes.length;


    /*
     * Comparison can only PASS when all 8 current prize schemas
     * are resolved unambiguously.
     */

    const passed =
      failedPrizes.length ===
      0;


    const aggregate = {

      sameTop1Count:
        0,

      top3OverlapTotal:
        0,

      top5OverlapTotal:
        0,

      top10OverlapTotal:
        0

    };


    if (passed) {

      PRIZES.forEach(
        prize => {

          const item =
            comparisons[
              prize
            ];


          if (
            item.sameTop1
          ) {

            aggregate
              .sameTop1Count++;

          }


          aggregate
            .top3OverlapTotal +=
              item
                .overlapCount
                .top3;


          aggregate
            .top5OverlapTotal +=
              item
                .overlapCount
                .top5;


          aggregate
            .top10OverlapTotal +=
              item
                .overlapCount
                .top10;

        }
      );

    }


    const result = {

      version:
        VERSION,

      ready:
        passed,

      passed,

      reason:
        passed
          ? 'SHADOW_COMPARISON_READY'
          : 'CURRENT_FORECAST_SCHEMA_NOT_FULLY_MAPPED',

      mode:
        'SHADOW_COMPARISON',

      province,

      currentForecastProvince:
        currentProvince.raw,

      provinceMatched:
        true,

      lastForecastUnchanged:
        true,

      shadowVersion:
        shadow.version,

      freezeVersion:
        shadow.freezeVersion,

      mappedPrizeCount,

      failedPrizeCount:
        failedPrizes.length,

      failedPrizes:
        failedPrizes.slice(),

      comparisons,

      schemaDiagnostics,

      aggregate,

      activationAuthorized:
        false,

      safety:
        safety03D59(),

      inspectedAt:
        new Date()
          .toISOString()

    };


    /*
     * Diagnostic RAM alias only.
     */

    window
      .LAST_FIX03D59_PRODUCTION_SHADOW_COMPARISON_V2 =
      clone03D59(
        result
      );


    return result;

  }


  /*
   * =========================================================
   * PUBLIC API
   * =========================================================
   */

  window
    .runProductionShadowComparisonV2 =
    runProductionShadowComparisonV2;


  window
    .FIX03D59_PRODUCTION_SHADOW_COMPARISON_V2_VERSION =
    VERSION;


  window
    .FIX03D59_PRODUCTION_SHADOW_COMPARISON_V2_LOADED =
    true;


  console.log(
    'FIX-03D5.9 Production Shadow Comparison V2 loaded / SHADOW ONLY / ZERO WRITE'
  );

})();
