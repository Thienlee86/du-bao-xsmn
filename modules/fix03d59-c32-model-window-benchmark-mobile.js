/* =========================================================================
   FIX-03D5.9
   C3.2 MODEL × WINDOW CROSS-PROVINCE BENCHMARK MOBILE V1

   PURPOSE:
   - Reuse existing V2.3 Model Lab.
   - Compare Model × Window across ALL registered provinces.
   - Run ONE prize at a time for mobile safety.
   - G1 -> G8 only.
   - DB intentionally excluded from legacy 00 -> 99 benchmark.

   MODELS:
   - BASELINE
   - RECENT
   - FREQUENCY
   - BALANCED
   - CYCLE

   WINDOWS:
   - 10
   - 20
   - 30
   - 60

   METRICS:
   - Average Quality
   - Average Top1
   - Average Top3
   - Average MRR
   - Average Rank
   - Province coverage
   - Win count across provinces

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
    'FIX03D59_C32_MODEL_WINDOW_BENCHMARK_MOBILE_V1';


  const PANEL_ID =
    'fix03d59-c32-model-window-panel';

  const PRIZE_ID =
    'fix03d59-c32-prize';

  const BUTTON_ID =
    'fix03d59-c32-run';

  const STATUS_ID =
    'fix03d59-c32-status';

  const OUTPUT_ID =
    'fix03d59-c32-output';


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


  const WINDOWS = [
    10,
    20,
    30,
    60
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

    const normalized =
      typeof value === 'string'
        ? value.replace(
            '%',
            ''
          )
        : value;


    const n =
      Number(
        normalized
      );


    return Number.isFinite(n)
      ? n
      : fallback;

  }


  function fmt(
    value,
    digits = 2
  ) {

    const n =
      Number(value);


    return Number.isFinite(n)
      ? n.toFixed(
          digits
        )
      : '--';

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


    return text ||
      'UNKNOWN';

  }


  function combinationKey(
    model,
    windowSize
  ) {

    return (
      normalizeModelId(
        model
      ) +
      '|' +
      Number(
        windowSize
      )
    );

  }


  function createAccumulator(
    model,
    windowSize
  ) {

    return {

      model:
        normalizeModelId(
          model
        ),

      window:
        Number(
          windowSize
        ),

      provinceCount:
        0,

      qualitySum:
        0,

      top1Sum:
        0,

      top3Sum:
        0,

      mrrSum:
        0,

      avgRankSum:
        0,

      wins:
        0,

      provinceRows:
        []

    };

  }


  /*
   * =========================================================
   * NORMALIZE ONE V2.3 ROW
   * =========================================================
   */

  function normalizeV23Row(
    row,
    province,
    prize,
    windowSize
  ) {

    if (!row) {

      return null;

    }


    const model =
      normalizeModelId(
        row.Model ||
        row.model
      );


    if (!model) {

      return null;

    }


    return {

      province:
        province.slug,

      provinceName:
        province.name,

      prize,

      model,

      window:
        Number(
          windowSize
        ),

      quality:
        safeNumber(
          row.Quality ??
          row.quality
        ),

      top1:
        safeNumber(
          row.Top1 ??
          row.top1
        ),

      top3:
        safeNumber(
          row.Top3 ??
          row.top3
        ),

      mrr:
        safeNumber(
          row.MRR ??
          row.mrr
        ),

      avgRank:
        safeNumber(
          row.AvgRank ??
          row.avgRank,
          100
        )

    };

  }


  /*
   * =========================================================
   * RUN ONE PROVINCE
   * =========================================================
   */

  function evaluateProvinceC32(
    province,
    prize
  ) {

    const rows = [];


    WINDOWS.forEach(
      windowSize => {

        let compared;


        try {

          compared =
            compareModelsV23(
              province.slug,
              prize,
              windowSize
            );

        } catch (error) {

          console.warn(
            'C3.2 compareModelsV23 failed:',
            province.slug,
            prize,
            windowSize,
            error
          );

          return;

        }


        if (
          !Array.isArray(
            compared
          )
        ) {

          return;

        }


        compared.forEach(
          row => {

            const normalized =
              normalizeV23Row(
                row,
                province,
                prize,
                windowSize
              );


            if (
              normalized
            ) {

              rows.push(
                normalized
              );

            }

          }
        );

      }
    );


    return rows;

  }


  /*
   * =========================================================
   * AGGREGATE
   * =========================================================
   */

  function aggregateC32(
    allRows,
    prize,
    provinceTotal
  ) {

    const map = {};


    allRows.forEach(
      row => {

        const key =
          combinationKey(
            row.model,
            row.window
          );


        if (
          !map[key]
        ) {

          map[key] =
            createAccumulator(
              row.model,
              row.window
            );

        }


        const target =
          map[key];


        target.provinceCount++;

        target.qualitySum +=
          row.quality;

        target.top1Sum +=
          row.top1;

        target.top3Sum +=
          row.top3;

        target.mrrSum +=
          row.mrr;

        target.avgRankSum +=
          row.avgRank;

        target.provinceRows.push(
          row
        );

      }
    );


    /*
     * Determine the winner inside each province.
     *
     * Same ordering philosophy as V2.4:
     * 1. Higher Quality
     * 2. Higher Top3
     * 3. Higher MRR
     * 4. Lower Avg Rank
     */
    const groupedByProvince = {};


    allRows.forEach(
      row => {

        if (
          !groupedByProvince[
            row.province
          ]
        ) {

          groupedByProvince[
            row.province
          ] = [];

        }


        groupedByProvince[
          row.province
        ].push(
          row
        );

      }
    );


    Object
      .values(
        groupedByProvince
      )
      .forEach(
        rows => {

          rows.sort(
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
                b.top3 !==
                a.top3
              ) {

                return (
                  b.top3 -
                  a.top3
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
                a.avgRank -
                b.avgRank
              );

            }
          );


          const winner =
            rows[0];


          if (!winner) {

            return;

          }


          const key =
            combinationKey(
              winner.model,
              winner.window
            );


          if (
            map[key]
          ) {

            map[key].wins++;

          }

        }
      );


    const combinations =
      Object
        .values(
          map
        )
        .map(
          item => {

            const count =
              item.provinceCount ||
              1;


            return {

              model:
                item.model,

              window:
                item.window,

              provinceCount:
                item.provinceCount,

              coverage:
                provinceTotal
                  ? item.provinceCount /
                    provinceTotal
                  : 0,

              avgQuality:
                item.qualitySum /
                count,

              avgTop1:
                item.top1Sum /
                count,

              avgTop3:
                item.top3Sum /
                count,

              avgMRR:
                item.mrrSum /
                count,

              avgRank:
                item.avgRankSum /
                count,

              wins:
                item.wins

            };

          }
        );


    combinations.sort(
      (a, b) => {

        /*
         * Require broad province coverage first.
         */
        if (
          b.coverage !==
          a.coverage
        ) {

          return (
            b.coverage -
            a.coverage
          );

        }


        if (
          b.avgQuality !==
          a.avgQuality
        ) {

          return (
            b.avgQuality -
            a.avgQuality
          );

        }


        if (
          b.avgTop3 !==
          a.avgTop3
        ) {

          return (
            b.avgTop3 -
            a.avgTop3
          );

        }


        if (
          b.avgMRR !==
          a.avgMRR
        ) {

          return (
            b.avgMRR -
            a.avgMRR
          );

        }


        return (
          a.avgRank -
          b.avgRank
        );

      }
    );


    const winner =
      combinations.length
        ? combinations[0]
        : null;


    const baseline30 =
      combinations.find(
        item =>
          item.model ===
            'BASELINE' &&
          item.window ===
            30
      ) ||
      null;


    return {

      version:
        VERSION,

      ready:
        Boolean(
          winner
        ),

      reason:
        winner
          ? 'C32_BENCHMARK_READY'
          : 'C32_NO_RESULTS',

      prize,

      provinceTotal,

      provinceEvaluated:
        Object.keys(
          groupedByProvince
        ).length,

      combinationCount:
        combinations.length,

      winner,

      baseline30,

      improvement:
        (
          winner &&
          baseline30
        )
          ? {

              quality:
                winner.avgQuality -
                baseline30.avgQuality,

              top1:
                winner.avgTop1 -
                baseline30.avgTop1,

              top3:
                winner.avgTop3 -
                baseline30.avgTop3,

              mrr:
                winner.avgMRR -
                baseline30.avgMRR,

              avgRank:
                baseline30.avgRank -
                winner.avgRank

            }
          : null,

      combinations,

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
   * TEXT REPORT
   * =========================================================
   */

  function buildReportC32(
    result
  ) {

    if (
      !result ||
      result.ready !==
        true
    ) {

      return (
        'C3.2 NOT READY\n\n' +
        'Reason: ' +
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


    const baseline =
      result.baseline30;


    const lines = [];


    lines.push(
      'C3.2 MODEL × WINDOW'
    );

    lines.push(
      'CROSS-PROVINCE BENCHMARK'
    );

    lines.push(
      '========================'
    );

    lines.push(
      'Prize: ' +
      String(
        result.prize
      ).toUpperCase()
    );

    lines.push(
      'Provinces: ' +
      result.provinceEvaluated +
      '/' +
      result.provinceTotal
    );

    lines.push(
      'Configurations: ' +
      result.combinationCount
    );


    lines.push('');

    lines.push(
      '🏆 CROSS-PROVINCE WINNER'
    );

    lines.push(
      'Model: ' +
      winner.model
    );

    lines.push(
      'Window: ' +
      winner.window
    );

    lines.push(
      'Coverage: ' +
      winner.provinceCount +
      '/' +
      result.provinceTotal
    );

    lines.push(
      'Province Wins: ' +
      winner.wins
    );

    lines.push(
      'Avg Quality: ' +
      fmt(
        winner.avgQuality
      )
    );

    lines.push(
      'Avg Top1: ' +
      fmt(
        winner.avgTop1
      ) +
      '%'
    );

    lines.push(
      'Avg Top3: ' +
      fmt(
        winner.avgTop3
      ) +
      '%'
    );

    lines.push(
      'Avg MRR: ' +
      fmt(
        winner.avgMRR,
        4
      )
    );

    lines.push(
      'Avg Rank: ' +
      fmt(
        winner.avgRank
      )
    );


    if (baseline) {

      lines.push('');

      lines.push(
        '📋 BASELINE / WINDOW 30'
      );

      lines.push(
        'Avg Quality: ' +
        fmt(
          baseline.avgQuality
        )
      );

      lines.push(
        'Avg Top1: ' +
        fmt(
          baseline.avgTop1
        ) +
        '%'
      );

      lines.push(
        'Avg Top3: ' +
        fmt(
          baseline.avgTop3
        ) +
        '%'
      );

      lines.push(
        'Avg MRR: ' +
        fmt(
          baseline.avgMRR,
          4
        )
      );

      lines.push(
        'Avg Rank: ' +
        fmt(
          baseline.avgRank
        )
      );

    }


    if (
      result.improvement
    ) {

      const diff =
        result.improvement;


      lines.push('');

      lines.push(
        '📈 WINNER vs BASELINE30'
      );

      lines.push(
        'Quality Δ: ' +
        (
          diff.quality >= 0
            ? '+'
            : ''
        ) +
        fmt(
          diff.quality
        )
      );

      lines.push(
        'Top1 Δ: ' +
        (
          diff.top1 >= 0
            ? '+'
            : ''
        ) +
        fmt(
          diff.top1
        ) +
        ' pp'
      );

      lines.push(
        'Top3 Δ: ' +
        (
          diff.top3 >= 0
            ? '+'
            : ''
        ) +
        fmt(
          diff.top3
        ) +
        ' pp'
      );

      lines.push(
        'MRR Δ: ' +
        (
          diff.mrr >= 0
            ? '+'
            : ''
        ) +
        fmt(
          diff.mrr,
          4
        )
      );

      lines.push(
        'Avg Rank Improvement: ' +
        (
          diff.avgRank >= 0
            ? '+'
            : ''
        ) +
        fmt(
          diff.avgRank
        )
      );

    }


    lines.push('');

    lines.push(
      '------------------------'
    );

    lines.push(
      'TOP 10 CONFIGURATIONS'
    );


    result
      .combinations
      .slice(
        0,
        10
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
            item.model +
            ' · W' +
            item.window
          );

          lines.push(
            'Q ' +
            fmt(
              item.avgQuality
            ) +
            ' · T1 ' +
            fmt(
              item.avgTop1
            ) +
            '%' +
            ' · T3 ' +
            fmt(
              item.avgTop3
            ) +
            '%'
          );

          lines.push(
            'MRR ' +
            fmt(
              item.avgMRR,
              4
            ) +
            ' · Rank ' +
            fmt(
              item.avgRank
            ) +
            ' · Wins ' +
            item.wins
          );

        }
      );


    lines.push('');

    lines.push(
      '========================'
    );

    lines.push(
      'DB EXCLUDED'
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
   * RUN SELECTED PRIZE
   * =========================================================
   */

  function runC32() {

    const prizeSelect =
      document.getElementById(
        PRIZE_ID
      );

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


    const prize =
      prizeSelect
        ? prizeSelect.value
        : 'g1';


    if (
      !PRIZES.includes(
        prize
      )
    ) {

      if (status) {

        status.textContent =
          '❌ Prize không hợp lệ.';

      }

      return;

    }


    if (
      typeof compareModelsV23 !==
        'function'
    ) {

      if (status) {

        status.textContent =
          '❌ V2.3 Model Lab chưa sẵn sàng.';

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
          '❌ Không tìm thấy PROVINCES.';

      }

      return;

    }


    const provinces =
      PROVINCES.slice();


    const allRows = [];


    let index = 0;


    if (button) {

      button.style.pointerEvents =
        'none';

      button.style.opacity =
        '.55';

      button.textContent =
        '⏳ Đang benchmark...';

    }


    if (output) {

      output.textContent =
        '';

    }


    function finish() {

      const result =
        aggregateC32(
          allRows,
          prize,
          provinces.length
        );


      window
        .LAST_FIX03D59_C32_MODEL_WINDOW_BENCHMARK =
        result;


      if (status) {

        status.textContent =
          result.ready
            ? (
                '✅ Hoàn tất ' +
                String(
                  prize
                ).toUpperCase() +
                ' · ' +
                result
                  .provinceEvaluated +
                '/' +
                result
                  .provinceTotal +
                ' tỉnh.'
              )
            : (
                '❌ C3.2 không có kết quả.'
              );

      }


      if (output) {

        output.textContent =
          buildReportC32(
            result
          );

      }


      if (button) {

        button.style.pointerEvents =
          'auto';

        button.style.opacity =
          '1';

        button.textContent =
          '🔬 Chạy C3.2 Model × Window';

      }

    }


    function nextProvince() {

      if (
        index >=
        provinces.length
      ) {

        finish();

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
          province.name +
          ' · ' +
          prize.toUpperCase();

      }


      const rows =
        evaluateProvinceC32(
          province,
          prize
        );


      if (
        Array.isArray(
          rows
        )
      ) {

        allRows.push(
          ...rows
        );

      }


      index++;


      /*
       * Yield to mobile browser.
       */
      setTimeout(
        nextProvince,
        25
      );

    }


    nextProvince();

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
        🔬 C3.2 Model × Window Benchmark
      </div>


      <div
        style="
          opacity:.75;
          font-size:13px;
          line-height:1.55;
          margin-bottom:14px;
        "
      >
        21 tỉnh · 5 Model ·
        Window 10/20/30/60 ·
        chạy từng giải để bảo vệ hiệu năng mobile.
      </div>


      <label
        style="
          display:block;
          margin-bottom:7px;
          font-weight:800;
        "
      >
        Chọn giải
      </label>


      <select
        id="${PRIZE_ID}"
        style="
          width:100%;
          min-height:48px;
          padding:10px;
          margin-bottom:12px;
          border-radius:10px;
          font-size:16px;
        "
      >
        <option value="g1">G1 — Giải Nhất</option>
        <option value="g2">G2 — Giải Nhì</option>
        <option value="g3">G3 — Giải Ba</option>
        <option value="g4">G4 — Giải Tư</option>
        <option value="g5">G5 — Giải Năm</option>
        <option value="g6">G6 — Giải Sáu</option>
        <option value="g7">G7 — Giải Bảy</option>
        <option value="g8">G8 — Giải Tám</option>
      </select>


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
          background:linear-gradient(
            90deg,
            #ffbd3c,
            #ff8b3d
          );
          color:#17192f;
          font-size:16px;
          font-weight:900;
          text-align:center;
          cursor:pointer;
          user-select:none;
        "
      >
        🔬 Chạy C3.2 Model × Window
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
        runC32
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
    .runFix03D59C32ModelWindowBenchmark =
    runC32;


  window
    .FIX03D59_C32_MODEL_WINDOW_BENCHMARK_VERSION =
    VERSION;


  window
    .FIX03D59_C32_MODEL_WINDOW_BENCHMARK_LOADED =
    true;


  console.log(
    'FIX-03D5.9 C3.2 Model × Window Benchmark Mobile V1 loaded / READ ONLY'
  );

})();
