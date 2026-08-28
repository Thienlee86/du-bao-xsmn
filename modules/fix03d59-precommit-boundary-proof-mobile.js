/* =========================================================================
   FIX-03D5.9
   PRE-COMMIT BOUNDARY PROOF MOBILE V1

   FILE:
   modules/fix03d59-precommit-boundary-proof-mobile.js

   PURPOSE:
   - Prove at runtime that the REAL app.js Pre-Commit Gate executes BEFORE
     LAST_FORECAST commit.
   - Arm a ONE-SHOT fail-closed wrapper around:
       inspectFix03D59ProductionPreCommit()
   - The wrapper blocks exactly ONE gate call, then restores the original
     gate function immediately.
   - Provide a mobile UI in Settings for arming/disarming the proof.

   IMPORTANT:
   - RAM ONLY.
   - ZERO STORAGE WRITE.
   - ZERO savePrediction().
   - ZERO engine execution by this module.
   - Does NOT modify forecast candidate.
   - Does NOT modify LAST_FORECAST directly.
   - AUTO RESTORE after one call.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59_PRECOMMIT_BOUNDARY_PROOF_MOBILE_V1';


  const PANEL_ID =
    'fix03d59-precommit-boundary-proof-mobile-panel';


  const OUTPUT_ID =
    'fix03d59-precommit-boundary-proof-mobile-output';


  const ARM_BUTTON_ID =
    'fix03d59-precommit-boundary-proof-mobile-arm';


  const DISARM_BUTTON_ID =
    'fix03d59-precommit-boundary-proof-mobile-disarm';


  const GATE_NAME =
    'inspectFix03D59ProductionPreCommit';


  let originalGate =
    null;


  let armed =
    false;


  let consumed =
    false;


  function safeText(value) {

    if (
      value === null ||
      value === undefined ||
      value === ''
    ) {

      return '--';

    }

    return String(value);

  }


  function nowIso() {

    return new Date()
      .toISOString();

  }


  function publishState(extra) {

    const state =
      Object.assign(
        {

          version:
            VERSION,

          armed,

          consumed,

          originalGateAvailable:
            typeof originalGate ===
            'function',

          currentGateAvailable:
            typeof window[
              GATE_NAME
            ] ===
            'function',

          storageWrite:
            false,

          savePredictionCalled:
            false,

          engineExecuted:
            false,

          lastForecastModifiedDirectly:
            false,

          updatedAt:
            nowIso()

        },

        extra || {}

      );


    window
      .LAST_FIX03D59_PRECOMMIT_BOUNDARY_PROOF =
      state;


    return state;

  }


  function buildOneShotBlockResult(
    candidate,
    context
  ) {

    const result = {

      ready:
        false,

      passed:
        false,

      authorized:
        false,

      reason:
        'BOUNDARY_PROOF_ONE_SHOT_BLOCK',

      version:
        VERSION,

      mode:
        'PRECOMMIT_BOUNDARY_PROOF',

      proof: {

        oneShot:
          true,

        candidateReceived:
          Boolean(
            candidate &&
            typeof candidate ===
              'object'
          ),

        selectedProvince:
          context &&
          context.selectedProvince
            ? String(
                context.selectedProvince
              )
            : null,

        windowSize:
          context &&
          context.windowSize != null
            ? Number(
                context.windowSize
              )
            : null,

        blockedAt:
          nowIso()

      },

      safety: {

        candidateModified:
          false,

        lastForecastModified:
          false,

        productionWrite:
          false,

        storageWrite:
          false,

        savePredictionCalled:
          false,

        commitPerformed:
          false,

        engineExecuted:
          false

      },

      failClosed:
        true,

      inspectedAt:
        nowIso()

    };


    window
      .LAST_FIX03D59_PRODUCTION_PRECOMMIT =
      result;


    return result;

  }


  function renderState() {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {

      return;

    }


    const state =
      window
        .LAST_FIX03D59_PRECOMMIT_BOUNDARY_PROOF ||
      publishState({

        reason:
          'BOUNDARY_PROOF_READY'

      });


    const color =
      state.armed
        ? '#ffbd3c'
        : (
            state.consumed
              ? '#8ff0bd'
              : '#d8def7'
          );


    output.innerHTML = `

      <div
        style="
          margin-top:16px;
          padding:16px;
          border-radius:16px;
          background:rgba(0,0,0,.18);
          line-height:1.7;
        "
      >

        <div
          style="
            font-size:18px;
            font-weight:900;
            color:${color};
            margin-bottom:10px;
          "
        >
          ${
            state.armed
              ? '🟠 ONE-SHOT BLOCK ARMED'
              : (
                  state.consumed
                    ? '✅ ONE-SHOT BLOCK CONSUMED'
                    : '⚪ PROOF NOT ARMED'
                )
          }
        </div>

        <div>
          <b>Reason:</b>
          ${safeText(
            state.reason
          )}
        </div>

        <div>
          <b>Original Gate:</b>
          ${
            state.originalGateAvailable
              ? 'YES ✅'
              : 'NO ❌'
          }
        </div>

        <div>
          <b>Current Gate:</b>
          ${
            state.currentGateAvailable
              ? 'YES ✅'
              : 'NO ❌'
          }
        </div>

        <div>
          <b>Consumed:</b>
          ${
            state.consumed
              ? 'YES ✅'
              : 'NO'
          }
        </div>

        <div
          style="
            margin-top:12px;
            padding:12px;
            border-radius:12px;
            background:rgba(52,211,153,.10);
            color:#caffdf;
            font-size:13px;
            font-weight:800;
          "
        >
          🔒 RAM ONLY
          <br>
          🔒 ZERO STORAGE WRITE
          <br>
          🔒 ZERO savePrediction()
          <br>
          🔒 DOES NOT MODIFY LAST_FORECAST DIRECTLY
        </div>

      </div>

    `;

  }


  function armOneShotBoundaryProof() {

    const currentGate =
      window[
        GATE_NAME
      ];


    if (
      typeof currentGate !==
      'function'
    ) {

      publishState({

        reason:
          'PRECOMMIT_GATE_NOT_AVAILABLE'

      });


      renderState();

      return false;

    }


    if (armed) {

      publishState({

        reason:
          'BOUNDARY_PROOF_ALREADY_ARMED'

      });


      renderState();

      return true;

    }


    originalGate =
      currentGate;


    consumed =
      false;


    const oneShotGate =
      function (
        candidate,
        context
      ) {

        if (!armed) {

          return originalGate(
            candidate,
            context
          );

        }


        consumed =
          true;


        const blockedResult =
          buildOneShotBlockResult(
            candidate,
            context || {}
          );


        window[
          GATE_NAME
        ] =
          originalGate;


        armed =
          false;


        publishState({

          reason:
            'ONE_SHOT_BLOCK_CONSUMED',

          blockedResult

        });


        renderState();


        return blockedResult;

      };


    window[
      GATE_NAME
    ] =
      oneShotGate;


    armed =
      true;


    publishState({

      reason:
        'ONE_SHOT_PRECOMMIT_BLOCK_ARMED'

    });


    renderState();


    return true;

  }


  function disarmBoundaryProof() {

    if (
      typeof originalGate ===
      'function'
    ) {

      window[
        GATE_NAME
      ] =
        originalGate;

    }


    armed =
      false;


    publishState({

      reason:
        consumed
          ? 'ONE_SHOT_BLOCK_CONSUMED_AND_GATE_RESTORED'
          : 'BOUNDARY_PROOF_DISARMED_AND_GATE_RESTORED'

    });


    renderState();


    return true;

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

      return;

    }


    const panel =
      document.createElement(
        'div'
      );


    panel.id =
      PANEL_ID;


    panel.style.cssText = [

      'margin:22px 24px 32px',

      'padding:22px',

      'border-radius:26px',

      'background:linear-gradient(145deg,#20294f,#1b2345)',

      'border:1px solid rgba(255,189,60,.30)',

      'color:#ffffff',

      'box-sizing:border-box'

    ].join(';');


    panel.innerHTML = `

      <div
        style="
          font-size:24px;
          font-weight:950;
          line-height:1.25;
        "
      >
        🧪 Pre-Commit Boundary Proof
      </div>


      <div
        style="
          margin-top:10px;
          color:rgba(255,255,255,.70);
          line-height:1.6;
          font-size:15px;
        "
      >
        One-shot runtime proof that app.js blocks
        LAST_FORECAST commit when the Pre-Commit Gate rejects.
      </div>


      <div
        style="
          margin-top:8px;
          color:#8ff0bd;
          font-size:13px;
          font-weight:900;
        "
      >
        RAM ONLY · ONE SHOT · AUTO RESTORE · FAIL CLOSED
      </div>


      <div
        id="${ARM_BUTTON_ID}"
        role="button"
        tabindex="0"
        style="
          display:flex;
          align-items:center;
          justify-content:center;
          width:100%;
          min-height:68px;
          margin-top:20px;
          padding:16px;
          border-radius:18px;
          background:linear-gradient(90deg,#ffbf38,#ff963d);
          color:#17182a;
          font-size:17px;
          font-weight:950;
          text-align:center;
          box-sizing:border-box;
          cursor:pointer;
        "
      >
        🧪 ARM ONE-SHOT PRECOMMIT BLOCK
      </div>


      <div
        id="${DISARM_BUTTON_ID}"
        role="button"
        tabindex="0"
        style="
          display:flex;
          align-items:center;
          justify-content:center;
          width:100%;
          min-height:54px;
          margin-top:12px;
          padding:14px;
          border-radius:16px;
          background:rgba(255,255,255,.10);
          color:#ffffff;
          font-size:15px;
          font-weight:900;
          text-align:center;
          box-sizing:border-box;
          cursor:pointer;
        "
      >
        🔓 DISARM / RESTORE REAL GATE
      </div>


      <div
        id="${OUTPUT_ID}"
      ></div>

    `;


    settings.appendChild(
      panel
    );


    const armButton =
      document.getElementById(
        ARM_BUTTON_ID
      );


    const disarmButton =
      document.getElementById(
        DISARM_BUTTON_ID
      );


    if (armButton) {

      armButton.addEventListener(
        'click',
        armOneShotBoundaryProof
      );

    }


    if (disarmButton) {

      disarmButton.addEventListener(
        'click',
        disarmBoundaryProof
      );

    }


    publishState({

      reason:
        'BOUNDARY_PROOF_READY'

    });


    renderState();

  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      buildPanel,
      {
        once:
          true
      }
    );

  } else {

    window.setTimeout(
      buildPanel,
      300
    );

  }


  window
    .armFix03D59PreCommitBoundaryProof =
    armOneShotBoundaryProof;


  window
    .disarmFix03D59PreCommitBoundaryProof =
    disarmBoundaryProof;


  window
    .rebuildFix03D59PreCommitBoundaryProofMobile =
    buildPanel;


  window
    .FIX03D59_PRECOMMIT_BOUNDARY_PROOF_MOBILE_LOADED =
    true;


  window
    .FIX03D59_PRECOMMIT_BOUNDARY_PROOF_MOBILE_VERSION =
    VERSION;


  console.log(
    'FIX-03D5.9 Pre-Commit Boundary Proof Mobile V1 loaded / ONE SHOT / RAM ONLY / AUTO RESTORE'
  );

})();
