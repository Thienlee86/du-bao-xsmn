/* =========================================================================
   FIX-03D5.9 — STEP 8.3B SOURCE INSPECTOR MOBILE V2

   PURPOSE:
   - Call the existing STEP 8.3B Source Inspector V2 from mobile.
   - Display the detected STEP 8.2C candidate-array path.
   - Display candidate count and selected-province evidence.
   - Help diagnose why Source Shadow V4.2 sees zero candidates.

   IMPORTANT:
   - DIAGNOSTIC ONLY.
   - READ ONLY SOURCE DATA.
   - ZERO ENGINE EXECUTION.
   - ZERO PRODUCTION WRITE.
   - ZERO STORAGE WRITE.
   - NO savePrediction().
   - NO LAST_FORECAST MODIFICATION.
   - NO STEP 8.2C MODIFICATION.
   - NO STEP 8.3B MODIFICATION.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    '83B-SOURCE-INSPECTOR-MOBILE-V2';


  const PANEL_ID =
    'fix03d59-83b-source-inspector-mobile-v2-panel';


  const OUTPUT_ID =
    'fix03d59-83b-source-inspector-mobile-v2-output';


  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

  function esc(value) {

    return String(
      value === null ||
      value === undefined ||
      value === ''
        ? '--'
        : value
    )
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  }


  function yesNo(value) {

    return value
      ? 'YES ✅'
      : 'NO ❌';

  }


  function row(
    label,
    value
  ) {

    return `
      <div
        style="
          display:flex;
          justify-content:space-between;
          gap:14px;
          padding:10px 0;
          border-bottom:
            1px solid rgba(255,255,255,.08);
        "
      >
        <span
          style="
            color:rgba(255,255,255,.68);
            font-size:13px;
            flex:0 0 46%;
          "
        >
          ${esc(label)}
        </span>

        <b
          style="
            color:#fff;
            text-align:right;
            font-size:13px;
            word-break:break-word;
            flex:1;
          "
        >
          ${value}
        </b>
      </div>
    `;

  }


  function sectionTitle(
    text,
    color
  ) {

    return `
      <div
        style="
          margin-top:19px;
          margin-bottom:5px;
          color:${color || '#ffc13d'};
          font-size:16px;
          font-weight:900;
        "
      >
        ${esc(text)}
      </div>
    `;

  }


  function formatKeys(
    keys
  ) {

    if (
      !Array.isArray(keys) ||
      !keys.length
    ) {

      return '--';

    }


    return keys
      .slice(0, 20)
      .join(', ');

  }


  /*
   * =========================================================
   * RUN INSPECTOR
   * =========================================================
   */

  function runSourceInspectorMobileV2() {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {
      return;
    }


    const inspector =
      window
        .runFix03D59Step83BSourceInspector;


    if (
      typeof inspector !==
      'function'
    ) {

      output.innerHTML =
        sectionTitle(
          'VERDICT',
          '#ff7185'
        ) +
        row(
          'Source Inspector V2',
          'NOT AVAILABLE ❌'
        );

      return;

    }


    let result;


    try {

      result =
        inspector();

    } catch (error) {

      output.innerHTML =
        sectionTitle(
          'VERDICT',
          '#ff7185'
        ) +
        row(
          'Inspector Execution',
          'ERROR ❌'
        ) +
        row(
          'Error',
          esc(
            error &&
            error.message
              ? error.message
              : error
          )
        );

      return;

    }


    if (
      !result ||
      typeof result !==
        'object'
    ) {

      output.innerHTML =
        sectionTitle(
          'VERDICT',
          '#ff7185'
        ) +
        row(
          'Inspector Result',
          'INVALID ❌'
        );

      return;

    }


    const step82C =
      result.step82C ||
      {};


    const detection =
      result.candidateDetection ||
      {};


    const provinceInspection =
      result.provinceInspection ||
      {};


    const candidateFound =
      detection.found === true;


    const candidateCount =
      Number.isFinite(
        Number(
          detection.candidateCount
        )
      )
        ? Number(
            detection.candidateCount
          )
        : 0;


    const selectedMatchCount =
      Number.isFinite(
        Number(
          provinceInspection
            .selectedProvinceMatchCount
        )
      )
        ? Number(
            provinceInspection
              .selectedProvinceMatchCount
          )
        : 0;


    const schemaReady =
      Boolean(
        step82C.exists === true &&
        candidateFound &&
        detection.path &&
        candidateCount > 0
      );


    let html = `

      ${sectionTitle(
        'STEP 8.2C RUNTIME'
      )}

      ${row(
        'STEP 8.2C Exists',
        yesNo(
          step82C.exists === true
        )
      )}

      ${row(
        'Reason',
        esc(
          result.reason
        )
      )}

      ${row(
        'Selected Province',
        esc(
          result.selectedProvince
        )
      )}

      ${row(
        'Production Province',
        esc(
          result.productionProvince
        )
      )}

      ${row(
        'Top-level Keys',
        esc(
          formatKeys(
            step82C.topLevelKeys
          )
        )
      )}

      ${row(
        'Arrays Found',
        esc(
          step82C.arraysFound
        )
      )}


      ${sectionTitle(
        'CANDIDATE DETECTION',
        '#72e6ae'
      )}

      ${row(
        'Candidate Array Found',
        yesNo(
          candidateFound
        )
      )}

      ${row(
        'Candidate Path',
        esc(
          detection.path
        )
      )}

      ${row(
        'Candidate Score',
        esc(
          detection.score
        )
      )}

      ${row(
        'Candidate Count',
        esc(
          candidateCount
        )
      )}

      ${row(
        'Selected Province Match Count',
        esc(
          selectedMatchCount
        )
      )}


      ${sectionTitle(
        'VERDICT',
        schemaReady
          ? '#72e6ae'
          : '#ff7185'
      )}

      ${row(
        '8.2C Candidate Schema',
        schemaReady
          ? 'IDENTIFIED ✅'
          : 'NOT IDENTIFIED ❌'
      )}

    `;


    /*
     * Show top candidate-array hypotheses.
     */

    const rankedArrays =
      Array.isArray(
        detection.rankedArrays
      )
        ? detection.rankedArrays
        : [];


    if (
      rankedArrays.length
    ) {

      html +=
        sectionTitle(
          'TOP ARRAY PATHS',
          '#7fd8ff'
        );


      rankedArrays
        .slice(0, 5)
        .forEach(
          function (
            item,
            index
          ) {

            html +=
              row(
                '#' +
                  String(
                    index + 1
                  ),
                esc(
                  (
                    item.path ||
                    '--'
                  ) +
                  ' · len=' +
                  String(
                    item.length ??
                    '--'
                  ) +
                  ' · score=' +
                  String(
                    item.score ??
                    '--'
                  )
                )
              );

          }
        );

    }


    html += `

      <div
        style="
          margin-top:16px;
          padding:13px;
          border-radius:13px;
          background:rgba(52,211,153,.10);
          color:#caffdf;
          font-size:12px;
          font-weight:800;
          line-height:1.6;
        "
      >
        🔒 DIAGNOSTIC ONLY
        <br>
        🔒 NO ENGINE EXECUTION
        <br>
        🔒 NO PRODUCTION / STORAGE WRITE
        <br>
        🔒 LAST_FORECAST NOT MODIFIED
      </div>

    `;


    output.innerHTML =
      html;


    /*
     * Mobile diagnostic RAM only.
     */

    window
      .LAST_FIX03D59_STEP83B_SOURCE_INSPECTOR_MOBILE_V2 =
      {

        version:
          VERSION,

        result,

        schemaReady,

        candidateFound,

        candidatePath:
          detection.path ||
          null,

        candidateCount,

        selectedProvinceMatchCount:
          selectedMatchCount,

        checkedAt:
          new Date()
            .toISOString()

      };

  }


  /*
   * =========================================================
   * BUILD PANEL
   * =========================================================
   */

  function buildSourceInspectorMobileV2() {

    const old =
      document.getElementById(
        PANEL_ID
      );


    if (old) {
      old.remove();
    }


    const settings =
      document.getElementById(
        'tab-settings'
      );


    if (!settings) {

      console.warn(
        '83B Source Inspector Mobile V2: tab-settings not found'
      );

      return;

    }


    const panel =
      document.createElement(
        'section'
      );


    panel.id =
      PANEL_ID;


    panel.style.cssText = [
      'margin:18px 24px 30px',
      'padding:20px',
      'border-radius:24px',
      'background:linear-gradient(145deg,#20264f,#18203f)',
      'border:1px solid rgba(127,216,255,.28)',
      'color:#fff',
      'box-sizing:border-box'
    ].join(';');


    panel.innerHTML = `

      <div
        style="
          font-size:21px;
          font-weight:900;
          margin-bottom:7px;
        "
      >
        🔬 STEP 8.3B SOURCE INSPECTOR V2
      </div>

      <div
        style="
          opacity:.72;
          font-size:13px;
          line-height:1.55;
        "
      >
        Inspect REAL STEP 8.2C schema and locate
        the candidate array used before Source Shadow.

        <br>

        <b style="color:#72e6ae;">
          READ ONLY · ZERO ENGINE EXECUTION
        </b>
      </div>

      <div
        id="fix03d59-83b-source-inspector-mobile-v2-run"
        role="button"
        tabindex="0"
        style="
          display:flex;
          width:100%;
          min-height:60px;
          margin-top:17px;
          padding:15px;
          border-radius:16px;
          background:
            linear-gradient(
              90deg,
              #ffc13d,
              #ff963d
            );
          color:#17192f;
          font-size:16px;
          font-weight:900;
          align-items:center;
          justify-content:center;
          text-align:center;
          box-sizing:border-box;
          cursor:pointer;
        "
      >
        🔬 INSPECT REAL 8.2C SOURCE
      </div>

      <div
        id="${OUTPUT_ID}"
        style="
          margin-top:17px;
        "
      ></div>

    `;


    settings.appendChild(
      panel
    );


    const control =
      document.getElementById(
        'fix03d59-83b-source-inspector-mobile-v2-run'
      );


    if (control) {

      control.addEventListener(
        'click',
        runSourceInspectorMobileV2
      );


      control.addEventListener(
        'keydown',
        function (event) {

          if (
            event.key === 'Enter' ||
            event.key === ' '
          ) {

            event.preventDefault();

            runSourceInspectorMobileV2();

          }

        }
      );

    }

  }


  /*
   * =========================================================
   * PUBLIC API
   * =========================================================
   */

  window
    .runSourceInspectorMobileV203D59 =
    runSourceInspectorMobileV2;


  window
    .rebuildSourceInspectorMobileV203D59 =
    buildSourceInspectorMobileV2;


  window
    .FIX03D59_STEP83B_SOURCE_INSPECTOR_MOBILE_V2_LOADED =
    true;


  window
    .FIX03D59_STEP83B_SOURCE_INSPECTOR_MOBILE_V2_VERSION =
    VERSION;


  /*
   * =========================================================
   * INIT
   * =========================================================
   */

  function init() {

    window.setTimeout(
      buildSourceInspectorMobileV2,
      420
    );

  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      init,
      {
        once: true
      }
    );

  } else {

    init();

  }


  console.log(
    'FIX-03D5.9 STEP 8.3B Source Inspector Mobile V2 loaded / DIAGNOSTIC ONLY'
  );

})();
