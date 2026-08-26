/* =========================================================================
   FIX-03D5.9
   PRODUCTION BRIDGE — STEP 3.4B
   ISOLATED ENGINE EXECUTOR V1

   PURPOSE:
   - Consume the FINAL method resolved by STEP 3.3.
   - Execute the existing V2 Production engine when route = PRODUCTION.
   - Execute the verified V2.6 scoring primitives when route = ADAPTIVE.
   - Normalize both routes into one forecast-compatible schema.
   - Store result ONLY in isolated diagnostic RAM.

   IMPORTANT:
   - ENGINE EXECUTION IS ALLOWED.
   - NO LAST_FORECAST modification.
   - NO savePrediction().
   - NO saveJSON().
   - NO localStorage write.
   - NO renderForecast().
   - NO automatic promotion.
   - NO model reselection.
   - NO adaptive-window reselection.

   FAIL CLOSED.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'PRODUCTION-ENGINE-EXECUTOR-V1';


  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

  function safeString(value) {

    if (
      value === null ||
      value === undefined
    ) {
      return '';
    }

    return String(value);

  }


  function normalizeProvince(value) {

    return safeString(value)
      .trim()
      .toLowerCase();

  }


  function finiteNumber(value) {

    const number =
      Number(value);

    return Number.isFinite(number)
      ? number
      : null;

  }


  function failure(
    province,
    reason,
    extra
  ) {

    return Object.assign(
      {

        ready: false,
        passed: false,

        step:
          'PRODUCTION-BRIDGE-3.4B',

        version:
          VERSION,

        province:
          province || null,

        route:
          null,

        strategy:
          null,

        model:
          null,

        window:
          null,

        reason:
          reason ||
          'EXECUTION_FAILED',

        forecast:
          null,

        engineExecuted:
          false,

        /*
         * SAFETY
         */

        isolated:
          true,

        productionPromoted:
          false,

        productionWrite:
          false,

        storageWrite:
          false,

        lastForecastModified:
          false,

        savePredictionCalled:
          false,

        renderForecastCalled:
          false

      },

      extra || {}

    );

  }


  /*
   * =========================================================
   * PRIZE DEFINITIONS
   * =========================================================
   */

  function getPrizeMeta() {

    /*
     * Prefer the exact Production PRIZE_META
     * already used by app.js.
     */

    if (
      Array.isArray(
        window.PRIZE_META
      ) &&
      window.PRIZE_META.length
    ) {

      return window.PRIZE_META;

    }


    /*
     * Compatibility getter if PRIZE_META is lexical
     * rather than attached to window.
     */

    if (
      typeof window
        .getPrizeMeta03D59 ===
      'function'
    ) {

      try {

        const result =
          window
            .getPrizeMeta03D59();


        if (
          Array.isArray(result) &&
          result.length
        ) {

          return result;

        }

      } catch (error) {

        /*
         * Continue fail closed.
         */

      }

    }


    return null;

  }


  /*
   * =========================================================
   * MODEL CONFIG
   * =========================================================
   */

  function getAdaptiveConfig(
    model
  ) {

    if (!model) {
      return null;
    }


    /*
     * First use verified public helpers.
     */

    const helpers = [

      'getShadowModelConfigV26',

      'getModelLabConfigV23',

      'findModelLabConfigV23',

      'modelLabConfigByKeyV23'

    ];


    for (
      let i = 0;
      i < helpers.length;
      i++
    ) {

      const fn =
        window[
          helpers[i]
        ];


      if (
        typeof fn !==
        'function'
      ) {
        continue;
      }


      try {

        const result =
          fn(model);


        if (
          result &&
          result.weights
        ) {

          return result;

        }

      } catch (error) {

        /*
         * Try next verified source.
         */

      }

    }


    /*
     * Then inspect public config collections.
     */

    const collections = [

      window.MODEL_LAB_CONFIGS_V23,

      window.MODEL_CONFIGS_V23,

      window.V23_MODEL_CONFIGS,

      window.MODEL_LAB_MODELS_V23

    ];


    for (
      let i = 0;
      i < collections.length;
      i++
    ) {

      const source =
        collections[i];


      if (
        Array.isArray(source)
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


        if (
          found &&
          found.weights
        ) {

          return found;

        }

      }


      if (
        source &&
        typeof source ===
          'object' &&
        source[model] &&
        source[model].weights
      ) {

        return source[model];

      }

    }


    return null;

  }


  /*
   * =========================================================
   * RANK NORMALIZATION
   * =========================================================
   */

  function normalizeRankedNumbers(
    ranked,
    count
  ) {

    if (
      !Array.isArray(ranked)
    ) {
      return [];
    }


    const limit =
      Number.isFinite(
        Number(count)
      )
        ? Math.max(
            1,
            Number(count)
          )
        : ranked.length;


    return ranked
      .slice(0, limit)
      .map(
        (item, index) => {

          /*
           * rankedNumbers() may return either
           * objects or number-like values.
           */

          if (
            item &&
            typeof item ===
              'object'
          ) {

            const number =
              item.number ??
              item.num ??
              item.value ??
              item.key ??
              null;


            return {

              number:
                number !== null
                  ? String(number)
                      .padStart(2, '0')
                  : '--',

              rank:
                finiteNumber(
                  item.rank
                ) ||
                index + 1,

              score:
                finiteNumber(
                  item.score
                ),

              confidence:
                finiteNumber(
                  item.confidence
                ),

              reasoning:
                item.reasoning ||
                item.reason ||
                'V2.6 Adaptive Model'

            };

          }


          return {

            number:
              String(item)
                .padStart(2, '0'),

            rank:
              index + 1,

            score:
              null,

            confidence:
              null,

            reasoning:
              'V2.6 Adaptive Model'

          };

        }
      );

  }


  /*
   * =========================================================
   * PRODUCTION ROUTE
   * =========================================================
   */

  function executeProductionRoute(
    method,
    selectedWindow
  ) {

    const engine =
      window.generateFullForecast;


    if (
      typeof engine !==
      'function'
    ) {

      return failure(
        method.province,
        'V2_PRODUCTION_ENGINE_NOT_AVAILABLE',
        {
          route:
            'PRODUCTION',

          strategy:
            method.strategy,

          method
        }
      );

    }


    const windowSize =
      Number.isFinite(
        Number(selectedWindow)
      )
        ? Number(selectedWindow)
        : Number.isFinite(
            Number(method.window)
          )
          ? Number(method.window)
          : null;


    if (
      !windowSize ||
      windowSize <= 0
    ) {

      return failure(
        method.province,
        'V2_WINDOW_NOT_AVAILABLE',
        {
          route:
            'PRODUCTION',

          strategy:
            method.strategy,

          method
        }
      );

    }


    let forecast;


    try {

      forecast =
        engine(
          method.province,
          windowSize
        );

    } catch (error) {

      return failure(
        method.province,
        'V2_ENGINE_EXECUTION_ERROR',
        {

          route:
            'PRODUCTION',

          strategy:
            method.strategy,

          window:
            windowSize,

          error:
            error &&
            error.message
              ? error.message
              : String(error),

          method,

          engineExecuted:
            true

        }
      );

    }


    if (
      !forecast ||
      typeof forecast !==
        'object'
    ) {

      return failure(
        method.province,
        'V2_FORECAST_NOT_RETURNED',
        {

          route:
            'PRODUCTION',

          strategy:
            method.strategy,

          window:
            windowSize,

          method,

          engineExecuted:
            true

        }
      );

    }


    return {

      ready: true,
      passed: true,

      step:
        'PRODUCTION-BRIDGE-3.4B',

      version:
        VERSION,

      province:
        method.province,

      route:
        'PRODUCTION',

      strategy:
        method.strategy ||
        'V2_PRODUCTION',

      model:
        null,

      window:
        windowSize,

      reason:
        'V2_PRODUCTION_EXECUTED',

      method,

      forecast,

      engineExecuted:
        true,

      forecastGenerated:
        true,

      /*
       * SAFETY
       */

      isolated:
        true,

      productionPromoted:
        false,

      productionWrite:
        false,

      storageWrite:
        false,

      lastForecastModified:
        false,

      savePredictionCalled:
        false,

      renderForecastCalled:
        false

    };

  }


  /*
   * =========================================================
   * ADAPTIVE ROUTE
   * =========================================================
   */

  function executeAdaptiveRoute(
    method
  ) {

    /*
     * The Method Resolver is authoritative.
     * Do NOT select another model/window here.
     */

    const model =
      method.model;


    const windowSize =
      finiteNumber(
        method.window
      );


    if (!model) {

      return failure(
        method.province,
        'ADAPTIVE_MODEL_NOT_AVAILABLE',
        {
          route:
            'ADAPTIVE',

          strategy:
            method.strategy,

          method
        }
      );

    }


    if (
      !windowSize ||
      windowSize <= 0
    ) {

      return failure(
        method.province,
        'ADAPTIVE_WINDOW_NOT_AVAILABLE',
        {
          route:
            'ADAPTIVE',

          strategy:
            method.strategy,

          model,

          method
        }
      );

    }


    const config =
      getAdaptiveConfig(
        model
      );


    if (
      !config ||
      !config.weights
    ) {

      return failure(
        method.province,
        'ADAPTIVE_CONFIG_NOT_AVAILABLE',
        {

          route:
            'ADAPTIVE',

          strategy:
            method.strategy,

          model,

          window:
            windowSize,

          method

        }
      );

    }


    const historyGetter =
      window
        .getAllDrawsForProvince;


    const scorer =
      window
        .modelLabScoresV23;


    const ranker =
      window
        .rankedNumbers;


    if (
      typeof historyGetter !==
      'function'
    ) {

      return failure(
        method.province,
        'HISTORY_GETTER_NOT_AVAILABLE',
        {
          route:
            'ADAPTIVE',

          model,

          window:
            windowSize,

          method
        }
      );

    }


    if (
      typeof scorer !==
      'function'
    ) {

      return failure(
        method.province,
        'ADAPTIVE_SCORER_NOT_AVAILABLE',
        {
          route:
            'ADAPTIVE',

          model,

          window:
            windowSize,

          method
        }
      );

    }


    if (
      typeof ranker !==
      'function'
    ) {

      return failure(
        method.province,
        'RANKER_NOT_AVAILABLE',
        {
          route:
            'ADAPTIVE',

          model,

          window:
            windowSize,

          method
        }
      );

    }


    let history;


    try {

      history =
        historyGetter(
          method.province
        );

    } catch (error) {

      return failure(
        method.province,
        'HISTORY_READ_ERROR',
        {

          route:
            'ADAPTIVE',

          model,

          window:
            windowSize,

          error:
            error &&
            error.message
              ? error.message
              : String(error),

          method

        }
      );

    }


    if (
      !Array.isArray(history) ||
      !history.length
    ) {

      return failure(
        method.province,
        'NO_HISTORY_FOR_ADAPTIVE',
        {

          route:
            'ADAPTIVE',

          model,

          window:
            windowSize,

          historyCount:
            Array.isArray(history)
              ? history.length
              : 0,

          method

        }
      );

    }


    const prizeMeta =
      getPrizeMeta();


    if (
      !Array.isArray(prizeMeta) ||
      !prizeMeta.length
    ) {

      return failure(
        method.province,
        'PRIZE_META_NOT_AVAILABLE',
        {

          route:
            'ADAPTIVE',

          model,

          window:
            windowSize,

          historyCount:
            history.length,

          method

        }
      );

    }


    const items = [];


    /*
     * ---------------------------------------------------------
     * RUN THE SAME APPROVED MODEL/WINDOW
     * ACROSS THE EXISTING PRODUCTION PRIZE CONTRACT.
     * ---------------------------------------------------------
     */

    try {

      prizeMeta.forEach(
        prize => {

          if (
            !prize ||
            !prize.key
          ) {
            return;
          }


          const scored =
            scorer(
              history,
              prize.key,
              windowSize,
              config.weights
            );


          /*
           * Existing modelLabScoresV23 contract
           * may expose scores directly or through
           * a result object.
           */

          const scores =
            scored &&
            typeof scored ===
              'object' &&
            scored.scores
              ? scored.scores
              : scored;


          const ranked =
            ranker(
              scores
            );


          /*
           * Use Production prize count when exposed.
           * Otherwise retain ranked output.
           */

          const requestedCount =
            finiteNumber(
              prize.count
            ) ||
            finiteNumber(
              prize.pickCount
            ) ||
            finiteNumber(
              prize.outputCount
            ) ||
            ranked.length;


          const numbers =
            normalizeRankedNumbers(
              ranked,
              requestedCount
            );


          items.push({

            key:
              prize.key,

            label:
              prize.label ||
              prize.name ||
              prize.key,

            numbers

          });

        }
      );

    } catch (error) {

      return failure(
        method.province,
        'ADAPTIVE_ENGINE_EXECUTION_ERROR',
        {

          route:
            'ADAPTIVE',

          strategy:
            method.strategy,

          model,

          window:
            windowSize,

          historyCount:
            history.length,

          error:
            error &&
            error.message
              ? error.message
              : String(error),

          method,

          engineExecuted:
            true

        }
      );

    }


    if (!items.length) {

      return failure(
        method.province,
        'ADAPTIVE_ITEMS_NOT_CREATED',
        {

          route:
            'ADAPTIVE',

          model,

          window:
            windowSize,

          historyCount:
            history.length,

          method,

          engineExecuted:
            true

        }
      );

    }


    const forecast = {

      version:
        'V2.6-ADAPTIVE',

      province:
        method.province,

      windowSize:
        windowSize,

      generatedAt:
        new Date()
          .toISOString(),

      items,

      execution: {

        route:
          'ADAPTIVE',

        strategy:
          method.strategy,

        model,

        adaptiveWindow:
          windowSize

      }

    };


    return {

      ready: true,
      passed: true,

      step:
        'PRODUCTION-BRIDGE-3.4B',

      version:
        VERSION,

      province:
        method.province,

      route:
        'ADAPTIVE',

      strategy:
        method.strategy,

      model,

      window:
        windowSize,

      reason:
        'V26_ADAPTIVE_EXECUTED',

      historyCount:
        history.length,

      prizeCount:
        items.length,

      method,

      forecast,

      engineExecuted:
        true,

      forecastGenerated:
        true,

      /*
       * SAFETY
       */

      isolated:
        true,

      productionPromoted:
        false,

      productionWrite:
        false,

      storageWrite:
        false,

      lastForecastModified:
        false,

      savePredictionCalled:
        false,

      renderForecastCalled:
        false

    };

  }


  /*
   * =========================================================
   * MAIN EXECUTOR
   * =========================================================
   */

  function executeProductionEngine03D59(
    provinceSlug,
    selectedWindow
  ) {

    const province =
      normalizeProvince(
        provinceSlug
      );


    if (!province) {

      return failure(
        province,
        'INVALID_PROVINCE'
      );

    }


    /*
     * STEP 3.3 IS THE ONLY ROUTE AUTHORITY.
     */

    const resolver =
      window
        .resolveProductionMethod03D59;


    if (
      typeof resolver !==
      'function'
    ) {

      return failure(
        province,
        'STEP33_METHOD_RESOLVER_NOT_AVAILABLE'
      );

    }


    let method;


    try {

      method =
        resolver(
          province,
          'db',
          selectedWindow
        );

    } catch (error) {

      return failure(
        province,
        'STEP33_RESOLUTION_ERROR',
        {

          error:
            error &&
            error.message
              ? error.message
              : String(error)

        }
      );

    }


    if (
      !method ||
      method.ready !== true
    ) {

      return failure(
        province,
        'STEP33_METHOD_NOT_READY',
        {
          method:
            method || null
        }
      );

    }


    let result;


    if (
      method.route ===
      'PRODUCTION'
    ) {

      result =
        executeProductionRoute(
          method,
          selectedWindow
        );

    } else if (
      method.route ===
      'ADAPTIVE'
    ) {

      result =
        executeAdaptiveRoute(
          method
        );

    } else {

      result =
        failure(
          province,
          'UNKNOWN_METHOD_ROUTE',
          {
            method
          }
        );

    }


    /*
     * =========================================================
     * ISOLATED RAM ONLY
     * =========================================================
     *
     * This is NOT LAST_FORECAST.
     * This is NOT persisted.
     */

    window
      .LAST_FIX03D59_PRODUCTION_EXECUTION =
      result;


    return result;

  }


  /*
   * =========================================================
   * INSPECTOR
   * =========================================================
   */

  function inspectProductionEngineExecutor03D59() {

    return {

      loaded: true,

      version:
        VERSION,

      methodResolverAvailable:
        typeof window
          .resolveProductionMethod03D59 ===
        'function',

      productionEngineAvailable:
        typeof window
          .generateFullForecast ===
        'function',

      historyGetterAvailable:
        typeof window
          .getAllDrawsForProvince ===
        'function',

      adaptiveScorerAvailable:
        typeof window
          .modelLabScoresV23 ===
        'function',

      rankerAvailable:
        typeof window
          .rankedNumbers ===
        'function',

      prizeMetaAvailable:
        Boolean(
          getPrizeMeta()
        ),

      lastExecution:
        window
          .LAST_FIX03D59_PRODUCTION_EXECUTION ||
        null,

      /*
       * SAFETY CONTRACT
       */

      isolated:
        true,

      productionPromoted:
        false,

      productionWrite:
        false,

      storageWrite:
        false,

      lastForecastModified:
        false,

      savePredictionCalled:
        false,

      renderForecastCalled:
        false

    };

  }


  /*
   * =========================================================
   * PUBLIC API
   * =========================================================
   */

  window
    .executeProductionEngine03D59 =
    executeProductionEngine03D59;


  window
    .inspectProductionEngineExecutor03D59 =
    inspectProductionEngineExecutor03D59;


  window
    .FIX03D59_PRODUCTION_ENGINE_EXECUTOR_LOADED =
    true;


  window
    .FIX03D59_PRODUCTION_ENGINE_EXECUTOR_VERSION =
    VERSION;


  console.log(
    'FIX-03D5.9 Production Bridge Step 3.4B Engine Executor loaded — ISOLATED'
  );

})();
