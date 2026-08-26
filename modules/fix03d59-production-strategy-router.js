/* =========================================================================
   FIX-03D5.9
   PRODUCTION BRIDGE — STEP 3.1
   PRODUCTION STRATEGY ROUTER V1

   PURPOSE:
   - Resolve the Production strategy for the selected province.
   - Use the existing V2.6 Decision Layer.
   - Route province to:
       ADAPTIVE
       or
       V2_PRODUCTION
   - DO NOT execute either forecast engine yet.

   IMPORTANT:
   - READ ONLY.
   - ZERO PRODUCTION WRITE.
   - ZERO STORAGE WRITE.
   - DOES NOT modify LAST_FORECAST.
   - DOES NOT call savePrediction().
   - DOES NOT generate a forecast.
   - FAIL CLOSED.

   STEP 3.1 ONLY RESOLVES THE ROUTE.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'PRODUCTION-STRATEGY-ROUTER-V1';


  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

  function normalizeProvince31(
    value
  ) {

    if (
      typeof value !==
      'string'
    ) {

      return null;

    }


    const normalized =
      value
        .trim()
        .toLowerCase();


    if (
      !normalized ||
      normalized.length > 40
    ) {

      return null;

    }


    if (
      !/^[a-z0-9-]+$/.test(
        normalized
      )
    ) {

      return null;

    }


    return normalized;

  }


  function selectedProvince31() {

    /*
     * First use the app's current selected province.
     */

    const direct =
      normalizeProvince31(
        window.SELECTED_PROVINCE
      );


    if (direct) {

      return direct;

    }


    /*
     * Safe DOM fallback.
     */

    const select =
      document.getElementById(
        'provinceSelect'
      );


    if (select) {

      const domProvince =
        normalizeProvince31(
          select.value
        );


      if (domProvince) {

        return domProvince;

      }

    }


    return null;

  }


  function safeDecision31(
    province
  ) {

    /*
     * STEP 2 confirmed this is the
     * available Decision Layer reader.
     */

    const reader =
      window.getProvinceDecisionV26;


    if (
      typeof reader !==
      'function'
    ) {

      return {

        ready: false,

        reason:
          'DECISION_READER_NOT_AVAILABLE',

        decision:
          null,

        source:
          null

      };

    }


    try {

      const decision =
        reader(
          province
        );


      if (
        !decision ||
        typeof decision !==
          'object'
      ) {

        return {

          ready: false,

          reason:
            'DECISION_NOT_AVAILABLE',

          decision:
            null,

          source:
            'getProvinceDecisionV26'

        };

      }


      return {

        ready: true,

        reason:
          'DECISION_AVAILABLE',

        decision,

        source:
          'getProvinceDecisionV26'

      };


    } catch (error) {

      return {

        ready: false,

        reason:
          'DECISION_READER_ERROR',

        error:
          error &&
          error.message
            ? error.message
            : String(error),

        decision:
          null,

        source:
          'getProvinceDecisionV26'

      };

    }

  }


  /*
   * =========================================================
   * DECISION FIELD RESOLUTION
   * =========================================================
   */

  function getAction31(
    decision
  ) {

    if (!decision) {

      return null;

    }


    return (
      decision.action ||
      decision.decision ||
      decision.recommendation ||
      decision.selectedAction ||
      null
    );

  }


  function getClassification31(
    decision
  ) {

    if (!decision) {

      return null;

    }


    return (
      decision.classification ||
      decision.status ||
      decision.verdict ||
      null
    );

  }


  function getModel31(
    decision
  ) {

    if (!decision) {

      return null;

    }


    return (
      decision.model ||
      decision.selectedModel ||
      decision.bestModel ||
      null
    );

  }


  function getWindow31(
    decision
  ) {

    if (!decision) {

      return null;

    }


    return (
      decision.window ||
      decision.selectedWindow ||
      decision.bestWindow ||
      null
    );

  }


  function getGateScore31(
    decision
  ) {

    if (!decision) {

      return null;

    }


    return (
      decision.gateScore ??
      decision.score ??
      decision.stabilityScore ??
      null
    );

  }


  function getReason31(
    decision
  ) {

    if (!decision) {

      return null;

    }


    return (
      decision.reason ||
      decision.decisionReason ||
      null
    );

  }


  /*
   * =========================================================
   * ROUTE CLASSIFIER
   * =========================================================
   */

  function classifyRoute31(
    decision
  ) {

    const action =
      String(
        getAction31(
          decision
        ) || ''
      )
        .trim()
        .toUpperCase();


    /*
     * ---------------------------------------------------------
     * ADAPTIVE
     * ---------------------------------------------------------
     *
     * Only explicit adaptive approval may enter
     * the adaptive route.
     *
     * No inference from score alone.
     * No automatic promotion.
     * ---------------------------------------------------------
     */

    const adaptiveActions = [

      'ADAPTIVE',

      'USE_ADAPTIVE',

      'PROMOTE_ADAPTIVE',

      'ADAPTIVE_APPROVED',

      'USE_V26',

      'V26_ADAPTIVE'

    ];


    if (
      adaptiveActions.includes(
        action
      )
    ) {

      return {

        ready: true,

        route:
          'ADAPTIVE',

        strategy:
          'V2.6 ADAPTIVE',

        reason:
          'DECISION_APPROVED_ADAPTIVE'

      };

    }


    /*
     * ---------------------------------------------------------
     * KEEP PRODUCTION
     * ---------------------------------------------------------
     */

    const productionActions = [

      'KEEP_PRODUCTION',

      'KEEP_V2',

      'USE_V2',

      'V2',

      'FALLBACK',

      'V2_FALLBACK'

    ];


    if (
      productionActions.includes(
        action
      )
    ) {

      return {

        ready: true,

        route:
          'V2_PRODUCTION',

        strategy:
          'V2 PRODUCTION',

        reason:
          'DECISION_REQUIRES_V2'

      };

    }


    /*
     * ---------------------------------------------------------
     * UNKNOWN DECISION
     * ---------------------------------------------------------
     *
     * Fail closed.
     *
     * We do NOT guess an Adaptive route.
     * ---------------------------------------------------------
     */

    return {

      ready: false,

      route:
        null,

      strategy:
        null,

      reason:
        action
          ? 'UNSUPPORTED_DECISION_ACTION'
          : 'DECISION_ACTION_NOT_AVAILABLE'

    };

  }


  /*
   * =========================================================
   * MAIN ROUTER
   * =========================================================
   */

  function resolveProductionStrategy31(
    provinceInput
  ) {

    const province =
      normalizeProvince31(
        provinceInput
      ) ||
      selectedProvince31();


    /*
     * ---------------------------------------------------------
     * PROVINCE GUARD
     * ---------------------------------------------------------
     */

    if (!province) {

      return {

        ready: false,
        passed: false,

        step:
          'PRODUCTION-BRIDGE-3.1',

        version:
          VERSION,

        province:
          null,

        route:
          null,

        strategy:
          null,

        reason:
          'PROVINCE_NOT_AVAILABLE',

        /*
         * SAFETY
         */

        readOnly: true,
        engineExecuted: false,
        forecastGenerated: false,
        productionWrite: false,
        storageWrite: false,
        lastForecastModified: false,
        savePredictionCalled: false

      };

    }


    /*
     * ---------------------------------------------------------
     * READ DECISION
     * ---------------------------------------------------------
     */

    const decisionRead =
      safeDecision31(
        province
      );


    if (
      !decisionRead.ready
    ) {

      return {

        ready: false,
        passed: false,

        step:
          'PRODUCTION-BRIDGE-3.1',

        version:
          VERSION,

        province,

        decisionReady:
          false,

        decisionSource:
          decisionRead.source,

        route:
          null,

        strategy:
          null,

        reason:
          decisionRead.reason,

        error:
          decisionRead.error ||
          null,

        readOnly: true,
        engineExecuted: false,
        forecastGenerated: false,
        productionWrite: false,
        storageWrite: false,
        lastForecastModified: false,
        savePredictionCalled: false

      };

    }


    const decision =
      decisionRead.decision;


    /*
     * ---------------------------------------------------------
     * CLASSIFY ROUTE
     * ---------------------------------------------------------
     */

    const route =
      classifyRoute31(
        decision
      );


    const result = {

      ready:
        route.ready === true,

      passed:
        route.ready === true,

      step:
        'PRODUCTION-BRIDGE-3.1',

      version:
        VERSION,

      province,

      /*
       * DECISION SOURCE
       */

      decisionReady:
        true,

      decisionSource:
        decisionRead.source,

      decisionAction:
        getAction31(
          decision
        ),

      classification:
        getClassification31(
          decision
        ),

      model:
        getModel31(
          decision
        ),

      window:
        getWindow31(
          decision
        ),

      gateScore:
        getGateScore31(
          decision
        ),

      decisionReason:
        getReason31(
          decision
        ),

      /*
       * ROUTE
       */

      route:
        route.route,

      strategy:
        route.strategy,

      reason:
        route.reason,

      /*
       * Keep the source decision available
       * for inspection only.
       */

      decision,

      /*
       * =====================================================
       * SAFETY CONTRACT
       * =====================================================
       */

      readOnly: true,

      engineExecuted: false,

      forecastGenerated: false,

      productionWrite: false,

      storageWrite: false,

      lastForecastModified: false,

      savePredictionCalled: false

    };


    /*
     * Diagnostic RAM alias only.
     *
     * This does NOT overwrite any existing
     * Production or Decision Layer object.
     */

    window
      .LAST_FIX03D59_PRODUCTION_STRATEGY_ROUTE =
      result;


    return result;

  }


  /*
   * =========================================================
   * PUBLIC API
   * =========================================================
   */

  window
    .resolveProductionStrategy31 =
    resolveProductionStrategy31;


  window
    .FIX03D59_PRODUCTION_STRATEGY_ROUTER_LOADED =
    true;


  window
    .FIX03D59_PRODUCTION_STRATEGY_ROUTER_VERSION =
    VERSION;


  console.log(
    'FIX-03D5.9 Production Bridge Step 3.1 Strategy Router loaded — READ ONLY'
  );

})();

