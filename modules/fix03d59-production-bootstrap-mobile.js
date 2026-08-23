/* =========================================================================
   FIX-03D5.9
   PRODUCTION BOOTSTRAP — MOBILE V5
   GEOMETRY TRUTH PROBE

   PURPOSE:
   - Determine why visible Bootstrap DOM was reported as 0 x 0.
   - Compare multiple browser geometry APIs.
   - Inspect real ancestor geometry.
   - Inspect the actual painted element at screen coordinates.
   - Compare direct references with document lookup.

   IMPORTANT:
   READ ONLY
   ZERO WRITE
   ZERO PROMOTION
   ZERO PRODUCTION EXECUTION
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_PRODUCTION_BOOTSTRAP_MOBILE_V5';


  const PANEL_ID =
    'fix03d59-production-bootstrap-panel';

  const CARD_ID =
    'fix03d59-production-bootstrap-card';

  const WRAPPER_ID =
    'fix03d59-production-bootstrap-button-wrapper';

  const BUTTON_ID =
    'fix03d59-production-bootstrap-run';

  const STATUS_ID =
    'fix03d59-production-bootstrap-status';

  const RESULT_ID =
    'fix03d59-production-bootstrap-result';

  const DIAGNOSTIC_ID =
    'fix03d59-production-bootstrap-diagnostic';


  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

  function escapeHtml(
    value
  ) {

    return String(
      value == null
        ? ''
        : value
    )
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  }


  function yesNo(
    value
  ) {

    return value
      ? 'YES ✅'
      : 'NO ❌';

  }


  function round(
    value
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

      return 0;

    }


    return Math.round(
      number
    );

  }


  /*
   * =========================================================
   * GEOMETRY READER
   * =========================================================
   */

  function inspectGeometry(
    element
  ) {

    if (!element) {

      return {
        exists: false
      };

    }


    const rect =
      element.getBoundingClientRect();


    const rects =
      Array.from(
        element.getClientRects()
      );


    const style =
      window.getComputedStyle(
        element
      );


    return {

      exists:
        true,

      connected:
        element.isConnected === true,

      tag:
        element.tagName || '--',

      id:
        element.id || '--',

      className:
        typeof element.className ===
          'string'
          ? element.className
          : '--',

      boundingWidth:
        round(
          rect.width
        ),

      boundingHeight:
        round(
          rect.height
        ),

      boundingTop:
        round(
          rect.top
        ),

      boundingLeft:
        round(
          rect.left
        ),

      offsetWidth:
        round(
          element.offsetWidth
        ),

      offsetHeight:
        round(
          element.offsetHeight
        ),

      clientWidth:
        round(
          element.clientWidth
        ),

      clientHeight:
        round(
          element.clientHeight
        ),

      scrollWidth:
        round(
          element.scrollWidth
        ),

      scrollHeight:
        round(
          element.scrollHeight
        ),

      clientRectCount:
        rects.length,

      firstClientRect:
        rects.length
          ? {
              width:
                round(
                  rects[0].width
                ),

              height:
                round(
                  rects[0].height
                ),

              top:
                round(
                  rects[0].top
                ),

              left:
                round(
                  rects[0].left
                )
            }
          : null,

      display:
        style.display,

      visibility:
        style.visibility,

      position:
        style.position,

      opacity:
        style.opacity,

      widthCSS:
        style.width,

      heightCSS:
        style.height,

      overflow:
        style.overflow,

      transform:
        style.transform,

      contain:
        style.contain,

      contentVisibility:
        style.contentVisibility ||

        '--'

    };

  }


  /*
   * =========================================================
   * GEOMETRY HTML
   * =========================================================
   */

  function geometryHtml(
    title,
    geometry
  ) {

    if (
      !geometry ||
      !geometry.exists
    ) {

      return `

        <div class="pb-v5-block">

          <div class="pb-v5-block-title">
            ${escapeHtml(title)}
          </div>

          <div class="pb-v5-fail">
            DOM: NO ❌
          </div>

        </div>

      `;

    }


    return `

      <div class="pb-v5-block">

        <div class="pb-v5-block-title">
          ${escapeHtml(title)}
        </div>


        <div>
          DOM:
          <b class="pb-v5-ok">
            YES ✅
          </b>

          · Connected:
          <b>
            ${yesNo(
              geometry.connected
            )}
          </b>
        </div>


        <div>
          Tag:
          <b>
            ${escapeHtml(
              geometry.tag
            )}
          </b>
        </div>


        <div>
          Bounding:
          <b class="${
            geometry.boundingWidth > 0 &&
            geometry.boundingHeight > 0
              ? 'pb-v5-ok'
              : 'pb-v5-fail'
          }">

            ${geometry.boundingWidth}
            ×
            ${geometry.boundingHeight}px

          </b>
        </div>


        <div>
          Position:
          <b>
            ${geometry.boundingLeft},
            ${geometry.boundingTop}
          </b>
        </div>


        <div>
          offset:
          <b>
            ${geometry.offsetWidth}
            ×
            ${geometry.offsetHeight}
          </b>
        </div>


        <div>
          client:
          <b>
            ${geometry.clientWidth}
            ×
            ${geometry.clientHeight}
          </b>
        </div>


        <div>
          scroll:
          <b>
            ${geometry.scrollWidth}
            ×
            ${geometry.scrollHeight}
          </b>
        </div>


        <div>
          getClientRects():
          <b>
            ${geometry.clientRectCount}
          </b>
        </div>


        <div>
          CSS:
          <b>
            ${escapeHtml(
              geometry.display
            )}
          </b>

          ·

          <b>
            ${escapeHtml(
              geometry.visibility
            )}
          </b>

          · opacity

          <b>
            ${escapeHtml(
              geometry.opacity
            )}
          </b>
        </div>


        <div>
          CSS width:
          <b>
            ${escapeHtml(
              geometry.widthCSS
            )}
          </b>

          · height:

          <b>
            ${escapeHtml(
              geometry.heightCSS
            )}
          </b>
        </div>


        <div>
          position:
          <b>
            ${escapeHtml(
              geometry.position
            )}
          </b>

          · overflow:

          <b>
            ${escapeHtml(
              geometry.overflow
            )}
          </b>
        </div>


        <div>
          transform:
          <b>
            ${escapeHtml(
              geometry.transform
            )}
          </b>
        </div>


        <div>
          contain:
          <b>
            ${escapeHtml(
              geometry.contain
            )}
          </b>
        </div>


        <div>
          content-visibility:
          <b>
            ${escapeHtml(
              geometry.contentVisibility
            )}
          </b>
        </div>

      </div>

    `;

  }


  /*
   * =========================================================
   * ANCESTOR CHAIN
   * =========================================================
   */

  function inspectAncestors(
    element
  ) {

    const rows =
      [];


    let current =
      element;


    let level =
      0;


    while (
      current &&
      level < 10
    ) {

      const geometry =
        inspectGeometry(
          current
        );


      rows.push({

        level:
          level,

        tag:
          current.tagName ||
          '--',

        id:
          current.id ||
          '--',

        width:
          geometry.boundingWidth ||
          0,

        height:
          geometry.boundingHeight ||
          0,

        display:
          geometry.display ||
          '--',

        position:
          geometry.position ||
          '--'

      });


      current =
        current.parentElement;


      level += 1;

    }


    return rows;

  }


  function ancestorsHtml(
    rows
  ) {

    return rows
      .map(
        function (
          row
        ) {

          return `

            <div class="pb-v5-ancestor">

              <b>
                #${row.level}
              </b>

              ${escapeHtml(
                row.tag
              )}

              ${
                row.id !== '--'
                  ? '#' +
                    escapeHtml(
                      row.id
                    )
                  : ''
              }

              <br>

              Size:
              <b class="${
                row.width > 0 &&
                row.height > 0
                  ? 'pb-v5-ok'
                  : 'pb-v5-fail'
              }">

                ${row.width}
                ×
                ${row.height}

              </b>

              ·

              ${escapeHtml(
                row.display
              )}

              ·

              ${escapeHtml(
                row.position
              )}

            </div>

          `;

        }
      )
      .join('');

  }


  /*
   * =========================================================
   * PAINTED ELEMENT PROBE
   * =========================================================
   */

  function inspectPaintedElement() {

    const viewportWidth =
      window.innerWidth ||
      document.documentElement
        .clientWidth ||
      0;


    const viewportHeight =
      window.innerHeight ||
      document.documentElement
        .clientHeight ||
      0;


    /*
     * Probe several safe points in the visible content area.
     */

    const points = [

      {
        x:
          Math.round(
            viewportWidth * 0.5
          ),

        y:
          Math.round(
            viewportHeight * 0.35
          )
      },

      {
        x:
          Math.round(
            viewportWidth * 0.5
          ),

        y:
          Math.round(
            viewportHeight * 0.50
          )
      },

      {
        x:
          Math.round(
            viewportWidth * 0.5
          ),

        y:
          Math.round(
            viewportHeight * 0.65
          )
      }

    ];


    return points.map(
      function (
        point
      ) {

        const element =
          document.elementFromPoint(
            point.x,
            point.y
          );


        return {

          x:
            point.x,

          y:
            point.y,

          tag:
            element
              ? element.tagName
              : '--',

          id:
            element &&
            element.id
              ? element.id
              : '--',

          className:
            element &&
            typeof
              element.className ===
              'string'
              ? element.className
              : '--',

          geometry:
            inspectGeometry(
              element
            )

        };

      }
    );

  }


  function paintedHtml(
    probes
  ) {

    return probes
      .map(
        function (
          probe
        ) {

          return `

            <div class="pb-v5-probe">

              Point:
              <b>
                ${probe.x},
                ${probe.y}
              </b>

              <br>

              Element:
              <b>
                ${escapeHtml(
                  probe.tag
                )}

                ${
                  probe.id !== '--'
                    ? '#' +
                      escapeHtml(
                        probe.id
                      )
                    : ''
                }
              </b>

              <br>

              Size:
              <b>
                ${
                  probe.geometry &&
                  probe.geometry.exists
                    ? probe.geometry
                        .boundingWidth +
                      ' × ' +
                      probe.geometry
                        .boundingHeight
                    : '--'
                }
              </b>

            </div>

          `;

        }
      )
      .join('');

  }


  /*
   * =========================================================
   * STYLES
   * =========================================================
   */

  function installStyles() {

    const old =
      document.getElementById(
        'fix03d59-production-bootstrap-style'
      );


    if (old) {

      old.remove();

    }


    const style =
      document.createElement(
        'style'
      );


    style.id =
      'fix03d59-production-bootstrap-style';


    style.textContent = `

      #${PANEL_ID} {
        display: block;
        position: relative;
        width: auto;
        margin: 24px;
        padding: 0;
        color: white;
      }


      #${CARD_ID} {
        display: block;
        position: relative;
        width: auto;
        min-height: 1px;

        padding: 22px;

        border-radius: 24px;

        background:
          linear-gradient(
            145deg,
            rgba(30,43,93,.98),
            rgba(23,34,77,.98)
          );

        border:
          1px solid
          rgba(129,140,248,.34);
      }


      #${PANEL_ID} .pb-v5-title {
        font-size: 26px;
        font-weight: 900;
        line-height: 1.35;
      }


      #${PANEL_ID} .pb-v5-sub {
        margin-top: 18px;

        color:
          rgba(255,255,255,.68);

        font-size: 16px;

        line-height: 1.65;
      }


      #${PANEL_ID} .pb-v5-safety {
        margin-top: 20px;

        color: #72e6ae;

        font-size: 17px;

        font-weight: 900;
      }


      #${WRAPPER_ID} {
        display: block;
        position: relative;
        width: 100%;
        min-height: 64px;
        margin-top: 22px;
      }


      #${BUTTON_ID} {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;

        position: relative !important;

        box-sizing: border-box !important;

        width: 100% !important;
        min-width: 100% !important;

        height: 64px !important;
        min-height: 64px !important;

        padding: 0 14px !important;
        margin: 0 !important;

        border: 0 !important;

        border-radius: 18px !important;

        background:
          linear-gradient(
            90deg,
            #ffbd3c,
            #ff913d
          ) !important;

        color: #17182a !important;

        font-size: 17px !important;
        font-weight: 900 !important;

        pointer-events: auto !important;

        z-index: 10 !important;
      }


      #${STATUS_ID} {
        margin-top: 20px;

        color:
          rgba(255,255,255,.72);

        font-size: 16px;

        line-height: 1.5;
      }


      #${DIAGNOSTIC_ID} {
        margin-top: 18px;

        padding: 16px;

        border-radius: 18px;

        background:
          rgba(59,130,246,.08);

        border:
          1px solid
          rgba(96,165,250,.30);

        line-height: 1.65;

        overflow-wrap: anywhere;
      }


      #${PANEL_ID} .pb-v5-diagnostic-title {
        font-size: 18px;
        font-weight: 900;
        margin-bottom: 12px;
      }


      #${PANEL_ID} .pb-v5-block {
        padding: 14px 0;

        border-bottom:
          1px solid
          rgba(255,255,255,.10);
      }


      #${PANEL_ID} .pb-v5-block-title {
        font-weight: 900;
        margin-bottom: 8px;
        color: #fff;
      }


      #${PANEL_ID} .pb-v5-ok {
        color: #72e6ae;
      }


      #${PANEL_ID} .pb-v5-fail {
        color: #ff7185;
      }


      #${PANEL_ID} .pb-v5-section-title {
        margin-top: 20px;
        margin-bottom: 8px;

        color: #ffbd3c;

        font-size: 17px;

        font-weight: 900;
      }


      #${PANEL_ID} .pb-v5-ancestor,
      #${PANEL_ID} .pb-v5-probe {
        padding: 9px 0;

        border-bottom:
          1px dashed
          rgba(255,255,255,.08);
      }


      #${PANEL_ID} .pb-v5-conclusion {
        margin-top: 20px;

        padding: 15px;

        border-radius: 15px;

        background:
          rgba(255,189,60,.08);

        border:
          1px solid
          rgba(255,189,60,.30);

        color: #ffbd3c;

        font-weight: 900;
      }


      #${RESULT_ID} {
        margin-top: 16px;
      }

    `;


    document.head.appendChild(
      style
    );

  }


  /*
   * =========================================================
   * RUN GEOMETRY TRUTH PROBE
   * =========================================================
   */

  function runGeometryProbe(
    refs
  ) {

    const diagnostic =
      refs.diagnostic;


    if (!diagnostic) {

      return;

    }


    const lookupPanel =
      document.getElementById(
        PANEL_ID
      );


    const lookupCard =
      document.getElementById(
        CARD_ID
      );


    const lookupWrapper =
      document.getElementById(
        WRAPPER_ID
      );


    const lookupButton =
      document.getElementById(
        BUTTON_ID
      );


    const panelGeometry =
      inspectGeometry(
        refs.panel
      );


    const cardGeometry =
      inspectGeometry(
        refs.card
      );


    const wrapperGeometry =
      inspectGeometry(
        refs.wrapper
      );


    const buttonGeometry =
      inspectGeometry(
        refs.button
      );


    const ancestors =
      inspectAncestors(
        refs.button
      );


    const painted =
      inspectPaintedElement();


    const sameReferences = {

      panel:
        refs.panel ===
        lookupPanel,

      card:
        refs.card ===
        lookupCard,

      wrapper:
        refs.wrapper ===
        lookupWrapper,

      button:
        refs.button ===
        lookupButton

    };


    let conclusion =
      'GEOMETRY RESULT REQUIRES REVIEW';


    if (
      buttonGeometry.boundingWidth > 0 &&
      buttonGeometry.boundingHeight > 0
    ) {

      conclusion =
        'BUTTON HAS REAL GEOMETRY ✅';

    } else if (
      buttonGeometry.offsetWidth > 0 ||
      buttonGeometry.clientWidth > 0 ||
      buttonGeometry.clientRectCount > 0
    ) {

      conclusion =
        'BOUNDING RECT DISAGREES WITH OTHER GEOMETRY APIs';

    } else if (
      cardGeometry.boundingWidth > 0 &&
      cardGeometry.boundingHeight > 0
    ) {

      conclusion =
        'CARD HAS GEOMETRY BUT BUTTON BRANCH COLLAPSES';

    } else {

      conclusion =
        'DIRECT BRANCH STILL REPORTS ZERO GEOMETRY';

    }


    diagnostic.innerHTML = `

      <div class="pb-v5-diagnostic-title">
        🧪 MOBILE V5 GEOMETRY TRUTH PROBE
      </div>


      <div class="pb-v5-section-title">
        DIRECT REFERENCES
      </div>


      ${geometryHtml(
        'BUTTON',
        buttonGeometry
      )}


      ${geometryHtml(
        'BUTTON WRAPPER',
        wrapperGeometry
      )}


      ${geometryHtml(
        'CARD',
        cardGeometry
      )}


      ${geometryHtml(
        'PANEL',
        panelGeometry
      )}


      <div class="pb-v5-section-title">
        DIRECT REF = DOCUMENT LOOKUP
      </div>


      <div>
        PANEL:
        <b class="${
          sameReferences.panel
            ? 'pb-v5-ok'
            : 'pb-v5-fail'
        }">
          ${yesNo(
            sameReferences.panel
          )}
        </b>
      </div>


      <div>
        CARD:
        <b class="${
          sameReferences.card
            ? 'pb-v5-ok'
            : 'pb-v5-fail'
        }">
          ${yesNo(
            sameReferences.card
          )}
        </b>
      </div>


      <div>
        WRAPPER:
        <b class="${
          sameReferences.wrapper
            ? 'pb-v5-ok'
            : 'pb-v5-fail'
        }">
          ${yesNo(
            sameReferences.wrapper
          )}
        </b>
      </div>


      <div>
        BUTTON:
        <b class="${
          sameReferences.button
            ? 'pb-v5-ok'
            : 'pb-v5-fail'
        }">
          ${yesNo(
            sameReferences.button
          )}
        </b>
      </div>


      <div class="pb-v5-section-title">
        BUTTON ANCESTOR CHAIN
      </div>


      ${ancestorsHtml(
        ancestors
      )}


      <div class="pb-v5-section-title">
        ACTUAL PAINTED ELEMENTS
      </div>


      ${paintedHtml(
        painted
      )}


      <div class="pb-v5-conclusion">
        V5 CONCLUSION
        <br>
        ${escapeHtml(
          conclusion
        )}
      </div>

    `;


    window
      .LAST_FIX03D59_PRODUCTION_BOOTSTRAP_V5_GEOMETRY =
      {

        version:
          VERSION,

        panel:
          panelGeometry,

        card:
          cardGeometry,

        wrapper:
          wrapperGeometry,

        button:
          buttonGeometry,

        sameReferences:
          sameReferences,

        ancestors:
          ancestors,

        painted:
          painted,

        conclusion:
          conclusion

      };

  }


  /*
   * =========================================================
   * OPTIONAL BOOTSTRAP INSPECTION
   *
   * IMPORTANT:
   * This ONLY runs when the visible button is pressed.
   * =========================================================
   */

  function runInspection(
    refs
  ) {

    const status =
      refs.status;


    const output =
      refs.result;


    if (
      typeof
        window.inspectFix03D59ProductionBootstrap !==
      'function'
    ) {

      status.innerHTML =
        '❌ Production Bootstrap Inspector function chưa có trong runtime.';

      return;

    }


    try {

      const result =
        window
          .inspectFix03D59ProductionBootstrap();


      status.innerHTML =
        '✅ Production Runtime inspection completed.';


      output.innerHTML = `

        <div
          style="
            margin-top:16px;
            padding:16px;
            border-radius:16px;
            background:rgba(255,255,255,.06);
            line-height:1.6;
          "
        >

          <b>
            📡 PRODUCTION INSPECTOR RESULT
          </b>

          <br>

          Version:
          ${escapeHtml(
            result &&
            result.version
              ? result.version
              : '--'
          )}

          <br>

          Mode:
          ${escapeHtml(
            result &&
            result.mode
              ? result.mode
              : '--'
          )}

          <br><br>

          Inspector executed by
          <b>
            manual button press only
          </b>.

        </div>

      `;


    } catch (
      error
    ) {

      status.innerHTML =
        '❌ Inspection failed: ' +
        escapeHtml(
          error &&
          error.message
            ? error.message
            : error
        );

    }

  }


  /*
   * =========================================================
   * BUILD PANEL
   * =========================================================
   */

  function buildPanel() {

    const oldPanel =
      document.getElementById(
        PANEL_ID
      );


    if (oldPanel) {

      oldPanel.remove();

    }


    installStyles();


    const settings =
      document.getElementById(
        'tab-settings'
      );


    if (!settings) {

      console.warn(
        'Production Bootstrap Mobile V5: tab-settings not found'
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

      <div id="${CARD_ID}">

        <div class="pb-v5-title">
          🚦 PRODUCTION BOOTSTRAP V5
        </div>


        <div class="pb-v5-sub">

          Geometry Truth Probe.

          <br><br>

          So sánh nhiều API layout để xác định
          nguyên nhân V4 báo DOM
          <b>0 × 0px</b>
          dù nội dung vẫn xuất hiện trên màn hình.

        </div>


        <div class="pb-v5-safety">
          🔒 READ ONLY · ZERO WRITE
        </div>


        <div id="${WRAPPER_ID}">

          <button
            type="button"
            id="${BUTTON_ID}"
          >
            🔬 INSPECT PRODUCTION RUNTIME
          </button>

        </div>


        <div id="${STATUS_ID}">
          V5 loaded · Geometry probe pending.
        </div>


        <div id="${DIAGNOSTIC_ID}">
          🧪 Waiting for browser layout...
        </div>


        <div id="${RESULT_ID}">
        </div>

      </div>

    `;


    settings.appendChild(
      panel
    );


    /*
     * IMPORTANT:
     * Keep DIRECT references.
     */

    const refs = {

      panel:
        panel,

      card:
        panel.querySelector(
          '#' + CARD_ID
        ),

      wrapper:
        panel.querySelector(
          '#' + WRAPPER_ID
        ),

      button:
        panel.querySelector(
          '#' + BUTTON_ID
        ),

      status:
        panel.querySelector(
          '#' + STATUS_ID
        ),

      diagnostic:
        panel.querySelector(
          '#' + DIAGNOSTIC_ID
        ),

      result:
        panel.querySelector(
          '#' + RESULT_ID
        )

    };


    refs.button.addEventListener(
      'click',
      function () {

        runInspection(
          refs
        );

      }
    );


    /*
     * Geometry probe is automatic.
     *
     * Production inspector is NOT automatic.
     */

    window.requestAnimationFrame(
      function () {

        window.requestAnimationFrame(
          function () {

            runGeometryProbe(
              refs
            );

          }
        );

      }
    );


    /*
     * Second measurement after layout settles.
     */

    window.setTimeout(
      function () {

        runGeometryProbe(
          refs
        );

      },
      500
    );

  }


  /*
   * =========================================================
   * INIT
   * =========================================================
   */

  function init() {

    buildPanel();

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


  window
    .FIX03D59_PRODUCTION_BOOTSTRAP_MOBILE_VERSION =
    VERSION;


  console.log(
    'FIX-03D5.9 Production Bootstrap Mobile V5 loaded — GEOMETRY TRUTH PROBE'
  );

})();
