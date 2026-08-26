/* =========================================================================
   FIX-03D5.9 — CAN THO DECISION → SHADOW TRACE MOBILE
   TEMPORARY DIAGNOSTIC

   PURPOSE:
   - Trace Can Tho through V2.6 Decision Layer.
   - Trace Can Tho through Shadow Decision Bridge.
   - READ ONLY.
   - ZERO WRITE.
   - NO PRODUCTION MODIFICATION.
   ========================================================================= */

(function () {

  'use strict';


  const PROVINCE =
    'can-tho';


  const PANEL_ID =
    'fix03d59-cantho-trace-panel';


  function safeText(value) {

    if (
      value === undefined ||
      value === null
    ) {

      return '--';

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

        return String(value);

      }

    }

    return String(value);

  }


  function getDecision() {

    /*
     * Preferred canonical getter.
     */

    if (
      typeof window
        .getProvinceDecisionV26 ===
      'function'
    ) {

      try {

        return window
          .getProvinceDecisionV26(
            PROVINCE
          );

      } catch (error) {

        return {
          ready: false,
          reason:
            'GET_DECISION_ERROR',
          error:
            String(
              error.message ||
              error
            )
        };

      }

    }


    /*
     * Fallback:
     * inspect LAST_PROVINCE_DECISION_V26.
     */

    const layer =
      window
        .LAST_PROVINCE_DECISION_V26;


    if (
      layer &&
      Array.isArray(
        layer.decisions
      )
    ) {

      const found =
        layer.decisions.find(
          item =>
            item &&
            (
              item.province ===
                PROVINCE ||
              item.provinceSlug ===
                PROVINCE
            )
        );


      if (found) {

        return found;

      }

    }


    return {
      ready: false,
      reason:
        'CAN_THO_DECISION_NOT_FOUND'
    };

  }


  function getShadow(
    decision
  ) {

    /*
     * Do not attempt Shadow unless
     * Can Tho is explicitly approved.
     */

    const action =
      decision &&
      (
        decision.action ||
        decision.decision ||
        decision.recommendation
      );


    if (
      action !==
      'RECOMMEND_ADAPTIVE'
    ) {

      return {
        ready: false,
        skipped: true,
        reason:
          'DECISION_NOT_ADAPTIVE'
      };

    }


    if (
      typeof window
        .buildShadowFromDecisionBridgeV26 !==
      'function'
    ) {

      return {
        ready: false,
        reason:
          'SHADOW_BRIDGE_FUNCTION_NOT_FOUND'
      };

    }


    try {

      return window
        .buildShadowFromDecisionBridgeV26(
          PROVINCE,
          'db'
        );

    } catch (error) {

      return {
        ready: false,
        reason:
          'SHADOW_BUILD_ERROR',
        error:
          String(
            error.message ||
            error
          )
      };

    }

  }


  function runTrace() {

    const output =
      document.getElementById(
        'fix03d59-cantho-trace-output'
      );


    if (!output) {

      return;

    }


    const decisionLayer =
      window
        .LAST_PROVINCE_DECISION_V26;


    const decision =
      getDecision();


    const shadow =
      getShadow(
        decision
      );


    const action =
      decision &&
      (
        decision.action ||
        decision.decision ||
        decision.recommendation
      );


    const decisionReady =
      Boolean(
        decision &&
        decision.ready
      );


    const shadowReady =
      Boolean(
        shadow &&
        shadow.ready
      );


    let verdict =
      '⚪ NOT READY';


    if (
      decisionReady &&
      action ===
        'RECOMMEND_ADAPTIVE' &&
      shadowReady
    ) {

      verdict =
        '🟢 PASS — DECISION + SHADOW READY';

    } else if (
      decisionReady &&
      action !==
        'RECOMMEND_ADAPTIVE'
    ) {

      verdict =
        '🟡 SAFE FALLBACK — ADAPTIVE NOT APPROVED';

    } else if (
      decisionReady &&
      action ===
        'RECOMMEND_ADAPTIVE' &&
      !shadowReady
    ) {

      verdict =
        '🔴 DECISION APPROVED BUT SHADOW NOT READY';

    }


    const lines = [];


    lines.push(
      '🧪 CAN THO V2.6 TRACE'
    );

    lines.push(
      ''
    );

    lines.push(
      'Province: Cần Thơ'
    );

    lines.push(
      'Slug: ' +
      PROVINCE
    );

    lines.push(
      ''
    );

    lines.push(
      '======================'
    );

    lines.push(
      'DECISION LAYER'
    );

    lines.push(
      '======================'
    );

    lines.push(
      ''
    );

    lines.push(
      'Layer Ready: ' +
      (
        decisionLayer &&
        decisionLayer.ready
          ? 'YES ✅'
          : 'NO ❌'
      )
    );

    lines.push(
      'Province Count: ' +
      safeText(
        decisionLayer &&
        decisionLayer.provinceCount
      )
    );

    lines.push(
      'Can Tho Decision Ready: ' +
      (
        decisionReady
          ? 'YES ✅'
          : 'NO ❌'
      )
    );

    lines.push(
      'Action: ' +
      safeText(
        action
      )
    );

    lines.push(
      'Model: ' +
      safeText(
        decision &&
        decision.model
      )
    );

    lines.push(
      'Window: ' +
      safeText(
        decision &&
        decision.window
      )
    );

    lines.push(
      'Gate Score: ' +
      safeText(
        decision &&
        decision.gateScore
      )
    );

    lines.push(
      'Tests: ' +
      safeText(
        decision &&
        decision.tests
      )
    );

    lines.push(
      'Reason: ' +
      safeText(
        decision &&
        decision.reason
      )
    );

    lines.push(
      ''
    );

    lines.push(
      '======================'
    );

    lines.push(
      'SHADOW BRIDGE'
    );

    lines.push(
      '======================'
    );

    lines.push(
      ''
    );

    lines.push(
      'Shadow Ready: ' +
      (
        shadowReady
          ? 'YES ✅'
          : 'NO ❌'
      )
    );

    lines.push(
      'Shadow Reason: ' +
      safeText(
        shadow &&
        shadow.reason
      )
    );

    lines.push(
      'Shadow Model: ' +
      safeText(
        shadow &&
        shadow.model
      )
    );

    lines.push(
      'Shadow Window: ' +
      safeText(
        shadow &&
        shadow.window
      )
    );

    lines.push(
      'History Count: ' +
      safeText(
        shadow &&
        shadow.historyCount
      )
    );

    lines.push(
      'Top 5: ' +
      safeText(
        shadow &&
        shadow.top5
      )
    );

    lines.push(
      ''
    );

    lines.push(
      '======================'
    );

    lines.push(
      'VERDICT'
    );

    lines.push(
      '======================'
    );

    lines.push(
      ''
    );

    lines.push(
      verdict
    );

    lines.push(
      ''
    );

    lines.push(
      'READ ONLY: YES'
    );

    lines.push(
      'PRODUCTION WRITE: NO'
    );


    output.textContent =
      lines.join('\n');


    console.log(
      'FIX03D59 CAN THO TRACE',
      {
        decisionLayer,
        decision,
        shadow,
        verdict
      }
    );

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
        'Can Tho Trace: tab-settings not found'
      );

      return;

    }


    const panel =
      document.createElement(
        'section'
      );


    panel.id =
      PANEL_ID;


    panel.style.cssText =
      'margin:24px;' +
      'padding:22px;' +
      'border-radius:22px;' +
      'background:linear-gradient(145deg,#202757,#171c40);' +
      'border:1px solid rgba(255,189,60,.35);' +
      'color:#fff;';


    panel.innerHTML = `

      <div
        style="
          font-size:22px;
          font-weight:900;
          margin-bottom:8px;
        "
      >
        🧪 Cần Thơ V2.6 Trace
      </div>

      <div
        style="
          color:#b9bfdc;
          line-height:1.55;
          margin-bottom:18px;
        "
      >
        Decision Layer → Shadow Bridge.
        Temporary diagnostic · READ ONLY.
      </div>

      <button
        type="button"
        id="fix03d59-cantho-trace-run"
        style="
          display:block;
          width:100%;
          min-height:58px;
          border:0;
          border-radius:16px;
          padding:16px;
          background:linear-gradient(90deg,#ffbd3c,#ff8b3d);
          color:#17192f;
          font-size:17px;
          font-weight:900;
          cursor:pointer;
        "
      >
        🧪 TRACE CẦN THƠ
      </button>

      <pre
        id="fix03d59-cantho-trace-output"
        style="
          margin-top:16px;
          padding:14px;
          border-radius:14px;
          background:rgba(0,0,0,.18);
          color:#d9dcf2;
          white-space:pre-wrap;
          word-break:break-word;
          font-size:13px;
          line-height:1.65;
        "
      >Chưa chạy kiểm tra.</pre>

    `;


    settings.appendChild(
      panel
    );


    const button =
      document.getElementById(
        'fix03d59-cantho-trace-run'
      );


    if (button) {

      button.addEventListener(
        'click',
        runTrace
      );

    }

  }


 function startCanThoTraceMobile() {

    /*
     * FIX-03D5.9 — CAN THO AUTO TRACE V3
     *
     * PURPOSE:
     * - Build panel normally.
     * - Do NOT depend on the Trace button.
     * - Run trace repeatedly during startup.
     * - Observe whether the button is later removed.
     * - READ ONLY / ZERO PRODUCTION WRITE.
     */

    buildPanel();


    const CHECK_TIMES = [
      100,
      500,
      1500,
      3000,
      6000
    ];


    CHECK_TIMES.forEach(
      function (
        delay
      ) {

        setTimeout(
          function () {

            const panel =
              document.getElementById(
                PANEL_ID
              );


            const button =
              document.getElementById(
                'fix03d59-cantho-trace-run'
              );


            const output =
              document.getElementById(
                'fix03d59-cantho-trace-output'
              );


            console.log(
              'FIX03D59 CAN THO AUTO TRACE V3',
              {
                delay,
                panelExists:
                  Boolean(panel),
                buttonExists:
                  Boolean(button),
                outputExists:
                  Boolean(output),
                buttonConnected:
                  Boolean(
                    button &&
                    button.isConnected
                  )
              }
            );


            /*
             * IMPORTANT:
             * Trace does not depend on button existence.
             */

            if (output) {

              try {

                runTrace();

              } catch (error) {

                output.textContent =
                  '❌ AUTO TRACE ERROR\n\n' +
                  String(
                    error &&
                    error.message
                      ? error.message
                      : error
                  );

              }

            }

          },
          delay
        );

      }
    );


    /*
     * Observe DOM removals.
     * Diagnostic only.
     * Does NOT restore removed elements.
     */

    const observer =
      new MutationObserver(
        function (
          mutations
        ) {

          mutations.forEach(
            function (
              mutation
            ) {

              mutation.removedNodes
                .forEach(
                  function (
                    node
                  ) {

                    if (
                      !node ||
                      node.nodeType !== 1
                    ) {

                      return;

                    }


                    const removedButton =
                      node.id ===
                        'fix03d59-cantho-trace-run' ||
                      (
                        typeof node.querySelector ===
                          'function' &&
                        node.querySelector(
                          '#fix03d59-cantho-trace-run'
                        )
                      );


                    if (
                      removedButton
                    ) {

                      console.warn(
                        '🚨 FIX03D59 CAN THO TRACE BUTTON REMOVED',
                        {
                          removedNode:
                            node,
                          parent:
                            mutation.target
                        }
                      );

                    }

                  }
                );

            }
          );

        }
      );


    observer.observe(
      document.body,
      {
        childList: true,
        subtree: true
      }
    );


    /*
     * Diagnostic observer only needs
     * to stay alive during startup.
     */

    setTimeout(
      function () {

        observer.disconnect();

        console.log(
          'FIX03D59 CAN THO AUTO TRACE V3 observer stopped'
        );

      },
      10000
    );

 }    


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      startCanThoTraceMobile
    );

  } else {

    startCanThoTraceMobile();

  }


  window.runCanThoTrace03D59 =
    runTrace;

})();

