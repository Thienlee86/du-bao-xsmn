/* =========================================================================
   FIX-03D5.9
   C6.1 G8 CROSS-PRIZE SIGNAL — MOBILE V1

   PURPOSE:
   - Run existing C6.1 Cross-Prize Signal Research.
   - Display:
       + RECENT W60 reference
       + 10/20/30/40% Cross-Prize blends
       + Best discovery candidate
       + Quality / Hit@1 / Hit@3 / Hit@5 / Hit@10
       + MRR / Average Rank
       + Province W/L/T
       + Mean / Median province Quality delta
       + Best / Worst province
   - Mobile friendly.

   SAFETY:
   - RESEARCH ONLY.
   - READ ONLY.
   - ZERO PRODUCTION WRITE.
   - ZERO STORAGE WRITE.
   - NO savePrediction().
   - NO LAST_FORECAST MODIFICATION.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_C61_CROSS_PRIZE_MOBILE_V1';


  const PANEL_ID =
    'fix03d59-c61-mobile-panel';

  const BUTTON_ID =
    'fix03d59-c61-mobile-run';

  const STATUS_ID =
    'fix03d59-c61-mobile-status';

  const OUTPUT_ID =
    'fix03d59-c61-mobile-output';


  /*
   * =========================================================
   * FORMATTERS
   * =========================================================
   */

  function pct(
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
      n * 100
    ).toFixed(2) + '%';

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


    if (
      !Number.isFinite(n)
    ) {

      return '--';

    }


    return n.toFixed(
      digits
    );

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


  /*
   * =========================================================
   * REPORT
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
        'C6.1 NOT READY\n\n' +
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
      'C6.1 G8 CROSS-PRIZE SIGNAL'
    );

    lines.push(
      'TEMPORAL HOLDOUT'
    );

    lines.push(
      '========================'
    );


    lines.push(
      'Reference: ' +
      result.referenceModel +
      ' W' +
      result.referenceWindow
    );


    lines.push(
      'Provinces: ' +
      result.provinceCount
    );


    lines.push(
      'Holdout Size: ' +
      result.holdoutSize
    );


    lines.push(
      'Source Prizes: ' +
      result.sourcePrizes
        .map(
          prize =>
            String(prize)
              .toUpperCase()
        )
        .join(
          ', '
        )
    );


    lines.push('');

    lines.push(
      'CLASSIFICATION'
    );

    lines.push(
      result.classification
    );


    lines.push('');

    lines.push(
      'REFERENCE — RECENT W60'
    );


    lines.push(
      'Tests: ' +
      result.reference.tests
    );


    lines.push(
      'Hit@1: ' +
      pct(
        result.reference.hit1Rate
      )
    );


    lines.push(
      'Hit@3: ' +
      pct(
        result.reference.hit3Rate
      )
    );


    lines.push(
      'Hit@5: ' +
      pct(
        result.reference.hit5Rate
      )
    );


    lines.push(
      'Hit@10: ' +
      pct(
        result.reference.hit10Rate
      )
    );


    lines.push(
      'MRR: ' +
      num(
        result.reference.mrr
      )
    );


    lines.push(
      'Avg Rank: ' +
      num(
        result.reference.averageRank,
        2
      )
    );


    lines.push(
      'Quality: ' +
      num(
        result.reference.quality
      )
    );


    if (
      result.winner
    ) {

      const winner =
        result.winner;


      lines.push('');

      lines.push(
        '🏆 BEST CROSS-PRIZE CANDIDATE'
      );


      lines.push(
        'RECENT: ' +
        Math.round(
          winner.recentWeight *
          100
        ) +
        '%'
      );


      lines.push(
        'Cross-Prize: ' +
        Math.round(
          winner.crossWeight *
          100
        ) +
        '%'
      );


      lines.push(
        'Quality: ' +
        num(
          winner.quality
        )
      );


      lines.push(
        'Quality Δ: ' +
        signed(
          winner.delta.quality
        )
      );


      lines.push(
        'Hit@1: ' +
        pct(
          winner.hit1Rate
        ) +
        ' · Δ ' +
        signedPct(
          winner.delta.hit1
        )
      );


      lines.push(
        'Hit@3: ' +
        pct(
          winner.hit3Rate
        ) +
        ' · Δ ' +
        signedPct(
          winner.delta.hit3
        )
      );


      lines.push(
        'Hit@5: ' +
        pct(
          winner.hit5Rate
        ) +
        ' · Δ ' +
        signedPct(
          winner.delta.hit5
        )
      );


      lines.push(
        'Hit@10: ' +
        pct(
          winner.hit10Rate
        ) +
        ' · Δ ' +
        signedPct(
          winner.delta.hit10
        )
      );


      lines.push(
        'MRR: ' +
        num(
          winner.mrr
        ) +
        ' · Δ ' +
        signed(
          winner.delta.mrr
        )
      );


      lines.push(
        'Avg Rank: ' +
        num(
          winner.averageRank,
          2
        ) +
        ' · Improvement ' +
        signed(
          winner.delta.averageRank,
          2
        )
      );


      lines.push(
        'Province W/L/T: ' +
        winner.wins +
        '/' +
        winner.losses +
        '/' +
        winner.ties
      );


      lines.push(
        'Positive Rate: ' +
        pct(
          winner.positiveRate
        )
      );


      lines.push(
        'Mean Province Quality Δ: ' +
        signed(
          winner
            .meanProvinceQualityDelta
        )
      );


      lines.push(
        'Median Province Quality Δ: ' +
        signed(
          winner
            .medianProvinceQualityDelta
        )
      );


      if (
        winner.worstProvince
      ) {

        lines.push(
          'Worst Province: ' +
          winner.worstProvince
            .provinceName +
          ' · Δ ' +
          signed(
            winner.worstProvince
              .delta
          )
        );

      }


      if (
        winner.bestProvince
      ) {

        lines.push(
          'Best Province: ' +
          winner.bestProvince
            .provinceName +
          ' · Δ ' +
          signed(
            winner.bestProvince
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
      'ALL BLENDS'
    );


    result.candidates
      .slice()
      .sort(
        (
          a,
          b
        ) =>
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
            ' RECENT ' +
            Math.round(
              item.recentWeight *
              100
            ) +
            '%' +
            ' / CROSS ' +
            Math.round(
              item.crossWeight *
              100
            ) +
            '%'
          );


          lines.push(
            'Q ' +
            num(
              item.quality
            ) +
            ' · Δ ' +
            signed(
              item.delta.quality
            )
          );


          lines.push(
            'H1 ' +
            pct(
              item.hit1Rate
            ) +
            ' · H3 ' +
            pct(
              item.hit3Rate
            ) +
            ' · H5 ' +
            pct(
              item.hit5Rate
            ) +
            ' · H10 ' +
            pct(
              item.hit10Rate
            )
          );


          lines.push(
            'MRR ' +
            num(
              item.mrr
            ) +
            ' · Rank ' +
            num(
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


          lines.push(
            'Median Δ ' +
            signed(
              item
                .medianProvinceQualityDelta
            )
          );

        }
      );


    lines.push('');

    lines.push(
      '========================'
    );

    lines.push(
      'DISCOVERY RESEARCH ONLY'
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

  function runC61Mobile() {

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


    if (
      typeof window
        .runFix03D59C61CrossPrize !==
      'function'
    ) {

      if (status) {

        status.textContent =
          '❌ C6.1 Research Engine chưa sẵn sàng.';

      }

      return;

    }


    if (button) {

      button.style.pointerEvents =
        'none';

      button.style.opacity =
        '.55';

      button.textContent =
        '⏳ Đang chạy C6.1...';

    }


    if (status) {

      status.textContent =
        '⏳ G8 · Cross-Prize · 5 blends · 21 tỉnh · holdout...';

    }


    if (output) {

      output.textContent =
        '';

    }


    setTimeout(
      function () {

        try {

          const result =
            window
              .runFix03D59C61CrossPrize();


          window
            .LAST_FIX03D59_C61_CROSS_PRIZE_MOBILE =
            result;


          if (status) {

            status.textContent =
              result &&
              result.ready
                ? (
                    '✅ C6.1 hoàn tất · ' +
                    result.provinceCount +
                    ' tỉnh.'
                  )
                : (
                    '❌ C6.1 chưa có kết quả.'
                  );

          }


          if (output) {

            output.textContent =
              buildReport(
                result
              );

          }

        } catch (error) {

          if (status) {

            status.textContent =
              '❌ C6.1 lỗi: ' +
              (
                error &&
                error.message
                  ? error.message
                  : String(error)
              );

          }

        } finally {

          if (button) {

            button.style.pointerEvents =
              'auto';

            button.style.opacity =
              '1';

            button.textContent =
              '🔗 Chạy C6.1 Cross-Prize Signal';

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
        'border:1px solid rgba(99,217,255,.35)',
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
        🔗 C6.1 G8 Cross-Prize Signal
      </div>


      <div
        style="
          opacity:.75;
          font-size:13px;
          line-height:1.55;
          margin-bottom:14px;
        "
      >
        RECENT W60 + previous-draw DB/G1→G7
        <br>
        Cross-Prize 0/10/20/30/40%
        <br>
        21 tỉnh · Late Holdout
        <br>
        Discovery Research · Read Only
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
              #63d9ff,
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
        🔗 Chạy C6.1 Cross-Prize Signal
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
        runC61Mobile
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
    .runFix03D59C61CrossPrizeMobile =
    runC61Mobile;


  window
    .FIX03D59_C61_CROSS_PRIZE_MOBILE_VERSION =
    VERSION;


  window
    .FIX03D59_C61_CROSS_PRIZE_MOBILE_LOADED =
    true;


  console.log(
    'FIX-03D5.9 C6.1 Cross-Prize Signal Mobile V1 loaded / READ ONLY'
  );

})();
