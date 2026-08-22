/* =========================================================================
   FIX-03D5.9 STEP 8.3B
   RUNTIME SOURCE BRIDGE — MOBILE DIAGNOSTIC V2

   PURPOSE:
   - Inspect the runtime sources around STEP 8.3B.
   - Show diagnostic result directly inside Settings on mobile.
   - Determine which upstream RAM object contains usable province scope.

   IMPORTANT:
   - DIAGNOSTIC ONLY.
   - Does NOT modify STEP 8.3B result.
   - Does NOT modify LAST_FORECAST.
   - Does NOT modify candidates.
   - Does NOT execute forecast engines.
   - Does NOT call savePrediction().
   - Does NOT write storage or Production.

   READ ONLY
   ZERO WRITE
   FAIL CLOSED
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    '83B-RUNTIME-BRIDGE-MOBILE-V2';


  const PANEL_ID =
    'fix03d59-83b-runtime-bridge-panel';


  const OUTPUT_ID =
    'fix03d59-83b-runtime-bridge-output';


  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

  function escape83BRB(value) {

    return String(
      value === null ||
      value === undefined
        ? '--'
        : value
    )
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  }


  function normalizeProvince83BRB(
    value
  ) {

    if (
      typeof value !==
      'string'
    ) {

      return null;

    }


    const normalized =
      value
        .trim()
        .toLowerCase();


    if (
      !normalized ||
      normalized.length > 40
    ) {

      return null;

    }


    if (
      !/^[a-z0-9-]+$/.test(
        normalized
      )
    ) {

      return null;

    }


    return normalized;

  }


  function safeKeys83BRB(value) {

    try {

      if (
        value &&
        typeof value ===
          'object'
      ) {

        return Object.keys(
          value
        );

      }

    } catch (error) {

      return [];

    }


    return [];

  }


  /*
   * =========================================================
   * PROVINCE DISCOVERY
   * =========================================================
   */

  function collectProvinces83BRB(
    value,
    output,
    depth = 0,
    visited = new WeakSet()
  ) {

    if (
      depth > 10 ||
      value === null ||
      value === undefined
    ) {

      return;

    }


    if (
      typeof value !==
      'object'
    ) {

      return;

    }


    try {

      if (
        visited.has(value)
      ) {

        return;

      }


      visited.add(value);

    } catch (error) {

      return;

    }


    if (
      Array.isArray(value)
    ) {

      value.forEach(
        item => {

          collectProvinces83BRB(
            item,
            output,
            depth + 1,
            visited
          );

        }
      );


      return;

    }


    Object.keys(value)
      .forEach(
        key => {

          let child;


          try {

            child =
              value[key];

          } catch (error) {

            return;

          }


          /*
           * Only province / slug-like fields
           * are treated as province values.
           */

          if (
            /province|slug/i.test(key) &&
            typeof child ===
              'string'
          ) {

            const province =
              normalizeProvince83BRB(
                child
              );


            if (province) {

              output.add(
                province
              );

            }

          }


          if (
            child &&
            typeof child ===
              'object'
          ) {

            collectProvinces83BRB(
              child,
              output,
              depth + 1,
              visited
            );

          }

        }
      );

  }


  /*
   * =========================================================
   * SOURCE INSPECTOR
   * =========================================================
   */
  /*
   * =========================================================
   * B8 VERIFICATION PATH INSPECTOR
   * READ ONLY
   * =========================================================
   */

  function inspectB8VerificationPath83BRB() {

    const root =
      window.LAST_V26_B8_STARTUP_VERIFY ||
      null;


    const verification =
      root?.verification ||
      null;


    const guard =
      verification?.guard ||
      null;


    const lifecycle =
      guard?.lifecycle ||
      null;


    const verifiedDetails =
      lifecycle?.verifiedDetails ||
      null;


    function describe(
      name,
      value
    ) {

      return {

        name,

        exists:
          value !== null &&
          value !== undefined,

        type:
          value === null
            ? 'null'
            : Array.isArray(value)
              ? 'array'
              : typeof value,

        fields:
          safeKeys83BRB(value)
            .slice(0, 50),

        length:
          Array.isArray(value)
            ? value.length
            : null

      };

    }


    return {

      root:
        describe(
          'LAST_V26_B8_STARTUP_VERIFY',
          root
        ),

      verification:
        describe(
          'verification',
          verification
        ),

      guard:
        describe(
          'verification.guard',
          guard
        ),

      lifecycle:
        describe(
          'verification.guard.lifecycle',
          lifecycle
        ),

      verifiedDetails:
        describe(
          'verification.guard.lifecycle.verifiedDetails',
          verifiedDetails
        ),

      verifiedDetailsPreview:
        Array.isArray(
          verifiedDetails
        )
          ? verifiedDetails
              .slice(0, 12)
              .map(
                (item, index) => ({
                  index,
                  fields:
                    safeKeys83BRB(item)
                      .slice(0, 30),

                  province:
                    item?.province ??
                    null,

                  slug:
                    item?.slug ??
                    null
                })
              )
          : [],

      readOnly: true,
      writeAuthorized: false,
      storageWrite: false,
      productionWrite: false

    };

  }

   
  function inspectSource83BRB(
    name,
    value
  ) {

    const provinces =
      new Set();


    collectProvinces83BRB(
      value,
      provinces
    );


    const keys =
      safeKeys83BRB(
        value
      );


    return {

      name,

      exists:
        value !== undefined &&
        value !== null,

      type:
        value === null
          ? 'null'
          : Array.isArray(value)
            ? 'array'
            : typeof value,

      fieldCount:
        keys.length,

      fields:
        keys.slice(0, 40),

      provinceCount:
        provinces.size,

      provinces:
        Array.from(
          provinces
        ).sort()

    };

  }


  /*
   * =========================================================
   * MAIN READ-ONLY INSPECTION
   * =========================================================
   */

  function inspectRuntimeBridge83B() {

    const sourceDefinitions = [

      [
        'LAST_FIX03D59_STEP83B_RESULT',
        window
          .LAST_FIX03D59_STEP83B_RESULT
      ],

      [
        'LAST_FIX03D59_STEP82C_RESULT',
        window
          .LAST_FIX03D59_STEP82C_RESULT
      ],

      [
        'LAST_FIX03D59_STEP82A_RESULT',
        window
          .LAST_FIX03D59_STEP82A_RESULT
      ],

      [
        'LAST_V26_B8_STARTUP_VERIFY',
        window
          .LAST_V26_B8_STARTUP_VERIFY
      ],

      [
        'LAST_V26_B9_OBSERVER',
        window
          .LAST_V26_B9_OBSERVER
      ],

      [
        'LAST_V26_B9_SAFE_GATE',
        window
          .LAST_V26_B9_SAFE_GATE
      ],

      [
        'SHADOW_SNAPSHOTS_V26',
        window
          .SHADOW_SNAPSHOTS_V26
      ],

      [
        'LAST_SHADOW_SNAPSHOTS_V26',
        window
          .LAST_SHADOW_SNAPSHOTS_V26
      ]

    ];


    const sources =
      sourceDefinitions.map(
        item =>
          inspectSource83BRB(
            item[0],
            item[1]
          )
      );


    const result = {

      ready: true,
      passed: true,

      step:
        '8.3B-RUNTIME-BRIDGE',

      version:
        VERSION,

      reason:
        'RUNTIME_SOURCE_DIAGNOSTIC_READY',

      sources,

      /*
       * SAFETY CONTRACT
       */

      readOnly: true,

      writeAuthorized: false,

      productionWrite: false,

      storageWrite: false,

      engineExecuted: false,

      savePredictionCalled: false,

      step83BModified: false,

      forecastModified: false,

      candidatesModified: false

    };


    /*
     * Publish diagnostic result only.
     *
     * This is a NEW RAM alias.
     * It does NOT overwrite STEP 8.3B.
     */

    window
      .LAST_FIX03D59_STEP83B_RUNTIME_BRIDGE =
      result;


    return result;

  }


  /*
   * =========================================================
   * MOBILE RENDER
   * =========================================================
   */

  function render83BRB() {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {

      return;

    }


    let result;


    try {

      result =
        inspectRuntimeBridge83B();

    } catch (error) {

      output.innerHTML = `
        <div
          style="
            padding:14px;
            border-radius:14px;
            background:rgba(255,70,70,.12);
          "
        >
          ❌ Inspector error:
          <b>
            ${escape83BRB(
              error?.message ||
              error
            )}
          </b>
        </div>
      `;

      return;

    }


    let html = `

      <div
        style="
          padding:12px;
          margin-bottom:14px;
          border-radius:14px;
          background:rgba(45,200,120,.10);
          line-height:1.6;
          font-size:13px;
        "
      >

        <b>
          ${escape83BRB(
            result.version
          )}
        </b>

        <br>

        🔒 READ ONLY · ZERO WRITE

      </div>

    `;


    result.sources
      .forEach(
        (source, index) => {

          const hasProvince =
            source.provinceCount > 0;


          html += `

            <div
              style="
                margin-top:12px;
                padding:14px;
                border-radius:15px;
                background:${
                  hasProvince
                    ? 'rgba(45,200,120,.10)'
                    : 'rgba(255,255,255,.055)'
                };
                border:1px solid ${
                  hasProvince
                    ? 'rgba(45,200,120,.24)'
                    : 'rgba(255,255,255,.08)'
                };
              "
            >

              <div
                style="
                  font-size:14px;
                  font-weight:900;
                  margin-bottom:10px;
                  word-break:break-word;
                "
              >
                ${index + 1}.
                ${escape83BRB(
                  source.name
                )}
              </div>


              <div
                style="
                  line-height:1.65;
                  font-size:13px;
                "
              >

                Exists:
                <b>
                  ${
                    source.exists
                      ? 'YES ✅'
                      : 'NO ❌'
                  }
                </b>

                <br>

                Type:
                <b>
                  ${escape83BRB(
                    source.type
                  )}
                </b>

                <br>

                Field Count:
                <b>
                  ${source.fieldCount}
                </b>

                <br>

                Province Count:
                <b>
                  ${source.provinceCount}
                </b>

                <br>

                Provinces:
                <b>
                  ${
                    source.provinces.length
                      ? escape83BRB(
                          source
                            .provinces
                            .join(', ')
                        )
                      : '--'
                  }
                </b>

              </div>


              <details
                style="
                  margin-top:10px;
                  font-size:12px;
                  opacity:.8;
                "
              >

                <summary>
                  Fields
                </summary>

                <div
                  style="
                    margin-top:7px;
                    word-break:break-word;
                  "
                >
                  ${
                    source.fields.length
                      ? escape83BRB(
                          source
                            .fields
                            .join(', ')
                        )
                      : '--'
                  }
                </div>

              </details>

            </div>

          `;

        }
      );

    /*
     * =========================================================
     * B8 VERIFICATION PATH OUTPUT
     * =========================================================
     */

    const b8Path =
      inspectB8VerificationPath83BRB();


    html += `

      <div
        style="
          margin-top:18px;
          padding:16px;
          border-radius:16px;
          background:rgba(255,189,60,.08);
          border:1px solid rgba(255,189,60,.25);
        "
      >

        <div
          style="
            font-size:16px;
            font-weight:900;
            margin-bottom:12px;
          "
        >
          🧬 B8 VERIFICATION PATH
        </div>

    `;


    [
      b8Path.root,
      b8Path.verification,
      b8Path.guard,
      b8Path.lifecycle,
      b8Path.verifiedDetails
    ]
      .forEach(
        item => {

          html += `

            <div
              style="
                padding:11px 0;
                border-bottom:
                  1px solid rgba(255,255,255,.08);
                font-size:12px;
                line-height:1.6;
                word-break:break-word;
              "
            >

              <b>
                ${escape83BRB(
                  item.name
                )}
              </b>

              <br>

              Exists:
              <b>
                ${
                  item.exists
                    ? 'YES ✅'
                    : 'NO ❌'
                }
              </b>

              <br>

              Type:
              <b>
                ${escape83BRB(
                  item.type
                )}
              </b>

              ${
                item.length !== null
                  ? `
                    <br>
                    Length:
                    <b>${item.length}</b>
                  `
                  : ''
              }

              <br>

              Fields:
              <b>
                ${
                  item.fields.length
                    ? escape83BRB(
                        item.fields.join(', ')
                      )
                    : '--'
                }
              </b>

            </div>

          `;

        }
      );


    html += `

        <div
          style="
            margin-top:14px;
            font-size:13px;
            font-weight:900;
          "
        >
          🔬 verifiedDetails preview
        </div>

    `;


    b8Path
      .verifiedDetailsPreview
      .forEach(
        item => {

          html += `

            <div
              style="
                margin-top:8px;
                padding:10px;
                border-radius:10px;
                background:rgba(255,255,255,.05);
                font-size:12px;
                line-height:1.55;
                word-break:break-word;
              "
            >

              #${item.index}

              <br>

              Province:
              <b>
                ${escape83BRB(
                  item.province
                )}
              </b>

              <br>

              Slug:
              <b>
                ${escape83BRB(
                  item.slug
                )}
              </b>

              <br>

              Fields:
              ${
                item.fields.length
                  ? escape83BRB(
                      item.fields.join(', ')
                    )
                  : '--'
              }

            </div>

          `;

        }
      );


    html += `

      </div>

    `;
     
    html += `

      <div
        style="
          margin-top:16px;
          padding:13px;
          border-radius:14px;
          background:rgba(255,189,60,.08);
          border:1px dashed rgba(255,189,60,.30);
          font-size:12px;
          line-height:1.55;
        "
      >

        Diagnostic only.

        <br>

        Không sửa STEP 8.3B,
        LAST_FORECAST,
        candidates hoặc storage.

      </div>

    `;


    output.innerHTML =
      html;

  }


  /*
   * =========================================================
   * MOBILE PANEL
   * =========================================================
   */

  function build83BRBPanel() {

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
        '83B Runtime Bridge: tab-settings not found'
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
      'margin:18px 0 30px',
      'padding:18px',
      'border-radius:20px',
      'background:#20264f',
      'border:1px solid rgba(135,145,255,.25)',
      'color:#fff',
      'box-sizing:border-box'
    ].join(';');


    panel.innerHTML = `

      <div
        style="
          font-size:20px;
          font-weight:900;
          margin-bottom:7px;
        "
      >
        🌉 STEP 8.3B — Runtime Bridge
      </div>


      <div
        style="
          opacity:.7;
          font-size:13px;
          line-height:1.5;
        "
      >

        Xác định nguồn RAM thực tế
        trước boundary 8.3B.

        <br>

        READ ONLY · ZERO WRITE

      </div>


      <div
        id="fix03d59-83b-runtime-bridge-control"
        role="button"
        tabindex="0"
        style="
          display:flex;
          width:100%;
          min-height:56px;
          margin-top:16px;
          padding:14px;
          border-radius:15px;
          background:
            linear-gradient(
              90deg,
              #ffc13d,
              #ff963d
            );
          color:#17182a;
          font-size:15px;
          font-weight:900;
          align-items:center;
          justify-content:center;
          text-align:center;
          box-sizing:border-box;
          cursor:pointer;
          position:relative;
          z-index:100;
        "
      >

        🔍 INSPECT 8.3B RUNTIME SOURCES

      </div>


      <div
        id="${OUTPUT_ID}"
        style="
          margin-top:16px;
        "
      ></div>

    `;


    settings.appendChild(
      panel
    );


    const control =
      document.getElementById(
        'fix03d59-83b-runtime-bridge-control'
      );


    if (control) {

      control.addEventListener(
        'click',
        render83BRB
      );


      control.addEventListener(
        'keydown',
        function (event) {

          if (
            event.key === 'Enter' ||
            event.key === ' '
          ) {

            event.preventDefault();

            render83BRB();

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

  window.inspectRuntimeBridge83B =
    inspectRuntimeBridge83B;


  window.renderRuntimeBridge83B =
    render83BRB;


  window.rebuildRuntimeBridgeUI83B =
    build83BRBPanel;


  window
    .FIX03D59_STEP83B_RUNTIME_BRIDGE_LOADED =
    true;


  /*
   * =========================================================
   * INIT
   * =========================================================
   */

  function init83BRB() {

    window.setTimeout(
      build83BRBPanel,
      350
    );

  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      init83BRB,
      {
        once: true
      }
    );

  } else {

    init83BRB();

  }


  console.log(
    'FIX-03D5.9 STEP 8.3B Runtime Bridge Mobile V2 loaded — READ ONLY / ZERO WRITE'
  );

})();
