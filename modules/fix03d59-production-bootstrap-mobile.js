/* =========================================================================
   FIX-03D5.9
   PRODUCTION BOOTSTRAP — MOBILE V4
   DIRECT DOM REFERENCE + DUPLICATE DOM DETECTOR

   PURPOSE:
   - Build Production Bootstrap mobile inspector.
   - Keep DIRECT references to newly-created DOM nodes.
   - Detect duplicate IDs in the current runtime DOM.
   - Compare direct-reference geometry with document lookup geometry.
   - Call ONLY inspectFix03D59ProductionBootstrap() when user presses Inspect.
   - Never execute any production stage.

   READ ONLY
   ZERO WRITE
   ZERO PROMOTION
   ZERO PRODUCTION EXECUTION
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_PRODUCTION_BOOTSTRAP_MOBILE_V4';


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
   * DIRECT REFERENCES
   * =========================================================
   */

  let directPanel =
    null;

  let directCard =
    null;

  let directWrapper =
    null;

  let directButton =
    null;


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


  function findFirstMissing(
    result
  ) {

    if (
      !result ||
      typeof result !== 'object'
    ) {

      return {
        type: 'BOOTSTRAP',
        stage: '--'
      };

    }


    const functionOrder = [

      'step83B',
      'step83C',
      'step83D',
      'step83E',
      'step83F',
      'step83R',
      'step84A',
      'step84B',
      'step84C',
      'step84D',
      'step84F'

    ];


    for (
      const stage
      of functionOrder
    ) {

      if (
        !result.functions ||
        result.functions[stage] !== true
      ) {

        return {
          type: 'FUNCTION',
          stage: stage
        };

      }

    }


    const ramOrder = [

      'step82C',
      'step83B',
      'step83C',
      'step83Q',
      'step83R',
      'step84A',
      'step84B',
      'step84C',
      'step84D',
      'step84E',
      'step84F'

    ];


    for (
      const stage
      of ramOrder
    ) {

      if (
        !result.ram ||
        result.ram[stage] !== true
      ) {

        return {
          type: 'RAM',
          stage: stage
        };

      }

    }


    return {
      type: 'NONE',
      stage: 'ALL_AVAILABLE'
    };

  }


  function buildRows(
    values
  ) {

    if (
      !values ||
      typeof values !== 'object'
    ) {

      return `
        <div class="pb-empty">
          No runtime information.
        </div>
      `;

    }


    return Object
      .entries(
        values
      )
      .map(
        function (
          entry
        ) {

          const key =
            entry[0];

          const value =
            entry[1];


          return `

            <div class="pb-row">

              <span class="pb-key">
                ${escapeHtml(key)}
              </span>

              <strong class="${
                value
                  ? 'pb-ok'
                  : 'pb-fail'
              }">

                ${yesNo(value)}

              </strong>

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

    const oldStyle =
      document.getElementById(
        'fix03d59-production-bootstrap-style'
      );


    if (oldStyle) {

      oldStyle.remove();

    }


    const style =
      document.createElement(
        'style'
      );


    style.id =
      'fix03d59-production-bootstrap-style';


    style.textContent = `

      #${PANEL_ID} {
        display: block !important;
        position: relative !important;
        width: auto !important;
        min-width: 0 !important;
        height: auto !important;
        margin: 24px 0 34px !important;
        overflow: visible !important;
      }


      #${CARD_ID} {
        display: block !important;
        position: relative !important;
        width: auto !important;
        min-width: 0 !important;
        height: auto !important;

        background:
          linear-gradient(
            145deg,
            rgba(28,38,82,.98),
            rgba(20,29,66,.98)
          );

        border:
          1px solid
          rgba(129,140,248,.35);

        border-radius: 24px;

        padding: 20px;

        margin-bottom: 16px;

        color: #fff;

        overflow: visible !important;
      }


      #${PANEL_ID} .pb-title {
        font-size: 23px;
        line-height: 1.3;
        font-weight: 900;
        margin-bottom: 10px;
      }


      #${PANEL_ID} .pb-sub {
        color:
          rgba(255,255,255,.68);

        font-size: 14px;
        line-height: 1.55;
      }


      #${PANEL_ID} .pb-safety {
        margin-top: 12px;
        color: #72e6ae;
        font-weight: 800;
        line-height: 1.5;
      }


      #${WRAPPER_ID} {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;

        position: relative !important;

        width: 100% !important;
        min-width: 1px !important;
        min-height: 70px !important;

        margin: 18px 0 0 !important;

        padding: 0 !important;

        overflow: visible !important;
      }


      #${BUTTON_ID} {
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;

        position: relative !important;

        width: 100% !important;
        min-width: 1px !important;

        height: auto !important;
        min-height: 58px !important;

        margin: 0 !important;

        padding: 17px 10px !important;

        border: 0 !important;

        border-radius: 17px !important;

        background:
          linear-gradient(
            90deg,
            #ffbd3c,
            #ff913d
          ) !important;

        color: #17182a !important;

        font-size: 17px !important;
        font-weight: 900 !important;
        line-height: 1.3 !important;

        pointer-events: auto !important;

        z-index: 30 !important;
      }


      #${PANEL_ID} .pb-status {
        margin-top: 15px;

        color:
          rgba(255,255,255,.75);

        line-height: 1.55;
      }


      #${PANEL_ID} .pb-diagnostic {
        margin-top: 14px;

        padding: 14px;

        border-radius: 14px;

        background:
          rgba(59,130,246,.08);

        border:
          1px solid
          rgba(96,165,250,.30);

        color:
          rgba(255,255,255,.84);

        font-size: 13px;

        line-height: 1.65;

        overflow-wrap: anywhere;
      }


      #${PANEL_ID} .pb-diag-block {
        padding: 10px 0;

        border-bottom:
          1px solid
          rgba(255,255,255,.08);
      }


      #${PANEL_ID} .pb-diag-block:last-child {
        border-bottom: 0;
      }


      #${PANEL_ID} .pb-diag-title {
        font-weight: 900;

        color: #fff;

        margin-bottom: 4px;
      }


      #${PANEL_ID} .pb-ok {
        color: #72e6ae;
      }


      #${PANEL_ID} .pb-fail {
        color: #ff7185;
      }


      #${PANEL_ID} .pb-warn {
        color: #ffbd3c;
      }


      #${PANEL_ID} .pb-section {
        margin-top: 18px;
      }


      #${PANEL_ID} .pb-section-title {
        color: #ffbd3c;

        font-size: 18px;

        font-weight: 900;

        margin-bottom: 10px;
      }


      #${PANEL_ID} .pb-row {
        display: flex;

        justify-content:
          space-between;

        align-items:
          flex-start;

        gap: 12px;

        padding: 11px 0;

        border-bottom:
          1px solid
          rgba(255,255,255,.08);
      }


      #${PANEL_ID} .pb-key {
        font-weight: 700;

        color:
          rgba(255,255,255,.88);
      }


      #${PANEL_ID} .pb-first-missing {
        margin-top: 18px;

        padding: 15px;

        border-radius: 15px;

        background:
          rgba(255,189,60,.08);

        border:
          1px solid
          rgba(255,189,60,.30);

        line-height: 1.55;
      }


      #${PANEL_ID} .pb-first-missing strong {
        color: #ffbd3c;
      }


      #${PANEL_ID} .pb-empty {
        color:
          rgba(255,255,255,.55);
      }

    `;


    document.head.appendChild(
      style
    );

  }


  /*
   * =========================================================
   * GEOMETRY
   * =========================================================
   */

  function inspectElement(
    element
  ) {

    if (!element) {

      return {
        exists: false
      };

    }


    const rect =
      element.getBoundingClientRect();


    const computed =
      window.getComputedStyle(
        element
      );


    return {

      exists: true,

      connected:
        element.isConnected,

      width:
        Math.round(
          rect.width
        ),

      height:
        Math.round(
          rect.height
        ),

      top:
        Math.round(
          rect.top
        ),

      left:
        Math.round(
          rect.left
        ),

      display:
        computed.display,

      visibility:
        computed.visibility,

      opacity:
        computed.opacity,

      position:
        computed.position

    };

  }


  function countId(
    id
  ) {

    try {

      return document
        .querySelectorAll(
          '#' + id
        )
        .length;

    } catch (
      error
    ) {

      return -1;

    }

  }


  function sameNode(
    direct,
    lookup
  ) {

    return Boolean(
      direct &&
      lookup &&
      direct === lookup
    );

  }


  function formatGeometry(
    info
  ) {

    if (
      !info ||
      !info.exists
    ) {

      return `
        <span class="pb-fail">
          DOM NO ❌
        </span>
      `;

    }


    const sizeGood =
      info.width > 0 &&
      info.height > 0;


    return `

      DOM:
      <span class="pb-ok">
        YES ✅
      </span>

      · Connected:
      <b>
        ${info.connected ? 'YES' : 'NO'}
      </b>

      <br>

      Size:
      <b class="${
        sizeGood
          ? 'pb-ok'
          : 'pb-fail'
      }">

        ${info.width}
        ×
        ${info.height}px

      </b>

      <br>

      Position:
      <b>
        ${info.left},
        ${info.top}
      </b>

      <br>

      Display:
      <b>
        ${escapeHtml(
          info.display
        )}
      </b>

      · Visibility:
      <b>
        ${escapeHtml(
          info.visibility
        )}
      </b>

      <br>

      CSS position:
      <b>
        ${escapeHtml(
          info.position
        )}
      </b>

      · Opacity:
      <b>
        ${escapeHtml(
          info.opacity
        )}
      </b>

    `;

  }


  /*
   * =========================================================
   * V4 DUPLICATE DOM DIAGNOSTIC
   * =========================================================
   */

  function inspectDomV4() {

    const diagnostic =
      document.getElementById(
        DIAGNOSTIC_ID
      );


    if (!diagnostic) {

      return null;

    }


    /*
     * IMPORTANT:
     * direct* variables refer to the exact nodes
     * created by THIS V4 instance.
     */

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


    const counts = {

      panel:
        countId(
          PANEL_ID
        ),

      card:
        countId(
          CARD_ID
        ),

      wrapper:
        countId(
          WRAPPER_ID
        ),

      button:
        countId(
          BUTTON_ID
        )

    };


    const directGeometry = {

      panel:
        inspectElement(
          directPanel
        ),

      card:
        inspectElement(
          directCard
        ),

      wrapper:
        inspectElement(
          directWrapper
        ),

      button:
        inspectElement(
          directButton
        )

    };


    const lookupGeometry = {

      panel:
        inspectElement(
          lookupPanel
        ),

      card:
        inspectElement(
          lookupCard
        ),

      wrapper:
        inspectElement(
          lookupWrapper
        ),

      button:
        inspectElement(
          lookupButton
        )

    };


    const identity = {

      panel:
        sameNode(
          directPanel,
          lookupPanel
        ),

      card:
        sameNode(
          directCard,
          lookupCard
        ),

      wrapper:
        sameNode(
          directWrapper,
          lookupWrapper
        ),

      button:
        sameNode(
          directButton,
          lookupButton
        )

    };


    const duplicateDetected =
      counts.panel !== 1 ||
      counts.card !== 1 ||
      counts.wrapper !== 1 ||
      counts.button !== 1;


    const identityMismatch =
      !identity.panel ||
      !identity.card ||
      !identity.wrapper ||
      !identity.button;


    const directSizeFailure =
      directGeometry.panel.width <= 0 ||
      directGeometry.panel.height <= 0 ||
      directGeometry.card.width <= 0 ||
      directGeometry.card.height <= 0 ||
      directGeometry.wrapper.width <= 0 ||
      directGeometry.wrapper.height <= 0 ||
      directGeometry.button.width <= 0 ||
      directGeometry.button.height <= 0;


    let conclusion =
      'DIRECT DOM GEOMETRY OK';


    if (duplicateDetected) {

      conclusion =
        'DUPLICATE DOM ID DETECTED';

    } else if (identityMismatch) {

      conclusion =
        'DOCUMENT LOOKUP DOES NOT MATCH V4 DIRECT NODE';

    } else if (directSizeFailure) {

      conclusion =
        'DIRECT V4 NODE STILL HAS ZERO GEOMETRY';

    }


    diagnostic.innerHTML = `

      <b>
        🧪 MOBILE V4 DUPLICATE DOM DIAGNOSTIC
      </b>


      <div class="pb-diag-block">

        <div class="pb-diag-title">
          ID COUNTS
        </div>

        PANEL:
        <b class="${
          counts.panel === 1
            ? 'pb-ok'
            : 'pb-fail'
        }">
          ${counts.panel}
        </b>

        <br>

        CARD:
        <b class="${
          counts.card === 1
            ? 'pb-ok'
            : 'pb-fail'
        }">
          ${counts.card}
        </b>

        <br>

        WRAPPER:
        <b class="${
          counts.wrapper === 1
            ? 'pb-ok'
            : 'pb-fail'
        }">
          ${counts.wrapper}
        </b>

        <br>

        BUTTON:
        <b class="${
          counts.button === 1
            ? 'pb-ok'
            : 'pb-fail'
        }">
          ${counts.button}
        </b>

      </div>


      <div class="pb-diag-block">

        <div class="pb-diag-title">
          DIRECT NODE = DOCUMENT LOOKUP
        </div>

        PANEL:
        <b class="${
          identity.panel
            ? 'pb-ok'
            : 'pb-fail'
        }">
          ${identity.panel ? 'YES ✅' : 'NO ❌'}
        </b>

        <br>

        CARD:
        <b class="${
          identity.card
            ? 'pb-ok'
            : 'pb-fail'
        }">
          ${identity.card ? 'YES ✅' : 'NO ❌'}
        </b>

        <br>

        WRAPPER:
        <b class="${
          identity.wrapper
            ? 'pb-ok'
            : 'pb-fail'
        }">
          ${identity.wrapper ? 'YES ✅' : 'NO ❌'}
        </b>

        <br>

        BUTTON:
        <b class="${
          identity.button
            ? 'pb-ok'
            : 'pb-fail'
        }">
          ${identity.button ? 'YES ✅' : 'NO ❌'}
        </b>

      </div>


      <div class="pb-diag-block">

        <div class="pb-diag-title">
          DIRECT V4 BUTTON
        </div>

        ${formatGeometry(
          directGeometry.button
        )}

      </div>


      <div class="pb-diag-block">

        <div class="pb-diag-title">
          DIRECT V4 WRAPPER
        </div>

        ${formatGeometry(
          directGeometry.wrapper
        )}

      </div>


      <div class="pb-diag-block">

        <div class="pb-diag-title">
          DIRECT V4 CARD
        </div>

        ${formatGeometry(
          directGeometry.card
        )}

      </div>


      <div class="pb-diag-block">

        <div class="pb-diag-title">
          DIRECT V4 PANEL
        </div>

        ${formatGeometry(
          directGeometry.panel
        )}

      </div>


      <div class="pb-diag-block">

        <div class="pb-diag-title">
          V4 CONCLUSION
        </div>

        <b class="${
          conclusion ===
          'DIRECT DOM GEOMETRY OK'
            ? 'pb-ok'
            : 'pb-warn'
        }">

          ${escapeHtml(
            conclusion
          )}

        </b>

      </div>

    `;


    const result = {

      version:
        VERSION,

      counts:
        counts,

      identity:
        identity,

      directGeometry:
        directGeometry,

      lookupGeometry:
        lookupGeometry,

      duplicateDetected:
        duplicateDetected,

      identityMismatch:
        identityMismatch,

      directSizeFailure:
        directSizeFailure,

      conclusion:
        conclusion

    };


    window
      .LAST_FIX03D59_PRODUCTION_BOOTSTRAP_DOM_V4 =
      result;


    return result;

  }


  /*
   * =========================================================
   * RUN BOOTSTRAP INSPECTION
   * =========================================================
   */

  function runInspection() {

    const status =
      document.getElementById(
        STATUS_ID
      );


    const output =
      document.getElementById(
        RESULT_ID
      );


    if (
      !status ||
      !output
    ) {

      return;

    }


    if (
      typeof
        window.inspectFix03D59ProductionBootstrap !==
      'function'
    ) {

      status.innerHTML =
        '❌ Production Bootstrap Inspector chưa có trong runtime.';


      output.innerHTML = `

        <div id="${CARD_ID}-result">

          <div class="pb-first-missing">

            <strong>
              FIRST MISSING:
            </strong>

            BOOTSTRAP INSPECTOR FUNCTION

          </div>

        </div>

      `;


      return;

    }


    try {

      const result =
        window
          .inspectFix03D59ProductionBootstrap();


      const missing =
        findFirstMissing(
          result
        );


      status.innerHTML =
        '✅ Runtime inspection completed.';


      output.innerHTML = `

        <div
          style="
            margin-top:16px;
            padding:20px;
            border-radius:22px;
            background:rgba(28,38,82,.98);
            border:1px solid rgba(129,140,248,.35);
            color:#fff;
          "
        >

          <div class="pb-title">
            📡 PRODUCTION RUNTIME RESULT
          </div>


          <div class="pb-sub">

            Bootstrap:
            <b>
              ${escapeHtml(
                result.version
              )}
            </b>

            <br>

            Mode:
            <b>
              ${escapeHtml(
                result.mode
              )}
            </b>

          </div>


          <div class="pb-section">

            <div class="pb-section-title">
              🧠 ENGINE FUNCTIONS
            </div>

            ${buildRows(
              result.functions
            )}

          </div>


          <div class="pb-section">

            <div class="pb-section-title">
              💾 RAM RESULTS
            </div>

            ${buildRows(
              result.ram
            )}

          </div>


          <div class="pb-first-missing">

            <strong>
              FIRST MISSING:
            </strong>

            ${
              missing.type ===
              'NONE'
                ? 'NONE ✅ — runtime chain is present'
                : escapeHtml(
                    missing.type +
                    ' / ' +
                    missing.stage
                  )
            }

          </div>


          <div class="pb-section">

            <div class="pb-section-title">
              🔒 SAFETY
            </div>

            ${buildRows({

              executionPerformed:
                !(
                  result.safety &&
                  result.safety
                    .executionPerformed
                ),

              candidateCreated:
                !(
                  result.safety &&
                  result.safety
                    .candidateCreated
                ),

              canonicalWrite:
                !(
                  result.safety &&
                  result.safety
                    .canonicalWrite
                ),

              productionWrite:
                !(
                  result.safety &&
                  result.safety
                    .productionWrite
                ),

              storageWrite:
                !(
                  result.safety &&
                  result.safety
                    .storageWrite
                ),

              forecastModified:
                !(
                  result.safety &&
                  result.safety
                    .forecastModified
                ),

              savePredictionCalled:
                !(
                  result.safety &&
                  result.safety
                    .savePredictionCalled
                )

            })}

          </div>

        </div>

      `;


      window
        .LAST_FIX03D59_PRODUCTION_BOOTSTRAP_MOBILE =
        {

          version:
            VERSION,

          inspection:
            result,

          firstMissing:
            missing,

          domDiagnostic:
            inspectDomV4()

        };


    } catch (
      error
    ) {

      console.error(
        'Production Bootstrap Mobile V4:',
        error
      );


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
   * BUILD PANEL USING DIRECT REFERENCES
   * =========================================================
   */

  function buildPanel() {

    installStyles();


    const settings =
      document.getElementById(
        'tab-settings'
      );


    if (!settings) {

      console.warn(
        'Production Bootstrap Mobile V4: tab-settings not found'
      );

      return;

    }


    /*
     * IMPORTANT:
     *
     * Remove every existing panel with this ID,
     * not only the first getElementById result.
     */

    const existingPanels =
      document.querySelectorAll(
        '#' + PANEL_ID
      );


    existingPanels.forEach(
      function (
        node
      ) {

        node.remove();

      }
    );


    /*
     * Create PANEL directly.
     */

    directPanel =
      document.createElement(
        'section'
      );


    directPanel.id =
      PANEL_ID;


    directPanel.setAttribute(
      'data-bootstrap-mobile-version',
      VERSION
    );


    /*
     * Create CARD directly.
     */

    directCard =
      document.createElement(
        'div'
      );


    directCard.id =
      CARD_ID;


    /*
     * Header content.
     */

    directCard.innerHTML = `

      <div class="pb-title">
        🚦 PRODUCTION BOOTSTRAP V4
      </div>


      <div class="pb-sub">

        Direct DOM Reference +
        Duplicate DOM Detector.

        <br><br>

        Không chạy STEP.
        Không thay đổi Forecast.
        Không ghi Storage.

      </div>


      <div class="pb-safety">
        🔒 INSPECTION ONLY · ZERO WRITE
      </div>

    `;


    /*
     * Create WRAPPER directly.
     */

    directWrapper =
      document.createElement(
        'div'
      );


    directWrapper.id =
      WRAPPER_ID;


    /*
     * Create BUTTON directly.
     */

    directButton =
      document.createElement(
        'button'
      );


    directButton.id =
      BUTTON_ID;


    directButton.type =
      'button';


    directButton.textContent =
      '🔬 INSPECT PRODUCTION RUNTIME';


    /*
     * Assemble using direct references.
     */

    directWrapper.appendChild(
      directButton
    );


    directCard.appendChild(
      directWrapper
    );


    const status =
      document.createElement(
        'div'
      );


    status.id =
      STATUS_ID;


    status.className =
      'pb-status';


    status.textContent =
      'V4 loaded · Direct DOM reference active.';


    directCard.appendChild(
      status
    );


    const diagnostic =
      document.createElement(
        'div'
      );


    diagnostic.id =
      DIAGNOSTIC_ID;


    diagnostic.className =
      'pb-diagnostic';


    diagnostic.textContent =
      '🧪 Đang kiểm tra duplicate DOM...';


    directCard.appendChild(
      diagnostic
    );


    directPanel.appendChild(
      directCard
    );


    const result =
      document.createElement(
        'div'
      );


    result.id =
      RESULT_ID;


    directPanel.appendChild(
      result
    );


    settings.appendChild(
      directPanel
    );


    /*
     * Event attached DIRECTLY to exact V4 button.
     */

    directButton.addEventListener(
      'click',
      runInspection
    );


    /*
     * Wait for browser layout.
     */

    window.requestAnimationFrame(
      function () {

        window.requestAnimationFrame(
          function () {

            inspectDomV4();

          }
        );

      }
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
    'FIX-03D5.9 Production Bootstrap Mobile V4 loaded — DIRECT DOM DIAGNOSTIC'
  );

})();
