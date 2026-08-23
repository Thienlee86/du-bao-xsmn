/* =========================================================================
   FIX-03D5.9
   PRODUCTION BOOTSTRAP — MOBILE V6
   LIVE DOM IDENTITY TRACE

   PURPOSE:
   - Trace the real DOM identity of the Bootstrap inspect button.
   - Detect detached / replaced nodes.
   - Compare direct references with live document lookup.
   - Observe DOM replacement after panel insertion.
   - Identify whether another runtime rebuild removes/replaces the button.

   READ ONLY
   ZERO WRITE TO PRODUCTION
   ZERO PROMOTION
   ZERO PRODUCTION EXECUTION
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_PRODUCTION_BOOTSTRAP_MOBILE_V6';


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


  /*
   * Give each DOM node a temporary diagnostic identity.
   *
   * This does NOT write application data.
   * WeakMap exists only in this V6 runtime.
   */

  const nodeIds =
    new WeakMap();


  let nodeSequence =
    0;


  function getNodeIdentity(
    node
  ) {

    if (!node) {

      return '--';

    }


    if (
      !nodeIds.has(
        node
      )
    ) {

      nodeSequence += 1;


      nodeIds.set(
        node,
        'NODE-' + nodeSequence
      );

    }


    return nodeIds.get(
      node
    );

  }


  function describeNode(
    node
  ) {

    if (!node) {

      return {

        exists: false,

        identity:
          '--',

        tag:
          '--',

        id:
          '--',

        connected:
          false,

        parentTag:
          '--',

        parentId:
          '--',

        width:
          0,

        height:
          0

      };

    }


    const rect =
      node.getBoundingClientRect();


    const parent =
      node.parentElement;


    return {

      exists: true,

      identity:
        getNodeIdentity(
          node
        ),

      tag:
        node.tagName ||
        '--',

      id:
        node.id ||
        '--',

      connected:
        node.isConnected === true,

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

      width:
        Math.round(
          rect.width
        ),

      height:
        Math.round(
          rect.height
        )

    };

  }


  function sameNode(
    a,
    b
  ) {

    return Boolean(
      a &&
      b &&
      a === b
    );

  }


  /*
   * =========================================================
   * V6 TRACE STATE
   * =========================================================
   */

  const traceState = {

    createdAt:
      new Date().toISOString(),

    direct: {},

    snapshots: [],

    mutations: [],

    observerStarted:
      false

  };


  function addSnapshot(
    label,
    directPanel,
    directCard,
    directWrapper,
    directButton
  ) {

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


    traceState.snapshots.push({

      label:
        label,

      time:
        new Date().toISOString(),

      direct: {

        panel:
          describeNode(
            directPanel
          ),

        card:
          describeNode(
            directCard
          ),

        wrapper:
          describeNode(
            directWrapper
          ),

        button:
          describeNode(
            directButton
          )

      },

      live: {

        panel:
          describeNode(
            livePanel
          ),

        card:
          describeNode(
            liveCard
          ),

        wrapper:
          describeNode(
            liveWrapper
          ),

        button:
          describeNode(
            liveButton
          )

      },

      identityMatch: {

        panel:
          sameNode(
            directPanel,
            livePanel
          ),

        card:
          sameNode(
            directCard,
            liveCard
          ),

        wrapper:
          sameNode(
            directWrapper,
            liveWrapper
          ),

        button:
          sameNode(
            directButton,
            liveButton
          )

      }

    });


    renderDiagnostic();

  }


  /*
   * =========================================================
   * MUTATION OBSERVER
   * =========================================================
   */

  function nodeContainsTarget(
    node
  ) {

    if (
      !node ||
      node.nodeType !== 1
    ) {

      return false;

    }


    if (
      node.id === PANEL_ID ||
      node.id === CARD_ID ||
      node.id === WRAPPER_ID ||
      node.id === BUTTON_ID
    ) {

      return true;

    }


    if (
      typeof node.querySelector !==
      'function'
    ) {

      return false;

    }


    return Boolean(

      node.querySelector(
        '#' + PANEL_ID
      ) ||

      node.querySelector(
        '#' + CARD_ID
      ) ||

      node.querySelector(
        '#' + WRAPPER_ID
      ) ||

      node.querySelector(
        '#' + BUTTON_ID
      )

    );

  }


  function describeMutationNode(
    node
  ) {

    if (
      !node ||
      node.nodeType !== 1
    ) {

      return null;

    }


    return {

      identity:
        getNodeIdentity(
          node
        ),

      tag:
        node.tagName ||
        '--',

      id:
        node.id ||
        '--',

      connected:
        node.isConnected === true

    };

  }


  function startObserver() {

    if (
      traceState.observerStarted
    ) {

      return;

    }


    if (
      typeof MutationObserver !==
      'function'
    ) {

      return;

    }


    traceState.observerStarted =
      true;


    const observer =
      new MutationObserver(
        function (
          mutations
        ) {

          let importantChange =
            false;


          mutations.forEach(
            function (
              mutation
            ) {

              const removed =
                Array.from(
                  mutation.removedNodes ||
                  []
                )
                  .filter(
                    nodeContainsTarget
                  )
                  .map(
                    describeMutationNode
                  )
                  .filter(Boolean);


              const added =
                Array.from(
                  mutation.addedNodes ||
                  []
                )
                  .filter(
                    nodeContainsTarget
                  )
                  .map(
                    describeMutationNode
                  )
                  .filter(Boolean);


              if (
                removed.length ||
                added.length
              ) {

                importantChange =
                  true;


                traceState
                  .mutations
                  .push({

                    time:
                      new Date()
                        .toISOString(),

                    target:
                      describeMutationNode(
                        mutation.target
                      ),

                    removed:
                      removed,

                    added:
                      added

                  });

              }

            }
          );


          if (
            importantChange
          ) {

            addSnapshot(
              'MUTATION DETECTED',
              traceState.direct.panel,
              traceState.direct.card,
              traceState.direct.wrapper,
              traceState.direct.button
            );

          }

        }
      );


    observer.observe(
      document.documentElement,
      {

        childList: true,

        subtree: true

      }
    );


    window
      .FIX03D59_PRODUCTION_BOOTSTRAP_V6_OBSERVER =
      observer;

  }


  /*
   * =========================================================
   * RENDER DIAGNOSTIC
   * =========================================================
   */

  function renderNodeBlock(
    title,
    directInfo,
    liveInfo,
    match
  ) {

    return `

      <div class="v6-node">

        <div class="v6-node-title">
          ${escapeHtml(
            title
          )}
        </div>


        <div>
          DIRECT:
          <b>
            ${escapeHtml(
              directInfo.identity
            )}
          </b>

          · Connected:
          <strong class="${
            directInfo.connected
              ? 'v6-ok'
              : 'v6-fail'
          }">
            ${yesNo(
              directInfo.connected
            )}
          </strong>
        </div>


        <div>
          LIVE LOOKUP:
          <b>
            ${escapeHtml(
              liveInfo.identity
            )}
          </b>

          · Connected:
          <strong class="${
            liveInfo.connected
              ? 'v6-ok'
              : 'v6-fail'
          }">
            ${yesNo(
              liveInfo.connected
            )}
          </strong>
        </div>


        <div>
          SAME NODE:
          <strong class="${
            match
              ? 'v6-ok'
              : 'v6-fail'
          }">
            ${yesNo(
              match
            )}
          </strong>
        </div>


        <div>
          Direct size:
          <b>
            ${directInfo.width}
            ×
            ${directInfo.height}px
          </b>
        </div>


        <div>
          Live size:
          <b>
            ${liveInfo.width}
            ×
            ${liveInfo.height}px
          </b>
        </div>


        <div class="v6-small">
          Direct parent:
          ${escapeHtml(
            directInfo.parentTag
          )}
          #
          ${escapeHtml(
            directInfo.parentId
          )}
        </div>


        <div class="v6-small">
          Live parent:
          ${escapeHtml(
            liveInfo.parentTag
          )}
          #
          ${escapeHtml(
            liveInfo.parentId
          )}
        </div>

      </div>

    `;

  }


  function renderDiagnostic() {

    const diagnostic =
      document.getElementById(
        DIAGNOSTIC_ID
      );


    if (!diagnostic) {

      return;

    }


    const latest =
      traceState.snapshots[
        traceState.snapshots.length - 1
      ];


    if (!latest) {

      diagnostic.innerHTML =
        'V6 trace waiting...';

      return;

    }


    const d =
      latest.direct;


    const l =
      latest.live;


    const m =
      latest.identityMatch;


    let conclusion =
      'NO IDENTITY BREAK DETECTED';


    if (
      !m.button
    ) {

      conclusion =
        'BUTTON IDENTITY CHANGED / REPLACED';

    } else if (
      !d.button.connected
    ) {

      conclusion =
        'DIRECT BUTTON DETACHED';

    } else if (
      !l.button.connected
    ) {

      conclusion =
        'LIVE BUTTON NOT CONNECTED';

    }


    const mutationHtml =
      traceState.mutations.length
        ? traceState.mutations
            .slice(-5)
            .map(
              function (
                item,
                index
              ) {

                return `

                  <div class="v6-mutation">

                    <b>
                      Mutation ${
                        traceState
                          .mutations
                          .length -
                        Math.min(
                          5,
                          traceState
                            .mutations
                            .length
                        ) +
                        index +
                        1
                      }
                    </b>

                    <br>

                    Removed targets:
                    ${
                      item.removed.length
                    }

                    <br>

                    Added targets:
                    ${
                      item.added.length
                    }

                    <br>

                    Mutation parent:
                    ${
                      item.target
                        ? escapeHtml(
                            item.target.tag +
                            '#' +
                            item.target.id
                          )
                        : '--'
                    }

                  </div>

                `;

              }
            )
            .join('')
        : `

            <div class="v6-small">
              No target replacement mutation
              detected yet.
            </div>

          `;


    diagnostic.innerHTML = `

      <div class="v6-diagnostic-title">
        🧬 MOBILE V6 LIVE DOM IDENTITY TRACE
      </div>


      <div class="v6-snapshot">

        Snapshot:
        <b>
          ${escapeHtml(
            latest.label
          )}
        </b>

      </div>


      ${renderNodeBlock(
        'PANEL',
        d.panel,
        l.panel,
        m.panel
      )}


      ${renderNodeBlock(
        'CARD',
        d.card,
        l.card,
        m.card
      )}


      ${renderNodeBlock(
        'BUTTON WRAPPER',
        d.wrapper,
        l.wrapper,
        m.wrapper
      )}


      ${renderNodeBlock(
        'BUTTON',
        d.button,
        l.button,
        m.button
      )}


      <div class="v6-section-title">
        MUTATION TRACE
      </div>


      ${mutationHtml}


      <div class="v6-conclusion">

        <b>
          V6 CONCLUSION
        </b>

        <br>

        ${escapeHtml(
          conclusion
        )}

      </div>

    `;


    window
      .LAST_FIX03D59_PRODUCTION_BOOTSTRAP_MOBILE =
      {

        version:
          VERSION,

        trace:
          traceState,

        latest:
          latest,

        conclusion:
          conclusion

      };

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
        margin: 24px 0 34px;
      }


      #${PANEL_ID} .v6-card {
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


      #${PANEL_ID} .v6-title {
        font-size: 23px;

        font-weight: 900;

        line-height: 1.35;
      }


      #${PANEL_ID} .v6-sub {
        margin-top: 14px;

        color:
          rgba(255,255,255,.68);

        line-height: 1.6;
      }


      #${PANEL_ID} .v6-safety {
        margin-top: 16px;

        color: #72e6ae;

        font-weight: 900;
      }


      #${WRAPPER_ID} {
        display: block;

        width: 100%;

        margin-top: 20px;
      }


      #${BUTTON_ID} {
        display: block;

        width: 100%;

        min-height: 56px;

        padding: 16px;

        border: 0;

        border-radius: 17px;

        background:
          linear-gradient(
            90deg,
            #ffbd3c,
            #ff913d
          );

        color: #17182a;

        font-size: 17px;

        font-weight: 900;
      }


      #${STATUS_ID} {
        margin-top: 16px;

        color:
          rgba(255,255,255,.75);
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


      #${PANEL_ID}
      .v6-diagnostic-title {
        font-size: 18px;

        font-weight: 900;

        margin-bottom: 14px;
      }


      #${PANEL_ID}
      .v6-snapshot {
        color: #ffbd3c;

        margin-bottom: 16px;
      }


      #${PANEL_ID}
      .v6-node {
        padding: 14px 0;

        border-bottom:
          1px solid
          rgba(255,255,255,.10);
      }


      #${PANEL_ID}
      .v6-node-title {
        font-weight: 900;

        font-size: 17px;

        margin-bottom: 8px;
      }


      #${PANEL_ID}
      .v6-ok {
        color: #72e6ae;
      }


      #${PANEL_ID}
      .v6-fail {
        color: #ff7185;
      }


      #${PANEL_ID}
      .v6-small {
        color:
          rgba(255,255,255,.65);

        font-size: 13px;
      }


      #${PANEL_ID}
      .v6-section-title {
        margin-top: 20px;

        color: #ffbd3c;

        font-size: 18px;

        font-weight: 900;
      }


      #${PANEL_ID}
      .v6-mutation {
        margin-top: 12px;

        padding: 12px;

        border-radius: 12px;

        background:
          rgba(255,255,255,.05);
      }


      #${PANEL_ID}
      .v6-conclusion {
        margin-top: 20px;

        padding: 15px;

        border-radius: 15px;

        border:
          1px solid
          rgba(255,189,60,.35);

        background:
          rgba(255,189,60,.08);

        color: #ffbd3c;

        font-weight: 800;
      }

    `;


    document.head.appendChild(
      style
    );

  }


  /*
   * =========================================================
   * BUILD PANEL
   * =========================================================
   */

  function buildPanel() {

    installStyles();


    const oldPanel =
      document.getElementById(
        PANEL_ID
      );


    if (oldPanel) {

      oldPanel.remove();

    }


    const settings =
      document.getElementById(
        'tab-settings'
      );


    if (!settings) {

      console.warn(
        'Production Bootstrap V6: tab-settings not found'
      );

      return;

    }


    /*
     * Start observer BEFORE inserting V6.
     */

    startObserver();


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


    card.className =
      'v6-card';


    const title =
      document.createElement(
        'div'
      );


    title.className =
      'v6-title';


    title.textContent =
      '🧬 PRODUCTION BOOTSTRAP V6';


    const sub =
      document.createElement(
        'div'
      );


    sub.className =
      'v6-sub';


    sub.innerHTML = `

      Live DOM Identity Trace.

      <br><br>

      Kiểm tra node nào thực sự tồn tại
      trong document và node nào bị
      detach hoặc replace sau khi tạo.

    `;


    const safety =
      document.createElement(
        'div'
      );


    safety.className =
      'v6-safety';


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
      'V6 loaded · Live identity trace active.';


    const diagnostic =
      document.createElement(
        'div'
      );


    diagnostic.id =
      DIAGNOSTIC_ID;


    diagnostic.textContent =
      'V6 trace starting...';


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


    /*
     * Save DIRECT references BEFORE insertion.
     */

    traceState.direct = {

      panel:
        panel,

      card:
        card,

      wrapper:
        wrapper,

      button:
        button

    };


    /*
     * Snapshot before insertion.
     */

    addSnapshot(
      'BEFORE APPEND',
      panel,
      card,
      wrapper,
      button
    );


    settings.appendChild(
      panel
    );


    /*
     * Snapshot immediately after insertion.
     */

    addSnapshot(
      'IMMEDIATELY AFTER APPEND',
      panel,
      card,
      wrapper,
      button
    );


    /*
     * Snapshot next browser frame.
     */

    window.requestAnimationFrame(
      function () {

        addSnapshot(
          'REQUEST ANIMATION FRAME 1',
          panel,
          card,
          wrapper,
          button
        );


        window.requestAnimationFrame(
          function () {

            addSnapshot(
              'REQUEST ANIMATION FRAME 2',
              panel,
              card,
              wrapper,
              button
            );

          }
        );

      }
    );


    /*
     * Delayed snapshots.
     */

    window.setTimeout(
      function () {

        addSnapshot(
          'AFTER 250MS',
          panel,
          card,
          wrapper,
          button
        );

      },
      250
    );


    window.setTimeout(
      function () {

        addSnapshot(
          'AFTER 1000MS',
          panel,
          card,
          wrapper,
          button
        );

      },
      1000
    );


    window.setTimeout(
      function () {

        addSnapshot(
          'AFTER 3000MS',
          panel,
          card,
          wrapper,
          button
        );

      },
      3000
    );


    /*
     * IMPORTANT:
     * Button is intentionally NOT connected to
     * Production execution in V6.
     *
     * Clicking it only records another identity snapshot.
     */

    button.addEventListener(
      'click',
      function () {

        addSnapshot(
          'MANUAL BUTTON CLICK',
          panel,
          card,
          wrapper,
          button
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
    'FIX-03D5.9 Production Bootstrap Mobile V6 loaded — LIVE DOM IDENTITY TRACE'
  );

})();
