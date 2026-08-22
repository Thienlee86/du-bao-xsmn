/* =========================================================================
   FIX-03D5.9 — STEP 8.3B INTEGRATION SHADOW MOBILE V1
   FILE:
   modules/fix03d59-83b-integration-shadow-mobile.js

   PURPOSE:
   - Run STEP 8.3B Integration Shadow from mobile.
   - Display B8 verified scope and shadow candidate scope.
   - Verify the future STEP 8.3B scope without modifying Production.
   - No DevTools required.

   IMPORTANT:
   - READ ONLY.
   - SHADOW ONLY.
   - ZERO PRODUCTION WRITE.
   - ZERO STORAGE WRITE.
   - NO ENGINE EXECUTION.
   - Does NOT modify STEP 8.3B.
   - Does NOT modify STEP 8.3B candidates.
   - Does NOT modify LAST_FORECAST.
   - Does NOT call savePrediction().
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    '83B-INTEGRATION-SHADOW-MOBILE-V1';


  const PANEL_ID =
    'fix03d59-83b-integration-shadow-mobile-panel';


  const OUTPUT_ID =
    'fix03d59-83b-integration-shadow-mobile-output';


  const CONTROL_ID =
    'fix03d59-83b-integration-shadow-mobile-control';


  /* =========================================================
     HELPERS
     ========================================================= */

  function safeText83BShadowMobile(
    value
  ) {

    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {

      return '--';

    }


    if (
      Array.isArray(value)
    ) {

      return value.length
        ? value.join(', ')
        : '[empty]';

    }


    if (
      typeof value ===
        'object'
    ) {

      try {

        return JSON.stringify(
          value
        );

      } catch (error) {

        return '[object]';

      }

    }


    return String(value);

  }


  function escape83BShadowMobile(
    value
  ) {

    return safeText83BShadowMobile(
      value
    )
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  }


  function yesNo83BShadowMobile(
    value
  ) {

    return value === true
      ? 'YES ✅'
      : 'NO ❌';

  }


  function safeNo83BShadowMobile(
    value
  ) {

    return value === true
      ? 'YES ❌'
      : 'NO ✅';

  }


  /* =========================================================
     RESOLVE SHADOW FUNCTION
     ========================================================= */

  function resolve83BShadowMobile() {

    try {

      if (
        typeof window
          .buildStep83BIntegrationShadow03D59 ===
        'function'
      ) {

        return {

          ready: true,

          name:
            'buildStep83BIntegrationShadow03D59',

          fn:
            window
              .buildStep83BIntegrationShadow03D59

        };

      }

    } catch (error) {

      // FAIL CLOSED

    }


    try {

      if (
        typeof window
          .inspectStep83BIntegrationShadow03D59 ===
        'function'
      ) {

        return {

          ready: true,

          name:
            'inspectStep83BIntegrationShadow03D59',

          fn:
            window
              .inspectStep83BIntegrationShadow03D59

        };

      }

    } catch (error) {

      // FAIL CLOSED

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

  function render83BShadowMobile(
    result,
    functionName
  ) {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {

      return;

    }


    const resolver =
      result &&
      result.resolver
        ? result.resolver
        : {};


    const selected =
      result &&
      result.selected
        ? result.selected
        : {};


    const resolved =
      result &&
      result.resolved
        ? result.resolved
        : {};


    const shadow =
      result &&
      result.shadow
        ? result.shadow
        : {};


    const gate =
      result &&
      result.gate
        ? result.gate
        : {};


    const safety =
      result &&
      result.safety
        ? result.safety
        : {};


    const shadowReady =
      gate.shadowReady === true &&
      shadow.ready === true;


    let html = `

      <div
        style="
          margin-top:18px;
          padding:16px;
          border-radius:18px;
          background:rgba(0,0,0,.16);
          line-height:1.65;
        "
      >

        <div
          style="
            color:#ffbd3c;
            font-size:18px;
            font-weight:900;
          "
        >
          🪞 8.3B INTEGRATION SHADOW
        </div>

        <div style="margin-top:9px;">
          Mobile Version:
          <b>
            ${escape83BShadowMobile(
              VERSION
            )}
          </b>
        </div>

        <div>
          Shadow Function:
          <b>
            ${escape83BShadowMobile(
              functionName
            )}
          </b>
        </div>

        <div>
          Shadow Version:
          <b>
            ${escape83BShadowMobile(
              result &&
              result.version
            )}
          </b>
        </div>

      </div>


      <div
        style="
          margin-top:14px;
          padding:16px;
          border-radius:18px;
          background:rgba(59,130,246,.10);
          line-height:1.65;
        "
      >

        <div
          style="
            color:#ffbd3c;
            font-size:17px;
            font-weight:900;
          "
        >
          🧭 B8 RESOLVER
        </div>

        <div style="margin-top:8px;">
          Resolver Available:
          <b>
            ${yesNo83BShadowMobile(
              resolver.available
            )}
          </b>
        </div>

        <div>
          Resolver Ready:
          <b>
            ${yesNo83BShadowMobile(
              resolver.ready
            )}
          </b>
        </div>

        <div>
          Resolver Error:
          <b>
            ${escape83BShadowMobile(
              resolver.error
            )}
          </b>
        </div>

        <div>
          Source:
          <b>
            ${escape83BShadowMobile(
              resolver.source
            )}
          </b>
        </div>

        <div>
          Source Trusted:
          <b>
            ${yesNo83BShadowMobile(
              resolver.sourceTrusted
            )}
          </b>
        </div>

      </div>


      <div
        style="
          margin-top:14px;
          padding:16px;
          border-radius:18px;
          background:rgba(52,211,153,.09);
          line-height:1.65;
        "
      >

        <div
          style="
            color:#ffbd3c;
            font-size:17px;
            font-weight:900;
          "
        >
          🎯 VERIFIED SCOPE
        </div>

        <div style="margin-top:8px;">
          Selected Province:
          <b>
            ${escape83BShadowMobile(
              selected.province
            )}
          </b>
        </div>

        <div>
          Resolved Province:
          <b>
            ${escape83BShadowMobile(
              resolved.province
            )}
          </b>
        </div>

        <div>
          Selected = Resolved:
          <b>
            ${yesNo83BShadowMobile(
              resolved.matchesSelected
            )}
          </b>
        </div>

      </div>


      <div
        style="
          margin-top:14px;
          padding:16px;
          border-radius:18px;
          background:rgba(168,85,247,.10);
          border:1px solid rgba(168,85,247,.28);
          line-height:1.65;
        "
      >

        <div
          style="
            color:#ffbd3c;
            font-size:17px;
            font-weight:900;
          "
        >
          🪞 SHADOW CANDIDATE SCOPE
        </div>

        <div style="margin-top:8px;">
          Candidate Provinces:
          <b>
            ${escape83BShadowMobile(
              shadow.candidateProvinces
            )}
          </b>
        </div>

        <div>
          Candidate Count:
          <b>
            ${escape83BShadowMobile(
              shadow.candidateCount
            )}
          </b>
        </div>

        <div>
          Exactly One Province:
          <b>
            ${yesNo83BShadowMobile(
              shadow.exactlyOneProvince
            )}
          </b>
        </div>

        <div>
          Source Trusted:
          <b>
            ${yesNo83BShadowMobile(
              shadow.sourceTrusted
            )}
          </b>
        </div>

        <div>
          Selected = Resolved:
          <b>
            ${yesNo83BShadowMobile(
              shadow.selectedMatchesResolved
            )}
          </b>
        </div>

        <div>
          B8 Verified:
          <b>
            ${yesNo83BShadowMobile(
              shadow.b8Verified
            )}
          </b>
        </div>

      </div>

    `;


    html += `

      <div
        style="
          margin-top:16px;
          padding:18px;
          border-radius:20px;
          background:${
            shadowReady
              ? 'rgba(52,211,153,.16)'
              : 'rgba(248,113,113,.16)'
          };
          border:2px solid ${
            shadowReady
              ? '#34d399'
              : '#f87171'
          };
          line-height:1.65;
        "
      >

        <div
          style="
            font-size:19px;
            font-weight:900;
            color:${
              shadowReady
                ? '#9ff0c8'
                : '#ffaaaa'
            };
          "
        >

          ${
            shadowReady
              ? '🟢 SHADOW READY'
              : '🔴 SHADOW BLOCKED'
          }

        </div>


        <div style="margin-top:9px;">
          Shadow Ready:
          <b>
            ${yesNo83BShadowMobile(
              shadowReady
            )}
          </b>
        </div>


        <div>
          Reason:
          <b>
            ${escape83BShadowMobile(
              gate.reason
            )}
          </b>
        </div>


        <div>
          Integration Authorized:
          <b>
            ${safeNo83BShadowMobile(
              gate.integrationAuthorized
            )}
          </b>
        </div>


        <div>
          Production Write Authorized:
          <b>
            ${safeNo83BShadowMobile(
              gate.productionWriteAuthorized
            )}
          </b>
        </div>

      </div>


      <div
        style="
          margin-top:16px;
          padding:15px;
          border-radius:16px;
          background:rgba(14,116,144,.25);
          line-height:1.7;
          font-weight:800;
        "
      >

        🔒 SAFETY CONTRACT

        <br>

        Read Only:
        ${yesNo83BShadowMobile(
          safety.readOnly
        )}

        <br>

        Shadow Only:
        ${yesNo83BShadowMobile(
          safety.shadowOnly
        )}

        <br>

        Engine Executed:
        ${safeNo83BShadowMobile(
          safety.engineExecuted
        )}

        <br>

        Integration Executed:
        ${safeNo83BShadowMobile(
          safety.integrationExecuted
        )}

        <br>

        Write Authorized:
        ${safeNo83BShadowMobile(
          safety.writeAuthorized
        )}

        <br>

        Production Write:
        ${safeNo83BShadowMobile(
          safety.productionWrite
        )}

        <br>

        Storage Write:
        ${safeNo83BShadowMobile(
          safety.storageWrite
        )}

        <br>

        savePrediction Called:
        ${safeNo83BShadowMobile(
          safety.savePredictionCalled
        )}

        <br>

        LAST_FORECAST Modified:
        ${safeNo83BShadowMobile(
          safety.lastForecastModified
        )}

        <br>

        Candidates Modified:
        ${safeNo83BShadowMobile(
          safety.candidatesModified
        )}

      </div>

    `;


    output.innerHTML =
      html;

  }


  /* =========================================================
     RUN
     ========================================================= */

  function run83BIntegrationShadowMobile() {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {

      return null;

    }


    const shadow =
      resolve83BShadowMobile();


    if (!shadow.ready) {

      output.innerHTML = `

        <div
          style="
            margin-top:14px;
            padding:15px;
            border-radius:15px;
            background:rgba(248,113,113,.15);
            line-height:1.6;
          "
        >

          ❌ 8.3B INTEGRATION SHADOW NOT FOUND

          <br><br>

          buildStep83BIntegrationShadow03D59
          chưa có trong runtime.

        </div>

      `;


      return null;

    }


    try {

      const result =
        shadow.fn();


      if (!result) {

        throw new Error(
          'INTEGRATION_SHADOW_RETURNED_EMPTY_RESULT'
        );

      }


      render83BShadowMobile(
        result,
        shadow.name
      );


      return result;

    } catch (error) {

      output.innerHTML = `

        <div
          style="
            margin-top:14px;
            padding:15px;
            border-radius:15px;
            background:rgba(248,113,113,.15);
            line-height:1.6;
            word-break:break-word;
          "
        >

          ❌ 8.3B INTEGRATION SHADOW ERROR

          <br><br>

          ${escape83BShadowMobile(
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

  function build83BIntegrationShadowMobileUI() {

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


    const shadow =
      resolve83BShadowMobile();


    const panel =
      document.createElement(
        'div'
      );


    panel.id =
      PANEL_ID;


    panel.style.cssText = [
      'margin:18px 24px 30px',
      'padding:20px',
      'border-radius:24px',
      'background:linear-gradient(145deg,#242d67,#1b214b)',
      'border:1px solid rgba(168,85,247,.40)',
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
        🪞 8.3B INTEGRATION SHADOW
      </div>


      <div
        style="
          margin-top:9px;
          line-height:1.55;
          opacity:.78;
        "
      >
        Kiểm tra B8 Verified Scope →
        Shadow Candidate Scope trước khi
        thay đổi STEP 8.3B thật.
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

        Integration Shadow Script:

        <b
          style="
            color:${
              shadow.ready
                ? '#9ff0c8'
                : '#ff9b9b'
            };
          "
        >

          ${
            shadow.ready
              ? 'YES ✅'
              : 'NO ❌'
          }

        </b>

        <br>

        Function:

        <b>
          ${escape83BShadowMobile(
            shadow.name
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
          min-height:60px;
          margin-top:18px;
          padding:15px;
          border-radius:16px;
          background:linear-gradient(90deg,#c084fc,#8b5cf6);
          color:#ffffff;
          font-size:16px;
          font-weight:900;
          text-align:center;
          box-sizing:border-box;
          cursor:pointer;
          user-select:none;
        "
      >
        🪞 RUN 8.3B INTEGRATION SHADOW
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
        run83BIntegrationShadowMobile
      );


      control.addEventListener(
        'keydown',
        function (event) {

          if (
            event.key === 'Enter' ||
            event.key === ' '
          ) {

            event.preventDefault();

            run83BIntegrationShadowMobile();

          }

        }
      );

    }

  }


  /* =========================================================
     PUBLIC API
     ========================================================= */

  window
    .run83BIntegrationShadowMobile03D59 =
    run83BIntegrationShadowMobile;


  window
    .rebuild83BIntegrationShadowMobile03D59 =
    build83BIntegrationShadowMobileUI;


  window
    .FIX03D59_STEP83B_INTEGRATION_SHADOW_MOBILE_LOADED =
    true;


  window
    .FIX03D59_STEP83B_INTEGRATION_SHADOW_MOBILE_VERSION =
    VERSION;


  /* =========================================================
     INITIALIZE
     ========================================================= */

  function initialize83BIntegrationShadowMobile() {

    window.setTimeout(
      build83BIntegrationShadowMobileUI,
      700
    );

  }


  if (
    document.readyState ===
      'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      initialize83BIntegrationShadowMobile,
      {
        once: true
      }
    );

  } else {

    initialize83BIntegrationShadowMobile();

  }


  console.log(
    'FIX-03D5.9 STEP 8.3B Integration Shadow Mobile V1 loaded / READ ONLY / SHADOW ONLY / ZERO WRITE'
  );

})();
