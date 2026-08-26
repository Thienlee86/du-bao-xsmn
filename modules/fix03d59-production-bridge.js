/* =========================================================================
   FIX-03D5.9 — PRODUCTION BRIDGE
   STEP 1 — PRODUCTION DECISION RESOLVER

   PURPOSE:
   - Resolve the production strategy for ONE province.
   - Reuse the verified V2.6 Decision Layer.
   - Prepare Adaptive configuration for future Production scoring.
   - Preserve V2 as the fail-closed fallback.

   IMPORTANT:
   - NO forecast generation.
   - NO engine execution.
   - NO LAST_FORECAST modification.
   - NO savePrediction().
   - NO saveJSON().
   - NO localStorage write.
   - NO production write.
   - NO automatic promotion.

   STEP 1 IS RESOLUTION ONLY.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'PRODUCTION-BRIDGE-STEP1-V1';


  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

  function safeString(
    value
  ) {

    if (
      value === null ||
      value === undefined
    ) {

      return '';

    }


    return String(
      value
    );

  }


  function normalizeProvinceSlug(
    provinceSlug
  ) {

    return safeString(
      provinceSlug
    )
      .trim();

  }


  function fallbackResult(
    provinceSlug,
    reason,
    extra
  ) {

    return Object.assign(
      {

        ready: true,

        passed: true,

        version:
          VERSION,

        bridgeStep:
          'STEP1',

        province:
          provinceSlug,

        strategy:
          'V2_FALLBACK',

        adaptive:
          false,

        fallback:
          true,

        reason:
          reason ||
          'V2_FALLBACK',

        model:
          null,

        window:
          null,

        config:
          null,

        writeAuthorized:
          false,

        productionWrite:
          false,

        storageWrite:
          false,

        forecastGenerated:
          false,

        lastForecastModified:
          false,

        savePredictionCalled:
          false

      },

      extra || {}

    );

  }


  /*
   * =========================================================
   * FIND EXISTING DECISION LAYER
   * =========================================================
   */

  function getDecisionRows() {

    /*
     * IMPORTANT:
     *
     * STEP 1 must NOT run Cross-OOS,
     * certification or bootstrap.
     *
     * It only consumes an already-created
     * Decision Layer from RAM.
     */


    const candidates = [

      window
        .LAST_V26_PROVINCE_DECISION_LAYER,

      window
        .LAST_V26_DECISION_LAYER,

      window
        .LAST_FIX03D59_PROVINCE_DECISION_LAYER,

      window
        .LAST_FIX03D59_DECISION_LAYER

    ];


    for (
      let i = 0;
      i < candidates.length;
      i++
    ) {

      const source =
        candidates[i];


      if (
        Array.isArray(
          source
        ) &&
        source.length
      ) {

        return {

          ready: true,

          sourceType:
            'ARRAY',

          rows:
            source

        };

      }


      if (
        source &&
        Array.isArray(
          source.rows
        ) &&
        source.rows.length
      ) {

        return {

          ready: true,

          sourceType:
            'ROWS',

          rows:
            source.rows,

          source

        };

      }


      if (
        source &&
        Array.isArray(
          source.results
        ) &&
        source.results.length
      ) {

        return {

          ready: true,

          sourceType:
            'RESULTS',

          rows:
            source.results,

          source

        };

      }

    }


    /*
     * Existing verified helper from V2.6,
     * if available.
     *
     * This helper is allowed ONLY when it
     * reads the existing Decision Layer.
     */

    if (
      typeof window
        .getReadyDecisionLayerForShadowV26 ===
      'function'
    ) {

      try {

        const result =
          window
            .getReadyDecisionLayerForShadowV26();


        if (
          result &&
          result.ready &&
          Array.isArray(
            result.rows
          ) &&
          result.rows.length
        ) {

          return {

            ready: true,

            sourceType:
              'V26_SHADOW_DECISION_READER',

            rows:
              result.rows,

            source:
              result

          };

        }

      } catch (
        error
      ) {

        return {

          ready: false,

          reason:
            'DECISION_READER_ERROR',

          error:
            error &&
            error.message
              ? error.message
              : String(error)

        };

      }

    }


    return {

      ready: false,

      reason:
        'DECISION_LAYER_NOT_AVAILABLE'

    };

  }


  /*
   * =========================================================
   * FIND ONE PROVINCE
   * =========================================================
   */

  function provinceOfRow(
    row
  ) {

    if (!row) {

      return '';

    }


    return normalizeProvinceSlug(

      row.province ||
      row.provinceSlug ||
      row.slug ||
      (
        row.decision &&
        (
          row.decision.province ||
          row.decision.provinceSlug
        )
      )

    );

  }


  function findProvinceDecision(
    rows,
    provinceSlug
  ) {

    const wanted =
      normalizeProvinceSlug(
        provinceSlug
      );


    if (!wanted) {

      return null;

    }


    return (
      rows.find(
        row =>
          provinceOfRow(
            row
          ) ===
          wanted
      ) ||
      null
    );

  }


  /*
   * =========================================================
   * NORMALIZE DECISION
   * =========================================================
   */

  function normalizeDecision(
    row
  ) {

    if (
      !row ||
      typeof row !==
      'object'
    ) {

      return null;

    }


    const decision =
      row.decision &&
      typeof row.decision ===
      'object'
        ? row.decision
        : row;


    const model =
      decision.model ||
      row.model ||
      null;


    const windowSize =
      Number(

        decision.window ||
        decision.windowSize ||
        row.window ||
        row.windowSize

      );


    const strategyRaw =
      safeString(

        decision.strategy ||
        decision.recommendation ||
        decision.classification ||
        row.strategy ||
        row.recommendation ||
        row.classification

      )
        .trim()
        .toUpperCase();


    return {

      raw:
        row,

      decision,

      model,

      window:
        Number.isFinite(
          windowSize
        )
          ? windowSize
          : null,

      strategyRaw

    };

  }


  /*
   * =========================================================
   * DETERMINE WHETHER DECISION APPROVES ADAPTIVE
   * =========================================================
   */

  function isAdaptiveDecision(
    normalized
  ) {

    if (!normalized) {

      return false;

    }


    const decision =
      normalized.decision ||
      {};


    /*
     * Prefer explicit boolean flags
     * when the Decision Layer provides them.
     */

    if (
      decision.productionApproved ===
      true
    ) {

      return true;

    }


    if (
      decision.adaptiveApproved ===
      true
    ) {

      return true;

    }


    if (
      decision.useAdaptive ===
      true
    ) {

      return true;

    }


    /*
     * Otherwise consume the existing
     * Decision Layer classification.
     */

    const text =
      normalized.strategyRaw;


    return (

      text ===
        'RECOMMEND_ADAPTIVE' ||

      text ===
        'ADAPTIVE' ||

      text ===
        'USE_ADAPTIVE'

    );

  }


  /*
   * =========================================================
   * RESOLVE MODEL CONFIG
   * =========================================================
   */

  function resolveModelConfig(
    model
  ) {

    if (!model) {

      return null;

    }


    /*
     * V2.6 Model Lab configurations already
     * exist in app.js.
     *
     * Do not duplicate weights here.
     */


    const sources = [

      window.MODEL_LAB_CONFIGS_V23,

      window.MODEL_CONFIGS_V23,

      window.V23_MODEL_CONFIGS,

      window.MODEL_LAB_MODELS_V23

    ];


    for (
      let i = 0;
      i < sources.length;
      i++
    ) {

      const source =
        sources[i];


      if (
        Array.isArray(
          source
        )
      ) {

        const found =
          source.find(
            item =>
              item &&
              (
                item.key === model ||
                item.id === model ||
                item.name === model ||
                item.model === model
              )
          );


        if (found) {

          return found;

        }

      }


      if (
        source &&
        typeof source ===
        'object' &&
        source[model]
      ) {

        return source[model];

      }

    }


    /*
     * Existing helper may expose the
     * verified config without duplicating it.
     */

    const helperNames = [

      'getModelLabConfigV23',

      'findModelLabConfigV23',

      'modelLabConfigByKeyV23',

      'getShadowModelConfigV26'

    ];


    for (
      let i = 0;
      i < helperNames.length;
      i++
    ) {

      const fn =
        window[
          helperNames[i]
        ];


      if (
        typeof fn ===
        'function'
      ) {

        try {

          const config =
            fn(
              model
            );


          if (config) {

            return config;

          }

        } catch (
          error
        ) {

          /*
           * Fail closed.
           * Try next verified source.
           */

        }

      }

    }


    return null;

  }


  /*
   * =========================================================
   * MAIN PRODUCTION DECISION RESOLVER
   * =========================================================
   */

  function resolveProductionStrategy(
    provinceSlug
  ) {

    const slug =
      normalizeProvinceSlug(
        provinceSlug
      );


    if (!slug) {

      return fallbackResult(
        slug,
        'INVALID_PROVINCE'
      );

    }


    /*
     * ---------------------------------------------------------
     * READ EXISTING DECISION LAYER
     * ---------------------------------------------------------
     */

    const layer =
      getDecisionRows();


    if (
      !layer.ready
    ) {

      return fallbackResult(
        slug,
        layer.reason ||
        'DECISION_LAYER_NOT_AVAILABLE',
        {
          decisionLayerReady:
            false
        }
      );

    }


    /*
     * ---------------------------------------------------------
     * FIND THIS PROVINCE
     * ---------------------------------------------------------
     */

    const row =
      findProvinceDecision(
        layer.rows,
        slug
      );


    if (!row) {

      return fallbackResult(
        slug,
        'PROVINCE_DECISION_NOT_FOUND',
        {
          decisionLayerReady:
            true,

          decisionSource:
            layer.sourceType
        }
      );

    }


    /*
     * ---------------------------------------------------------
     * NORMALIZE
     * ---------------------------------------------------------
     */

    const normalized =
      normalizeDecision(
        row
      );


    if (!normalized) {

      return fallbackResult(
        slug,
        'INVALID_PROVINCE_DECISION'
      );

    }


    /*
     * ---------------------------------------------------------
     * DECISION DOES NOT APPROVE ADAPTIVE
     * ---------------------------------------------------------
     */

    if (
      !isAdaptiveDecision(
        normalized
      )
    ) {

      return fallbackResult(
        slug,
        'DECISION_REQUIRES_V2',
        {

          decisionLayerReady:
            true,

          decisionSource:
            layer.sourceType,

          decision:
            normalized.decision,

          classification:
            normalized.strategyRaw

        }
      );

    }


    /*
     * ---------------------------------------------------------
     * ADAPTIVE REQUIRES MODEL + WINDOW
     * ---------------------------------------------------------
     */

    if (
      !normalized.model
    ) {

      return fallbackResult(
        slug,
        'ADAPTIVE_MODEL_NOT_AVAILABLE',
        {
          decision:
            normalized.decision
        }
      );

    }


    if (
      !Number.isFinite(
        normalized.window
      ) ||
      normalized.window <= 0
    ) {

      return fallbackResult(
        slug,
        'ADAPTIVE_WINDOW_NOT_AVAILABLE',
        {
          decision:
            normalized.decision,

          model:
            normalized.model
        }
      );

    }


    /*
     * ---------------------------------------------------------
     * RESOLVE VERIFIED MODEL CONFIG
     * ---------------------------------------------------------
     */

    const config =
      resolveModelConfig(
        normalized.model
      );


    if (
      !config ||
      !config.weights
    ) {

      return fallbackResult(
        slug,
        'ADAPTIVE_CONFIG_NOT_AVAILABLE',
        {

          decision:
            normalized.decision,

          model:
            normalized.model,

          window:
            normalized.window

        }
      );

    }


    /*
     * ---------------------------------------------------------
     * SUCCESS
     * ---------------------------------------------------------
     */

    return {

      ready: true,

      passed: true,

      version:
        VERSION,

      bridgeStep:
        'STEP1',

      province:
        slug,

      strategy:
        'ADAPTIVE',

      adaptive:
        true,

      fallback:
        false,

      reason:
        'ADAPTIVE_DECISION_RESOLVED',

      model:
        normalized.model,

      window:
        normalized.window,

      config:
        config,

      decision:
        normalized.decision,

      classification:
        normalized.strategyRaw,

      decisionLayerReady:
        true,

      decisionSource:
        layer.sourceType,

      /*
       * STEP 1 safety contract.
       */

      writeAuthorized:
        false,

      productionWrite:
        false,

      storageWrite:
        false,

      forecastGenerated:
        false,

      lastForecastModified:
        false,

      savePredictionCalled:
        false

    };

  }


  /*
   * =========================================================
   * MANUAL INSPECTOR
   * =========================================================
   */

  function inspectProductionBridgeStep1(
    provinceSlug
  ) {

    const slug =
      normalizeProvinceSlug(

        provinceSlug ||
        window.SELECTED_PROVINCE ||
        (
          typeof SELECTED_PROVINCE !==
          'undefined'
            ? SELECTED_PROVINCE
            : ''
        )

      );


    const result =
      resolveProductionStrategy(
        slug
      );


    window
      .LAST_FIX03D59_PRODUCTION_BRIDGE_STEP1 =
      result;


    console.log(
      '=========================================='
    );

    console.log(
      'FIX-03D5.9 — PRODUCTION BRIDGE STEP 1'
    );

    console.log(
      'Province:',
      slug
    );

    console.log(
      'Strategy:',
      result.strategy
    );

    console.log(
      'Reason:',
      result.reason
    );

    console.log(
      'Model:',
      result.model
    );

    console.log(
      'Window:',
      result.window
    );

    console.log(
      'Decision Source:',
      result.decisionSource ||
      '--'
    );

    console.log(
      'Production Write:',
      result.productionWrite
    );

    console.log(
      'Storage Write:',
      result.storageWrite
    );

    console.log(
      'Forecast Generated:',
      result.forecastGenerated
    );

    console.log(
      '=========================================='
    );


    return result;

  }


  /*
   * =========================================================
   * PUBLIC API
   * =========================================================
   */

  window
    .resolveFix03D59ProductionStrategy =
    resolveProductionStrategy;


  window
    .inspectFix03D59ProductionBridgeStep1 =
    inspectProductionBridgeStep1;


  window
    .FIX03D59_PRODUCTION_BRIDGE_STEP1_LOADED =
    true;


  window
    .FIX03D59_PRODUCTION_BRIDGE_STEP1_VERSION =
    VERSION;


  console.log(
    'FIX-03D5.9 Production Bridge Step 1 loaded'
  );

})();
