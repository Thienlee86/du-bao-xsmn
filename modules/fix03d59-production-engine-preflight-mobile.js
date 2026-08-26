/* =========================================================================
   FIX-03D5.9
   PRODUCTION BRIDGE — STEP 3.4B
   ENGINE EXECUTOR MOBILE PREFLIGHT V1

   PURPOSE:
   - Verify runtime dependencies required by Step 3.4B.
   - DO NOT execute Production engine.
   - DO NOT execute Adaptive engine.
   - DO NOT generate forecast.

   SAFETY:
   - READ ONLY.
   - ZERO ENGINE EXECUTION.
   - ZERO PRODUCTION WRITE.
   - ZERO STORAGE WRITE.
   - NO LAST_FORECAST MODIFICATION.
   - NO savePrediction().
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'PRODUCTION-ENGINE-PREFLIGHT-MOBILE-V1';


  const PANEL_ID =
    'fix03d59-engine-preflight-panel';


  const OUTPUT_ID =
    'fix03d59-engine-preflight-output';


  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

  function esc(value) {

    return String(
      value === null ||
      value === undefined ||
      value === ''
        ? '--'
        : value
    )
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  }


  function yesNo(value) {

    return value
      ? 'YES ✅'
      : 'NO ❌';

  }


  function row(
    label,
    value
  ) {

    return `

      <div
        style="
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap:14px;
          padding:9px 0;
          border-bottom:
            1px solid rgba(255,255,255,.08);
        "
      >

        <span
          style="
            color:rgba(255,255,255,.65);
            font-size:13px;
            flex:0 0 47%;
          "
        >
          ${esc(label)}
        </span>

        <b
          style="
            color:#fff;
            text-align:right;
            font-size:13px;
            word-break:break-word;
            flex:1;
          "
        >
          ${value}
        </b>

      </div>

    `;

  }


  function sectionTitle(
    text,
    color
  ) {

    return `

      <div
        style="
          margin-top:20px;
          margin-bottom:6px;
          color:${color || '#ffc13d'};
          font-size:16px;
          font-weight:900;
        "
      >
        ${esc(text)}
      </div>

    `;

  }


  function functionAvailable(
    name
  ) {

    return (
      typeof window[name] ===
      'function'
    );

  }


  /*
   * =========================================================
   * PRIZE META CHECK
   * =========================================================
   */

  function inspectPrizeMeta() {

    if (
      Array.isArray(
        window.PRIZE_META
      ) &&
      window.PRIZE_META.length
    ) {

      return {

        available: true,

        source:
          'window.PRIZE_META',

        count:
          window.PRIZE_META.length

      };

    }


    if (
      typeof window
        .getPrizeMeta03D59 ===
      'function'
    ) {

      try {

        const value =
          window
            .getPrizeMeta03D59();


        if (
          Array.isArray(value) &&
          value.length
        ) {

          return {

            available: true,

            source:
              'getPrizeMeta03D59',

            count:
              value.length

          };

        }

      } catch (error) {

        return {

          available: false,

          source:
            'getPrizeMeta03D59',

          count:
            0,

          error:
            error &&
            error.message
              ? error.message
              : String(error)

        };

      }

    }


    return {

      available: false,

      source:
        null,

      count:
        0

    };

  }


  /*
   * =========================================================
   * OPTIONAL MODEL-CONFIG ACCESS
   * =========================================================
   */

  function inspectModelConfigAccess() {

    const helpers = [

      'getShadowModelConfigV26',

      'getModelLabConfigV23',

      'findModelLabConfigV23',

      'modelLabConfigByKeyV23'

    ];


    const availableHelpers =
      helpers.filter(
        name =>
          functionAvailable(name)
      );


    const collections = [

      [
        'MODEL_LAB_CONFIGS_V23',
        window.MODEL_LAB_CONFIGS_V23
      ],

      [
        'MODEL_CONFIGS_V23',
        window.MODEL_CONFIGS_V23
      ],

      [
        'V23_MODEL_CONFIGS',
        window.V23_MODEL_CONFIGS
      ],

      [
        'MODEL_LAB_MODELS_V23',
        window.MODEL_LAB_MODELS_V23
      ]

    ];


    const availableCollections =
      collections
        .filter(
          item =>
            item[1] &&
            (
              Array.isArray(item[1]) ||
              typeof item[1] ===
                'object'
            )
        )
        .map(
          item =>
            item[0]
        );


    return {

      available:
        Boolean(
          availableHelpers.length ||
          availableCollections.length
        ),

      helpers:
        availableHelpers,

      collections:
        availableCollections

    };

  }


  /*
   * =========================================================
   * RUN PREFLIGHT
   * =========================================================
   */

  function runPreflight() {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {
      return;
    }


    /*
     * IMPORTANT:
     *
     * We ONLY inspect references here.
     * None of these functions are called.
     */

    const checks = {

      methodResolver:
        functionAvailable(
          'resolveProductionMethod03D59'
        ),

      executor:
        functionAvailable(
          'executeProductionEngine03D59'
        ),

      executorInspector:
        functionAvailable(
          'inspectProductionEngineExecutor03D59'
        ),

      productionEngine:
        functionAvailable(
          'generateFullForecast'
        ),

      historyGetter:
        functionAvailable(
          'getAllDrawsForProvince'
        ),

      adaptiveScorer:
        functionAvailable(
          'modelLabScoresV23'
        ),

      ranker:
        functionAvailable(
          'rankedNumbers'
        )

    };


    const prizeMeta =
      inspectPrizeMeta();


    const modelConfig =
      inspectModelConfigAccess();


    /*
     * Production route requires:
     * Resolver + Executor + V2 engine.
     */

    const productionReady =
      Boolean(
        checks.methodResolver &&
        checks.executor &&
        checks.productionEngine
      );


    /*
     * Adaptive route requires all primitives.
     */

    const adaptiveReady =
      Boolean(
        checks.methodResolver &&
        checks.executor &&
        checks.historyGetter &&
        checks.adaptiveScorer &&
        checks.ranker &&
        prizeMeta.available &&
        modelConfig.available
      );


    /*
     * We require BOTH before executing Step 3.4B tests.
     */

    const overallReady =
      Boolean(
        productionReady &&
        adaptiveReady
      );


    let html = `

      ${sectionTitle(
        'STEP 3.4B MODULE'
      )}

      ${row(
        'Executor Loaded',
        yesNo(
          window
            .FIX03D59_PRODUCTION_ENGINE_EXECUTOR_LOADED ===
          true
        )
      )}

      ${row(
        'Method Resolver',
        yesNo(
          checks.methodResolver
        )
      )}

      ${row(
        'Executor API',
        yesNo(
          checks.executor
        )
      )}

      ${row(
        'Executor Inspector',
        yesNo(
          checks.executorInspector
        )
      )}


      ${sectionTitle(
        'V2 PRODUCTION CONTRACT'
      )}

      ${row(
        'generateFullForecast',
        yesNo(
          checks.productionEngine
        )
      )}

      ${row(
        'Production Route Ready',
        yesNo(
          productionReady
        )
      )}


      ${sectionTitle(
        'V2.6 ADAPTIVE CONTRACT'
      )}

      ${row(
        'getAllDrawsForProvince',
        yesNo(
          checks.historyGetter
        )
      )}

      ${row(
        'modelLabScoresV23',
        yesNo(
          checks.adaptiveScorer
        )
      )}

      ${row(
        'rankedNumbers',
        yesNo(
          checks.ranker
        )
      )}

      ${row(
        'PRIZE_META Access',
        yesNo(
          prizeMeta.available
        )
      )}

      ${row(
        'PRIZE_META Source',
        esc(
          prizeMeta.source
        )
      )}

      ${row(
        'PRIZE_META Count',
        esc(
          prizeMeta.count
        )
      )}

      ${row(
        'Model Config Access',
        yesNo(
          modelConfig.available
        )
      )}

      ${row(
        'Config Helpers',
        esc(
          modelConfig.helpers.length
            ? modelConfig.helpers.join(', ')
            : null
        )
      )}

      ${row(
        'Config Collections',
        esc(
          modelConfig.collections.length
            ? modelConfig.collections.join(', ')
            : null
        )
      )}

      ${row(
        'Adaptive Route Ready',
        yesNo(
          adaptiveReady
        )
      )}


      ${sectionTitle(
        'SAFETY',
        '#72e6ae'
      )}

      ${row(
        'Engine Executed',
        'NO ✅'
      )}

      ${row(
        'Forecast Generated',
        'NO ✅'
      )}

      ${row(
        'Production Write',
        'NO ✅'
      )}

      ${row(
        'Storage Write',
        'NO ✅'
      )}

      ${row(
        'LAST_FORECAST Modified',
        'NO ✅'
      )}

      ${row(
        'savePrediction Called',
        'NO ✅'
      )}


      ${sectionTitle(
        'VERDICT',
        overallReady
          ? '#72e6ae'
          : '#ff7185'
      )}

      ${row(
        'Production Contract',
        productionReady
          ? 'READY ✅'
          : 'NOT READY ❌'
      )}

      ${row(
        'Adaptive Contract',
        adaptiveReady
          ? 'READY ✅'
          : 'NOT READY ❌'
      )}

      ${row(
        'STEP 3.4B PREFLIGHT',
        overallReady
          ? 'PASS ✅'
          : 'BRIDGE REQUIRED ⚠️'
      )}

    `;


    output.innerHTML =
      html;


    window
      .LAST_FIX03D59_PRODUCTION_ENGINE_PREFLIGHT =
      {

        version:
          VERSION,

        checks,

        prizeMeta,

        modelConfig,

        productionReady,

        adaptiveReady,

        overallReady,

        engineExecuted:
          false,

        forecastGenerated:
          false,

        productionWrite:
          false,

        storageWrite:
          false,

        lastForecastModified:
          false,

        savePredictionCalled:
          false,

        checkedAt:
          new Date()
            .toISOString()

      };

  }


  /*
   * =========================================================
   * MOBILE PANEL
   * =========================================================
   */

  function buildPanel() {

    const old =
      document.getElementById(
        PANEL_ID
      );


    if (old) {
      old.remove();
    }


    const settings =
      document.getElementById(
        'tab-settings'
      );


    if (!settings) {

      console.warn(
        'Step 3.4B Preflight: tab-settings not found'
      );

      return;

    }


    const panel =
      document.createElement(
        'section'
      );


    panel.id =
      PANEL_ID;


    panel.style.cssText = [
      'margin:18px 0 30px',
      'padding:18px',
      'border-radius:20px',
      'background:#20264f',
      'border:1px solid rgba(135,145,255,.25)',
      'color:#fff',
      'box-sizing:border-box'
    ].join(';');


    panel.innerHTML = `

      <div
        style="
          font-size:21px;
          font-weight:900;
          margin-bottom:7px;
        "
      >
        ⚙️ Production Engine Preflight
      </div>


      <div
        style="
          opacity:.7;
          font-size:13px;
          line-height:1.55;
        "
      >
        Step 3.4B Runtime Contract

        <br>

        Production + Adaptive dependencies

        <br>

        <b style="color:#72e6ae;">
          READ ONLY · NO ENGINE EXECUTION
        </b>
      </div>


      <div
        id="fix03d59-engine-preflight-run"
        role="button"
        tabindex="0"
        style="
          display:flex;
          width:100%;
          min-height:60px;
          margin-top:16px;
          padding:15px;
          border-radius:16px;
          background:
            linear-gradient(
              90deg,
              #ffc13d,
              #ff963d
            );
          color:#17192f;
          font-size:16px;
          font-weight:900;
          align-items:center;
          justify-content:center;
          text-align:center;
          box-sizing:border-box;
          cursor:pointer;
          position:relative;
          z-index:100;
        "
      >
        🔍 RUN ENGINE PREFLIGHT
      </div>


      <div
        id="${OUTPUT_ID}"
        style="margin-top:17px;"
      ></div>

    `;


    settings.appendChild(
      panel
    );


    const control =
      document.getElementById(
        'fix03d59-engine-preflight-run'
      );


    if (control) {

      control.addEventListener(
        'click',
        runPreflight
      );


      control.addEventListener(
        'keydown',
        function (event) {

          if (
            event.key === 'Enter' ||
            event.key === ' '
          ) {

            event.preventDefault();

            runPreflight();

          }

        }
      );

    }

  }


  /*
   * =========================================================
   * PUBLIC API
   * =========================================================
   */

  window
    .runProductionEnginePreflight03D59 =
    runPreflight;


  window
    .rebuildProductionEnginePreflight03D59 =
    buildPanel;


  window
    .FIX03D59_PRODUCTION_ENGINE_PREFLIGHT_LOADED =
    true;


  /*
   * =========================================================
   * INIT
   * =========================================================
   */

  function init() {

    window.setTimeout(
      buildPanel,
      350
    );

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


  console.log(
    'FIX-03D5.9 Step 3.4B Engine Preflight Mobile loaded — NO ENGINE EXECUTION'
  );

})();
