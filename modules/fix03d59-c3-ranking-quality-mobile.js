/* =========================================================================
   FIX-03D5.9
   C3 RANKING QUALITY — MOBILE REPORTER V1

   PURPOSE:
   - Run existing C3 Ranking Quality Reporter from mobile.
   - Display G1 -> G8 ranking quality inside Settings.
   - Show Hit@1 / Hit@3 / Hit@5 / Hit@10 / Avg Rank / MRR.
   - DB remains separate because Production DB uses Full 6 digits.

   SAFETY:
   - READ ONLY.
   - ZERO PRODUCTION WRITE.
   - ZERO STORAGE WRITE.
   - NO savePrediction().
   - NO LAST_FORECAST MODIFICATION.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_C3_RANKING_QUALITY_MOBILE_V1';

  const PANEL_ID =
    'fix03d59-c3-ranking-mobile-panel';

  const OUTPUT_ID =
    'fix03d59-c3-ranking-mobile-output';


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


  function prizeLabel(
    key
  ) {

    const labels = {

      g1: 'G1',
      g2: 'G2',
      g3: 'G3',
      g4: 'G4',
      g5: 'G5',
      g6: 'G6',
      g7: 'G7',
      g8: 'G8'

    };

    return (
      labels[key] ||
      String(key).toUpperCase()
    );

  }


  function buildReport(
    result
  ) {

    if (
      !result ||
      result.ready !== true
    ) {

      return (
        'C3 NOT READY\n\n' +
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
      'C3 RANKING QUALITY'
    );

    lines.push(
      '===================='
    );

    lines.push(
      'Province: ' +
      (
        result.provinceName ||
        result.province ||
        '-'
      )
    );

    lines.push(
      'Window: ' +
      result.windowSize
    );

    lines.push(
      'Tested Draws: ' +
      result.testedDraws
    );

    if (
      result.testFrom ||
      result.testTo
    ) {

      lines.push(
        'Period: ' +
        (
          result.testFrom ||
          '-'
        ) +
        ' -> ' +
        (
          result.testTo ||
          '-'
        )
      );

    }


    lines.push('');

    lines.push(
      'DB: SEPARATE — FULL 6 DIGITS'
    );

    lines.push(
      'Legacy /100 rank is NOT used for DB.'
    );


    const keys = [

      'g1',
      'g2',
      'g3',
      'g4',
      'g5',
      'g6',
      'g7',
      'g8'

    ];


    keys.forEach(
      key => {

        const item =
          result.prizes &&
          result.prizes[key];


        lines.push('');

        lines.push(
          '--------------------'
        );

        lines.push(
          prizeLabel(key)
        );


        if (
          !item ||
          item.ready !== true
        ) {

          lines.push(
            'NOT READY'
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
          Number(
            item.averageRank || 0
          ).toFixed(2)
        );

        lines.push(
          'MRR: ' +
          Number(
            item.mrr || 0
          ).toFixed(4)
        );


        if (
          item.rankBuckets
        ) {

          lines.push(
            'Ranks 1-3: ' +
            item.rankBuckets
              .rank1to3
          );

          lines.push(
            'Ranks 4-5: ' +
            item.rankBuckets
              .rank4to5
          );

          lines.push(
            'Ranks 6-10: ' +
            item.rankBuckets
              .rank6to10
          );

          lines.push(
            'Ranks 11-20: ' +
            item.rankBuckets
              .rank11to20
          );

          lines.push(
            'Ranks 21-50: ' +
            item.rankBuckets
              .rank21to50
          );

          lines.push(
            'Ranks 51-100: ' +
            item.rankBuckets
              .rank51to100
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


    return lines.join('\n');

  }


  function runC3Mobile() {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (
      typeof window
        .analyzeProvinceRankingQualityC3 !==
      'function'
    ) {

      if (output) {

        output.textContent =
          'C3 Reporter chưa được load.';

      }

      return;

    }


    if (output) {

      output.textContent =
        'Đang chạy C3 Walk-Forward Backtest...';

    }


    /*
     * Give the UI one frame to render
     * before running the existing backtest.
     */
    setTimeout(
      function () {

        let result;


        try {

          result =
            window
              .analyzeProvinceRankingQualityC3();

        } catch (error) {

          result = {

            ready:
              false,

            reason:
              'C3_EXECUTION_ERROR: ' +
              (
                error &&
                error.message
                  ? error.message
                  : String(error)
              )

          };

        }


        window
          .LAST_FIX03D59_C3_MOBILE_RESULT =
          result;


        if (output) {

          output.textContent =
            buildReport(
              result
            );

        }

      },
      50
    );

  }


  function attach() {

    if (
      document.getElementById(
        PANEL_ID
      )
    ) {

      return true;

    }


    /*
     * Settings tab used by the current app.
     * Try several safe anchors because the
     * diagnostic is UI-only.
     */
    const settings =
      document.querySelector(
        '#settingsPanel'
      ) ||
      document.querySelector(
        '#settings'
      ) ||
      document.querySelector(
        '[data-tab-panel="settings"]'
      ) ||
      document.querySelector(
        '.settings-panel'
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
        'margin-top:16px',
        'padding:14px',
        'border:1px solid rgba(255,255,255,.16)',
        'border-radius:14px',
        'background:rgba(255,255,255,.05)'
      ].join(';');


    const title =
      document.createElement(
        'div'
      );


    title.textContent =
      '🧪 C3 Ranking Quality';


    title.style.cssText =
      [
        'font-weight:900',
        'font-size:16px',
        'margin-bottom:10px'
      ].join(';');


    const description =
      document.createElement(
        'div'
      );


    description.textContent =
      'Walk-Forward · G1→G8 · Hit@5 / Hit@10 · Read Only';


    description.style.cssText =
      [
        'font-size:12px',
        'opacity:.75',
        'margin-bottom:12px'
      ].join(';');


    const button =
      document.createElement(
        'button'
      );


    button.type =
      'button';


    button.textContent =
      '▶ Chạy C3 Ranking Quality';


    button.style.cssText =
      [
        'width:100%',
        'padding:12px',
        'border:0',
        'border-radius:10px',
        'font-weight:800',
        'cursor:pointer'
      ].join(';');


    button.addEventListener(
      'click',
      runC3Mobile
    );


    const output =
      document.createElement(
        'pre'
      );


    output.id =
      OUTPUT_ID;


    output.textContent =
      'Chưa chạy C3.';


    output.style.cssText =
      [
        'margin-top:12px',
        'padding:12px',
        'border-radius:10px',
        'background:rgba(0,0,0,.22)',
        'white-space:pre-wrap',
        'word-break:break-word',
        'font-size:12px',
        'line-height:1.55',
        'overflow:auto'
      ].join(';');


    panel.appendChild(
      title
    );

    panel.appendChild(
      description
    );

    panel.appendChild(
      button
    );

    panel.appendChild(
      output
    );


    settings.appendChild(
      panel
    );


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
    .runFix03D59C3RankingQualityMobile =
    runC3Mobile;


  window
    .FIX03D59_C3_RANKING_QUALITY_MOBILE_VERSION =
    VERSION;


  window
    .FIX03D59_C3_RANKING_QUALITY_MOBILE_LOADED =
    true;


  console.log(
    'FIX-03D5.9 C3 Ranking Quality Mobile V1 loaded / READ ONLY'
  );

})();
