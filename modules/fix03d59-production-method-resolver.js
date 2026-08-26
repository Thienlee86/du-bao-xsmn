/* =========================================================================
   FIX-03D5.9
   PRODUCTION BRIDGE — STEP 3.3
   PRODUCTION METHOD RESOLVER V1

   PURPOSE:
   - Resolve the forecast method for ONE selected province.
   - Read the canonical V2.6 Province Decision Layer.
   - Route approved Adaptive provinces to V2.6.
   - Route all other states safely to existing V2 Production.
   - Never execute a forecast engine.

   IMPORTANT:
   - READ ONLY.
   - ZERO PRODUCTION WRITE.
   - ZERO STORAGE WRITE.
   - NO LAST_FORECAST MODIFICATION.
   - NO savePrediction().
   - NO Shadow execution.
   - NO Gate execution.
   - NO Decision Layer execution.
   - FAIL CLOSED TO V2 PRODUCTION.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'PRODUCTION-METHOD-RESOLVER-V1';


  /*
   * =========================================================
   * NORMALIZATION
   * =========================================================
   */

  function normalizeSlug03D59(
    value
  ) {

    if (
      typeof value !==
      'string'
    ) {

      return null;

    }


    const slug =
      value
        .trim()
        .toLowerCase();


    if (
      !slug ||
      slug.length > 50
    ) {

      return null;

    }


    if (
      !/^[a-z0-9-]+$/.test(
        slug
      )
    ) {

      return null;

    }


    return slug;

  }


  function normalizePrize03D59(
    value
  ) {

    if (
      typeof value !==
      'string'
    ) {

      return 'db';

    }


    const prize =
      value
        .trim()
        .toLowerCase();


    return prize || 'db';

  }


  function normalizeAction03D59(
    value
  ) {

    return String(
      value == null
        ? ''
        : value
    )
      .trim()
      .toUpperCase();

  }


  /*
   * =========================================================
   * SAFE PRODUCTION RESULT
   * =========================================================
   */

  function productionFallback03D59(
    province,
    prize,
    requestedWindow,
    reason,
    decision,
    decisionSource
  ) {

    return {

      ready: true,
      passed: true,

      step:
        'PRODUCTION-BRIDGE-3.3',

      version:
        VERSION,

      province,

      prize,

      route:
        'PRODUCTION',

      strategy:
        'V2_PRODUCTION',

      engine:
        'EXISTING_V2_PRODUCTION',

      model:
        null,

      window:
        requestedWindow != null
          ? requestedWindow
          : null,

      decision:
        decision || null,

      decisionSource:
        decisionSource || null,

      adaptiveApproved:
        false,

      reason:
        reason ||
        'SAFE_PRODUCTION_FALLBACK',

      /*
       * SAFETY CONTRACT
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
   * =========================================================
   * DECISION LOOKUP
   * =========================================================
   */

  function findDecision03D59(
    province
  ) {

    /*
     * ---------------------------------------------------------
     * PRIMARY:
     * canonical reader already present in app.js.
     *
     * IMPORTANT:
     * This reader is used only as a reader.
     * We do NOT call the Decision runner here.
     * ---------------------------------------------------------
     */

    const reader =
      window
        .getProvinceDecisionV26;


    if (
      typeof reader ===
      'function'
    ) {

      try {

        const result =
          reader(
            province
          );


        if (
          result &&
          typeof result ===
            'object'
        ) {

          return {

            found: true,

            source:
              'getProvinceDecisionV26',

            decision:
              result

          };

        }

      } catch (error) {

        /*
         * Continue to RAM lookup.
         * Resolver remains fail closed.
         */

      }

    }


    /*
     * ---------------------------------------------------------
     * SECONDARY:
     * read canonical Decision Layer RAM directly.
     * ---------------------------------------------------------
     */

    const layer =
      window
        .LAST_PROVINCE_DECISION_V26 ||
      null;


    if (
      !layer ||
      typeof layer !==
        'object'
    ) {

      return {

        found: false,

        source:
          null,

        decision:
          null,

        reason:
          'DECISION_LAYER_NOT_AVAILABLE'

      };

    }


    const rows =
      Array.isArray(
        layer.decisions
      )
        ? layer.decisions
        : Array.isArray(
            layer.results
          )
          ? layer.results
          : [];


    if (!rows.length) {

      return {

        found: false,

        source:
          'LAST_PROVINCE_DECISION_V26',

        decision:
          null,

        reason:
          'DECISION_ROWS_NOT_AVAILABLE'

      };

    }


    const matched =
      rows.find(
        item => {

          if (
            !item ||
            typeof item !==
              'object'
          ) {

            return false;

          }


          const candidates = [

            item.provinceSlug,

            item.slug,

            item.provinceId,

            item.id

          ];


          return candidates.some(
            candidate =>
              normalizeSlug03D59(
                candidate
              ) ===
              province
          );

        }
      );


    if (!matched) {

      return {

        found: false,

        source:
          'LAST_PROVINCE_DECISION_V26',

        decision:
          null,

        reason:
          'PROVINCE_DECISION_NOT_FOUND'

      };

    }


    return {

      found: true,

      source:
        'LAST_PROVINCE_DECISION_V26',

      decision:
        matched

    };

  }


  /*
   * =========================================================
   * DECISION EXTRACTION
   * =========================================================
   */

  function extractDecisionAction03D59(
    decision
  ) {

    if (
      !decision ||
      typeof decision !==
        'object'
    ) {

      return '';

    }


    return normalizeAction03D59(

      decision.decision ||

      decision.action ||

      decision.recommendation ||

      decision.route

    );

  }


  function extractAdaptiveFlag03D59(
    decision
  ) {

    if (
      !decision ||
      typeof decision !==
        'object'
    ) {

      return false;

    }


    return (
      decision.useAdaptive === true ||
      decision.adaptive === true ||
      decision.adaptiveApproved === true
    );

  }


  function extractModel03D59(
    decision
  ) {

    if (
      !decision ||
      typeof decision !==
        'object'
    ) {

      return null;

    }


    const value =
      decision.model ||
      decision.bestModel ||
      decision.selectedModel ||
      null;


    if (
      typeof value !==
      'string'
    ) {

      return null;

    }


    const model =
      value.trim();


    return model || null;

  }


  function extractWindow03D59(
    decision
  ) {

    if (
      !decision ||
      typeof decision !==
        'object'
    ) {

      return null;

    }


    const value =
      decision.window ??
      decision.bestWindow ??
      decision.selectedWindow ??
      null;


    const number =
      Number(
        value
      );


    if (
      !Number.isFinite(
        number
      ) ||
      number <= 0
    ) {

      return null;

    }


    return number;

  }


  /*
   * =========================================================
   * ADAPTIVE APPROVAL
   * =========================================================
   */

  function isAdaptiveApproved03D59(
    decision
  ) {

    const action =
      extractDecisionAction03D59(
        decision
      );


    /*
     * Canonical positive approval.
     */

    if (
      action ===
      'RECOMMEND_ADAPTIVE'
    ) {

      return true;

    }


    /*
     * Compatibility with the existing Decision Layer contract.
     *
     * useAdaptive=true is accepted only as an explicit
     * positive signal from the canonical decision object.
     */

    return (
      extractAdaptiveFlag03D59(
        decision
      ) === true
    );

  }


  /*
   * =========================================================
   * MAIN RESOLVER
   * =========================================================
   */

  function resolveProductionMethod03D59(
    provinceSlug,
    prizeKey = 'db',
    requestedWindow = null
  ) {

    const province =
      normalizeSlug03D59(
        provinceSlug
      );


    const prize =
      normalizePrize03D59(
        prizeKey
      );


    /*
     * Invalid province must NOT attempt Adaptive.
     */

    if (!province) {

      return {

        ready: false,
        passed: false,

        step:
          'PRODUCTION-BRIDGE-3.3',

        version:
          VERSION,

        province:
          null,

        prize,

        route:
          'PRODUCTION',

        strategy:
          'V2_PRODUCTION',

        engine:
          'EXISTING_V2_PRODUCTION',

        model:
          null,

        window:
          requestedWindow,

        decision:
          null,

        decisionSource:
          null,

        adaptiveApproved:
          false,

        reason:
          'INVALID_PROVINCE',

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
     * Read Decision only.
     */

    const lookup =
      findDecision03D59(
        province
      );


    if (
      !lookup.found ||
      !lookup.decision
    ) {

      return productionFallback03D59(

        province,

        prize,

        requestedWindow,

        lookup.reason ||
        'DECISION_NOT_AVAILABLE',

        null,

        lookup.source

      );

    }


    const decision =
      lookup.decision;


    const action =
      extractDecisionAction03D59(
        decision
      );


    /*
     * No positive Adaptive approval:
     * existing V2 Production remains authoritative.
     */

    if (
      !isAdaptiveApproved03D59(
        decision
      )
    ) {

      return productionFallback03D59(

        province,

        prize,

        requestedWindow,

        action
          ? 'DECISION_' + action
          : 'DECISION_REQUIRES_V2',

        decision,

        lookup.source

      );

    }


    /*
     * Adaptive requires BOTH model and window.
     */

    const model =
      extractModel03D59(
        decision
      );


    const adaptiveWindow =
      extractWindow03D59(
        decision
      );


    if (!model) {

      return productionFallback03D59(

        province,

        prize,

        requestedWindow,

        'ADAPTIVE_MODEL_NOT_AVAILABLE',

        decision,

        lookup.source

      );

    }


    if (!adaptiveWindow) {

      return productionFallback03D59(

        province,

        prize,

        requestedWindow,

        'ADAPTIVE_WINDOW_NOT_AVAILABLE',

        decision,

        lookup.source

      );

    }


    /*
     * ---------------------------------------------------------
     * ADAPTIVE ROUTE APPROVED
     *
     * Still NO engine execution here.
     * ---------------------------------------------------------
     */

    return {

      ready: true,
      passed: true,

      step:
        'PRODUCTION-BRIDGE-3.3',

      version:
        VERSION,

      province,

      prize,

      route:
        'ADAPTIVE',

      strategy:
        'V26_ADAPTIVE',

      engine:
        'V26_MODEL_LAB',

      model,

      window:
        adaptiveWindow,

      requestedWindow:
        requestedWindow != null
          ? requestedWindow
          : null,

      decision,

      decisionSource:
        lookup.source,

      decisionAction:
        action ||
        'ADAPTIVE_APPROVED',

      adaptiveApproved:
        true,

      reason:
        'ADAPTIVE_ROUTE_APPROVED',

      /*
       * SAFETY CONTRACT
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
   * =========================================================
   * INSPECTOR
   * =========================================================
   */

  function inspectProductionMethodResolver03D59(
    provinceSlug
  ) {

    const province =
      normalizeSlug03D59(
        provinceSlug
      );


    const lookup =
      province
        ? findDecision03D59(
            province
          )
        : {
            found: false,
            source: null,
            decision: null,
            reason:
              'INVALID_PROVINCE'
          };


    const result =
      resolveProductionMethod03D59(
        provinceSlug,
        'db',
        null
      );


    return {

      moduleLoaded: true,

      version:
        VERSION,

      province,

      decisionFound:
        Boolean(
          lookup.found
        ),

      decisionSource:
        lookup.source ||
        null,

      decisionAction:
        lookup.decision
          ? extractDecisionAction03D59(
              lookup.decision
            )
          : null,

      adaptiveFlag:
        lookup.decision
          ? extractAdaptiveFlag03D59(
              lookup.decision
            )
          : false,

      decisionModel:
        lookup.decision
          ? extractModel03D59(
              lookup.decision
            )
          : null,

      decisionWindow:
        lookup.decision
          ? extractWindow03D59(
              lookup.decision
            )
          : null,

      resolvedRoute:
        result.route,

      resolvedStrategy:
        result.strategy,

      resolvedModel:
        result.model,

      resolvedWindow:
        result.window,

      reason:
        result.reason,

      /*
       * SAFETY
       */

      readOnly: true,

      engineExecuted: false,

      forecastGenerated: false,

      productionWrite: false,

      storageWrite: false,

      lastForecastModified: false,

      savePredictionCalled: false,

      result

    };

  }


  /*
   * =========================================================
   * PUBLIC API
   * =========================================================
   */

  window
    .resolveProductionMethod03D59 =
    resolveProductionMethod03D59;


  window
    .inspectProductionMethodResolver03D59 =
    inspectProductionMethodResolver03D59;


  window
    .FIX03D59_PRODUCTION_METHOD_RESOLVER_LOADED =
    true;


  window
    .FIX03D59_PRODUCTION_METHOD_RESOLVER_VERSION =
    VERSION;


  console.log(
    'FIX-03D5.9 Production Bridge Step 3.3 loaded — READ ONLY / ZERO WRITE'
  );

})();
