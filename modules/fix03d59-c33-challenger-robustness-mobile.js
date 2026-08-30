/* =========================================================================
   FIX-03D5.9
   C3.3 CHALLENGER ROBUSTNESS VERIFICATION MOBILE V1

   PURPOSE:
   - Verify ONLY the two C3.2 challengers worth further review.

   CHALLENGERS:
   - G6: BALANCED W20 vs BASELINE W30
   - G8: RECENT   W60 vs BASELINE W30

   CROSS-PROVINCE CHECKS:
   - 21 provinces
   - Quality delta
   - Top1 delta
   - Top3 delta
   - MRR delta
   - Avg Rank improvement
   - Mean delta
   - Median delta
   - Win / Loss / Tie count
   - Multi-metric support rate
   - Worst-case degradation
   - Best / worst provinces

   IMPORTANT:
   - RESEARCH / VERIFICATION ONLY.
   - DOES NOT change Production selection.
   - DOES NOT modify LAST_FORECAST.
   - DOES NOT call savePrediction().
   - DOES NOT write localStorage.
   - DOES NOT modify model weights.
   - DOES NOT modify window.
   - DOES NOT modify Production Engine.

   READ ONLY
   ZERO WRITE
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_C33_CHALLENGER_ROBUSTNESS_MOBILE_V1';


  const PANEL_ID =
    'fix03d59-c33-robustness-panel';

  const BUTTON_ID =
    'fix03d59-c33-robustness-run';

  const STATUS_ID =
    'fix03d59-c33-robustness-status';

  const OUTPUT_ID =
    'fix03d59-c33-robustness-output';


  /*
   * =========================================================
   * FIXED RESEARCH CANDIDATES
   * =========================================================
   */

  const TESTS = [

    {

      id:
        'G6_BALANCED_W20',

      prize:
        'g6',

      challengerModel:
        'BALANCED',

      challengerWindow:
        20,

      baselineModel:
        'BASELINE',

      baselineWindow:
        30

    },


    {

      id:
        'G8_RECENT_W60',

      prize:
        'g8',

      challengerModel:
        'RECENT',

      challengerWindow:
        60,

      baselineModel:
        'BASELINE',

      baselineWindow:
        30

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

    const normalized =
      typeof value === 'string'
        ? value.replace(
            '%',
            ''
          )
        : value;


    const number =
      Number(
        normalized
      );


    return Number.isFinite(
      number
    )
      ? number
      : fallback;

  }


  function normalizeModel(
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
        'BALANCED'
      )
    ) {

      return 'BALANCED';

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
        'CYCLE'
      )
    ) {

      return 'CYCLE';

    }


    return text;

  }


  function median(
    values
  ) {

    if (
      !Array.isArray(
        values
      ) ||
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


  function mean(
    values
  ) {

    if (
      !Array.isArray(
        values
      ) ||
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
          safeNumber(
            value
          ),
        0
      ) /
      values.length
    );

  }


  function format(
    value,
    digits = 3
  ) {

    const number =
      Number(
        value
      );


    if (
      !Number.isFinite(
        number
      )
    ) {

      return '--';

    }


    return number.toFixed(
      digits
    );

  }


  function signed(
    value,
    digits = 3
  ) {

    const number =
      Number(
        value
      );


    if (
      !Number.isFinite(
        number
      )
    ) {

      return '--';

    }


    return (
      number >= 0
        ? '+'
        : ''
    ) +
    number.toFixed(
      digits
    );

  }


  /*
   * =========================================================
   * GET ONE MODEL RESULT
   * =========================================================
   */

  function getModelResult(
    provinceSlug,
    prize,
    model,
    windowSize
  ) {

    let rows;


    try {

      rows =
        compareModelsV23(
          provinceSlug,
          prize,
          windowSize
        );

    } catch (error) {

      return null;

    }


    if (
      !Array.isArray(
        rows
      )
    ) {

      return null;

    }


    const targetModel =
      normalizeModel(
        model
      );


    const row =
      rows.find(
        item => {

          if (!item) {

            return false;

          }


          return (
            normalizeModel(
              item.Model ||
              item.model
            ) ===
            targetModel
          );

        }
      );


    if (!row) {

      return null;

    }


    return {

      model:
        targetModel,

      window:
        windowSize,

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
   * EVALUATE ONE PROVINCE
   * =========================================================
   */

  function evaluateProvince(
    province,
    config
  ) {

    const challenger =
      getModelResult(
        province.slug,
        config.prize,
        config.challengerModel,
        config.challengerWindow
      );


    const baseline =
      getModelResult(
        province.slug,
        config.prize,
        config.baselineModel,
        config.baselineWindow
      );


    if (
      !challenger ||
      !baseline
    ) {

      return {

        ready:
          false,

        province:
          province.slug,

        provinceName:
          province.name,

        reason:
          'MODEL_RESULT_NOT_AVAILABLE'

      };

    }


    /*
     * Positive delta = challenger better.
     *
     * Avg Rank is reversed:
     * lower rank is better.
     */

    const delta = {

      quality:
        challenger.quality -
        baseline.quality,

      top1:
        challenger.top1 -
        baseline.top1,

      top3:
        challenger.top3 -
        baseline.top3,

      mrr:
        challenger.mrr -
        baseline.mrr,

      avgRank:
        baseline.avgRank -
        challenger.avgRank

    };


    /*
     * Number of metrics where challenger
     * clearly beats baseline.
     */

    const challengerMetricWins = [

      delta.quality > 0,

      delta.top1 > 0,

      delta.top3 > 0,

      delta.mrr > 0,

      delta.avgRank > 0

    ]
      .filter(
        Boolean
      )
      .length;


    const baselineMetricWins = [

      delta.quality < 0,

      delta.top1 < 0,

      delta.top3 < 0,

      delta.mrr < 0,

      delta.avgRank < 0

    ]
      .filter(
        Boolean
      )
      .length;


    let verdict =
      'TIE';


    if (
      challengerMetricWins >=
      3
    ) {

      verdict =
        'CHALLENGER';

    } else if (
      baselineMetricWins >=
      3
    ) {

      verdict =
        'BASELINE';

    }


    return {

      ready:
        true,

      province:
        province.slug,

      provinceName:
        province.name,

      challenger,

      baseline,

      delta,

      challengerMetricWins,

      baselineMetricWins,

      verdict

    };

  }


  /*
   * =========================================================
   * SUMMARIZE ONE CHALLENGER
   * =========================================================
   */

  function summarize(
    config,
    provinceResults
  ) {

    const valid =
      provinceResults.filter(
        item =>
          item &&
          item.ready === true
      );


    const qualityDeltas =
      valid.map(
        item =>
          item.delta.quality
      );


    const top1Deltas =
      valid.map(
        item =>
          item.delta.top1
      );


    const top3Deltas =
      valid.map(
        item =>
          item.delta.top3
      );


    const mrrDeltas =
      valid.map(
        item =>
          item.delta.mrr
      );


    const rankDeltas =
      valid.map(
        item =>
          item.delta.avgRank
      );


    const challengerWins =
      valid.filter(
        item =>
          item.verdict ===
          'CHALLENGER'
      ).length;


    const baselineWins =
      valid.filter(
        item =>
          item.verdict ===
          'BASELINE'
      ).length;


    const ties =
      valid.length -
      challengerWins -
      baselineWins;


    /*
     * Quality-only province direction.
     */

    const qualityWins =
      qualityDeltas.filter(
        value =>
          value > 0
      ).length;


    const qualityLosses =
      qualityDeltas.filter(
        value =>
          value < 0
      ).length;


    const qualityTies =
      valid.length -
      qualityWins -
      qualityLosses;


    /*
     * Sort province outcomes by Quality delta
     * for best / worst diagnostics.
     */

    const sorted =
      valid
        .slice()
        .sort(
          (a, b) =>
            b.delta.quality -
            a.delta.quality
        );


    const bestProvince =
      sorted.length
        ? sorted[0]
        : null;


    const worstProvince =
      sorted.length
        ? sorted[
            sorted.length -
            1
          ]
        : null;


    const supportRate =
      valid.length
        ? challengerWins /
          valid.length
        : 0;


    const qualityPositiveRate =
      valid.length
        ? qualityWins /
          valid.length
        : 0;


    const metrics = {

      quality: {

        mean:
          mean(
            qualityDeltas
          ),

        median:
          median(
            qualityDeltas
          ),

        worst:
          qualityDeltas.length
            ? Math.min(
                ...qualityDeltas
              )
            : 0,

        best:
          qualityDeltas.length
            ? Math.max(
                ...qualityDeltas
              )
            : 0

      },


      top1: {

        mean:
          mean(
            top1Deltas
          ),

        median:
          median(
            top1Deltas
          ),

        worst:
          top1Deltas.length
            ? Math.min(
                ...top1Deltas
              )
            : 0

      },


      top3: {

        mean:
          mean(
            top3Deltas
          ),

        median:
          median(
            top3Deltas
          ),

        worst:
          top3Deltas.length
            ? Math.min(
                ...top3Deltas
              )
            : 0

      },


      mrr: {

        mean:
          mean(
            mrrDeltas
          ),

        median:
          median(
            mrrDeltas
          ),

        worst:
          mrrDeltas.length
            ? Math.min(
                ...mrrDeltas
              )
            : 0

      },


      avgRank: {

        mean:
          mean(
            rankDeltas
          ),

        median:
          median(
            rankDeltas
          ),

        worst:
          rankDeltas.length
            ? Math.min(
                ...rankDeltas
              )
            : 0

      }

    };


    /*
     * Research classification only.
     *
     * ROBUST_CANDIDATE requires:
     * - majority multi-metric support
     * - positive mean Quality
     * - positive median Quality
     * - non-negative median Top3
     * - non-negative median MRR
     *
     * This DOES NOT authorize Production.
     */

    let classification =
      'NOT_ROBUST';


    if (
      supportRate >=
        0.60 &&
      metrics.quality.mean >
        0 &&
      metrics.quality.median >
        0 &&
      metrics.top3.median >=
        0 &&
      metrics.mrr.median >=
        0
    ) {

      classification =
        'ROBUST_CANDIDATE';

    } else if (
      supportRate >=
        0.50 &&
      metrics.quality.mean >
        0
    ) {

      classification =
        'WATCH';

    }


    return {

      ready:
        valid.length > 0,

      id:
        config.id,

      prize:
        config.prize,

      challenger: {

        model:
          config.challengerModel,

        window:
          config.challengerWindow

      },

      baseline: {

        model:
          config.baselineModel,

        window:
          config.baselineWindow

      },

      provinceCount:
        valid.length,

      challengerWins,

      baselineWins,

      ties,

      supportRate,

      qualityWins,

      qualityLosses,

      qualityTies,

      qualityPositiveRate,

      metrics,

      bestProvince,

      worstProvince,

      classification,

      provinceResults:
        valid

    };

  }


  /*
   * =========================================================
   * TEXT REPORT
   * =========================================================
   */

  function buildOneReport(
    summary
  ) {

    const lines = [];


    lines.push(
      String(
        summary.prize
      ).toUpperCase() +
      ' ROBUSTNESS'
    );

    lines.push(
      '------------------------'
    );


    lines.push(
      'Challenger: ' +
      summary.challenger.model +
      ' W' +
      summary.challenger.window
    );


    lines.push(
      'Baseline: ' +
      summary.baseline.model +
      ' W' +
      summary.baseline.window
    );


    lines.push(
      'Provinces: ' +
      summary.provinceCount
    );


    lines.push('');

    lines.push(
      'Classification: ' +
      summary.classification
    );


    lines.push(
      'Multi-metric Wins: ' +
      summary.challengerWins
    );


    lines.push(
      'Baseline Wins: ' +
      summary.baselineWins
    );


    lines.push(
      'Ties: ' +
      summary.ties
    );


    lines.push(
      'Support Rate: ' +
      (
        summary.supportRate *
        100
      ).toFixed(1) +
      '%'
    );


    lines.push('');

    lines.push(
      'Quality Provinces:'
    );


    lines.push(
      'Win / Loss / Tie = ' +
      summary.qualityWins +
      ' / ' +
      summary.qualityLosses +
      ' / ' +
      summary.qualityTies
    );


    lines.push(
      'Positive Rate: ' +
      (
        summary
          .qualityPositiveRate *
        100
      ).toFixed(1) +
      '%'
    );


    lines.push('');

    lines.push(
      'MEAN DELTA'
    );


    lines.push(
      'Quality: ' +
      signed(
        summary.metrics
          .quality.mean,
        3
      )
    );


    lines.push(
      'Top1: ' +
      signed(
        summary.metrics
          .top1.mean,
        3
      ) +
      ' pp'
    );


    lines.push(
      'Top3: ' +
      signed(
        summary.metrics
          .top3.mean,
        3
      ) +
      ' pp'
    );


    lines.push(
      'MRR: ' +
      signed(
        summary.metrics
          .mrr.mean,
        4
      )
    );


    lines.push(
      'Avg Rank Improvement: ' +
      signed(
        summary.metrics
          .avgRank.mean,
        3
      )
    );


    lines.push('');

    lines.push(
      'MEDIAN DELTA'
    );


    lines.push(
      'Quality: ' +
      signed(
        summary.metrics
          .quality.median,
        3
      )
    );


    lines.push(
      'Top1: ' +
      signed(
        summary.metrics
          .top1.median,
        3
      ) +
      ' pp'
    );


    lines.push(
      'Top3: ' +
      signed(
        summary.metrics
          .top3.median,
        3
      ) +
      ' pp'
    );


    lines.push(
      'MRR: ' +
      signed(
        summary.metrics
          .mrr.median,
        4
      )
    );


    lines.push(
      'Avg Rank Improvement: ' +
      signed(
        summary.metrics
          .avgRank.median,
        3
      )
    );


    lines.push('');

    lines.push(
      'WORST CASE'
    );


    lines.push(
      'Quality: ' +
      signed(
        summary.metrics
          .quality.worst,
        3
      )
    );


    lines.push(
      'Top1: ' +
      signed(
        summary.metrics
          .top1.worst,
        3
      )
    );


    lines.push(
      'Top3: ' +
      signed(
        summary.metrics
          .top3.worst,
        3
      )
    );


    lines.push(
      'MRR: ' +
      signed(
        summary.metrics
          .mrr.worst,
        4
      )
    );


    lines.push(
      'Rank: ' +
      signed(
        summary.metrics
          .avgRank.worst,
        3
      )
    );


    if (
      summary.bestProvince
    ) {

      lines.push('');

      lines.push(
        'Best Province: ' +
        summary.bestProvince
          .provinceName +
        ' · Quality Δ ' +
        signed(
          summary.bestProvince
            .delta.quality,
          3
        )
      );

    }


    if (
      summary.worstProvince
    ) {

      lines.push(
        'Worst Province: ' +
        summary.worstProvince
          .provinceName +
        ' · Quality Δ ' +
        signed(
          summary.worstProvince
            .delta.quality,
          3
        )
      );

    }


    return lines.join(
      '\n'
    );

  }


  function buildFullReport(
    result
  ) {

    if (
      !result ||
      result.ready !== true
    ) {

      return (
        'C3.3 NOT READY\n\n' +
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
      'C3.3 CHALLENGER'
    );

    lines.push(
      'ROBUSTNESS VERIFICATION'
    );

    lines.push(
      '========================'
    );


    lines.push('');

    lines.push(
      buildOneReport(
        result.g6
      )
    );


    lines.push('');

    lines.push(
      '========================'
    );

    lines.push('');

    lines.push(
      buildOneReport(
        result.g8
      )
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
   * RUNNER
   * =========================================================
   */

  function runC33() {

    const status =
      document.getElementById(
        STATUS_ID
      );


    const output =
      document.getElementById(
        OUTPUT_ID
      );


    const button =
      document.getElementById(
        BUTTON_ID
      );


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
          '❌ PROVINCES chưa sẵn sàng.';

      }

      return;

    }


    if (button) {

      button.style
        .pointerEvents =
        'none';

      button.style.opacity =
        '.55';

      button.textContent =
        '⏳ Đang kiểm định...';

    }


    if (output) {

      output.textContent =
        '';

    }


    const results = {

      g6:
        [],

      g8:
        []

    };


    const jobs = [];


    TESTS.forEach(
      config => {

        PROVINCES.forEach(
          province => {

            jobs.push({

              config,

              province

            });

          }
        );

      }
    );


    let index = 0;


    function finish() {

      const g6Config =
        TESTS.find(
          item =>
            item.prize ===
            'g6'
        );


      const g8Config =
        TESTS.find(
          item =>
            item.prize ===
            'g8'
        );


      const finalResult = {

        version:
          VERSION,

        ready:
          true,

        reason:
          'C33_ROBUSTNESS_READY',

        g6:
          summarize(
            g6Config,
            results.g6
          ),

        g8:
          summarize(
            g8Config,
            results.g8
          ),

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


      window
        .LAST_FIX03D59_C33_ROBUSTNESS =
        finalResult;


      if (status) {

        status.textContent =
          '✅ C3.3 hoàn tất · G6 + G8 · 21 tỉnh.';

      }


      if (output) {

        output.textContent =
          buildFullReport(
            finalResult
          );

      }


      if (button) {

        button.style
          .pointerEvents =
          'auto';

        button.style.opacity =
          '1';

        button.textContent =
          '🛡️ Chạy C3.3 Robustness';

      }

    }


    function next() {

      if (
        index >=
        jobs.length
      ) {

        finish();

        return;

      }


      const job =
        jobs[
          index
        ];


      if (status) {

        status.textContent =
          '⏳ ' +
          (index + 1) +
          '/' +
          jobs.length +
          ' · ' +
          job.province.name +
          ' · ' +
          job.config.prize
            .toUpperCase();

      }


      const result =
        evaluateProvince(
          job.province,
          job.config
        );


      results[
        job.config.prize
      ].push(
        result
      );


      index++;


      /*
       * Yield between jobs for mobile.
       */
      setTimeout(
        next,
        25
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
        'border:1px solid rgba(104,227,155,.35)',
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
        🛡️ C3.3 Challenger Robustness
      </div>


      <div
        style="
          opacity:.75;
          font-size:13px;
          line-height:1.55;
          margin-bottom:14px;
        "
      >
        G6 BALANCED W20
        vs BASELINE W30
        <br>
        G8 RECENT W60
        vs BASELINE W30
        <br>
        21 tỉnh · Mean + Median +
        Worst Case · Read Only
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
              #68e39b,
              #63d9ff
            );
          color:#17192f;
          font-size:16px;
          font-weight:900;
          text-align:center;
          cursor:pointer;
          user-select:none;
        "
      >
        🛡️ Chạy C3.3 Robustness
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
        runC33
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


  /*
   * =========================================================
   * PUBLIC API
   * =========================================================
   */

  window
    .runFix03D59C33Robustness =
    runC33;


  window
    .FIX03D59_C33_CHALLENGER_ROBUSTNESS_VERSION =
    VERSION;


  window
    .FIX03D59_C33_CHALLENGER_ROBUSTNESS_LOADED =
    true;


  console.log(
    'FIX-03D5.9 C3.3 Challenger Robustness Mobile V1 loaded / READ ONLY'
  );

})();
