/* =========================================================================
   FIX-03D5.9
   C5.2 FEATURE PRUNING — MOBILE V1

   PURPOSE:
   - Run existing C5.2 Feature Pruning Benchmark.
   - Display FULL vs pruned feature sets.
   - Show best pruned candidate.
   - Show holdout metrics and province robustness.
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
    'FIX03D59_C52_FEATURE_PRUNING_MOBILE_V1';


  const PANEL_ID =
    'fix03d59-c52-mobile-panel';

  const BUTTON_ID =
    'fix03d59-c52-mobile-run';

  const STATUS_ID =
    'fix03d59-c52-mobile-status';

  const OUTPUT_ID =
    'fix03d59-c52-mobile-output';


  function runC52Mobile() {

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
        .runFix03D59C52FeaturePruning !==
      'function'
    ) {

      if (status) {

        status.textContent =
          '❌ C5.2 Research Engine chưa sẵn sàng.';

      }

      return;

    }


    if (
      typeof window
        .buildFix03D59C52FeaturePruningReport !==
      'function'
    ) {

      if (status) {

        status.textContent =
          '❌ C5.2 Reporter chưa sẵn sàng.';

      }

      return;

    }


    if (button) {

      button.style.pointerEvents =
        'none';

      button.style.opacity =
        '.55';

      button.textContent =
        '⏳ Đang chạy C5.2...';

    }


    if (status) {

      status.textContent =
        '⏳ G8 RECENT W60 · 7 feature sets · 21 tỉnh · holdout...';

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
              .runFix03D59C52FeaturePruning();


          window
            .LAST_FIX03D59_C52_FEATURE_PRUNING_MOBILE =
            result;


          if (status) {

            status.textContent =
              result &&
              result.ready
                ? (
                    '✅ C5.2 hoàn tất · ' +
                    result.provinceCount +
                    ' tỉnh.'
                  )
                : (
                    '❌ C5.2 chưa có kết quả.'
                  );

          }


          if (output) {

            output.textContent =
              window
                .buildFix03D59C52FeaturePruningReport(
                  result
                );

          }

        } catch (error) {

          if (status) {

            status.textContent =
              '❌ C5.2 lỗi: ' +
              (
                error &&
                error.message
                  ? error.message
                  : String(
                      error
                    )
              );

          }

        } finally {

          if (button) {

            button.style.pointerEvents =
              'auto';

            button.style.opacity =
              '1';

            button.textContent =
              '✂️ Chạy C5.2 Feature Pruning';

          }

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
        ✂️ C5.2 G8 Feature Pruning
      </div>


      <div
        style="
          opacity:.75;
          font-size:13px;
          line-height:1.55;
          margin-bottom:14px;
        "
      >
        RECENT W60
        <br>
        FULL vs 6 pruned feature sets
        <br>
        21 tỉnh · Late Holdout
        <br>
        Research Only · Read Only
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
              #68e39b
            );
          color:#17192f;
          font-size:16px;
          font-weight:900;
          text-align:center;
          cursor:pointer;
          user-select:none;
        "
      >
        ✂️ Chạy C5.2 Feature Pruning
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
        runC52Mobile
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


  window
    .runFix03D59C52FeaturePruningMobile =
    runC52Mobile;


  window
    .FIX03D59_C52_FEATURE_PRUNING_MOBILE_VERSION =
    VERSION;


  window
    .FIX03D59_C52_FEATURE_PRUNING_MOBILE_LOADED =
    true;


  console.log(
    'FIX-03D5.9 C5.2 Feature Pruning Mobile V1 loaded / READ ONLY'
  );

})();
