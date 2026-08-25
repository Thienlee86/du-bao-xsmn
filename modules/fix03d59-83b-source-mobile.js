/* =========================================================================
   FIX-03D5.9 — STEP 8.3B SOURCE INSPECTOR MOBILE V2
   FILE:
   modules/fix03d59-83b-source-mobile.js

   PURPOSE:
   - Run STEP 8.3B Source Inspector V2 from mobile.
   - Inspect REAL STEP 8.2C runtime schema.
   - Show candidate array path.
   - Show candidate count.
   - Show candidate keys.
   - Show province field/path/value.
   - Show prize field/path/value.
   - Help diagnose why Source Shadow gets 0 candidates.

   SAFETY:
   - DIAGNOSTIC ONLY
   - SOURCE DATA READ ONLY
   - ZERO PRODUCTION WRITE
   - ZERO STORAGE WRITE
   - NO ENGINE EXECUTION
   - NO savePrediction()
   - NO LAST_FORECAST MODIFICATION
   - NO STEP 8.2C MODIFICATION
   - NO STEP 8.3B MODIFICATION
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    '83B-SOURCE-MOBILE-V2-82C-SCHEMA';


  const PANEL_ID =
    'fix03d59-83b-source-mobile-panel';


  const OUTPUT_ID =
    'fix03d59-83b-source-mobile-output';


  const CONTROL_ID =
    'fix03d59-83b-source-mobile-control';


  /* =========================================================
     HELPERS
     ========================================================= */

  function safeText83BMobile(
    value,
    fallback
  ) {

    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {

      return fallback || '--';

    }


    if (Array.isArray(value)) {

      return value.join(', ');

    }


    if (
      typeof value === 'object'
    ) {

      try {

        return JSON.stringify(
          value,
          null,
          2
        );

      } catch (error) {

        return '[object]';

      }

    }


    return String(value);

  }


  function escape83BMobile(
    value
  ) {

    return safeText83BMobile(
      value,
      '--'
    )
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  }


  function yesNo83BMobile(
    value
  ) {

    return value === true
      ? 'YES ✅'
      : 'NO ❌';

  }


  function safeNo83BMobile(
    value
  ) {

    return value === true
      ? 'YES ❌'
      : 'NO ✅';

  }


  function first83BMobile(
    value
  ) {

    return (
      Array.isArray(value) &&
      value.length > 0
    )
      ? value[0]
      : null;

  }


  /* =========================================================
     RESOLVE INSPECTOR V2
     ========================================================= */

  function resolve83BInspectorMobile() {

    try {

      if (
        typeof window
          .runFix03D59Step83BSourceInspector ===
        'function'
      ) {

        return {

          ready: true,

          name:
            'runFix03D59Step83BSourceInspector',

          fn:
            window
              .runFix03D59Step83BSourceInspector

        };

      }

    } catch (error) {

      // FAIL CLOSED

    }


    return {

      ready: false,

      name:
        'runFix03D59Step83BSourceInspector',

      fn: null

    };

  }


  /* =========================================================
     INTERESTING FIELD RENDER
     ========================================================= */

  function renderField83BMobile(
    field
  ) {

    if (!field) {

      return `
        <div
          style="
            opacity:.65;
            margin-top:8px;
          "
        >
          Không tìm thấy.
        </div>
      `;

    }


    return `

      <div
        style="
          margin-top:9px;
          padding:11px;
          border-radius:12px;
          background:rgba(255,255,255,.055);
          line-height:1.55;
          overflow-wrap:anywhere;
        "
      >

        Path:
        <br>

        <b>
          ${escape83BMobile(
            field.path
          )}
        </b>

        <br><br>

        Value:

        <b
          style="
            color:#ffbd3c;
          "
        >
          ${escape83BMobile(
            field.value
          )}
        </b>

      </div>

    `;

  }


  /* =========================================================
     RENDER RESULT
     ========================================================= */

  function render83BMobileResult(
    result
  ) {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {

      return;

    }


    if (
      !result ||
      typeof result !== 'object'
    ) {

      output.innerHTML = `

        <div
          style="
            margin-top:16px;
            padding:16px;
            border-radius:16px;
            border:2px solid #ff6b7a;
            color:#ff9ba5;
          "
        >
          ❌ Inspector returned invalid result.
        </div>

      `;

      return;

    }


    const step82C =
      result.step82C || {};


    const detection =
      result.candidateDetection || {};


    const provinceInspection =
      result.provinceInspection || {};


    const prizeInspection =
      result.prizeInspection || {};


    const samples =
      Array.isArray(
        result.candidateSamples
      )
        ? result.candidateSamples
        : [];


    const firstSample =
      first83BMobile(
        samples
      );


    const provinceFields =
      Array.isArray(
        provinceInspection.fields
      )
        ? provinceInspection.fields
        : [];


    const selectedMatches =
      Array.isArray(
        provinceInspection
          .selectedProvinceMatches
      )
        ? provinceInspection
            .selectedProvinceMatches
        : [];


    const prizeFields =
      Array.isArray(
        prizeInspection.fields
      )
        ? prizeInspection.fields
        : [];


    const firstProvinceField =
      first83BMobile(
        provinceFields
      );


    const firstSelectedMatch =
      first83BMobile(
        selectedMatches
      );


    const firstPrizeField =
      first83BMobile(
        prizeFields
      );


    const candidateKeys =
      firstSample &&
      Array.isArray(
        firstSample.keys
      )
        ? firstSample.keys
        : [];


    const candidateFound =
      detection.found === true;


    const candidateCount =
      Number(
        detection.candidateCount ||
        0
      );


    const selectedMatchCount =
      Number(
        provinceInspection
          .selectedProvinceMatchCount ||
        0
      );


    output.innerHTML = `

      <!-- ===============================================
           SUMMARY
           =============================================== -->

      <div
        style="
          margin-top:18px;
          padding:18px;
          border-radius:20px;
          background:rgba(20,31,69,.95);
          line-height:1.7;
        "
      >

        <div
          style="
            color:#ffbd3c;
            font-size:21px;
            font-weight:900;
            margin-bottom:14px;
          "
        >
          🔬 8.2C SCHEMA RESULT
        </div>


        Version:
        <br>

        <b>
          ${escape83BMobile(
            result.version
          )}
        </b>

        <br><br>


        Ready:
        <b>
          ${yesNo83BMobile(
            result.ready
          )}
        </b>

        <br>


        Reason:
        <br>

        <b
          style="
            overflow-wrap:anywhere;
          "
        >
          ${escape83BMobile(
            result.reason
          )}
        </b>

        <br><br>


        Selected Province:

        <b
          style="
            color:#ffbd3c;
          "
        >
          ${escape83BMobile(
            result.selectedProvince
          )}
        </b>

        <br>


        Production Province:

        <b>
          ${escape83BMobile(
            result.productionProvince
          )}
        </b>

      </div>


      <!-- ===============================================
           STEP 8.2C
           =============================================== -->

      <div
        style="
          margin-top:15px;
          padding:18px;
          border-radius:20px;
          background:rgba(42,57,111,.95);
          line-height:1.7;
        "
      >

        <div
          style="
            color:#ffbd3c;
            font-size:20px;
            font-weight:900;
            margin-bottom:13px;
          "
        >
          📦 REAL STEP 8.2C
        </div>


        Exists:
        <b>
          ${yesNo83BMobile(
            step82C.exists
          )}
        </b>

        <br>


        Type:

        <b>
          ${escape83BMobile(
            step82C.type
          )}
        </b>

        <br>


        Arrays Found:

        <b>
          ${escape83BMobile(
            step82C.arraysFound
          )}
        </b>

        <br><br>


        Top Level Keys:
        <br>

        <b
          style="
            overflow-wrap:anywhere;
          "
        >
          ${escape83BMobile(
            step82C.topLevelKeys
          )}
        </b>

      </div>


      <!-- ===============================================
           CANDIDATE ARRAY
           =============================================== -->

      <div
        style="
          margin-top:15px;
          padding:18px;
          border-radius:20px;
          border:2px solid ${
            candidateFound
              ? '#42d6a4'
              : '#ff6b7a'
          };
          background:rgba(31,68,89,.94);
          line-height:1.7;
        "
      >

        <div
          style="
            color:${
              candidateFound
                ? '#76efbd'
                : '#ff8994'
            };
            font-size:20px;
            font-weight:900;
            margin-bottom:13px;
          "
        >
          ${
            candidateFound
              ? '🟢 CANDIDATE ARRAY FOUND'
              : '🔴 CANDIDATE ARRAY NOT FOUND'
          }
        </div>


        Found:
        <b>
          ${yesNo83BMobile(
            candidateFound
          )}
        </b>

        <br>


        Candidate Count:

        <b
          style="
            color:#ffbd3c;
            font-size:19px;
          "
        >
          ${candidateCount}
        </b>

        <br><br>


        Candidate Array Path:
        <br>

        <b
          style="
            color:#ffffff;
            overflow-wrap:anywhere;
          "
        >
          ${escape83BMobile(
            detection.path
          )}
        </b>

        <br><br>


        Detection Score:

        <b>
          ${escape83BMobile(
            detection.score
          )}
        </b>

      </div>


      <!-- ===============================================
           CANDIDATE KEYS
           =============================================== -->

      <div
        style="
          margin-top:15px;
          padding:18px;
          border-radius:20px;
          background:rgba(63,46,102,.94);
          line-height:1.7;
        "
      >

        <div
          style="
            color:#d8b4fe;
            font-size:20px;
            font-weight:900;
            margin-bottom:13px;
          "
        >
          🔑 FIRST CANDIDATE
        </div>


        Candidate Keys:
        <br>

        <b
          style="
            overflow-wrap:anywhere;
          "
        >
          ${escape83BMobile(
            candidateKeys
          )}
        </b>

        <br><br>


        Direct province:
        <b>
          ${escape83BMobile(
            firstSample &&
            firstSample
              .provinceDirect
              ? firstSample
                  .provinceDirect
                  .province
              : null
          )}
        </b>

        <br>


        Direct provinceSlug:
        <b>
          ${escape83BMobile(
            firstSample &&
            firstSample
              .provinceDirect
              ? firstSample
                  .provinceDirect
                  .provinceSlug
              : null
          )}
        </b>

        <br>


        Direct slug:
        <b>
          ${escape83BMobile(
            firstSample &&
            firstSample
              .provinceDirect
              ? firstSample
                  .provinceDirect
                  .slug
              : null
          )}
        </b>

      </div>


      <!-- ===============================================
           PROVINCE
           =============================================== -->

      <div
        style="
          margin-top:15px;
          padding:18px;
          border-radius:20px;
          background:rgba(24,73,104,.95);
          line-height:1.7;
        "
      >

        <div
          style="
            color:#7dd3fc;
            font-size:20px;
            font-weight:900;
            margin-bottom:13px;
          "
        >
          🗺️ PROVINCE FIELD
        </div>


        Province Fields Found:

        <b>
          ${escape83BMobile(
            provinceInspection.fieldCount
          )}
        </b>

        <br>


        Selected Province Match:

        <b
          style="
            color:${
              selectedMatchCount > 0
                ? '#76efbd'
                : '#ff8994'
            };
          "
        >
          ${selectedMatchCount}
        </b>


        <div
          style="
            margin-top:14px;
            font-weight:900;
          "
        >
          First Province Field
        </div>

        ${renderField83BMobile(
          firstProvinceField
        )}


        <div
          style="
            margin-top:16px;
            font-weight:900;
          "
        >
          Selected Province Match Path
        </div>

        ${renderField83BMobile(
          firstSelectedMatch
        )}

      </div>


      <!-- ===============================================
           PRIZE
           =============================================== -->

      <div
        style="
          margin-top:15px;
          padding:18px;
          border-radius:20px;
          background:rgba(91,59,38,.94);
          line-height:1.7;
        "
      >

        <div
          style="
            color:#fdba74;
            font-size:20px;
            font-weight:900;
            margin-bottom:13px;
          "
        >
          🏆 PRIZE FIELD
        </div>


        Prize Fields Found:

        <b>
          ${escape83BMobile(
            prizeInspection.fieldCount
          )}
        </b>


        <div
          style="
            margin-top:14px;
            font-weight:900;
          "
        >
          First Prize Field
        </div>

        ${renderField83BMobile(
          firstPrizeField
        )}

      </div>


      <!-- ===============================================
           SAFETY
           =============================================== -->

      <div
        style="
          margin-top:15px;
          padding:18px;
          border-radius:20px;
          background:rgba(20,78,64,.92);
          line-height:1.7;
          font-weight:700;
        "
      >

        <div
          style="
            color:#a7f3d0;
            font-size:20px;
            font-weight:900;
            margin-bottom:13px;
          "
        >
          🔒 SAFETY
        </div>


        Diagnostic Only:
        ${yesNo83BMobile(
          result.safety &&
          result.safety
            .diagnosticOnly
        )}

        <br>


        Source Data Read Only:
        ${yesNo83BMobile(
          result.safety &&
          result.safety
            .sourceDataReadOnly
        )}

        <br>


        Production Write:
        ${safeNo83BMobile(
          result.safety &&
          result.safety
            .productionWrite
        )}

        <br>


        Storage Write:
        ${safeNo83BMobile(
          result.safety &&
          result.safety
            .storageWrite
        )}

        <br>


        Engine Executed:
        ${safeNo83BMobile(
          result.safety &&
          result.safety
            .engineExecuted
        )}

        <br>


        STEP 8.2C Modified:
        ${safeNo83BMobile(
          result.safety &&
          result.safety
            .step82CModified
        )}

        <br>


        STEP 8.3B Modified:
        ${safeNo83BMobile(
          result.safety &&
          result.safety
            .step83BModified
        )}

      </div>

    `;


    output.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });

  }


  /* =========================================================
     RUN INSPECTOR
     ========================================================= */

  function run83BMobileInspector() {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {

      return null;

    }


    const inspector =
      resolve83BInspectorMobile();


    if (!inspector.ready) {

      output.innerHTML = `

        <div
          style="
            margin-top:16px;
            padding:16px;
            border-radius:16px;
            border:2px solid #ff6b7a;
            color:#ff9ba5;
            line-height:1.6;
          "
        >

          ❌ SOURCE INSPECTOR V2 NOT AVAILABLE

          <br><br>

          Function:
          <br>

          <b>
            ${escape83BMobile(
              inspector.name
            )}
          </b>

        </div>

      `;


      return null;

    }


    try {

      const result =
        inspector.fn();


      render83BMobileResult(
        result
      );


      console.log(
        'FIX-03D5.9 83B Source Inspector Mobile V2',
        result
      );


      return result;

    } catch (error) {

      console.error(
        '83B Source Inspector Mobile V2:',
        error
      );


      output.innerHTML = `

        <div
          style="
            margin-top:16px;
            padding:16px;
            border-radius:16px;
            border:2px solid #ff6b7a;
            color:#ff9ba5;
            line-height:1.6;
            overflow-wrap:anywhere;
          "
        >

          ❌ SOURCE INSPECTOR ERROR

          <br><br>

          <b>
            ${escape83BMobile(
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

  function build83BMobileUI() {

    const settings =
      document.getElementById(
        'tab-settings'
      );


    if (!settings) {

      console.warn(
        '83B Source Mobile V2: tab-settings not found'
      );

      return;

    }


    /*
     * SELF-HEAL:
     * remove stale V1 panel before rebuilding.
     */

    const oldPanel =
      document.getElementById(
        PANEL_ID
      );


    if (oldPanel) {

      oldPanel.remove();

    }


    const inspector =
      resolve83BInspectorMobile();


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
      'background:linear-gradient(145deg,#242d67,#1b214b)',
      'border:1px solid rgba(255,193,61,.32)',
      'color:#ffffff',
      'box-sizing:border-box'
    ].join(';');


    panel.innerHTML = `

      <div
        style="
          font-size:22px;
          font-weight:900;
        "
      >
        🔬 8.3B SOURCE INSPECTOR V2
      </div>


      <div
        style="
          margin-top:9px;
          line-height:1.55;
          opacity:.8;
        "
      >

        Kiểm tra schema thật của STEP 8.2C
        trước khi sửa Source Shadow.

      </div>


      <div
        style="
          margin-top:14px;
          padding:13px;
          border-radius:14px;
          background:rgba(0,0,0,.16);
          line-height:1.65;
          overflow-wrap:anywhere;
        "
      >

        Mobile Version:
        <br>

        <b>
          ${VERSION}
        </b>

        <br><br>


        Inspector Script:

        <b
          style="
            color:${
              inspector.ready
                ? '#9ff0c8'
                : '#ff9b9b'
            };
          "
        >
          ${
            inspector.ready
              ? 'YES ✅'
              : 'NO ❌'
          }
        </b>

        <br>


        Function:
        <br>

        <b>
          ${escape83BMobile(
            inspector.name
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
          min-height:62px;
          margin-top:18px;
          padding:15px;
          border-radius:17px;
          background:
            linear-gradient(
              90deg,
              #ffc13d,
              #ff963d
            );
          color:#17182a;
          font-size:17px;
          font-weight:900;
          text-align:center;
          box-sizing:border-box;
          cursor:pointer;
          user-select:none;
        "
      >

        🔎 RUN 8.2C SCHEMA INSPECTOR

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
        run83BMobileInspector
      );


      control.addEventListener(
        'keydown',
        function (event) {

          if (
            event.key === 'Enter' ||
            event.key === ' '
          ) {

            event.preventDefault();

            run83BMobileInspector();

          }

        }
      );

    }


    console.log(
      '83B Source Inspector Mobile V2 panel built',
      {
        version:
          VERSION,

        inspectorReady:
          inspector.ready,

        control:
          Boolean(control)
      }
    );

  }


  /* =========================================================
     PUBLIC MOBILE API
     ========================================================= */

  window
    .run83BMobileInspector03D59 =
    run83BMobileInspector;


  window
    .rebuild83BMobileInspector03D59 =
    build83BMobileUI;


  window
    .FIX03D59_STEP83B_SOURCE_MOBILE_LOADED =
    true;


  window
    .FIX03D59_STEP83B_SOURCE_MOBILE_VERSION =
    VERSION;


  /* =========================================================
     INITIALIZE
     ========================================================= */

  function initialize83BMobile() {

    window.setTimeout(
      build83BMobileUI,
      700
    );

  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      initialize83BMobile,
      {
        once: true
      }
    );

  } else {

    initialize83BMobile();

  }


  console.log(
    '🔬 FIX-03D5.9 STEP 8.3B Source Inspector Mobile V2 / 8.2C SCHEMA / DIAGNOSTIC ONLY'
  );

})();
