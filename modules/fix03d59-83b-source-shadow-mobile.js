/* =========================================================================
   FIX-03D5.9 — STEP 8.3B SOURCE SHADOW MOBILE UI V2
   FILE:
   modules/fix03d59-83b-source-shadow-mobile.js

   PURPOSE:
   - Run STEP 8.3B Source Shadow manually from mobile.
   - Display Source Shadow result inside Settings.
   - Rebuild stale/incomplete mobile panel safely.
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


  const VERSION =
    '83B-SOURCE-SHADOW-MOBILE-V2';


  const PANEL_ID =
    'fix03d59-83b-source-shadow-mobile-panel';


  const OUTPUT_ID =
    'fix03d59-83b-source-shadow-mobile-output';


  const CONTROL_ID =
    'fix03d59-83b-source-shadow-mobile-control';


  /* =========================================================
     HELPERS
     ========================================================= */

  function yesNo(value) {

    return value === true
      ? 'YES ✅'
      : 'NO ❌';

  }


  function safeNo(value) {

    return value === true
      ? 'YES ❌'
      : 'NO ✅';

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


    return String(value);

  }


  function escapeHtml(value) {

    return safeText(
      value,
      '--'
    )
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  }


  function getCandidateCount(result) {

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


  function getBoundaryCount(result) {

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


  /* =========================================================
     RESOLVE SOURCE SHADOW
     ========================================================= */

  function resolveSourceShadow() {

    try {

      if (
        typeof window
          .build83BSourceShadow ===
        'function'
      ) {

        return {

          ready: true,

          name:
            'build83BSourceShadow',

          fn:
            window
              .build83BSourceShadow

        };

      }

    } catch (error) {

      // FAIL CLOSED

    }


    return {

      ready: false,

      name:
        'build83BSourceShadow',

      fn:
        null

    };

  }


  /* =========================================================
     RENDER RESULT
     ========================================================= */

  function renderResult(result) {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {

      return;

    }


    const ready =
      Boolean(
        result &&
        result.ready === true
      );


    const passed =
      Boolean(
        result &&
        result.passed === true
      );


    const sourceCount =
      getCandidateCount(
        result
      );


    const boundaryCount =
      getBoundaryCount(
        result
      );


    const countMatch =
      sourceCount > 0 &&
      sourceCount ===
        boundaryCount;


    output.innerHTML = `

      <div
        style="
          margin-top:18px;
          padding:20px;
          border-radius:22px;
          background:rgba(22,34,72,.92);
          line-height:1.7;
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


        Ready:
        <b>${yesNo(ready)}</b>

        <br>

        Passed:
        <b>${yesNo(passed)}</b>

        <br><br>

        Reason:
        <br>

        <b
          style="
            overflow-wrap:anywhere;
          "
        >
          ${escapeHtml(
            result &&
            result.reason
          )}
        </b>

        <br><br>

        Source:
        <br>

        <b
          style="
            overflow-wrap:anywhere;
          "
        >
          ${escapeHtml(
            result &&
            result.sourceName
          )}
        </b>

      </div>


      <div
        style="
          margin-top:16px;
          padding:20px;
          border-radius:22px;
          background:rgba(42,57,111,.92);
          line-height:1.7;
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


        Source Candidates:
        <b>${sourceCount}</b>

        <br>

        Boundary Candidates:
        <b>${boundaryCount}</b>

        <br>

        Candidate Count Match:
        <b>${yesNo(countMatch)}</b>

      </div>


      <div
        style="
          margin-top:16px;
          padding:20px;
          border-radius:22px;
          border:2px solid ${
            passed
              ? '#42d6a4'
              : '#ff6b7a'
          };
          background:rgba(31,68,89,.92);
          line-height:1.7;
        "
      >

        <div
          style="
            color:${
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


        Shadow Ready:
        <b>${yesNo(passed)}</b>

        <br>

        Real 8.3B Modified:
        <b>NO ✅</b>

        <br>

        Promotion Performed:
        <b>
          ${safeNo(
            result &&
            result.promotionPerformed
          )}
        </b>

      </div>


      <div
        style="
          margin-top:16px;
          padding:20px;
          border-radius:22px;
          background:rgba(25,72,103,.92);
          line-height:1.75;
          font-weight:700;
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


        Read Only:
        ${yesNo(
          result &&
          result.readOnly
        )}

        <br>

        Shadow Only:
        YES ✅

        <br>

        Canonical Write:
        ${safeNo(
          result &&
          result.canonicalWrite
        )}

        <br>

        Production Write:
        ${safeNo(
          result &&
          result.productionWrite
        )}

        <br>

        Storage Write:
        ${safeNo(
          result &&
          result.storageWrite
        )}

        <br>

        Auto Promotion:
        ${safeNo(
          result &&
          result.autoPromotion
        )}

        <br>

        savePrediction Called:
        NO ✅

        <br>

        LAST_FORECAST Modified:
        NO ✅

      </div>

    `;


    output.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

  }


  /* =========================================================
     RUN
     ========================================================= */

  function runSourceShadow() {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {

      return null;

    }


    const sourceShadow =
      resolveSourceShadow();


    if (!sourceShadow.ready) {

      output.innerHTML = `

        <div
          style="
            margin-top:18px;
            padding:20px;
            border-radius:20px;
            border:2px solid #ff6b7a;
            color:#ff9ba5;
            line-height:1.6;
          "
        >

          ❌ SOURCE SHADOW NOT AVAILABLE

          <br><br>

          Function:

          <b>
            build83BSourceShadow
          </b>

        </div>

      `;


      return null;

    }


    try {

      const result =
        sourceShadow.fn();


      if (!result) {

        throw new Error(
          'SOURCE_SHADOW_RETURNED_EMPTY_RESULT'
        );

      }


      /*
       * Diagnostic shadow result only.
       * Does NOT modify the canonical
       * STEP 8.3B result.
       */

      window
        .LAST_FIX03D59_STEP83B_SOURCE_SHADOW =
        result;


      renderResult(
        result
      );


      console.log(
        'FIX-03D5.9 STEP 8.3B SOURCE SHADOW MOBILE V2',
        result
      );


      return result;

    } catch (error) {

      console.error(
        '83B Source Shadow Mobile V2:',
        error
      );


      output.innerHTML = `

        <div
          style="
            margin-top:18px;
            padding:20px;
            border-radius:20px;
            border:2px solid #ff6b7a;
            color:#ff9ba5;
            line-height:1.6;
            overflow-wrap:anywhere;
          "
        >

          ❌ SOURCE SHADOW ERROR

          <br><br>

          <b>
            ${escapeHtml(
              error &&
              error.message
                ? error.message
                : error
            )}
          </b>

        </div>

      `;


      return null;

    }

  }


  /* =========================================================
     BUILD / REBUILD MOBILE PANEL
     ========================================================= */

  function buildPanel() {

    const settings =
      document.getElementById(
        'tab-settings'
      );


    if (!settings) {

      console.warn(
        '83B Source Shadow Mobile V2: tab-settings not found'
      );

      return;

    }


    /*
     * V2 SELF-HEAL:
     *
     * Remove any stale/incomplete panel
     * with the same ID and rebuild it.
     *
     * UI only.
     * No production state is modified.
     */

    const oldPanel =
      document.getElementById(
        PANEL_ID
      );


    if (oldPanel) {

      oldPanel.remove();

    }


    const sourceShadow =
      resolveSourceShadow();


    const panel =
      document.createElement(
        'section'
      );


    panel.id =
      PANEL_ID;


    panel.style.cssText = [
      'margin:24px',
      'padding:26px',
      'border-radius:28px',
      'background:linear-gradient(145deg,rgba(38,47,101,.98),rgba(27,34,78,.98))',
      'border:1px solid rgba(170,110,255,.35)',
      'color:#fff',
      'box-sizing:border-box'
    ].join(';');


    panel.innerHTML = `

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

        Kiểm tra B8 Verified Scope bằng
        REAL STEP 8.3 boundary builder
        trong Shadow Mode, trước khi thay
        đổi STEP 8.3B thật.

      </div>


      <div
        style="
          padding:18px;
          border-radius:18px;
          background:rgba(0,0,0,.14);
          font-size:17px;
          line-height:1.65;
        "
      >

        Mobile Version:
        <b>
          ${VERSION}
        </b>

        <br>

        Source Shadow Script:

        <b
          style="
            color:${
              sourceShadow.ready
                ? '#9ff0c8'
                : '#ff9b9b'
            };
          "
        >
          ${
            sourceShadow.ready
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
          ${escapeHtml(
            sourceShadow.name
          )}
        </b>

      </div>


      <div
        id="${CONTROL_ID}"
        role="button"
        tabindex="0"
        style="
          display:flex;
          align-items:center;
          justify-content:center;
          width:100%;
          min-height:64px;
          margin-top:22px;
          padding:16px 12px;
          border-radius:18px;
          background:
            linear-gradient(
              90deg,
              #c084fc,
              #8b5cf6
            );
          color:#ffffff;
          font-size:18px;
          font-weight:900;
          text-align:center;
          box-sizing:border-box;
          cursor:pointer;
          user-select:none;
        "
      >

        🔎 RUN 8.3B SOURCE SHADOW

      </div>


      <div
        id="${OUTPUT_ID}"
      ></div>

    `;


    settings.appendChild(
      panel
    );


    const control =
      document.getElementById(
        CONTROL_ID
      );


    if (control) {

      control.addEventListener(
        'click',
        runSourceShadow
      );


      control.addEventListener(
        'keydown',
        function (event) {

          if (
            event.key === 'Enter' ||
            event.key === ' '
          ) {

            event.preventDefault();

            runSourceShadow();

          }

        }
      );

    }


    console.log(
      '83B Source Shadow Mobile V2 panel built',
      {
        panel: true,
        control:
          Boolean(control),
        sourceShadowReady:
          sourceShadow.ready
      }
    );

  }


  /* =========================================================
     PUBLIC API
     ========================================================= */

  window
    .run83BSourceShadowMobile03D59 =
    runSourceShadow;


  window
    .rebuild83BSourceShadowMobile03D59 =
    buildPanel;


  window
    .FIX03D59_STEP83B_SOURCE_SHADOW_MOBILE_LOADED =
    true;


  window
    .FIX03D59_STEP83B_SOURCE_SHADOW_MOBILE_VERSION =
    VERSION;


  /* =========================================================
     INITIALIZE
     ========================================================= */

  function initialize() {

    /*
     * Delay slightly so all older Settings
     * panels finish initialization first.
     * Then V2 rebuilds its own panel.
     */

    window.setTimeout(
      buildPanel,
      1000
    );

  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      initialize,
      {
        once: true
      }
    );

  } else {

    initialize();

  }


  console.log(
    'FIX-03D5.9 STEP 8.3B Source Shadow Mobile V2 loaded / READ ONLY / SHADOW ONLY / ZERO WRITE'
  );

})();
