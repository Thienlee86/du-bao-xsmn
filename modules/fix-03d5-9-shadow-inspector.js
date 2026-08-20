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

/* =========================================================================
   FIX-03D5.9 — STEP 8.3B SOURCE TRACE V1

   PURPOSE:
   - Inspect LAST_FIX03D59_STEP83B_RESULT.
   - Trace the 4 legacy/test province candidates.
   - Inspect nearby FIX03D59 RAM objects that may precede STEP 8.3B.
   - Mobile UI only.
   - READ ONLY.
   - ZERO WRITE.
   - NO ENGINE EXECUTION.
   ========================================================================= */

(function () {

  'use strict';


  const PANEL_ID =
    'fix03d59-step83b-source-trace-panel';


  const OUTPUT_ID =
    'fix03d59-step83b-source-trace-output';


  const LEGACY_PROVINCES =
    [
      'tp-hcm',
      'tay-ninh',
      'tien-giang',
      'binh-duong'
    ];


  /* =========================================================
     HELPERS
     ========================================================= */

  function escape83B(value) {

    return String(
      value ?? '--'
    )
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  }


  function safeKeys83B(value) {

    if (
      !value ||
      typeof value !== 'object'
    ) {

      return [];

    }


    try {

      return Object.keys(value);

    } catch (error) {

      return [];

    }

  }


  function normalizeProvince83B(value) {

    return String(
      value ?? ''
    )
      .trim()
      .toLowerCase();

  }


  function isLegacyProvince83B(value) {

    return LEGACY_PROVINCES.includes(
      normalizeProvince83B(value)
    );

  }


  function getSelectedProvince83B() {

    try {

      const select =
        document.getElementById(
          'provinceSelect'
        );


      if (
        select &&
        select.value
      ) {

        return select.value;

      }

    } catch (error) {

      // READ ONLY
    }


    return null;

  }


  /* =========================================================
     FIND PROVINCE PATHS INSIDE AN OBJECT
     ========================================================= */

  function findProvincePaths83B(
    root,
    rootName
  ) {

    const found =
      [];


    const visited =
      new WeakSet();


    function walk(
      value,
      path,
      depth
    ) {

      if (depth > 8) {

        return;

      }


      if (
        !value ||
        typeof value !== 'object'
      ) {

        return;

      }


      if (visited.has(value)) {

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
        key => {

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


          const lowerKey =
            String(key)
              .toLowerCase();


          if (
            lowerKey.includes(
              'province'
            )
          ) {

            const normalized =
              (
                child &&
                typeof child === 'object'
              )
                ? '[object]'
                : String(
                    child ?? '--'
                  );


            found.push({

              path:
                childPath,

              value:
                normalized,

              legacy:
                isLegacyProvince83B(
                  normalized
                )

            });

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


    if (
      root &&
      typeof root === 'object'
    ) {

      walk(
        root,
        rootName,
        0
      );

    }


    return found;

  }


  /* =========================================================
     INSPECT ONE CANDIDATE
     ========================================================= */

  function inspectCandidate83B(
    candidate,
    index
  ) {

    const keys =
      safeKeys83B(
        candidate
      );


    const provincePaths =
      findProvincePaths83B(
        candidate,
        'candidate[' + index + ']'
      );


    const primitiveFields =
      [];


    keys.forEach(
      key => {

        let value;


        try {

          value =
            candidate[key];

        } catch (error) {

          return;

        }


        if (
          value === null ||
          (
            typeof value !==
            'object' &&
            typeof value !==
            'function'
          )
        ) {

          primitiveFields.push({

            key,
            value:
              String(
                value ?? '--'
              )

          });

        }

      }
    );


    return {

      index,

      province:
        candidate?.province ||
        candidate?.provinceSlug ||
        null,

      keys,

      primitiveFields,

      provincePaths,

      legacy:
        isLegacyProvince83B(
          candidate?.province ||
          candidate?.provinceSlug
        )

    };

  }


  /* =========================================================
     DISCOVER NEARBY FIX03D59 RAM OBJECTS
     ========================================================= */

  function discoverNearbyRam83B() {

    const results =
      [];


    let names =
      [];


    try {

      names =
        Object.getOwnPropertyNames(
          window
        );

    } catch (error) {

      return results;

    }


    names.forEach(
      name => {

        const upper =
          String(name)
            .toUpperCase();


        /*
         * Only inspect FIX03D59 / STEP83-related RAM.
         * Do not execute functions.
         */

        if (
          !(
            upper.includes(
              'FIX03D59'
            ) ||
            upper.includes(
              'STEP83'
            )
          )
        ) {

          return;

        }


        let value;


        try {

          value =
            window[name];

        } catch (error) {

          return;

        }


        if (
          !value ||
          typeof value !== 'object'
        ) {

          return;

        }


        const provincePaths =
          findProvincePaths83B(
            value,
            name
          );


        const legacyPaths =
          provincePaths.filter(
            item =>
              item.legacy === true
          );


        results.push({

          name,

          keys:
            safeKeys83B(value),

          provincePaths,

          legacyPaths,

          containsLegacy:
            legacyPaths.length > 0

        });

      }
    );


    results.sort(
      (a, b) => {

        if (
          a.containsLegacy !==
          b.containsLegacy
        ) {

          return a.containsLegacy
            ? -1
            : 1;

        }


        return String(a.name)
          .localeCompare(
            String(b.name)
          );

      }
    );


    return results;

  }


  /* =========================================================
     MAIN TRACE
     ========================================================= */

  function inspectStep83BSource() {

    const selectedProvince =
      getSelectedProvince83B();


    const result =
      window
        .LAST_FIX03D59_STEP83B_RESULT ||
      null;


    const candidates =
      Array.isArray(
        result?.candidates
      )
        ? result.candidates
        : [];


    const candidateDetails =
      candidates.map(
        (candidate, index) =>
          inspectCandidate83B(
            candidate,
            index
          )
      );


    const rootProvincePaths =
      findProvincePaths83B(
        result,
        'LAST_FIX03D59_STEP83B_RESULT'
      );


    const nearbyRam =
      discoverNearbyRam83B();


    const legacyNearby =
      nearbyRam.filter(
        item =>
          item.containsLegacy
      );


    return {

      timestamp:
        new Date()
          .toISOString(),

      selectedProvince,

      step83BExists:
        Boolean(result),

      rootKeys:
        safeKeys83B(result),

      candidateCount:
        candidates.length,

      candidateDetails,

      rootProvincePaths,

      nearbyRamCount:
        nearbyRam.length,

      legacyNearbyCount:
        legacyNearby.length,

      nearbyRam,

      legacyNearby,

      readOnly:
        true,

      writeAuthorized:
        false,

      engineExecuted:
        false

    };

  }


  /* =========================================================
     RENDER
     ========================================================= */

  function renderStep83BTrace(
    trace,
    output
  ) {

    let html = `

      <div
        style="
          margin-top:16px;
          padding:16px;
          border-radius:18px;
          background:rgba(0,0,0,.16);
          line-height:1.6;
        "
      >

        <div
          style="
            color:#ffbd3c;
            font-weight:900;
            font-size:17px;
            margin-bottom:10px;
          "
        >
          🔬 STEP 8.3B SOURCE SUMMARY
        </div>

        <div>
          Selected Province:
          <b>
            ${escape83B(
              trace.selectedProvince
            )}
          </b>
        </div>

        <div>
          STEP 8.3B Exists:
          <b>
            ${
              trace.step83BExists
                ? 'YES ✅'
                : 'NO ❌'
            }
          </b>
        </div>

        <div>
          Candidate Count:
          <b>
            ${trace.candidateCount}
          </b>
        </div>

        <div>
          Nearby RAM Objects:
          <b>
            ${trace.nearbyRamCount}
          </b>
        </div>

        <div>
          RAM Objects Carrying Legacy Provinces:
          <b>
            ${trace.legacyNearbyCount}
          </b>
        </div>

        <div
          style="
            margin-top:14px;
            color:#ffbd3c;
            font-weight:900;
          "
        >
          ROOT KEYS
        </div>

        <div
          style="
            word-break:break-word;
            opacity:.82;
          "
        >
          ${
            escape83B(
              trace.rootKeys.join(', ') ||
              '[none]'
            )
          }
        </div>

      </div>

    `;


    trace.candidateDetails.forEach(
      item => {

        html += `

          <div
            style="
              margin-top:14px;
              padding:16px;
              border-radius:18px;
              background:${
                item.legacy
                  ? 'rgba(255,80,80,.14)'
                  : 'rgba(45,200,120,.10)'
              };
              line-height:1.6;
            "
          >

            <div
              style="
                font-weight:900;
                font-size:17px;
              "
            >
              ${
                item.legacy
                  ? '❌'
                  : '✅'
              }
              Candidate ${item.index + 1}
            </div>

            <div>
              Province:
              <b>
                ${escape83B(
                  item.province
                )}
              </b>
            </div>

            <div>
              Legacy/Test Match:
              <b>
                ${
                  item.legacy
                    ? 'YES ⚠️'
                    : 'NO ✅'
                }
              </b>
            </div>

            <div
              style="
                margin-top:8px;
                color:#ffbd3c;
                font-weight:800;
              "
            >
              Candidate Keys
            </div>

            <div
              style="
                word-break:break-word;
                opacity:.82;
              "
            >
              ${escape83B(
                item.keys.join(', ') ||
                '[none]'
              )}
            </div>

        `;


        if (
          item.primitiveFields.length
        ) {

          html += `

            <div
              style="
                margin-top:10px;
                color:#ffbd3c;
                font-weight:800;
              "
            >
              Primitive Fields
            </div>

          `;


          item.primitiveFields.forEach(
            field => {

              html += `

                <div
                  style="
                    margin-top:4px;
                    word-break:break-word;
                  "
                >
                  ${escape83B(
                    field.key
                  )}:
                  <b>
                    ${escape83B(
                      field.value
                    )}
                  </b>
                </div>

              `;

            }
          );

        }


        html += `

          </div>

        `;

      }
    );


    html += `

      <div
        style="
          margin-top:20px;
          color:#ffbd3c;
          font-size:18px;
          font-weight:900;
        "
      >
        🧭 LEGACY PROVINCE RAM SOURCES
      </div>

      <div
        style="
          margin-top:6px;
          opacity:.75;
          line-height:1.5;
        "
      >
        Các object RAM đang chứa một hoặc nhiều
        tỉnh test cũ. Object xuất hiện ở đây
        không mặc nhiên là nguyên nhân; đây là
        danh sách để truy ngược nguồn.
      </div>

    `;


    if (
      trace.legacyNearby.length === 0
    ) {

      html += `

        <div
          style="
            margin-top:12px;
            padding:14px;
            border-radius:14px;
            background:rgba(45,200,120,.10);
          "
        >
          Không tìm thấy object FIX03D59/STEP83
          khác đang mang 4 tỉnh test.
        </div>

      `;

    }


    trace.legacyNearby.forEach(
      (item, index) => {

        html += `

          <div
            style="
              margin-top:12px;
              padding:15px;
              border-radius:16px;
              background:rgba(255,189,60,.09);
              border:1px solid rgba(255,189,60,.20);
              line-height:1.55;
            "
          >

            <div
              style="
                font-weight:900;
                word-break:break-word;
              "
            >
              ${index + 1}.
              ${escape83B(
                item.name
              )}
            </div>

            <div
              style="
                margin-top:6px;
                opacity:.75;
                word-break:break-word;
              "
            >
              Keys:
              ${escape83B(
                item.keys.join(', ') ||
                '[none]'
              )}
            </div>

        `;


        item.legacyPaths.forEach(
          path => {

            html += `

              <div
                style="
                  margin-top:7px;
                  word-break:break-word;
                "
              >
                📍
                ${escape83B(
                  path.path
                )}

                =
                <b>
                  ${escape83B(
                    path.value
                  )}
                </b>
              </div>

            `;

          }
        );


        html += `

          </div>

        `;

      }
    );


    html += `

      <div
        style="
          margin-top:18px;
          padding:14px;
          border-radius:14px;
          background:rgba(52,211,153,.12);
          color:#e4fff2;
          font-weight:900;
          line-height:1.55;
        "
      >
        🔒 READ ONLY · ZERO WRITE
        <br>
        NO ENGINE EXECUTION
      </div>

    `;


    output.innerHTML =
      html;

  }


  /* =========================================================
     RUN
     ========================================================= */

  function runStep83BSourceTrace() {

    const output =
      document.getElementById(
        OUTPUT_ID
      );


    if (!output) {

      return;

    }


    let trace;


    try {

      trace =
        inspectStep83BSource();

    } catch (error) {

      output.innerHTML = `

        <div
          style="
            margin-top:14px;
            padding:14px;
            border-radius:14px;
            background:rgba(255,80,80,.15);
          "
        >
          ❌ SOURCE TRACE ERROR
          <br><br>
          ${escape83B(
            error?.message ||
            String(error)
          )}
        </div>

      `;

      return;

    }


    window
      .LAST_FIX03D59_STEP83B_SOURCE_TRACE =
      trace;


    renderStep83BTrace(
      trace,
      output
    );

  }


  /* =========================================================
     BUILD MOBILE UI
     ========================================================= */

  function buildStep83BSourceTraceUI() {

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
      'margin:18px 24px 30px',
      'padding:20px',
      'border-radius:24px',
      'background:linear-gradient(145deg,#242d67,#1b214b)',
      'border:1px solid rgba(255,193,61,.30)',
      'color:#fff',
      'box-sizing:border-box'
    ].join(';');


    panel.innerHTML = `

      <div
        style="
          font-size:20px;
          font-weight:900;
        "
      >
        🔬 STEP 8.3B SOURCE TRACE
      </div>

      <div
        style="
          margin-top:8px;
          opacity:.72;
          line-height:1.55;
        "
      >
        Truy ngược nguồn của 4 province
        xuất hiện tại checkpoint 8.3B.
      </div>

      <div
        style="
          margin-top:7px;
          opacity:.72;
          font-size:13px;
        "
      >
        READ ONLY · ZERO WRITE · NO ENGINE EXECUTION
      </div>

      <div
        id="fix03d59-step83b-source-trace-control"
        role="button"
        tabindex="0"
        style="
          display:flex;
          width:100%;
          min-height:60px;
          margin-top:18px;
          padding:15px;
          border-radius:16px;
          background:linear-gradient(90deg,#ffc13d,#ff963d);
          color:#17182a;
          font-size:16px;
          font-weight:900;
          align-items:center;
          justify-content:center;
          text-align:center;
          box-sizing:border-box;
        "
      >
        🔬 RUN 8.3B SOURCE TRACE
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
        'fix03d59-step83b-source-trace-control'
      );


    if (control) {

      control.addEventListener(
        'click',
        runStep83BSourceTrace
      );


      control.addEventListener(
        'keydown',
        function (event) {

          if (
            event.key === 'Enter' ||
            event.key === ' '
          ) {

            event.preventDefault();

            runStep83BSourceTrace();

          }

        }
      );

    }

  }


  /* =========================================================
     INITIALIZE
     ========================================================= */

  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      buildStep83BSourceTraceUI,
      {
        once: true
      }
    );

  } else {

    window.setTimeout(
      buildStep83BSourceTraceUI,
      300
    );

  }


  window.inspectStep83BSource03D59 =
    inspectStep83BSource;


  window.runStep83BSourceTrace03D59 =
    runStep83BSourceTrace;


  window.FIX03D59_STEP83B_SOURCE_TRACE_LOADED =
    true;


  console.log(
    'FIX-03D5.9 STEP 8.3B SOURCE TRACE V1 loaded / READ ONLY / ZERO WRITE'
  );

})();

/* =========================================================================
   FIX-03D5.9 — SOURCE TRACE V1 MOBILE LOAD MARKER
   DIAGNOSTIC ONLY · READ ONLY · ZERO WRITE
   ========================================================================= */

(function () {

  'use strict';

  function buildSourceTraceLoadMarker03D59() {

    if (
      document.getElementById(
        'fix03d59-source-trace-load-marker'
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

    const marker =
      document.createElement('div');

    marker.id =
      'fix03d59-source-trace-load-marker';

    marker.style.cssText = [
      'margin:18px 24px 30px',
      'padding:18px',
      'border-radius:20px',
      'background:#20264f',
      'border:1px solid rgba(255,193,61,.35)',
      'color:#ffffff',
      'font-weight:800',
      'line-height:1.6',
      'box-sizing:border-box'
    ].join(';');

    marker.innerHTML = `
      🧭 SOURCE TRACE V1 LOAD MARKER
      <br>
      <span style="opacity:.72;font-weight:600;">
        Shadow Inspector reached end of file.
      </span>
      <br>
      <span style="color:#9ff0c8;">
        🔒 READ ONLY · ZERO WRITE
      </span>
    `;

    settings.appendChild(
      marker
    );

  }


  if (
    document.readyState ===
    'loading'
  ) {

    document.addEventListener(
      'DOMContentLoaded',
      buildSourceTraceLoadMarker03D59,
      {
        once: true
      }
    );

  } else {

    buildSourceTraceLoadMarker03D59();

  }


  window.FIX03D59_SOURCE_TRACE_LOAD_MARKER =
    true;

})();


/* =========================================================================
   FIX-03D5.9 — STEP 8.2A SOURCE TRACE
   DIAGNOSTIC ONLY · READ ONLY · ZERO WRITE
   ========================================================================= */

(function () {

  'use strict';

  window.FIX03D59_STEP82A_SOURCE_TRACE_LOADED =
    true;

  console.log(
    'FIX-03D5.9 STEP 8.2A SOURCE TRACE loaded / READ ONLY / ZERO WRITE'
  );

})();

