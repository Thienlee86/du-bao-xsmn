/* =========================================================================
   FIX-03D5.9 STEP 8.4F-L
   MOBILE LIFECYCLE TEST UI

   PURPOSE:
   - Test 8.4F-L directly on mobile.
   - No DevTools Console required.
   - Display lifecycle result on screen.

   TEST ONLY
   READ ONLY
   ZERO WRITE
   ========================================================================= */

(function () {

  'use strict';


  function yesNo84FLTest(value) {

    return value
      ? 'YES ✅'
      : 'NO ❌';

  }


  function safeText84FLTest(value) {

    return String(
      value ?? '--'
    )
      .replace(
        /&/g,
        '&amp;'
      )
      .replace(
        /</g,
        '&lt;'
      )
      .replace(
        />/g,
        '&gt;'
      );

  }


  function runLifecycleTest84FL() {

    const output =
      document.getElementById(
        'fix03d59-84fl-test-output'
      );


    if (
      typeof window
        .inspectProductionForecastLifecycle84FL !==
      'function'
    ) {

      output.innerHTML = `
        <div class="fix84fl-error">
          ❌ 8.4F-L Lifecycle Gate chưa được tải.
        </div>
      `;

      return;

    }


    let result;


    try {

      result =
        window
          .inspectProductionForecastLifecycle84FL();

    } catch (error) {

      output.innerHTML = `
        <div class="fix84fl-error">

          ❌ Lifecycle inspector gặp lỗi.

          <br><br>

          ${safeText84FLTest(
            error &&
            error.message
              ? error.message
              : error
          )}

        </div>
      `;

      return;

    }


    const hardLocksSafe =
      Boolean(
        result &&
        result.writeAuthorized === false &&
        result.productionWrite === false &&
        result.storageWrite === false &&
        result.integrationPerformed === false &&
        result.savePredictionCalled === false &&
        result.forecastCreated === false &&
        result.forecastModified === false &&
        result.candidateModified === false &&
        result.readOnly === true &&
        result.failClosed === true
      );


    output.innerHTML = `

      <div class="fix84fl-result">

        <div class="fix84fl-state">
          ${safeText84FLTest(
            result.lifecycleState
          )}
        </div>


        <div class="fix84fl-reason">
          ${safeText84FLTest(
            result.reason
          )}
        </div>


        <div class="fix84fl-grid">

          <div>
            <span>Forecast Exists</span>
            <b>
              ${yesNo84FLTest(
                result.forecastExists
              )}
            </b>
          </div>

          <div>
            <span>Forecast Valid</span>
            <b>
              ${yesNo84FLTest(
                result.forecastValid
              )}
            </b>
          </div>

          <div>
            <span>Mapping Preview</span>
            <b>
              ${yesNo84FLTest(
                result.mappingPreviewExists
              )}
            </b>
          </div>

          <div>
            <span>Mapping Ready</span>
            <b>
              ${yesNo84FLTest(
                result.mappingReady
              )}
            </b>
          </div>

        </div>


        <div class="fix84fl-locks">

          <div>
            Write Authorized:
            <b>
              ${yesNo84FLTest(
                result.writeAuthorized
              )}
            </b>
          </div>

          <div>
            Production Write:
            <b>
              ${yesNo84FLTest(
                result.productionWrite
              )}
            </b>
          </div>

          <div>
            Storage Write:
            <b>
              ${yesNo84FLTest(
                result.storageWrite
              )}
            </b>
          </div>

        </div>


        <div
          class="${
            hardLocksSafe
              ? 'fix84fl-safe'
              : 'fix84fl-danger'
          }"
        >

          ${
            hardLocksSafe
              ? '🔒 SAFETY LOCKS VERIFIED — ZERO WRITE'
              : '⚠️ SAFETY LOCK CHECK FAILED'
          }

        </div>

      </div>

    `;

  }


  function buildLifecycleTestUI84FL() {

    if (
      document.getElementById(
        'fix03d59-84fl-test-panel'
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


    const style =
      document.createElement(
        'style'
      );


    style.textContent = `

      #fix03d59-84fl-test-panel {
        margin: 18px 0 30px;
        padding: 18px;
        border-radius: 20px;
        background: #20264f;
        color: white;
      }

      #fix03d59-84fl-test-panel h3 {
        margin: 0 0 8px;
        font-size: 20px;
      }

      .fix84fl-sub {
        opacity: .72;
        font-size: 13px;
        line-height: 1.5;
        margin-bottom: 14px;
      }

      #fix03d59-84fl-test-button {
        width: 100%;
        border: 0;
        border-radius: 14px;
        padding: 14px;
        font-size: 16px;
        font-weight: 800;
        background: #ffc13d;
        color: #17182a;
      }

      #fix03d59-84fl-test-output {
        margin-top: 16px;
      }

      .fix84fl-result {
        background: rgba(255,255,255,.06);
        border-radius: 15px;
        padding: 14px;
      }

      .fix84fl-state {
        font-size: 22px;
        font-weight: 900;
        color: #ffc13d;
      }

      .fix84fl-reason {
        margin-top: 5px;
        opacity: .7;
        font-size: 12px;
        word-break: break-word;
      }

      .fix84fl-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-top: 15px;
      }

      .fix84fl-grid div {
        padding: 10px;
        border-radius: 10px;
        background: rgba(0,0,0,.15);
      }

      .fix84fl-grid span {
        display: block;
        opacity: .65;
        font-size: 11px;
      }

      .fix84fl-grid b {
        display: block;
        margin-top: 5px;
        font-size: 13px;
      }

      .fix84fl-locks {
        margin-top: 14px;
        line-height: 1.8;
        font-size: 13px;
      }

      .fix84fl-safe,
      .fix84fl-danger,
      .fix84fl-error {
        margin-top: 14px;
        padding: 12px;
        border-radius: 11px;
        font-weight: 800;
        line-height: 1.5;
      }

      .fix84fl-safe {
        background: rgba(45,200,120,.15);
      }

      .fix84fl-danger,
      .fix84fl-error {
        background: rgba(255,80,80,.15);
      }

    `;


    document.head.appendChild(
      style
    );


    const panel =
      document.createElement(
        'div'
      );


    panel.id =
      'fix03d59-84fl-test-panel';


    panel.innerHTML = `

      <h3>
        🧪 FIX-03D5.9 — 8.4F-L
      </h3>

      <div class="fix84fl-sub">
        Mobile Lifecycle Test · READ ONLY · ZERO WRITE
      </div>

      <button
        type="button"
        id="fix03d59-84fl-test-button"
      >
        🧪 TEST 8.4F-L
      </button>

      <div
        id="fix03d59-84fl-test-output"
      ></div>

    `;


    settings.appendChild(
      panel
    );


    document
      .getElementById(
        'fix03d59-84fl-test-button'
      )
      .addEventListener(
        'click',
        runLifecycleTest84FL
      );

  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      buildLifecycleTestUI84FL
    );

  } else {

    buildLifecycleTestUI84FL();

  }


  console.log(
    'FIX-03D5.9 STEP 8.4F-L Mobile Test UI loaded / TEST ONLY / ZERO WRITE'
  );

})();
