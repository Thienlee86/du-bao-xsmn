/* =========================================================================
   FIX-03D5.9 — PRODUCTION READINESS MOBILE V1

   PURPOSE:
   - Final consolidated readiness inspection before REAL integration.
   - Mobile friendly.
   - READ ONLY.
   - ZERO WRITE.
   - NO ENGINE EXECUTION.

   IMPORTANT:
   - Does NOT modify LAST_FORECAST.
   - Does NOT modify STEP 8.3B.
   - Does NOT modify candidates.
   - Does NOT call savePrediction().
   - Does NOT authorize Production write.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'FIX03D59-PRODUCTION-READINESS-MOBILE-V1';


  const OUTPUT_ID =
    'fix03d59-production-readiness-output';


  /* =========================================================
     HELPERS
     ========================================================= */

  function esc(value) {

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


  function text(value) {

    if (
      value === undefined ||
      value === null ||
      value === ''
    ) {

      return '—';

    }


    if (
      Array.isArray(value)
    ) {

      return value.length
        ? value.join(', ')
        : '[]';

    }


    return String(value);

  }


  function yn(value) {

    return value === true
      ? 'YES ✅'
      : 'NO ❌';

  }


  function safeCall(
    fn
  ) {

    try {

      return {
        ok: true,
        value: fn()
      };

    } catch (error) {

      return {
        ok: false,
        error:
          error &&
          error.message
            ? error.message
            : String(error)
      };

    }

  }


  /* =========================================================
     INSPECT RUNTIME
     ========================================================= */

  function inspectProductionReadiness03D59() {

    /*
     * ---------------------------------------------------------
     * 1. PRODUCTION FORECAST
     * READ ONLY
     * ---------------------------------------------------------
     */

    const forecast =
      window.LAST_FORECAST ||
      null;


    const forecastExists =
      Boolean(forecast);


    const productionProvince =
      forecast
        ? (
            forecast.province ||
            forecast.provinceSlug ||
            forecast.provinceId ||
            forecast.slug ||
            null
          )
        : null;


    /*
     * ---------------------------------------------------------
     * 2. STEP 8.3B CURRENT RESULT
     * READ ONLY
     * ---------------------------------------------------------
     */

    const step83B =
      window.LAST_FIX03D59_STEP83B_RESULT ||
      null;


    const step83BExists =
      Boolean(step83B);


    /*
     * ---------------------------------------------------------
     * 3. PRODUCTION INTEGRATION PREVIEW
     *
     * Existing API is expected to be READ ONLY.
     * ---------------------------------------------------------
     */

    const previewApiAvailable =
      typeof window
        .buildStep83BProductionIntegrationPreview03D59 ===
      'function';


    let previewResult =
      null;


    let previewError =
      null;


    if (previewApiAvailable) {

      const called =
        safeCall(
          function () {

            return window
              .buildStep83BProductionIntegrationPreview03D59();

          }
        );


      if (called.ok) {

        previewResult =
          called.value ||
          null;

      } else {

        previewError =
          called.error;

      }

    }


    const production =
      previewResult &&
      previewResult.production
        ? previewResult.production
        : {};


    const resolver =
      previewResult &&
      previewResult.resolver
        ? previewResult.resolver
        : {};


    const current83B =
      previewResult &&
      previewResult.current83B
        ? previewResult.current83B
        : {};


    const preview =
      previewResult &&
      previewResult.preview
        ? previewResult.preview
        : {};


    const safety =
      previewResult &&
      previewResult.safety
        ? previewResult.safety
        : {};


    /*
     * ---------------------------------------------------------
     * 4. HARD SAFETY CONDITIONS
     * ---------------------------------------------------------
     */

    const noEngineExecution =
      safety.engineExecuted !== true;


    const noIntegrationExecution =
      safety.integrationExecuted !== true;


    const noWriteAuthorization =
      safety.writeAuthorized !== true;


    const noProductionWrite =
      safety.productionWrite !== true;


    const noStorageWrite =
      safety.storageWrite !== true;


    const noSavePrediction =
      safety.savePredictionCalled !== true;


    const noForecastModification =
      safety.lastForecastModified !== true;


    const noCandidateModification =
      safety.candidatesModified !== true;


    const noStep83BModification =
      safety.step83BModified !== true;


    const safetyPass =
      noEngineExecution &&
      noIntegrationExecution &&
      noWriteAuthorization &&
      noProductionWrite &&
      noStorageWrite &&
      noSavePrediction &&
      noForecastModification &&
      noCandidateModification &&
      noStep83BModification;


    /*
     * ---------------------------------------------------------
     * 5. READINESS CONDITIONS
     * FAIL CLOSED
     * ---------------------------------------------------------
     */

    const previewReady =
      Boolean(
        previewResult &&
        previewResult.ready === true
      );


    const resolverReady =
      resolver.ready === true;


    const exactlyOneMatch =
      preview.exactlyOneMatchingCandidate ===
      true;


    const identityPreserved =
      preview.candidateIdentityPreserved ===
      true;


    const singleProvince =
      preview.singleProvince === true;


    const pathReady =
      production.pathReady === true;


    const ready =
      previewApiAvailable &&
      !previewError &&
      forecastExists &&
      step83BExists &&
      previewReady &&
      resolverReady &&
      exactlyOneMatch &&
      identityPreserved &&
      singleProvince &&
      pathReady &&
      safetyPass;


    return {

      version:
        VERSION,

      ready:
        ready,

      forecast: {

        exists:
          forecastExists,

        province:
          production.province ||
          productionProvince ||
          null,

        pathReady:
          pathReady

      },

      step83B: {

        exists:
          step83BExists,

        candidateCount:
          current83B.candidateCount,

        candidateProvinces:
          current83B.candidateProvinces

      },

      resolver: {

        available:
          resolver.available === true,

        ready:
          resolverReady,

        source:
          resolver.source,

        resolvedScope:
          resolver.resolvedScope,

        resolvedProvince:
          resolver.resolvedProvince

      },

      preview: {

        apiAvailable:
          previewApiAvailable,

        apiError:
          previewError,

        ready:
          previewReady,

        candidateCount:
          preview.candidateCount,

        candidateProvinces:
          preview.candidateProvinces,

        exactlyOneMatch:
          exactlyOneMatch,

        identityPreserved:
          identityPreserved,

        singleProvince:
          singleProvince,

        scopeReductionRequired:
          preview.scopeReductionRequired ===
          true

      },

      safety: {

        pass:
          safetyPass,

        engineExecuted:
          safety.engineExecuted === true,

        integrationExecuted:
          safety.integrationExecuted === true,

        writeAuthorized:
          safety.writeAuthorized === true,

        productionWrite:
          safety.productionWrite === true,

        storageWrite:
          safety.storageWrite === true,

        savePredictionCalled:
          safety.savePredictionCalled === true,

        lastForecastModified:
          safety.lastForecastModified === true,

        candidatesModified:
          safety.candidatesModified === true,

        step83BModified:
          safety.step83BModified === true

      }

    };

  }


  /* =========================================================
     RENDER
     ========================================================= */

  function row(
    label,
    value
  ) {

    return `
      <div
        style="
          display:flex;
          justify-content:space-between;
          gap:16px;
          padding:10px 0;
          border-bottom:
            1px solid rgba(255,255,255,.10);
        "
      >
        <span
          style="
            color:#b9bfdc;
          "
        >
          ${esc(label)}
        </span>

        <b
          style="
            text-align:right;
            color:#fff;
          "
        >
          ${esc(text(value))}
        </b>
      </div>
    `;

  }


  function renderProductionReadiness03D59(
    result
  ) {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {

      alert(
        'Production Readiness output not found'
      );

      return;

    }


    const finalColor =
      result.ready
        ? '#68e39b'
        : '#ff8b8b';


    const finalText =
      result.ready
        ? 'READY FOR REAL INTEGRATION ✅'
        : 'NOT READY — FAIL CLOSED ❌';


    output.innerHTML = `

      <div
        style="
          margin-top:16px;
          padding:16px;
          border-radius:16px;
          background:rgba(255,255,255,.055);
          line-height:1.5;
        "
      >

        <div
          style="
            color:${finalColor};
            font-size:20px;
            font-weight:900;
            margin-bottom:14px;
          "
        >
          ${finalText}
        </div>


        <div
          style="
            color:#ffbd3c;
            font-weight:900;
            margin-top:6px;
          "
        >
          🟣 PRODUCTION
        </div>

        ${row(
          'Forecast exists',
          yn(result.forecast.exists)
        )}

        ${row(
          'Province',
          result.forecast.province
        )}

        ${row(
          'Path ready',
          yn(result.forecast.pathReady)
        )}


        <div
          style="
            color:#ffbd3c;
            font-weight:900;
            margin-top:20px;
          "
        >
          🧭 SCOPE RESOLVER
        </div>

        ${row(
          'Available',
          yn(result.resolver.available)
        )}

        ${row(
          'Ready',
          yn(result.resolver.ready)
        )}

        ${row(
          'Source',
          result.resolver.source
        )}

        ${row(
          'Resolved scope',
          result.resolver.resolvedScope
        )}

        ${row(
          'Resolved province',
          result.resolver.resolvedProvince
        )}


        <div
          style="
            color:#ffbd3c;
            font-weight:900;
            margin-top:20px;
          "
        >
          🧩 STEP 8.3B
        </div>

        ${row(
          'Exists',
          yn(result.step83B.exists)
        )}

        ${row(
          'Candidate count',
          result.step83B.candidateCount
        )}

        ${row(
          'Candidate provinces',
          result.step83B.candidateProvinces
        )}


        <div
          style="
            color:#ffbd3c;
            font-weight:900;
            margin-top:20px;
          "
        >
          🔬 INTEGRATION PREVIEW
        </div>

        ${row(
          'API available',
          yn(result.preview.apiAvailable)
        )}

        ${row(
          'Preview ready',
          yn(result.preview.ready)
        )}

        ${row(
          'Candidate count',
          result.preview.candidateCount
        )}

        ${row(
          'Candidate provinces',
          result.preview.candidateProvinces
        )}

        ${row(
          'Exactly one match',
          yn(result.preview.exactlyOneMatch)
        )}

        ${row(
          'Identity preserved',
          yn(result.preview.identityPreserved)
        )}

        ${row(
          'Single province',
          yn(result.preview.singleProvince)
        )}

        ${row(
          'Scope reduction required',
          yn(
            result.preview
              .scopeReductionRequired
          )
        )}

        ${
          result.preview.apiError
            ? row(
                'Preview API error',
                result.preview.apiError
              )
            : ''
        }


        <div
          style="
            color:#68e39b;
            font-weight:900;
            margin-top:20px;
          "
        >
          🛡️ SAFETY
        </div>

        ${row(
          'Safety pass',
          yn(result.safety.pass)
        )}

        ${row(
          'Engine executed',
          yn(result.safety.engineExecuted)
        )}

        ${row(
          'Integration executed',
          yn(result.safety.integrationExecuted)
        )}

        ${row(
          'Write authorized',
          yn(result.safety.writeAuthorized)
        )}

        ${row(
          'Production write',
          yn(result.safety.productionWrite)
        )}

        ${row(
          'Storage write',
          yn(result.safety.storageWrite)
        )}

        ${row(
          'savePrediction called',
          yn(result.safety.savePredictionCalled)
        )}

        ${row(
          'LAST_FORECAST modified',
          yn(result.safety.lastForecastModified)
        )}

        ${row(
          'Candidates modified',
          yn(result.safety.candidatesModified)
        )}

        ${row(
          'STEP 8.3B modified',
          yn(result.safety.step83BModified)
        )}


        <div
          style="
            margin-top:20px;
            padding:16px;
            border-radius:14px;
            border:2px solid ${finalColor};
            color:${finalColor};
            font-size:18px;
            font-weight:900;
            text-align:center;
          "
        >
          ${finalText}
        </div>

      </div>

    `;


    window
      .LAST_FIX03D59_PRODUCTION_READINESS =
      result;

  }


  /* =========================================================
     RUN
     ========================================================= */

  function runProductionReadiness03D59() {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {

      alert(
        'Production Readiness panel chưa tồn tại.'
      );

      return;

    }


    output.innerHTML =
      '⏳ Đang kiểm tra toàn bộ Production Readiness...';


    try {

      const result =
        inspectProductionReadiness03D59();


      renderProductionReadiness03D59(
        result
      );


      return result;


    } catch (error) {

      console.error(
        'FIX03D59 Production Readiness:',
        error
      );


      output.innerHTML =
        '<div style="color:#ff8b8b;font-weight:800;">' +
        '❌ READINESS ERROR: ' +
        esc(
          error &&
          error.message
            ? error.message
            : error
        ) +
        '</div>';


      return null;

    }

  }


  /* =========================================================
     PUBLIC API
     ========================================================= */

  window
    .inspectProductionReadiness03D59 =
    inspectProductionReadiness03D59;


  window
    .runProductionReadiness03D59 =
    runProductionReadiness03D59;


  window
    .FIX03D59_PRODUCTION_READINESS_MOBILE_LOADED =
    true;


  window
    .FIX03D59_PRODUCTION_READINESS_MOBILE_VERSION =
    VERSION;


  console.log(
    '🧪 FIX-03D5.9 Production Readiness Mobile V1 loaded / READ ONLY'
  );

})();
