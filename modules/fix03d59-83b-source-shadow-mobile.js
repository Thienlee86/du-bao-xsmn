/* =========================================================================
   FIX-03D5.9 — STEP 8.3B SOURCE SHADOW MOBILE UI
   FILE:
   modules/fix03d59-83b-source-shadow-mobile.js

   PURPOSE:
   - Confirm STEP 8.3B Source Shadow is loaded.
   - Run Source Shadow manually from mobile.
   - Display result inside Settings tab.
   - Never modify the real STEP 8.3B result.

   SAFETY:
   - MANUAL RUN ONLY
   - READ ONLY
   - SHADOW ONLY
   - ZERO WRITE
   - NO PRODUCTION WRITE
   - NO STORAGE WRITE
   - NO AUTO PROMOTION
   - NO savePrediction()
   - NO LAST_FORECAST modification
   ========================================================================= */

(function () {

  'use strict';


  const PANEL_ID =
    'fix03d59-83b-source-shadow-mobile-panel';

  const OUTPUT_ID =
    'fix03d59-83b-source-shadow-mobile-output';


  function yesNo(
    value
  ) {

    return value === true
      ? 'YES ✅'
      : 'NO ❌';

  }


  function safeText(
    value,
    fallback
  ) {

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {

      return fallback || '--';

    }

    return String(
      value
    );

  }


  function getCandidateCount(
    result
  ) {

    if (
      Number.isFinite(
        result &&
        result.sourceCandidateCount
      )
    ) {

      return result
        .sourceCandidateCount;

    }


    if (
      result &&
      result.shadowSource &&
      Array.isArray(
        result.shadowSource.eligible
      )
    ) {

      return result
        .shadowSource
        .eligible
        .length;

    }


    return 0;

  }


  function getBoundaryCount(
    result
  ) {

    if (
      Number.isFinite(
        result &&
        result.boundaryCandidateCount
      )
    ) {

      return result
        .boundaryCandidateCount;

    }


    if (
      result &&
      result.boundaryResult &&
      result.boundaryResult.counts &&
      Number.isFinite(
        result
          .boundaryResult
          .counts
          .candidates
      )
    ) {

      return result
        .boundaryResult
        .counts
        .candidates;

    }


    return 0;

  }


  function renderResult(
    result
  ) {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {

      return;

    }


    const ready =
      result &&
      result.ready === true;


    const passed =
      result &&
      result.passed === true;


    const sourceCount =
      getCandidateCount(
        result
      );


    const boundaryCount =
      getBoundaryCount(
        result
      );


    output.innerHTML = `

      <div
        style="
          margin-top:18px;
          padding:20px;
          border-radius:22px;
          background:
            rgba(22,34,72,.92);
        "
      >

        <div
          style="
            color:#ffbd3c;
            font-size:21px;
            font-weight:900;
            margin-bottom:16px;
          "
        >
          🔎 SOURCE SHADOW RESULT
        </div>


        <div
          style="
            font-size:17px;
            line-height:1.7;
          "
        >

          Ready:
          <b>
            ${yesNo(ready)}
          </b>

          <br>

          Passed:
          <b>
            ${yesNo(passed)}
          </b>

          <br><br>

          Reason:
          <br>

          <b
            style="
              overflow-wrap:anywhere;
            "
          >
            ${
              safeText(
                result &&
                result.reason,
                'UNKNOWN'
              )
            }
          </b>

          <br><br>

          Source:
          <br>

          <b
            style="
              overflow-wrap:anywhere;
            "
          >
            ${
              safeText(
                result &&
                result.sourceName,
                'NONE'
              )
            }
          </b>

        </div>

      </div>


      <div
        style="
          margin-top:16px;
          padding:20px;
          border-radius:22px;
          background:
            rgba(42,57,111,.92);
        "
      >

        <div
          style="
            color:#ffbd3c;
            font-size:20px;
            font-weight:900;
            margin-bottom:14px;
          "
        >
          🎯 SHADOW CANDIDATES
        </div>


        <div
          style="
            font-size:17px;
            line-height:1.7;
          "
        >

          Source Candidates:
          <b>
            ${sourceCount}
          </b>

          <br>

          Boundary Candidates:
          <b>
            ${boundaryCount}
          </b>

          <br>

          Candidate Count Match:
          <b>
            ${
              yesNo(
                sourceCount > 0 &&
                sourceCount ===
                  boundaryCount
              )
            }
          </b>

        </div>

      </div>


      <div
        style="
          margin-top:16px;
          padding:20px;
          border-radius:22px;
          border:
            2px solid
            ${
              passed
                ? '#42d6a4'
                : '#ff6b7a'
            };
          background:
            rgba(31,68,89,.92);
        "
      >

        <div
          style="
            color:
              ${
                passed
                  ? '#76efbd'
                  : '#ff8994'
              };
            font-size:22px;
            font-weight:900;
            margin-bottom:15px;
          "
        >

          ${
            passed
              ? '🟢 SOURCE SHADOW READY'
              : '🔴 SOURCE SHADOW BLOCKED'
          }

        </div>


        <div
          style="
            font-size:17px;
            line-height:1.7;
          "
        >

          Shadow Ready:
          <b>
            ${yesNo(passed)}
          </b>

          <br>

          Real 8.3B Modified:
          <b>
            NO ✅
          </b>

          <br>

          Promotion Performed:
          <b>
            ${
              yesNo(
                result &&
                result
                  .promotionPerformed ===
                  true
              )
            }
          </b>

        </div>

      </div>


      <div
        style="
          margin-top:16px;
          padding:20px;
          border-radius:22px;
          background:
            rgba(25,72,103,.92);
        "
      >

        <div
          style="
            color:#ffffff;
            font-size:20px;
            font-weight:900;
            margin-bottom:14px;
          "
        >
          🔒 SAFETY CONTRACT
        </div>


        <div
          style="
            font-size:16px;
            line-height:1.75;
            font-weight:700;
          "
        >

          Read Only:
          ${
            yesNo(
              result &&
              result.readOnly
            )
          }

          <br>

          Shadow Only:
          YES ✅

          <br>

          Canonical Write:
          ${
            (
              !result ||
              result.canonicalWrite !==
                true
            )
              ? 'NO ✅'
              : 'YES ❌'
          }

          <br>

          Production Write:
          ${
            (
              !result ||
              result.productionWrite !==
                true
            )
              ? 'NO ✅'
              : 'YES ❌'
          }

          <br>

          Storage Write:
          ${
            (
              !result ||
              result.storageWrite !==
                true
            )
              ? 'NO ✅'
              : 'YES ❌'
          }

          <br>

          Auto Promotion:
          ${
            (
              !result ||
              result.autoPromotion !==
                true
            )
              ? 'NO ✅'
              : 'YES ❌'
          }

          <br>

          savePrediction Called:
          NO ✅

          <br>

          LAST_FORECAST Modified:
          NO ✅

        </div>

      </div>

    `;


    output.scrollIntoView({
      behavior:
        'smooth',

      block:
        'start'
    });

  }


  function runSourceShadow() {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (
      typeof
        window
          .build83BSourceShadow !==
        'function'
    ) {

      if (output) {

        output.innerHTML = `

          <div
            style="
              margin-top:18px;
              padding:20px;
              border-radius:20px;
              border:
                2px solid #ff6b7a;
              color:#ff9ba5;
            "
          >

            ❌ Source Shadow function
            <b>
              build83BSourceShadow
            </b>
            is not available.

          </div>

        `;

      }


      return;

    }


    let result;


    try {

      /*
       * Call builder directly instead of
       * inspect83BSourceShadow().
       *
       * This avoids the alert() popup
       * and renders the result directly
       * inside the mobile panel.
       */

      result =
        window
          .build83BSourceShadow();


      /*
       * Diagnostic result only.
       * This mirrors the inspector result
       * and does NOT alter STEP 8.3B.
       */

      window
        .LAST_FIX03D59_STEP83B_SOURCE_SHADOW =
          result;


      renderResult(
        result
      );


      console.log(
        'FIX-03D5.9 STEP 8.3B SOURCE SHADOW MOBILE',
        result
      );


    } catch (
      error
    ) {

      console.error(
        '83B Source Shadow Mobile:',
        error
      );


      if (output) {

        output.innerHTML = `

          <div
            style="
              margin-top:18px;
              padding:20px;
              border-radius:20px;
              border:
                2px solid #ff6b7a;
              color:#ff9ba5;
              overflow-wrap:anywhere;
            "
          >

            ❌ Source Shadow Mobile Error:

            <br><br>

            <b>
              ${
                safeText(
                  error &&
                  error.message
                    ? error.message
                    : error,
                  'UNKNOWN'
                )
              }
            </b>

          </div>

        `;

      }

    }

  }


  function buildPanel() {

    if (
      document.getElementById(
        PANEL_ID
      )
    ) {

      return;

    }


    const settings =
      document.getElementById(
        'tab-settings'
      );


    if (!settings) {

      console.warn(
        '83B Source Shadow Mobile: tab-settings not found'
      );

      return;

    }


    const panel =
      document.createElement(
        'section'
      );


    panel.id =
      PANEL_ID;


    panel.innerHTML = `

      <div
        style="
          margin:24px;
          padding:26px;
          border-radius:28px;
          background:
            linear-gradient(
              145deg,
              rgba(38,47,101,.98),
              rgba(27,34,78,.98)
            );
          border:
            1px solid
            rgba(170,110,255,.35);
          color:#fff;
        "
      >

        <div
          style="
            font-size:27px;
            font-weight:900;
            margin-bottom:14px;
          "
        >
          🔎 8.3B SOURCE SHADOW
        </div>


        <div
          style="
            color:#c1c6e0;
            font-size:17px;
            line-height:1.6;
            margin-bottom:20px;
          "
        >
          Kiểm tra B8 Verified Scope
          bằng REAL STEP 8.3 boundary
          builder trong Shadow Mode,
          trước khi thay đổi STEP 8.3B thật.
        </div>


        <div
          style="
            padding:18px;
            border-radius:18px;
            background:
              rgba(0,0,0,.14);
            font-size:17px;
            line-height:1.65;
          "
        >

          Source Shadow Script:
          <b>
            ${
              window
                .FIX03D59_STEP83B_SOURCE_SHADOW_LOADED ===
                true
                  ? 'YES ✅'
                  : 'NO ❌'
            }
          </b>

          <br>

          Function:
          <br>

          <b
            style="
              overflow-wrap:anywhere;
            "
          >
            build83BSourceShadow
          </b>

        </div>


        <button
          type="button"
          id="fix03d59-83b-source-shadow-run"
          style="
            width:100%;
            margin-top:22px;
            padding:19px 12px;
            border:0;
            border-radius:20px;
            font-size:19px;
            font-weight:900;
            color:#fff;
            background:
              linear-gradient(
                90deg,
                #a85ff4,
                #7552ff
              );
          "
        >
          🔎 RUN 8.3B SOURCE SHADOW
        </button>


        <div
          id="${OUTPUT_ID}">
        </div>

      </div>

    `;


    settings.appendChild(
      panel
    );


    const button =
      document.getElementById(
        'fix03d59-83b-source-shadow-run'
      );


    if (button) {

      button.addEventListener(
        'click',
        runSourceShadow
      );

    }

  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      buildPanel
    );

  } else {

    buildPanel();

  }


  window
    .FIX03D59_STEP83B_SOURCE_SHADOW_MOBILE_LOADED =
      true;


  console.log(
    'FIX-03D5.9 STEP 8.3B Source Shadow Mobile loaded'
  );

})();
