/* =========================================================================
   FIX-03D5.9 — STEP 8.3B PRODUCTION INTEGRATION PREVIEW MOBILE V1
   FILE:
   modules/fix03d59-83b-production-integration-preview-mobile.js

   PURPOSE:
   - Run STEP 8.3B Production Integration Preview from mobile.
   - Display the result directly inside Settings.
   - No DevTools required.

   IMPORTANT:
   - READ ONLY.
   - ZERO PRODUCTION WRITE.
   - ZERO STORAGE WRITE.
   - NO ENGINE EXECUTION.
   - Does NOT modify LAST_FIX03D59_STEP83B_RESULT.
   - Does NOT modify STEP 8.3B candidates.
   - Does NOT modify LAST_FORECAST.
   - Does NOT call savePrediction().
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    '83B-PRODUCTION-INTEGRATION-PREVIEW-MOBILE-V1';


  const PANEL_ID =
    'fix03d59-83b-production-preview-mobile-panel';


  const OUTPUT_ID =
    'fix03d59-83b-production-preview-mobile-output';


  /* =========================================================
     HELPERS
     ========================================================= */

  function escapeHtml83BPreviewMobile(
    value
  ) {

    return String(
      value == null
        ? ''
        : value
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
      )
      .replace(
        /"/g,
        '&quot;'
      )
      .replace(
        /'/g,
        '&#039;'
      );

  }


  function yesNo83BPreviewMobile(
    value
  ) {

    return value === true
      ? 'YES ✅'
      : 'NO ❌';

  }


  function value83BPreviewMobile(
    value
  ) {

    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {

      return '—';

    }


    if (
      Array.isArray(
        value
      )
    ) {

      return value.length
        ? value.join(', ')
        : '[]';

    }


    return String(
      value
    );

  }


  /* =========================================================
     RENDER RESULT
     ========================================================= */

  function render83BProductionPreviewMobile(
    result
  ) {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {

      return;

    }


    if (!result) {

      output.innerHTML =
        '<div style="color:#ff8b8b;">❌ Preview returned no result.</div>';

      return;

    }


    const production =
      result.production ||
      {};


    const resolver =
      result.resolver ||
      {};


    const current83B =
      result.current83B ||
      {};


    const preview =
      result.preview ||
      {};


    const safety =
      result.safety ||
      {};


    const ready =
      result.ready === true;


    const readyText =
      ready
        ? 'PASS ✅'
        : 'BLOCKED ❌';


    const readyColor =
      ready
        ? '#68e39b'
        : '#ff8b8b';


    output.innerHTML = `

      <div
        style="
          margin-top:16px;
          padding:16px;
          border-radius:16px;
          background:rgba(255,255,255,.055);
          line-height:1.65;
          font-size:14px;
        "
      >

        <div
          style="
            font-size:19px;
            font-weight:900;
            color:${readyColor};
            margin-bottom:12px;
          "
        >
          ${readyText}
        </div>


        <div>
          <b>Reason:</b>
          ${escapeHtml83BPreviewMobile(
            value83BPreviewMobile(
              result.reason
            )
          )}
        </div>


        <hr
          style="
            border:0;
            border-top:1px solid rgba(255,255,255,.12);
            margin:14px 0;
          "
        >


        <div
          style="
            color:#ffbd3c;
            font-weight:800;
            margin-bottom:5px;
          "
        >
          🟣 Production
        </div>

        <div>
          Forecast exists:
          <b>
            ${yesNo83BPreviewMobile(
              production.forecastExists
            )}
          </b>
        </div>

        <div>
          Province:
          <b>
            ${escapeHtml83BPreviewMobile(
              value83BPreviewMobile(
                production.province
              )
            )}
          </b>
        </div>

        <div>
          Path ready:
          <b>
            ${yesNo83BPreviewMobile(
              production.pathReady
            )}
          </b>
        </div>


        <hr
          style="
            border:0;
            border-top:1px solid rgba(255,255,255,.12);
            margin:14px 0;
          "
        >


        <div
          style="
            color:#ffbd3c;
            font-weight:800;
            margin-bottom:5px;
          "
        >
          🧭 Scope Resolver
        </div>

        <div>
          Available:
          <b>
            ${yesNo83BPreviewMobile(
              resolver.available
            )}
          </b>
        </div>

        <div>
          Ready:
          <b>
            ${yesNo83BPreviewMobile(
              resolver.ready
            )}
          </b>
        </div>

        <div>
          Source:
          <b>
            ${escapeHtml83BPreviewMobile(
              value83BPreviewMobile(
                resolver.source
              )
            )}
          </b>
        </div>

        <div>
          Resolved scope:
          <b>
            ${escapeHtml83BPreviewMobile(
              value83BPreviewMobile(
                resolver.resolvedScope
              )
            )}
          </b>
        </div>

        <div>
          Resolved province:
          <b>
            ${escapeHtml83BPreviewMobile(
              value83BPreviewMobile(
                resolver.resolvedProvince
              )
            )}
          </b>
        </div>


        <hr
          style="
            border:0;
            border-top:1px solid rgba(255,255,255,.12);
            margin:14px 0;
          "
        >


        <div
          style="
            color:#ffbd3c;
            font-weight:800;
            margin-bottom:5px;
          "
        >
          🧩 Current STEP 8.3B
        </div>

        <div>
          Exists:
          <b>
            ${yesNo83BPreviewMobile(
              current83B.exists
            )}
          </b>
        </div>

        <div>
          Candidate count:
          <b>
            ${escapeHtml83BPreviewMobile(
              value83BPreviewMobile(
                current83B.candidateCount
              )
            )}
          </b>
        </div>

        <div>
          Candidate provinces:
          <b>
            ${escapeHtml83BPreviewMobile(
              value83BPreviewMobile(
                current83B.candidateProvinces
              )
            )}
          </b>
        </div>


        <hr
          style="
            border:0;
            border-top:1px solid rgba(255,255,255,.12);
            margin:14px 0;
          "
        >


        <div
          style="
            color:#ffbd3c;
            font-weight:800;
            margin-bottom:5px;
          "
        >
          🔬 Production Integration Preview
        </div>

        <div>
          Candidate count:
          <b>
            ${escapeHtml83BPreviewMobile(
              value83BPreviewMobile(
                preview.candidateCount
              )
            )}
          </b>
        </div>

        <div>
          Candidate provinces:
          <b>
            ${escapeHtml83BPreviewMobile(
              value83BPreviewMobile(
                preview.candidateProvinces
              )
            )}
          </b>
        </div>

        <div>
          Exactly one match:
          <b>
            ${yesNo83BPreviewMobile(
              preview.exactlyOneMatchingCandidate
            )}
          </b>
        </div>

        <div>
          Identity preserved:
          <b>
            ${yesNo83BPreviewMobile(
              preview.candidateIdentityPreserved
            )}
          </b>
        </div>

        <div>
          Single province:
          <b>
            ${yesNo83BPreviewMobile(
              preview.singleProvince
            )}
          </b>
        </div>

        <div>
          Scope reduction required:
          <b>
            ${yesNo83BPreviewMobile(
              preview.scopeReductionRequired
            )}
          </b>
        </div>


        <hr
          style="
            border:0;
            border-top:1px solid rgba(255,255,255,.12);
            margin:14px 0;
          "
        >


        <div
          style="
            color:#ffbd3c;
            font-weight:800;
            margin-bottom:5px;
          "
        >
          🛡️ Safety
        </div>

        <div>
          Read only:
          <b>
            ${yesNo83BPreviewMobile(
              safety.readOnly
            )}
          </b>
        </div>

        <div>
          Preview only:
          <b>
            ${yesNo83BPreviewMobile(
              safety.previewOnly
            )}
          </b>
        </div>

        <div>
          Engine executed:
          <b>
            ${yesNo83BPreviewMobile(
              safety.engineExecuted
            )}
          </b>
        </div>

        <div>
          Production write:
          <b>
            ${yesNo83BPreviewMobile(
              safety.productionWrite
            )}
          </b>
        </div>

        <div>
          Storage write:
          <b>
            ${yesNo83BPreviewMobile(
              safety.storageWrite
            )}
          </b>
        </div>

        <div>
          LAST_FORECAST modified:
          <b>
            ${yesNo83BPreviewMobile(
              safety.lastForecastModified
            )}
          </b>
        </div>

        <div>
          Candidates modified:
          <b>
            ${yesNo83BPreviewMobile(
              safety.candidatesModified
            )}
          </b>
        </div>

      </div>

    `;

  }


  /* =========================================================
     RUN PREVIEW
     ========================================================= */

  function run83BProductionPreviewMobile() {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {

      return;

    }


    if (
      typeof window
        .buildStep83BProductionIntegrationPreview03D59 !==
      'function'
    ) {

      output.innerHTML =
        '<div style="color:#ff8b8b;">❌ Production Integration Preview API chưa được tải.</div>';

      return;

    }


    output.innerHTML =
      '⏳ Đang chạy Production Integration Preview...';


    try {

      const result =
        window
          .buildStep83BProductionIntegrationPreview03D59();


      render83BProductionPreviewMobile(
        result
      );


    } catch (error) {

      console.error(
        '83B Production Preview Mobile:',
        error
      );


      output.innerHTML =
        '<div style="color:#ff8b8b;">❌ Preview lỗi: ' +
        escapeHtml83BPreviewMobile(
          error &&
          error.message
            ? error.message
            : error
        ) +
        '</div>';

    }

  }


  /* =========================================================
     BUILD MOBILE PANEL
     ========================================================= */

  function build83BProductionPreviewMobilePanel() {

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
        '83B Production Preview Mobile: tab-settings not found'
      );

      return;

    }


    const panel =
      document.createElement(
        'div'
      );


    panel.id =
      PANEL_ID;


    panel.className =
      'card';


    panel.innerHTML = `

      <h2>
        🧪 STEP 8.3B Production Integration Preview
      </h2>

      <p class="sub">
        Kiểm tra đường tích hợp STEP 8.3B vào Production
        trước khi cho phép thay đổi thật.
        Chế độ READ ONLY / ZERO WRITE.
      </p>

      <button
        type="button"
        id="fix03d59-83b-production-preview-run"
        class="btn-primary"
      >
        🧪 Run 8.3B Production Preview
      </button>

      <div
        id="${OUTPUT_ID}"
        style="margin-top:14px;"
      >
        Chưa chạy kiểm tra.
      </div>

    `;


    settings.appendChild(
      panel
    );


    const button =
      document.getElementById(
        'fix03d59-83b-production-preview-run'
      );


    if (button) {

      button.addEventListener(
        'click',
        run83BProductionPreviewMobile
      );

    }

  }


  /* =========================================================
     PUBLIC API
     ========================================================= */

  window
    .run83BProductionPreviewMobile =
    run83BProductionPreviewMobile;


  window
    .FIX03D59_STEP83B_PRODUCTION_INTEGRATION_PREVIEW_MOBILE_LOADED =
    true;


  window
    .FIX03D59_STEP83B_PRODUCTION_INTEGRATION_PREVIEW_MOBILE_VERSION =
    VERSION;


  /* =========================================================
     INIT
     ========================================================= */

  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      build83BProductionPreviewMobilePanel
    );

  } else {

    build83BProductionPreviewMobilePanel();

  }

     const mobileLoadMarker =
    document.createElement('div');

  mobileLoadMarker.innerHTML =
    '🟢 83B PREVIEW MOBILE FILE LOADED';

  mobileLoadMarker.style.cssText =
    'position:fixed;top:70px;left:10px;right:10px;z-index:999999;background:#16a34a;color:white;padding:12px;text-align:center;font-weight:900;border-radius:12px;';

  document.body.appendChild(
    mobileLoadMarker
  );

  console.log(
    '📱 FIX-03D5.9 STEP 8.3B Production Integration Preview Mobile V1 loaded / READ ONLY'
  );

})();
