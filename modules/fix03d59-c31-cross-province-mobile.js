/* =========================================================================
   FIX-03D5.9
   C3.1 CROSS-PROVINCE RANKING QUALITY MOBILE V1

   PURPOSE:
   - Reuse existing C3 Ranking Quality Reporter.
   - Run ranking-quality validation across ALL registered provinces.
   - Process provinces sequentially for mobile friendliness.
   - Aggregate G1 -> G8:
       + Tested
       + Hit@1
       + Hit@3
       + Hit@5
       + Hit@10
       + Average Rank
       + MRR
   - Show strongest / weakest province per prize.
   - DB remains separate.

   SAFETY:
   - READ ONLY.
   - ZERO PRODUCTION WRITE.
   - ZERO STORAGE WRITE.
   - NO savePrediction().
   - NO LAST_FORECAST MODIFICATION.
   - NO PRODUCTION ENGINE MODIFICATION.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_C31_CROSS_PROVINCE_MOBILE_V1';


  const PANEL_ID =
    'fix03d59-c31-cross-province-panel';

  const OUTPUT_ID =
    'fix03d59-c31-cross-province-output';

  const STATUS_ID =
    'fix03d59-c31-cross-province-status';

  const BUTTON_ID =
    'fix03d59-c31-cross-province-run';


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


  function pct(
    value
  ) {

    const n =
      Number(value);

    if (
      !Number.isFinite(n)
    ) {

      return '-';

    }


    return (
      n * 100
    ).toFixed(1) + '%';

  }


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


  /*
   * =========================================================
   * AGGREGATE ALL PROVINCES
   * =========================================================
   */

  function aggregateResults(
    results,
    windowSize
  ) {

    const aggregate = {};


    PRIZES.forEach(
      key => {

        aggregate[key] = {

          tested:
            0,

          hit1:
            0,

          hit3:
            0,

          hit5:
            0,

          hit10:
            0,

          rankSum:
            0,

          reciprocalRankSum:
            0,

          provinces:
            []

        };

      }
    );


    results.forEach(
      provinceResult => {

        if (
          !provinceResult ||
          provinceResult.ready !== true ||
          !provinceResult.prizes
        ) {

          return;

        }


        PRIZES.forEach(
          key => {

            const item =
              provinceResult
                .prizes[key];


            if (
              !item ||
              item.ready !== true ||
              !item.tested
            ) {

              return;

            }


            const target =
              aggregate[key];


            const tested =
              safeNumber(
                item.tested
              );


            target.tested +=
              tested;

            target.hit1 +=
              safeNumber(
                item.hit1
              );

            target.hit3 +=
              safeNumber(
                item.hit3
              );

            target.hit5 +=
              safeNumber(
                item.hit5
              );

            target.hit10 +=
              safeNumber(
                item.hit10
              );


            target.rankSum +=
              safeNumber(
                item.averageRank
              ) *
              tested;


            target.reciprocalRankSum +=
              safeNumber(
                item.mrr
              ) *
              tested;


            target.provinces.push({

              province:
                provinceResult
                  .province,

              provinceName:
                provinceResult
                  .provinceName,

              tested,

              hit5Rate:
                safeNumber(
                  item.hit5Rate
                ),

              hit10Rate:
                safeNumber(
                  item.hit10Rate
                ),

              averageRank:
                safeNumber(
                  item.averageRank
                ),

              mrr:
                safeNumber(
                  item.mrr
                )

            });

          }
        );

      }
    );


    const finalized = {};


    PRIZES.forEach(
      key => {

        const item =
          aggregate[key];


        const tested =
          item.tested;


        const provinceRows =
          item.provinces
            .slice();


        /*
         * Strongest:
         * 1. Higher Hit@10
         * 2. Higher Hit@5
         * 3. Lower Avg Rank
         */
        provinceRows.sort(
          (a, b) => {

            if (
              b.hit10Rate !==
              a.hit10Rate
            ) {

              return (
                b.hit10Rate -
                a.hit10Rate
              );

            }


            if (
              b.hit5Rate !==
              a.hit5Rate
            ) {

              return (
                b.hit5Rate -
                a.hit5Rate
              );

            }


            return (
              a.averageRank -
              b.averageRank
            );

          }
        );


        const strongest =
          provinceRows.length
            ? provinceRows[0]
            : null;


        const weakest =
          provinceRows.length
            ? provinceRows[
                provinceRows.length - 1
              ]
            : null;


        finalized[key] = {

          tested,

          hit1:
            item.hit1,

          hit3:
            item.hit3,

          hit5:
            item.hit5,

          hit10:
            item.hit10,

          hit1Rate:
            tested
              ? item.hit1 /
                tested
              : 0,

          hit3Rate:
            tested
              ? item.hit3 /
                tested
              : 0,

          hit5Rate:
            tested
              ? item.hit5 /
                tested
              : 0,

          hit10Rate:
            tested
              ? item.hit10 /
                tested
              : 0,

          averageRank:
            tested
              ? item.rankSum /
                tested
              : 0,

          mrr:
            tested
              ? item
                  .reciprocalRankSum /
                tested
              : 0,

          strongest,

          weakest,

          provinceCount:
            provinceRows.length

        };

      }
    );


    return {

      version:
        VERSION,

      ready:
        true,

      reason:
        'C31_CROSS_PROVINCE_READY',

      windowSize,

      provinceCount:
        results.filter(
          item =>
            item &&
            item.ready === true
        ).length,

      totalProvinceResults:
        results.length,

      db: {

        mode:
          'SEPARATE',

        reason:
          'DB_FULL6_NOT_MIXED_WITH_LEGACY_00_99_RANK'

      },

      prizes:
        finalized,

      results,

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
          false

      },

      inspectedAt:
        new Date()
          .toISOString()

    };

  }


  /*
   * =========================================================
   * BUILD TEXT REPORT
   * =========================================================
   */

  function buildReport(
    result
  ) {

    if (
      !result ||
      result.ready !== true
    ) {

      return (
        'C3.1 NOT READY\n\n' +
        'Reason: ' +
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
      'C3.1 CROSS-PROVINCE'
    );

    lines.push(
      'RANKING QUALITY'
    );

    lines.push(
      '===================='
    );

    lines.push(
      'Window: ' +
      result.windowSize
    );

    lines.push(
      'Provinces: ' +
      result.provinceCount +
      '/' +
      result.totalProvinceResults
    );

    lines.push('');

    lines.push(
      'DB: SEPARATE — FULL 6 DIGITS'
    );

    lines.push(
      'Legacy /100 rank NOT used for DB.'
    );


    PRIZES.forEach(
      key => {

        const item =
          result.prizes[key];


        lines.push('');

        lines.push(
          '--------------------'
        );

        lines.push(
          key.toUpperCase()
        );


        if (!item) {

          lines.push(
            'NO DATA'
          );

          return;

        }


        lines.push(
          'Tested: ' +
          item.tested
        );

        lines.push(
          'Hit@1:  ' +
          pct(
            item.hit1Rate
          )
        );

        lines.push(
          'Hit@3:  ' +
          pct(
            item.hit3Rate
          )
        );

        lines.push(
          'Hit@5:  ' +
          pct(
            item.hit5Rate
          )
        );

        lines.push(
          'Hit@10: ' +
          pct(
            item.hit10Rate
          )
        );

        lines.push(
          'Avg Rank: ' +
          item.averageRank
            .toFixed(2)
        );

        lines.push(
          'MRR: ' +
          item.mrr
            .toFixed(4)
        );


        if (
          item.strongest
        ) {

          lines.push(
            'Best: ' +
            item.strongest
              .provinceName +
            ' · H@10 ' +
            pct(
              item.strongest
                .hit10Rate
            ) +
            ' · Avg ' +
            item.strongest
              .averageRank
              .toFixed(1)
          );

        }


        if (
          item.weakest
        ) {

          lines.push(
            'Weakest: ' +
            item.weakest
              .provinceName +
            ' · H@10 ' +
            pct(
              item.weakest
                .hit10Rate
            ) +
            ' · Avg ' +
            item.weakest
              .averageRank
              .toFixed(1)
          );

        }

      }
    );


    lines.push('');

    lines.push(
      '===================='
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
   * RUN SEQUENTIALLY
   * =========================================================
   */

  function runCrossProvinceC31(
    windowSize = 30
  ) {

    const output =
      document.getElementById(
        OUTPUT_ID
      );

    const status =
      document.getElementById(
        STATUS_ID
      );

    const button =
      document.getElementById(
        BUTTON_ID
      );


    if (
      typeof window
        .analyzeProvinceRankingQualityC3 !==
      'function'
    ) {

      if (status) {

        status.textContent =
          '❌ C3 Reporter chưa sẵn sàng.';

      }

      return;

    }


    if (
      typeof PROVINCES ===
        'undefined' ||
      !Array.isArray(
        PROVINCES
      ) ||
      !PROVINCES.length
    ) {

      if (status) {

        status.textContent =
          '❌ Không tìm thấy danh sách tỉnh.';

      }

      return;

    }


    const provinces =
      PROVINCES.slice();


    const results = [];


    let index = 0;


    if (button) {

      button.disabled =
        true;

      button.textContent =
        '⏳ Đang chạy 21 tỉnh...';

    }


    if (output) {

      output.textContent =
        '';

    }


    function next() {

      if (
        index >=
        provinces.length
      ) {

        const finalResult =
          aggregateResults(
            results,
            windowSize
          );


        window
          .LAST_FIX03D59_C31_CROSS_PROVINCE =
          finalResult;


        if (status) {

          status.textContent =
            '✅ Hoàn tất ' +
            finalResult
              .provinceCount +
            '/' +
            finalResult
              .totalProvinceResults +
            ' tỉnh.';

        }


        if (output) {

          output.textContent =
            buildReport(
              finalResult
            );

        }


        if (button) {

          button.disabled =
            false;

          button.textContent =
            '🌐 Chạy C3.1 toàn bộ tỉnh';

        }


        return;

      }


      const province =
        provinces[
          index
        ];


      if (status) {

        status.textContent =
          '⏳ ' +
          (index + 1) +
          '/' +
          provinces.length +
          ' · ' +
          province.name;

      }


      let result;


      try {

        result =
          window
            .analyzeProvinceRankingQualityC3(
              province.slug,
              windowSize
            );

      } catch (error) {

        result = {

          ready:
            false,

          province:
            province.slug,

          provinceName:
            province.name,

          reason:
            'C31_PROVINCE_ERROR',

          error:
            String(
              error &&
              error.message
                ? error.message
                : error
            )

        };

      }


      results.push(
        result
      );


      index++;


      /*
       * Yield to browser between provinces
       * so mobile UI remains responsive.
       */
      setTimeout(
        next,
        20
      );

    }


    next();

  }


  /*
   * =========================================================
   * MOBILE PANEL
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
        'border:1px solid rgba(99,217,255,.28)',
        'border-radius:16px',
        'background:rgba(255,255,255,.05)'
      ].join(
        ';'
      );


    panel.innerHTML = `
      <div
        style="
          font-size:18px;
          font-weight:900;
          margin-bottom:8px;
        "
      >
        🌐 C3.1 Cross-Province
      </div>

      <div
        style="
          font-size:13px;
          opacity:.75;
          line-height:1.5;
          margin-bottom:12px;
        "
      >
        Walk-Forward Ranking Quality ·
        toàn bộ tỉnh · Window 30 ·
        G1→G8 · DB Full-6 tách riêng.
      </div>

      <button
        type="button"
        id="${BUTTON_ID}"
        style="
          width:100%;
          padding:13px;
          border:0;
          border-radius:11px;
          font-weight:900;
        "
      >
        🌐 Chạy C3.1 toàn bộ tỉnh
      </button>

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
        function () {

          runCrossProvinceC31(
            30
          );

        }
      );

    }


    return true;

  }


  if (
    !attach()
  ) {

    let attempts = 0;


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


  window
    .runFix03D59CrossProvinceC31 =
    runCrossProvinceC31;


  window
    .FIX03D59_C31_CROSS_PROVINCE_MOBILE_VERSION =
    VERSION;


  window
    .FIX03D59_C31_CROSS_PROVINCE_MOBILE_LOADED =
    true;


  console.log(
    'FIX-03D5.9 C3.1 Cross-Province Mobile V1 loaded / READ ONLY'
  );

})();
