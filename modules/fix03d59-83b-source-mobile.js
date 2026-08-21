/* =========================================================================
   FIX-03D5.9 — STEP 8.3B SOURCE INSPECTOR MOBILE UI
   FILE:
   modules/fix03d59-83b-source-mobile.js

   PURPOSE:
   - Confirm STEP 8.3B Source Inspector is loaded.
   - Run inspector from mobile without DevTools.
   - Display inspector result inside Settings tab.

   IMPORTANT:
   - READ ONLY.
   - ZERO WRITE.
   - NO ENGINE EXECUTION.
   - Does NOT modify LAST_FORECAST.
   - Does NOT modify STEP 8.3B.
   - Does NOT modify candidates.
   - Does NOT call savePrediction().
   ========================================================================= */

(function () {

  'use strict';


  const PANEL_ID =
    'fix03d59-83b-source-mobile-panel';

  const OUTPUT_ID =
    'fix03d59-83b-source-mobile-output';


  /* =========================================================
     HELPERS
     ========================================================= */

  function safeText83BMobile(value) {

    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {

      return '--';

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


  function escape83BMobile(value) {

    return safeText83BMobile(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  }


  /* =========================================================
     FIND INSPECTOR FUNCTION
     ========================================================= */

  function resolve83BInspector() {

    /*
     * Try known public APIs first.
     */

    const names = [

      'runFix03D59Step83BSourceInspector',

      'runStep83BSourceTrace03D59',

      'inspectStep83BSource03D59'

    ];


    for (
      const name
      of names
    ) {

      try {

        if (
          typeof window[name] ===
          'function'
        ) {

          return {

            ready: true,

            name,

            fn:
              window[name]

          };

        }

      } catch (error) {

        // READ ONLY
      }

    }


    return {

      ready: false,

      name: null,

      fn: null

    };

  }


  /* =========================================================
     RENDER RESULT
     ========================================================= */

  function render83BMobileResult(
    result,
    inspectorName
  ) {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {

      return;

    }


    let html = `

      <div
        style="
          margin-top:16px;
          padding:15px;
          border-radius:16px;
          background:rgba(0,0,0,.18);
          line-height:1.6;
        "
      >

        <div
          style="
            color:#ffbd3c;
            font-size:16px;
            font-weight:900;
          "
        >
          🔬 8.3B SOURCE INSPECTOR RESULT
        </div>

        <div style="margin-top:9px;">
          Function:
          <b>
            ${escape83BMobile(
              inspectorName
            )}
          </b>
        </div>

    `;


    if (
      result === undefined
    ) {

      html += `

        <div style="margin-top:8px;">
          Result:
          <b>
            Function executed.
          </b>
        </div>

        <div
          style="
            margin-top:8px;
            opacity:.72;
          "
        >
          Inspector không trả trực tiếp object.
          Kiểm tra panel 8.3B Source Inspector
          phía trên hoặc phía dưới trang.
        </div>

      `;

    } else {

      html += `

        <div
          style="
            margin-top:12px;
            color:#ffbd3c;
            font-weight:800;
          "
        >
          RAW READ-ONLY RESULT
        </div>

        <pre
          style="
            margin-top:8px;
            padding:12px;
            border-radius:12px;
            background:rgba(255,255,255,.055);
            white-space:pre-wrap;
            word-break:break-word;
            overflow-wrap:anywhere;
            font-size:12px;
            line-height:1.55;
            color:#ffffff;
          "
        >${escape83BMobile(
          result
        )}</pre>

      `;

    }


    html += `

      </div>

      <div
        style="
          margin-top:14px;
          padding:13px;
          border-radius:14px;
          background:rgba(52,211,153,.12);
          color:#dffff0;
          font-weight:900;
          line-height:1.55;
        "
      >
        🔒 READ ONLY · ZERO WRITE
        <br>
        NO ENGINE EXECUTION
      </div>

    `;


    output.innerHTML =
      html;

  }


  /* =========================================================
     RUN
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
      resolve83BInspector();


    if (
      !inspector.ready
    ) {

      output.innerHTML = `

        <div
          style="
            margin-top:14px;
            padding:14px;
            border-radius:14px;
            background:rgba(248,113,113,.15);
            line-height:1.6;
          "
        >
          ❌ 8.3B SOURCE INSPECTOR NOT FOUND
          <br><br>
          Mobile UI đã chạy nhưng chưa tìm thấy
          public inspector function.
        </div>

      `;


      return null;

    }


    try {

      const result =
        inspector.fn();


      render83BMobileResult(
        result,
        inspector.name
      );


      return result;

    } catch (error) {

      output.innerHTML = `

        <div
          style="
            margin-top:14px;
            padding:14px;
            border-radius:14px;
            background:rgba(248,113,113,.15);
            line-height:1.6;
            word-break:break-word;
          "
        >
          ❌ 8.3B INSPECTOR ERROR
          <br><br>
          ${escape83BMobile(
            error &&
            error.message
              ? error.message
              : String(error)
          )}
        </div>

      `;


      return null;

    }

  }


  /* =========================================================
     BUILD MOBILE PANEL
     ========================================================= */

  function build83BMobileUI() {

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

      return;

    }


    const inspector =
      resolve83BInspector();


    const panel =
      document.createElement('div');


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
          font-size:20px;
          font-weight:900;
        "
      >
        🔬 8.3B SOURCE INSPECTOR
      </div>


      <div
        style="
          margin-top:9px;
          line-height:1.55;
          opacity:.78;
        "
      >
        Mobile diagnostic để truy nguồn
        các province test cũ trước khi
        thay đổi Production pipeline.
      </div>


      <div
        style="
          margin-top:14px;
          padding:12px;
          border-radius:13px;
          background:rgba(0,0,0,.16);
          line-height:1.6;
        "
      >

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

        <b>
          ${
            escape83BMobile(
              inspector.name
            )
          }
        </b>

      </div>


      <div
        id="fix03d59-83b-source-mobile-control"
        role="button"
        tabindex="0"
        style="
          display:flex;
          align-items:center;
          justify-content:center;
          width:100%;
          min-height:60px;
          margin-top:18px;
          padding:15px;
          border-radius:16px;
          background:linear-gradient(90deg,#ffc13d,#ff963d);
          color:#17182a;
          font-size:16px;
          font-weight:900;
          text-align:center;
          box-sizing:border-box;
          cursor:pointer;
          user-select:none;
        "
      >
        🔎 RUN 8.3B SOURCE INSPECTOR
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
        'fix03d59-83b-source-mobile-control'
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

  }


  /* =========================================================
     PUBLIC MOBILE API
     ========================================================= */

  window.run83BMobileInspector03D59 =
    run83BMobileInspector;


  window.rebuild83BMobileInspector03D59 =
    build83BMobileUI;


  window.FIX03D59_STEP83B_SOURCE_MOBILE_LOADED =
    true;


  /* =========================================================
     INITIALIZE
     ========================================================= */

  function initialize83BMobile() {

    /*
     * Small delay gives the source-inspector
     * script time to expose its public API.
     */

    window.setTimeout(
      build83BMobileUI,
      500
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
    'FIX-03D5.9 STEP 8.3B Source Inspector Mobile loaded / READ ONLY / ZERO WRITE'
  );

})();

