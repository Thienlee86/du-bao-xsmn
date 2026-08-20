/* =========================================================================
   FIX-03D5.9 — CERTIFICATION CHAIN TRACE V2
   FILE:
   modules/fix-03d5-9-shadow-inspector.js

   PURPOSE:
   - Trace the existing FIX-03D5.9 certification/integration chain in RAM.
   - Inspect STEP 8.3B -> 8.3R.
   - Inspect STEP 8.4A -> 8.4F.
   - Compare every observable province value with LAST_FORECAST.
   - Detect the FIRST DIVERGENCE from the current Production Forecast.
   - Mobile-first diagnostic UI.

   IMPORTANT:
   - Does NOT execute certification stages.
   - Does NOT rebuild the pipeline.
   - Does NOT create forecasts.
   - Does NOT modify LAST_FORECAST.
   - Does NOT modify candidates.
   - Does NOT modify Shadow Snapshots.
   - Does NOT call savePrediction().
   - Does NOT write production/storage.

   READ ONLY
   ZERO WRITE
   FAIL CLOSED
   ========================================================================= */

(function () {

  'use strict';


  const PANEL_ID =
    'fix03d59-chain-trace-panel';


  const CONTROL_ID =
    'fix03d59-chain-trace-control';


  const OUTPUT_ID =
    'fix03d59-chain-trace-output';


  /*
   * =========================================================
   * BASIC HELPERS
   * =========================================================
   */

  function safeText(value) {

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

      return value.join(', ');

    }


    if (
      typeof value === 'object'
    ) {

      try {

        return JSON.stringify(value);

      } catch (error) {

        return '[object]';

      }

    }


    return String(value);

  }


  function normalizeProvince(value) {

    return String(
      value ?? ''
    )
      .trim()
      .toLowerCase();

  }


  function getSelectedProvince() {

    try {

      const select =
        document.getElementById(
          'provinceSelect'
        );


      if (
        select &&
        select.value
      ) {

        return normalizeProvince(
          select.value
        );

      }

    } catch (error) {

      // READ ONLY

    }


    try {

      if (
        typeof SELECTED_PROVINCE !==
        'undefined'
      ) {

        return normalizeProvince(
          SELECTED_PROVINCE
        );

      }

    } catch (error) {

      // READ ONLY

    }


    return null;

  }


  /*
   * =========================================================
   * PRODUCTION FORECAST LOOKUP
   * =========================================================
   */

  function getProductionForecast() {

    try {

      if (
        typeof LAST_FORECAST !==
        'undefined' &&
        LAST_FORECAST
      ) {

        return LAST_FORECAST;

      }

    } catch (error) {

      // Continue.

    }


    try {

      return (
        window.LAST_FORECAST ||
        null
      );

    } catch (error) {

      return null;

    }

  }


  function getForecastProvince(
    envelope
  ) {

    if (!envelope) {

      return null;

    }


    /*
     * Current Production schema:
     *
     * LAST_FORECAST.forecast.province
     */

    if (
      envelope.forecast &&
      envelope.forecast.province
    ) {

      return normalizeProvince(
        envelope.forecast.province
      );

    }


    /*
     * Defensive fallback only.
     */

    if (
      envelope.province
    ) {

      return normalizeProvince(
        envelope.province
      );

    }


    return null;

  }


  /*
   * =========================================================
   * SAFE PROVINCE DISCOVERY
   * =========================================================
   *
   * Search each RAM checkpoint without modifying it.
   *
   * We intentionally inspect:
   *
   * province
   * provinceSlug
   * forecastProvince
   *
   * and nested structures up to a bounded depth.
   * =========================================================
   */

  function discoverProvinceValues(root) {

    const found =
      [];


    if (
      !root ||
      typeof root !== 'object'
    ) {

      return found;

    }


    const visited =
      new WeakSet();


    function walk(
      value,
      path,
      depth
    ) {

      if (
        depth > 8 ||
        !value ||
        typeof value !== 'object'
      ) {

        return;

      }


      if (
        visited.has(value)
      ) {

        return;

      }


      visited.add(value);


      let keys;


      try {

        keys =
          Object.keys(value);

      } catch (error) {

        return;

      }


      keys.forEach(
        function (key) {

          let child;


          try {

            child =
              value[key];

          } catch (error) {

            return;

          }


          const childPath =
            path
              ? path + '.' + key
              : key;


          const lower =
            String(key)
              .toLowerCase();


          const provinceField =
            lower === 'province' ||
            lower === 'provinceslug' ||
            lower === 'forecastprovince';


          if (
            provinceField &&
            child !== undefined &&
            child !== null &&
            typeof child !== 'object'
          ) {

            const normalized =
              normalizeProvince(child);


            if (normalized) {

              found.push({

                path:
                  childPath,

                value:
                  normalized

              });

            }

          }


          if (
            child &&
            typeof child === 'object'
          ) {

            walk(
              child,
              childPath,
              depth + 1
            );

          }

        }
      );

    }


    walk(
      root,
      '',
      0
    );


    /*
     * Deduplicate path/value pairs.
     */

    const seen =
      new Set();


    return found.filter(
      function (item) {

        const key =
          item.path +
          '|' +
          item.value;


        if (
          seen.has(key)
        ) {

          return false;

        }


        seen.add(key);

        return true;

      }
    );

  }


  /*
   * =========================================================
   * UNIQUE PROVINCES
   * =========================================================
   */

  function uniqueProvinces(
    provinceValues
  ) {

    const set =
      new Set();


    provinceValues.forEach(
      function (item) {

        if (
          item &&
          item.value
        ) {

          set.add(
            normalizeProvince(
              item.value
            )
          );

        }

      }
    );


    return Array.from(set);

  }


  /*
   * =========================================================
   * RAM CHECKPOINT DEFINITIONS
   * =========================================================
   */

  function getCheckpointDefinitions() {

    return [

      {
        step: '8.3B',
        names: [
          'LAST_FIX03D59_STEP83B_RESULT',
          'LAST_FIX03D59_STEP83B'
        ]
      },

      {
        step: '8.3C',
        names: [
          'LAST_FIX03D59_STEP83C_RESULT',
          'LAST_FIX03D59_STEP83C'
        ]
      },

      {
        step: '8.3D',
        names: [
          'LAST_FIX03D59_STEP83D_RESULT',
          'LAST_FIX03D59_STEP83D'
        ]
      },

      {
        step: '8.3E',
        names: [
          'LAST_FIX03D59_STEP83E_RESULT',
          'LAST_FIX03D59_STEP83E'
        ]
      },

      {
        step: '8.3F',
        names: [
          'LAST_FIX03D59_STEP83F_RESULT',
          'LAST_FIX03D59_STEP83F'
        ]
      },

      {
        step: '8.3G',
        names: [
          'LAST_FIX03D59_STEP83G'
        ]
      },

      {
        step: '8.3H',
        names: [
          'LAST_FIX03D59_STEP83H'
        ]
      },

      {
        step: '8.3I',
        names: [
          'LAST_FIX03D59_STEP83I'
        ]
      },

      {
        step: '8.3J',
        names: [
          'LAST_FIX03D59_STEP83J'
        ]
      },

      {
        step: '8.3K',
        names: [
          'LAST_FIX03D59_STEP83K'
        ]
      },

      {
        step: '8.3L',
        names: [
          'LAST_FIX03D59_STEP83L'
        ]
      },

      {
        step: '8.3M',
        names: [
          'LAST_FIX03D59_STEP83M'
        ]
      },

      {
        step: '8.3N',
        names: [
          'LAST_FIX03D59_STEP83N'
        ]
      },

      {
        step: '8.3O',
        names: [
          'LAST_FIX03D59_STEP83O'
        ]
      },

      {
        step: '8.3P',
        names: [
          'LAST_FIX03D59_STEP83P'
        ]
      },

      {
        step: '8.3Q',
        names: [
          'LAST_FIX03D59_STEP83Q'
        ]
      },

      {
        step: '8.3R',
        names: [
          'LAST_FIX03D59_STEP83R'
        ]
      },


      /*
       * -------------------------------------------------------
       * PRODUCTION INTEGRATION
       * -------------------------------------------------------
       */

      {
        step: '8.4A',
        names: [
          'LAST_FIX03D59_STEP84A'
        ]
      },

      {
        step: '8.4B',
        names: [
          'LAST_FIX03D59_STEP84B'
        ]
      },

      {
        step: '8.4C',
        names: [
          'LAST_FIX03D59_STEP84C'
        ]
      },

      {
        step: '8.4D',
        names: [
          'LAST_FIX03D59_STEP84D'
        ]
      },

      {
        step: '8.4E',
        names: [
          'LAST_FIX03D59_STEP84E'
        ]
      },

      {
        step: '8.4F',
        names: [
          'LAST_FIX03D59_STEP84F'
        ]
      }

    ];

  }


  /*
   * =========================================================
   * CHECKPOINT LOOKUP
   * =========================================================
   */

  function resolveCheckpoint(
    definition
  ) {

    for (
      const name
      of definition.names
    ) {

      try {

        if (
          window[name] !==
          undefined &&
          window[name] !==
          null
        ) {

          return {

            name,
            value:
              window[name]

          };

        }

      } catch (error) {

        // Continue.

      }

    }


    return {

      name: null,
      value: null

    };

  }


  /*
   * =========================================================
   * CHECKPOINT CLASSIFICATION
   * =========================================================
   */

  function classifyCheckpoint(
    checkpoint,
    productionProvince
  ) {

    if (
      !checkpoint.value
    ) {

      return {

        status:
          'NOT_AVAILABLE',

        icon:
          '⚪',

        provinces: [],

        provinceValues: [],

        mismatch: false

      };

    }


    const provinceValues =
      discoverProvinceValues(
        checkpoint.value
      );


    const provinces =
      uniqueProvinces(
        provinceValues
      );


    /*
     * A checkpoint with no observable province is not
     * automatically a failure.
     *
     * Some certification stages only contain boolean
     * safety state.
     */

    if (
      provinces.length === 0
    ) {

      return {

        status:
          'NO_PROVINCE_FIELD',

        icon:
          '🔹',

        provinces,

        provinceValues,

        mismatch: false

      };

    }


    const mismatch =
      Boolean(
        productionProvince &&
        provinces.some(
          province =>
            province !==
            productionProvince
        )
      );


    if (mismatch) {

      return {

        status:
          'DIVERGED',

        icon:
          '❌',

        provinces,

        provinceValues,

        mismatch: true

      };

    }


    return {

      status:
        'MATCH',

      icon:
        '✅',

      provinces,

      provinceValues,

      mismatch: false

    };

  }


  /*
   * =========================================================
   * TRACE
   * =========================================================
   */

  function inspectCertificationChainV2() {

    const envelope =
      getProductionForecast();


    const productionProvince =
      getForecastProvince(
        envelope
      );


    const selectedProvince =
      getSelectedProvince();


    const definitions =
      getCheckpointDefinitions();


    const checkpoints =
      [];


    let firstDivergence =
      null;


    definitions.forEach(
      function (definition) {

        const resolved =
          resolveCheckpoint(
            definition
          );


        const classification =
          classifyCheckpoint(
            resolved,
            productionProvince
          );


        const row = {

          step:
            definition.step,

          alias:
            resolved.name,

          exists:
            Boolean(
              resolved.value
            ),

          status:
            classification.status,

          icon:
            classification.icon,

          provinces:
            classification.provinces,

          provinceValues:
            classification.provinceValues,

          mismatch:
            classification.mismatch

        };


        checkpoints.push(row);


        if (
          !firstDivergence &&
          row.mismatch === true
        ) {

          firstDivergence = {

            step:
              row.step,

            alias:
              row.alias,

            provinces:
              row.provinces.slice()

          };

        }

      }
    );


    const result = {

      version:
        'CHAIN-TRACE-V2',

      timestamp:
        new Date()
          .toISOString(),

      selectedProvince,

      productionForecastExists:
        Boolean(envelope),

      productionProvince,

      selectedMatchesProduction:
        Boolean(
          selectedProvince &&
          productionProvince &&
          selectedProvince ===
          productionProvince
        ),

      checkpointCount:
        checkpoints.length,

      checkpoints,

      firstDivergence,

      divergenceDetected:
        Boolean(
          firstDivergence
        ),

      readOnly:
        true,

      writeAuthorized:
        false,

      productionWrite:
        false,

      storageWrite:
        false,

      savePredictionCalled:
        false,

      forecastModified:
        false,

      candidateModified:
        false

    };


    window
      .LAST_FIX03D59_CHAIN_TRACE_V2 =
      result;


    return result;

  }


  /*
   * =========================================================
   * UI HELPERS
   * =========================================================
   */

  function createInfoRow(
    label,
    value
  ) {

    const row =
      document.createElement('div');


    row.style.cssText =
      'margin-top:7px;line-height:1.55;word-break:break-word;';


    const labelNode =
      document.createElement('span');


    labelNode.textContent =
      label + ': ';


    const valueNode =
      document.createElement('strong');


    valueNode.textContent =
      safeText(value);


    row.appendChild(
      labelNode
    );


    row.appendChild(
      valueNode
    );


    return row;

  }


  function createCheckpointBox(
    checkpoint,
    isFirstDivergence
  ) {

    const box =
      document.createElement('div');


    box.style.cssText = [
      'margin-top:10px',
      'padding:13px',
      'border-radius:14px',
      checkpoint.mismatch
        ? 'background:rgba(248,113,113,.13)'
        : 'background:rgba(255,255,255,.055)',
      isFirstDivergence
        ? 'border:2px solid #ffbd3c'
        : 'border:1px solid rgba(255,255,255,.08)'
    ].join(';');


    const title =
      document.createElement('div');


    title.style.cssText =
      'font-size:15px;font-weight:900;';


    title.textContent =
      checkpoint.icon +
      ' STEP ' +
      checkpoint.step +
      (
        isFirstDivergence
          ? '  ← FIRST DIVERGENCE'
          : ''
      );


    box.appendChild(title);


    box.appendChild(
      createInfoRow(
        'RAM Alias',
        checkpoint.alias ||
        'NOT AVAILABLE'
      )
    );


    box.appendChild(
      createInfoRow(
        'Status',
        checkpoint.status
      )
    );


    box.appendChild(
      createInfoRow(
        'Province',
        checkpoint.provinces.length
          ? checkpoint.provinces
          : '--'
      )
    );


    /*
     * Only show detailed paths when a province
     * was actually found.
     */

    checkpoint
      .provinceValues
      .forEach(
        function (item) {

          box.appendChild(
            createInfoRow(
              item.path,
              item.value
            )
          );

        }
      );


    return box;

  }


  /*
   * =========================================================
   * RENDER TRACE
   * =========================================================
   */

  function renderTraceV2(
    result,
    output
  ) {

    output.replaceChildren();


    const summary =
      document.createElement('div');


    summary.style.cssText = [
      'margin-top:18px',
      'padding:15px',
      'border-radius:16px',
      'background:rgba(0,0,0,.16)'
    ].join(';');


    const summaryTitle =
      document.createElement('div');


    summaryTitle.textContent =
      '🔬 CERTIFICATION CHAIN SUMMARY';


    summaryTitle.style.cssText =
      'color:#ffbd3c;font-weight:900;font-size:16px;margin-bottom:10px;';


    summary.appendChild(
      summaryTitle
    );


    summary.appendChild(
      createInfoRow(
        'Selected Province',
        result.selectedProvince
      )
    );


    summary.appendChild(
      createInfoRow(
        'Production Forecast',
        result.productionForecastExists
          ? 'EXISTS ✅'
          : 'NOT AVAILABLE ❌'
      )
    );


    summary.appendChild(
      createInfoRow(
        'Production Province',
        result.productionProvince
      )
    );


    summary.appendChild(
      createInfoRow(
        'Selected = Production',
        result.selectedMatchesProduction
          ? 'YES ✅'
          : 'NO ❌'
      )
    );


    summary.appendChild(
      createInfoRow(
        'Checkpoints',
        result.checkpointCount
      )
    );


    summary.appendChild(
      createInfoRow(
        'Divergence',
        result.divergenceDetected
          ? 'DETECTED ⚠️'
          : 'NOT DETECTED ✅'
      )
    );


    if (
      result.firstDivergence
    ) {

      summary.appendChild(
        createInfoRow(
          'FIRST DIVERGENCE',
          'STEP ' +
          result.firstDivergence.step
        )
      );


      summary.appendChild(
        createInfoRow(
          'Diverged Province',
          result
            .firstDivergence
            .provinces
        )
      );

    }


    output.appendChild(
      summary
    );


    /*
     * ---------------------------------------------------------
     * CHECKPOINTS
     * ---------------------------------------------------------
     */

    const chainTitle =
      document.createElement('div');


    chainTitle.textContent =
      '🔗 RAM CHECKPOINT TRACE';


    chainTitle.style.cssText =
      'margin-top:20px;color:#ffbd3c;font-size:16px;font-weight:900;';


    output.appendChild(
      chainTitle
    );


    result.checkpoints.forEach(
      function (checkpoint) {

        const first =
          Boolean(
            result.firstDivergence &&
            result.firstDivergence.step ===
              checkpoint.step
          );


        output.appendChild(
          createCheckpointBox(
            checkpoint,
            first
          )
        );

      }
    );


    /*
     * ---------------------------------------------------------
     * SAFETY FOOTER
     * ---------------------------------------------------------
     */

    const safety =
      document.createElement('div');


    safety.style.cssText = [
      'margin-top:18px',
      'padding:14px',
      'border-radius:14px',
      'background:rgba(52,211,153,.12)',
      'font-weight:900',
      'line-height:1.6'
    ].join(';');


    safety.textContent =
      '🔒 READ ONLY · ZERO WRITE · NO ENGINE EXECUTION';


    output.appendChild(
      safety
    );

  }


  /*
   * =========================================================
   * RUN FROM UI
   * =========================================================
   */

  function runCertificationChainTraceV2() {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {

      return null;

    }


    let result;


    try {

      result =
        inspectCertificationChainV2();


      renderTraceV2(
        result,
        output
      );


      return result;


    } catch (error) {

      output.replaceChildren();


      const failure =
        document.createElement('div');


      failure.style.cssText = [
        'margin-top:16px',
        'padding:14px',
        'border-radius:14px',
        'background:rgba(248,113,113,.15)',
        'line-height:1.6'
      ].join(';');


      failure.textContent =
        '❌ CHAIN TRACE ERROR: ' +
        (
          error &&
          error.message
            ? error.message
            : String(error)
        );


      output.appendChild(
        failure
      );


      return null;

    }

  }


  /*
   * =========================================================
   * BUILD MOBILE UI
   * =========================================================
   */

  function buildCertificationChainTraceUIV2() {

    /*
     * Remove old V1 inspector if present.
     */

    const oldInspector =
      document.getElementById(
        'fix03d59-shadow-inspector'
      );


    if (oldInspector) {

      oldInspector.remove();

    }


    /*
     * Prevent duplicate V2 panel.
     */

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
      document.createElement('div');


    panel.id =
      PANEL_ID;


    panel.className =
      'card';


    panel.style.marginTop =
      '18px';


    const title =
      document.createElement('h2');


    title.textContent =
      '🔗 CERTIFICATION CHAIN TRACE V2';


    panel.appendChild(title);


    const description =
      document.createElement('p');


    description.className =
      'sub';


    description.textContent =
      'Theo dõi RAM từ 8.3B → 8.3R → 8.4A → 8.4F và tìm checkpoint đầu tiên lệch khỏi Production Forecast.';


    panel.appendChild(
      description
    );


    const safety =
      document.createElement('div');


    safety.textContent =
      'READ ONLY · ZERO WRITE · NO ENGINE EXECUTION';


    safety.style.cssText =
      'font-size:12px;opacity:.72;margin-top:8px;';


    panel.appendChild(
      safety
    );


    /*
     * DIV CONTROL — avoids application button CSS.
     */

    const control =
      document.createElement('div');


    control.id =
      CONTROL_ID;


    control.setAttribute(
      'role',
      'button'
    );


    control.setAttribute(
      'tabindex',
      '0'
    );


    control.textContent =
      '🔬 RUN CERTIFICATION CHAIN TRACE';


    control.style.cssText = [
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'width:100%',
      'min-height:58px',
      'margin-top:16px',
      'padding:15px 14px',
      'border-radius:15px',
      'background:linear-gradient(90deg,#ffc13d,#ff963d)',
      'color:#17182a',
      'font-size:15px',
      'font-weight:900',
      'text-align:center',
      'box-sizing:border-box',
      'cursor:pointer',
      'visibility:visible',
      'opacity:1',
      'position:relative',
      'z-index:100'
    ].join(';');


    control.addEventListener(
      'click',
      runCertificationChainTraceV2
    );


    control.addEventListener(
      'keydown',
      function (event) {

        if (
          event.key === 'Enter' ||
          event.key === ' '
        ) {

          event.preventDefault();

          runCertificationChainTraceV2();

        }

      }
    );


    panel.appendChild(
      control
    );


    const output =
      document.createElement('div');


    output.id =
      OUTPUT_ID;


    output.style.cssText =
      'margin-top:4px;font-size:13px;';


    panel.appendChild(
      output
    );


    settings.appendChild(
      panel
    );

  }


  /*
   * =========================================================
   * PUBLIC READ-ONLY API
   * =========================================================
   */

  window.inspectCertificationChainV2 =
    inspectCertificationChainV2;


  window.runCertificationChainTraceV2 =
    runCertificationChainTraceV2;


  window.rebuildCertificationChainTraceUIV2 =
    buildCertificationChainTraceUIV2;


  window.FIX03D59_CHAIN_TRACE_V2_LOADED =
    true;


  /*
   * =========================================================
   * INITIALIZE
   * =========================================================
   */

  function initializeChainTraceV2() {

    window.setTimeout(
      buildCertificationChainTraceUIV2,
      350
    );

  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      initializeChainTraceV2,
      {
        once: true
      }
    );

  } else {

    initializeChainTraceV2();

  }


  console.log(
    'FIX-03D5.9 Certification Chain Trace V2 loaded / READ ONLY / ZERO WRITE / NO ENGINE EXECUTION'
  );

})();

