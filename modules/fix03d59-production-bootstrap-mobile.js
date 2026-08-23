/* =========================================================================
   FIX-03D5.9
   PRODUCTION BOOTSTRAP — MOBILE V7
   STABLE MOUNT + MANUAL INSPECTION

   PURPOSE:
   - Mount Production Bootstrap diagnostic safely inside Settings.
   - Never remove an existing panel before tab-settings is available.
   - Keep the diagnostic collapsed until the user presses the button.
   - Verify that the mounted panel/button are the live DOM nodes.
   - Detect duplicate IDs.
   - Provide a small read-only Production Bootstrap inspection entry point.

   IMPORTANT:
   - READ ONLY.
   - ZERO WRITE TO PRODUCTION.
   - ZERO PROMOTION.
   - DOES NOT MODIFY LAST_FORECAST.
   - DOES NOT MODIFY CANDIDATES.
   - DOES NOT CALL savePrediction().
   - DOES NOT EXECUTE PRODUCTION FORECAST.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_PRODUCTION_BOOTSTRAP_MOBILE_V7';


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


  const DIAGNOSTIC_ID =
    'fix03d59-production-bootstrap-diagnostic';


  const SETTINGS_ID =
    'tab-settings';


  const MAX_MOUNT_ATTEMPTS =
    20;


  const RETRY_DELAY_MS =
    250;


  let mountAttempts =
    0;


  let mountedPanel =
    null;


  let mountedButton =
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


  function countId(
    id
  ) {

    return document
      .querySelectorAll(
        '[id="' + id + '"]'
      )
      .length;

  }


  function getGeometry(
    node
  ) {

    if (!node) {

      return {

        width: 0,

        height: 0,

        top: 0,

        left: 0,

        rects: 0

      };

    }


    const rect =
      node.getBoundingClientRect();


    return {

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

      rects:
        node.getClientRects()
          .length

    };

  }


  function inspectNode(
    node
  ) {

    if (!node) {

      return {

        exists: false,

        connected: false,

        tag: '--',

        id: '--',

        parentTag: '--',

        parentId: '--',

        geometry:
          getGeometry(
            null
          )

      };

    }


    const parent =
      node.parentElement;


    return {

      exists: true,

      connected:
        node.isConnected === true,

      tag:
        node.tagName ||
        '--',

      id:
        node.id ||
        '--',

      parentTag:
        parent
          ? (
              parent.tagName ||
              '--'
            )
          : '--',

      parentId:
        parent
          ? (
              parent.id ||
              '--'
            )
          : '--',

      geometry:
        getGeometry(
          node
        )

    };

  }


  /*
   * =========================================================
   * STYLES
   * =========================================================
   */

  function installStyles() {

    let style =
      document.getElementById(
        'fix03d59-production-bootstrap-style'
      );


    if (!style) {

      style =
        document.createElement(
          'style'
        );


      style.id =
        'fix03d59-production-bootstrap-style';


      document.head.appendChild(
        style
      );

    }


    style.textContent = `

      #${PANEL_ID} {
        display: block !important;
        width: auto !important;
        height: auto !important;
        margin: 24px 0 34px !important;
        position: relative !important;
        visibility: visible !important;
        opacity: 1 !important;
        overflow: visible !important;
        transform: none !important;
        contain: none !important;
        content-visibility: visible !important;
      }


      #${CARD_ID} {
        display: block !important;
        width: 100% !important;
        height: auto !important;
        min-height: 1px !important;
        position: relative !important;
        visibility: visible !important;
        opacity: 1 !important;
        overflow: visible !important;

        box-sizing: border-box;

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

        color: #fff;
      }


      #${PANEL_ID} .v7-title {
        font-size: 23px;
        font-weight: 900;
        line-height: 1.35;
      }


      #${PANEL_ID} .v7-sub {
        margin-top: 13px;

        color:
          rgba(255,255,255,.68);

        line-height: 1.6;
      }


      #${PANEL_ID} .v7-safety {
        margin-top: 16px;

        color: #72e6ae;

        font-weight: 900;
      }


      #${WRAPPER_ID} {
        display: block !important;
        width: 100% !important;
        height: auto !important;
        min-height: 56px !important;
        margin-top: 20px !important;
        position: relative !important;
        visibility: visible !important;
        opacity: 1 !important;
        overflow: visible !important;
      }


      #${BUTTON_ID} {
        display: block !important;

        width: 100% !important;

        min-height: 58px !important;

        padding: 16px !important;

        margin: 0 !important;

        position: relative !important;

        visibility: visible !important;

        opacity: 1 !important;

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

        line-height: 1.35 !important;

        cursor: pointer;
      }


      #${STATUS_ID} {
        margin-top: 16px;

        color:
          rgba(255,255,255,.75);

        line-height: 1.55;
      }


      #${DIAGNOSTIC_ID} {
        display: none;

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


      #${DIAGNOSTIC_ID}.v7-open {
        display: block !important;
      }


      #${PANEL_ID}
      .v7-diagnostic-title {
        font-size: 18px;

        font-weight: 900;

        margin-bottom: 14px;
      }


      #${PANEL_ID}
      .v7-section {
        padding: 13px 0;

        border-bottom:
          1px solid
          rgba(255,255,255,.10);
      }


      #${PANEL_ID}
      .v7-section-title {
        color: #ffbd3c;

        font-weight: 900;

        margin-bottom: 7px;
      }


      #${PANEL_ID}
      .v7-ok {
        color: #72e6ae;
      }


      #${PANEL_ID}
      .v7-fail {
        color: #ff7185;
      }


      #${PANEL_ID}
      .v7-conclusion {
        margin-top: 18px;

        padding: 14px;

        border-radius: 14px;

        border:
          1px solid
          rgba(255,189,60,.35);

        background:
          rgba(255,189,60,.08);

        color: #ffbd3c;

        font-weight: 900;
      }

    `;

  }


  /*
   * =========================================================
   * MANUAL INSPECTION
   * =========================================================
   */

  function runInspection() {

    const diagnostic =
      document.getElementById(
        DIAGNOSTIC_ID
      );


    const status =
      document.getElementById(
        STATUS_ID
      );


    if (
      !diagnostic ||
      !status
    ) {

      return;

    }


    const livePanel =
      document.getElementById(
        PANEL_ID
      );


    const liveCard =
      document.getElementById(
        CARD_ID
      );


    const liveWrapper =
      document.getElementById(
        WRAPPER_ID
      );


    const liveButton =
      document.getElementById(
        BUTTON_ID
      );


    const panelInfo =
      inspectNode(
        livePanel
      );


    const cardInfo =
      inspectNode(
        liveCard
      );


    const wrapperInfo =
      inspectNode(
        liveWrapper
      );


    const buttonInfo =
      inspectNode(
        liveButton
      );


    const panelCount =
      countId(
        PANEL_ID
      );


    const cardCount =
      countId(
        CARD_ID
      );


    const wrapperCount =
      countId(
        WRAPPER_ID
      );


    const buttonCount =
      countId(
        BUTTON_ID
      );


    const samePanel =
      Boolean(
        mountedPanel &&
        livePanel &&
        mountedPanel ===
          livePanel
      );


    const sameButton =
      Boolean(
        mountedButton &&
        liveButton &&
        mountedButton ===
          liveButton
      );


    let conclusion =
      'STABLE LIVE DOM MOUNT';


    if (
      panelCount !== 1 ||
      cardCount !== 1 ||
      wrapperCount !== 1 ||
      buttonCount !== 1
    ) {

      conclusion =
        'DUPLICATE DOM ID DETECTED';

    } else if (
      !panelInfo.connected ||
      !cardInfo.connected ||
      !wrapperInfo.connected ||
      !buttonInfo.connected
    ) {

      conclusion =
        'BOOTSTRAP NODE DETACHED';

    } else if (
      !samePanel ||
      !sameButton
    ) {

      conclusion =
        'BOOTSTRAP NODE REPLACED';

    } else if (
      buttonInfo.geometry.width <= 0 ||
      buttonInfo.geometry.height <= 0
    ) {

      conclusion =
        'BUTTON CONNECTED BUT HAS ZERO GEOMETRY';

    }


    diagnostic.innerHTML = `

      <div class="v7-diagnostic-title">
        🔬 PRODUCTION BOOTSTRAP V7 INSPECTION
      </div>


      <div class="v7-section">

        <div class="v7-section-title">
          DOM ID COUNTS
        </div>

        PANEL:
        <b>${panelCount}</b>

        <br>

        CARD:
        <b>${cardCount}</b>

        <br>

        WRAPPER:
        <b>${wrapperCount}</b>

        <br>

        BUTTON:
        <b>${buttonCount}</b>

      </div>


      <div class="v7-section">

        <div class="v7-section-title">
          LIVE PANEL
        </div>

        Exists:
        <strong class="${
          panelInfo.exists
            ? 'v7-ok'
            : 'v7-fail'
        }">
          ${yesNo(
            panelInfo.exists
          )}
        </strong>

        <br>

        Connected:
        <strong class="${
          panelInfo.connected
            ? 'v7-ok'
            : 'v7-fail'
        }">
          ${yesNo(
            panelInfo.connected
          )}
        </strong>

        <br>

        Same mounted node:
        <strong class="${
          samePanel
            ? 'v7-ok'
            : 'v7-fail'
        }">
          ${yesNo(
            samePanel
          )}
        </strong>

        <br>

        Size:
        <b>
          ${panelInfo.geometry.width}
          ×
          ${panelInfo.geometry.height}px
        </b>

      </div>


      <div class="v7-section">

        <div class="v7-section-title">
          LIVE BUTTON
        </div>

        Exists:
        <strong class="${
          buttonInfo.exists
            ? 'v7-ok'
            : 'v7-fail'
        }">
          ${yesNo(
            buttonInfo.exists
          )}
        </strong>

        <br>

        Connected:
        <strong class="${
          buttonInfo.connected
            ? 'v7-ok'
            : 'v7-fail'
        }">
          ${yesNo(
            buttonInfo.connected
          )}
        </strong>

        <br>

        Same mounted node:
        <strong class="${
          sameButton
            ? 'v7-ok'
            : 'v7-fail'
        }">
          ${yesNo(
            sameButton
          )}
        </strong>

        <br>

        Size:
        <b>
          ${buttonInfo.geometry.width}
          ×
          ${buttonInfo.geometry.height}px
        </b>

        <br>

        Client rects:
        <b>
          ${buttonInfo.geometry.rects}
        </b>

        <br>

        Position:
        <b>
          ${buttonInfo.geometry.left},
          ${buttonInfo.geometry.top}
        </b>

      </div>


      <div class="v7-section">

        <div class="v7-section-title">
          PARENT CHAIN
        </div>

        BUTTON parent:

        <b>
          ${escapeHtml(
            buttonInfo.parentTag
          )}
          #
          ${escapeHtml(
            buttonInfo.parentId
          )}
        </b>

        <br>

        WRAPPER parent:

        <b>
          ${escapeHtml(
            wrapperInfo.parentTag
          )}
          #
          ${escapeHtml(
            wrapperInfo.parentId
          )}
        </b>

        <br>

        CARD parent:

        <b>
          ${escapeHtml(
            cardInfo.parentTag
          )}
          #
          ${escapeHtml(
            cardInfo.parentId
          )}
        </b>

      </div>


      <div class="v7-conclusion">

        V7 CONCLUSION

        <br>

        ${escapeHtml(
          conclusion
        )}

      </div>

    `;


    diagnostic.classList.add(
      'v7-open'
    );


    status.innerHTML =
      '✅ Manual inspection completed.';


    window
      .LAST_FIX03D59_PRODUCTION_BOOTSTRAP_MOBILE =
      {

        version:
          VERSION,

        inspectedAt:
          new Date()
            .toISOString(),

        counts: {

          panel:
            panelCount,

          card:
            cardCount,

          wrapper:
            wrapperCount,

          button:
            buttonCount

        },

        sameMountedNode: {

          panel:
            samePanel,

          button:
            sameButton

        },

        panel:
          panelInfo,

        card:
          cardInfo,

        wrapper:
          wrapperInfo,

        button:
          buttonInfo,

        conclusion:
          conclusion

      };

  }


  /*
   * =========================================================
   * BUILD
   * =========================================================
   */

  function createPanel() {

    const panel =
      document.createElement(
        'section'
      );


    panel.id =
      PANEL_ID;


    const card =
      document.createElement(
        'div'
      );


    card.id =
      CARD_ID;


    const title =
      document.createElement(
        'div'
      );


    title.className =
      'v7-title';


    title.textContent =
      '🧬 PRODUCTION BOOTSTRAP V7';


    const sub =
      document.createElement(
        'div'
      );


    sub.className =
      'v7-sub';


    sub.innerHTML = `

      Stable Mount + Manual Inspection.

      <br><br>

      V7 chỉ kiểm tra Production Bootstrap
      khi bạn chủ động bấm nút bên dưới.

    `;


    const safety =
      document.createElement(
        'div'
      );


    safety.className =
      'v7-safety';


    safety.textContent =
      '🔒 READ ONLY · ZERO WRITE';


    const wrapper =
      document.createElement(
        'div'
      );


    wrapper.id =
      WRAPPER_ID;


    const button =
      document.createElement(
        'button'
      );


    button.id =
      BUTTON_ID;


    button.type =
      'button';


    button.textContent =
      '🔬 INSPECT PRODUCTION RUNTIME';


    const status =
      document.createElement(
        'div'
      );


    status.id =
      STATUS_ID;


    status.textContent =
      'V7 mounted · waiting for manual inspection.';


    const diagnostic =
      document.createElement(
        'div'
      );


    diagnostic.id =
      DIAGNOSTIC_ID;


    wrapper.appendChild(
      button
    );


    card.appendChild(
      title
    );


    card.appendChild(
      sub
    );


    card.appendChild(
      safety
    );


    card.appendChild(
      wrapper
    );


    card.appendChild(
      status
    );


    card.appendChild(
      diagnostic
    );


    panel.appendChild(
      card
    );


    button.addEventListener(
      'click',
      runInspection
    );


    return {

      panel:
        panel,

      button:
        button

    };

  }


  /*
   * =========================================================
   * STABLE MOUNT
   * =========================================================
   */

  function mountV7() {

    mountAttempts += 1;


    /*
     * CRITICAL V7 RULE:
     *
     * First verify that tab-settings exists.
     *
     * We do NOT remove an existing Bootstrap panel
     * before the destination is confirmed.
     */

    const settings =
      document.getElementById(
        SETTINGS_ID
      );


    if (!settings) {

      console.warn(
        'Production Bootstrap V7: tab-settings not ready · attempt',
        mountAttempts
      );


      if (
        mountAttempts <
        MAX_MOUNT_ATTEMPTS
      ) {

        window.setTimeout(
          mountV7,
          RETRY_DELAY_MS
        );

      }


      return;

    }


    installStyles();


    /*
     * Destination exists.
     * Now it is safe to inspect/remove stale copies.
     */

    const existingPanels =
      Array.from(
        document.querySelectorAll(
          '[id="' +
          PANEL_ID +
          '"]'
        )
      );


    existingPanels.forEach(
      function (
        panel
      ) {

        panel.remove();

      }
    );


    const created =
      createPanel();


    settings.appendChild(
      created.panel
    );


    /*
     * Save the actual nodes that V7 mounted.
     */

    mountedPanel =
      created.panel;


    mountedButton =
      created.button;


    /*
     * Verify after the browser has committed
     * the DOM insertion.
     *
     * IMPORTANT:
     * No diagnostic is rendered here.
     * The user still sees only the button.
     */

    window.requestAnimationFrame(
      function () {

        const livePanel =
          document.getElementById(
            PANEL_ID
          );


        const liveButton =
          document.getElementById(
            BUTTON_ID
          );


        const status =
          document.getElementById(
            STATUS_ID
          );


        const mountStable =
          Boolean(
            livePanel &&
            liveButton &&
            livePanel ===
              mountedPanel &&
            liveButton ===
              mountedButton &&
            livePanel.isConnected &&
            liveButton.isConnected
          );


        if (status) {

          status.textContent =
            mountStable
              ? 'V7 mounted · waiting for manual inspection.'
              : '⚠️ V7 mount changed after insertion.';

        }


        window
          .LAST_FIX03D59_PRODUCTION_BOOTSTRAP_V7_MOUNT =
          {

            version:
              VERSION,

            mountedAt:
              new Date()
                .toISOString(),

            stable:
              mountStable,

            panelConnected:
              Boolean(
                livePanel &&
                livePanel.isConnected
              ),

            buttonConnected:
              Boolean(
                liveButton &&
                liveButton.isConnected
              ),

            panelCount:
              countId(
                PANEL_ID
              ),

            buttonCount:
              countId(
                BUTTON_ID
              )

          };

      }
    );

  }


  /*
   * =========================================================
   * INIT
   * =========================================================
   */

  function init() {

    mountV7();

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
    'FIX-03D5.9 Production Bootstrap Mobile V7 loaded — STABLE MOUNT + MANUAL INSPECTION'
  );

})();
