/* =========================================================================
   FIX-03D5.9
   PRODUCTION BRIDGE — STEP 2
   DECISION BOOTSTRAP V1

   PURPOSE:
   - Bootstrap the existing V2.6 Province Decision Layer when Production
     Bridge needs it and Decision RAM is not yet available.
   - Reuse the canonical Decision Layer already present in the application.
   - Never invent model/window/classification.
   - Never promote a candidate.
   - Never generate a forecast.

   SAFETY:
   - NO forecast generation.
   - NO savePrediction().
   - NO LAST_FORECAST modification.
   - NO storage write.
   - NO candidate promotion.
   - FAIL CLOSED.
   ========================================================================= */

(function () {

  'use strict';


  const VERSION =
    'PRODUCTION-DECISION-BOOTSTRAP-V1';


  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

  function normalizeProvincePDB(
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


  function getSelectedProvincePDB() {

    /*
     * Preferred application state.
     */

    const directCandidates = [

      window.SELECTED_PROVINCE,

      window.selectedProvince,

      window.CURRENT_PROVINCE,

      window.currentProvince

    ];


    for (
      const value of
      directCandidates
    ) {

      const normalized =
        normalizeProvincePDB(
          value
        );


      if (normalized) {

        return normalized;

      }

    }


    /*
     * DOM fallback.
     *
     * Reading only.
     */

    const select =
      document.getElementById(
        'provinceSelect'
      );


    if (select) {

      const normalized =
        normalizeProvincePDB(
          select.value
        );


      if (normalized) {

        return normalized;

      }

    }


    return null;

  }


  /*
   * =========================================================
   * DECISION RAM DISCOVERY
   * =========================================================
   */

  function getDecisionLayerPDB() {

    const candidates = [

      [
        'LAST_PROVINCE_DECISION_V26',
        window.LAST_PROVINCE_DECISION_V26
      ],

      [
        'LAST_V26_PROVINCE_DECISION',
        window.LAST_V26_PROVINCE_DECISION
      ],

      [
        'LAST_PROVINCE_DECISIONS_V26',
        window.LAST_PROVINCE_DECISIONS_V26
      ]

    ];


    for (
      const item of
      candidates
    ) {

      const name =
        item[0];


      const value =
        item[1];


      if (
        value &&
        typeof value ===
          'object'
      ) {

        return {

          ready: true,

          source:
            name,

          layer:
            value

        };

      }

    }


    return {

      ready: false,

      source:
        null,

      layer:
        null

    };

  }


  /*
   * =========================================================
   * PROVINCE DECISION RESOLVER
   * =========================================================
   */

  function findProvinceDecisionPDB(
    layer,
    province
  ) {

    if (
      !layer ||
      !province
    ) {

      return null;

    }


    /*
     * Canonical array form observed by the
     * existing V2.6 Decision Layer.
     */

    if (
      Array.isArray(
        layer.decisions
      )
    ) {

      const found =
        layer.decisions.find(
          item => {

            if (!item) {

              return false;

            }


            const itemProvince =
              normalizeProvincePDB(
                item.province ||
                item.provinceSlug ||
                item.slug
              );


            return (
              itemProvince ===
              province
            );

          }
        );


      if (found) {

        return found;

      }

    }


    /*
     * Defensive object-map support.
     */

    if (
      layer.decisions &&
      typeof layer.decisions ===
        'object' &&
      !Array.isArray(
        layer.decisions
      )
    ) {

      const mapped =
        layer.decisions[
          province
        ];


      if (mapped) {

        return mapped;

      }

    }


    /*
     * Some Decision Layer implementations
     * may expose province entries directly.
     */

    if (
      layer[
        province
      ] &&
      typeof layer[
        province
      ] ===
        'object'
    ) {

      return layer[
        province
      ];

    }


    return null;

  }


  /*
   * =========================================================
   * CANONICAL GETTER
   * =========================================================
   */

  function getProvinceDecisionPDB(
    province
  ) {

    if (
      typeof window
        .getProvinceDecisionV26 ===
      'function'
    ) {

      try {

        const result =
          window
            .getProvinceDecisionV26(
              province
            );


        if (
          result &&
          typeof result ===
            'object'
        ) {

          return {

            ready: true,

            source:
              'getProvinceDecisionV26',

            decision:
              result

          };

        }

      } catch (error) {

        /*
         * Continue to RAM lookup.
         * Getter failure must not break Production.
         */

      }

    }


    const discovered =
      getDecisionLayerPDB();


    if (
      !discovered.ready
    ) {

      return {

        ready: false,

        source:
          null,

        decision:
          null

      };

    }


    const decision =
      findProvinceDecisionPDB(
        discovered.layer,
        province
      );


    return {

      ready:
        Boolean(
          decision
        ),

      source:
        discovered.source,

      decision:
        decision ||
        null

    };

  }


  /*
   * =========================================================
   * EXISTING DECISION RUNNER DISCOVERY
   * =========================================================
   */

  function findDecisionRunnerPDB() {

    /*
     * IMPORTANT:
     *
     * These are existing-runtime candidates only.
     * This module does NOT implement Decision logic.
     *
     * First matching canonical function wins.
     */

    const candidates = [

      'runProvinceDecisionLayerV26',

      'buildProvinceDecisionLayerV26',

      'runProvinceDecisionV26',

      'buildProvinceDecisionV26',

      'evaluateProvinceDecisionV26'

    ];


    for (
      const name of
      candidates
    ) {

      if (
        typeof window[
          name
        ] ===
        'function'
      ) {

        return {

          ready: true,

          name,

          runner:
            window[name]

        };

      }

    }


    return {

      ready: false,

      name:
        null,

      runner:
        null

    };

  }


  /*
   * =========================================================
   * BOOTSTRAP
   * =========================================================
   */

  function bootstrapProductionDecisionPDB(
    requestedProvince
  ) {

    const province =
      normalizeProvincePDB(
        requestedProvince
      ) ||
      getSelectedProvincePDB();


    const baseResult = {

      step:
        'PRODUCTION-BRIDGE-STEP-2',

      version:
        VERSION,

      province,

      ready:
        false,

      bootstrapped:
        false,

      decisionLayerReady:
        false,

      decisionReady:
        false,

      decisionSource:
        null,

      runnerFound:
        false,

      runnerName:
        null,

      runnerExecuted:
        false,

      reason:
        null,

      decision:
        null,

      /*
       * SAFETY CONTRACT
       */

      forecastGenerated:
        false,

      writeAuthorized:
        false,

      productionWrite:
        false,

      storageWrite:
        false,

      lastForecastModified:
        false,

      savePredictionCalled:
        false,

      candidatePromoted:
        false

    };


    /*
     * ---------------------------------------------------------
     * 1. PROVINCE REQUIRED
     * ---------------------------------------------------------
     */

    if (!province) {

      baseResult.reason =
        'PROVINCE_NOT_AVAILABLE';


      window
        .LAST_FIX03D59_PRODUCTION_DECISION_BOOTSTRAP =
        baseResult;


      return baseResult;

    }


    /*
     * ---------------------------------------------------------
     * 2. DECISION ALREADY AVAILABLE?
     * ---------------------------------------------------------
     */

    const existing =
      getProvinceDecisionPDB(
        province
      );


    if (
      existing.ready
    ) {

      baseResult.ready =
        true;

      baseResult.decisionLayerReady =
        true;

      baseResult.decisionReady =
        true;

      baseResult.decisionSource =
        existing.source;

      baseResult.reason =
        'DECISION_ALREADY_AVAILABLE';

      baseResult.decision =
        existing.decision;


      window
        .LAST_FIX03D59_PRODUCTION_DECISION_BOOTSTRAP =
        baseResult;


      return baseResult;

    }


    /*
     * ---------------------------------------------------------
     * 3. FIND EXISTING CANONICAL RUNNER
     * ---------------------------------------------------------
     */

    const runnerInfo =
      findDecisionRunnerPDB();


    baseResult.runnerFound =
      runnerInfo.ready;

    baseResult.runnerName =
      runnerInfo.name;


    if (
      !runnerInfo.ready
    ) {

      baseResult.reason =
        'DECISION_RUNNER_NOT_AVAILABLE';


      window
        .LAST_FIX03D59_PRODUCTION_DECISION_BOOTSTRAP =
        baseResult;


      return baseResult;

    }


    /*
     * ---------------------------------------------------------
     * 4. EXECUTE EXISTING DECISION RUNNER ONCE
     * ---------------------------------------------------------
     */

    let returned =
      null;


    try {

      /*
       * Province is supplied for runners that accept it.
       * JavaScript safely ignores excess arguments when
       * the existing function accepts no parameters.
       */

      returned =
        runnerInfo.runner(
          province
        );


      baseResult.runnerExecuted =
        true;

    } catch (error) {

      baseResult.runnerExecuted =
        true;

      baseResult.reason =
        'DECISION_RUNNER_ERROR';

      baseResult.error =
        String(
          error &&
          error.message
            ? error.message
            : error
        );


      window
        .LAST_FIX03D59_PRODUCTION_DECISION_BOOTSTRAP =
        baseResult;


      return baseResult;

    }


    /*
     * ---------------------------------------------------------
     * 5. VERIFY CANONICAL DECISION AFTER RUN
     * ---------------------------------------------------------
     */

    const afterRun =
      getProvinceDecisionPDB(
        province
      );


    if (
      afterRun.ready
    ) {

      baseResult.ready =
        true;

      baseResult.bootstrapped =
        true;

      baseResult.decisionLayerReady =
        true;

      baseResult.decisionReady =
        true;

      baseResult.decisionSource =
        afterRun.source;

      baseResult.reason =
        'DECISION_BOOTSTRAP_READY';

      baseResult.decision =
        afterRun.decision;

      baseResult.runnerReturned =
        Boolean(
          returned
        );


      window
        .LAST_FIX03D59_PRODUCTION_DECISION_BOOTSTRAP =
        baseResult;


      return baseResult;

    }


    /*
     * ---------------------------------------------------------
     * 6. FAIL CLOSED
     * ---------------------------------------------------------
     *
     * Runner may have returned diagnostic information,
     * but unless canonical Decision can be resolved,
     * Production must NOT treat it as an approved strategy.
     */

    baseResult.reason =
      'DECISION_NOT_AVAILABLE_AFTER_BOOTSTRAP';

    baseResult.runnerReturned =
      Boolean(
        returned
      );


    window
      .LAST_FIX03D59_PRODUCTION_DECISION_BOOTSTRAP =
      baseResult;


    return baseResult;

  }


  /*
   * =========================================================
   * READ-ONLY INSPECTOR
   * =========================================================
   */

  function inspectProductionDecisionBootstrapPDB(
    requestedProvince
  ) {

    const province =
      normalizeProvincePDB(
        requestedProvince
      ) ||
      getSelectedProvincePDB();


    const decision =
      getProvinceDecisionPDB(
        province
      );


    const runner =
      findDecisionRunnerPDB();


    return {

      step:
        'PRODUCTION-BRIDGE-STEP-2-INSPECT',

      version:
        VERSION,

      province,

      decisionReady:
        decision.ready,

      decisionSource:
        decision.source,

      runnerAvailable:
        runner.ready,

      runnerName:
        runner.name,

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

      candidatePromoted:
        false

    };

  }


  /*
   * =========================================================
   * PUBLIC API
   * =========================================================
   */

  window
    .bootstrapProductionDecision03D59 =
    bootstrapProductionDecisionPDB;


  window
    .inspectProductionDecisionBootstrap03D59 =
    inspectProductionDecisionBootstrapPDB;


  window
    .FIX03D59_PRODUCTION_DECISION_BOOTSTRAP_LOADED =
    true;


  window
    .FIX03D59_PRODUCTION_DECISION_BOOTSTRAP_VERSION =
    VERSION;


  console.log(
    'FIX-03D5.9 Production Decision Bootstrap V1 loaded — FAIL CLOSED'
  );

})();
